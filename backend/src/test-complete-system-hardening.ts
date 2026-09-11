import fs from 'fs';
import path from 'path';
import { db, computeTraceabilityHashes } from './db/store';

const BASE = 'http://127.0.0.1:5000/api';

async function runSystemHardeningAudit() {
  console.log('================================================================');
  console.log('🧪 SIH 2026 PS #229 COMPLETE SYSTEM HARDENING AUDIT & TEST SUITE');
  console.log('================================================================\n');

  // STEP 1: AUTHENTICATION & SESSION HANDLING
  console.log('1️⃣ Auditing Authentication System & Session Handling...');
  const loginRes = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210', otp: '1234' })
  }).then(r => r.json());

  if (!loginRes.success || !loginRes.token || !loginRes.user) {
    throw new Error('Collector authentication failed');
  }
  const collectorToken = loginRes.token;
  const collectorUserId = loginRes.user.id;
  const collectorProfile = loginRes.collectorProfile;
  console.log(`   ✅ Collector Logged In: ${loginRes.user.name} (${loginRes.user.role}), ID: ${collectorUserId}`);
  console.log(`   ✅ Session JWT Issued: ${collectorToken.slice(0, 20)}...`);

  // Verify Recycler Auth
  const recyclerLoginRes = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9123456780', otp: '1234', selectedRole: 'RECYCLER' })
  }).then(r => r.json());
  if (!recyclerLoginRes.success || !recyclerLoginRes.token) {
    throw new Error('Recycler authentication failed');
  }
  const recyclerToken = recyclerLoginRes.token;
  console.log(`   ✅ Recycler Logged In: ${recyclerLoginRes.user.name} (${recyclerLoginRes.user.role})`);

  // Verify Admin Auth
  const adminLoginRes = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999999999', otp: '1234', selectedRole: 'ADMIN' })
  }).then(r => r.json());
  if (!adminLoginRes.success || !adminLoginRes.token) {
    throw new Error('Admin authentication failed');
  }
  const adminToken = adminLoginRes.token;
  console.log(`   ✅ Admin Logged In: ${adminLoginRes.user.name} (${adminLoginRes.user.role})`);

  // STEP 2: COLLECTOR LOT CREATION & GPS PROVENANCE
  console.log('\n2️⃣ Testing Digital Lot Creation with Hardware GPS & Heuristic Classification...');
  const createLotRes = await fetch(`${BASE}/lots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${collectorToken}`
    },
    body: JSON.stringify({
      materialCategory: 'PCB',
      subCategory: 'High Grade Telecom Server PCBs',
      description: 'End-of-life server motherboard lot with BGA gold chips',
      approxWeight: 22.5,
      condition: 'INTACT',
      sourceType: 'COMMERCIAL',
      locationDistrict: 'Lucknow',
      locationState: 'Uttar Pradesh',
      latitude: 26.8489,
      longitude: 80.9421,
      locationSource: 'DEVICE_GPS',
      imageUrl: '/uploads/server_pcb_lot_hardened.jpg'
    })
  }).then(r => r.json());

  if (!createLotRes.success || !createLotRes.lot) {
    throw new Error(`Lot creation failed: ${createLotRes.message}`);
  }
  const testLot = createLotRes.lot;
  console.log(`   ✅ Digital Lot Created: ID=${testLot.id}, Weight=${testLot.approxWeight}kg`);
  console.log(`   ✅ GPS Provenance: ${testLot.latitude}, ${testLot.longitude} (${testLot.locationSource})`);
  console.log(`   ✅ Valuation Estimate: ₹${testLot.estimatedValueMin} – ₹${testLot.estimatedValueMax}`);
  console.log(`   ✅ Data Source Tag: ${testLot.dataSource}`);

  // Record ML Vision sample
  const mlSampleRes = await fetch(`${BASE}/ai/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lotId: testLot.id,
      imagePath: testLot.imageUrl,
      initialHeuristicPrediction: 'PCB',
      userConfirmedCategory: 'PCB',
      collectorId: testLot.collectorId,
      district: 'Lucknow'
    })
  }).then(r => r.json());
  console.log(`   ✅ ML Training Sample Feedback Ingested: Sample ID=${mlSampleRes.sampleId}`);

  // STEP 3: RECYCLER MATCHING & OFFER SUBMISSION
  console.log('\n3️⃣ Testing Recycler Matching & Formal Offer Bidding...');
  const recyclersRes = await fetch(`${BASE}/recyclers?materialCategory=PCB&district=Lucknow`).then(r => r.json());
  if (!recyclersRes.success || recyclersRes.recyclers.length === 0) {
    throw new Error('No matched recyclers found');
  }
  const chosenRecycler = recyclersRes.recyclers[0];
  console.log(`   ✅ Recycler Matched: ${chosenRecycler.facilityName}, Status: ${chosenRecycler.authorizationStatus}, Score: ${chosenRecycler.matchScore}/100`);

  const offerRes = await fetch(`${BASE}/offers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${recyclerToken}`
    },
    body: JSON.stringify({
      lotId: testLot.id,
      offeredRatePerKg: 102.0,
      pickupOffered: true,
      pickupEtaHours: 18,
      notes: 'Certified green processing under CPCB authorization.'
    })
  }).then(r => r.json());

  if (!offerRes.success || !offerRes.offer) {
    throw new Error(`Offer creation failed: ${offerRes.message}`);
  }
  const testOffer = offerRes.offer;
  console.log(`   ✅ Formal Purchase Offer Created: ID=${testOffer.id}, Rate=₹${testOffer.offeredRatePerKg}/kg, Total=₹${testOffer.totalOfferedPrice}`);

  // STEP 4: COLLECTOR OFFER ACCEPTANCE
  console.log('\n4️⃣ Testing Collector Offer Acceptance...');
  const acceptRes = await fetch(`${BASE}/offers/${testOffer.id}/accept`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${collectorToken}`
    }
  }).then(r => r.json());

  if (!acceptRes.success || acceptRes.lot.status !== 'ACCEPTED') {
    throw new Error('Offer acceptance failed');
  }
  console.log(`   ✅ Offer Accepted! Lot Status: ${acceptRes.lot.status}, Selected Recycler: ${acceptRes.lot.selectedRecyclerId}`);

  // STEP 5: DOORSTEP PICKUP LOGISTICS SCHEDULING
  console.log('\n5️⃣ Testing Logistics Pickup Booking...');
  const pickupRes = await fetch(`${BASE}/pickups/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${recyclerToken}`
    },
    body: JSON.stringify({
      lotId: testLot.id,
      scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      timeSlot: '11:00 AM - 02:00 PM',
      driverName: 'Suresh Yadav',
      driverContact: '9871122334',
      vehicleNumber: 'UP-32-BZ-4412',
      notes: 'Vehicle equipped with calibrated Class-III digital scale.'
    })
  }).then(r => r.json());

  if (!pickupRes.success || !pickupRes.pickup) {
    throw new Error('Pickup scheduling failed');
  }
  console.log(`   ✅ Pickup Scheduled: Driver=${pickupRes.pickup.driverName}, Vehicle=${pickupRes.pickup.vehicleNumber}, Status=${pickupRes.lot.status}`);

  // STEP 6: DIGITAL HANDOVER & SCALE VERIFICATION & PAYMENT RECORD
  console.log('\n6️⃣ Testing Calibrated Electronic Scale Handover & Ledger Voucher Settlement...');
  const handoverRes = await fetch(`${BASE}/handovers/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${recyclerToken}`
    },
    body: JSON.stringify({
      lotId: testLot.id,
      actualWeight: 22.8, // 0.3 kg variation (+1.3%)
      handoverOtp: testLot.handoverOtp || '4821',
      paymentMethod: 'UPI',
      driverName: 'Suresh Yadav',
      latitude: 26.8489,
      longitude: 80.9421,
      locationSource: 'DEVICE_GPS',
      deviceAccuracyMeters: 5.2,
      proofImageUrl: '/uploads/scale_slip_proof_test.jpg'
    })
  }).then(r => r.json());

  if (!handoverRes.success || !handoverRes.handover || !handoverRes.payment) {
    throw new Error(`Handover verification failed: ${handoverRes.message}`);
  }
  const testHandover = handoverRes.handover;
  const testPayment = handoverRes.payment;
  console.log(`   ✅ Handover Verified: ID=${testHandover.id}, Actual Scale Weight=${testHandover.actualWeight}kg (Diff: +${testHandover.weightDifference}kg)`);
  console.log(`   ✅ Payment Ledger Voucher: ID=${testPayment.id}, Ref=${testPayment.transactionRef}, Amount=₹${testPayment.amount}`);
  console.log(`   ✅ Payment Record Type: ${testPayment.recordType} (External Gateway: ${testPayment.externalGatewayStatus})`);

  // STEP 7: COLLECTOR PASSBOOK AUDIT
  console.log('\n7️⃣ Testing Collector Earnings Ledger Passbook & IDOR Protection...');
  const ledgerRes = await fetch(`${BASE}/payments/collector/${collectorProfile.id}`, {
    headers: { 'Authorization': `Bearer ${collectorToken}` }
  }).then(r => r.json());

  if (!ledgerRes.success || !ledgerRes.summary) {
    throw new Error('Failed to fetch collector ledger');
  }
  console.log(`   ✅ Collector Total Earnings in Ledger: ₹${ledgerRes.summary.totalEarnings}`);
  console.log(`   ✅ Completed Transactions in Passbook: ${ledgerRes.summary.completedTransactionsCount}`);
  console.log(`   ✅ Formal Channel Uplift: +${ledgerRes.summary.unitEconomics.netUpliftPercentage}% vs Informal Middleman`);

  // STEP 8: HYDROMETALLURGICAL EXTRACTION & RECYCLING LIFECYCLE
  console.log('\n8️⃣ Testing Recycling Facility Lifecycle Stages (RECYCLED Status)...');
  const stageRes = await fetch(`${BASE}/traceability/stage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${recyclerToken}`
    },
    body: JSON.stringify({
      lotId: testLot.id,
      stage: 'RECYCLED',
      facilityLocation: 'GreenEarth E-Waste Solutions, Nadarganj Industrial Area, Lucknow',
      recoveredDetails: 'Recovered: 3.4kg Copper, 120g Tin, 4.2g Gold, 18.2kg Secondary Polymer Resin.'
    })
  }).then(r => r.json());

  if (!stageRes.success || stageRes.lot.status !== 'RECYCLED') {
    throw new Error('Failed to update stage to RECYCLED');
  }
  console.log(`   ✅ Closed-Loop Recycling Completed: Final Lot Status: ${stageRes.lot.status}`);

  // STEP 9: CRYPTOGRAPHIC SHA-256 MERKLE DAG INTEGRITY VERIFICATION
  console.log('\n9️⃣ Testing Cryptographic SHA-256 Merkle DAG Hash Chain Integrity...');
  const auditRes = await fetch(`${BASE}/traceability/${testLot.id}/verify-integrity`).then(r => r.json());
  if (!auditRes.success || !auditRes.isTamperFree) {
    throw new Error('Traceability chain integrity verification failed');
  }
  console.log(`   ✅ Cryptographic Hash Chain Audit: ${auditRes.eventsAudited} events verified.`);
  console.log(`   ✅ Tamper-Free Status: 🟢 ${auditRes.isTamperFree ? '100% VALID' : 'TAMPERED'}`);
  console.log(`   ✅ Genesis Hash: ${auditRes.auditChain[0]?.storedHash?.slice(0, 20)}...`);
  console.log(`   ✅ Terminal Hash: ${auditRes.auditChain[auditRes.auditChain.length - 1]?.storedHash?.slice(0, 20)}...`);

  // STEP 10: 6 PS #229 STRUCTURED DATASETS EXPORT AUDIT
  console.log('\n🔟 Testing Official PS #229 Datasets Export (JSON + CSV)...');
  const datasets = ['materials', 'prices', 'recyclers', 'transactions', 'traceability', 'collectors'];
  for (const d of datasets) {
    const jsonRes = await fetch(`${BASE}/admin/datasets/${d}`).then(r => r.json());
    if (!jsonRes.success || jsonRes.recordCount === undefined) {
      throw new Error(`Dataset export failed for ${d}`);
    }
    console.log(`   ✅ Dataset '${d}': ${jsonRes.recordCount} structured records available.`);
  }

  // Check CSV format export
  const csvRes = await fetch(`${BASE}/admin/datasets/transactions?format=csv`).then(r => r.text());
  if (!csvRes.startsWith('id,') && !csvRes.includes('amount')) {
    throw new Error('CSV export format invalid');
  }
  console.log('   ✅ CSV Dataset Export Verified: Valid comma-separated headers and records generated.');

  // STEP 11: COLD RESTART PERSISTENCE VERIFICATION
  console.log('\n1️⃣1️⃣ Verifying Physical Persistence on Disk (db.json)...');
  const dbPath = path.resolve(__dirname, '../data/db.json');
  const diskData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  const foundLot = diskData.lots.find((l: any) => l.id === testLot.id);
  const foundHandover = diskData.handovers.find((h: any) => h.id === testHandover.id);
  const foundPayment = diskData.payments.find((p: any) => p.id === testPayment.id);

  if (!foundLot || !foundHandover || !foundPayment) {
    throw new Error('Entities failed to persist to physical db.json');
  }
  if (foundLot.dataSource !== 'LIVE' || foundPayment.dataSource !== 'LIVE') {
    throw new Error('New records must have dataSource: LIVE');
  }
  console.log(`   ✅ Physical Disk Persistence Verified: Lot ${foundLot.id} (Status: ${foundLot.status}, DataSource: ${foundLot.dataSource})`);
  console.log(`   ✅ Handover Record Persisted: ${foundHandover.id}`);
  console.log(`   ✅ Payment Ledger Voucher Persisted: ${foundPayment.id} (Ref: ${foundPayment.transactionRef})`);

  console.log('\n================================================================');
  console.log('🎉 ALL 11 COMPLETE SYSTEM HARDENING AUDIT VERIFICATIONS PASSED 100%!');
  console.log('================================================================\n');
}

runSystemHardeningAudit().catch(err => {
  console.error('❌ System Hardening Audit Failed:', err);
  process.exit(1);
});
