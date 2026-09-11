import { smsService } from './services/sms.service';
import { payoutService } from './services/payout.service';
import { geocodingService } from './services/geocoding.service';

const BASE = 'http://127.0.0.1:5000/api';

async function runFailureResilienceSuite() {
  console.log('================================================================');
  console.log('🛡️ SIH 2026 PS #229: REAL-WORLD FAILURE & DEFENSIVE RESILIENCE AUDIT');
  console.log('   "Validating Negative Scenarios, Edge Cases & Safe Truthful Failures"');
  console.log('================================================================\n');

  let passedScenarios = 0;

  // 1. INVALID OTP REJECTION
  console.log('1️⃣ Testing Invalid OTP Rejection...');
  const invalidOtpRes = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210', otp: '9999' })
  });
  if (invalidOtpRes.status === 400) {
    console.log(`   ✅ Correctly Rejected Invalid OTP with 400 Bad Request.`);
    passedScenarios++;
  } else {
    throw new Error(`Expected 400 on invalid OTP, got ${invalidOtpRes.status}`);
  }

  // 2. UNAUTHENTICATED PRIVATE ENDPOINT ACCESS
  console.log('\n2️⃣ Testing Unauthenticated Private Endpoint Access (Missing Token)...');
  const unauthRes = await fetch(`${BASE}/lots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ materialCategory: 'PCB', approxWeight: 10 })
  });
  if (unauthRes.status === 401) {
    console.log(`   ✅ Correctly Blocked Unauthenticated Request with 401 Unauthorized.`);
    passedScenarios++;
  } else {
    throw new Error(`Expected 401 on missing token, got ${unauthRes.status}`);
  }

  // Get collector token for subsequent tests
  const colToken = await getCollectorToken();
  const recToken = await getRecyclerToken();

  // 3. UNAUTHORIZED ROLE ACCESS (Collector attempting Admin endpoint)
  console.log('\n3️⃣ Testing Unauthorized Role Access (Collector attempting Admin KPI route)...');
  const forbiddenRes = await fetch(`${BASE}/admin/kpis`, {
    headers: { 'Authorization': `Bearer ${colToken}` }
  });
  if (forbiddenRes.status === 403) {
    console.log(`   ✅ Correctly Blocked Unauthorized Role with 403 Forbidden.`);
    passedScenarios++;
  } else {
    throw new Error(`Expected 403 on role mismatch, got ${forbiddenRes.status}`);
  }

  // 4. NEGATIVE WEIGHT REJECTION
  console.log('\n4️⃣ Testing Negative Weight Rejection during Lot Creation...');
  const negWeightRes = await fetch(`${BASE}/lots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${colToken}` },
    body: JSON.stringify({ materialCategory: 'PCB', approxWeight: -12.5 })
  });
  if (negWeightRes.status === 400) {
    console.log(`   ✅ Correctly Rejected Negative Weight with 400 Bad Request.`);
    passedScenarios++;
  } else {
    throw new Error(`Expected 400 on negative weight, got ${negWeightRes.status}`);
  }

  // 5. ZERO WEIGHT REJECTION
  console.log('\n5️⃣ Testing Zero Weight Rejection during Lot Creation...');
  const zeroWeightRes = await fetch(`${BASE}/lots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${colToken}` },
    body: JSON.stringify({ materialCategory: 'PCB', approxWeight: 0 })
  });
  if (zeroWeightRes.status === 400) {
    console.log(`   ✅ Correctly Rejected Zero Weight with 400 Bad Request.`);
    passedScenarios++;
  } else {
    throw new Error(`Expected 400 on zero weight, got ${zeroWeightRes.status}`);
  }

  // 6. MISSING MATERIAL CATEGORY REJECTION
  console.log('\n6️⃣ Testing Missing Material Category Rejection...');
  const missingCatRes = await fetch(`${BASE}/lots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${colToken}` },
    body: JSON.stringify({ materialCategory: '', approxWeight: 10 })
  });
  if (missingCatRes.status === 400) {
    console.log(`   ✅ Correctly Rejected Missing Category with 400 Bad Request.`);
    passedScenarios++;
  } else {
    throw new Error(`Expected 400 on missing category, got ${missingCatRes.status}`);
  }

  // 7. NON-EXISTENT LOT LOOKUP
  console.log('\n7️⃣ Testing Non-Existent Lot Lookup (404 Error Handling)...');
  const notFoundRes = await fetch(`${BASE}/lots/EW-NONEXISTENT-999999`);
  if (notFoundRes.status === 404) {
    console.log(`   ✅ Correctly Returned 404 Not Found for non-existent lot.`);
    passedScenarios++;
  } else {
    throw new Error(`Expected 404 on non-existent lot, got ${notFoundRes.status}`);
  }

  // Create a valid lot for subsequent failure tests
  const lotRes = await fetch(`${BASE}/lots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${colToken}` },
    body: JSON.stringify({
      materialCategory: 'PCB',
      approxWeight: 10,
      condition: 'INTACT',
      locationDistrict: 'Lucknow'
    })
  }).then(r => r.json());
  const testLot = lotRes.lot;

  // 8. HANDOVER WITH INVALID OTP REJECTION
  console.log('\n8️⃣ Testing Handover Verification with Wrong OTP...');
  const wrongOtpRes = await fetch(`${BASE}/handovers/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify({
      lotId: testLot.id,
      actualWeight: 10.2,
      handoverOtp: '0000', // Invalid OTP
      paymentMethod: 'CASH'
    })
  });
  if (wrongOtpRes.status === 400) {
    console.log(`   ✅ Correctly Rejected Handover with Wrong OTP (400 Bad Request).`);
    passedScenarios++;
  } else {
    throw new Error(`Expected 400 on wrong handover OTP, got ${wrongOtpRes.status}`);
  }

  // 9. HANDOVER WITH NEGATIVE/ZERO ACTUAL SCALE WEIGHT REJECTION
  console.log('\n9️⃣ Testing Handover Verification with Negative Scale Weight...');
  const negScaleRes = await fetch(`${BASE}/handovers/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify({
      lotId: testLot.id,
      actualWeight: -5.0,
      handoverOtp: testLot.handoverOtp,
      paymentMethod: 'CASH'
    })
  });
  if (negScaleRes.status === 400) {
    console.log(`   ✅ Correctly Rejected Negative Actual Scale Weight (400 Bad Request).`);
    passedScenarios++;
  } else {
    throw new Error(`Expected 400 on negative scale weight, got ${negScaleRes.status}`);
  }

  // 10. CROSS-COLLECTOR IDOR FINANCIAL PASSBOOK ACCESS BLOCKED
  console.log('\n🔟 Testing Cross-Collector IDOR Financial Ledger Protection...');
  const col2Token = await getCollector2Token();
  const idorRes = await fetch(`${BASE}/payments/collector/col_1`, {
    headers: { 'Authorization': `Bearer ${col2Token}` }
  });
  if (idorRes.status === 403) {
    console.log(`   ✅ Correctly Intercepted Cross-Collector IDOR Ledger Snooping (403 Forbidden).`);
    passedScenarios++;
  } else {
    throw new Error(`Expected 403 on cross-collector IDOR attempt, got ${idorRes.status}`);
  }

  // 11. INCOMPATIBLE RECYCLER QUOTE REQUEST REJECTION
  console.log('\n1️⃣1️⃣ Testing Incompatible Material Facility Quote Request...');
  const incompRes = await fetch(`${BASE}/offers/request-quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${colToken}` },
    body: JSON.stringify({
      lotId: testLot.id,
      recyclerId: 'rec_3' // rec_3 does not accept PCB
    })
  });
  const incompJson = await incompRes.json();
  if (incompRes.status === 400 || incompJson.success === false) {
    console.log(`   ✅ Correctly Handled Incompatible Facility Quote Request.`);
    passedScenarios++;
  } else {
    throw new Error(`Expected rejection on incompatible facility quote request`);
  }

  // 12. SCHEDULING PICKUP ON RECYCLED LOT REJECTION
  console.log('\n1️⃣2️⃣ Testing Defensive Guard against Scheduling Pickup on Already Recycled Lot...');
  // Create and recycle a separate lot
  const recLotRes = await fetch(`${BASE}/lots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${colToken}` },
    body: JSON.stringify({ materialCategory: 'BATTERY', approxWeight: 5, locationDistrict: 'Lucknow' })
  }).then(r => r.json());
  
  // Progress to RECYCLED
  await fetch(`${BASE}/traceability/stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify({
      lotId: recLotRes.lot.id,
      stage: 'RECYCLED',
      title: 'Recycling Completed',
      description: 'Done'
    })
  });

  const pickRecycledRes = await fetch(`${BASE}/pickups/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify({ lotId: recLotRes.lot.id })
  });
  if (pickRecycledRes.status === 400) {
    console.log(`   ✅ Correctly Blocked Pickup Scheduling on Already Recycled Lot (400 Bad Request).`);
    passedScenarios++;
  } else {
    throw new Error(`Expected 400 on recycled lot pickup schedule, got ${pickRecycledRes.status}`);
  }

  // 13. OFFLINE BATCH SYNC IDEMPOTENCY (Duplicate Lot Re-sync Prevention)
  console.log('\n1️⃣3️⃣ Testing Offline Lot Batch Sync Idempotency (Zero Duplicate Records)...');
  const clientLotId = `offline_resilience_${Date.now()}`;
  const sync1 = await fetch(`${BASE}/lots/sync-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${colToken}` },
    body: JSON.stringify({
      lots: [{
        clientLotId,
        materialCategory: 'PCB',
        approxWeight: 8,
        condition: 'INTACT',
        locationDistrict: 'Lucknow'
      }]
    })
  }).then(r => r.json());

  const sync2 = await fetch(`${BASE}/lots/sync-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${colToken}` },
    body: JSON.stringify({
      lots: [{
        clientLotId,
        materialCategory: 'PCB',
        approxWeight: 8,
        condition: 'INTACT',
        locationDistrict: 'Lucknow'
      }]
    })
  }).then(r => r.json());

  const allLots = await fetch(`${BASE}/lots`, {
    headers: { 'Authorization': `Bearer ${colToken}` }
  }).then(r => r.json());
  const matchingClientLots = allLots.lots.filter((l: any) => l.clientLotId === clientLotId);

  if (sync1.syncedCount === 1 && sync2.lots[0].id === sync1.lots[0].id && matchingClientLots.length === 1) {
    console.log(`   ✅ Idempotency Verified: Re-syncing existing clientLotId returned existing lot with exactly 1 DB record.`);
    passedScenarios++;
  } else {
    throw new Error(`Idempotency failed: second sync created duplicate lots`);
  }

  // 14. MALFORMED REQUEST BODY DEFENSIVE HANDLING
  console.log('\n1️⃣4️⃣ Testing Malformed Empty Request Handling...');
  const emptyBodyRes = await fetch(`${BASE}/lots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${colToken}` },
    body: JSON.stringify({})
  });
  if (emptyBodyRes.status === 400) {
    console.log(`   ✅ Correctly Handled Empty Request Body with 400 Bad Request.`);
    passedScenarios++;
  } else {
    throw new Error(`Expected 400 on empty body, got ${emptyBodyRes.status}`);
  }

  // 15. OPENSTREETMAP GEOCODING OFFLINE FALLBACK
  console.log('\n1️⃣5️⃣ Testing Geocoding Service Fallback on Invalid Coordinates...');
  const fallbackGeo = await geocodingService.reverseGeocode(999.0, 999.0, 'Pune');
  if (fallbackGeo.source === 'DISTRICT_FALLBACK' && fallbackGeo.district === 'Pune') {
    console.log(`   ✅ Geocoding Fallback Verified: Safely returned district centroid without crash.`);
    passedScenarios++;
  } else {
    throw new Error(`Expected DISTRICT_FALLBACK on out-of-range coordinates`);
  }

  // 16. SMS SERVICE FALLBACK TO LOCAL_SIMULATOR
  console.log('\n1️⃣6️⃣ Testing SMS Provider Fallback to Local Simulator...');
  const smsStatus = smsService.getProviderStatus();
  if (smsStatus.demoModeActive && smsStatus.currentProvider === 'LOCAL_SIMULATOR') {
    console.log(`   ✅ SMS Service Fallback Verified: Truthful simulator active without crash.`);
    passedScenarios++;
  } else {
    throw new Error(`SMS status did not report demoModeActive`);
  }

  // 17. PAYOUT ADAPTER FALLBACK TO DIGITAL_LEDGER_VOUCHER
  console.log('\n1️⃣7️⃣ Testing Payout Service Fallback to Digital Ledger Voucher...');
  const payoutStatus = payoutService.getProviderStatus();
  if (payoutStatus.internalLedgerActive && payoutStatus.currentProvider === 'INTERNAL_LEDGER') {
    console.log(`   ✅ Payout Fallback Verified: Double-entry ledger voucher active without fake bank claim.`);
    passedScenarios++;
  } else {
    throw new Error(`Payout status did not report internalLedgerActive`);
  }

  // 18. CONFIGURATION STATUS ENDPOINTS ACCESSIBILITY
  console.log('\n1️⃣8️⃣ Testing Public SMS and Payout Configuration Endpoints...');
  const smsCfgRes = await fetch(`${BASE}/auth/sms-config`).then(r => r.json());
  const payCfgRes = await fetch(`${BASE}/payments/payout-config`).then(r => r.json());
  if (smsCfgRes.success && payCfgRes.success) {
    console.log(`   ✅ Configuration Endpoints Accessible: SMS=${smsCfgRes.smsStatus.currentProvider}, Payout=${payCfgRes.payoutStatus.currentProvider}.`);
    passedScenarios++;
  } else {
    throw new Error(`Configuration status endpoints returned error`);
  }

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedScenarios}/18 REAL-WORLD FAILURE & DEFENSIVE TESTS PASSED 100%!`);
  console.log('================================================================\n');
}

async function getCollectorToken(): Promise<string> {
  const r = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210', otp: '1234' })
  }).then(res => res.json());
  return r.token;
}

async function getCollector2Token(): Promise<string> {
  const r = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543211', otp: '1234', name: 'Santosh Jadhav', district: 'Pune' })
  }).then(res => res.json());
  return r.token;
}

async function getRecyclerToken(): Promise<string> {
  const r = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9123456780', otp: '1234', selectedRole: 'RECYCLER' })
  }).then(res => res.json());
  return r.token;
}

runFailureResilienceSuite().catch(err => {
  console.error('❌ Failure Resilience Audit Failed:', err);
  process.exit(1);
});
