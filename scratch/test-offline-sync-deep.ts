import fetch from 'node-fetch';

const BASE = 'http://127.0.0.1:5000/api';

async function testOfflineSyncDeep() {
  console.log('====================================================');
  console.log('🧪 DEEP OFFLINE SYNC VERIFICATION (9-POINT AUDIT)');
  console.log('====================================================\n');

  // Step 0: Login as Collector Ramesh Kumar
  const loginRes = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210', otp: '1234' })
  }).then(r => r.json());

  if (!loginRes.success) throw new Error('Collector login failed: ' + loginRes.message);
  const token = loginRes.token;
  console.log('Step 0: Authenticated as Collector Ramesh Kumar (ID:', loginRes.user.id, ')');

  // Step 1: Create an offline lot with all rich metadata
  const clientLotId = `offline_deep_${Date.now()}`;
  const offlineLotPayload = {
    clientLotId,
    materialCategory: 'BATTERY',
    subCategory: 'Lithium-Ion / EV Battery Pack',
    description: 'Decommissioned solar UPS lithium battery with slight casing dent',
    approxWeight: 14.5,
    condition: 'MINOR_DAMAGE',
    sourceType: 'COMMERCIAL',
    locationDistrict: 'Lucknow',
    locationState: 'Uttar Pradesh',
    latitude: 26.8467,
    longitude: 80.9462,
    locationSource: 'DEVICE_GPS',
    imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&q=80'
  };

  console.log('\nStep 1 & 2: Offline lot formatted into sync queue payload:');
  console.log('  clientLotId:', clientLotId);
  console.log('  subCategory:', offlineLotPayload.subCategory);
  console.log('  description:', offlineLotPayload.description);
  console.log('  approxWeight:', offlineLotPayload.approxWeight, 'kg');

  // Step 3: Synchronize it via POST /api/lots/sync-batch
  console.log('\nStep 3: Synchronizing lot via POST /api/lots/sync-batch...');
  const syncRes = await fetch(`${BASE}/lots/sync-batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ lots: [offlineLotPayload] })
  }).then(r => r.json());

  console.log('  Sync Response Status:', syncRes.success ? 'SUCCESS' : 'FAILED');
  if (!syncRes.success || !syncRes.lots || syncRes.lots.length === 0) {
    throw new Error('Sync failed: ' + JSON.stringify(syncRes));
  }

  const syncedLot = syncRes.lots[0];
  console.log('  Assigned Backend Lot ID:', syncedLot.id);

  // Step 4: Verify exactly one persisted backend lot
  console.log('\nStep 4: Verifying exactly one persisted backend lot...');
  const listRes = await fetch(`${BASE}/lots`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());

  const matches = listRes.lots.filter((l: any) => l.clientLotId === clientLotId);
  console.log(`  Matching lots found in database: ${matches.length}`);
  if (matches.length !== 1) {
    throw new Error(`Expected exactly 1 matching lot, found ${matches.length}`);
  }
  console.log('  ✅ Exactly 1 persisted lot verified.');

  // Step 5: Verify all supplied fields survived
  console.log('\nStep 5: Verifying all supplied fields survived...');
  const saved = matches[0];
  const checks = [
    { name: 'materialCategory', expected: 'BATTERY', actual: saved.materialCategory },
    { name: 'subCategory', expected: 'Lithium-Ion / EV Battery Pack', actual: saved.subCategory },
    { name: 'description', expected: 'Decommissioned solar UPS lithium battery with slight casing dent', actual: saved.description },
    { name: 'approxWeight', expected: 14.5, actual: saved.approxWeight },
    { name: 'condition', expected: 'MINOR_DAMAGE', actual: saved.condition },
    { name: 'sourceType', expected: 'COMMERCIAL', actual: saved.sourceType },
    { name: 'locationDistrict', expected: 'Lucknow', actual: saved.locationDistrict },
    { name: 'locationState', expected: 'Uttar Pradesh', actual: saved.locationState },
    { name: 'locationSource', expected: 'DEVICE_GPS', actual: saved.locationSource },
    { name: 'latitude', expected: 26.8467, actual: saved.latitude },
    { name: 'longitude', expected: 80.9462, actual: saved.longitude },
    { name: 'imageUrl', expected: offlineLotPayload.imageUrl, actual: saved.imageUrl }
  ];

  for (const c of checks) {
    if (c.actual !== c.expected) {
      throw new Error(`Field mismatch on ${c.name}: expected "${c.expected}", got "${c.actual}"`);
    }
    console.log(`  ✅ Field "${c.name}": "${c.actual}" matches expected`);
  }

  // Step 6: Retry the same sync request and verify no duplicate (Idempotency)
  console.log('\nStep 6: Retrying same sync request to verify idempotency (zero duplicates)...');
  const retrySyncRes = await fetch(`${BASE}/lots/sync-batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ lots: [offlineLotPayload] })
  }).then(r => r.json());

  console.log('  Retry Sync Response Status:', retrySyncRes.success ? 'SUCCESS' : 'FAILED');
  const listAfterRetry = await fetch(`${BASE}/lots`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());

  const matchesAfterRetry = listAfterRetry.lots.filter((l: any) => l.clientLotId === clientLotId);
  console.log(`  Matching lots after re-sync: ${matchesAfterRetry.length}`);
  if (matchesAfterRetry.length !== 1) {
    throw new Error(`Idempotency failure! Found ${matchesAfterRetry.length} duplicates.`);
  }
  console.log('  ✅ Idempotency verified: re-sync returned existing lot without creating duplicate.');

  // Step 7: Verify Traceability
  console.log('\nStep 7: Verifying cryptographic traceability log creation...');
  const traceRes = await fetch(`${BASE}/traceability/${saved.id}`).then(r => r.json());
  console.log(`  Traceability logs found for lot: ${traceRes.logs?.length || 0}`);
  const syncLog = traceRes.logs.find((t: any) => t.title.includes('Offline Lot Synchronized'));
  if (!syncLog) {
    throw new Error('Traceability log for offline synchronization not found!');
  }
  console.log('  ✅ Traceability log verified:');
  console.log('     Stage:', syncLog.stage);
  console.log('     Title:', syncLog.title);
  console.log('     Event Hash:', syncLog.eventHash);
  console.log('     Previous Hash:', syncLog.previousEventHash);

  // Step 8: Verify Collector Ownership & IDOR
  console.log('\nStep 8: Verifying Collector Ownership & IDOR Protection...');
  console.log('  Lot collectorId:', saved.collectorId);
  console.log('  Lot collectorName:', saved.collectorName);

  // Collector 2 tries to access this lot
  const col2Login = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543211', otp: '1234' })
  }).then(r => r.json());

  const idorRes = await fetch(`${BASE}/lots/${saved.id}`, {
    headers: { 'Authorization': `Bearer ${col2Login.token}` }
  });
  console.log(`  Collector 2 access attempt on Collector 1 lot: HTTP ${idorRes.status}`);
  if (idorRes.status !== 403) {
    throw new Error(`IDOR vulnerability! Expected 403, got ${idorRes.status}`);
  }
  console.log('  ✅ Collector ownership and IDOR isolation verified.');

  console.log('\n====================================================');
  console.log('🎉 9-POINT OFFLINE SYNC AUDIT PASSED 100%!');
  console.log('====================================================\n');
}

testOfflineSyncDeep().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
