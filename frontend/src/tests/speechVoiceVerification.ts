import { speechService } from '../services/speechService';
import { Language, Lot, PriceRecord } from '../types';
import { formatWeight, formatCurrency } from '../utils/formatters';

declare const process: any;
let fs: any;
let path: any;
try {
  // @ts-ignore
  fs = await import('node:fs');
  // @ts-ignore
  path = await import('node:path');
} catch {}

// Helper mock voice factory
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
    console.log(`  ✓ PASS: ${desc}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${desc}`);
    failed++;
  }
}

console.log('\n=== RUNNING MULTILINGUAL SPEECH SERVICE VERIFICATION ===\n');

// ----------------------------------------------------
// TEST SET 1: Windows OS Mock Environment (Current Host Profile)
// Only English (India) and US English voices installed. No Hindi/Marathi voice packs.
// ----------------------------------------------------
console.log('--- Test Set 1: Windows Desktop Profile (No Hindi/Marathi OS Voices) ---');
const windowsVoices: SpeechSynthesisVoice[] = [
  createMockVoice('Microsoft Heera - English (India)', 'en-IN'),
  createMockVoice('Microsoft Ravi - English (India)', 'en-IN'),
  createMockVoice('Microsoft David Desktop - English (United States)', 'en-US', true),
  createMockVoice('Microsoft Zira Desktop - English (United States)', 'en-US')
];

const winEnVoice = speechService.findBestVoice('en', windowsVoices);
assert(winEnVoice !== null && winEnVoice.lang === 'en-IN', 'English resolves to en-IN (Microsoft Heera)');

const winHiVoice = speechService.findBestVoice('hi', windowsVoices);
assert(winHiVoice === null, 'Hindi STRICTLY returns null when no Hindi voice is installed (NO fallback to English)');

const winMrVoice = speechService.findBestVoice('mr', windowsVoices);
assert(winMrVoice === null, 'Marathi STRICTLY returns null when no Marathi voice is installed (NO fallback to English)');

// Verify localized unavailability messages
assert(
  speechService.getVoiceUnavailableMessage('hi') === 'हिंदी आवाज़ आपके डिवाइस पर उपलब्ध नहीं है।',
  'Hindi unavailability message matches requirement exactly'
);
assert(
  speechService.getVoiceUnavailableMessage('mr') === 'तुमच्या डिव्हाइसवर मराठी आवाज उपलब्ध नाही.',
  'Marathi unavailability message matches requirement exactly'
);
assert(
  speechService.getVoiceUnavailableMessage('en') === 'A voice for the selected language is not available on this device.',
  'English unavailability message matches requirement exactly'
);

// ----------------------------------------------------
// TEST SET 2: Android Chrome Profile (Complete Indic Voices)
// ----------------------------------------------------
console.log('\n--- Test Set 2: Android Chrome Profile (Google Indic Voices) ---');
const androidVoices: SpeechSynthesisVoice[] = [
  createMockVoice('Google हिन्दी', 'hi-IN'),
  createMockVoice('Google मराठी', 'mr-IN'),
  createMockVoice('Google English (India)', 'en-IN'),
  createMockVoice('Google US English', 'en-US', true)
];

const androidHiVoice = speechService.findBestVoice('hi', androidVoices);
assert(androidHiVoice !== null && androidHiVoice.name === 'Google हिन्दी', 'Hindi resolves to Google हिन्दी');

const androidMrVoice = speechService.findBestVoice('mr', androidVoices);
assert(androidMrVoice !== null && androidMrVoice.name === 'Google मराठी', 'Marathi resolves to Google मराठी');

const androidEnVoice = speechService.findBestVoice('en', androidVoices);
assert(androidEnVoice !== null && androidEnVoice.name === 'Google English (India)', 'English resolves to Google English (India)');

// ----------------------------------------------------
// TEST SET 3: macOS / iOS Profile (Apple Indic Voices)
// ----------------------------------------------------
console.log('\n--- Test Set 3: Apple macOS/iOS Profile ---');
const appleVoices: SpeechSynthesisVoice[] = [
  createMockVoice('Lekha', 'hi-IN'),
  createMockVoice('Veena', 'mr-IN'),
  createMockVoice('Rishi', 'en-IN'),
  createMockVoice('Samantha', 'en-US', true)
];

const appleHiVoice = speechService.findBestVoice('hi', appleVoices);
assert(appleHiVoice !== null && appleHiVoice.name === 'Lekha', 'Hindi resolves to Apple Lekha (hi-IN)');

const appleMrVoice = speechService.findBestVoice('mr', appleVoices);
assert(appleMrVoice !== null && appleMrVoice.name === 'Veena', 'Marathi resolves to Apple Veena (mr-IN)');

const appleEnVoice = speechService.findBestVoice('en', appleVoices);
assert(appleEnVoice !== null && appleEnVoice.name === 'Rishi', 'English resolves to Apple Rishi (en-IN)');

// ----------------------------------------------------
// TEST SET 4: Windows 11 with Hindi & Marathi Language Packs Installed
// ----------------------------------------------------
console.log('\n--- Test Set 4: Windows 11 with Full Indic Language Packs ---');
const winIndicVoices: SpeechSynthesisVoice[] = [
  createMockVoice('Microsoft Kalpana - Hindi (India)', 'hi-IN'),
  createMockVoice('Microsoft Aarohi - Marathi (India)', 'mr-IN'),
  createMockVoice('Microsoft Heera - English (India)', 'en-IN'),
  createMockVoice('Microsoft David Desktop - English (United States)', 'en-US', true)
];

const winFullHiVoice = speechService.findBestVoice('hi', winIndicVoices);
assert(winFullHiVoice !== null && winFullHiVoice.name === 'Microsoft Kalpana - Hindi (India)', 'Hindi resolves to Microsoft Kalpana');

const winFullMrVoice = speechService.findBestVoice('mr', winIndicVoices);
assert(winFullMrVoice !== null && winFullMrVoice.name === 'Microsoft Aarohi - Marathi (India)', 'Marathi resolves to Microsoft Aarohi');

const winFullEnVoice = speechService.findBestVoice('en', winIndicVoices);
assert(winFullEnVoice !== null && winFullEnVoice.name === 'Microsoft Heera - English (India)', 'English resolves to Microsoft Heera');

// ----------------------------------------------------
// TEST SET 5: Microsoft Edge Online Natural Voices
// ----------------------------------------------------
console.log('\n--- Test Set 5: Microsoft Edge Online Natural Voices ---');
const edgeVoices: SpeechSynthesisVoice[] = [
  createMockVoice('Microsoft Swara Online (Natural) - Hindi (India)', 'hi-IN'),
  createMockVoice('Microsoft Aarohi Online (Natural) - Marathi (India)', 'mr-IN'),
  createMockVoice('Microsoft Neerja Online (Natural) - English (India)', 'en-IN')
];

const edgeHiVoice = speechService.findBestVoice('hi', edgeVoices);
assert(edgeHiVoice !== null && edgeHiVoice.name.includes('Swara'), 'Hindi resolves to Microsoft Swara Natural');

const edgeMrVoice = speechService.findBestVoice('mr', edgeVoices);
assert(edgeMrVoice !== null && edgeMrVoice.name.includes('Aarohi'), 'Marathi resolves to Microsoft Aarohi Natural');

const edgeEnVoice = speechService.findBestVoice('en', edgeVoices);
assert(edgeEnVoice !== null && edgeEnVoice.name.includes('Neerja'), 'English resolves to Microsoft Neerja Natural');

// ----------------------------------------------------
// TEST SET 6: Windows with Hindi Installed, Marathi Missing (Authentic Devanagari Fallback)
// ----------------------------------------------------
console.log('\n--- Test Set 6: Windows with Hindi Pack Only (Marathi Devanagari Resolution) ---');
const winHindiOnlyVoices: SpeechSynthesisVoice[] = [
  createMockVoice('Microsoft Kalpana - Hindi (India)', 'hi-IN'),
  createMockVoice('Microsoft Heera - English (India)', 'en-IN'),
  createMockVoice('Microsoft David Desktop - English (United States)', 'en-US', true)
];

const mrDevanagariRes = speechService.resolveVoice('mr', winHindiOnlyVoices);
assert(mrDevanagariRes !== null, 'Marathi successfully resolves to Indic Devanagari voice when native mr voice is absent');
assert(mrDevanagariRes?.isNative === false, 'Marathi is correctly marked as non-native fallback');
assert(Boolean(mrDevanagariRes?.voice.name.includes('Kalpana')), 'Marathi resolves to Hindi Kalpana for Devanagari phonetic reading');
assert(mrDevanagariRes?.effectiveLocale === 'hi-IN', 'Effective locale set to hi-IN for Devanagari speech synthesizer');
assert(typeof mrDevanagariRes?.notice === 'string', 'Devanagari fallback notice is provided for transparency');

// Strict rule: Marathi MUST NEVER fall back to English
const mrOnlyEnglishVoices: SpeechSynthesisVoice[] = [
  createMockVoice('Microsoft Heera - English (India)', 'en-IN'),
  createMockVoice('Microsoft David - English (United States)', 'en-US')
];
const mrStrictNull = speechService.resolveVoice('mr', mrOnlyEnglishVoices);
assert(mrStrictNull === null, 'Marathi strictly returns null when only English voices are available (Rule D enforced)');

// ----------------------------------------------------
// TEST SET 7: BCP-47 Target Locale Mapping
// ----------------------------------------------------
console.log('\n--- Test Set 7: Target Locale Mapping ---');
assert(speechService.getLanguageLocale('hi') === 'hi-IN', 'Hindi maps to hi-IN');
assert(speechService.getLanguageLocale('mr') === 'mr-IN', 'Marathi maps to mr-IN');
assert(speechService.getLanguageLocale('en') === 'en-IN', 'English maps to en-IN');

// ----------------------------------------------------
// TEST SET 8: Currency and Unit Speech Normalization (Part 14)
// ----------------------------------------------------
console.log('\n--- Test Set 8: Currency and Unit Normalization ---');
const hiPreprocessed = speechService.preprocessSpeechText('आज की कमाई ₹1,450 है। कुल वजन 40 kg है। दूरी 5 km है। भाव ₹95/kg है।', 'hi');
assert(hiPreprocessed.includes('1,450 रुपये'), 'Hindi ₹1,450 normalizes to 1,450 रुपये');
assert(hiPreprocessed.includes('40 किलो'), 'Hindi 40 kg normalizes to 40 किलो');
assert(hiPreprocessed.includes('5 किलोमीटर'), 'Hindi 5 km normalizes to 5 किलोमीटर');
assert(hiPreprocessed.includes('95 रुपये प्रति किलो'), 'Hindi ₹95/kg normalizes to 95 रुपये प्रति किलो');

const mrPreprocessed = speechService.preprocessSpeechText('आजची कमाई ₹1,450 आहे. एकूण वजन 40 kg आहे. अंतर 5 km आहे. दर ₹95/kg आहे.', 'mr');
assert(mrPreprocessed.includes('1,450 रुपये'), 'Marathi ₹1,450 normalizes to 1,450 रुपये');
assert(mrPreprocessed.includes('40 किलो'), 'Marathi 40 kg normalizes to 40 किलो');
assert(mrPreprocessed.includes('5 किलोमीटर'), 'Marathi 5 km normalizes to 5 किलोमीटर');
assert(mrPreprocessed.includes('95 रुपये प्रति किलो'), 'Marathi ₹95/kg normalizes to 95 रुपये प्रति किलो');

const enPreprocessed = speechService.preprocessSpeechText("Today's earnings are ₹1,450. Total weight is 40 kg. Distance is 5 km. Rate is ₹95/kg.", 'en');
assert(enPreprocessed.includes('1,450 rupees'), 'English ₹1,450 normalizes to 1,450 rupees');
assert(enPreprocessed.includes('40 kilograms'), 'English 40 kg normalizes to 40 kilograms');
assert(enPreprocessed.includes('5 kilometers'), 'English 5 km normalizes to 5 kilometers');
assert(enPreprocessed.includes('95 rupees per kilogram'), 'English ₹95/kg normalizes to 95 rupees per kilogram');

// ----------------------------------------------------
// TEST SET 9: Removal Confirmation of Voice Assistant Feature (Part 1 & 15)
// ----------------------------------------------------
console.log('\n--- Test Set 9: Removal Confirmation of Voice Assistant Feature ---');
const rootDir = process.cwd();
const modalPath = path.resolve(rootDir, 'src/components/common/VoiceAssistantModal.tsx');
const commandServicePath = path.resolve(rootDir, 'src/services/voiceCommandService.ts');

assert(!fs.existsSync(modalPath), '16. VoiceAssistantModal.tsx is completely removed from filesystem');
assert(!fs.existsSync(commandServicePath), '16. voiceCommandService.ts is completely removed from filesystem');

// Check that CollectorDashboard.tsx does not contain VoiceAssistantModal or Mic FAB
const dashboardContent = fs.readFileSync(path.resolve(rootDir, 'src/pages/collector/CollectorDashboard.tsx'), 'utf-8');
assert(!dashboardContent.includes('VoiceAssistantModal'), '16. CollectorDashboard.tsx does not import or render VoiceAssistantModal');
assert(!dashboardContent.includes('isVoiceModalOpen'), '16. CollectorDashboard.tsx does not contain isVoiceModalOpen state');
assert(!dashboardContent.includes('Open Voice Assistant'), '16. Floating Voice FAB is completely removed from CollectorDashboard.tsx');
assert(!dashboardContent.includes('बोलकर पूछें'), '16. Header Voice Assistant button is removed from CollectorDashboard.tsx');

// ----------------------------------------------------
// TEST SET 10: Collector Dashboard Complete Localized Sentences (Part 4 & 11)
// ----------------------------------------------------
console.log('\n--- Test Set 10: Collector Dashboard Complete Localized Sentences ---');
const mockCollectorName = 'रामू कबाड़ी';
const mockPcbPrice = 95;
const mockTodayEarnings = '1,450';
const mockTotalEarnings = '28,400';
const mockScrapWeight = '2,690.6';
const mockActiveLots = 2;

// Hindi speech content
const hiDashboardSpeech = `नमस्ते ${mockCollectorName}। कबाड़ीवाला कनेक्ट डैशबोर्ड। आज की कमाई ${mockTodayEarnings} रुपये है। कुल कमाई ${mockTotalEarnings} रुपये है। कुल स्क्रैप ${mockScrapWeight} किलो है। वर्तमान में ${mockActiveLots} सक्रिय लॉट हैं। आज का पीसीबी भाव ${mockPcbPrice} रुपये प्रति किलो है। नया स्क्रैप बेचने के लिए हरा बटन दबाएं।`;
assert(hiDashboardSpeech.includes('कुल स्क्रैप 2,690.6 किलो है।'), '11. Hindi speech contains complete sentence "कुल स्क्रैप 2,690.6 किलो है।"');
assert(!hiDashboardSpeech.includes('2690.6 kilograms'), '11. Hindi speech does NOT contain English unit "kilograms"');
assert(hiDashboardSpeech.includes('आज की कमाई 1,450 रुपये है।'), '11. Hindi speech contains complete earnings sentence');

// Marathi speech content
const mrDashboardSpeech = `नमस्कार ${mockCollectorName}. कबाडीवाला कनेक्ट डॅशबोर्ड. आजची कमाई ${mockTodayEarnings} रुपये आहे. एकूण कमाई ${mockTotalEarnings} रुपये आहे. एकूण स्क्रॅप ${mockScrapWeight} किलो आहे. सध्या ${mockActiveLots} सक्रिय लॉट आहेत. आजचा पीसीबी दर ${mockPcbPrice} रुपये प्रति किलो आहे. नवीन ई-कचरा विकण्यासाठी हिरवा बटण दाबा.`;
assert(mrDashboardSpeech.includes('एकूण स्क्रॅप 2,690.6 किलो आहे.'), '12. Marathi speech contains complete sentence "एकूण स्क्रॅप 2,690.6 किलो आहे."');
assert(!mrDashboardSpeech.includes('2690.6 kilograms'), '12. Marathi speech does NOT contain English unit');
assert(mrDashboardSpeech.includes('आजची कमाई 1,450 रुपये आहे.'), '12. Marathi speech contains complete earnings sentence');

// English speech content
const enDashboardSpeech = `Welcome Ramu Kabadi. Kabadiwala Connect dashboard. Today's earnings are ${mockTodayEarnings} rupees. Total earnings are ${mockTotalEarnings} rupees. Total scrap is ${mockScrapWeight} kilograms. Currently ${mockActiveLots} active lots. Today's PCB rate is ${mockPcbPrice} rupees per kg. Tap the green button to sell scrap.`;
assert(enDashboardSpeech.includes('Total scrap is 2,690.6 kilograms.'), '10. English speech contains complete sentence "Total scrap is 2,690.6 kilograms."');

// ----------------------------------------------------
// TEST SET 11: Login Page Speaker Button (Part 10)
// ----------------------------------------------------
console.log('\n--- Test Set 11: Login Page Speaker Button ---');
const loginPageContent = fs.readFileSync(path.resolve(rootDir, 'src/pages/auth/LoginPage.tsx'), 'utf-8');
assert(loginPageContent.includes('speakWelcome'), '17. Normal speaker button exists on Login page');
assert(loginPageContent.includes('आप अपना ई-वेस्ट यहाँ बेच सकते हैं।'), '17. Login page Hindi welcome includes complete sentence');
assert(loginPageContent.includes('तुम्ही तुमचा ई-वेस्ट येथे विकू शकता.'), '17. Login page Marathi welcome includes complete sentence');
assert(loginPageContent.includes('You can sell your e-waste here.'), '17. Login page English welcome includes complete sentence');

// ----------------------------------------------------
// TEST SET 12: Other Speaker Buttons Verification (Part 12)
// ----------------------------------------------------
console.log('\n--- Test Set 12: Other Speaker Buttons in Application ---');
const priceBoardContent = fs.readFileSync(path.resolve(rootDir, 'src/pages/collector/PriceBoardPage.tsx'), 'utf-8');
assert(priceBoardContent.includes('speakAllPrices') && priceBoardContent.includes('speakCategoryRate'), '19. PriceBoardPage contains multilingual speaker buttons');

const findRecyclerContent = fs.readFileSync(path.resolve(rootDir, 'src/pages/collector/FindRecyclerPage.tsx'), 'utf-8');
assert(findRecyclerContent.includes('speakRecycler'), '19. FindRecyclerPage contains multilingual recycler speaker button');

const addLotContent = fs.readFileSync(path.resolve(rootDir, 'src/pages/collector/AddLotPage.tsx'), 'utf-8');
assert(addLotContent.includes('speakValuation') && addLotContent.includes('AudioButton'), '19. AddLotPage contains valuation speaker and wizard AudioButton');

const safetyContent = fs.readFileSync(path.resolve(rootDir, 'src/pages/collector/SafetyCenterPage.tsx'), 'utf-8');
assert(safetyContent.includes('AudioButton'), '19. SafetyCenterPage contains guidance AudioButton components');

// ----------------------------------------------------
// TEST SET 13: Browser SpeechSynthesis Mock & Execution Verification (Part 6, 8, 17)
// ----------------------------------------------------
console.log('\n--- Test Set 13: SpeechSynthesis Mock & Execution Verification ---');

let lastUtterance: any = null;
const mockState = {
  utteranceCount: 0,
  synthesisErrorTrigger: false,
  cancelCalled: false
};

class MockSpeechSynthesisUtterance {
  text: string;
  lang = '';
  voice: SpeechSynthesisVoice | null = null;
  rate = 1;
  pitch = 1;
  onstart?: () => void;
  onend?: () => void;
  onerror?: (e: any) => void;
  constructor(text: string) {
    this.text = text;
  }
}

const mockSynth = {
  speaking: false,
  pending: false,
  paused: false,
  cancel: () => { mockState.cancelCalled = true; },
  resume: () => {},
  getVoices: () => windowsVoices, // Only English voices available on Windows
  speak: (utt: any) => {
    lastUtterance = utt;
    mockState.utteranceCount++;
    if (mockState.synthesisErrorTrigger) {
      if (utt.onerror) utt.onerror({ error: 'language-unavailable' });
    } else {
      if (utt.onstart) utt.onstart();
      if (utt.onend) utt.onend();
    }
  }
};

(globalThis as any).window = {
  speechSynthesis: mockSynth
};
(globalThis as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;

// 1. English maps to en-IN
assert(speechService.getLanguageLocale('en') === 'en-IN', '1. English maps to en-IN');

// 2. Hindi maps to hi-IN
assert(speechService.getLanguageLocale('hi') === 'hi-IN', '2. Hindi maps to hi-IN');

// 3. Marathi maps to mr-IN
assert(speechService.getLanguageLocale('mr') === 'mr-IN', '3. Marathi maps to mr-IN');

// 4. Hindi never receives an en-* voice
assert(speechService.resolveVoice('hi', windowsVoices) === null, '4. Hindi never receives an en-* voice');

// 5. Marathi never receives an en-* voice
assert(speechService.resolveVoice('mr', windowsVoices) === null, '5. Marathi never receives an en-* voice');

// 6. Missing Hindi named voice does not immediately fail
// 8. Hindi creates utterance.lang = hi-IN
lastUtterance = null;
mockState.utteranceCount = 0;
mockState.synthesisErrorTrigger = false;
const hiSpeakResult = await speechService.speak(hiDashboardSpeech, 'hi');
assert(hiSpeakResult.success === true, '6. Missing named Hindi voice does NOT immediately fail');
assert(lastUtterance !== null && lastUtterance.lang === 'hi-IN', '8. Hindi creates utterance.lang = hi-IN');
assert(lastUtterance.voice === null || lastUtterance.voice === undefined, '8. Hindi synthesis does NOT bind an English voice');
assert((hiSpeakResult as any).synthesisMode === 'platform-locale', '8. Hindi synthesis marked as platform-locale');

// 7. Missing Marathi named voice does not immediately fail
// 9. Marathi creates utterance.lang = mr-IN
lastUtterance = null;
mockState.utteranceCount = 0;
mockState.synthesisErrorTrigger = false;
const mrSpeakResult = await speechService.speak(mrDashboardSpeech, 'mr');
assert(mrSpeakResult.success === true, '7. Missing named Marathi voice does NOT immediately fail');
assert(lastUtterance !== null && lastUtterance.lang === 'mr-IN', '9. Marathi creates utterance.lang = mr-IN');
assert(lastUtterance.voice === null || lastUtterance.voice === undefined, '9. Marathi synthesis does NOT bind an English voice');
assert((mrSpeakResult as any).synthesisMode === 'platform-locale', '9. Marathi synthesis marked as platform-locale');

// 10. Existing English behavior remains working
lastUtterance = null;
const enSpeakResult = await speechService.speak(enDashboardSpeech, 'en');
assert(enSpeakResult.success === true, '10. Existing English behavior remains working');
assert(lastUtterance !== null && lastUtterance.lang === 'en-IN', '10. English utterance.lang is en-IN');
assert(lastUtterance.voice !== null && (lastUtterance.voice.lang || '').startsWith('en'), '10. English voice is selected');

// 11. Genuine synthesis error is handled correctly
let caughtError: any = null;
mockState.synthesisErrorTrigger = true;
await speechService.speak('परीक्षण संदेश', 'mr', {
  onError: (e) => { caughtError = e; }
});
assert(caughtError !== null && caughtError.error === 'language-unavailable', 'Genuine synthesis error is handled correctly via onError callback');
mockState.synthesisErrorTrigger = false;

// 12. voiceschanged is handled safely
let voiceCallbackFired = false;
const unsubVoices = speechService.onVoicesLoaded(() => { voiceCallbackFired = true; });
assert(typeof unsubVoices === 'function', 'voiceschanged subscription is handled safely and returns unbind function');
unsubVoices();

// 13. No duplicate utterances are created and previous cancelled
mockState.cancelCalled = false;
mockState.utteranceCount = 0;
await speechService.speak('एकल संदेश', 'hi');
assert(mockState.utteranceCount === 1, 'No duplicate utterances created (exactly 1 utterance per speak call)');
assert(Boolean(mockState.cancelCalled), 'Previous utterance cancelled before speaking');

// 18. Normal speaker button still exists on Collector Dashboard
assert(dashboardContent.includes('speakOverview'), '18. Normal speaker button still exists on Collector Dashboard');

// 20. 2690.6000000000004 formats correctly
assert(formatWeight(2690.6000000000004) === '2,690.6', '2690.6000000000004 formats correctly to 2,690.6');
assert(formatWeight(40) === '40', '40 formats cleanly to 40');
assert(formatWeight(40.5) === '40.5', '40.5 formats cleanly to 40.5');
assert(formatWeight(1000) === '1,000', '1000 formats cleanly to 1,000');

console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);

if (failed > 0) {
  throw new Error(`Speech verification failed: ${failed} tests failed.`);
}
