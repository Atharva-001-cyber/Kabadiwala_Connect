import fs from 'fs';
import path from 'path';

const BASE = 'http://127.0.0.1:5000/api';

async function runJudgeDemoJourney() {
  console.log('================================================================');
  console.log('⚖️ SIH 2026 PS #229: COMPLETE END-TO-END JUDGE DEMO JOURNEY');
  console.log('   "Bringing the Informal Collector into the Formal Recycling Chain"');
  console.log('================================================================\n');

  // STAGE 1: COLLECTOR ONBOARDING & AUTHENTICATION
  console.log('1️⃣ [STAGE 1] Collector Onboarding & Truthful Demo Authentication...');
  const otpRes = await fetch(`${BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210' })
  }).then(r => r.json());
  console.log(`   ✅ Demo OTP Issued: ${otpRes.demoOtp} (Mode: ${otpRes.deliveryMode})`);

  const colLogin = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210', otp: '1234' })
  }).then(r => r.json());
  const tokenCollector = colLogin.token;
  const collector = colLogin.collectorProfile;
  console.log(`   ✅ Collector Logged In: ${collector.name} (${collector.phone}), District: ${collector.district}`);

  // STAGE 2: MANDI BENCHMARK PRICE DISCOVERY
  console.log('\n2️⃣ [STAGE 2] Transparent Price Board & Multi-Lingual Audio...');
  const priceBoard = await fetch(`${BASE}/prices/board?district=Lucknow`).then(r => r.json());
  if (!priceBoard.success || priceBoard.prices.length === 0) {
    throw new Error('Failed to fetch daily price board');
  }
  const pcbRate = priceBoard.prices.find((p: any) => p.materialCategory === 'PCB');
  console.log(`   ✅ Daily Mandi Rate for PCB: ₹${pcbRate.prevailingBuyPrice}/kg (Trend: ${pcbRate.trend})`);
  console.log(`   ✅ Hindi Audio Script: "${pcbRate.audioText?.hi || pcbRate.audioHindi}"`);

  // STAGE 3: DIGITAL E-WASTE LOT CREATION
  console.log('\n3️⃣ [STAGE 3] 5-Step Low-Literacy Digital Lot Creation...');
  const lotPayload = {
    materialCategory: 'PCB',
    subCategory: 'Computer Motherboards & Telecom Cards',
    description: 'Collected from IT park refurbishers during morning round',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
    approxWeight: 18.5,
    condition: 'INTACT',
    sourceType: 'COMMERCIAL',
    locationDistrict: 'Lucknow',
    locationState: 'Uttar Pradesh',
    latitude: 26.8489,
    longitude: 80.9421,
    locationSource: 'DEVICE_GPS'
  };

  const createLotRes = await fetch(`${BASE}/lots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenCollector}`
    },
    body: JSON.stringify(lotPayload)
  }).then(r => r.json());

  if (!createLotRes.success || !createLotRes.lot) {
    throw new Error('Lot creation failed');
  }
  const judgeLot = createLotRes.lot;
  console.log(`   ✅ Digital Lot Created: ID=${judgeLot.id}, Weight=${judgeLot.approxWeight}kg`);
  console.log(`   ✅ Automatic Handover OTP Generated: "${judgeLot.handoverOtp}"`);
  console.log(`   ✅ Benchmark Estimated Range: ₹${judgeLot.estimatedValueMin} – ₹${judgeLot.estimatedValueMax}`);
  console.log(`   ✅ Provenance Data Tag: ${judgeLot.dataSource}`);

  // STAGE 4: RECYCLER MATCHING & EXPLAINABLE MCDA SCORING
  console.log('\n4️⃣ [STAGE 4] CPCB Authorized Recycler Matching & MCDA Points...');
  const matchingRes = await fetch(
    `${BASE}/recyclers?materialCategory=PCB&district=Lucknow&lotId=${judgeLot.id}&collectorLat=26.8489&collectorLng=80.9421`
  ).then(r => r.json());

  if (!matchingRes.success || matchingRes.count === 0) {
    throw new Error('No compatible recyclers matched');
  }
  const matchedRecycler = matchingRes.recyclers[0];
  console.log(`   ✅ Recommended Facility: ${matchedRecycler.facilityName} (${matchedRecycler.registrationNo})`);
  console.log(`   ✅ MCDA Match Score: ${matchedRecycler.matchScore}/100 (${matchedRecycler.rankingExplanation.method})`);
  console.log(`   ✅ Haversine GPS Distance: ~${matchedRecycler.estimatedDistanceKm} km`);
  console.log(`   ✅ Logistics Option A: Doorstep Pickup (₹${matchedRecycler.pickupVsSelfDelivery.doorstepPickup.transportCostDeduction} transport deduction)`);

  // STAGE 5: DIRECT PURCHASE QUOTE GENERATION
  console.log('\n5️⃣ [STAGE 5] Formal Purchase Quote Request from Facility...');
  const quoteRes = await fetch(`${BASE}/offers/request-quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenCollector}`
    },
    body: JSON.stringify({
      lotId: judgeLot.id,
      recyclerId: matchedRecycler.id
    })
  }).then(r => r.json());

  if (!quoteRes.success || !quoteRes.offer) {
    throw new Error('Quote request failed');
  }
  const formalQuote = quoteRes.offer;
  console.log(`   ✅ Formal Quote Generated: ID=${formalQuote.id}, Rate=₹${formalQuote.offeredRatePerKg}/kg, Total=₹${formalQuote.totalOfferedPrice}`);

  // STAGE 6: SIDE-BY-SIDE OFFER COMPARISON & 1-TAP ACCEPTANCE
  console.log('\n6️⃣ [STAGE 6] Side-by-Side Offer Comparison & 1-Tap Acceptance...');
  const compareRes = await fetch(`${BASE}/offers/compare/${judgeLot.id}`).then(r => r.json());
  const bestBid = compareRes.offers.find((o: any) => o.isBestPrice) || formalQuote;
  console.log(`   ✅ Best Price Offer Verified: ₹${bestBid.offeredRatePerKg}/kg from ${bestBid.recyclerName}`);

  const acceptRes = await fetch(`${BASE}/offers/${bestBid.id}/accept`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenCollector}`
    }
  }).then(r => r.json());

  if (!acceptRes.success || acceptRes.lot.status !== 'ACCEPTED') {
    throw new Error('Offer acceptance failed');
  }
  console.log(`   ✅ Offer Accepted! Lot ${acceptRes.lot.id} status changed to ACCEPTED.`);

  // STAGE 7: DOORSTEP LOGISTICS PICKUP BOOKING
  console.log('\n7️⃣ [STAGE 7] Doorstep Logistics Pickup Booking...');
  const recLogin = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9123456780', otp: '123456', selectedRole: 'RECYCLER' })
  }).then(r => r.json());
  const tokenRecycler = recLogin.token;

  const pickupRes = await fetch(`${BASE}/pickups/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenRecycler}`
    },
    body: JSON.stringify({
      lotId: judgeLot.id,
      driverName: 'Suresh Yadav',
      driverContact: '9871122334',
      vehicleNumber: 'UP-32-BZ-4412',
      timeSlot: '11:00 AM - 02:00 PM'
    })
  }).then(r => r.json());

  if (!pickupRes.success || pickupRes.lot.status !== 'PICKUP_SCHEDULED') {
    throw new Error('Pickup scheduling failed');
  }
  console.log(`   ✅ Pickup Scheduled: Driver=${pickupRes.pickup.driverName}, Vehicle=${pickupRes.pickup.vehicleNumber}`);

  // STAGE 8: CALIBRATED ELECTRONIC SCALE HANDOVER WITH OTP
  console.log('\n8️⃣ [STAGE 8] Calibrated Electronic Scale Handover Verification...');
  const handoverRes = await fetch(`${BASE}/handovers/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenRecycler}`
    },
    body: JSON.stringify({
      lotId: judgeLot.id,
      actualWeight: 18.7, // 18.7kg vs approx 18.5kg
      handoverOtp: judgeLot.handoverOtp,
      paymentMethod: 'UPI',
      driverName: 'Suresh Yadav',
      latitude: 26.8489,
      longitude: 80.9421,
      locationSource: 'DEVICE_GPS'
    })
  }).then(r => r.json());

  if (!handoverRes.success || !handoverRes.payment) {
    throw new Error('Handover verification failed');
  }
  const paymentVoucher = handoverRes.payment;
  console.log(`   ✅ Handover Verified: ID=${handoverRes.handover.id}`);
  console.log(`   ✅ Calibrated Scale Weight: ${handoverRes.handover.actualWeight}kg (Scale Diff: +0.2kg)`);
  console.log(`   ✅ Dynamic Facility Linked: "${paymentVoucher.recyclerName}"`);
  console.log(`   ✅ Digital Ledger Voucher: ID=${paymentVoucher.id}, Ref=${paymentVoucher.transactionRef}, Settled=₹${paymentVoucher.amount}`);
  console.log(`   ✅ Payment Classification: ${paymentVoucher.recordType} (External Gateway: ${paymentVoucher.externalGatewayStatus})`);

  // STAGE 9: COLLECTOR EARNINGS PASSBOOK & UNIT ECONOMICS
  console.log('\n9️⃣ [STAGE 9] Collector Financial Ledger Passbook & Unit Economics...');
  const ledgerRes = await fetch(`${BASE}/payments/collector`, {
    headers: { 'Authorization': `Bearer ${tokenCollector}` }
  }).then(r => r.json());

  if (!ledgerRes.success) {
    throw new Error('Failed to fetch collector ledger');
  }
  const summary = ledgerRes.summary;
  console.log(`   ✅ Collector Total Lifetime Earnings: ₹${summary.totalEarnings.toLocaleString('en-IN')}`);
  console.log(`   ✅ Completed Formal Transactions: ${summary.completedTransactionsCount}`);
  console.log(`   ✅ Unit Economics Uplift: +${summary.unitEconomics.netUpliftPercentage}% net increase vs informal middleman`);
  console.log(`   ✅ Pocket Margin Increase: +₹${summary.unitEconomics.netUpliftAmount.toLocaleString('en-IN')}`);

  // STAGE 10: RECYCLING LIFECYCLE PROGRESSION (FORM-6 CERTIFICATION)
  console.log('\n🔟 [STAGE 10] Factory Hydrometallurgical Recycling Lifecycle...');
  const cycleRes = await fetch(`${BASE}/traceability/stage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenRecycler}`
    },
    body: JSON.stringify({
      lotId: judgeLot.id,
      stage: 'RECYCLED',
      title: 'Formal Hydrometallurgical Recycling & Metal Recovery Completed',
      description: 'Precious metals (Au, Cu, Pd) recovered in zero-emission closed loop hydrometallurgical facility.',
      facilityLocation: 'Lucknow Eco-Industrial Park, Uttar Pradesh'
    })
  }).then(r => r.json());

  if (!cycleRes.success || cycleRes.lot.status !== 'RECYCLED') {
    throw new Error('Recycling lifecycle progression failed');
  }
  console.log(`   ✅ Closed-Loop Recycling Completed: Final Lot Status is RECYCLED.`);

  // STAGE 11: CRYPTOGRAPHIC SHA-256 MERKLE DAG TRACEABILITY AUDIT
  console.log('\n1️⃣1️⃣ [STAGE 11] Cryptographic SHA-256 Merkle DAG Hash Chain Audit...');
  const traceAudit = await fetch(`${BASE}/traceability/${judgeLot.id}/verify-integrity`).then(r => r.json());
  if (!traceAudit.success || !traceAudit.isTamperFree) {
    throw new Error('Traceability audit failed');
  }
  console.log(`   ✅ Cryptographic Hash Chain Audit: 🟢 100% Tamper-Free (${traceAudit.totalEvents} events audited)`);
  console.log(`   ✅ Cryptographic Hash Algorithm: ${traceAudit.algorithm}`);

  // STAGE 12: CPCB EPR DYNAMIC DATASET CSV EXPORT
  console.log('\n1️⃣2️⃣ [STAGE 12] CPCB EPR Dynamic Dataset CSV Export...');
  const csvRes = await fetch(`${BASE}/admin/datasets/transactions?format=csv`);
  const csvText = await csvRes.text();
  const csvContentType = csvRes.headers.get('content-type');
  if (!csvContentType?.includes('text/csv') || !csvText.includes(',')) {
    throw new Error('EPR CSV export failed');
  }
  console.log(`   ✅ CPCB EPR CSV Dataset Export Verified: Valid comma-separated transaction records.`);

  console.log('\n================================================================');
  console.log('🎉 COMPLETE 12-STAGE SIH JUDGE DEMO JOURNEY PASSED 100% SUCCESSFULLY!');
  console.log('================================================================\n');
}

runJudgeDemoJourney().catch(err => {
  console.error('❌ Judge Demo Journey Verification Failed:', err);
  process.exit(1);
});
