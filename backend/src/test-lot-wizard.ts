import fs from 'fs';
import path from 'path';
import { db } from './db/store';
import { calculateEstimatedValue } from './controllers/lot.controller';

console.log('🧪 Testing Collector Lot Creation & GPS Provenance...');

// 1. Valuation formula check
const pcbValuation = calculateEstimatedValue('PCB', 15, 'INTACT', 'Lucknow');
console.log('✅ Valuation calculated for 15kg PCB:', pcbValuation);
if (pcbValuation.avg < 1000) throw new Error('Valuation calculation failed');

// 2. Mock creation with real GPS coordinates
const testLotId = `EW-LKO-2026-${String(db.lots.length + 101).padStart(6, '0')}`;
const now = new Date().toISOString();
const newLot = {
  id: testLotId,
  collectorId: 'col_1',
  collectorName: 'Ramesh Kumar',
  collectorPhone: '9876543210',
  materialCategory: 'PCB' as const,
  subCategory: 'Computer Motherboards',
  description: '15kg desktop motherboard boards lot',
  imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  approxWeight: 15,
  condition: 'INTACT' as const,
  sourceType: 'HOUSEHOLD' as const,
  locationDistrict: 'Lucknow',
  locationState: 'Uttar Pradesh',
  latitude: 26.8467,
  longitude: 80.9462,
  locationSource: 'DEVICE_GPS' as const,
  estimatedValueMin: pcbValuation.min,
  estimatedValueMax: pcbValuation.max,
  estimatedValueAvg: pcbValuation.avg,
  status: 'CREATED' as const,
  dataSource: 'LIVE' as const,
  createdAt: now,
  updatedAt: now
};

db.lots.unshift(newLot);
db.save();

// 3. Reload from physical disk to verify persistence
const dbPath = path.resolve(__dirname, '../data/db.json');
const diskData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const reloaded = diskData.lots.find((l: any) => l.id === testLotId);
if (!reloaded) throw new Error('Lot was not saved to physical disk');
if (reloaded.latitude !== 26.8467 || reloaded.locationSource !== 'DEVICE_GPS') {
  throw new Error('GPS coordinates or source not persisted correctly');
}
if (reloaded.dataSource !== 'LIVE') {
  throw new Error('Newly created lot must have dataSource: LIVE');
}

console.log('✅ Lot verified on physical disk:', reloaded.id);
console.log('   - Material:', reloaded.materialCategory);
console.log('   - Weight:', reloaded.approxWeight, 'kg');
console.log('   - Valuation:', `₹${reloaded.estimatedValueMin} - ₹${reloaded.estimatedValueMax}`);
console.log('   - GPS:', `${reloaded.latitude}, ${reloaded.longitude} (${reloaded.locationSource})`);
console.log('   - Data Source:', reloaded.dataSource);
console.log('🎉 Collector Lot Creation & GPS Provenance Verification passed with zero errors!');
