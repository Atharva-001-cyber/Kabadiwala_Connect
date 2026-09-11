import { db } from '../db/store';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://127.0.0.1:5000/api';

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, detail?: any) {
  if (condition) {
    results.push({ name, passed: true, message: typeof detail === 'object' ? JSON.stringify(detail) : String(detail || '') });
    console.log(`  ✅ [PASS] ${name}${detail ? `: ${typeof detail === 'object' ? JSON.stringify(detail) : detail}` : ''}`);
  } else {
    results.push({ name, passed: false, message: typeof detail === 'object' ? JSON.stringify(detail) : String(detail || '') });
    console.error(`  ❌ [FAIL] ${name}${detail ? `: ${typeof detail === 'object' ? JSON.stringify(detail) : detail}` : ''}`);
  }
}

async function runDiscoveryMatchingSuite() {
  console.log('================================================================');
  console.log('🔍 RUNNING PHASE 3: COLLECTOR FIND RECYCLERS DISCOVERY & QUOTE SUITE');
  console.log('================================================================\n');

  // STEP 0: Authentication
  console.log('▶ STEP 0: Persona Authentication');
  const collectorLoginRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210', otp: '1234' })
  });
  const collectorLogin = await collectorLoginRes.json();
  const collectorToken = collectorLogin.token;
  assert(collectorLoginRes.status === 200 && Boolean(collectorToken), 'Collector Login Success', collectorLogin.user?.name);

  const judgeRecyclerLoginRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9820098200', otp: '123456', selectedRole: 'RECYCLER' })
  });
  const judgeRecyclerLogin = await judgeRecyclerLoginRes.json();
  const judgeToken = judgeRecyclerLogin.token;
  assert(judgeRecyclerLoginRes.status === 200 && Boolean(judgeToken), 'Judge Recycler (rec_abc_1) Login Success', judgeRecyclerLogin.recyclerProfile?.facilityName);

  await fetch(`${BASE_URL}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9123456780', role: 'RECYCLER' })
  });
  const compOtpRes = await fetch(`${BASE_URL}/auth/test-dispatched-otp?phone=9123456780`);
  const compOtpData = await compOtpRes.json();

  const greenEarthLoginRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9123456780', otp: compOtpData.otp, selectedRole: 'RECYCLER' })
  });
  const greenEarthLogin = await greenEarthLoginRes.json();
  const greenEarthToken = greenEarthLogin.token;
  assert(greenEarthLoginRes.status === 200 && Boolean(greenEarthToken), 'GreenEarth Recycler (rec_1) Login Success', greenEarthLogin.recyclerProfile?.facilityName);

  // STEP A: Collector Find Recyclers for PCB in Lucknow (rec_abc_1 discovery)
  console.log('\n▶ REQUIREMENT A & B: PCB / Lucknow Recycler Discovery (ABC & GreenEarth)');
  const pcbLkoRes = await fetch(`${BASE_URL}/recyclers?materialCategory=PCB&district=Lucknow`);
  assert(pcbLkoRes.status === 200, 'GET /recyclers Status HTTP 200', pcbLkoRes.status);
  const pcbLkoData = await pcbLkoRes.json();
  assert(pcbLkoData.success === true, 'Matching Query Success', `Count: ${pcbLkoData.count}`);

  const foundAbc = pcbLkoData.recyclers.find((r: any) => r.id === 'rec_abc_1');
  assert(Boolean(foundAbc), 'Requirement A: rec_abc_1 Discovered for PCB in Lucknow', foundAbc?.facilityName);
  assert(foundAbc?.district === 'Lucknow', 'ABC District is Lucknow', foundAbc?.district);
  assert(foundAbc?.authorizationStatus === 'AUTHORIZED', 'ABC Authorization Status is AUTHORIZED', foundAbc?.authorizationStatus);
  assert(foundAbc?.acceptedMaterials.includes('PCB'), 'ABC Accepted Materials Includes PCB', foundAbc?.acceptedMaterials);
  assert(foundAbc?.offeredRate === 100, 'ABC Offered Rate for PCB is ₹100/kg', `₹${foundAbc?.offeredRate}/kg`);

  const foundGreenEarth = pcbLkoData.recyclers.find((r: any) => r.id === 'rec_1');
  assert(Boolean(foundGreenEarth), 'Requirement B: GreenEarth (rec_1) Continues Appearing', foundGreenEarth?.facilityName);
  assert(foundGreenEarth?.district === 'Lucknow', 'GreenEarth District is Lucknow', foundGreenEarth?.district);
  assert(foundGreenEarth?.authorizationStatus === 'AUTHORIZED', 'GreenEarth Authorization Status is AUTHORIZED', foundGreenEarth?.authorizationStatus);

  // STEP C: Unauthorized & Pending Recyclers Excluded
  console.log('\n▶ REQUIREMENT C: Regulatory Gating (Unauthorized & Pending Recyclers Excluded)');
  // Ensure rec_avadh_1 is pending verification in DB to test gating
  const avadhRec = db.recyclers.find(r => r.id === 'rec_avadh_1');
  if (avadhRec) avadhRec.authorizationStatus = 'PENDING_VERIFICATION';
  db.save();

  const retestPendingRes = await fetch(`${BASE_URL}/recyclers?materialCategory=PCB&district=Lucknow`).then(r => r.json());
  const hasPendingInResults = retestPendingRes.recyclers.some((r: any) => r.authorizationStatus !== 'AUTHORIZED' && r.authorizationStatus !== 'CPCB_REGISTRY_VERIFIED');
  assert(!hasPendingInResults, 'Requirement C: Zero Pending/Suspended Recyclers in Results', 'Verified strictly authorized only');

  const foundApex = pcbLkoData.recyclers.find((r: any) => r.id === 'rec_apex_1');
  assert(!foundApex, 'Suspended Recycler (rec_apex_1) Excluded from Discovery', 'Excluded');

  // STEP D: Ineligible Material Recyclers Strictly Excluded
  console.log('\n▶ REQUIREMENT D: Material Incompatibility Exclusion (CRT & MAGNET)');
  const crtLkoRes = await fetch(`${BASE_URL}/recyclers?materialCategory=CRT&district=Lucknow`).then(r => r.json());
  const abcInCrt = crtLkoRes.recyclers.find((r: any) => r.id === 'rec_abc_1');
  assert(!abcInCrt, 'Requirement D: ABC Excluded for Incompatible Material CRT', 'rec_abc_1 does not accept CRT');
  const greenEarthInCrt = crtLkoRes.recyclers.find((r: any) => r.id === 'rec_1');
  assert(Boolean(greenEarthInCrt), 'GreenEarth Present for CRT (since GreenEarth accepts CRT)', greenEarthInCrt?.facilityName);

  const magnetLkoRes = await fetch(`${BASE_URL}/recyclers?materialCategory=MAGNET&district=Lucknow`).then(r => r.json());
  const abcInMagnet = magnetLkoRes.recyclers.find((r: any) => r.id === 'rec_abc_1');
  assert(!abcInMagnet, 'ABC Excluded for Incompatible Material MAGNET', 'rec_abc_1 does not accept MAGNET');

  // STEP E: Out-of-Service-Area Recyclers Excluded
  console.log('\n▶ REQUIREMENT E: Service Area / District Isolation');
  const puneRes = await fetch(`${BASE_URL}/recyclers?materialCategory=PCB&district=Pune`).then(r => r.json());
  const ecoCleanInPune = puneRes.recyclers.find((r: any) => r.id === 'rec_2');
  assert(Boolean(ecoCleanInPune), 'Requirement E: EcoClean (rec_2) Found in Pune', ecoCleanInPune?.facilityName);

  const abcInPune = puneRes.recyclers.find((r: any) => r.id === 'rec_abc_1');
  assert(!abcInPune, 'Lucknow Recycler (ABC) Excluded from Pune District Query', 'Excluded');

  const greenEarthInPune = puneRes.recyclers.find((r: any) => r.id === 'rec_1');
  assert(!greenEarthInPune, 'Lucknow Recycler (GreenEarth) Excluded from Pune District Query', 'Excluded');

  // STEP F: Explainable MCDA Ranking Algorithm (No Hardcoding)
  console.log('\n▶ REQUIREMENT F: Algorithmic MCDA Evaluation (Zero Hardcoded Bypasses)');
  assert(typeof foundAbc.matchScore === 'number' && foundAbc.matchScore > 0, 'Requirement F: ABC Evaluated via Organic Match Score', `${foundAbc.matchScore}%`);
  assert(Boolean(foundAbc.rankingExplanation), 'ABC has Explainable MCDA Ranking Breakdown', foundAbc.rankingExplanation.method);
  assert(foundAbc.rankingExplanation.materialScore === 30, 'ABC Material Score is 30/30 for PCB', foundAbc.rankingExplanation.materialScore);
  assert(foundAbc.rankingExplanation.pickupScore === 15, 'ABC Pickup Score is 15/15', foundAbc.rankingExplanation.pickupScore);
  assert(Array.isArray(foundAbc.rankingExplanation.reasons) && foundAbc.rankingExplanation.reasons.length > 0, 'ABC MCDA Reasons Explanations Present', `${foundAbc.rankingExplanation.reasons.length} reasons`);

  // STEP G & H: Collector Creates Lot & Requests Direct Quote (Real PENDING Offer, Zero Auto-Accept)
  console.log('\n▶ REQUIREMENT G & H: Real Direct Quote Generation (POST /api/offers/request-quote)');
  const testLotRes = await fetch(`${BASE_URL}/lots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${collectorToken}`
    },
    body: JSON.stringify({
      materialCategory: 'PCB',
      subCategory: 'Motherboards & Cards',
      description: 'Lot testing direct quote flow for rec_abc_1',
      approxWeight: 25.0,
      condition: 'INTACT',
      sourceType: 'HOUSEHOLD',
      imageUrl: 'http://localhost:5000/uploads/ewaste-1788456899951-397793705.jpg',
      imageUrls: ['http://localhost:5000/uploads/ewaste-1788456899951-397793705.jpg'],
      locationDistrict: 'Lucknow',
      locationState: 'Uttar Pradesh'
    })
  });
  const testLotData = await testLotRes.json();
  const testLotId = testLotData.lot.id;
  assert(testLotRes.status === 201 && Boolean(testLotId), 'Collector Created Scrap Lot', testLotId);
  assert(testLotData.lot.status === 'CREATED', 'Lot Initial Status is CREATED', testLotData.lot.status);

  // Request quote from rec_abc_1
  const quoteRes = await fetch(`${BASE_URL}/offers/request-quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${collectorToken}`
    },
    body: JSON.stringify({
      lotId: testLotId,
      recyclerId: 'rec_abc_1'
    })
  });
  assert(quoteRes.status === 201, 'Requirement G: POST /offers/request-quote Status HTTP 201', quoteRes.status);
  const quoteData = await quoteRes.json();
  const quoteOffer = quoteData.offer;
  assert(Boolean(quoteOffer?.id), 'Real Quote Offer Created with Unique ID', quoteOffer?.id);
  assert(quoteOffer?.status === 'PENDING', 'Quote Offer Status is strictly PENDING (NO AUTO-ACCEPT)', quoteOffer?.status);
  assert(quoteOffer?.recyclerId === 'rec_abc_1', 'Requirement H: Offer Bound to rec_abc_1', quoteOffer?.recyclerId);
  assert(quoteOffer?.recyclerName === 'ABC E-Waste Recycling Pvt Ltd', 'Offer Facility Bound to ABC E-Waste', quoteOffer?.recyclerName);
  assert(quoteOffer?.offeredRatePerKg === 100, 'Offer Rate Matches Recycler Profile Rate (₹100/kg)', quoteOffer?.offeredRatePerKg);
  assert(quoteOffer?.totalOfferedPrice === 2500, 'Offer Total Calculated Exactly (25kg * ₹100 = ₹2500)', quoteOffer?.totalOfferedPrice);
  assert(quoteOffer?.pickupOffered === true, 'Doorstep Pickup Offered is True', quoteOffer?.pickupOffered);

  // Quote on incompatible lot rejected
  const badQuoteRes = await fetch(`${BASE_URL}/offers/request-quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${collectorToken}`
    },
    body: JSON.stringify({
      lotId: testLotId,
      recyclerId: 'rec_avadh_1' // Avadh does not accept PCB and is pending
    })
  });
  assert(badQuoteRes.status === 403 || badQuoteRes.status === 400, 'Quote from Incompatible/Pending Recycler Rejected', badQuoteRes.status);

  // STEP I: Collector Sees Offer under My Requests & Lots
  console.log('\n▶ REQUIREMENT I: Collector Sees Offer under My Requests (GET /lots/:id)');
  const getLotRes = await fetch(`${BASE_URL}/lots/${testLotId}`, {
    headers: { 'Authorization': `Bearer ${collectorToken}` }
  });
  assert(getLotRes.status === 200, 'GET /lots/:id Status HTTP 200', getLotRes.status);
  const getLotData = await getLotRes.json();
  assert(getLotData.lot.status === 'OFFER_RECEIVED', 'Lot Status Transitioned to OFFER_RECEIVED', getLotData.lot.status);
  const offersList = getLotData.offers;
  const quoteInOffers = offersList.find((o: any) => o.id === quoteOffer.id);
  assert(Boolean(quoteInOffers), 'Requirement I: Quote Appears in Collector Lot Details', `Offer ${quoteOffer.id}`);
  assert(quoteInOffers?.status === 'PENDING', 'Quote Status in Collector View is PENDING', quoteInOffers?.status);

  // STEP J: Collector Accepts the Offer (PATCH /api/offers/:id/accept)
  console.log('\n▶ REQUIREMENT J: Collector Explicit Acceptance of the Quote');
  const acceptRes = await fetch(`${BASE_URL}/offers/${quoteOffer.id}/accept`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${collectorToken}`
    }
  });
  assert(acceptRes.status === 200, 'Requirement J: PATCH /offers/:id/accept Status HTTP 200', acceptRes.status);
  const acceptData = await acceptRes.json();
  assert(acceptData.offer.status === 'ACCEPTED', 'Offer Status -> ACCEPTED', acceptData.offer.status);
  assert(acceptData.lot.status === 'ACCEPTED', 'Lot Status -> ACCEPTED', acceptData.lot.status);
  assert(acceptData.lot.selectedRecyclerId === 'rec_abc_1', 'Lot selectedRecyclerId -> rec_abc_1', acceptData.lot.selectedRecyclerId);
  assert(acceptData.lot.selectedOfferId === quoteOffer.id, 'Lot selectedOfferId -> quoteOffer.id', acceptData.lot.selectedOfferId);

  // STEP K: Accepted Lot Visible to Winning Recycler (rec_abc_1) & Locked from Competitor
  console.log('\n▶ REQUIREMENT K: Recycler Views Accepted Lot & Competitor Isolation');
  const abcLotsRes = await fetch(`${BASE_URL}/lots`, {
    headers: { 'Authorization': `Bearer ${judgeToken}` }
  });
  const abcLotsData = await abcLotsRes.json();
  const abcAcceptedLot = abcLotsData.lots.find((l: any) => l.id === testLotId);
  assert(Boolean(abcAcceptedLot), 'Requirement K: Accepted Lot Visible to Winning Recycler (rec_abc_1)', `Lot ${testLotId}`);
  assert(abcAcceptedLot?.status === 'ACCEPTED', 'Lot Status in Recycler Listing is ACCEPTED', abcAcceptedLot?.status);
  assert(abcAcceptedLot?.selectedRecyclerId === 'rec_abc_1', 'Lot Bound to rec_abc_1', abcAcceptedLot?.selectedRecyclerId);

  // Competitor GreenEarth cannot view details of this accepted lot
  const competitorDetailRes = await fetch(`${BASE_URL}/lots/${testLotId}`, {
    headers: { 'Authorization': `Bearer ${greenEarthToken}` }
  });
  assert(competitorDetailRes.status === 403, 'Competitor (rec_1) Blocked with HTTP 403 from Viewing Accepted Lot', competitorDetailRes.status);

  // STEP L: Persistence Verification
  console.log('\n▶ REQUIREMENT L: Data Persistence Verification in db.json');
  const dbDiskRaw = fs.readFileSync(path.join(__dirname, '../../data/db.json'), 'utf8');
  const dbDisk = JSON.parse(dbDiskRaw);
  const diskLot = dbDisk.lots.find((l: any) => l.id === testLotId);
  assert(Boolean(diskLot), 'Requirement L: Lot Persisted to db.json on Disk', diskLot?.id);
  assert(diskLot?.status === 'ACCEPTED', 'Persisted Lot Status is ACCEPTED', diskLot?.status);
  assert(diskLot?.selectedRecyclerId === 'rec_abc_1', 'Persisted selectedRecyclerId is rec_abc_1', diskLot?.selectedRecyclerId);

  const diskOffer = dbDisk.offers.find((o: any) => o.id === quoteOffer.id);
  assert(Boolean(diskOffer), 'Persisted Quote Offer Exists in db.json', diskOffer?.id);
  assert(diskOffer?.status === 'ACCEPTED', 'Persisted Offer Status is ACCEPTED', diskOffer?.status);
  assert(diskOffer?.recyclerId === 'rec_abc_1', 'Persisted Offer Recycler ID is rec_abc_1', diskOffer?.recyclerId);

  const diskAbc = dbDisk.recyclers.find((r: any) => r.id === 'rec_abc_1');
  assert(diskAbc?.district === 'Lucknow', 'Persisted rec_abc_1 District is Lucknow', diskAbc?.district);

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
    console.log('\n✨ ALL DISCOVERY MATCHING & DIRECT QUOTE TESTS PASSED (100%)!\n');
  } else {
    console.error(`\n❌ ${failed} TESTS FAILED!\n`);
    process.exit(1);
  }
}

runDiscoveryMatchingSuite().catch(err => {
  console.error('Fatal error running test suite:', err);
  process.exit(1);
});
