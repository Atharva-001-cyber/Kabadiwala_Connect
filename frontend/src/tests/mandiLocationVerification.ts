// @ts-nocheck
import assert from 'assert';
import { formatLocationString, DISTRICT_STATE_MAP, MANDI_LOCATIONS, translations } from '../i18n/translations';

console.log('=== RUNNING MANDI LOCATION & GEOGRAPHY VERIFICATION ===');

// 1. Verify structured MANDI_LOCATIONS list
assert.strictEqual(MANDI_LOCATIONS.length, 5, '5 supported Mandi locations exist');

const expectedLocations = [
  { district: 'Lucknow', state: 'Uttar Pradesh', hi: 'लखनऊ, उत्तर प्रदेश', mr: 'लखनऊ, उत्तर प्रदेश', en: 'Lucknow, Uttar Pradesh' },
  { district: 'Pune', state: 'Maharashtra', hi: 'पुणे, महाराष्ट्र', mr: 'पुणे, महाराष्ट्र', en: 'Pune, Maharashtra' },
  { district: 'Nagpur', state: 'Maharashtra', hi: 'नागपुर, महाराष्ट्र', mr: 'नागपूर, महाराष्ट्र', en: 'Nagpur, Maharashtra' },
  { district: 'Delhi NCR', state: 'Delhi / NCR', hi: 'दिल्ली एनसीआर, दिल्ली / एनसीआर', mr: 'दिल्ली एनसीआर, दिल्ली / एनसीआर', en: 'Delhi NCR, Delhi / NCR' },
  { district: 'Bengaluru', state: 'Karnataka', hi: 'बेंगलुरु, कर्नाटक', mr: 'बंगळुरू, कर्नाटक', en: 'Bengaluru, Karnataka' }
];

for (const loc of expectedLocations) {
  // Check exact mapping in DISTRICT_STATE_MAP
  assert.strictEqual(DISTRICT_STATE_MAP[loc.district], loc.state, `${loc.district} maps strictly to ${loc.state}`);

  // Check formatLocationString with explicit state
  const outHi = formatLocationString(loc.district, loc.state, 'hi');
  const outMr = formatLocationString(loc.district, loc.state, 'mr');
  const outEn = formatLocationString(loc.district, loc.state, 'en');

  assert.strictEqual(outHi, loc.hi, `Hindi format for ${loc.district} is "${loc.hi}"`);
  assert.strictEqual(outMr, loc.mr, `Marathi format for ${loc.district} is "${loc.mr}"`);
  assert.strictEqual(outEn, loc.en, `English format for ${loc.district} is "${loc.en}"`);

  // Check formatLocationString without state (fallback lookup MUST NOT default to UP)
  const fallbackHi = formatLocationString(loc.district, '', 'hi');
  const fallbackMr = formatLocationString(loc.district, '', 'mr');
  const fallbackEn = formatLocationString(loc.district, '', 'en');

  assert.strictEqual(fallbackHi, loc.hi, `Fallback Hindi format for ${loc.district} without state is "${loc.hi}"`);
  assert.strictEqual(fallbackMr, loc.mr, `Fallback Marathi format for ${loc.district} without state is "${loc.mr}"`);
  assert.strictEqual(fallbackEn, loc.en, `Fallback English format for ${loc.district} without state is "${loc.en}"`);

  // Explicit assertion that non-UP districts NEVER contain "उत्तर प्रदेश" or "Uttar Pradesh"
  if (loc.district !== 'Lucknow') {
    assert(!outHi.includes('उत्तर प्रदेश'), `Non-UP district ${loc.district} must not contain उत्तर प्रदेश in Hindi`);
    assert(!outMr.includes('उत्तर प्रदेश'), `Non-UP district ${loc.district} must not contain उत्तर प्रदेश in Marathi`);
    assert(!outEn.includes('Uttar Pradesh'), `Non-UP district ${loc.district} must not contain Uttar Pradesh in English`);

    assert(!fallbackHi.includes('उत्तर प्रदेश'), `Fallback non-UP district ${loc.district} must not contain उत्तर प्रदेश in Hindi`);
    assert(!fallbackMr.includes('उत्तर प्रदेश'), `Fallback non-UP district ${loc.district} must not contain उत्तर प्रदेश in Marathi`);
    assert(!fallbackEn.includes('Uttar Pradesh'), `Fallback non-UP district ${loc.district} must not contain Uttar Pradesh in English`);
  }

  console.log(`  ✓ PASS: ${loc.district} -> ${loc.state} localized successfully`);
}

console.log('\n--- 2. Price Board Title Truthfulness ---');
assert(!translations.hi.priceBoardTitle.includes('सरकारी'), 'Hindi title does NOT claim "सरकारी" (government)');
assert(!translations.en.priceBoardTitle.includes('Official'), 'English title does NOT claim "Official"');
assert.strictEqual(translations.hi.priceBoardTitle, 'ई-वेस्ट भाव खोज बोर्ड', 'Hindi title is "ई-वेस्ट भाव खोज बोर्ड"');
assert.strictEqual(translations.mr.priceBoardTitle, 'ई-कचरा बाजारभाव शोध फलक', 'Marathi title is "ई-कचरा बाजारभाव शोध फलक"');
assert.strictEqual(translations.en.priceBoardTitle, 'E-Waste Price Discovery Board', 'English title is "E-Waste Price Discovery Board"');

console.log('  ✓ PASS: Price Board title truthfulness verified');

console.log('\n============================================================');
console.log('=== ALL MANDI LOCATION & TRUTHFULNESS TESTS PASSED (100%) ===');
console.log('============================================================\n');
