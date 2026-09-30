import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { activeCollectorId } from '../services/offlineLotQueue';
import { offlineDb } from '../services/db';
import { api } from '../services/api';

interface SyncContextType {
  isOnline: boolean;
  pendingCount: number;
  failedCount: number;
  legacyCount: number;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncNow: () => Promise<number>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { collectorProfile, role } = useAuth();
  const owner = role === 'COLLECTOR' ? collectorProfile?.id : undefined;
  const busy = useRef(false);
  const [failedCount, setFailedCount] = useState(0);
  const [legacyCount, setLegacyCount] = useState(0);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const refreshPendingCount = useCallback(async () => {
    try {
      const rows = await offlineDb.offlineLots.toArray();
      if (activeCollectorId() !== owner) return;
      const own = rows.filter(r => !!owner && r.collectorId === owner && r.syncStatus !== 'SYNCED');
      setPendingCount(own.length);
      setFailedCount(own.filter(r => r.syncStatus === 'FAILED').length);
      setLegacyCount(owner ? rows.filter(r => !r.collectorId && r.syncStatus !== 'SYNCED').length : 0);
    } catch (e) {
      console.warn('Failed to count pending offline lots:', e);
    }
  }, [owner]);

  const syncNow = useCallback(async (manual = true): Promise<number> => {
    if (!owner || activeCollectorId() !== owner || !navigator.onLine || busy.current) return 0;
    busy.current = true;

    try {
      setIsSyncing(true);
      const rows = await offlineDb.offlineLots.toArray();
      const pendingLots = rows.filter(r => r.collectorId === owner && (r.syncStatus === 'PENDING' || (manual && r.syncStatus === 'FAILED')));

      if (pendingLots.length === 0) {
        setIsSyncing(false);
        return 0;
      }

      console.log(`📡 Attempting to batch sync ${pendingLots.length} offline lots to server...`);
      const response = await api.syncOfflineBatch(pendingLots);

      if (response.success) {
        // Only uploadLotDraft can mark an individually confirmed save SYNCED.
        await refreshPendingCount();
        if (response.syncedCount > 0 && activeCollectorId() === owner) setLastSyncTime(new Date());
        console.log(`✅ Successfully synced ${response.syncedCount} lots.`);
        return response.syncedCount;
      }
    } catch (err) {
      console.warn('Sync failed:', err);
    } finally {
      busy.current = false;
      setIsSyncing(false);
      await refreshPendingCount();
    }
    return 0;
  }, [owner, refreshPendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncNow(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    refreshPendingCount();
    setLastSyncTime(null);
    syncNow(false);
    window.addEventListener('offline-lots-changed', refreshPendingCount);

    // Periodic check every 15s
    const interval = setInterval(() => {
      refreshPendingCount();
      if (navigator.onLine) {
        syncNow(false);
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-lots-changed', refreshPendingCount);
      clearInterval(interval);
    };
  }, [refreshPendingCount, syncNow]);

  return (
    <SyncContext.Provider value={{ isOnline, pendingCount, failedCount, legacyCount, isSyncing, lastSyncTime, syncNow }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
