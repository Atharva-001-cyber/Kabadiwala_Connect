import { offlineDb } from './db';
import { Lot, OfflineLotItem } from '../types';

export function activeCollectorId(): string | undefined {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const profile = JSON.parse(localStorage.getItem('collectorProfile') || 'null');
    return user?.role === 'COLLECTOR' ? profile?.id : undefined;
  } catch { return undefined; }
}

export function retryableSyncError(error: any): boolean {
  if (error?.name === 'AbortError' || error?.name === 'TimeoutError') return true;
  if (error?.code) return false;
  return !navigator.onLine || /fetch|network|timeout|timed out|aborted/i.test(error?.message || '');
}

export const queueChanged = () => window.dispatchEvent(new Event('offline-lots-changed'));

// The durable record is written BEFORE attempting any network request.
export async function saveLotDraft(input: any): Promise<OfflineLotItem> {
  const collectorId = activeCollectorId();
  if (!collectorId || (input.collectorId && input.collectorId !== collectorId)) throw new Error('Sign in as the collector before saving a lot.');
  const weight = Number(input.approxWeight);
  if (!Number.isFinite(weight) || weight <= 0) throw new Error('Enter a valid positive weight.');
  const clientLotId = input.clientLotId || `EW-${crypto.randomUUID()}`;
  const existing = await offlineDb.offlineLots.get(clientLotId);
  if (existing) {
    if (existing.collectorId !== collectorId) throw new Error('Draft belongs to a different account.');
    return existing;
  }
  const profile = JSON.parse(localStorage.getItem('collectorProfile') || '{}');
  const min = Math.round(weight * 20 * 0.85);
  const max = Math.round(weight * 80 * 1.15);
  const payload = { ...input, clientLotId, collectorId, collectorName: profile.name, collectorPhone: profile.phone };
  const draft: OfflineLotItem = {
    ...payload, approxWeight: weight, createdAt: new Date().toISOString(),
    estimatedValueMin: min, estimatedValueMax: max, estimatedValueAvg: Math.round((min + max) / 2),
    syncStatus: 'PENDING', payload
  };
  // add(), not put(): never overwrite an in-flight draft in another tab.
  try {
    await offlineDb.offlineLots.add(draft);
  } catch (error: any) {
    if (error?.name === 'QuotaExceededError') throw new Error('Device storage is full. Lot was NOT saved. Free space and try again.');
    throw error;
  }
  queueChanged();
  return draft;
}

export function pendingLotResult(draft: OfflineLotItem) {
  const p = draft.payload || {};
  return {
    success: true, persisted: false,
    message: draft.lastError || 'Saved on this device; server upload pending.',
    lot: { ...p, ...draft, id: draft.clientLotId, collectorId: draft.collectorId,
      collectorName: p.collectorName || '', collectorPhone: p.collectorPhone || '',
      status: 'CREATED', dataSource: 'LIVE', updatedAt: draft.createdAt } as Lot,
    valuation: { min: draft.estimatedValueMin, max: draft.estimatedValueMax, avg: draft.estimatedValueAvg }
  };
}

const inFlight = new Map<string, Promise<any>>();
export async function uploadLotDraft(draft: OfflineLotItem, persist: (payload: any) => Promise<any>) {
  const perform = async () => {
    if (!draft.collectorId || activeCollectorId() !== draft.collectorId || !draft.payload || !navigator.onLine) return pendingLotResult(draft);
    try {
      const result = await persist({ ...draft.payload, clientLotId: draft.clientLotId, collectorId: draft.collectorId, createdAt: draft.createdAt });
      if (!result.success || !result.lot) throw new Error('Server did not confirm the lot.');
      await offlineDb.offlineLots.update(draft.clientLotId, { syncStatus: 'SYNCED', lastError: undefined });
      queueChanged();
      return { ...result, persisted: true };
    } catch (error: any) {
      const lastError = retryableSyncError(error)
        ? 'Saved on device. Connection failed; upload will retry.'
        : 'Saved on device. Server rejected upload; retry or contact support. No data was deleted.';
      const syncStatus = retryableSyncError(error) ? 'PENDING' : 'FAILED';
      await offlineDb.offlineLots.update(draft.clientLotId, { syncStatus, lastError });
      queueChanged();
      return pendingLotResult({ ...draft, syncStatus, lastError });
    }
  };
  if (!inFlight.has(draft.clientLotId)) {
    const task = navigator.locks
      ? navigator.locks.request(`offline-lot:${draft.clientLotId}`, perform)
      : perform();
    inFlight.set(draft.clientLotId, task.finally(() => inFlight.delete(draft.clientLotId)));
  }
  return inFlight.get(draft.clientLotId)!;
}
