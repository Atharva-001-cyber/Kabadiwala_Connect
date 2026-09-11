import { store } from './db/store';
import { calculateEstimatedValue } from './controllers/lot.controller';

const BASE = 'http://127.0.0.1:5000/api';

async function runPhase3Tests() {
  console.log('🧪 Starting Phase 3: Price Discovery & Value Estimation Automated Suite...\n');

  // 1. Price Board & 8 Mandatory Categories Retrieval Test
  console.log('1️⃣ Testing Price Board & 8 Mandatory Categories (GET /api/prices/board)...');
  const boardRes = await fetch(`${BASE}/prices/board?district=Lucknow`).then(r => r.json());
  if (!boardRes.success || !boardRes.prices || boardRes.prices.length < 8) {
    throw new Error(`Failed to fetch 8 categories for Lucknow, got ${boardRes.prices?.length}`);
  }
  const mandatoryCategories = ['PCB', 'BATTERY', 'CRT', 'LCD', 'CABLE', 'MOTOR', 'MAGNET', 'MIXED_PLASTIC'];
  const returnedCategories = boardRes.prices.map((p: any) => p.materialCategory);
  for (const cat of mandatoryCategories) {
    if (!returnedCategories.includes(cat)) {
      throw new Error(`Missing mandatory category in price board: ${cat}`);
    }
  }
  console.log(`   ✅ Price Board verified: ${boardRes.prices.length} categories available in Lucknow.`);

  // 2. Audio/TTS Multi-Lingual Text Verification
  console.log('\n2️⃣ Testing Multi-Lingual Audio / TTS Text Generation (Hindi, Marathi, English)...');
  const pcbPrice = boardRes.prices.find((p: any) => p.materialCategory === 'PCB');
  if (!pcbPrice.audioText || !pcbPrice.audioText.hi || !pcbPrice.audioText.mr || !pcbPrice.audioText.en) {
    throw new Error('Missing multi-lingual audio text in price record');
  }
  console.log(`   ✅ Hindi Audio Text: "${pcbPrice.audioText.hi}"`);
  console.log(`   ✅ Marathi Audio Text: "${pcbPrice.audioText.mr}"`);
  console.log(`   ✅ English Audio Text: "${pcbPrice.audioText.en}"`);

  // 3. Real Historical Price Trends (100% Genuine Stored Logs)
  console.log('\n3️⃣ Testing Historical Price Trends (GET /api/prices/history)...');
  const histRes = await fetch(`${BASE}/prices/history?category=PCB&district=Lucknow`).then(r => r.json());
  if (!histRes.success || histRes.isSynthetic || histRes.dataSource !== 'LIVE') {
    throw new Error('Historical price trend must be 100% genuine LIVE logs, zero synthetic curves');
  }
  if (!histRes.observedTrend || !['UP', 'DOWN', 'STABLE'].includes(histRes.observedTrend)) {
    throw new Error(`Invalid observed trend: ${histRes.observedTrend}`);
  }
  console.log(`   ✅ Genuine Price History: ${histRes.history.length} observations.`);
  console.log(`   ✅ Observed Trend: ${histRes.observedTrend} (${histRes.trendPercent > 0 ? '+' : ''}${histRes.trendPercent}%)`);
  console.log(`   ✅ Provenance: isSynthetic=${histRes.isSynthetic}, dataSource=${histRes.dataSource}`);

  // 4. Honest Insufficient Data State (No Fake Sine Waves)
  console.log('\n4️⃣ Testing Honest Insufficient Data Behavior (Zero Mathematical Sine Waves)...');
  const emptyHistRes = await fetch(`${BASE}/prices/history?category=CRT&district=NonExistentDistrict123`).then(r => r.json());
  if (emptyHistRes.hasSufficientData !== false || emptyHistRes.history.length !== 0) {
    throw new Error('Empty/unobserved district must return empty history rather than fabricating data points');
  }
  console.log(`   ✅ Honest Empty State: hasSufficientData=${emptyHistRes.hasSufficientData}, history.length=${emptyHistRes.history.length}, dataSource=${emptyHistRes.dataSource}`);

  // 5. Value Estimation & Three Distinct Price Concepts
  console.log('\n5️⃣ Testing Transparent Value Estimation & 3 Price Concepts (POST /api/prices/estimate)...');
  const estRes = await fetch(`${BASE}/prices/estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      materialCategory: 'PCB',
      weight: 15,
      condition: 'INTACT',
      district: 'Lucknow'
    })
  }).then(r => r.json());

  if (!estRes.success || !estRes.estimatedValue || !estRes.disclaimer) {
    throw new Error('Valuation calculation failed');
  }

  console.log('   ✅ Concept 1 (Estimated Value):', `₹${estRes.estimatedValue.min} – ₹${estRes.estimatedValue.max}`);
  console.log('      Formula:', estRes.estimatedValue.formula);
  console.log('   ✅ Concept 2 (Recycler Quoted Price):', estRes.recyclerQuotedPrice ? `₹${estRes.recyclerQuotedPrice.totalQuotedAmount} (${estRes.recyclerQuotedPrice.recyclerName})` : 'None active');
  console.log('   ✅ Concept 3 (Final Sale Benchmark):', estRes.finalSaleBenchmark ? `₹${estRes.finalSaleBenchmark.settledAmount} (${estRes.finalSaleBenchmark.transactionRef})` : 'At scale handover');
  console.log('   ✅ Mandatory Disclaimer:', `"${estRes.disclaimer.hi}"`);

  // 6. Live Price Observation Ingestion & Provenance Recording
  console.log('\n6️⃣ Testing Live Price Observation & Provenance Tracking (POST /api/prices/update)...');
  const loginRes = await fetch(`${BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9876543210', otp: '1234' })
  }).then(r => r.json());
  const token = loginRes.token;

  const updateRes = await fetch(`${BASE}/prices/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      materialCategory: 'CABLE',
      subCategory: 'Heavy Gauge Copper Cable',
      district: 'Lucknow',
      ratePerKg: 89.5,
      source: 'Mandi Gate Physical Audit',
      sourceType: 'ADMIN_BENCHMARK'
    })
  }).then(r => r.json());

  if (!updateRes.success || !updateRes.logEntry || updateRes.logEntry.dataSource !== 'LIVE') {
    throw new Error('Price update failed or did not set dataSource: LIVE');
  }
  console.log(`   ✅ Live Rate Ingested: ₹${updateRes.logEntry.ratePerKg}/kg for ${updateRes.logEntry.materialCategory}`);
  console.log(`   ✅ Provenance: Source="${updateRes.logEntry.source}", Status="${updateRes.logEntry.validationStatus}", DataSource="${updateRes.logEntry.dataSource}"`);

  // 7. Extreme Outlier Anomaly Flagging Guard
  console.log('\n7️⃣ Testing Outlier Price Anomaly Detection Guard (Deviation > 40%)...');
  const outlierRes = await fetch(`${BASE}/prices/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      materialCategory: 'PCB',
      subCategory: 'Suspect Rate Entry',
      district: 'Lucknow',
      ratePerKg: 350.0, // Benchmark is ~95, +268% deviation!
      source: 'Erroneous Test Feed',
      sourceType: 'ADMIN_BENCHMARK'
    })
  }).then(r => r.json());

  if (outlierRes.logEntry.validationStatus !== 'PENDING_REVIEW') {
    throw new Error(`Expected PENDING_REVIEW for extreme rate outlier, got ${outlierRes.logEntry.validationStatus}`);
  }
  console.log(`   ✅ Extreme Rate (₹350/kg vs ~₹95 benchmark) successfully intercepted! Status: ${outlierRes.logEntry.validationStatus}`);

  console.log('\n🎉 ALL 7 PHASE 3 PRICE DISCOVERY & VALUE ESTIMATION TESTS PASSED 100%!');
}

runPhase3Tests().catch(err => {
  console.error('❌ Phase 3 Test Suite Failed:', err);
  process.exit(1);
});
