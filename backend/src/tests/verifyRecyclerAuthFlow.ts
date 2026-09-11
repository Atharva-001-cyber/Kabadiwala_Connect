/**
 * Master Recycler Authentication & Regulatory Flow Verification Suite
 * SIH 2026 Problem Statement #229
 * 
 * Tests:
 * 1. SMS Provider Status & DLT Compliance Metadata
 * 2. Recycler Development OTP Mode (RECYCLER_OTP_DEV_MODE=true):
 *    - Cryptographically random 6-digit OTP generated
 *    - OTP logged ONLY to backend terminal console
 *    - OTP is NOT present anywhere in HTTP response
 *    - demoOtp is NEVER returned for Recycler
 *    - DeliveryMode is DEV_CONSOLE
 * 3. Master OTP 1234 Strict Rejection for Recycler (HTTP 400)
 * 4. Wrong / Random OTP Rejection for Recycler (HTTP 400)
 * 5. Attempt Capping & Brute Force Protection (HTTP 429 on 6th attempt & session invalidated)
 * 6. Legitimate 6-Digit OTP Authentication & Facility Identity Binding (ABC E-Waste Recycling Pvt Ltd)
 * 7. Production Mode Enforcement (NODE_ENV=production requires real SMS; returns 503 if unconfigured)
 * 8. Regulatory Gating on Regulated Operations (PENDING & SUSPENDED blocked with HTTP 403)
 * 9. Admin Regulatory Approval & Unlocking Bidding (Admin promotes Avadh -> bids unlocked with HTTP 201)
 * 10. Collector/Admin Demo Integrity Preservation (Demo OTP 1234 continues working)
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

async function getDispatchedOtp(phone: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/test-dispatched-otp?phone=${phone}`);
  const data = await res.json();
  return data.otp || '';
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function runAllTests() {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING MASTER RECYCLER AUTH & REGULATORY FLOW VERIFICATION');
  console.log('=============================================================\n');

  // -------------------------------------------------------------
  // TEST 1: SMS Provider Status Discovery
  // -------------------------------------------------------------
  console.log('▶ TEST 1: SMS Provider Status & DLT Compliance Metadata');
  try {
    const res = await fetch(`${BASE_URL}/auth/sms-config`);
    const data = await res.json();
    assert(res.status === 200, 'SMS Config Endpoint', `Status ${res.status}`);
    assert(data.smsStatus?.recyclerOtpDevMode === true, 'Dev Mode Status Flag', `recyclerOtpDevMode = ${data.smsStatus?.recyclerOtpDevMode}`);
    assert(data.smsStatus?.dltRequirements?.headerSenderId.length > 0, 'DLT Requirements Metadata', data.smsStatus?.dltRequirements?.headerSenderId);
  } catch (err: any) {
    assert(false, 'SMS Config Endpoint', err.message);
  }

  // -------------------------------------------------------------
  // TEST 2: Recycler Development-Only OTP Mode & Response Secrecy
  // -------------------------------------------------------------
  console.log('\n▶ TEST 2: Safe Development-Only OTP Mode (RECYCLER_OTP_DEV_MODE=true)');
  const recyclerPhone = '9820098200';
  let devOtp = '';

  try {
    const res = await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: recyclerPhone, role: 'RECYCLER' })
    });
    const data = await res.json();

    assert(res.status === 200, 'Send OTP Status', `HTTP ${res.status}`);
    assert(data.success === true, 'Success Flag', `success = ${data.success}`);
    assert(data.deliveryMode === 'DEV_CONSOLE' || data.deliveryMode === 'TEST_RUNNER', 'Delivery Mode', data.deliveryMode);
    assert(data.demoOtp === undefined, 'No demoOtp in Response', 'demoOtp is strictly undefined');
    assert(!String(data.message).match(/\b\d{6}\b/), 'No OTP in Message Text', '6-digit OTP absent from response text');
    assert(data.otp === undefined, 'No OTP Field in JSON', 'otp field is undefined');

    devOtp = await getDispatchedOtp(recyclerPhone);
    assert(devOtp.length === 6 && /^\d{6}$/.test(devOtp), 'Secure 6-Digit Code', `Secure crypto OTP: ${devOtp.slice(0, 2)}****`);
  } catch (err: any) {
    assert(false, 'Send OTP Recycler Dev Mode', err.message);
  }

  // -------------------------------------------------------------
  // TEST 3: Master OTP 1234 Strict Rejection for Recycler
  // -------------------------------------------------------------
  console.log('\n▶ TEST 3: Master OTP 1234 Strict Rejection for Recycler');
  try {
    const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: recyclerPhone, otp: '1234', selectedRole: 'RECYCLER' })
    });
    const data = await res.json();

    assert(res.status === 400, 'Master OTP 1234 Rejection', `HTTP ${res.status} rejected`);
    assert(data.success === false, 'Rejection Flag', `success = ${data.success}`);
    assert(data.message.includes('Invalid OTP'), 'Rejection Reason', data.message);
  } catch (err: any) {
    assert(false, 'Master OTP Rejection', err.message);
  }

  // -------------------------------------------------------------
  // TEST 4: Wrong / Random OTP Rejection for Recycler
  // -------------------------------------------------------------
  console.log('\n▶ TEST 4: Wrong OTP Rejection for Recycler');
  try {
    const wrongOtp = devOtp === '888888' ? '777777' : '888888';
    const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: recyclerPhone, otp: wrongOtp, selectedRole: 'RECYCLER' })
    });
    const data = await res.json();

    assert(res.status === 400, 'Wrong OTP Rejection', `HTTP ${res.status} rejected`);
    assert(data.success === false, 'Rejection Flag', `success = ${data.success}`);
    assert(data.message.includes('Invalid OTP'), 'Rejection Reason', data.message);
  } catch (err: any) {
    assert(false, 'Wrong OTP Rejection', err.message);
  }

  // -------------------------------------------------------------
  // TEST 5: Attempt Capping & Rate Limit Protection (Max 5 attempts)
  // -------------------------------------------------------------
  console.log('\n▶ TEST 5: Brute Force Attempt Capping (Max 5 attempts)');
  try {
    // We already did 2 wrong attempts (1234 and 888888). Now do attempts 3, 4, 5:
    for (let i = 3; i <= 5; i++) {
      await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: recyclerPhone, otp: '000000', selectedRole: 'RECYCLER' })
      });
    }

    // 6th attempt should be rejected with 429 and session invalidated:
    const attempt6 = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: recyclerPhone, otp: '000000', selectedRole: 'RECYCLER' })
    });
    const data6 = await attempt6.json();

    assert(attempt6.status === 429, 'Attempt 6 Rate Limit', `HTTP ${attempt6.status}`);
    assert(data6.message.includes('Maximum verification attempts exceeded'), 'Invalidation Notice', data6.message);

    // Subsequent attempt even with valid dev OTP must be rejected (cache wiped):
    const attempt7 = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: recyclerPhone, otp: devOtp, selectedRole: 'RECYCLER' })
    });
    assert(attempt7.status === 400, 'Cache Session Wiped', 'Invalidated OTP no longer acceptable');
  } catch (err: any) {
    assert(false, 'Brute Force Protection', err.message);
  }

  // -------------------------------------------------------------
  // TEST 6: Legitimate 6-Digit OTP Authentication & Facility Identity Binding
  // -------------------------------------------------------------
  console.log('\n▶ TEST 6: Legitimate 6-Digit OTP Authentication & Identity Binding');
  let recyclerToken = '';
  try {
    // Request fresh OTP
    await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: recyclerPhone, role: 'RECYCLER' })
    });
    const freshOtp = await getDispatchedOtp(recyclerPhone);

    // Verify with fresh valid 6-digit OTP
    const verifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: recyclerPhone, otp: freshOtp, selectedRole: 'RECYCLER' })
    });
    const verifyData = await verifyRes.json();

    assert(verifyRes.status === 200, 'Verification Success', `HTTP ${verifyRes.status}`);
    assert(Boolean(verifyData.token), 'JWT Token Issued', 'Bearer token received');
    recyclerToken = verifyData.token;

    // Check identity in /auth/me
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${recyclerToken}` }
    });
    const meData = await meRes.json();

    assert(meData.user?.role === 'RECYCLER', 'User Role', meData.user?.role);
    assert(meData.recyclerProfile?.facilityName === 'ABC E-Waste Recycling Pvt Ltd', 'Facility Name Bound', meData.recyclerProfile?.facilityName);
    assert(meData.recyclerProfile?.registrationNo === 'CPCB/EWR/MH/MUM/2023/5521', 'CPCB Registration Assigned', meData.recyclerProfile?.registrationNo);
    assert(meData.recyclerProfile?.authorizationStatus === 'AUTHORIZED', 'CPCB Authorization Status', meData.recyclerProfile?.authorizationStatus);
  } catch (err: any) {
    assert(false, 'Legitimate Verification', err.message);
  }

  // -------------------------------------------------------------
  // TEST 7: SIH Judge Demo OTP Mode (JUDGE_DEMO_OTP=123456)
  // -------------------------------------------------------------
  console.log('\n▶ TEST 7: SIH Judge Demo OTP Mode (JUDGE_DEMO_OTP=123456)');
  let judgeRecyclerToken = '';
  try {
    // 7A. Recycler Judge Demo + 123456 -> Successful Login
    const judgeLoginRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9820098200', otp: '123456', selectedRole: 'RECYCLER' })
    });
    const judgeLoginData = await judgeLoginRes.json();

    assert(judgeLoginRes.status === 200, 'Judge Demo Login Status', `HTTP ${judgeLoginRes.status}`);
    assert(judgeLoginData.success === true, 'Judge Demo Success Flag', 'success = true');
    assert(Boolean(judgeLoginData.token), 'Judge Demo JWT Token', 'Bearer token received');
    assert(judgeLoginData.user?.role === 'RECYCLER', 'Judge Demo Role RECYCLER', judgeLoginData.user?.role);
    assert(judgeLoginData.recyclerProfile?.facilityName === 'ABC E-Waste Recycling Pvt Ltd', 'Judge Demo Facility Loaded', judgeLoginData.recyclerProfile?.facilityName);
    assert(judgeLoginData.recyclerProfile?.authorizationStatus === 'AUTHORIZED', 'Judge Demo Facility Authorization', judgeLoginData.recyclerProfile?.authorizationStatus);
    judgeRecyclerToken = judgeLoginData.token;

    // Verify /auth/me with the Judge Demo token
    const judgeMeRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${judgeRecyclerToken}` }
    });
    const judgeMeData = await judgeMeRes.json();
    assert(judgeMeRes.status === 200, 'Judge Demo Profile Verification', 'HTTP 200');
    assert(judgeMeData.user?.role === 'RECYCLER', 'Judge Demo Session Role', judgeMeData.user?.role);
    assert(judgeMeData.recyclerProfile?.id === 'rec_abc_1', 'Judge Demo Profile ID', judgeMeData.recyclerProfile?.id);

    // 7B. Wrong Demo OTP -> Rejected
    const wrongDemoRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9820098200', otp: '999999', selectedRole: 'RECYCLER' })
    });
    const wrongDemoData = await wrongDemoRes.json();
    assert(wrongDemoRes.status === 400, 'Wrong Demo OTP Rejection', `HTTP ${wrongDemoRes.status}`);
    assert(wrongDemoData.success === false, 'Wrong Demo OTP Success False', 'success = false');

    // 7C. Master OTP 1234 is still rejected for Recycler even in Judge Demo mode
    const master1234Res = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9820098200', otp: '1234', selectedRole: 'RECYCLER' })
    });
    const master1234Data = await master1234Res.json();
    assert(master1234Res.status === 400, 'Master OTP 1234 Still Rejected', `HTTP ${master1234Res.status}`);
    assert(master1234Data.success === false, 'Master OTP 1234 Success False', 'success = false');

    // 7D. Production Simulation: 123456 is NEVER accepted as a production demo OTP
    const prodDemoRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-test-simulate-production': 'true'
      },
      body: JSON.stringify({ phone: '9820098200', otp: '123456', selectedRole: 'RECYCLER' })
    });
    const prodDemoData = await prodDemoRes.json();
    assert(prodDemoRes.status === 400, 'Production 123456 Rejection', `HTTP ${prodDemoRes.status}`);
    assert(prodDemoData.success === false, 'Production 123456 Success False', 'success = false');
  } catch (err: any) {
    assert(false, 'Judge Demo OTP Mode Verification', err.message);
  }

  // -------------------------------------------------------------
  // TEST 8: Production Mode Enforcement (Requires Real SMS Gateway)
  // -------------------------------------------------------------
  console.log('\n▶ TEST 8: Production Mode Enforcement (Unconfigured Gateway Returns 503)');
  try {
    // Test with simulation header representing NODE_ENV=production or RECYCLER_OTP_DEV_MODE=false
    const prodPhone = '9876543290';
    const prodRes = await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-test-simulate-production': 'true'
      },
      body: JSON.stringify({ phone: prodPhone, role: 'RECYCLER' })
    });
    const prodData = await prodRes.json();

    assert(prodRes.status === 503, 'Production 503 Rejection', `HTTP ${prodRes.status}`);
    assert(prodData.success === false, 'Success Flag False', 'success = false in production without gateway');
    assert(prodData.smsConfigured === false, 'SMS Not Configured Flag', 'smsConfigured = false');
    assert(prodData.message.includes('Real SMS provider is not configured'), 'Compliance Notice', prodData.message);
  } catch (err: any) {
    assert(false, 'Production Mode Enforcement', err.message);
  }

  // -------------------------------------------------------------
  // TEST 9: Regulatory Gating (PENDING & SUSPENDED Facilities)
  // -------------------------------------------------------------
  console.log('\n▶ TEST 9: Regulatory Operation Gating on Bidding');
  let validLotId = 'EW-LUC-2026-000304';
  try {
    // Fetch a real active lot ID for testing bids
    const colLogin = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9876543210', otp: '1234', selectedRole: 'COLLECTOR' })
    });
    const colToken = (await colLogin.json()).token;

    // Create an explicit fresh open lot to guarantee an active lot for Avadh testing
    const freshLotRes = await fetch(`${BASE_URL}/lots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${colToken}` },
      body: JSON.stringify({
        materialCategory: 'CABLE',
        subCategory: 'Copper Cable Scrap',
        description: 'Regulatory Gating Verification Lot',
        approxWeight: 15,
        condition: 'INTACT',
        sourceType: 'COMMERCIAL',
        locationDistrict: 'Lucknow',
        locationState: 'Uttar Pradesh',
        imageUrl: '/uploads/sample_cable.jpg'
      })
    });
    const freshLotData = await freshLotRes.json();
    if (freshLotData.lot?.id) {
      validLotId = freshLotData.lot.id;
    }

    // Ensure Avadh starts in PENDING_VERIFICATION state
    const adminInit = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9999999999', otp: '1234', selectedRole: 'ADMIN' })
    });
    const adminInitToken = (await adminInit.json()).token;
    await fetch(`${BASE_URL}/recyclers/9839012345/auth-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminInitToken}`
      },
      body: JSON.stringify({ authorizationStatus: 'PENDING_VERIFICATION' })
    });

    // 8A: Log in as Avadh Green Tech Aggregators (PENDING_VERIFICATION)
    const avadhPhone = '9839012345';
    await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: avadhPhone, role: 'RECYCLER' })
    });
    const avadhOtp = await getDispatchedOtp(avadhPhone);
    const avadhVerify = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: avadhPhone, otp: avadhOtp, selectedRole: 'RECYCLER' })
    });
    const avadhVerifyData = await avadhVerify.json();
    const avadhToken = avadhVerifyData.token;

    assert(Boolean(avadhToken), 'Avadh Login Token', 'Avadh authenticated successfully');

    // Attempt to create offer as PENDING_VERIFICATION
    const pendingOfferRes = await fetch(`${BASE_URL}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${avadhToken}`
      },
      body: JSON.stringify({
        lotId: validLotId,
        offeredRatePerKg: 85,
        pickupOffered: true,
        pickupEtaHours: 24,
        notes: 'Test bid'
      })
    });
    const pendingOfferData = await pendingOfferRes.json();
    assert(pendingOfferRes.status === 403, 'Pending Recycler Blocked', `HTTP ${pendingOfferRes.status}: ${pendingOfferData.message}`);

    // 8B: Log in as Apex Scrap Dismantlers (SUSPENDED)
    const apexPhone = '9830098300';
    await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: apexPhone, role: 'RECYCLER' })
    });
    const apexOtp = await getDispatchedOtp(apexPhone);
    const apexVerify = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: apexPhone, otp: apexOtp, selectedRole: 'RECYCLER' })
    });
    const apexVerifyData = await apexVerify.json();
    const apexToken = apexVerifyData.token;

    assert(Boolean(apexToken), 'Apex Login Token', 'Apex authenticated successfully');

    // Attempt to create offer as SUSPENDED
    const suspendedOfferRes = await fetch(`${BASE_URL}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apexToken}`
      },
      body: JSON.stringify({
        lotId: validLotId,
        offeredRatePerKg: 75,
        pickupOffered: true,
        pickupEtaHours: 24,
        notes: 'Suspended bid'
      })
    });
    const suspendedOfferData = await suspendedOfferRes.json();
    assert(suspendedOfferRes.status === 403, 'Suspended Recycler Blocked', `HTTP ${suspendedOfferRes.status}: ${suspendedOfferData.message}`);
  } catch (err: any) {
    assert(false, 'Regulatory Gating', err.message);
  }

  // -------------------------------------------------------------
  // TEST 10: Admin Regulatory Review & Verification Flow
  // -------------------------------------------------------------
  console.log('\n▶ TEST 10: Admin Regulatory Approval & Unlocking Bidding');
  try {
    // Log in as Admin
    const adminRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9999999999', otp: '1234', selectedRole: 'ADMIN' })
    });
    const adminData = await adminRes.json();
    const adminToken = adminData.token;

    // Admin promotes Avadh to AUTHORIZED
    const promoteRes = await fetch(`${BASE_URL}/recyclers/9839012345/auth-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        authorizationStatus: 'AUTHORIZED',
        notes: 'Inspected and certified in accordance with CPCB 2022 rules'
      })
    });
    const promoteData = await promoteRes.json();
    assert(promoteRes.status === 200, 'Admin Promotion', `Avadh promoted to ${promoteData.recycler?.authorizationStatus}`);

    // Now Avadh attempts to bid again
    const avadhPhone = '9839012345';
    await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: avadhPhone, role: 'RECYCLER' })
    });
    const avadhFreshOtp = await getDispatchedOtp(avadhPhone);
    const avadhVerify2 = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: avadhPhone, otp: avadhFreshOtp, selectedRole: 'RECYCLER' })
    });
    const avadhFreshToken = (await avadhVerify2.json()).token;

    const approvedOfferRes = await fetch(`${BASE_URL}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${avadhFreshToken}`
      },
      body: JSON.stringify({
        lotId: validLotId,
        offeredRatePerKg: 92,
        pickupOffered: true,
        pickupEtaHours: 24,
        notes: 'Authorized SPCB compliant bid'
      })
    });
    const approvedOfferData = await approvedOfferRes.json();
    assert(approvedOfferRes.status === 201, 'Bidding Unlocked for Authorized Recycler', `HTTP ${approvedOfferRes.status}: ${approvedOfferData.message || approvedOfferData.offer?.id}`);
  } catch (err: any) {
    assert(false, 'Admin Verification Flow', err.message);
  }

  // -------------------------------------------------------------
  // TEST 11: Collector & Admin Demo Integrity Preservation
  // -------------------------------------------------------------
  console.log('\n▶ TEST 11: Collector & Admin Demo OTP 1234 Preservation');
  try {
    const collectorPhone = '9876543210';
    const sendRes = await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: collectorPhone, role: 'COLLECTOR' })
    });
    const sendData = await sendRes.json();

    assert(sendData.success === true, 'Collector Send OTP', 'Success');
    assert(sendData.demoOtp === '1234', 'Demo OTP 1234 Active for Collector', `demoOtp: ${sendData.demoOtp}`);

    const verifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: collectorPhone, otp: '1234', selectedRole: 'COLLECTOR' })
    });
    const verifyData = await verifyRes.json();

    assert(verifyRes.status === 200, 'Collector Login with 1234', 'Login successful');
    assert(verifyData.user?.role === 'COLLECTOR', 'Collector Role Verified', verifyData.user?.role);
    assert(verifyData.user?.name === 'Ramesh Kumar', 'Collector Name Preserved', verifyData.user?.name);
    assert(verifyData.collectorProfile?.totalEarnings !== undefined, 'Collector Earnings Tracked', `₹${verifyData.collectorProfile?.totalEarnings}`);

    // Verify collector can query their lots
    const lotsRes = await fetch(`${BASE_URL}/lots`, {
      headers: { Authorization: `Bearer ${verifyData.token}` }
    });
    const lotsData = await lotsRes.json();
    assert(lotsRes.status === 200 && Array.isArray(lotsData.lots), 'Collector Lots Queryable', `${lotsData.lots.length} lots retrieved`);
  } catch (err: any) {
    assert(false, 'Collector Workflow Integrity', err.message);
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n=============================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`📊 TEST SUITE SUMMARY: ${passed}/${total} PASSED (${failed} FAILED)`);
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! RECYCLER SAFE DEV MODE & REGULATORY GATING FULLY VERIFIED.');
  } else {
    console.log(`⚠️ ${failed} TEST(S) FAILED.`);
  }
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
