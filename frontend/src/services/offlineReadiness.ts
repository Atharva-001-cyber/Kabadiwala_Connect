import { useCallback, useEffect, useState } from 'react';
import { offlineRegistrationError, registerOfflineWorker } from './offlineRegistration';

type SetupStatus = {
  ready: boolean; appReady: boolean; aiReady: boolean; completed: number; total: number;
  missing: string[]; failures: Record<string, string>; downloading: boolean;
  state: string; updateWaiting: boolean;
};
const initial: SetupStatus = { ready: false, appReady: false, aiReady: false, completed: 0,
  total: 0, missing: [], failures: {}, downloading: false, state: 'checking', updateWaiting: false };

function ask(worker: ServiceWorker, type: string): Promise<Partial<SetupStatus>> {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => { channel.port1.close(); reject(new Error('WORKER_TIMEOUT')); }, 5000);
    channel.port1.onmessage = event => { clearTimeout(timer); channel.port1.close(); resolve(event.data); };
    try { worker.postMessage({ type }, [channel.port2]); }
    catch (error) { clearTimeout(timer); channel.port1.close(); reject(error); }
  });
}

export function useOfflineReadiness() {
  const [status, setStatus] = useState(initial);
  const [storageWarning, setStorageWarning] = useState(false);
  const [revision, setRevision] = useState(0);
  const [retrying, setRetrying] = useState(false);
  useEffect(() => {
    let alive = true, checking = false;
    const check = async () => {
      if (checking) return;
      checking = true;
      let next = { ...initial };
      try {
        if (!import.meta.env.PROD) next.state = 'development';
        else if (!window.isSecureContext || !('serviceWorker' in navigator)) next.state = 'unsupported';
        else {
          const registration = await navigator.serviceWorker.getRegistration();
          const worker = navigator.serviceWorker.controller || registration?.active || registration?.installing || registration?.waiting;
          if (!worker) {
            next.state = offlineRegistrationError ? 'registration_failed' : 'starting';
            if (offlineRegistrationError) next.failures = { setup: offlineRegistrationError };
          } else {
            next = { ...next, ...await ask(worker, 'OFFLINE_STATUS') };
            next.updateWaiting = !!registration?.waiting;
            next.state = next.downloading || worker.state === 'installing' ? 'downloading' :
              next.ready ? 'ready' : next.total === 0 ? 'legacy' : 'incomplete';
          }
        }
      } catch { next.state = 'worker_timeout'; }
      if (alive) setStatus(next);
      try {
        const estimate = await navigator.storage?.estimate();
        if (alive) setStorageWarning(!!estimate?.quota && (estimate.usage || 0) / estimate.quota > 0.85);
      } catch { /* Storage estimates are optional. */ }
      checking = false;
    };
    void check();
    const interval = window.setInterval(check, 3000);
    navigator.serviceWorker?.addEventListener('controllerchange', check);
    window.addEventListener('offline', check);
    window.addEventListener('online', check);
    return () => { alive = false; clearInterval(interval); navigator.serviceWorker?.removeEventListener('controllerchange', check); window.removeEventListener('offline', check); window.removeEventListener('online', check); };
  }, [revision]);
  const retry = useCallback(async () => {
    if (retrying || !import.meta.env.PROD || !navigator.onLine || !('serviceWorker' in navigator)) return;
    setRetrying(true);
    try {
      const registration = await registerOfflineWorker();
      const worker = navigator.serviceWorker.controller || registration.active;
      if (worker && status.total > 0) await ask(worker, 'OFFLINE_RETRY');
      else await registration.update();
    } catch { setStatus(s => ({ ...s, state: 'worker_timeout' })); }
    finally { setRetrying(false); setRevision(r => r + 1); }
  }, [retrying, status.total]);
  return { ...status, storageWarning, retry, retrying };
}
