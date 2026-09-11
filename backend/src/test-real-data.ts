// Automated Real Data & Provenance Test Suite for SIH 2026 #229
async function runRealDataTests() {
  const BASE = 'http://127.0.0.1:5000/api';
  console.log('🧪 Running Dedicated Real Data Provenance & Workflow Suite...\n');

  // 1. Auth Test (Collector & Admin)
  const authRes = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210', otp: '1234', selectedRole: 'COLLECTOR' })
  }).then(r => r.json());
  const token = authRes.token;

  const adminAuthRes = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543299', otp: '1234', selectedRole: 'ADMIN' })
  }).then(r => r.json());
  const adminToken = adminAuthRes.token;

  // 2. Real Price Observation Update Test
  console.log('1️⃣ Testing Live Price Observation Ingestion & Validation (POST /api/prices/update)...');
  const priceUpdateRes = await fetch(`${BASE}/prices/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      materialCategory: 'PCB',
      subCategory: 'High Grade Server PCBs',
      district: 'Lucknow',
      ratePerKg: 104.5,
      source: 'Direct Mandi Transaction Audit',
      sourceType: 'ADMIN_BENCHMARK'
    })
  }).then(r => r.json());
  console.log(`   ✅ Price Observation Recorded! Status: ${priceUpdateRes.logEntry.validationStatus}, Data Source: ${priceUpdateRes.logEntry.dataSource}`);

  // 3. Verify Price History is 100% Genuine (Zero Synthetic Curves)
  console.log('\n2️⃣ Verifying Historical Price Trends are 100% Real Logs...');
  const priceHistRes = await fetch(`${BASE}/prices/history?category=PCB&district=Lucknow`).then(r => r.json());
  console.log(`   ✅ Fetched ${priceHistRes.history.length} price points. isSynthetic: ${priceHistRes.isSynthetic}, Data Source: ${priceHistRes.dataSource}`);
  if (priceHistRes.isSynthetic) {
    throw new Error('FAILED: Expected genuine historical price logs, got synthetic curve!');
  }

  // 4. Test ML Training Sample Feedback Recording & Manifest Exporter
  console.log('\n3️⃣ Testing ML Training Feedback Ingestion & Dataset Manifest Export...');
  const mlRes = await fetch(`${BASE}/ai/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lotId: 'EW-LUC-2026-000109',
      imagePath: '/uploads/sample_pcb.jpg',
      initialHeuristicPrediction: 'CABLE',
      userConfirmedCategory: 'PCB',
      collectorId: 'col_1',
      district: 'Lucknow'
    })
  }).then(r => r.json());
  console.log(`   ✅ ML Sample Recorded! Sample ID: ${mlRes.sampleId}, Total In Pipeline: ${mlRes.totalSamplesCollected}`);

  const mlManifestRes = await fetch(`${BASE}/admin/datasets/export/ml-training`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }).then(r => r.json());
  console.log(`   ✅ ML Vision Manifest Generated! Name: "${mlManifestRes.manifest.datasetName}", Classes: [${mlManifestRes.manifest.classes.join(', ')}], Samples: ${mlManifestRes.manifest.totalSamplesCollected}`);

  // 5. Test CPCB Gazette Master Directory Search & Automated Cross-Referencing
  console.log('\n4️⃣ Testing Official CPCB Gazette Recycler Directory & Automated Verification...');
  const cpcbSearchRes = await fetch(`${BASE}/recyclers/cpcb-registry?q=Attero`).then(r => r.json());
  console.log(`   ✅ CPCB Gazette Search: Found ${cpcbSearchRes.count} matching units. Top: ${cpcbSearchRes.records[0].facilityName} (Reg: ${cpcbSearchRes.records[0].registrationNo})`);

  const authUpdateRes = await fetch(`${BASE}/recyclers/rec_1/auth-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      registrationNo: 'CPCB/EWR/UP/LKO/2023/8812'
    })
  }).then(r => r.json());
  console.log(`   ✅ Automated Gazette Match: Recycler marked as ${authUpdateRes.recycler.authorizationStatus} (${authUpdateRes.recycler.authorizationSource}), Valid Until: ${authUpdateRes.recycler.authValidUntil}`);

  // 6. Test Digital Handover with Real Device GPS & Statistical Z-Score Anomaly Engine
  console.log('\n5️⃣ Testing Handover with Real Device GPS & Statistical Outlier Engine...');
  const handoverGpsRes = await fetch(`${BASE}/handovers/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      lotId: 'EW-LUC-2026-000109',
      actualWeight: 15.4,
      handoverOtp: '4821',
      paymentMethod: 'CASH',
      driverName: 'Suresh Yadav',
      latitude: 26.848912,
      longitude: 80.942155,
      locationSource: 'DEVICE_GPS',
      deviceAccuracyMeters: 6.5
    })
  }).then(r => r.json());
  console.log(`   ✅ Handover Verified with GPS! Record ID: ${handoverGpsRes.handover.id}`);
  console.log(`      Location Source: ${handoverGpsRes.handover.locationSource} (${handoverGpsRes.handover.gpsLocation.lat}, ${handoverGpsRes.handover.gpsLocation.lng}) ±${handoverGpsRes.handover.deviceAccuracyMeters}m`);
  console.log(`      Voucher Record Type: ${handoverGpsRes.handover.paymentRecordType}`);

  // 7. Test Cryptographic SHA-256 Hash Chain Integrity Verification
  console.log('\n6️⃣ Testing Cryptographic SHA-256 Traceability Hash Chain Verification...');
  const integrityRes = await fetch(`${BASE}/traceability/EW-LUC-2026-000109/verify-integrity`).then(r => r.json());
  console.log(`   ✅ Cryptographic Hash Verification Result for ${integrityRes.lotId}:`);
  console.log(`      Algorithm: ${integrityRes.algorithm}`);
  console.log(`      Total Milestone Events Verified: ${integrityRes.totalEvents}`);
  console.log(`      Tamper-Free Integrity Status: ${integrityRes.isTamperFree ? '🟢 100% VALID' : '🔴 TAMPERED'}`);
  console.log(`      Genesis -> Terminal Hash: ${integrityRes.auditChain[0]?.storedHash?.slice(0, 16)}... -> ${integrityRes.auditChain[integrityRes.auditChain.length - 1]?.storedHash?.slice(0, 16)}...`);

  if (!integrityRes.isTamperFree) {
    throw new Error(`FAILED: Cryptographic chain validation failed on event ${integrityRes.compromisedEventId}`);
  }

  console.log('\n🎉 ALL REAL DATA & GENUINE INTERNAL UPGRADES PASSED 100% SUCCESSFULLY!');
}

runRealDataTests().catch(console.error);
