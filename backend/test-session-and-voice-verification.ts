import { speechService } from '../../frontend/src/services/speechService';

const BASE_URL = 'http://127.0.0.1:5000/api';

function createMockVoice(name: string, lang: string, isDefault = false): SpeechSynthesisVoice {
  return {
    name,
    lang,
    default: isDefault,
    localService: true,
    voiceURI: name
  };
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`   ✅ [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`   ❌ [FAIL] ${desc}`);
    failed++;
  }
}

async function runSessionAndVoiceVerification() {
  console.log('================================================================');
  console.log('🔐 SESSION, ROLE SEPARATION & MULTILINGUAL VOICE VERIFICATION');
  console.log('================================================================\n');

  // 1. Role Separation & Identity Hardening
  console.log('1️⃣ Auditing Role Isolation & OTP Verification...');
  
  // Test Collector trying to login through Recycler portal (role mismatch)
  const mismatchRes1 = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '9876543210', // Registered Collector
      otp: '1234',
      selectedRole: 'RECYCLER' // Attempting Recycler login
    })
  });
  assert(mismatchRes1.status === 403, 'Collector account logging into Recycler portal is blocked with HTTP 403');

  // Test Recycler trying to login through Collector portal
  const mismatchRes2 = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '9123456780', // Registered Recycler
      otp: '1234',
      selectedRole: 'COLLECTOR' // Attempting Collector login
    })
  });
  assert(mismatchRes2.status === 403, 'Recycler account logging into Collector portal is blocked with HTTP 403');

  // Test Collector authenticating through Collector portal
  let collectorToken = '';
  const colRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '9876543210',
      otp: '1234',
      selectedRole: 'COLLECTOR'
    })
  });
  const colData = await colRes.json();
  assert(colRes.status === 200 && colData.user?.role === 'COLLECTOR', 'Collector authenticates successfully in Collector portal');
  collectorToken = colData.token;

  // Test Recycler authenticating through Recycler portal
  let recyclerToken = '';
  const recRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '9123456780',
      otp: '1234',
      selectedRole: 'RECYCLER'
    })
  });
  const recData = await recRes.json();
  assert(recRes.status === 200 && recData.user?.role === 'RECYCLER', 'Recycler authenticates successfully in Recycler portal');
  recyclerToken = recData.token;

  // 2. Cross-Role Route Authorization
  console.log('\n2️⃣ Testing Cross-Role Token Authorization (Zero Privilege Bleed)...');
  const adminCheck1 = await fetch(`${BASE_URL}/admin/kpis`, {
    headers: { Authorization: `Bearer ${collectorToken}` }
  });
  assert(adminCheck1.status === 403, 'Collector token blocked from Admin KPIs with HTTP 403');

  const adminCheck2 = await fetch(`${BASE_URL}/admin/kpis`, {
    headers: { Authorization: `Bearer ${recyclerToken}` }
  });
  assert(adminCheck2.status === 403, 'Recycler token blocked from Admin KPIs with HTTP 403');

  // 3. Multilingual Speech Engine Architecture
  console.log('\n3️⃣ Testing Multilingual Speech Engine (EN, HI, MR)...');

  // Profile A: Windows OS without native Marathi (has Hindi & English)
  const winOsVoices = [
    createMockVoice('Microsoft Kalpana - Hindi (India)', 'hi-IN'),
    createMockVoice('Microsoft Heera - English (India)', 'en-IN'),
    createMockVoice('Microsoft David Desktop - English (United States)', 'en-US', true)
  ];

  const enRes = speechService.resolveVoice('en', winOsVoices);
  assert(enRes !== null && enRes.effectiveLocale.startsWith('en'), 'EN resolves to authentic English voice (en-IN)');

  const hiRes = speechService.resolveVoice('hi', winOsVoices);
  assert(hiRes !== null && hiRes.isNative === true && hiRes.effectiveLocale === 'hi-IN', 'HI resolves to native Hindi voice (hi-IN)');

  const mrFallbackRes = speechService.resolveVoice('mr', winOsVoices);
  assert(
    mrFallbackRes !== null &&
    mrFallbackRes.isNative === false &&
    mrFallbackRes.effectiveLocale === 'hi-IN' &&
    mrFallbackRes.voice.name.includes('Kalpana'),
    'MR resolves to authentic Indic Devanagari voice fallback when native mr-IN is missing on device'
  );
  assert(
    Boolean(mrFallbackRes !== null && mrFallbackRes.notice?.includes('देवनागरी')),
    'MR resolution provides transparent Devanagari fallback notice for user feedback'
  );

  // Profile B: Android / Mobile with Native Marathi installed
  const mobileVoices = [
    createMockVoice('Google हिन्दी', 'hi-IN'),
    createMockVoice('Google मराठी', 'mr-IN'),
    createMockVoice('Google English (India)', 'en-IN')
  ];

  const mrNativeRes = speechService.resolveVoice('mr', mobileVoices);
  assert(
    mrNativeRes !== null &&
    mrNativeRes.isNative === true &&
    mrNativeRes.effectiveLocale === 'mr-IN' &&
    mrNativeRes.voice.name.includes('मराठी'),
    'MR prefers native Marathi voice (mr-IN) when available on device'
  );

  // Profile C: System with ONLY English voices (No Indic voices)
  const englishOnlyVoices = [
    createMockVoice('Microsoft David Desktop - English (United States)', 'en-US', true),
    createMockVoice('Microsoft Zira Desktop - English (United States)', 'en-US')
  ];

  const hiEnglishFallback = speechService.resolveVoice('hi', englishOnlyVoices);
  assert(hiEnglishFallback === null, 'HI STRICTLY refuses to fall back to English voice');

  const mrEnglishFallback = speechService.resolveVoice('mr', englishOnlyVoices);
  assert(mrEnglishFallback === null, 'MR STRICTLY refuses to fall back to English voice');

  console.log('\n================================================================');
  console.log(`🎯 VERIFICATION RESULTS: ${passed}/${passed + failed} TESTS PASSED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSessionAndVoiceVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
