/**
 * Phase 2 Recycler Data Isolation & Ownership Audit Verification Suite
 * SIH 2026 Problem Statement #229
 */

export {};

const BASE_URL = 'http://127.0.0.1:5000/api';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${name}: ${details}`);
    results.push({ name, passed: true, details });
  } else {
    console.error(`  ❌ [FAIL] ${name}: ${details}`);
    results.push({ name, passed: false, details });
  }
}

async function login(phone: string, otp: string, role: string = 'RECYCLER'): Promise<{ token: string; user: any; recyclerProfile?: any }> {
  const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp, selectedRole: role })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`Login failed for ${phone} (${role}): ${data.message || res.statusText}`);
  }
  return data;
}

async function runPhase2Tests() {
  console.log('\n================================================================');
  console.log('🔒 RUNNING PHASE 2 RECYCLER DATA ISOLATION & OWNERSHIP AUDIT SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // 1. JUDGE DEMO AUTHENTICATION & PROFILE RESOLUTION
  // -------------------------------------------------------------
  console.log('▶ TEST GROUP 1: Judge Demo Identity & Profile Resolution');
  let judgeToken = '';
  let judgeRecycler: any = null;
  try {
    const loginRes = await login('9820098200', '123456', 'RECYCLER');
    judgeToken = loginRes.token;
    judgeRecycler = loginRes.recyclerProfile;

    assert(judgeToken.length > 20, 'Judge Login Success', 'Received valid JWT');
    assert(loginRes.user.id === 'usr_recycler_abc', 'Judge User ID', loginRes.user.id);
    assert(judgeRecycler.id === 'rec_abc_1', 'Judge Recycler Profile ID', judgeRecycler.id);
    assert(judgeRecycler.facilityName === 'ABC E-Waste Recycling Pvt Ltd', 'Judge Facility Name', judgeRecycler.facilityName);
    assert(judgeRecycler.authorizationStatus === 'AUTHORIZED', 'Judge Authorization Status', judgeRecycler.authorizationStatus);
    assert(judgeRecycler.authorizationSource === 'PLATFORM_MANAGED', 'Judge Authorization Source', judgeRecycler.authorizationSource);

    // Profile endpoint check
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${judgeToken}` }
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, 'GET /auth/me Status', `HTTP ${meRes.status}`);
    assert(meData.recyclerProfile?.id === 'rec_abc_1', 'Profile Resolves rec_abc_1', meData.recyclerProfile?.facilityName);
  } catch (err: any) {
    assert(false, 'Judge Demo Login', err.message);
  }

  // -------------------------------------------------------------
  // 2. PENDING RECYCLER GATING
  // -------------------------------------------------------------
  console.log('\n▶ TEST GROUP 2: Pending Recycler Regulatory Gating');
  let pendingToken = '';
  try {
    // Ensure Avadh starts in PENDING_VERIFICATION state
    const adminInit = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9999999999', otp: '1234', selectedRole: 'ADMIN' })
    });
    const adminInitToken = (await adminInit.json()).token;
    await fetch(`${BASE_URL}/recyclers/9839012345/auth-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminInitToken}` },
      body: JSON.stringify({ authorizationStatus: 'PENDING_VERIFICATION' })
    });

    // Send OTP to get valid test OTP for pending recycler
    await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9839012345', role: 'RECYCLER' })
    });
    const otpRes = await fetch(`${BASE_URL}/auth/test-dispatched-otp?phone=9839012345`);
    const otpData = await otpRes.json();
    const pendingLogin = await login('9839012345', otpData.otp, 'RECYCLER');
    pendingToken = pendingLogin.token;

    assert(pendingLogin.recyclerProfile?.authorizationStatus === 'PENDING_VERIFICATION', 'Pending Status', 'PENDING_VERIFICATION');

    // Attempt Offer
    const offerRes = await fetch(`${BASE_URL}/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pendingToken}` },
      body: JSON.stringify({ lotId: 'EW-MUM-2026-000201', offeredRatePerKg: 100 })
    });
    assert(offerRes.status === 403, 'Pending Recycler Offer Blocked', `HTTP ${offerRes.status}`);

    // Attempt Pickup Schedule
    const pickupRes = await fetch(`${BASE_URL}/pickups/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pendingToken}` },
      body: JSON.stringify({ lotId: 'EW-MUM-2026-000202', scheduledDate: '2026-09-12' })
    });
    assert(pickupRes.status === 403, 'Pending Recycler Pickup Blocked', `HTTP ${pickupRes.status}`);

    // Attempt Handover Verify
    const handoverRes = await fetch(`${BASE_URL}/handovers/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pendingToken}` },
      body: JSON.stringify({ lotId: 'EW-MUM-2026-000203', actualWeight: 25, handoverOtp: '6491' })
    });
    assert(handoverRes.status === 403, 'Pending Recycler Handover Blocked', `HTTP ${handoverRes.status}`);

    // Attempt Processing Stage Update
    const stageRes = await fetch(`${BASE_URL}/traceability/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pendingToken}` },
      body: JSON.stringify({ lotId: 'EW-MUM-2026-000204', stage: 'SORTED' })
    });
    assert(stageRes.status === 403, 'Pending Recycler Processing Blocked', `HTTP ${stageRes.status}`);
  } catch (err: any) {
    assert(false, 'Pending Recycler Gating', err.message);
  }

  // -------------------------------------------------------------
  // 3. SUSPENDED RECYCLER GATING
  // -------------------------------------------------------------
  console.log('\n▶ TEST GROUP 3: Suspended Recycler Regulatory Gating');
  try {
    await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9830098300', role: 'RECYCLER' })
    });
    const otpRes = await fetch(`${BASE_URL}/auth/test-dispatched-otp?phone=9830098300`);
    const otpData = await otpRes.json();
    const suspendedLogin = await login('9830098300', otpData.otp, 'RECYCLER');
    const suspendedToken = suspendedLogin.token;

    assert(suspendedLogin.recyclerProfile?.authorizationStatus === 'SUSPENDED', 'Suspended Status', 'SUSPENDED');

    const offerRes = await fetch(`${BASE_URL}/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${suspendedToken}` },
      body: JSON.stringify({ lotId: 'EW-MUM-2026-000201', offeredRatePerKg: 100 })
    });
    assert(offerRes.status === 403, 'Suspended Recycler Offer Blocked', `HTTP ${offerRes.status}`);

    const pickupRes = await fetch(`${BASE_URL}/pickups/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${suspendedToken}` },
      body: JSON.stringify({ lotId: 'EW-MUM-2026-000202', scheduledDate: '2026-09-12' })
    });
    assert(pickupRes.status === 403, 'Suspended Recycler Pickup Blocked', `HTTP ${pickupRes.status}`);

    const handoverRes = await fetch(`${BASE_URL}/handovers/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${suspendedToken}` },
      body: JSON.stringify({ lotId: 'EW-MUM-2026-000203', actualWeight: 25, handoverOtp: '6491' })
    });
    assert(handoverRes.status === 403, 'Suspended Recycler Handover Blocked', `HTTP ${handoverRes.status}`);

    const stageRes = await fetch(`${BASE_URL}/traceability/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${suspendedToken}` },
      body: JSON.stringify({ lotId: 'EW-MUM-2026-000204', stage: 'SORTED' })
    });
    assert(stageRes.status === 403, 'Suspended Recycler Processing Blocked', `HTTP ${stageRes.status}`);
  } catch (err: any) {
    assert(false, 'Suspended Recycler Gating', err.message);
  }

  // -------------------------------------------------------------
  // 4. IDOR / CLIENT RECYCLER ID INJECTION REJECTION
  // -------------------------------------------------------------
  console.log('\n▶ TEST GROUP 4: Zero Trust for Client recyclerId Injection');
  try {
    // Recycler A (rec_abc_1) passing recyclerId: 'rec_1' in POST /offers
    const injectOfferRes = await fetch(`${BASE_URL}/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
      body: JSON.stringify({ lotId: 'EW-MUM-2026-000201', offeredRatePerKg: 105, recyclerId: 'rec_1' })
    });
    assert(injectOfferRes.status === 403, 'Injecting Foreign recyclerId in Offer Rejected', `HTTP ${injectOfferRes.status}`);

    // Injecting foreign recyclerId in Pickup
    const injectPickupRes = await fetch(`${BASE_URL}/pickups/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
      body: JSON.stringify({ lotId: 'EW-MUM-2026-000202', scheduledDate: '2026-09-12', recyclerId: 'rec_1' })
    });
    assert(injectPickupRes.status === 403, 'Injecting Foreign recyclerId in Pickup Rejected', `HTTP ${injectPickupRes.status}`);

    // Injecting foreign recyclerId in Handover
    const injectHandoverRes = await fetch(`${BASE_URL}/handovers/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
      body: JSON.stringify({ lotId: 'EW-MUM-2026-000203', actualWeight: 25, handoverOtp: '6491', recyclerId: 'rec_1' })
    });
    assert(injectHandoverRes.status === 403, 'Injecting Foreign recyclerId in Handover Rejected', `HTTP ${injectHandoverRes.status}`);

    // Injecting foreign recyclerId in Stage Update
    const injectStageRes = await fetch(`${BASE_URL}/traceability/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
      body: JSON.stringify({ lotId: 'EW-MUM-2026-000204', stage: 'SORTED', recyclerId: 'rec_1' })
    });
    assert(injectStageRes.status === 403, 'Injecting Foreign recyclerId in Stage Update Rejected', `HTTP ${injectStageRes.status}`);
  } catch (err: any) {
    assert(false, 'Client ID Injection Tests', err.message);
  }

  // -------------------------------------------------------------
  // 5. CROSS-RECYCLER WORKFLOW MUTATION ATTEMPTS
  // -------------------------------------------------------------
  console.log('\n▶ TEST GROUP 5: Cross-Recycler Workflow Mutation Rejection');
  try {
    // EW-LKO-2026-000109 is accepted by rec_1 (GreenEarth). rec_abc_1 must not be able to schedule pickup!
    const mutatePickupRes = await fetch(`${BASE_URL}/pickups/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
      body: JSON.stringify({ lotId: 'EW-LKO-2026-000109', scheduledDate: '2026-09-12' })
    });
    assert(mutatePickupRes.status === 403, 'Mutate Foreign Lot Pickup Rejected', `HTTP ${mutatePickupRes.status}`);

    // EW-LKO-2026-000110 is pickup-scheduled for rec_1. rec_abc_1 must not be able to verify handover!
    const mutateHandoverRes = await fetch(`${BASE_URL}/handovers/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
      body: JSON.stringify({ lotId: 'EW-LKO-2026-000110', actualWeight: 25, handoverOtp: '9144' })
    });
    assert(mutateHandoverRes.status === 403, 'Mutate Foreign Lot Handover Rejected', `HTTP ${mutateHandoverRes.status}`);

    // Update processing stage on lot belonging to rec_1
    const mutateStageRes = await fetch(`${BASE_URL}/traceability/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
      body: JSON.stringify({ lotId: 'EW-LKO-2026-000102', stage: 'SORTED' })
    });
    assert(mutateStageRes.status === 403, 'Mutate Foreign Lot Processing Stage Rejected', `HTTP ${mutateStageRes.status}`);
  } catch (err: any) {
    assert(false, 'Cross-Recycler Mutation Tests', err.message);
  }

  // -------------------------------------------------------------
  // 6. CROSS-RECYCLER PROTECTED RECORD VISIBILITY
  // -------------------------------------------------------------
  console.log('\n▶ TEST GROUP 6: Cross-Recycler Record Visibility & Isolation');
  try {
    // Attempt to view foreign lot details accepted by rec_1
    const viewLotRes = await fetch(`${BASE_URL}/lots/EW-LKO-2026-000102`, {
      headers: { Authorization: `Bearer ${judgeToken}` }
    });
    assert(viewLotRes.status === 403, 'View Foreign Accepted Lot Details Rejected', `HTTP ${viewLotRes.status}`);

    // Attempt to view foreign lot handover details
    const viewHandoverRes = await fetch(`${BASE_URL}/handovers/lot/EW-LKO-2026-000102`, {
      headers: { Authorization: `Bearer ${judgeToken}` }
    });
    assert(viewHandoverRes.status === 403, 'View Foreign Handover Details Rejected', `HTTP ${viewHandoverRes.status}`);

    // Attempt to query foreign pickups by query parameter
    const queryPickupsRes = await fetch(`${BASE_URL}/pickups?recyclerId=rec_1`, {
      headers: { Authorization: `Bearer ${judgeToken}` }
    });
    assert(queryPickupsRes.status === 403, 'Query Foreign Pickups Rejected', `HTTP ${queryPickupsRes.status}`);

    // Attempt to query foreign transaction ledger by path parameter
    const queryLedgerRes = await fetch(`${BASE_URL}/payments/recycler/rec_1`, {
      headers: { Authorization: `Bearer ${judgeToken}` }
    });
    assert(queryLedgerRes.status === 403, 'Query Foreign Transactions Rejected', `HTTP ${queryLedgerRes.status}`);
  } catch (err: any) {
    assert(false, 'Cross-Recycler Visibility Tests', err.message);
  }

  // -------------------------------------------------------------
  // 7. MASTER OTP BYPASS ELIMINATION
  // -------------------------------------------------------------
  console.log('\n▶ TEST GROUP 7: Master OTP Bypass Elimination');
  try {
    // Lot EW-MUM-2026-000203 has real collector OTP '6491'.
    // Test with old master bypass '1234' -> MUST FAIL
    const bypass1234Res = await fetch(`${BASE_URL}/handovers/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
      body: JSON.stringify({ lotId: 'EW-MUM-2026-000203', actualWeight: 25, handoverOtp: '1234' })
    });
    assert(bypass1234Res.status === 400, 'Master OTP 1234 Bypass Eliminated', `HTTP ${bypass1234Res.status}`);

    // Test with old master bypass '4821' -> MUST FAIL
    const bypass4821Res = await fetch(`${BASE_URL}/handovers/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
      body: JSON.stringify({ lotId: 'EW-MUM-2026-000203', actualWeight: 25, handoverOtp: '4821' })
    });
    assert(bypass4821Res.status === 400, 'Master OTP 4821 Bypass Eliminated', `HTTP ${bypass4821Res.status}`);

    // Test with random wrong OTP '9999' -> MUST FAIL
    const wrongOtpRes = await fetch(`${BASE_URL}/handovers/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
      body: JSON.stringify({ lotId: 'EW-MUM-2026-000203', actualWeight: 25, handoverOtp: '9999' })
    });
    assert(wrongOtpRes.status === 400, 'Arbitrary Wrong OTP Rejected', `HTTP ${wrongOtpRes.status}`);
  } catch (err: any) {
    assert(false, 'Master OTP Elimination Tests', err.message);
  }

  // -------------------------------------------------------------
  // 8. AUTHORIZED WORKFLOW OPERATIONS FOR rec_abc_1
  // -------------------------------------------------------------
  console.log('\n▶ TEST GROUP 8: Authorized End-to-End Workflow for rec_abc_1');
  try {
    // 8a. Lot Listing: Scoped to open lots + own lots
    const lotsRes = await fetch(`${BASE_URL}/lots`, {
      headers: { Authorization: `Bearer ${judgeToken}` }
    });
    const lotsData = await lotsRes.json();
    assert(lotsRes.status === 200, 'GET /lots Status', `HTTP ${lotsRes.status}`);
    const foreignClosedLots = lotsData.lots.filter(
      (l: any) => l.selectedRecyclerId && l.selectedRecyclerId !== 'rec_abc_1'
    );
    assert(foreignClosedLots.length === 0, 'Zero Foreign Closed Lots in Listing', `Found ${foreignClosedLots.length}`);
    const hasOwnLot = lotsData.lots.some((l: any) => l.selectedRecyclerId === 'rec_abc_1');
    assert(hasOwnLot, 'Own Assigned Lots Visible in Listing', 'Found rec_abc_1 lots');

    // 8b. Create a dedicated fresh lot as Collector to verify full lifecycle without collision
    const colLoginForFlow = await login('9876543210', '1234', 'COLLECTOR');
    const flowLotRes = await fetch(`${BASE_URL}/lots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${colLoginForFlow.token}` },
      body: JSON.stringify({
        materialCategory: 'PCB',
        subCategory: 'Server Motherboards',
        description: 'Lifecycle verification lot for rec_abc_1',
        approxWeight: 20,
        condition: 'INTACT',
        sourceType: 'COMMERCIAL',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        imageUrl: '/uploads/sample_pcb.jpg'
      })
    });
    const flowLotData = await flowLotRes.json();
    const flowLot = flowLotData.lot;
    const flowLotId = flowLot.id;
    const flowLotOtp = flowLot.handoverOtp || '1234';

    // 8c. Offer Creation on fresh open lot
    const createOfferRes = await fetch(`${BASE_URL}/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
      body: JSON.stringify({
        lotId: flowLotId,
        offeredRatePerKg: 102,
        pickupOffered: true,
        pickupEtaHours: 24,
        notes: 'Official binding quote from ABC E-Waste Recycling Pvt Ltd'
      })
    });
    const offerData = await createOfferRes.json();
    assert(createOfferRes.status === 201, 'POST /offers Status', `HTTP ${createOfferRes.status}`);
    assert(offerData.offer.recyclerId === 'rec_abc_1', 'Offer recyclerId Bound to Token', offerData.offer.recyclerId);
    assert(offerData.offer.recyclerName === 'ABC E-Waste Recycling Pvt Ltd', 'Offer Facility Name Bound', offerData.offer.recyclerName);

    // 8d. Duplicate Pending Offer Rejection
    const dupOfferRes = await fetch(`${BASE_URL}/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
      body: JSON.stringify({ lotId: flowLotId, offeredRatePerKg: 105 })
    });
    assert(dupOfferRes.status === 400, 'Duplicate Pending Offer Rejected', `HTTP ${dupOfferRes.status}`);

    // Collector accepts offer to move lot to ACCEPTED
    await fetch(`${BASE_URL}/offers/${offerData.offer.id}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${colLoginForFlow.token}` }
    });

    // 8e. Pickup Scheduling on Accepted Lot
    const scheduleRes = await fetch(`${BASE_URL}/pickups/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
      body: JSON.stringify({
        lotId: flowLotId,
        scheduledDate: '2026-09-12',
        timeSlot: '02:00 PM - 04:00 PM',
        driverName: 'Mohan Singh',
        vehicleNumber: 'MH-04-EW-9988'
      })
    });
    const scheduleData = await scheduleRes.json();
    assert(scheduleRes.status === 201, 'POST /pickups/schedule Status', `HTTP ${scheduleRes.status}`);
    assert(scheduleData.pickup.recyclerId === 'rec_abc_1', 'Pickup recyclerId Bound to Token', scheduleData.pickup.recyclerId);
    assert(scheduleData.lot.status === 'PICKUP_SCHEDULED', 'Lot Status -> PICKUP_SCHEDULED', scheduleData.lot.status);

    // 8f. Pickup Listing Isolation
    const pickupsRes = await fetch(`${BASE_URL}/pickups`, {
      headers: { Authorization: `Bearer ${judgeToken}` }
    });
    const pickupsData = await pickupsRes.json();
    assert(pickupsRes.status === 200, 'GET /pickups Status', `HTTP ${pickupsRes.status}`);
    const foreignPickups = pickupsData.pickups.filter((p: any) => p.recyclerId !== 'rec_abc_1');
    assert(foreignPickups.length === 0, 'Zero Foreign Pickups in Listing', `Found ${foreignPickups.length}`);

    // 8g. Handover Verification with Correct Collector OTP
    const handoverSuccessRes = await fetch(`${BASE_URL}/handovers/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
      body: JSON.stringify({
        lotId: flowLotId,
        actualWeight: 19.8,
        handoverOtp: flowLotOtp,
        paymentMethod: 'UPI',
        driverName: 'Mohan Singh'
      })
    });
    const handoverSuccessData = await handoverSuccessRes.json();
    assert(handoverSuccessRes.status === 200, 'POST /handovers/verify with Exact OTP Status', `HTTP ${handoverSuccessRes.status}`);
    assert(handoverSuccessData.handover.recyclerId === 'rec_abc_1', 'Handover Record Bound to rec_abc_1', handoverSuccessData.handover.recyclerId);
    assert(handoverSuccessData.lot.status === 'RECEIVED', 'Lot Status -> RECEIVED', handoverSuccessData.lot.status);

    // 8h. Processing Stage Advancement on Received Lot
    const stageSuccessRes = await fetch(`${BASE_URL}/traceability/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
      body: JSON.stringify({
        lotId: flowLotId,
        stage: 'SORTED'
      })
    });
    const stageSuccessData = await stageSuccessRes.json();
    assert(stageSuccessRes.status === 201, 'POST /traceability/stage Status', `HTTP ${stageSuccessRes.status}`);
    assert(stageSuccessData.log.actorName.includes('ABC') || stageSuccessData.log.actorName.includes('Arun'), 'Stage Log Actor Bound to Recycler', stageSuccessData.log.actorName);

    // 8i. Processing Stage Rejection on Unreceived Lot
    const unreceivedLotRes = await fetch(`${BASE_URL}/lots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${colLoginForFlow.token}` },
      body: JSON.stringify({
        materialCategory: 'BATTERY',
        subCategory: 'Lithium Packs',
        description: 'Unreceived lot test',
        approxWeight: 10,
        condition: 'INTACT',
        sourceType: 'HOUSEHOLD',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        imageUrl: '/uploads/sample_battery.jpg'
      })
    });
    const unreceivedLotData = await unreceivedLotRes.json();
    const stageUnreceivedRes = await fetch(`${BASE_URL}/traceability/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${judgeToken}` },
      body: JSON.stringify({
        lotId: unreceivedLotData.lot.id,
        stage: 'SORTED'
      })
    });
    assert(stageUnreceivedRes.status === 400, 'Stage Update on Unreceived Lot Rejected', `HTTP ${stageUnreceivedRes.status}`);

    // 8j. Recycler Financial Transactions Ledger Scoping
    const ledgerRes = await fetch(`${BASE_URL}/payments/recycler`, {
      headers: { Authorization: `Bearer ${judgeToken}` }
    });
    const ledgerData = await ledgerRes.json();
    assert(ledgerRes.status === 200, 'GET /payments/recycler Status', `HTTP ${ledgerRes.status}`);
    const foreignLedgerEntries = ledgerData.transactions.filter((t: any) => t.recyclerId !== 'rec_abc_1');
    assert(foreignLedgerEntries.length === 0, 'Zero Foreign Ledger Entries', `Found ${foreignLedgerEntries.length}`);
    assert(ledgerData.transactions.length > 0, 'Own Transactions Present', `${ledgerData.transactions.length} entries`);
  } catch (err: any) {
    assert(false, 'Authorized Workflow Operations', err.message);
  }

  // -------------------------------------------------------------
  // 9. NON-REGRESSION OF COLLECTOR & ADMIN WORKFLOWS
  // -------------------------------------------------------------
  console.log('\n▶ TEST GROUP 9: Collector & Admin Flow Non-Regression');
  try {
    // Collector Login
    const colLogin = await login('9876543210', '1234', 'COLLECTOR');
    assert(colLogin.user.role === 'COLLECTOR', 'Collector Login Intact', colLogin.user.id);

    // Collector Lot Scoping: Can only see own lots
    const colLotsRes = await fetch(`${BASE_URL}/lots`, {
      headers: { Authorization: `Bearer ${colLogin.token}` }
    });
    const colLotsData = await colLotsRes.json();
    assert(colLotsRes.status === 200, 'Collector GET /lots Status', `HTTP ${colLotsRes.status}`);
    const foreignCollectorLots = colLotsData.lots.filter((l: any) => l.collectorId !== 'col_1');
    assert(foreignCollectorLots.length === 0, 'Collector Isolated to Own Lots', `Found ${foreignCollectorLots.length} foreign lots`);

    // Admin Login
    const adminLogin = await login('9999999999', '1234', 'ADMIN');
    assert(adminLogin.user.role === 'ADMIN', 'Admin Login Intact', adminLogin.user.id);

    // Admin KPIs
    const kpiRes = await fetch(`${BASE_URL}/admin/kpis`, {
      headers: { Authorization: `Bearer ${adminLogin.token}` }
    });
    const kpiData = await kpiRes.json();
    assert(kpiRes.status === 200, 'Admin KPIs Accessible', `HTTP ${kpiRes.status}`);
    assert(kpiData.kpis?.totalLots > 0, 'Admin KPIs Data Present', `Lots: ${kpiData.kpis?.totalLots}`);
  } catch (err: any) {
    assert(false, 'Collector/Admin Non-Regression', err.message);
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n=============================================================');
  console.log('📊 TEST SUMMARY');
  console.log('=============================================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`Total Tests Run: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.error(`\n❌ FAILED TESTS (${failed}):`);
    results.filter(r => !r.passed).forEach(r => console.error(`  - ${r.name}: ${r.details}`));
    process.exit(1);
  } else {
    console.log('\n✨ ALL PHASE 2 DATA ISOLATION & OWNERSHIP AUDIT TESTS PASSED!\n');
  }
}

runPhase2Tests().catch(err => {
  console.error('Fatal error in test suite:', err);
  process.exit(1);
});
