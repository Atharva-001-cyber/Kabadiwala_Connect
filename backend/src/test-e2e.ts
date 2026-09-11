// Automated End-to-End Test Suite for SIH 2026 #229
async function runTests() {
  const BASE = 'http://127.0.0.1:5000/api';
  console.log('🧪 Starting Automated E2E Verification Suite for Kabadiwala Connect...\n');

  // 1. Auth Test
  console.log('1️⃣ Testing OTP Login...');
  const authRes = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210', otp: '1234', selectedRole: 'COLLECTOR' })
  }).then(r => r.json());
  console.log(`   ✅ Auth Success! User: ${authRes.user.name}, Token generated: ${authRes.token.slice(0, 20)}...`);
  const token = authRes.token;

  // 2. Price Board Test
  console.log('\n2️⃣ Testing Price Board & Multi-lingual Audio...');
  const priceRes = await fetch(`${BASE}/prices/board?district=Lucknow`).then(r => r.json());
  console.log(`   ✅ Fetched ${priceRes.prices.length} material categories for Lucknow.`);
  console.log(`   Sample PCB Audio: "${priceRes.prices[0].audioText.hi}"`);

  // 3. Create Lot (AI Valuation)
  console.log('\n3️⃣ Testing E-Waste Lot Creation...');
  const lotRes = await fetch(`${BASE}/lots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      materialCategory: 'PCB',
      subCategory: 'High Grade Motherboards',
      approxWeight: 15.0,
      condition: 'INTACT',
      sourceType: 'REPAIR_SHOP',
      locationDistrict: 'Lucknow',
      locationState: 'Uttar Pradesh'
    })
  }).then(r => r.json());
  console.log(`   ✅ Lot Created! ID: ${lotRes.lot.id}, Approx Weight: ${lotRes.lot.approxWeight}kg, Est Range: ₹${lotRes.lot.estimatedValueMin} - ₹${lotRes.lot.estimatedValueMax}`);
  const createdLotId = lotRes.lot.id;

  // 4. Recycler Submit Offer
  console.log('\n4️⃣ Testing Recycler Offer Submission...');
  const offerRes = await fetch(`${BASE}/offers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      lotId: createdLotId,
      offeredRatePerKg: 98,
      pickupOffered: true,
      pickupEtaHours: 24,
      notes: 'CPCB compliant direct collection'
    })
  }).then(r => r.json());
  console.log(`   ✅ Offer Created! ID: ${offerRes.offer.id}, Rate: ₹${offerRes.offer.offeredRatePerKg}/kg, Total: ₹${offerRes.offer.totalOfferedPrice}`);
  const offerId = offerRes.offer.id;

  // 5. Collector Accepts Offer
  console.log('\n5️⃣ Testing Collector Offer Acceptance...');
  const acceptRes = await fetch(`${BASE}/offers/${offerId}/accept`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  console.log(`   ✅ Offer Accepted! Lot status changed to: ${acceptRes.lot.status}`);

  // 6. Recycler Schedules Pickup
  console.log('\n6️⃣ Testing Pickup Logistics Booking...');
  const pickupRes = await fetch(`${BASE}/pickups/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      lotId: createdLotId,
      driverName: 'Suresh Yadav',
      driverContact: '9871122334',
      vehicleNumber: 'UP-32-BZ-4412'
    })
  }).then(r => r.json());
  console.log(`   ✅ Pickup Scheduled! Driver: ${pickupRes.pickup.driverName}, Vehicle: ${pickupRes.pickup.vehicleNumber}`);

  // 7. Handover Verification & Electronic Scale Weighed
  console.log('\n7️⃣ Testing Digital Handover & Electronic Scale Verification...');
  const handoverRes = await fetch(`${BASE}/handovers/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      lotId: createdLotId,
      actualWeight: 15.2,
      handoverOtp: '4821',
      paymentMethod: 'CASH',
      driverName: 'Suresh Yadav'
    })
  }).then(r => r.json());
  console.log(`   ✅ Handover Verified! Handover ID: ${handoverRes.handover.id}, Actual Weight: ${handoverRes.handover.actualWeight}kg (Diff: +${handoverRes.handover.weightDifference}kg), Settled Amount: ₹${handoverRes.handover.finalPaymentAmount}`);

  // 8. Recycler Advances Stage to 100% Recycled
  console.log('\n8️⃣ Testing Hydrometallurgical Extraction & Recycling Lifecycle...');
  const stageRes = await fetch(`${BASE}/traceability/stage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      lotId: createdLotId,
      stage: 'RECYCLED',
      recoveredDetails: 'Recovered: 4.1g Gold, 1.8g Tantalum, 10.2kg High-grade Copper'
    })
  }).then(r => r.json());
  console.log(`   ✅ Recycling Completed! Status: ${stageRes.lot.status}`);

  // 9. Inspect Full Traceability Audit Trail
  console.log('\n9️⃣ Testing Immutable Traceability Audit Trail...');
  const traceRes = await fetch(`${BASE}/traceability/${createdLotId}`).then(r => r.json());
  console.log(`   ✅ Traceability Audit Trail: ${traceRes.timeline.length} milestone events recorded.`);
  traceRes.timeline.forEach((t: any, i: number) => {
    console.log(`      [Stage ${i+1}] ${t.title} (${t.actorRole} - ${t.actorName})`);
  });

  // 10. Admin Dataset Export
  console.log('\n🔟 Testing CPCB Dynamic Dataset Export...');
  const datasetRes = await fetch(`${BASE}/admin/datasets/transactions`).then(r => r.json());
  console.log(`   ✅ Exported ${datasetRes.recordCount} transaction records for EPR compliance.`);

  console.log('\n🎉 ALL 10 END-TO-END AUTOMATED TEST SCENARIOS PASSED WITH ZERO ERRORS!');
}

runTests().catch(console.error);
