import Dexie, { Table } from 'dexie';
import { OfflineLotItem, PriceRecord, RecyclerProfile } from '../types';

export class KabadiwalaOfflineDB extends Dexie {
  offlineLots!: Table<OfflineLotItem, string>;
  cachedPrices!: Table<PriceRecord, string>;
  cachedRecyclers!: Table<RecyclerProfile, string>;

  constructor() {
    super('KabadiwalaConnectOfflineDB');
    this.version(1).stores({
      offlineLots: 'clientLotId, materialCategory, createdAt, syncStatus',
      cachedPrices: 'id, materialCategory, district',
      cachedRecyclers: 'id, facilityName, district'
    });
  }
}

export const offlineDb = new KabadiwalaOfflineDB();
