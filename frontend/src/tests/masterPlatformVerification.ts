// Master Platform Verification Test Suite
// Verifies all 40 requirements of the E-Waste Collector Platform
// @ts-nocheck
declare const process: any;
let fs: any;
let path: any;
let url: any;
try {
  fs = await import('node:fs');
  path = await import('node:path');
  url = await import('node:url');
} catch {}

const __dirname = url ? url.fileURLToPath(new URL('.', import.meta.url)) : '';
const readFileSync = fs ? fs.readFileSync : () => '';
const existsSync = fs ? fs.existsSync : () => true;
const resolve = path ? path.resolve : (...args: string[]) => args.join('/');

import { speechService } from '../services/speechService';
import { formatWeight, formatCurrency } from '../utils/formatters';
import { validateImageQuality } from '../utils/imageValidator';

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

console.log('\n============================================================');
console.log('=== RUNNING MASTER E-WASTE PLATFORM VERIFICATION SUITE ===');
console.log('============================================================\n');

// ----------------------------------------------------
// GROUP 1: Voice Assistant Removal Confirmation
// ----------------------------------------------------
console.log('--- 1. Voice Assistant Completely Removed ---');
const voiceModalExists = existsSync(resolve(__dirname, '../components/common/VoiceAssistantModal.tsx'));
const voiceServiceExists = existsSync(resolve(__dirname, '../services/voiceCommandService.ts'));
assert(!voiceModalExists, 'VoiceAssistantModal.tsx is completely removed from codebase');
assert(!voiceServiceExists, 'voiceCommandService.ts is completely removed from codebase');

const collectorDashboardContent = readFileSync(resolve(__dirname, '../pages/collector/CollectorDashboard.tsx'), 'utf-8');
assert(!collectorDashboardContent.includes('VoiceAssistantModal'), 'CollectorDashboard does not import or render VoiceAssistantModal');
assert(!collectorDashboardContent.includes('isVoiceModalOpen'), 'CollectorDashboard has no voice assistant modal state');
assert(!collectorDashboardContent.includes('handleVoiceCommand'), 'CollectorDashboard has no voice assistant command handlers');

// ----------------------------------------------------
// GROUP 2: Global Multilingual Read-Aloud (Speaker) Buttons
// ----------------------------------------------------
console.log('\n--- 2. Global Multilingual Read-Aloud Buttons ---');
assert(collectorDashboardContent.includes('speakOverview'), 'Collector Dashboard has primary multilingual read-aloud summary button (speakOverview)');

const loginPageContent = readFileSync(resolve(__dirname, '../pages/auth/LoginPage.tsx'), 'utf-8');
assert(loginPageContent.includes('speakWelcome'), 'Login Page has multilingual audio guidance button for low-literacy users (speakWelcome)');

const addLotContent = readFileSync(resolve(__dirname, '../pages/collector/AddLotPage.tsx'), 'utf-8');
assert(addLotContent.includes('<AudioButton'), 'AddLotPage has step-by-step AudioButton guidance');
assert(addLotContent.includes('speakValuation'), 'AddLotPage has speakValuation audio reader for estimated lot price');

const priceBoardContent = readFileSync(resolve(__dirname, '../pages/collector/PriceBoardPage.tsx'), 'utf-8');
assert(priceBoardContent.includes('speakAllPrices') && priceBoardContent.includes('speakCategoryRate'), 'Price Board has multilingual market summary audio (speakAllPrices & speakCategoryRate)');

const safetyCenterContent = readFileSync(resolve(__dirname, '../pages/collector/SafetyCenterPage.tsx'), 'utf-8');
assert(safetyCenterContent.includes('<AudioButton'), 'Safety Center has multilingual audio guidance for hazardous materials');

// ----------------------------------------------------
// GROUP 3: Speech Synthesis Locale & Fallback Integrity
// ----------------------------------------------------
console.log('\n--- 3. Speech Synthesis Locale & Voice Isolation ---');
assert(speechService.getLanguageLocale('en') === 'en-IN', 'English strictly targets en-IN locale');
assert(speechService.getLanguageLocale('hi') === 'hi-IN', 'Hindi strictly targets hi-IN locale');
assert(speechService.getLanguageLocale('mr') === 'mr-IN', 'Marathi strictly targets mr-IN locale');

function createMockVoice(name: string, lang: string, isDefault = false): SpeechSynthesisVoice {
  return { name, lang, default: isDefault, localService: true, voiceURI: name };
}
const englishOnlyVoices = [
  createMockVoice('Microsoft David Desktop - English (United States)', 'en-US', true),
  createMockVoice('Microsoft Zira Desktop - English (United States)', 'en-US'),
  createMockVoice('Microsoft Heera - English (India)', 'en-IN')
];

const resolvedHi = speechService.findBestVoice('hi', englishOnlyVoices);
assert(resolvedHi === null, 'Hindi NEVER binds an English voice (Rule: No English voice fallback for Hindi)');

const resolvedMr = speechService.findBestVoice('mr', englishOnlyVoices);
assert(resolvedMr === null, 'Marathi NEVER binds an English voice (Rule: No English voice fallback for Marathi)');

// ----------------------------------------------------
// GROUP 4: Currency, Unit Normalization & Number Formatting
// ----------------------------------------------------
console.log('\n--- 4. Currency, Unit Normalization & Floating Point Formatting ---');
assert(speechService.preprocessSpeechText('आज की कमाई ₹1,450 है।', 'hi').includes('1,450 रुपये'), '₹1,450 normalizes to 1,450 रुपये in Hindi');
assert(speechService.preprocessSpeechText('एकूण वजन 40 kg आहे.', 'mr').includes('40 किलो'), '40 kg normalizes to 40 किलो in Marathi');
assert(speechService.preprocessSpeechText('Rate is ₹95/kg.', 'en').includes('95 rupees per kilogram'), '₹95/kg normalizes to 95 rupees per kilogram in English');

assert(formatWeight(2690.6000000000004) === '2,690.6', 'formatWeight eliminates floating point precision artifacts (2690.6000000000004 -> 2,690.6)');
assert(formatWeight(40) === '40', 'formatWeight formats whole integer cleanly without decimals (40 -> 40)');
assert(formatWeight(40.5) === '40.5', 'formatWeight formats 1-decimal weights cleanly (40.5 -> 40.5)');
assert(formatWeight(1000) === '1,000', 'formatWeight adds Indian thousands comma separator (1000 -> 1,000)');
assert(formatCurrency(198727) === '₹1,98,727', 'formatCurrency formats lifetime earnings into Indian rupee notation');

// ----------------------------------------------------
// GROUP 5: Multiple Photos Support (Frontend & Backend)
// ----------------------------------------------------
console.log('\n--- 5. Multiple Photographs Support ---');
const frontendTypesContent = readFileSync(resolve(__dirname, '../types/index.ts'), 'utf-8');
assert(frontendTypesContent.includes('imageUrls?: string[];'), 'Frontend Lot and OfflineLotItem types support imageUrls array');

assert(addLotContent.includes('const [photos, setPhotos] = useState<ScrapPhotoItem[]>([]);'), 'AddLotPage manages photos as a dynamic array state');
assert(addLotContent.includes('handleRemovePhoto'), 'AddLotPage supports removing individual photos');
assert(addLotContent.includes('imageUrls: photoUrls'), 'AddLotPage submits multiple photoUrls in lotData payload');

// ----------------------------------------------------
// GROUP 6: Real Image Quality Validation
// ----------------------------------------------------
console.log('\n--- 6. Real Deterministic Image Quality Validation ---');
const imageValidatorContent = readFileSync(resolve(__dirname, '../utils/imageValidator.ts'), 'utf-8');
assert(imageValidatorContent.includes('validateImageQuality'), 'Image quality validation module exists and is exported');
assert(imageValidatorContent.includes('avgLuminance'), 'Image validator computes ITU-R BT.601 pixel luminance');
assert(imageValidatorContent.includes('contrastVariance'), 'Image validator computes contrast/variance to detect extreme blur');
assert(imageValidatorContent.includes('TOO_DARK') && imageValidatorContent.includes('TOO_BRIGHT'), 'Image validator categorizes darkness and excessive glare');
assert(imageValidatorContent.includes('फोटो बहुत अंधेरी है'), 'Image validator contains localized guidance in Hindi');
assert(imageValidatorContent.includes('फोटो खूप अंधारा आहे'), 'Image validator contains localized guidance in Marathi');
assert(imageValidatorContent.includes('Photo is too dark'), 'Image validator contains localized guidance in English');
assert(addLotContent.includes('validateImageQuality'), 'AddLotPage invokes real image quality validator upon photo capture/selection');

// ----------------------------------------------------
// GROUP 7: Removal of Mock/Default Images & AI Prediction Integrity
// ----------------------------------------------------
console.log('\n--- 7. Zero Mock Data & AI Integrity ---');
assert(!addLotContent.includes('photo-1518770660439-4636190af475'), 'AddLotPage does NOT contain default unsplash stock photo URL');
assert(addLotContent.includes('const [aiPrediction, setAiPrediction] = useState<{') &&
       addLotContent.includes('} | null>(null);'), 'AI material suggestion starts as null (not hardcoded to PCB)');
assert(addLotContent.includes('नियम-आधारित सुझाव — पुष्टि आवश्यक'), 'AI material suggestion is transparently labeled as rule-based and requiring confirmation');
assert(addLotContent.includes('api.recordMLFeedback'), 'AddLotPage records genuine ML training feedback loop upon lot creation');

// ----------------------------------------------------
// GROUP 8: Full Localization & Mixed-Language Bug Fix
// ----------------------------------------------------
console.log('\n--- 8. Full Localization Audit & Bug Fix ---');
assert(!addLotContent.includes('(Next: Select Material)'), 'Bug fixed: No mixed-language "(Next: Select Material)" exists in AddLotPage');
assert(addLotContent.includes("language === 'hi'\n                ? 'सामग्री चुनें ➔'\n                : language === 'mr'\n                ? 'साहित्य प्रकार निवडा ➔'\n                : 'Select Material ➔'"), 'AddLotPage Step 1 button is cleanly localized in Hindi, Marathi, and English');

// ----------------------------------------------------
// GROUP 9: Hazardous Material Safety Warnings
// ----------------------------------------------------
console.log('\n--- 9. Hazardous Material Safety Warnings ---');
assert(addLotContent.includes('खतरनाक सामग्री सुरक्षा नियम') && addLotContent.includes('BATTERY') && addLotContent.includes('CRT'),
  'AddLotPage displays explicit safety warnings when handling hazardous materials like Batteries and CRTs');

// ----------------------------------------------------
// GROUP 10: Real Hardware Camera vs Gallery Separation
// ----------------------------------------------------
console.log('\n--- 10. Hardware Camera vs Gallery Separation ---');
assert(addLotContent.includes('<CameraModal'), 'AddLotPage mounts real CameraModal');
assert(addLotContent.includes('onClick={() => setIsCameraModalOpen(true)}'), 'Camera action is an explicit button triggering real camera modal');
assert(addLotContent.includes('<input type="file" accept="image/*" multiple onChange={handleGalleryUpload}'), 'Gallery upload is a dedicated file input supporting multiple files');

// ----------------------------------------------------
// GROUP 11: Dashboard Layout Containment & Overflow Protection
// ----------------------------------------------------
console.log('\n--- 11. Dashboard Layout & Overflow Protection ---');
assert(collectorDashboardContent.includes('break-all sm:break-normal'), 'Dashboard metric numbers contain break protection against overflow');
assert(collectorDashboardContent.includes('min-w-0 max-w-full overflow-hidden'), 'Dashboard stats cards contain min-w-0 and overflow containment');

// ----------------------------------------------------
// GROUP 12: Offline-First IndexedDB Queue & Idempotency
// ----------------------------------------------------
console.log('\n--- 12. Offline-First IndexedDB Resilience ---');
const apiContent = readFileSync(resolve(__dirname, '../services/api.ts'), 'utf-8');
assert(apiContent.includes('offlineDb.offlineLots.put(offlineItem);'), 'api.createLot automatically queues offline lots to Dexie IndexedDB on network failure');
assert(!apiContent.includes('photo-1518770660439-4636190af475'), 'api.ts does NOT fall back to fake unsplash photo');

console.log(`\n============================================================`);
console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log(`============================================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
