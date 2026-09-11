import fs from 'fs';
import path from 'path';

const BASE = 'http://127.0.0.1:5000/api';

async function runPhase5Audit() {
  console.log('================================================================');
  console.log('🧪 SIH 2026 PS #229 PHASE 5: FULL-STACK INTEGRATION & RELIABILITY');
  console.log('================================================================\n');

  // STEP 1: TRUTHFUL OTP GENERATION & AUTHENTICATION
  console.log('1️⃣ Auditing Truthful OTP & Multi-Role Authentication...');
  const otpRes = await fetch(`${BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210' })
  }).then(r => r.json());

  if (otpRes.deliveryMode !== 'LOCAL_SIMULATOR' || !otpRes.smsGatewayNotice) {
    throw new Error('Truthful SMS notice check failed: deliveryMode or smsGatewayNotice missing');
  }
  console.log(`   ✅ Truthful SMS Delivery Mode: ${otpRes.deliveryMode}`);
  console.log(`   ✅ SMS Gateway Notice: "${otpRes.smsGatewayNotice.slice(0, 60)}..."`);

  // Logins
  const col1Res = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210', otp: '1234' })
  }).then(r => r.json());
  const tokenCol1 = col1Res.token;
  const col1Profile = col1Res.collectorProfile;

  const col2Res = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543211', otp: '1234', name: 'Kabadiwala Suresh' })
  }).then(r => r.json());
  const tokenCol2 = col2Res.token;
  const col2Profile = col2Res.collectorProfile;

  const adminRes = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999999999', otp: '1234', selectedRole: 'ADMIN' })
  }).then(r => r.json());
  const tokenAdmin = adminRes.token;

  console.log(`   ✅ Collector 1 Authenticated: ${col1Profile.name} (${col1Profile.id})`);
  console.log(`   ✅ Collector 2 Authenticated: ${col2Profile.name} (${col2Profile.id})`);
  console.log(`   ✅ Admin Authenticated: ${adminRes.user.name}`);

  // STEP 2: IDOR & ACCESS CONTROL HARDENING
  console.log('\n2️⃣ Auditing Security, IDOR Protection & Access Control...');
  
  // Test A: Collector 1 attempts to view Collector 2's financial ledger
  const idorLedgerRes = await fetch(`${BASE}/payments/collector/${col2Profile.id}`, {
    headers: { 'Authorization': `Bearer ${tokenCol1}` }
  });
  if (idorLedgerRes.status !== 403) {
    throw new Error(`IDOR vulnerability: Collector 1 was able to access Collector 2 ledger! Status: ${idorLedgerRes.status}`);
  }
  console.log('   ✅ IDOR Protected: Cross-collector financial ledger access returned 403 Forbidden.');

  // Test B: Collector 1 attempts to override query to get Collector 2's lots
  const idorLotsRes = await fetch(`${BASE}/lots?collectorId=${col2Profile.id}`, {
    headers: { 'Authorization': `Bearer ${tokenCol1}` }
  }).then(r => r.json());
  const leakedLots = idorLotsRes.lots.filter((l: any) => l.collectorId === col2Profile.id);
  if (leakedLots.length > 0) {
    throw new Error('IDOR vulnerability: Collector 1 received Collector 2 lots via query parameter override!');
  }
  console.log('   ✅ IDOR Protected: Collector 1 query strictly scoped to own lots (0 foreign lots returned).');

  // STEP 3: OFFLINE-FIRST BATCH SYNC & IDEMPOTENCY
  console.log('\n3️⃣ Testing Offline-First Lot Batch Sync & Idempotency...');
  const testClientLotId = `offline_lot_${Date.now()}`;
  const syncPayload = {
    lots: [
      {
        clientLotId: testClientLotId,
        materialCategory: 'BATTERY',
        subCategory: 'Lithium Ion Packs',
        description: 'Collected from suburban workshop while offline',
        approxWeight: 14.5,
        condition: 'INTACT',
        locationDistrict: 'Lucknow',
        locationState: 'Uttar Pradesh',
        createdAt: new Date().toISOString()
      }
    ]
  };

  const syncRes1 = await fetch(`${BASE}/lots/sync-batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenCol1}`
    },
    body: JSON.stringify(syncPayload)
  }).then(r => r.json());

  if (!syncRes1.success || syncRes1.syncedCount !== 1) {
    throw new Error('Batch sync failed');
  }
  const syncedLot = syncRes1.lots[0];
  if (!syncedLot.handoverOtp || syncedLot.handoverOtp.length !== 4) {
    throw new Error('Batch synced lot missing 4-digit handoverOtp');
  }
  console.log(`   ✅ Offline Lot Synced: ID=${syncedLot.id}, ClientLotId=${syncedLot.clientLotId}`);
  console.log(`   ✅ Automatic Handover OTP Generated: "${syncedLot.handoverOtp}"`);
  console.log(`   ✅ Valuation Calculated: ₹${syncedLot.estimatedValueMin} – ₹${syncedLot.estimatedValueMax}`);

  // Test Idempotency: Re-syncing same batch
  const syncRes2 = await fetch(`${BASE}/lots/sync-batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenCol1}`
    },
    body: JSON.stringify(syncPayload)
  }).then(r => r.json());

  if (syncRes2.syncedCount !== 1 || syncRes2.lots[0].id !== syncedLot.id) {
    throw new Error('Idempotency failed: duplicate lot created on re-sync');
  }
  console.log('   ✅ Idempotency Verified: Re-syncing existing clientLotId returns existing lot without duplicate.');

  // STEP 4: OFFER ACCEPTANCE OWNERSHIP VALIDATION
  console.log('\n4️⃣ Testing Offer Acceptance Ownership Verification...');
  // Create an offer on syncedLot (which belongs to Collector 1)
  const offerRes = await fetch(`${BASE}/offers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenAdmin}` // recycler or admin token
    },
    body: JSON.stringify({
      lotId: syncedLot.id,
      recyclerId: 'rec_2',
      offeredRatePerKg: 108.0,
      pickupOffered: true
    })
  }).then(r => r.json());
  const createdOffer = offerRes.offer;

  // Collector 2 tries to accept Collector 1's offer -> MUST FAIL with 403 Forbidden!
  const stealOfferRes = await fetch(`${BASE}/offers/${createdOffer.id}/accept`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenCol2}`
    }
  });
  if (stealOfferRes.status !== 403) {
    throw new Error(`Ownership bypass: Foreign collector was able to accept another collector's offer! Status: ${stealOfferRes.status}`);
  }
  console.log('   ✅ Ownership Protected: Unauthorized offer acceptance blocked with 403 Forbidden.');

  // Legitimate collector accepts offer
  const legitAcceptRes = await fetch(`${BASE}/offers/${createdOffer.id}/accept`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenCol1}`
    }
  }).then(r => r.json());

  if (!legitAcceptRes.success || legitAcceptRes.lot.status !== 'ACCEPTED') {
    throw new Error('Legitimate offer acceptance failed');
  }
  console.log(`   ✅ Legitimate Offer Accepted: Lot ${legitAcceptRes.lot.id} status is ACCEPTED.`);

  // STEP 5: CALIBRATED ELECTRONIC SCALE HANDOVER & DYNAMIC RECYCLER RESOLUTION
  console.log('\n5️⃣ Testing Electronic Scale Handover & Dynamic Facility Resolution...');
  const handoverRes = await fetch(`${BASE}/handovers/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenAdmin}`
    },
    body: JSON.stringify({
      lotId: syncedLot.id,
      actualWeight: 14.8,
      handoverOtp: syncedLot.handoverOtp,
      paymentMethod: 'UPI',
      driverName: 'Mohan Lal',
      latitude: 26.8489,
      longitude: 80.9421,
      locationSource: 'DEVICE_GPS'
    })
  }).then(r => r.json());

  const paymentEntry = handoverRes.payment || handoverRes.paymentEntry;
  if (!handoverRes.success || !paymentEntry) {
    throw new Error(`Handover verification failed: ${JSON.stringify(handoverRes)}`);
  }
  console.log(`   ✅ Calibrated Scale Handover Verified: ID=${handoverRes.handover.id}`);
  console.log(`   ✅ Actual Weight: ${handoverRes.handover.actualWeight}kg (Diff: +0.3kg)`);
  console.log(`   ✅ Dynamic Recycler Name Resolved: "${paymentEntry.recyclerName}" (ID: ${paymentEntry.recyclerId})`);
  console.log(`   ✅ Payment Record Type: ${paymentEntry.recordType} (Gateway: ${paymentEntry.externalGatewayStatus})`);

  // STEP 6: TRACEABILITY SHA-256 TAMPER-EVIDENT AUDIT
  console.log('\n6️⃣ Testing Cryptographic SHA-256 Traceability Hash Chain...');
  const traceRes = await fetch(`${BASE}/traceability/${syncedLot.id}/verify-integrity`).then(r => r.json());
  if (!traceRes.success || !traceRes.isTamperFree) {
    throw new Error(`Traceability chain integrity compromised: ${traceRes.failureReason}`);
  }
  console.log(`   ✅ Hash Chain Integrity: 🟢 100% Tamper-Free (${traceRes.totalEvents} events verified)`);
  console.log(`   ✅ Algorithm: ${traceRes.algorithm}`);

  // STEP 7: 7 OFFICIAL DATASETS EXPORT (JSON & CSV)
  console.log('\n7️⃣ Testing Official PS #229 Datasets Export (JSON & CSV)...');
  const datasets = ['materials', 'prices', 'recyclers', 'transactions', 'traceability', 'collectors'];
  for (const ds of datasets) {
    const jsonRes = await fetch(`${BASE}/admin/datasets/${ds}`).then(r => r.json());
    if (!jsonRes.success || jsonRes.recordCount === undefined) {
      throw new Error(`Dataset ${ds} JSON export failed`);
    }
    const csvRes = await fetch(`${BASE}/admin/datasets/${ds}?format=csv`);
    const csvText = await csvRes.text();
    const contentType = csvRes.headers.get('content-type');
    if (!contentType?.includes('text/csv') || !csvText.includes(',')) {
      throw new Error(`Dataset ${ds} CSV export failed: header or comma separated text missing`);
    }
    console.log(`   ✅ Dataset '${ds}': ${jsonRes.recordCount} records (JSON & CSV verified)`);
  }

  // ML Training Export
  const mlRes = await fetch(`${BASE}/admin/datasets/export/ml-training`, {
    headers: { 'Authorization': `Bearer ${tokenAdmin}` }
  }).then(r => r.json());
  const sampleCount = mlRes.manifest ? mlRes.manifest.totalSamplesCollected : mlRes.sampleCount;
  if (!mlRes.success || sampleCount === undefined) {
    throw new Error('ML training dataset export failed');
  }
  console.log(`   ✅ ML Training Dataset: ${sampleCount} real samples (Formats: ${mlRes.manifest?.exportFormatsSupported?.join(', ') || 'YOLOv8'})`);

  // STEP 8: PHYSICAL PERSISTENCE ON DISK (db.json)
  console.log('\n8️⃣ Verifying Physical Disk Persistence in db.json...');
  const dbPath = path.resolve(__dirname, '../data/db.json');
  const diskData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  const foundLot = diskData.lots.find((l: any) => l.id === syncedLot.id);
  const foundPayment = diskData.payments.find((p: any) => p.lotId === syncedLot.id);

  if (!foundLot || !foundPayment) {
    throw new Error('Record failed to persist to physical disk in db.json');
  }
  console.log(`   ✅ Persisted Lot: ${foundLot.id} (Status: ${foundLot.status}, DataSource: ${foundLot.dataSource})`);
  console.log(`   ✅ Persisted Payment Voucher: ${foundPayment.id} (Ref: ${foundPayment.transactionRef}, Recycler: ${foundPayment.recyclerName})`);

  console.log('\n================================================================');
  console.log('🎉 ALL 8 PHASE 5 FULL-STACK HARDENING AUDIT TESTS PASSED 100%!');
  console.log('================================================================\n');
}

runPhase5Audit().catch(err => {
  console.error('❌ Phase 5 Audit Failed:', err);
  process.exit(1);
});
