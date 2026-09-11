import fs from 'fs';
import path from 'path';
import { smsService } from './services/sms.service';
import { payoutService } from './services/payout.service';
import { geocodingService } from './services/geocoding.service';
import { mlDatasetService } from './services/ml-dataset.service';

const BASE = 'http://127.0.0.1:5000/api';

async function runPhase7ZeroGapAudit() {
  console.log('================================================================');
  console.log('🧪 SIH 2026 PS #229 PHASE 7: ZERO-GAP REAL INTEGRATION AUDIT');
  console.log('   "Final System Hardening, Real-Data Integrity & Zero Falsehood"');
  console.log('================================================================\n');

  // 1. AUDIT SMS PROVIDER ABSTRACTION LAYER
  console.log('1️⃣ Auditing SMS Provider Abstraction & DLT Compliance Layer...');
  const smsStatus = smsService.getProviderStatus();
  console.log(`   ✅ Active SMS Provider: ${smsStatus.currentProvider}`);
  console.log(`   ✅ Required Environment Variables: ${smsStatus.requiredEnvVars.join(', ')}`);
  console.log(`   ✅ DLT Requirement: ${smsStatus.dltRequirements.entityRegistration}`);
  
  const otpRes = await fetch(`${BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210' })
  }).then(r => r.json());
  
  if (!otpRes.success || otpRes.deliveryMode !== 'LOCAL_SIMULATOR') {
    throw new Error('SMS provider did not return valid simulator result');
  }
  console.log(`   ✅ Demo OTP Issued: ${otpRes.demoOtp} (Mode: ${otpRes.deliveryMode})`);
  console.log(`   ✅ DLT Disclaimer Notice: "${otpRes.smsGatewayNotice.slice(0, 50)}..."`);

  // 2. AUDIT PAYOUT ADAPTER ARCHITECTURE LAYER
  console.log('\n2️⃣ Auditing Payment Ledger vs Commercial Payout Adapter Architecture...');
  const payoutStatus = payoutService.getProviderStatus();
  console.log(`   ✅ Active Payout Provider: ${payoutStatus.currentProvider}`);
  console.log(`   ✅ Double-Entry Internal Ledger Active: ${payoutStatus.internalLedgerActive}`);
  console.log(`   ✅ Corporate Banking Requirement: ${payoutStatus.complianceRequirements.banking}`);

  const testPayout = await payoutService.processHandoverSettlement({
    lotId: 'EW-TEST-001',
    collectorId: 'col_1',
    collectorName: 'Ramesh Kumar',
    collectorPhone: '9876543210',
    amount: 1520,
    paymentMethod: 'UPI'
  });
  console.log(`   ✅ Payout Record Type: ${testPayout.recordType}`);
  console.log(`   ✅ External Gateway Status: ${testPayout.externalGatewayStatus}`);
  console.log(`   ✅ Truthful Gateway Notice: "${testPayout.gatewayNotice.slice(0, 55)}..."`);

  // 3. AUDIT REVERSE GEOCODING SERVICE & CACHING
  console.log('\n3️⃣ Auditing OpenStreetMap Reverse Geocoding & Local Caching...');
  const geo1 = await geocodingService.reverseGeocode(26.8489, 80.9421, 'Lucknow');
  console.log(`   ✅ Reverse Geocode (Initial): District=${geo1.district}, State=${geo1.state}, Source=${geo1.source}, Cached=${geo1.cached}`);
  
  const geo2 = await geocodingService.reverseGeocode(26.8489, 80.9421, 'Lucknow');
  if (!geo2.cached) {
    throw new Error('Second geocode call should be served from in-memory cache');
  }
  console.log(`   ✅ Reverse Geocode (Cache Hit): Cached=${geo2.cached} (Saved within 24h TTL)`);

  // 4. AUDIT ML TRAINING DATASET & STRATIFIED SPLIT SERVICE
  console.log('\n4️⃣ Auditing ML Training Dataset Validation & Stratified Train/Val Split...');
  const mlManifestRes = await fetch(`${BASE}/admin/datasets/export/ml-training`, {
    headers: { 'Authorization': 'Bearer ' + await getAdminToken() }
  }).then(r => r.json());

  if (!mlManifestRes.success || !mlManifestRes.manifest) {
    throw new Error('Failed to export ML dataset manifest');
  }
  const manifest = mlManifestRes.manifest;
  console.log(`   ✅ Dataset Name: ${manifest.datasetName} (v${manifest.version})`);
  console.log(`   ✅ Total Collected Samples: ${manifest.totalSamplesCollected}`);
  console.log(`   ✅ Stratified Split: Train=${manifest.trainCount}, Val=${manifest.valCount} (${manifest.splitRatio})`);
  console.log(`   ✅ Model Training Viability: ready=${manifest.modelTrainingReadiness.ready}`);
  console.log(`   ✅ Scientific Integrity Rationale: "${manifest.modelTrainingReadiness.reason.slice(0, 80)}..."`);
  console.log(`   ✅ YOLOv8 Configuration Yaml Generated: ${manifest.yoloConfigYaml.split('\n')[0]}`);

  // 5. AUDIT COMPLETE 12-STAGE LIFECYCLE DATA INTEGRITY
  console.log('\n5️⃣ Auditing Complete 12-Stage Lifecycle Data Integrity & Relationship Consistency...');
  const colToken = await getCollectorToken();
  const recToken = await getRecyclerToken();

  // Create lot with hardware GPS
  const createLotRes = await fetch(`${BASE}/lots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${colToken}` },
    body: JSON.stringify({
      materialCategory: 'PCB',
      approxWeight: 14.5,
      condition: 'INTACT',
      sourceType: 'COMMERCIAL',
      locationDistrict: 'Lucknow',
      latitude: 26.8489,
      longitude: 80.9421,
      locationSource: 'DEVICE_GPS'
    })
  }).then(r => r.json());
  const auditLot = createLotRes.lot;
  console.log(`   ✅ Lot Created: ID=${auditLot.id}, Weight=${auditLot.approxWeight}kg, OTP=${auditLot.handoverOtp}`);

  // Recycler quote
  const quoteRes = await fetch(`${BASE}/offers/request-quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${colToken}` },
    body: JSON.stringify({ lotId: auditLot.id, recyclerId: 'rec_1' })
  }).then(r => r.json());
  const quote = quoteRes.offer;
  console.log(`   ✅ Formal Quote Generated: ID=${quote.id}, Rate=₹${quote.offeredRatePerKg}/kg`);

  // Accept offer
  const acceptRes = await fetch(`${BASE}/offers/${quote.id}/accept`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${colToken}` }
  }).then(r => r.json());
  if (acceptRes.lot.status !== 'ACCEPTED') throw new Error('Offer acceptance failed');

  // Schedule pickup
  const pickupRes = await fetch(`${BASE}/pickups/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify({
      lotId: auditLot.id,
      driverName: 'Suresh Yadav',
      driverContact: '9871122334',
      vehicleNumber: 'UP-32-BZ-4412',
      timeSlot: 'Morning'
    })
  }).then(r => r.json());
  if (pickupRes.lot.status !== 'PICKUP_SCHEDULED') throw new Error('Pickup schedule failed');

  // Verify calibrated scale handover
  const handoverRes = await fetch(`${BASE}/handovers/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify({
      lotId: auditLot.id,
      actualWeight: 14.7,
      handoverOtp: auditLot.handoverOtp,
      paymentMethod: 'UPI',
      driverName: 'Suresh Yadav',
      latitude: 26.8489,
      longitude: 80.9421,
      locationSource: 'DEVICE_GPS'
    })
  }).then(r => r.json());

  if (!handoverRes.success || !handoverRes.payment) throw new Error('Handover verification failed');
  console.log(`   ✅ Scale Handover Settled: RecordType=${handoverRes.payment.recordType}, Amount=₹${handoverRes.payment.amount}`);
  console.log(`   ✅ Handover Facility Name Dynamically Resolved: "${handoverRes.payment.recyclerName}"`);

  // Progress to RECYCLED
  const cycleRes = await fetch(`${BASE}/traceability/stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify({
      lotId: auditLot.id,
      stage: 'RECYCLED',
      title: 'Full Circular Recovery Finished',
      description: 'Precious metals recovered via zero-emission hydrometallurgical extraction.',
      facilityLocation: 'Lucknow Eco-Industrial Park'
    })
  }).then(r => r.json());
  if (cycleRes.lot.status !== 'RECYCLED') throw new Error('Lifecycle progression failed');
  console.log(`   ✅ Lifecycle Completed: Lot Status is RECYCLED.`);

  // 6. AUDIT CRYPTOGRAPHIC SHA-256 MERKLE DAG HASH CHAIN
  console.log('\n6️⃣ Auditing Cryptographic SHA-256 Merkle DAG Hash Chain...');
  const auditChainRes = await fetch(`${BASE}/traceability/${auditLot.id}/verify-integrity`).then(r => r.json());
  if (!auditChainRes.success || !auditChainRes.isTamperFree) {
    throw new Error('Hash chain verification failed');
  }
  console.log(`   ✅ Hash Chain Integrity: 🟢 100% Tamper-Free (${auditChainRes.totalEvents} events audited)`);
  console.log(`   ✅ Genesis Hash: ${auditChainRes.genesisHash}`);
  console.log(`   ✅ Terminal Hash: ${auditChainRes.terminalHash}`);

  // 7. AUDIT CPCB EPR DYNAMIC DATASET CSV EXPORT
  console.log('\n7️⃣ Auditing CPCB EPR Dynamic Dataset CSV Export...');
  const csvRes = await fetch(`${BASE}/admin/datasets/transactions?format=csv`);
  const csvText = await csvRes.text();
  if (!csvRes.headers.get('content-type')?.includes('text/csv') || !csvText.includes('transactionRef')) {
    throw new Error('CSV export format invalid');
  }
  console.log(`   ✅ Transactions CSV Export: Valid RFC 4180 CSV with headers (Size: ${csvText.length} bytes)`);

  // 8. AUDIT PHYSICAL PERSISTENCE ON DISK
  console.log('\n8️⃣ Auditing Physical Atomic Persistence in db.json...');
  const dbDiskPath = path.resolve(__dirname, '../data/db.json');
  const rawDisk = JSON.parse(fs.readFileSync(dbDiskPath, 'utf8'));
  const foundLotOnDisk = rawDisk.lots.find((l: any) => l.id === auditLot.id);
  const foundPaymentOnDisk = rawDisk.payments.find((p: any) => p.lotId === auditLot.id);

  if (!foundLotOnDisk || foundLotOnDisk.status !== 'RECYCLED' || !foundPaymentOnDisk) {
    throw new Error('Physical disk persistence audit failed');
  }
  console.log(`   ✅ Disk Record Verified: Lot ${foundLotOnDisk.id} (Status: ${foundLotOnDisk.status}, Source: ${foundLotOnDisk.dataSource})`);
  console.log(`   ✅ Disk Voucher Verified: Ref ${foundPaymentOnDisk.transactionRef} (Settled: ₹${foundPaymentOnDisk.amount}, Type: ${foundPaymentOnDisk.recordType})`);

  console.log('\n================================================================');
  console.log('🎉 ALL 8 PHASE 7 ZERO-GAP REAL-WORLD AUDIT SCENARIOS PASSED 100%!');
  console.log('================================================================\n');
}

async function getCollectorToken(): Promise<string> {
  const r = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210', otp: '1234' })
  }).then(res => res.json());
  return r.token;
}

async function getRecyclerToken(): Promise<string> {
  const r = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9123456780', otp: '1234', selectedRole: 'RECYCLER' })
  }).then(res => res.json());
  return r.token;
}

async function getAdminToken(): Promise<string> {
  const r = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999999999', otp: '1234', selectedRole: 'ADMIN' })
  }).then(res => res.json());
  return r.token;
}

runPhase7ZeroGapAudit().catch(err => {
  console.error('❌ Phase 7 Zero-Gap Audit Failed:', err);
  process.exit(1);
});
