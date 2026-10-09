import { useEffect, useState } from 'react';

export function useOfflineReadiness() {
  const [ready, setReady] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const estimate = await navigator.storage?.estimate();
        if (alive) setStorageWarning(!!estimate?.quota && (estimate.usage || 0) / estimate.quota > 0.85);
      } catch { /* Storage estimates are optional. */ }
      const worker = navigator.serviceWorker?.controller;
      if (!worker || !import.meta.env.PROD) { if (alive) setReady(false); return; }
      const channel = new MessageChannel();
      const timer = window.setTimeout(() => { channel.port1.close(); if (alive) setReady(false); }, 5000);
      channel.port1.onmessage = event => {
        clearTimeout(timer); channel.port1.close();
        if (alive) setReady(event.data?.ready === true);
      };
      worker.postMessage({ type: 'OFFLINE_STATUS' }, [channel.port2]);
    };
    void check();
    const interval = window.setInterval(check, 15000);
    navigator.serviceWorker?.addEventListener('controllerchange', check);
    window.addEventListener('offline', check);
    return () => { alive = false; clearInterval(interval); navigator.serviceWorker?.removeEventListener('controllerchange', check); window.removeEventListener('offline', check); };
  }, []);
  return { ready, storageWarning };
}
