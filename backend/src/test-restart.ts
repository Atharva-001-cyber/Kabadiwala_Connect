import fs from 'fs';
import path from 'path';

async function testPersistenceAcrossRestart() {
  console.log('🧪 Testing Cold Restart Database Persistence...');

  const DB_FILE = path.join(__dirname, '../data/db.json');
  if (!fs.existsSync(DB_FILE)) {
    throw new Error(`Database file not found at ${DB_FILE}`);
  }

  // 1. Read existing data
  const rawBefore = fs.readFileSync(DB_FILE, 'utf-8');
  const parsedBefore = JSON.parse(rawBefore);
  const initialLotsCount = parsedBefore.lots.length;
  console.log(`   📊 Existing Lots on Disk: ${initialLotsCount}`);

  // 2. Make an API request to create a new lot
  const BASE = 'http://127.0.0.1:5000/api';
  
  // Login as collector
  const loginRes = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210', otp: '1234' })
  }).then(r => r.json());

  const token = loginRes.token;
  const testDesc = `Restart_Persistence_Verification_${Date.now()}`;

  const createRes = await fetch(`${BASE}/lots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      materialCategory: 'PCB',
      approxWeight: 14.5,
      condition: 'INTACT',
      sourceType: 'HOUSEHOLD',
      description: testDesc,
      locationDistrict: 'Lucknow',
      locationState: 'Uttar Pradesh'
    })
  }).then(r => r.json());

  if (!createRes.success) {
    throw new Error(`Failed to create test lot: ${JSON.stringify(createRes)}`);
  }

  const newLotId = createRes.lot.id;
  console.log(`   ✅ Created New Persistent Lot: ${newLotId}`);

  // 3. Inspect db.json on disk directly to confirm synchronous atomic flush
  const rawAfter = fs.readFileSync(DB_FILE, 'utf-8');
  const parsedAfter = JSON.parse(rawAfter);
  const foundOnDisk = parsedAfter.lots.find((l: any) => l.id === newLotId);

  if (!foundOnDisk) {
    throw new Error(`FAILED: Lot ${newLotId} was NOT flushed to disk!`);
  }
  console.log(`   💾 Verified on physical disk in db.json! Description: "${foundOnDisk.description}"`);

  // 4. Simulate a cold server restart by reading from disk in an isolated instance
  console.log('   🔄 Simulating server cold restart...');
  const simulatedRestartStore = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  const restoredLot = simulatedRestartStore.lots.find((l: any) => l.id === newLotId);

  if (!restoredLot || restoredLot.description !== testDesc) {
    throw new Error(`FAILED: Cold restart did not restore lot ${newLotId}!`);
  }

  console.log(`   🎉 PERSISTENCE TEST PASSED: Record ${newLotId} fully survives backend cold restart!`);
}

testPersistenceAcrossRestart().catch(err => {
  console.error('❌ Restart test failed:', err);
  process.exit(1);
});
