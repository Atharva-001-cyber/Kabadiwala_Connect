import assert from 'assert';

const BACKEND_BASE = 'http://127.0.0.1:5000/api';

async function runProductHardeningTests() {
  console.log('================================================================');
  console.log('🛡️ PRODUCT-LEVEL AUTHENTICATION & ROLE HARDENING TESTS');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function test(desc: string, fn: () => void) {
    total++;
    try {
      fn();
      passed++;
      console.log(`   ✅ [PASS] ${desc}`);
    } catch (e: any) {
      console.error(`   ❌ [FAIL] ${desc}:`, e.message);
    }
  }

  // 1. Role Mismatch Guard: Recycler number into Collector portal
  console.log('1️⃣ Testing Server-Authoritative Role Mismatch Guard...');
  const mismatchRes1 = await fetch(`${BACKEND_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9123456780', otp: '1234', selectedRole: 'COLLECTOR' })
  });
  const mismatchData1 = await mismatchRes1.json();

  test('Recycler phone with selectedRole=COLLECTOR returns HTTP 403', () => {
    assert.strictEqual(mismatchRes1.status, 403);
    assert.strictEqual(mismatchData1.success, false);
    assert.match(mismatchData1.message, /Role mismatch/i);
    assert.match(mismatchData1.message, /RECYCLER/i);
  });

  // 2. Role Mismatch Guard: Collector number into Recycler portal
  const mismatchRes2 = await fetch(`${BACKEND_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210', otp: '1234', selectedRole: 'RECYCLER' })
  });
  const mismatchData2 = await mismatchRes2.json();

  test('Collector phone with selectedRole=RECYCLER returns HTTP 403', () => {
    assert.strictEqual(mismatchRes2.status, 403);
    assert.strictEqual(mismatchData2.success, false);
    assert.match(mismatchData2.message, /Role mismatch/i);
    assert.match(mismatchData2.message, /COLLECTOR/i);
  });

  // 3. Matching Role: Collector phone with selectedRole=COLLECTOR succeeds
  console.log('\n2️⃣ Testing Matching Role Verification...');
  const matchRes = await fetch(`${BACKEND_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210', otp: '1234', selectedRole: 'COLLECTOR' })
  });
  const matchData = await matchRes.json();

  test('Collector phone with matching selectedRole=COLLECTOR succeeds with HTTP 200', () => {
    assert.strictEqual(matchRes.status, 200);
    assert.strictEqual(matchData.success, true);
    assert.strictEqual(matchData.user.role, 'COLLECTOR');
    assert.ok(matchData.token);
  });

  // 4. Matching Role: Recycler phone with selectedRole=RECYCLER succeeds
  const matchResRec = await fetch(`${BACKEND_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9123456780', otp: '1234', selectedRole: 'RECYCLER' })
  });
  const matchDataRec = await matchResRec.json();

  test('Recycler phone with matching selectedRole=RECYCLER succeeds with HTTP 200', () => {
    assert.strictEqual(matchResRec.status, 200);
    assert.strictEqual(matchDataRec.success, true);
    assert.strictEqual(matchDataRec.user.role, 'RECYCLER');
    assert.ok(matchDataRec.token);
  });

  // 5. Admin role guard: Unauthorized phone cannot register as admin
  console.log('\n3️⃣ Testing Admin Privilege Escalation Prevention...');
  const fakeAdminRes = await fetch(`${BACKEND_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9777777777', otp: '1234', selectedRole: 'ADMIN' })
  });
  const fakeAdminData = await fakeAdminRes.json();

  test('Unauthorized phone attempting ADMIN registration returns HTTP 403', () => {
    assert.strictEqual(fakeAdminRes.status, 403);
    assert.strictEqual(fakeAdminData.success, false);
    assert.match(fakeAdminData.message, /Unauthorized: Admin registration requires/i);
  });

  // 6. Authorized Admin succeeds
  const realAdminRes = await fetch(`${BACKEND_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999999999', otp: '1234', selectedRole: 'ADMIN' })
  });
  const realAdminData = await realAdminRes.json();

  test('Authorized Admin phone (9999999999) with selectedRole=ADMIN succeeds with HTTP 200', () => {
    assert.strictEqual(realAdminRes.status, 200);
    assert.strictEqual(realAdminData.success, true);
    assert.strictEqual(realAdminData.user.role, 'ADMIN');
  });

  console.log(`\n================================================================`);
  console.log(`🎯 HARDENING SUITE RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log(`================================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runProductHardeningTests().catch((e) => {
  console.error('Fatal error in hardening test:', e);
  process.exit(1);
});
