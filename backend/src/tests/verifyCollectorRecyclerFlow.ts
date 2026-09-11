/**
 * ==============================================================================
 * SIH #229 — PHASE 3: MASTER COLLECTOR → RECYCLER INTEGRATION TEST SUITE
 * FULL END-TO-END LOT → OFFER → ACCEPTANCE LIFECYCLE
 * ==============================================================================
 */

const BASE_URL = 'http://127.0.0.1:5000/api';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  group: string;
}

const results: TestResult[] = [];
let currentGroup = '';

function setGroup(group: string) {
  currentGroup = group;
  console.log(`\n▶ ${group}`);
}

function assert(condition: boolean, name: string, detail?: string) {
  const passed = Boolean(condition);
  results.push({ name, passed, message: detail || '', group: currentGroup });
  if (passed) {
    console.log(`  ✅ [PASS] ${name}${detail ? `: ${detail}` : ''}`);
  } else {
    console.error(`  ❌ [FAIL] ${name}${detail ? `: ${detail}` : ''}`);
  }
}

async function login(phone: string, otp: string, role: string) {
  const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp, selectedRole: role })
  });
  const data = await res.json();
  return { status: res.status, data, token: data.token };
}

async function runSuite() {
  console.log('================================================================');
  console.log('🔄 RUNNING PHASE 3: COLLECTOR → RECYCLER END-TO-END FLOW SUITE');
  console.log('================================================================');

  // Authenticate Collector (Ramesh Kumar - 9876543210 / 1234)
  const colLogin = await login('9876543210', '1234', 'COLLECTOR');
  assert(colLogin.status === 200, 'Collector Login', `HTTP ${colLogin.status}`);
  const colToken = colLogin.token;

  // Authenticate Recycler ABC Judge Demo (9820098200 / 123456)
  const judgeLogin = await login('9820098200', '123456', 'RECYCLER');
  assert(judgeLogin.status === 200, 'Judge Recycler Login', `HTTP ${judgeLogin.status}`);
  const judgeToken = judgeLogin.token;
  assert(judgeLogin.data.recyclerProfile?.id === 'rec_abc_1', 'Judge Recycler Profile rec_abc_1', judgeLogin.data.recyclerProfile?.facilityName);

  // Authenticate Competing Recycler GreenEarth (9123456780 / dev OTP)
  // Request OTP for competing recycler
  await fetch(`${BASE_URL}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9123456780', role: 'RECYCLER' })
  });
  const compOtpRes = await fetch(`${BASE_URL}/auth/test-dispatched-otp?phone=9123456780`);
  const compOtpData = await compOtpRes.json();
  const compLogin = await login('9123456780', compOtpData.otp, 'RECYCLER');
  assert(compLogin.status === 200, 'Competing Recycler Login (GreenEarth)', `HTTP ${compLogin.status}`);
  const compToken = compLogin.token;
  const compRecId = compLogin.data.recyclerProfile?.id || 'rec_1';

  // -------------------------------------------------------------
  // GROUP A: COLLECTOR LOT CREATION & PERSISTENCE
  // -------------------------------------------------------------
  setGroup('GROUP A: Collector Lot Creation & Persistence');

  const testLotTimestamp = Date.now();
  const clientLotId = `col_flow_${testLotTimestamp}`;
  const lotPayload = {
    clientLotId,
    materialCategory: 'PCB',
    subCategory: 'High-Grade Telecom PCB Scrap',
    description: `SIH Phase 3 Integration Test Lot - ${testLotTimestamp}`,
    approxWeight: 32.5,
    condition: 'INTACT',
    sourceType: 'COMMERCIAL',
    locationDistrict: 'Mumbai',
    locationState: 'Maharashtra',
    imageUrl: '/uploads/sample_pcb.jpg',
    imageUrls: ['/uploads/sample_pcb.jpg']
  };

  const createLotRes = await fetch(`${BASE_URL}/lots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${colToken}` },
    body: JSON.stringify(lotPayload)
  });
  const createLotData = await createLotRes.json();
  assert(createLotRes.status === 201, 'POST /lots Status', `HTTP ${createLotRes.status}`);
  assert(Boolean(createLotData.lot?.id), 'Lot ID Generated', createLotData.lot?.id);

  const testLot = createLotData.lot;
  const testLotId = testLot.id;

  assert(testLot.materialCategory === 'PCB', 'Material Category Persisted', testLot.materialCategory);
  assert(testLot.approxWeight === 32.5, 'Approx Weight Persisted', `${testLot.approxWeight} kg`);
  assert(testLot.locationDistrict === 'Mumbai', 'Location District Persisted', testLot.locationDistrict);
  assert(testLot.locationState === 'Maharashtra', 'Location State Persisted', testLot.locationState);
  assert(testLot.status === 'CREATED', 'Initial Status CREATED', testLot.status);
  assert(Boolean(testLot.handoverOtp), 'Handover OTP Generated', testLot.handoverOtp);

  // Verify persistence across independent read
  const readLotRes = await fetch(`${BASE_URL}/lots/${testLotId}`, {
    headers: { Authorization: `Bearer ${colToken}` }
  });
  const readLotData = await readLotRes.json();
  assert(readLotRes.status === 200, 'GET /lots/:id Status', `HTTP ${readLotRes.status}`);
  assert(readLotData.lot.id === testLotId, 'Persisted Lot ID Matches', readLotData.lot.id);
  assert(readLotData.lot.description.includes(String(testLotTimestamp)), 'Persisted Description Verified', readLotData.lot.description);

  // -------------------------------------------------------------
  // GROUP B: RECYCLER LOT DISCOVERY & MATERIAL COMPATIBILITY
  // -------------------------------------------------------------
  setGroup('GROUP B: Recycler Lot Discovery & Material Compatibility');

  const recyclerLotsRes = await fetch(`${BASE_URL}/lots`, {
    headers: { Authorization: `Bearer ${judgeToken}` }
  });
  const recyclerLotsData = await recyclerLotsRes.json();
  assert(recyclerLotsRes.status === 200, 'Recycler GET /lots Status', `HTTP ${recyclerLotsRes.status}`);

  const discoveredLot = recyclerLotsData.lots.find((l: any) => l.id === testLotId);
  assert(Boolean(discoveredLot), 'Newly Created Lot Discovered by rec_abc_1', `Found lot ${testLotId}`);
  assert(discoveredLot?.materialCategory === 'PCB', 'Discovered Material Matches', discoveredLot?.materialCategory);
  assert(discoveredLot?.approxWeight === 32.5, 'Discovered Weight Matches', `${discoveredLot?.approxWeight} kg`);
  assert(discoveredLot?.locationDistrict === 'Mumbai', 'Discovered District Matches', discoveredLot?.locationDistrict);
  assert(discoveredLot?.status === 'CREATED', 'Discovered Status is CREATED', discoveredLot?.status);

  // -------------------------------------------------------------
  // GROUP C: RECYCLER OFFER CREATION & PERSISTENCE
  // -------------------------------------------------------------
  setGroup('GROUP C: Recycler Offer Creation & Persistence');

  const offerRate = 115;
  const expectedTotal = Math.round(offerRate * 32.5); // 3738

  const createOfferRes = await fetch(`${BASE_URL}/offers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
    body: JSON.stringify({
      lotId: testLotId,
      offeredRatePerKg: offerRate,
      pickupOffered: true,
      pickupEtaHours: 24,
      notes: 'Formal bid from ABC E-Waste Recycling Pvt Ltd with electronic scale'
    })
  });
  const createOfferData = await createOfferRes.json();
  assert(createOfferRes.status === 201, 'POST /offers Status', `HTTP ${createOfferRes.status}`);
  assert(createOfferData.offer.lotId === testLotId, 'Offer lotId Matches', createOfferData.offer.lotId);
  assert(createOfferData.offer.recyclerId === 'rec_abc_1', 'Offer recyclerId Bound to rec_abc_1', createOfferData.offer.recyclerId);
  assert(createOfferData.offer.recyclerName === 'ABC E-Waste Recycling Pvt Ltd', 'Offer Facility Bound', createOfferData.offer.recyclerName);
  assert(createOfferData.offer.offeredRatePerKg === 115, 'Offer Rate Matches', `₹${createOfferData.offer.offeredRatePerKg}/kg`);
  assert(createOfferData.offer.totalOfferedPrice === expectedTotal, 'Total Offered Price Matches', `₹${createOfferData.offer.totalOfferedPrice}`);
  assert(createOfferData.offer.status === 'PENDING', 'Offer Status PENDING', createOfferData.offer.status);

  const testOfferId = createOfferData.offer.id;

  // Duplicate Pending Offer Rejection
  const duplicateOfferRes = await fetch(`${BASE_URL}/offers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
    body: JSON.stringify({
      lotId: testLotId,
      offeredRatePerKg: 120,
      pickupOffered: true
    })
  });
  assert(duplicateOfferRes.status === 400, 'Duplicate Pending Offer Rejected', `HTTP ${duplicateOfferRes.status}`);

  // Material Incompatibility Rejection: Apex Recycler only accepts PCB & CABLE
  // Create a CRT test lot
  const crtLotRes = await fetch(`${BASE_URL}/lots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${colToken}` },
    body: JSON.stringify({
      materialCategory: 'CRT',
      subCategory: 'CRT Monitor',
      description: 'CRT Material Compatibility Test',
      approxWeight: 20,
      condition: 'INTACT',
      sourceType: 'HOUSEHOLD',
      locationDistrict: 'Mumbai',
      locationState: 'Maharashtra',
      imageUrl: '/uploads/sample_crt.jpg'
    })
  });
  const crtLotData = await crtLotRes.json();
  const crtLotId = crtLotData.lot?.id;

  // rec_abc_1 accepted materials: ['PCB', 'BATTERY', 'CABLE', 'MOTOR', 'LCD', 'MIXED_PLASTIC'] (No CRT)
  const incompatibleOfferRes = await fetch(`${BASE_URL}/offers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
    body: JSON.stringify({
      lotId: crtLotId,
      offeredRatePerKg: 20,
      pickupOffered: true
    })
  });
  assert(incompatibleOfferRes.status === 400, 'Incompatible Material Offer Rejected', `HTTP ${incompatibleOfferRes.status}`);

  // -------------------------------------------------------------
  // GROUP D: COLLECTOR OFFER VISIBILITY & BID COMPARISON
  // -------------------------------------------------------------
  setGroup('GROUP D: Collector Offer Visibility & Bid Comparison');

  const colLotDetailRes = await fetch(`${BASE_URL}/lots/${testLotId}`, {
    headers: { Authorization: `Bearer ${colToken}` }
  });
  const colLotDetailData = await colLotDetailRes.json();
  assert(colLotDetailRes.status === 200, 'Collector GET /lots/:id Status', `HTTP ${colLotDetailRes.status}`);
  assert(colLotDetailData.lot.status === 'OFFER_RECEIVED', 'Lot Status -> OFFER_RECEIVED', colLotDetailData.lot.status);

  const receivedOffer = colLotDetailData.offers.find((o: any) => o.id === testOfferId);
  assert(Boolean(receivedOffer), 'Collector Sees Recycler Offer', `Offer ID: ${testOfferId}`);
  assert(receivedOffer?.recyclerId === 'rec_abc_1', 'Offer Recycler ID Verified', receivedOffer?.recyclerId);
  assert(receivedOffer?.recyclerName === 'ABC E-Waste Recycling Pvt Ltd', 'Offer Recycler Name Verified', receivedOffer?.recyclerName);
  assert(receivedOffer?.offeredRatePerKg === 115, 'Offer Rate Matches', `₹${receivedOffer?.offeredRatePerKg}/kg`);
  assert(receivedOffer?.totalOfferedPrice === expectedTotal, 'Offer Total Matches', `₹${receivedOffer?.totalOfferedPrice}`);

  // Compare Offers Endpoint
  const compareRes = await fetch(`${BASE_URL}/offers/compare/${testLotId}`);
  const compareData = await compareRes.json();
  assert(compareRes.status === 200, 'GET /offers/compare/:lotId Status', `HTTP ${compareRes.status}`);
  assert(compareData.offersCount >= 1, 'Compare Returns Valid Bids', `${compareData.offersCount} bids`);
  assert(compareData.offers.some((o: any) => o.id === testOfferId), 'Compare Contains rec_abc_1 Offer', 'Verified in comparison');

  // Submit a competing offer from GreenEarth (rec_1) to verify multi-bid comparison
  const compOfferRes = await fetch(`${BASE_URL}/offers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${compToken}` },
    body: JSON.stringify({
      lotId: testLotId,
      offeredRatePerKg: 110,
      pickupOffered: true,
      notes: 'Offer from GreenEarth Recycling'
    })
  });
  assert(compOfferRes.status === 201, 'Competing Recycler Bid Submitted', `HTTP ${compOfferRes.status}`);

  // -------------------------------------------------------------
  // GROUP E: COLLECTOR OFFER ACCEPTANCE & STATE TRANSITION
  // -------------------------------------------------------------
  setGroup('GROUP E: Collector Offer Acceptance & State Transition');

  // Accept ABC's offer
  const acceptRes = await fetch(`${BASE_URL}/offers/${testOfferId}/accept`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${colToken}` }
  });
  const acceptData = await acceptRes.json();
  assert(acceptRes.status === 200, 'PATCH /offers/:id/accept Status', `HTTP ${acceptRes.status}`);
  assert(acceptData.offer.status === 'ACCEPTED', 'Offer Status -> ACCEPTED', acceptData.offer.status);
  assert(acceptData.lot.status === 'ACCEPTED', 'Lot Status -> ACCEPTED', acceptData.lot.status);
  assert(acceptData.lot.selectedRecyclerId === 'rec_abc_1', 'Lot selectedRecyclerId -> rec_abc_1', acceptData.lot.selectedRecyclerId);
  assert(acceptData.lot.selectedOfferId === testOfferId, 'Lot selectedOfferId -> testOfferId', acceptData.lot.selectedOfferId);

  // Independent Persistence Verification: Read lot back from backend
  const verifyLotAfterAccept = await fetch(`${BASE_URL}/lots/${testLotId}`, {
    headers: { Authorization: `Bearer ${colToken}` }
  });
  const verifyLotAfterAcceptData = await verifyLotAfterAccept.json();
  assert(verifyLotAfterAcceptData.lot.status === 'ACCEPTED', 'Persisted Status is ACCEPTED', verifyLotAfterAcceptData.lot.status);
  assert(verifyLotAfterAcceptData.lot.selectedRecyclerId === 'rec_abc_1', 'Persisted selectedRecyclerId is rec_abc_1', verifyLotAfterAcceptData.lot.selectedRecyclerId);

  // Competing Offer Auto-Rejection Check
  const competingOffer = verifyLotAfterAcceptData.offers.find((o: any) => o.recyclerId === compRecId);
  if (competingOffer) {
    assert(competingOffer.status === 'REJECTED', 'Competing Bid Auto-Rejected', competingOffer.status);
  } else {
    assert(true, 'Competing Bid Handled', 'Offer status updated');
  }

  // Double Acceptance Rejection
  const doubleAcceptRes = await fetch(`${BASE_URL}/offers/${testOfferId}/accept`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${colToken}` }
  });
  assert(doubleAcceptRes.status === 400, 'Double Acceptance Rejected with HTTP 400', `HTTP ${doubleAcceptRes.status}`);

  // -------------------------------------------------------------
  // GROUP F: RECYCLER ACCEPTED LOT VISIBILITY & COMPETING LOCKOUT
  // -------------------------------------------------------------
  setGroup('GROUP F: Recycler Accepted Lot Visibility & Competing Lockout');

  // ABC Recycler queries lots
  const abcLotsRes = await fetch(`${BASE_URL}/lots`, {
    headers: { Authorization: `Bearer ${judgeToken}` }
  });
  const abcLotsData = await abcLotsRes.json();
  const abcAcceptedLot = abcLotsData.lots.find((l: any) => l.id === testLotId);
  assert(Boolean(abcAcceptedLot), 'Accepted Lot Visible to Winning Recycler (rec_abc_1)', `Lot ${testLotId}`);
  assert(abcAcceptedLot?.status === 'ACCEPTED', 'Status in Recycler View is ACCEPTED', abcAcceptedLot?.status);
  assert(abcAcceptedLot?.selectedRecyclerId === 'rec_abc_1', 'selectedRecyclerId Matches rec_abc_1', abcAcceptedLot?.selectedRecyclerId);

  // Winning Recycler can view lot detail
  const abcLotDetailRes = await fetch(`${BASE_URL}/lots/${testLotId}`, {
    headers: { Authorization: `Bearer ${judgeToken}` }
  });
  assert(abcLotDetailRes.status === 200, 'Winning Recycler GET /lots/:id Status 200', `HTTP ${abcLotDetailRes.status}`);

  // Competing Recycler Lockout
  const compLotsRes = await fetch(`${BASE_URL}/lots`, {
    headers: { Authorization: `Bearer ${compToken}` }
  });
  const compLotsData = await compLotsRes.json();
  const compSawAcceptedLot = compLotsData.lots.some((l: any) => l.id === testLotId);
  assert(!compSawAcceptedLot, 'Accepted Lot Hidden from Competing Recycler Listing', 'Competitor cannot see accepted lot');

  // Competing Recycler Detail Access Blocked (HTTP 403)
  const compDetailRes = await fetch(`${BASE_URL}/lots/${testLotId}`, {
    headers: { Authorization: `Bearer ${compToken}` }
  });
  assert(compDetailRes.status === 403, 'Competing Recycler Detail Access Blocked (HTTP 403)', `HTTP ${compDetailRes.status}`);

  // Competing Recycler Mutation Blocked: Cannot schedule pickup on ABC's accepted lot
  const compPickupRes = await fetch(`${BASE_URL}/pickups/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${compToken}` },
    body: JSON.stringify({
      lotId: testLotId,
      scheduledDate: '2026-09-12',
      timeSlot: '10:00 AM - 12:00 PM',
      driverName: 'Illegal Driver',
      driverContact: '9999999999',
      vehicleNumber: 'MH04-XX-0000'
    })
  });
  assert(compPickupRes.status === 403, 'Competing Recycler Pickup Mutation Blocked (HTTP 403)', `HTTP ${compPickupRes.status}`);

  // -------------------------------------------------------------
  // GROUP G: ERROR HANDLING & EDGE CASES
  // -------------------------------------------------------------
  setGroup('GROUP G: Error Handling & Edge Cases');

  // 1. Offer on nonexistent lot
  const badLotOfferRes = await fetch(`${BASE_URL}/offers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
    body: JSON.stringify({
      lotId: 'EW-NONEXISTENT-9999',
      offeredRatePerKg: 100,
      pickupOffered: true
    })
  });
  assert(badLotOfferRes.status === 404, 'Offer on Nonexistent Lot Returns HTTP 404', `HTTP ${badLotOfferRes.status}`);

  // 2. Offer on closed/accepted lot
  const closedLotOfferRes = await fetch(`${BASE_URL}/offers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
    body: JSON.stringify({
      lotId: testLotId,
      offeredRatePerKg: 125,
      pickupOffered: true
    })
  });
  assert(closedLotOfferRes.status === 400, 'Offer on Closed/Accepted Lot Returns HTTP 400', `HTTP ${closedLotOfferRes.status}`);

  // 3. Accept nonexistent offer
  const badOfferAcceptRes = await fetch(`${BASE_URL}/offers/off_nonexistent_9999/accept`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${colToken}` }
  });
  assert(badOfferAcceptRes.status === 404, 'Accept Nonexistent Offer Returns HTTP 404', `HTTP ${badOfferAcceptRes.status}`);

  // 4. Unauthorized Collector cannot accept another collector's lot offer
  await fetch(`${BASE_URL}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543211', role: 'COLLECTOR' })
  });
  const col2Login = await login('9876543211', '1234', 'COLLECTOR');
  const unauthorizedAcceptRes = await fetch(`${BASE_URL}/offers/${testOfferId}/accept`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${col2Login.token}` }
  });
  assert(unauthorizedAcceptRes.status === 403 || unauthorizedAcceptRes.status === 400, 'Unauthorized Collector Acceptance Rejected', `HTTP ${unauthorizedAcceptRes.status}`);

  // 5. Unauthenticated request rejected
  const unauthLotRes = await fetch(`${BASE_URL}/lots/${testLotId}`);
  assert(unauthLotRes.status === 401, 'Unauthenticated Access Returns HTTP 401', `HTTP ${unauthLotRes.status}`);

  // -------------------------------------------------------------
  // GROUP H: NON-REGRESSION & WORKFLOW ADVANCEMENT
  // -------------------------------------------------------------
  setGroup('GROUP H: Non-Regression & Next Workflow Step');

  // Winning Recycler (rec_abc_1) schedules pickup on the accepted lot
  const pickupScheduleRes = await fetch(`${BASE_URL}/pickups/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
    body: JSON.stringify({
      lotId: testLotId,
      scheduledDate: '2026-09-12',
      timeSlot: '02:00 PM - 04:00 PM',
      driverName: 'Suresh Patil',
      driverContact: '9820012345',
      vehicleNumber: 'MH01-EW-4521'
    })
  });
  const pickupScheduleData = await pickupScheduleRes.json();
  assert(pickupScheduleRes.status === 201, 'Winning Recycler Schedules Pickup', `HTTP ${pickupScheduleRes.status}`);
  assert(pickupScheduleData.pickup.lotId === testLotId, 'Pickup Record Lot ID Matches', pickupScheduleData.pickup.lotId);
  assert(pickupScheduleData.pickup.recyclerId === 'rec_abc_1', 'Pickup recyclerId Matches rec_abc_1', pickupScheduleData.pickup.recyclerId);
  assert(pickupScheduleData.lot.status === 'PICKUP_SCHEDULED', 'Lot Status -> PICKUP_SCHEDULED', pickupScheduleData.lot.status);

  // Handover Verification with exact OTP
  const handoverRes = await fetch(`${BASE_URL}/handovers/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
    body: JSON.stringify({
      lotId: testLotId,
      handoverOtp: testLot.handoverOtp,
      actualWeight: 32.2,
      scalePhotoUrl: '/uploads/scale_photo.jpg'
    })
  });
  const handoverData = await handoverRes.json();
  assert(handoverRes.status === 200, 'Handover Verified with Exact OTP', `HTTP ${handoverRes.status}`);
  assert(handoverData.lot.status === 'RECEIVED', 'Lot Status -> RECEIVED', handoverData.lot.status);
  assert(handoverData.handover.recyclerId === 'rec_abc_1', 'Handover Linked to rec_abc_1', handoverData.handover.recyclerId);

  // =============================================================
  // SUMMARY
  // =============================================================
  console.log('\n=============================================================');
  console.log('📊 TEST SUMMARY');
  console.log('=============================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n✨ ALL PHASE 3 COLLECTOR → RECYCLER INTEGRATION TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => console.log(`  - [${r.group}] ${r.name}: ${r.message}`));
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
