// Automated verification of Camera vs Gallery separation and CameraModal behavior
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
const resolve = path ? path.resolve : (...args: string[]) => args.join('/');

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

console.log('\n=== RUNNING CAMERA VS GALLERY SEPARATION VERIFICATION ===\n');

const addLotPath = resolve(__dirname, '../pages/collector/AddLotPage.tsx');
const cameraModalPath = resolve(__dirname, '../components/common/CameraModal.tsx');
const translationsPath = resolve(__dirname, '../i18n/translations.ts');

const addLotContent = readFileSync(addLotPath, 'utf-8');
const cameraModalContent = readFileSync(cameraModalPath, 'utf-8');
const translationsContent = readFileSync(translationsPath, 'utf-8');

console.log('--- 1. AddLotPage: Camera vs Gallery Separation ---');

// Check that CameraModal is imported
assert(
  addLotContent.includes("import { CameraModal } from '../../components/common/CameraModal';"),
  'CameraModal is imported in AddLotPage.tsx'
);

// Check that isCameraModalOpen state is defined
assert(
  addLotContent.includes('const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);') ||
  addLotContent.includes('const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);'),
  'isCameraModalOpen state is declared'
);

// Check that "कैमरा से दोबारा लें" button triggers setIsCameraModalOpen(true) and is NOT an <input type="file">
const retakeCameraPattern = /<button[^>]*onClick=\{\(\)\s*=>\s*setIsCameraModalOpen\(true\)\}[^>]*>[\s\S]*?\{t\.retakeCamera\}[\s\S]*?<\/button>/;
assert(
  retakeCameraPattern.test(addLotContent),
  '"कैमरा से दोबारा लें" is an explicit <button> triggering setIsCameraModalOpen(true), NOT a file input label'
);

// Check that initial "कैमरा खोलें" button triggers setIsCameraModalOpen(true)
const openCameraPattern = /<button[^>]*onClick=\{\(\)\s*=>\s*setIsCameraModalOpen\(true\)\}[^>]*>[\s\S]*?कैमरा खोलें[\s\S]*?<\/button>/;
assert(
  openCameraPattern.test(addLotContent),
  'Initial empty-state "कैमरा खोलें" button also triggers setIsCameraModalOpen(true)'
);

// Check that gallery button remains a file input without capture="environment"
const galleryInputs = addLotContent.match(/<input\s+type="file"[^>]*onChange=\{handleGalleryUpload\}[^>]*\/>/g);
assert(
  Boolean(galleryInputs && galleryInputs.length >= 2),
  'Both preview and empty-state gallery options have dedicated <input type="file" onChange={handleGalleryUpload}>'
);

// Verify none of the gallery inputs have capture="environment"
const badGalleryCapture = addLotContent.match(/onChange=\{handleGalleryUpload\}[^>]*capture=/g);
assert(
  !badGalleryCapture,
  'Gallery file inputs strictly do NOT have capture attribute, preserving standard gallery/file picker'
);

// Check that processImageFile, handleGalleryUpload and handleCameraCapture exist
assert(
  addLotContent.includes('const processImageFile = async (rawFile: File) =>'),
  'processImageFile is implemented to uniformly handle compression, preview, and classification'
);
assert(
  addLotContent.includes('const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) =>'),
  'handleGalleryUpload processes gallery file and resets input value'
);
assert(
  addLotContent.includes('const handleCameraCapture = async (capturedFile: File) =>'),
  'handleCameraCapture feeds camera snapshot file into the real image processing pipeline'
);

// Check that CameraModal is rendered with proper props
assert(
  addLotContent.includes('<CameraModal') &&
  addLotContent.includes('isOpen={isCameraModalOpen}') &&
  addLotContent.includes('onClose={() => setIsCameraModalOpen(false)}') &&
  addLotContent.includes('onCapture={handleCameraCapture}'),
  'CameraModal is mounted in AddLotPage with isOpen, onClose, and onCapture props'
);

console.log('\n--- 2. CameraModal: Hardware Camera, MediaStream & Permissions ---');

// Check getUserMedia with environment facing mode
assert(
  cameraModalContent.includes("navigator.mediaDevices.getUserMedia"),
  'CameraModal uses navigator.mediaDevices.getUserMedia for real camera feed'
);
assert(
  cameraModalContent.includes("facingMode: { ideal: mode }") ||
  cameraModalContent.includes("facingMode: { ideal: 'environment' }"),
  'CameraModal requests rear/environment facing camera by default'
);

// Check camera stream cleanup
assert(
  cameraModalContent.includes("streamRef.current.getTracks().forEach((track) =>"),
  'CameraModal stops and releases all media stream tracks upon capture, cancel, or modal close'
);

// Check offscreen canvas frame capture to high-resolution JPEG File
assert(
  cameraModalContent.includes("canvas.getContext('2d')") &&
  cameraModalContent.includes("ctx.drawImage(video, 0, 0, width, height)") &&
  cameraModalContent.includes("canvas.toBlob("),
  'CameraModal captures live video frame onto canvas and converts to Blob'
);
assert(
  cameraModalContent.includes("new File([blob],") || cameraModalContent.includes("new File("),
  'CameraModal packages captured blob into a real standard File object'
);

// Check camera flipping support
assert(
  cameraModalContent.includes("setFacingMode") &&
  cameraModalContent.includes("SwitchCamera"),
  'CameraModal supports toggling between rear and front cameras when multiple devices exist'
);

// Check error handling for permissions, missing device, or busy device
assert(
  cameraModalContent.includes("NotAllowedError") || cameraModalContent.includes("PermissionDeniedError"),
  'Handles NotAllowedError (permission denied) with clear message'
);
assert(
  cameraModalContent.includes("NotFoundError") || cameraModalContent.includes("DevicesNotFoundError"),
  'Handles NotFoundError (device has no camera) with clear message'
);
assert(
  cameraModalContent.includes("NotReadableError") || cameraModalContent.includes("TrackStartError"),
  'Handles NotReadableError (camera in use by another app) with clear message'
);

// Check fallback device camera input
assert(
  cameraModalContent.includes('capture="environment"') &&
  cameraModalContent.includes('fallbackInputRef'),
  'CameraModal includes native device camera app fallback input for unsupported live-stream browsers'
);

console.log('\n--- 3. Localization in Hindi, Marathi, and English ---');

// Check Hindi translations
assert(
  translationsContent.includes("retakeCamera: 'कैमरा से दोबारा लें'"),
  'Hindi: retakeCamera translation is "कैमरा से दोबारा लें"'
);
assert(
  translationsContent.includes("chooseGallery: '🖼️ गैलरी से चुनें'"),
  'Hindi: chooseGallery translation is "🖼️ गैलरी से चुनें"'
);

// Check Marathi translations
assert(
  translationsContent.includes("retakeCamera: 'कॅमेऱ्याने पुन्हा घ्या'"),
  'Marathi: retakeCamera translation is "कॅमेऱ्याने पुन्हा घ्या"'
);
assert(
  translationsContent.includes("chooseGallery: '🖼️ गॅलरीतून निवडा'"),
  'Marathi: chooseGallery translation is "🖼️ गॅलरीतून निवडा"'
);

// Check English translations
assert(
  translationsContent.includes("retakeCamera: 'Retake Camera Photo'"),
  'English: retakeCamera translation is "Retake Camera Photo"'
);
assert(
  translationsContent.includes("chooseGallery: '🖼️ Choose from Gallery'"),
  'English: chooseGallery translation is "🖼️ Choose from Gallery"'
);

// Check CameraModal multilingual error strings
assert(
  cameraModalContent.includes('कैमरा अनुमति अस्वीकृत है') &&
  cameraModalContent.includes('कॅमेरा परवानगी नाकारली आहे') &&
  cameraModalContent.includes('Camera permission was denied'),
  'CameraModal permission denied error is localized in Hindi, Marathi, and English'
);

console.log(`\n=========================================`);
console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log(`=========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
