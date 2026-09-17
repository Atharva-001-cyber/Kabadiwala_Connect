import { supabase } from './supabase';
import { invalidateCache } from './api';

type SyncCallback = (event: { table: string; eventType: string; record: any }) => void;

class RealtimeSyncService {
  private channel: any = null;
  private listeners: Set<SyncCallback> = new Set();
  private isInitialized = false;

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    try {
      this.channel = supabase
        .channel('kabadiwala_realtime_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'lots' },
          (payload: any) => {
            invalidateCache('lots');
            invalidateCache('lot_detail_');
            this.notifyListeners({ table: 'lots', eventType: payload.eventType, record: payload.new || payload.old });
            window.dispatchEvent(new CustomEvent('kb:sync', { detail: { table: 'lots', payload } }));
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'offers' },
          (payload: any) => {
            invalidateCache('offers');
            invalidateCache('lots');
            invalidateCache('lot_detail_');
            this.notifyListeners({ table: 'offers', eventType: payload.eventType, record: payload.new || payload.old });
            window.dispatchEvent(new CustomEvent('kb:sync', { detail: { table: 'offers', payload } }));
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'pickups' },
          (payload: any) => {
            invalidateCache('pickups');
            invalidateCache('lots');
            invalidateCache('lot_detail_');
            this.notifyListeners({ table: 'pickups', eventType: payload.eventType, record: payload.new || payload.old });
            window.dispatchEvent(new CustomEvent('kb:sync', { detail: { table: 'pickups', payload } }));
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'handovers' },
          (payload: any) => {
            invalidateCache('lots');
            invalidateCache('ledger');
            invalidateCache('lot_detail_');
            this.notifyListeners({ table: 'handovers', eventType: payload.eventType, record: payload.new || payload.old });
            window.dispatchEvent(new CustomEvent('kb:sync', { detail: { table: 'handovers', payload } }));
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'traceability_logs' },
          (payload: any) => {
            invalidateCache('trace_');
            invalidateCache('lot_detail_');
            this.notifyListeners({ table: 'traceability_logs', eventType: payload.eventType, record: payload.new || payload.old });
            window.dispatchEvent(new CustomEvent('kb:sync', { detail: { table: 'traceability_logs', payload } }));
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'anomalies' },
          (payload: any) => {
            invalidateCache('anomalies');
            invalidateCache('admin_kpis');
            invalidateCache('dataset_counts');
            this.notifyListeners({ table: 'anomalies', eventType: payload.eventType, record: payload.new || payload.old });
            window.dispatchEvent(new CustomEvent('kb:sync', { detail: { table: 'anomalies', payload } }));
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'disputes' },
          (payload: any) => {
            invalidateCache('disputes');
            invalidateCache('admin_kpis');
            invalidateCache('dataset_counts');
            this.notifyListeners({ table: 'disputes', eventType: payload.eventType, record: payload.new || payload.old });
            window.dispatchEvent(new CustomEvent('kb:sync', { detail: { table: 'disputes', payload } }));
          }
        )
        .subscribe((status: string, err: any) => {
          if (status === 'SUBSCRIBED') {
            console.log('⚡ [REALTIME SYNC] Connected to Supabase Realtime channel.');
          } else if (err) {
            console.warn('⚠️ [REALTIME SYNC] Realtime subscription status:', status, err);
          }
        });
    } catch (err) {
      console.warn('Failed to initialize Supabase Realtime:', err);
    }
  }

  private notifyListeners(event: { table: string; eventType: string; record: any }) {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (e) {
        console.warn('Error in realtime sync callback:', e);
      }
    });
  }

  public subscribe(callback: SyncCallback): () => void {
    this.init();
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }
}

export const realtimeSync = new RealtimeSyncService();

/**
 * Custom React hook helper for auto-refresh on real-time database changes.
 */
export function onPlatformSync(callback: () => void): () => void {
  const handler = () => {
    callback();
  };

  const unsubscribe = realtimeSync.subscribe(() => {
    handler();
  });

  window.addEventListener('kb:sync', handler);

  return () => {
    unsubscribe();
    window.removeEventListener('kb:sync', handler);
  };
}
