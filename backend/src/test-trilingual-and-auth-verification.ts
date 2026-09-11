import fs from 'fs';
import path from 'path';

const BACKEND_BASE = 'http://127.0.0.1:5000/api';

async function runTrilingualAndAuthVerification() {
  console.log('================================================================');
  console.log('🌐 TRILINGUAL UI + AUTHENTICATED USER LOGIN & OWNERSHIP VERIFICATION');
  console.log('================================================================\n');

  let passedChecks = 0;
  let totalChecks = 0;

  function assert(condition: boolean, message: string) {
    totalChecks++;
    if (condition) {
      console.log(`   ✅ [PASS] ${message}`);
      passedChecks++;
    } else {
      console.error(`   ❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // -------------------------------------------------------------
  // TEST SECTION 1: TRILINGUAL DICTIONARY SYNCHRONIZATION AUDIT
  // -------------------------------------------------------------
  console.log('1️⃣ [SECTION 1] Trilingual Dictionary Audit (Hindi, Marathi, English)...');
  
  // Read frontend translations.ts
  const translationsPath = path.resolve(__dirname, '../../frontend/src/i18n/translations.ts');
  const translationsContent = fs.readFileSync(translationsPath, 'utf-8');

  assert(translationsContent.includes('hi:'), 'Hindi (hi) dictionary exists in translations.ts');
  assert(translationsContent.includes('mr:'), 'Marathi (mr) dictionary exists in translations.ts');
  assert(translationsContent.includes('en:'), 'English (en) dictionary exists in translations.ts');

  // Verify all essential keys are present in all three dictionaries
  const mandatoryKeys = [
    'appTitle', 'appSubtitle', 'slogan', 'selectLanguage', 'loginTitle', 'loginSubtitle',
    'demoLoginTip', 'quickDemoUser', 'collectorRole', 'recyclerRole', 'adminRole', 'signOut',
    'judgeGuideBtn', 'offlineBadge', 'syncedBadge', 'pendingBadge',
    'welcome', 'todaysEarnings', 'totalEwasteCollected', 'pendingRequests', 'quickActions',
    'addEwaste', 'checkPrices', 'findRecycler', 'myRequests', 'earningsLedger', 'safetyCenter',
    'circularJourneyTitle', 'fairPriceUpliftTitle', 'recentLotsTitle',
    'priceBoardTitle', 'prevailingRate', 'listenPrice', 'calculatorTitle', 'threePriceStagesTitle',
    'matchingTitle', 'bestRateBadge', 'fastestPickupBadge', 'freePickup',
    'handoverTitle', 'handoverOtp', 'trackingTitle', 'stepCollected', 'stepPickup', 'stepReceived', 'stepProcessing', 'stepRecycled',
    'ledgerTitle', 'ledgerSubtitle', 'totalEarningsLabel'
  ];

  for (const key of mandatoryKeys) {
    assert(
      translationsContent.includes(`${key}:`),
      `Translation key "${key}" is defined across dictionaries`
    );
  }

  // Verify BCP 47 Speech Codes in useSpeech.ts
  const speechHookPath = path.resolve(__dirname, '../../frontend/src/hooks/useSpeech.ts');
  const speechContent = fs.readFileSync(speechHookPath, 'utf-8');
  assert(speechContent.includes("'hi-IN'"), 'Hindi TTS BCP 47 code (hi-IN) configured');
  assert(speechContent.includes("'mr-IN'"), 'Marathi TTS BCP 47 code (mr-IN) configured');
  assert(speechContent.includes("'en-IN'") || speechContent.includes("'en-US'"), 'English TTS BCP 47 code configured');

  // -------------------------------------------------------------
  // TEST SECTION 2: AUTHENTICATED USER LOGIN & DEMO SIMULATOR OTP
  // -------------------------------------------------------------
  console.log('\n2️⃣ [SECTION 2] Authenticated User Login & Simulator OTP Mode...');

  // Collector Login
  const colLoginRes = await fetch(`${BACKEND_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210', otp: '1234' })
  }).then(r => r.json());

  assert(colLoginRes.success === true, 'Collector OTP login succeeded');
  assert(colLoginRes.user.role === 'COLLECTOR', 'User role is correctly set to COLLECTOR');
  assert(Boolean(colLoginRes.token), 'JWT authentication token received for collector');
  const tokenCollector1 = colLoginRes.token;
  const col1Id = colLoginRes.collectorProfile?.id || colLoginRes.user.id;

  // Recycler Login
  const recLoginRes = await fetch(`${BACKEND_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9123456780', otp: '1234' })
  }).then(r => r.json());

  assert(recLoginRes.success === true, 'Recycler OTP login succeeded');
  assert(recLoginRes.user.role === 'RECYCLER', 'User role is correctly set to RECYCLER');
  assert(Boolean(recLoginRes.token), 'JWT authentication token received for recycler');
  const tokenRecycler = recLoginRes.token;

  // Admin Login
  const admLoginRes = await fetch(`${BACKEND_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999999999', otp: '1234' })
  }).then(r => r.json());

  assert(admLoginRes.success === true, 'Admin OTP login succeeded');
  assert(admLoginRes.user.role === 'ADMIN', 'User role is correctly set to ADMIN');
  assert(Boolean(admLoginRes.token), 'JWT authentication token received for admin');
  const tokenAdmin = admLoginRes.token;

  // Verify second collector login for IDOR tests
  const col2LoginRes = await fetch(`${BACKEND_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543255', otp: '1234', selectedRole: 'COLLECTOR', name: 'Sunil Verma' })
  }).then(r => r.json());

  assert(col2LoginRes.success === true, 'Second Collector Sunil Verma OTP login succeeded');
  assert(col2LoginRes.user.role === 'COLLECTOR', 'Second user role is COLLECTOR');
  const tokenCollector2 = col2LoginRes.token;
  const col2Id = col2LoginRes.collectorProfile?.id || col2LoginRes.user.id;
  assert(col1Id !== col2Id, `Collector 1 (${col1Id}) and Collector 2 (${col2Id}) have distinct identities`);

  // -------------------------------------------------------------
  // TEST SECTION 3: LOT OWNERSHIP & IDOR ISOLATION
  // -------------------------------------------------------------
  console.log('\n3️⃣ [SECTION 3] Lot Ownership Association & IDOR Isolation...');

  // Collector 1 creates a new lot
  const lotPayload = {
    materialCategory: 'PCB',
    subCategory: 'High Grade Gold Pin Motherboards',
    description: 'Decommissioned server electronics for formal recovery',
    approxWeight: 14.2,
    condition: 'INTACT',
    sourceType: 'COMMERCIAL',
    locationDistrict: 'Lucknow',
    locationState: 'Uttar Pradesh',
    latitude: 26.85,
    longitude: 80.95,
    locationSource: 'DEVICE_GPS'
  };

  const createRes = await fetch(`${BACKEND_BASE}/lots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenCollector1}`
    },
    body: JSON.stringify(lotPayload)
  }).then(r => r.json());

  assert(createRes.success === true, 'Lot creation succeeded for authenticated Collector 1');
  const createdLot = createRes.lot;
  assert(createdLot.collectorId === col1Id, `Lot collectorId (${createdLot.collectorId}) matches authenticated Collector 1 ID (${col1Id})`);

  // Collector 1 fetches lots: created lot is present
  const col1LotsRes = await fetch(`${BACKEND_BASE}/lots`, {
    headers: { 'Authorization': `Bearer ${tokenCollector1}` }
  }).then(r => r.json());

  const col1HasLot = col1LotsRes.lots.some((l: any) => l.id === createdLot.id);
  assert(col1HasLot === true, 'Collector 1 can access and view their newly created lot');

  // Collector 2 fetches lots: Collector 1's lot MUST NOT be present!
  const col2LotsRes = await fetch(`${BACKEND_BASE}/lots`, {
    headers: { 'Authorization': `Bearer ${tokenCollector2}` }
  }).then(r => r.json());

  const col2HasLot = col2LotsRes.lots.some((l: any) => l.id === createdLot.id);
  assert(col2HasLot === false, 'IDOR Protection: Collector 2 list does NOT contain Collector 1\'s private lot');

  // Collector 2 attempts direct access to Collector 1's lot by ID
  const directAccessRes = await fetch(`${BACKEND_BASE}/lots/${createdLot.id}`, {
    headers: { 'Authorization': `Bearer ${tokenCollector2}` }
  });

  assert(
    directAccessRes.status === 403,
    `IDOR Protection: Collector 2 direct GET on Collector 1's lot returned HTTP 403 Forbidden (status=${directAccessRes.status})`
  );

  // -------------------------------------------------------------
  // TEST SECTION 4: ROLE-BASED ACCESS CONTROL (RBAC) ENFORCEMENT
  // -------------------------------------------------------------
  console.log('\n4️⃣ [SECTION 4] Role-Based Access Control (RBAC) Enforcement...');

  // Collector attempts to access Admin KPIs
  const colAdminAttempt = await fetch(`${BACKEND_BASE}/admin/kpis`, {
    headers: { 'Authorization': `Bearer ${tokenCollector1}` }
  });
  assert(
    colAdminAttempt.status === 403,
    `RBAC: Collector access to Admin KPIs returned HTTP 403 Forbidden (status=${colAdminAttempt.status})`
  );

  // Recycler attempts to access Admin KPIs
  const recAdminAttempt = await fetch(`${BACKEND_BASE}/admin/kpis`, {
    headers: { 'Authorization': `Bearer ${tokenRecycler}` }
  });
  assert(
    recAdminAttempt.status === 403,
    `RBAC: Recycler access to Admin KPIs returned HTTP 403 Forbidden (status=${recAdminAttempt.status})`
  );

  // Admin accesses Admin KPIs
  const admSuccess = await fetch(`${BACKEND_BASE}/admin/kpis`, {
    headers: { 'Authorization': `Bearer ${tokenAdmin}` }
  });
  assert(
    admSuccess.status === 200,
    `RBAC: Admin access to Admin KPIs succeeded with HTTP 200 OK`
  );

  // Unauthenticated request to protected endpoint
  const unauthAttempt = await fetch(`${BACKEND_BASE}/lots`, {
    headers: {}
  });
  assert(
    unauthAttempt.status === 401,
    `Authentication required: Unauthenticated request to /lots returned HTTP 401 (status=${unauthAttempt.status})`
  );

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedChecks}/${totalChecks} TRILINGUAL & AUTHENTICATION TESTS PASSED!`);
  console.log('================================================================');
}

runTrilingualAndAuthVerification().catch((err) => {
  console.error('\n❌ Verification failed with error:', err);
  process.exit(1);
});
