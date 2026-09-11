import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { offlineDb } from '../services/db';
import { api } from '../services/api';

interface SyncContextType {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncNow: () => Promise<number>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await offlineDb.offlineLots.where('syncStatus').equals('PENDING').count();
      setPendingCount(count);
    } catch (e) {
      console.warn('Failed to count pending offline lots:', e);
    }
  }, []);

  const syncNow = useCallback(async (): Promise<number> => {
    if (!navigator.onLine || isSyncing) return 0;

    try {
      setIsSyncing(true);
      const pendingLots = await offlineDb.offlineLots.where('syncStatus').equals('PENDING').toArray();

      if (pendingLots.length === 0) {
        setIsSyncing(false);
        return 0;
      }

      console.log(`📡 Attempting to batch sync ${pendingLots.length} offline lots to server...`);
      const response = await api.syncOfflineBatch(pendingLots);

      if (response.success) {
        // Mark as synced in Dexie
        for (const lot of pendingLots) {
          await offlineDb.offlineLots.update(lot.clientLotId, { syncStatus: 'SYNCED' });
        }
        await refreshPendingCount();
        setLastSyncTime(new Date());
        console.log(`✅ Successfully synced ${response.syncedCount} lots.`);
        return response.syncedCount;
      }
    } catch (err) {
      console.warn('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
    return 0;
  }, [isSyncing, refreshPendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    refreshPendingCount();

    // Periodic check every 15s
    const interval = setInterval(() => {
      refreshPendingCount();
      if (navigator.onLine && pendingCount > 0) {
        syncNow();
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [pendingCount, refreshPendingCount, syncNow]);

  return (
    <SyncContext.Provider value={{ isOnline, pendingCount, isSyncing, lastSyncTime, syncNow }}>
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
