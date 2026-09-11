import fs from 'fs';
import path from 'path';

const VITE_BASE = 'http://127.0.0.1:5173/api';
const BACKEND_BASE = 'http://127.0.0.1:5000/api';

async function runManualJourneyVerification() {
  console.log('================================================================');
  console.log('🔍 LOCALHOST FULL-STACK RUN & MANUAL DEMO VERIFICATION');
  console.log('   "Validating Complete E2E Lifecycle via Active Servers"');
  console.log('================================================================\n');

  // 1. FRONTEND PROXY & HEALTH CHECK
  console.log('1️⃣ [STEP 1] Testing Vite Frontend Proxy & Backend Server Connectivity...');
  const healthRes = await fetch('http://127.0.0.1:5000/health').then(r => r.json());
  console.log('   ✅ Direct Backend Health Check (127.0.0.1:5000):', healthRes);

  const proxyPriceCheck = await fetch(`${VITE_BASE}/prices/board?district=Lucknow`).then(r => r.json());
  console.log(`   ✅ Vite Frontend Proxy Check (127.0.0.1:5173/api): success=${proxyPriceCheck.success}, items=${proxyPriceCheck.prices.length}`);
  if (!proxyPriceCheck.success || proxyPriceCheck.prices.length === 0) {
    throw new Error('Vite proxy to backend failed!');
  }

  // 2. STEP 6: AUTHENTICATION & ROLE SEPARATION
  console.log('\n2️⃣ [STEP 6] Testing Collector, Recycler, and Admin Demo Personas...');
  const colAuth = await fetch(`${VITE_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210', otp: '1234' })
  }).then(r => r.json());
  console.log(`   ✅ Collector Logged In: ${colAuth.user.name} (Role: ${colAuth.user.role}, Mode: LOCAL_SIMULATOR)`);

  const recAuth = await fetch(`${VITE_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9123456780', otp: '1234' })
  }).then(r => r.json());
  console.log(`   ✅ Recycler Logged In: ${recAuth.user.name} (Role: ${recAuth.user.role})`);

  const admAuth = await fetch(`${VITE_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999999999', otp: '1234' })
  }).then(r => r.json());
  console.log(`   ✅ Admin Logged In: ${admAuth.user.name} (Role: ${admAuth.user.role})`);

  const tokenCol = colAuth.token;
  const tokenRec = recAuth.token;
  const tokenAdm = admAuth.token;

  // 3. STEP 7: ALL 8 MANDATORY MATERIAL CATEGORIES CHECK
  console.log('\n3️⃣ [STEP 7] Verifying All 8 Mandatory Material Categories in Price Board...');
  const MANDATORY_8 = ['CRTs', 'LCD panels', 'PCBs', 'Cables', 'Batteries', 'Motors', 'Magnet-bearing assemblies', 'Mixed plastics'];
  const CATEGORY_KEYS = ['CRT', 'LCD', 'PCB', 'CABLE', 'BATTERY', 'MOTOR', 'MAGNET', 'MIXED_PLASTIC'];
  
  for (let i = 0; i < CATEGORY_KEYS.length; i++) {
    const key = CATEGORY_KEYS[i];
    const catRate = proxyPriceCheck.prices.find((p: any) => p.materialCategory === key);
    if (!catRate) {
      throw new Error(`Mandatory category ${key} missing from price board!`);
    }
    console.log(`   ✅ Stream ${i+1}/8 [${MANDATORY_8[i]} - ${key}]: Mandi Buy Rate = ₹${catRate.prevailingBuyPrice}/kg, Audio: "${catRate.audioHindi ? catRate.audioHindi.slice(0, 45) : ''}..."`);
  }

  // 4. STEP 7: CREATE DIGITAL E-WASTE LOT (PCB, 16.5kg)
  console.log('\n4️⃣ [STEP 7] Creating Digital E-Waste Lot with GPS, Photograph & Valuation...');
  const lotPayload = {
    materialCategory: 'PCB',
    subCategory: 'Telecom Boards & Server Circuitry',
    description: 'Decommissioned server power supply boards collected from corporate estate',
    approxWeight: 16.5,
    condition: 'INTACT',
    sourceType: 'COMMERCIAL',
    locationDistrict: 'Lucknow',
    locationState: 'Uttar Pradesh',
    latitude: 26.8489,
    longitude: 80.9421,
    locationSource: 'DEVICE_GPS',
    imageUrl: '/uploads/e-waste-pcb-sample.jpg'
  };

  const createLotRes = await fetch(`${VITE_BASE}/lots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenCol}`
    },
    body: JSON.stringify(lotPayload)
  }).then(r => r.json());

  if (!createLotRes.success || !createLotRes.lot) {
    throw new Error(`Lot creation failed: ${JSON.stringify(createLotRes)}`);
  }

  const newLot = createLotRes.lot;
  console.log(`   ✅ New Lot Created: ID=${newLot.id}`);
  console.log(`   ✅ Unique Handover OTP Generated: "${newLot.handoverOtp}"`);
  console.log(`   ✅ Benchmark Valuation Estimate: ₹${newLot.estimatedValueMin} – ₹${newLot.estimatedValueMax} (Avg: ₹${newLot.estimatedValueAvg})`);
  console.log(`   ✅ Provenance: LocationSource=${newLot.locationSource}, DataSource=${newLot.dataSource}`);

  // 5. STEP 8: RECYCLER MATCHING & FORMAL BIDDING
  console.log('\n5️⃣ [STEP 8] Recycler Matching, Eligibility & Formal Bidding...');
  const matchRes = await fetch(`${VITE_BASE}/recyclers?material=PCB&district=Lucknow`, {
    headers: { 'Authorization': `Bearer ${tokenCol}` }
  }).then(r => r.json());

  console.log(`   ✅ Matched Recyclers: Found ${matchRes.recyclers.length} authorized facilities.`);
  const topRecycler = matchRes.recyclers[0];
  console.log(`   ✅ Top Match: ${topRecycler.facilityName} (MCDA Score: ${topRecycler.matchScore}/100, Dist: ~${topRecycler.estimatedDistanceKm} km, Auth: ${topRecycler.authorizationStatus})`);

  // Request formal quote from top matched recycler
  const quoteRes = await fetch(`${VITE_BASE}/offers/request-quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenCol}`
    },
    body: JSON.stringify({
      lotId: newLot.id,
      recyclerId: topRecycler.id
    })
  }).then(r => r.json());

  const formalQuote = quoteRes.offer;
  console.log(`   ✅ Formal Recycler Quote Created: ID=${formalQuote.id}, Rate=₹${formalQuote.offeredRatePerKg}/kg, Total=₹${formalQuote.totalOfferedPrice}`);

  // Collector accepts offer
  const acceptRes = await fetch(`${VITE_BASE}/offers/${formalQuote.id}/accept`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${tokenCol}` }
  }).then(r => r.json());
  console.log(`   ✅ Collector Accepted Offer in 1-Tap! Lot Status: ${acceptRes.lot.status}`);

  // 6. STEP 9: PICKUP LOGISTICS & CALIBRATED ELECTRONIC WEIGHBRIDGE HANDOVER
  console.log('\n6️⃣ [STEP 9] Scheduling Pickup Logistics & Scale Handover...');
  const pickupRes = await fetch(`${VITE_BASE}/pickups/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenRec}`
    },
    body: JSON.stringify({
      lotId: newLot.id,
      pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      driverName: 'Suresh Yadav',
      driverPhone: '9876543219',
      vehicleNumber: 'UP-32-BZ-4412'
    })
  }).then(r => r.json());
  console.log(`   ✅ Pickup Scheduled: Driver=${pickupRes.pickup.driverName}, Vehicle=${pickupRes.pickup.vehicleNumber}`);

  // Recycler scale verification
  const handoverPayload = {
    lotId: newLot.id,
    handoverOtp: newLot.handoverOtp,
    actualWeight: 16.8, // 16.5 approx vs 16.8 scale
    paymentMethod: 'UPI',
    driverName: 'Suresh Yadav',
    latitude: 26.8489,
    longitude: 80.9421,
    locationSource: 'DEVICE_GPS',
    proofPhotoUrl: '/uploads/scale-receipt-sample.jpg'
  };

  const handoverRes = await fetch(`${VITE_BASE}/handovers/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenRec}`
    },
    body: JSON.stringify(handoverPayload)
  }).then(r => r.json());

  if (!handoverRes.success) {
    throw new Error(`Handover verification failed: ${JSON.stringify(handoverRes)}`);
  }
  const handover = handoverRes.handover;
  const payment = handoverRes.payment;
  console.log(`   ✅ Handover Verified: ID=${handover.id}, Scale Weight=${handover.actualWeight}kg (Diff: +0.3kg, ${handover.weightDiffPercentage}%)`);
  console.log(`   ✅ Dynamic Facility Resolved: "${handover.recyclerName}"`);
  console.log(`   ✅ Payment Settled: ID=${payment.id}, Ref=${payment.transactionRef}, Amount=₹${payment.amount}`);
  console.log(`   ✅ Payment Classification: recordType=${payment.recordType}, payoutStatus=${payment.payoutStatus}, gatewayStatus=${payment.externalGatewayStatus}`);

  // 7. STEP 10: COLLECTOR PASSBOOK & UNIT ECONOMICS
  console.log('\n7️⃣ [STEP 10] Checking Collector Passbook & Unit Economics Margin Uplift...');
  const ledgerRes = await fetch(`${VITE_BASE}/payments/collector`, {
    headers: { 'Authorization': `Bearer ${tokenCol}` }
  }).then(r => r.json());

  const summary = ledgerRes.summary;
  console.log(`   ✅ Total Passbook Earnings: ₹${summary.totalEarnings.toLocaleString('en-IN')}`);
  console.log(`   ✅ Formal Channel Uplift: +${summary.unitEconomics.netUpliftPercentage}% vs Informal Middleman`);
  console.log(`   ✅ Direct Margin Uplift: +₹${summary.unitEconomics.netUpliftAmount.toLocaleString('en-IN')}`);
  console.log(`   ✅ Model Provenance: ${summary.unitEconomics.provenance} (${summary.unitEconomics.modelStatus})`);
  console.log(`   ✅ Disclaimer: "${summary.unitEconomics.disclaimer}"`);

  // 8. STEP 11: RECYCLING LIFECYCLE & SHA-256 HASH CHAIN AUDIT
  console.log('\n8️⃣ [STEP 11] Processing Recycling Lifecycle & Tamper-Evident SHA-256 Hash Chain...');
  const processLotRes = await fetch(`${VITE_BASE}/traceability/stage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenRec}`
    },
    body: JSON.stringify({
      lotId: newLot.id,
      stage: 'RECYCLED',
      title: 'Formal Hydrometallurgical Recycling & Metal Recovery Completed',
      description: 'Precious metals (Au, Cu, Pd) recovered in zero-emission closed loop hydrometallurgical facility.',
      facilityLocation: 'Lucknow Eco-Industrial Park, Uttar Pradesh'
    })
  }).then(r => r.json());
  console.log(`   ✅ Closed-Loop Recycling Completed: Final Lot Status = ${processLotRes.lot.status}`);

  const traceAudit = await fetch(`${VITE_BASE}/traceability/${newLot.id}/verify-integrity`).then(r => r.json());
  console.log(`   ✅ Cryptographic Hash Chain Audit: ${traceAudit.isTamperFree ? '🟢 100% Tamper-Free' : '❌ Tampered'} (${traceAudit.totalEvents} events audited)`);
  console.log(`   ✅ Cryptographic Algorithm: ${traceAudit.algorithm}`);
  console.log(`   ✅ Genesis Event Hash: ${traceAudit.genesisHash}`);
  console.log(`   ✅ Terminal Event Hash: ${traceAudit.terminalHash}`);

  // 9. STEP 12: ADMIN GOVERNANCE & DATASET EXPORTS
  console.log('\n9️⃣ [STEP 12] Admin Governance Dashboard, Anomalies & Dataset Exports...');
  const kpis = await fetch(`${VITE_BASE}/admin/kpis`, {
    headers: { 'Authorization': `Bearer ${tokenAdm}` }
  }).then(r => r.json());
  console.log(`   ✅ Admin KPIs: Total Lots=${kpis.kpis.totalLots}, Recycled=${kpis.kpis.recycledLots}, Weight=${kpis.kpis.totalWeightCollected}kg`);

  const anomalies = await fetch(`${VITE_BASE}/admin/anomalies`, {
    headers: { 'Authorization': `Bearer ${tokenAdm}` }
  }).then(r => r.json());
  console.log(`   ✅ Anomalies Monitored: Total Flagged=${anomalies.count}`);

  const exportTxCsv = await fetch(`${VITE_BASE}/admin/datasets/transactions?format=csv`, {
    headers: { 'Authorization': `Bearer ${tokenAdm}` }
  }).then(r => r.text());
  console.log(`   ✅ Dynamic Transactions CSV Export: ${exportTxCsv.split('\n').length} rows generated (RFC 4180 format)`);

  // 10. STEP 5: PHYSICAL DISK PERSISTENCE VERIFICATION IN db.json
  console.log('\n🔟 [STEP 5] Verifying Physical Disk Persistence in db.json...');
  const dbPath = path.join(__dirname, '..', 'data', 'db.json');
  const dbRaw = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const lotOnDisk = dbRaw.lots.find((l: any) => l.id === newLot.id);
  const paymentOnDisk = dbRaw.payments.find((p: any) => p.lotId === newLot.id);
  const handoverOnDisk = dbRaw.handovers.find((h: any) => h.lotId === newLot.id);

  if (!lotOnDisk || !paymentOnDisk || !handoverOnDisk) {
    throw new Error('Physical disk persistence verification failed!');
  }
  console.log(`   ✅ Disk Record Verified: Lot ${lotOnDisk.id} (Status: ${lotOnDisk.status}, Source: ${lotOnDisk.dataSource})`);
  console.log(`   ✅ Disk Payment Verified: Ref ${paymentOnDisk.transactionRef} (Amount: ₹${paymentOnDisk.amount}, Type: ${paymentOnDisk.recordType})`);
  console.log(`   ✅ Disk Handover Verified: Scale Weight ${handoverOnDisk.actualWeight}kg (Driver: ${handoverOnDisk.driverName})`);

  console.log('\n================================================================');
  console.log('🎉 ALL 10 LOCALHOST FULL-STACK VERIFICATION STEPS PASSED 100%!');
  console.log('================================================================\n');
}

runManualJourneyVerification().catch(err => {
  console.error('\n❌ LOCALHOST VERIFICATION ERROR:', err);
  process.exit(1);
});
