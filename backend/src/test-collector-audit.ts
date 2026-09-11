export {};

const BASE_URL = 'http://127.0.0.1:5000';

async function req(url: string, options: any = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runCollectorAudit() {
  console.log('\n======================================================');
  console.log('🧪 PROMPT 2: COLLECTOR PANEL REAL-DATA & WORKFLOW AUDIT');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} - ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  // 1. Authenticate as Collector
  console.log('--- Step 1: Collector Authentication & Session ---');
  const loginRes = await req('/api/auth/verify-otp', {
    method: 'POST',
    body: {
      phone: '9876543210',
      otp: '1234',
      selectedRole: 'COLLECTOR'
    }
  });
  assert(loginRes.status === 200 && loginRes.data.success, 'Collector OTP login succeeded');
  const token = loginRes.data.token;
  const user = loginRes.data.user;
  const collector = loginRes.data.collectorProfile;
  assert(user.role === 'COLLECTOR', 'Authenticated user role is COLLECTOR');
  assert(collector && collector.phone === '9876543210', 'Collector profile matches authenticated phone');
  assert(collector.district === 'Lucknow', 'Collector district is Lucknow');

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  // 2. Fetch Collector Dashboard Dynamic Values
  console.log('\n--- Step 2: Collector Dashboard Dynamic Metrics ---');
  const [lotsRes, ledgerRes, pricesRes] = await Promise.all([
    req('/api/lots', authHeader),
    req('/api/payments/collector', authHeader),
    req('/api/prices/board?district=Lucknow', authHeader)
  ]);

  assert(lotsRes.data.success && Array.isArray(lotsRes.data.lots), 'Fetched real collector lots');
  assert(ledgerRes.data.success && ledgerRes.data.summary !== undefined, 'Fetched real collector ledger summary');
  assert(pricesRes.data.success && Array.isArray(pricesRes.data.prices), 'Fetched real Lucknow price board');

  const initialLotsCount = lotsRes.data.lots.length;
  const summary = ledgerRes.data.summary;
  assert(typeof summary.todayEarnings === 'number', 'todayEarnings is a valid number');
  assert(typeof summary.totalEarnings === 'number', 'totalEarnings is a valid number');
  assert(typeof summary.completedTransactionsCount === 'number', 'completedTransactionsCount is a valid number');
  console.log(`    Current collector lots: ${initialLotsCount}`);
  console.log(`    Total earnings: ₹${summary.totalEarnings}, Today: ₹${summary.todayEarnings}`);

  // 3. Create Real E-Waste Lot
  console.log('\n--- Step 3: Add E-Waste Lot Creation & Persistence ---');
  const lotPayload = {
    materialCategory: 'PCB',
    subCategory: 'Computer Motherboard / Green Circuit Board',
    description: 'Audit Test: Authentic High-Grade PCB scrap lot',
    approxWeight: 25.5,
    condition: 'INTACT',
    sourceType: 'COMMERCIAL',
    locationDistrict: 'Lucknow',
    locationState: 'Uttar Pradesh',
    latitude: 26.8467,
    longitude: 80.9462,
    locationSource: 'DEVICE_GPS'
  };

  const createLotRes = await req('/api/lots', {
    method: 'POST',
    body: lotPayload,
    ...authHeader
  });
  assert(createLotRes.status === 201 && createLotRes.data.success, 'Lot created successfully');
  const newLot = createLotRes.data.lot;
  assert(newLot.id.startsWith('EW-'), `Generated genuine sequential lot ID: ${newLot.id}`);
  assert(newLot.approxWeight === 25.5, 'Persisted correct weight (25.5 kg)');
  assert(newLot.materialCategory === 'PCB', 'Persisted correct materialCategory (PCB)');
  assert(newLot.status === 'CREATED', 'Initial status is CREATED');
  assert(newLot.collectorId === collector.id, 'Attached authenticated collector ID');
  assert(typeof newLot.handoverOtp === 'string' && newLot.handoverOtp.length === 4, `Generated 4-digit handover OTP: ${newLot.handoverOtp}`);

  // 4. Verify Immediate Reflection in "My Requests / Lots"
  console.log('\n--- Step 4: Verify Reflection in My Requests / Lots ---');
  const updatedLotsRes = await req('/api/lots', authHeader);
  const foundLot = updatedLotsRes.data.lots.find((l: any) => l.id === newLot.id);
  assert(foundLot !== undefined, 'Newly created lot immediately returned in getLots()');
  assert(updatedLotsRes.data.lots.length === initialLotsCount + 1, 'Lot count incremented by exactly 1');

  // 5. Verify Object-Level IDOR Protection (Different collector cannot see this lot)
  console.log('\n--- Step 5: IDOR Security Isolation ---');
  const otherLoginRes = await req('/api/auth/verify-otp', {
    method: 'POST',
    body: {
      phone: '9111111111',
      otp: '1234',
      selectedRole: 'COLLECTOR',
      name: 'Different Collector',
      district: 'Pune'
    }
  });
  const otherAuth = { headers: { Authorization: `Bearer ${otherLoginRes.data.token}` } };
  const otherLotsRes = await req('/api/lots', otherAuth);
  const leakedLot = otherLotsRes.data.lots.find((l: any) => l.id === newLot.id);
  assert(leakedLot === undefined, 'Other collector cannot see this lot (IDOR protected)');

  // 6. Recycler Matching & Official Quote
  console.log('\n--- Step 6: Recycler Interaction & Quote Flow ---');
  const recyclersRes = await req(`/api/recyclers?lotId=${newLot.id}&district=Lucknow`);
  assert(recyclersRes.data.success && recyclersRes.data.recyclers.length > 0, 'Matched CPCB authorized recyclers');
  const topRecycler = recyclersRes.data.recyclers[0];
  console.log(`    Matched top recycler: ${topRecycler.facilityName} (${topRecycler.id})`);

  const quoteRes = await req('/api/offers/request-quote', {
    method: 'POST',
    body: {
      lotId: newLot.id,
      recyclerId: topRecycler.id
    },
    ...authHeader
  });
  assert(quoteRes.data.success && quoteRes.data.offer !== undefined, 'Recycler quote created');
  const offer = quoteRes.data.offer;
  assert(offer.offeredRatePerKg > 0, `Quoted rate: ₹${offer.offeredRatePerKg}/kg`);

  // 7. Accept Offer
  console.log('\n--- Step 7: Offer Acceptance ---');
  const acceptRes = await req(`/api/offers/${offer.id}/accept`, {
    method: 'PATCH',
    ...authHeader
  });
  assert(acceptRes.data.success, 'Offer accepted by collector');

  // 8. Verify Lot Detail & Traceability
  console.log('\n--- Step 8: Real Lot Detail, OTP & Traceability ---');
  const lotDetailRes = await req(`/api/lots/${newLot.id}`, authHeader);
  assert(lotDetailRes.data.success, 'Fetched detailed lot view');
  assert(lotDetailRes.data.lot.status === 'ACCEPTED', 'Lot status updated to ACCEPTED');
  assert(lotDetailRes.data.lot.handoverOtp === newLot.handoverOtp, 'Lot handover OTP matches generated OTP');

  // 9. Cryptographic SHA-256 Integrity Verification
  console.log('\n--- Step 9: SHA-256 Merkle Chain Integrity Verification ---');
  const verifyRes = await req(`/api/traceability/${newLot.id}/verify-integrity`);
  assert(verifyRes.data.success, 'Traceability integrity verification endpoint responded');
  assert(verifyRes.data.isTamperFree === true, 'Traceability chain is 100% tamper-free');
  assert(verifyRes.data.algorithm === 'SHA-256 (Merkle DAG Hash Chaining)', 'Used SHA-256 Merkle DAG Hash Chaining');
  assert(verifyRes.data.totalEvents >= 1, `Verified ${verifyRes.data.totalEvents} cryptographic events in audit chain`);

  console.log(`\n======================================================`);
  console.log(`🎉 AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runCollectorAudit().catch((err) => {
  console.error('Fatal error during Collector Audit:', err);
  process.exit(1);
});
