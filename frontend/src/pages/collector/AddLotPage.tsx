import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Volume2, 
  VolumeX,
  IndianRupee, 
  RotateCcw,
  Plus,
  ShieldCheck,
  AlertCircle,
  MapPin,
  Scale,
  Check,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useSpeech } from '../../hooks/useSpeech';
import { AudioButton } from '../../components/common/AudioButton';
import { CameraModal } from '../../components/common/CameraModal';
import { api } from '../../services/api';
import { MaterialCategory, LotCondition, SourceType } from '../../types';
import { categoryLabels } from '../../i18n/translations';
import { compressImageForMobile } from '../../utils/imageCompressor';
import { validateImageQuality, ImageQualityReport } from '../../utils/imageValidator';

export interface ScrapPhotoItem {
  id: string;
  file?: File;
  dataUrl: string;
  quality?: ImageQualityReport;
}

const MATERIAL_CATEGORIES: { 
  key: MaterialCategory; 
  icon: string; 
  fallbackRate: number;
  examples: { hi: string; mr: string; en: string };
}[] = [
  { 
    key: 'PCB', 
    icon: '🔲', 
    fallbackRate: 104.5, 
    examples: { hi: 'मदरबोर्ड, सर्किट बोर्ड, कार्ड', mr: 'मदरबोर्ड, सर्किट बोर्ड', en: 'Motherboards, Circuit Cards' } 
  },
  { 
    key: 'BATTERY', 
    icon: '🔋', 
    fallbackRate: 86.0, 
    examples: { hi: 'मोबाइल, लैपटॉप, लेड-एसिड', mr: 'मोबाईल, लॅपटॉप बॅटरी', en: 'Mobile, Laptop, Li-ion cells' } 
  },
  { 
    key: 'CRT', 
    icon: '📺', 
    fallbackRate: 18.5, 
    examples: { hi: 'पुराना टीवी, भारी मॉनिटर', mr: 'जुना टीव्ही, मॉनिटर', en: 'Old TVs & CRT Monitors' } 
  },
  { 
    key: 'LCD', 
    icon: '🖥️', 
    fallbackRate: 42.0, 
    examples: { hi: 'फ्लैट स्क्रीन, एलईडी टीवी', mr: 'फ्लॅट स्क्रीन, एलईडी', en: 'Flat Screens & LED TVs' } 
  },
  { 
    key: 'CABLE', 
    icon: '🔌', 
    fallbackRate: 78.0, 
    examples: { hi: 'तांबे की वायरिंग, बिजली तार', mr: 'तांब्याची वायर, केबल', en: 'Copper Wiring & Power Cords' } 
  },
  { 
    key: 'MOTOR', 
    icon: '⚙️', 
    fallbackRate: 58.0, 
    examples: { hi: 'पंखा, मिक्सर, कॉपर मोटर', mr: 'फॅन, मिक्सर, मोटर', en: 'Fan, Mixer, Copper Motors' } 
  },
  { 
    key: 'MAGNET', 
    icon: '🧲', 
    fallbackRate: 35.0, 
    examples: { hi: 'हार्ड डिस्क, स्पीकर चुंबक', mr: 'हार्ड डिस्क, स्पीकर चुंबक', en: 'Hard Drive & Speaker Magnets' } 
  },
  { 
    key: 'MIXED_PLASTIC', 
    icon: '♻️', 
    fallbackRate: 22.0, 
    examples: { hi: 'प्रिंटर, सीपीयू प्लास्टिक बॉडी', mr: 'प्रिंटर, प्लॅस्टिक बॉडी', en: 'Printer & Computer Chassis' } 
  }
];

export const AddLotPage: React.FC = () => {
  const { collectorProfile } = useAuth();
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const { speak, stop, isSpeaking } = useSpeech();
  const navigate = useNavigate();

  // 5-Step Visual Wizard State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory>('PCB');
  const [approxWeight, setApproxWeight] = useState<string>('10');
  const [condition, setCondition] = useState<LotCondition>('INTACT');
  const [sourceType, setSourceType] = useState<SourceType>('HOUSEHOLD');
  const [description, setDescription] = useState<string>('');
  const [photos, setPhotos] = useState<ScrapPhotoItem[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [priceSources, setPriceSources] = useState<Record<string, string>>({});

  // Real Browser/Device GPS State
  const [gpsLocation, setGpsLocation] = useState<{
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    source: 'DEVICE_GPS' | 'DISTRICT_FALLBACK';
  }>({
    source: 'DISTRICT_FALLBACK'
  });

  // Vision Prediction State (Heuristic with Human Confirmation - Starts null)
  const [aiPrediction, setAiPrediction] = useState<{
    category: MaterialCategory;
    confidence: number;
    subCategory: string;
  } | null>(null);
  const [isClassifying, setIsClassifying] = useState<boolean>(false);

  // Valuation Range
  const [valuation, setValuation] = useState<{ min: number; max: number; avg: number; ratePerKg: number }>({
    min: 850,
    max: 1050,
    avg: 950,
    ratePerKg: 95
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdSuccessLotId, setCreatedSuccessLotId] = useState<string | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);

  // Fetch real market rates & request device GPS on boot
  useEffect(() => {
    const district = collectorProfile?.district || 'Lucknow';
    api.getPriceBoard(district).then(res => {
      if (res.success && res.prices) {
        const map: Record<string, number> = {};
        const sourceMap: Record<string, string> = {};
        res.prices.forEach(p => {
          map[p.materialCategory] = p.prevailingBuyPrice;
          sourceMap[p.materialCategory] = p.dataSource || 'LIVE';
        });
        setLivePrices(map);
        setPriceSources(sourceMap);
      }
    }).catch(console.warn);

    // Genuine Browser Geolocation API
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
            accuracy: Math.round(pos.coords.accuracy),
            source: 'DEVICE_GPS'
          });
        },
        (err) => {
          console.warn('GPS unavailable, using district centroid fallback:', err.message);
          setGpsLocation({ source: 'DISTRICT_FALLBACK' });
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    }
  }, [collectorProfile]);

  // Recalculate valuation on category, weight, or condition changes
  useEffect(() => {
    const weightNum = parseFloat(approxWeight) || 0;
    if (weightNum <= 0) return;

    const currentRate = livePrices[selectedCategory] || 
      MATERIAL_CATEGORIES.find(m => m.key === selectedCategory)?.fallbackRate || 70;

    let multiplier = 1.0;
    if (condition === 'DAMAGED') multiplier = 0.85;
    if (condition === 'DISMANTLED') multiplier = 0.75;

    const min = Math.round(weightNum * currentRate * 0.9 * multiplier);
    const max = Math.round(weightNum * currentRate * 1.1 * multiplier);
    const avg = Math.round(weightNum * currentRate * multiplier);

    setValuation({ min, max, avg, ratePerKg: currentRate });
  }, [selectedCategory, approxWeight, condition, livePrices]);

  // Audio helper for material category tap
  const handleSelectCategory = (cat: MaterialCategory) => {
    setSelectedCategory(cat);
    const rate = livePrices[cat] || MATERIAL_CATEGORIES.find(m => m.key === cat)?.fallbackRate || 70;
    const catName = categoryLabels[cat]?.[language] || cat;
    const speechText = language === 'hi'
      ? `आपने ${catName} चुना है। आज का सरकारी भाव ${rate} रुपये प्रति किलो है।`
      : language === 'mr'
      ? `तुम्ही ${catName} निवडले आहे. आजचा दर ${rate} रुपये प्रति किलो आहे.`
      : `You selected ${catName}. Current rate is ${rate} rupees per kg.`;
    speak(speechText, language);
  };

  // Touch increment shortcuts for low-literacy users
  const handleAddWeight = (increment: number) => {
    const current = parseFloat(approxWeight) || 0;
    const updated = Math.max(0.5, current + increment);
    setApproxWeight(updated.toString());
  };

  const handleResetWeight = () => {
    setApproxWeight('1');
  };

  // Unified image processing: mobile compression + quality check + multi-photo array + heuristic vision classification
  const processImageFile = async (rawFile: File) => {
    setIsClassifying(true);
    try {
      // 1. Client-Side Mobile Image Compression (Downsample to <= 1280px, <= 300KB)
      const { file, dataUrl } = await compressImageForMobile(rawFile);
      
      // 2. Deterministic Canvas-Based Image Quality Validation
      const qualityReport = await validateImageQuality(dataUrl || file);

      const newPhotoItem: ScrapPhotoItem = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        file,
        dataUrl,
        quality: qualityReport
      };

      setPhotos(prev => {
        const next = [...prev, newPhotoItem];
        setActivePhotoIndex(next.length - 1);
        return next;
      });

      // 3. Upload image for material heuristic classification
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.classifyMaterial(formData);
      if (res.success) {
        const classification = res.classification || res.prediction;
        if (classification) {
          const cat = classification.category || classification.materialCategory || 'PCB';
          setAiPrediction({
            category: cat,
            confidence: classification.confidence || classification.confidenceScore || 0.88,
            subCategory: classification.subCategory || `${cat} Scrap Item`
          });
          // Suggest category, but collector retains full manual confirmation
        }
      }
    } catch (err) {
      console.warn('Vision classification fallback:', err);
    } finally {
      setIsClassifying(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;
    for (const file of rawFiles) {
      await processImageFile(file);
    }
    e.target.value = '';
  };

  const handleCameraCapture = async (capturedFile: File) => {
    await processImageFile(capturedFile);
  };

  const handleRemovePhoto = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPhotos(prev => {
      const updated = prev.filter(p => p.id !== id);
      if (activePhotoIndex >= updated.length) {
        setActivePhotoIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  const handleProceedToStep2 = () => {
    if (photos.length === 0) {
      showToast(
        language === 'hi'
          ? 'कृपया कम से कम 1 साफ़ फोटो जोड़ें।'
          : language === 'mr'
          ? 'कृपया किमान १ स्पष्ट फोटो जोडा.'
          : 'Please add at least 1 clear photo.',
        'warning'
      );
      return;
    }

    const currentPhoto = photos[activePhotoIndex] || photos[0];
    if (currentPhoto?.quality?.isRejectable) {
      const reason = currentPhoto.quality.rejectionReason?.[language] ||
        (language === 'hi'
          ? 'फोटो गुणवत्ता मानकों पर अस्वीकृत है। कृपया दोबारा साफ़ फोटो लें।'
          : language === 'mr'
          ? 'फोटो गुणवत्ता निकषांवर नाकारला आहे. कृपया पुन्हा स्पष्ट फोटो काढा.'
          : 'Photo was rejected due to poor quality. Please retake.');
      showToast(reason, 'error');
      return;
    }

    setWizardStep(2);
  };

  const handleCreateLot = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (photos.length === 0) {
      showToast(
        language === 'hi'
          ? 'लॉट बनाने हेतु फोटो अनिवार्य है। कृपया फोटो जोड़ें।'
          : language === 'mr'
          ? 'लॉट तयार करण्यासाठी फोटो अनिवार्य आहे. कृपया फोटो जोडा.'
          : 'Photo is required. Please add at least 1 photo.',
        'warning'
      );
      setWizardStep(1);
      return;
    }

    const allRejected = photos.length > 0 && photos.every(p => p.quality?.isRejectable);
    if (allRejected) {
      showToast(
        language === 'hi'
          ? 'अपलोड की गई फोटो अस्पष्ट या अस्वीकृत है। कृपया दोबारा साफ़ फोटो लें।'
          : language === 'mr'
          ? 'अपलोड केलेला फोटो अस्पष्ट किंवा नाकारलेला आहे. कृपया पुन्हा स्पष्ट फोटो काढा.'
          : 'Uploaded photo was rejected. Please retake a clear photo.',
        'error'
      );
      setWizardStep(1);
      return;
    }

    const weightNum = parseFloat(approxWeight);
    if (!weightNum || weightNum <= 0) {
      showToast(
        language === 'hi' ? 'कृपया सही वजन दर्ज करें' : language === 'mr' ? 'कृपया योग्य वजन नोंदवा' : 'Please enter valid weight',
        'warning'
      );
      setWizardStep(3);
      return;
    }

    setIsSubmitting(true);
    try {
      const photoUrls = photos.map(p => p.dataUrl);
      const lotData = {
        materialCategory: selectedCategory,
        subCategory: categoryLabels[selectedCategory]?.[language] || selectedCategory,
        description: description || `E-waste scrap lot containing ${approxWeight} kg of ${selectedCategory}`,
        approxWeight: weightNum,
        condition,
        sourceType,
        imageUrl: photoUrls[0] || '',
        imageUrls: photoUrls,
        locationDistrict: collectorProfile?.district || 'Lucknow',
        locationState: collectorProfile?.state || 'Uttar Pradesh',
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        locationSource: gpsLocation.source
      };

      const res = await api.createLot(lotData);
      if (res.success) {
        setCreatedSuccessLotId(res.lot.id);

        // Record ML feedback loop if AI suggestion was presented
        if (aiPrediction && photoUrls[0]) {
          api.recordMLFeedback({
            lotId: res.lot.id,
            imagePath: photoUrls[0].substring(0, 100),
            initialHeuristicPrediction: aiPrediction.category,
            userConfirmedCategory: selectedCategory,
            collectorId: collectorProfile?.id,
            district: collectorProfile?.district
          }).catch(console.warn);
        }
      }
    } catch (err: any) {
      showToast(err.message || (language === 'hi' ? 'लॉट दर्ज करना विफल रहा' : language === 'mr' ? 'लॉट नोंदणी अयशस्वी' : 'Failed to create lot'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const speakValuation = () => {
    const catName = categoryLabels[selectedCategory]?.[language] || selectedCategory;
    const text = language === 'hi'
      ? `${catName} के ${approxWeight} किलो का अनुमानित मूल्य ${valuation.min} से ${valuation.max} रुपये के बीच है।`
      : language === 'mr'
      ? `${catName} च्या ${approxWeight} किलोचे अंदाजे मूल्य ${valuation.min} ते ${valuation.max} रुपये आहे.`
      : `Estimated valuation for ${approxWeight} kg of ${selectedCategory} is between ${valuation.min} and ${valuation.max} rupees.`;
    speak(text, language);
  };

  // Localized Step Headings & Navigation
  const wizardTitles = {
    hi: {
      step1: '1. फोटो',
      step2: '2. सामग्री',
      step3: '3. वजन',
      step4: '4. भाव',
      step5: '5. समीक्षा',
      nextBtn: 'आगे बढ़ें ➔',
      backBtn: '⬅ पीछे',
      createLotBtn: 'लॉट बनाएं और खरीदार खोजें ➔',
      creatingBtn: 'लॉट दर्ज हो रहा है...',
      audioGuidance: 'निर्देश सुनें'
    },
    mr: {
      step1: '1. फोटो',
      step2: '2. साहित्य',
      step3: '3. वजन',
      step4: '4. दर',
      step5: '5. तपासणी',
      nextBtn: 'पुढे जा ➔',
      backBtn: '⬅ मागे',
      createLotBtn: 'लॉट तयार करा आणि खरेदीदार शोधा ➔',
      creatingBtn: 'नोंदणी सुरू आहे...',
      audioGuidance: 'मार्गदर्शन ऐका'
    },
    en: {
      step1: '1. Photo',
      step2: '2. Material',
      step3: '3. Weight',
      step4: '4. Value',
      step5: '5. Review',
      nextBtn: 'Next Step ➔',
      backBtn: '⬅ Back',
      createLotBtn: 'Create Digital Lot & Find Buyers ➔',
      creatingBtn: 'Registering Lot...',
      audioGuidance: 'Listen Audio'
    }
  }[language] || {
    step1: '1. Photo',
    step2: '2. Material',
    step3: '3. Weight',
    step4: '4. Value',
    step5: '5. Review',
    nextBtn: 'Next ➔',
    backBtn: '⬅ Back',
    createLotBtn: 'Create Digital Lot ➔',
    creatingBtn: 'Creating...',
    audioGuidance: 'Audio'
  };

  // SUCCESS SCREEN: CLEAR CONFIRMATION
  if (createdSuccessLotId) {
    return (
      <div className="max-w-md mx-auto bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl my-6">
        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 text-xs font-black border border-emerald-800 uppercase tracking-wider">
            {t.lotCreatedTitle}
          </span>
          <h2 className="text-2xl font-black text-white mt-2">{t.lotCreatedSuccess}</h2>
          <p className="text-xs text-slate-400 mt-1">{t.lotIdLabel}</p>
          <div className="mt-2 p-3.5 bg-slate-950 rounded-2xl border border-emerald-500/40 font-mono text-xl font-black text-emerald-400 tracking-wider shadow-inner">
            {createdSuccessLotId}
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl text-left text-xs space-y-2.5 border border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold">{t.materialLabel}</span>
            <span className="font-extrabold text-white text-sm">
              {categoryLabels[selectedCategory]?.[language] || selectedCategory}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold">{t.weightLabel}</span>
            <span className="font-extrabold text-white text-sm">{approxWeight} kg</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold">{t.estRangeLabel}</span>
            <span className="font-extrabold text-emerald-400 text-sm">
              ₹{valuation.min} – ₹{valuation.max}
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={() => navigate(`/collector/recyclers?lotId=${createdSuccessLotId}`)}
            className="w-full min-h-[52px] py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2"
          >
            <span>{t.viewOffersBtn}</span>
          </button>
          <button
            onClick={() => {
              setCreatedSuccessLotId(null);
              setPhotos([]);
              setActivePhotoIndex(0);
              setApproxWeight('10');
              setWizardStep(1);
            }}
            className="w-full min-h-[48px] py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-2xl text-xs font-bold"
          >
            {t.addAnotherLotBtn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-20">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>📦</span>
            <span>{t.addEwaste}</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {t.wizardSubtitle}
          </p>
        </div>
        <AudioButton
          text={
            language === 'en'
              ? (wizardStep === 1
                  ? 'Step 1: Take or upload a clear photo of your scrap item.'
                  : wizardStep === 2
                  ? 'Step 2: Select from 8 material categories on screen.'
                  : wizardStep === 3
                  ? 'Step 3: Enter estimated weight and condition of scrap.'
                  : wizardStep === 4
                  ? 'Step 4: Check estimated valuation based on Mandi rates.'
                  : 'Step 5: Review details and tap the green button to register lot.')
              : language === 'mr'
              ? (wizardStep === 1
                  ? 'टप्पा १: स्क्रॅपचा स्पष्ट फोटो घ्या किंवा गॅलरीतून निवडा.'
                  : wizardStep === 2
                  ? 'टप्पा २: स्क्रीनवरील ८ पैकी साहित्याचा प्रकार निवडा.'
                  : wizardStep === 3
                  ? 'टप्पा ३: अंदाजे वजन आणि मालाची स्थिती नोंदवा.'
                  : wizardStep === 4
                  ? 'टप्पा ४: बाजारभावानुसार अंदाजे मूल्य तपासा.'
                  : 'टप्पा ५: सर्व तपशील तपासा आणि लॉट नोंदणीसाठी हिरवे बटण दाबा.')
              : (wizardStep === 1
                  ? 'चरण 1: अपने स्क्रैप की स्पष्ट फोटो लें या गैलरी से चुनें।'
                  : wizardStep === 2
                  ? 'चरण 2: स्क्रीन पर 8 में से अपने स्क्रैप की सामग्री चुनें।'
                  : wizardStep === 3
                  ? 'चरण 3: लगभग वजन और सामग्री की स्थिति दर्ज करें।'
                  : wizardStep === 4
                  ? 'चरण 4: अनुमानित मूल्य सीमा और मंडी भाव देखें।'
                  : 'चरण 5: सभी विवरणों की समीक्षा करें और लॉट दर्ज करने के लिए बड़ा हरा बटन दबाएं.')
          }
          label={wizardTitles.audioGuidance}
          size="md"
        />
      </div>

      {/* 5-STEP VISUAL PROGRESS TRACKER (INTERACTIVE, TAP TO JUMP) */}
      <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs">
        {[
          { step: 1, icon: '📷', label: wizardTitles.step1 },
          { step: 2, icon: '♻️', label: wizardTitles.step2 },
          { step: 3, icon: '⚖️', label: wizardTitles.step3 },
          { step: 4, icon: '💰', label: wizardTitles.step4 },
          { step: 5, icon: '📋', label: wizardTitles.step5 }
        ].map((item) => {
          const isActive = wizardStep === item.step;
          const isCompleted = wizardStep > item.step;

          return (
            <button
              key={item.step}
              type="button"
              onClick={() => setWizardStep(item.step as 1 | 2 | 3 | 4 | 5)}
              className={`p-2 rounded-xl transition-all flex flex-col items-center justify-center ${
                isActive
                  ? 'bg-emerald-600 text-white font-black shadow-md scale-105 ring-2 ring-emerald-400/50'
                  : isCompleted
                  ? 'bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-800'
                  : 'bg-slate-950/60 text-slate-500 border border-slate-800/60'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="text-[10px] truncate max-w-full block mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* STEP 1: PHOTO CAPTURE & VISION HEURISTIC IDENTIFICATION */}
      {/* STEP 1: PHOTO CAPTURE, MULTI-PHOTO GALLERY & REAL QUALITY CHECK */}
      {wizardStep === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">1</span>
              <span>{t.step1Heading}</span>
            </label>
            <span className="text-[10px] text-slate-500 font-bold">{t.optionalRecommended}</span>
          </div>

          <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-slate-700 bg-slate-950/70 p-4 text-center">
            {photos.length > 0 ? (
              <div className="space-y-3">
                {/* Active Photo Large View */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                  <img
                    src={photos[activePhotoIndex]?.dataUrl || photos[0]?.dataUrl}
                    alt="E-Waste Scrap Preview"
                    className="w-full h-52 sm:h-64 object-cover rounded-2xl"
                  />

                  {/* Quality Assessment Badge Overlay */}
                  {photos[activePhotoIndex]?.quality && (
                    <div className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-sm border text-[11px] font-black shadow-lg ${
                      photos[activePhotoIndex]?.quality?.isRejectable
                        ? 'bg-red-950/90 border-red-500/90 text-red-300'
                        : photos[activePhotoIndex]?.quality?.warning
                        ? 'bg-slate-950/90 border-amber-500/80 text-amber-300'
                        : 'bg-slate-950/90 border-emerald-500/80 text-emerald-300'
                    }`}>
                      <span>
                        {photos[activePhotoIndex]?.quality?.isRejectable
                          ? '✗'
                          : photos[activePhotoIndex]?.quality?.warning
                          ? '⚠️'
                          : '✓'}
                      </span>
                      <span>
                        {photos[activePhotoIndex]?.quality?.isRejectable
                          ? photos[activePhotoIndex]?.quality?.label?.[language]
                          : photos[activePhotoIndex]?.quality?.warning
                          ? photos[activePhotoIndex]?.quality?.warning?.[language]
                          : photos[activePhotoIndex]?.quality?.label?.[language]}
                      </span>
                    </div>
                  )}

                  {/* Delete Button on Active Preview */}
                  <button
                    type="button"
                    onClick={(e) => handleRemovePhoto(photos[activePhotoIndex]?.id || photos[0]?.id, e)}
                    className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-red-950/85 hover:bg-red-900 text-red-300 border border-red-700 shadow-lg active:scale-95 transition-all"
                    title={language === 'hi' ? 'फोटो हटाएं' : language === 'mr' ? 'फोटो हटवा' : 'Remove Photo'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Rejection Alert Card if photo is unreadable/too dark/blurry */}
                {photos[activePhotoIndex]?.quality?.isRejectable && (
                  <div className="p-3.5 rounded-2xl bg-red-950/90 border-2 border-red-500/80 text-left space-y-2 shadow-lg">
                    <div className="flex items-center gap-2 text-red-300 font-black text-xs">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>
                        {language === 'hi' ? 'फोटो अस्वीकृत — निरीक्षण हेतु अयोग्य' : language === 'mr' ? 'फोटो नाकारला — तपासणीसाठी अयोग्य' : 'Photo Rejected — Unusable for Inspection'}
                      </span>
                    </div>
                    <p className="text-[11px] text-red-200 font-medium">
                      {photos[activePhotoIndex]?.quality?.rejectionReason?.[language] ||
                        (language === 'hi' ? 'फोटो बहुत धुंधली या अंधेरी है। कृपया रोशनी में साफ़ फोटो लें।' : 'Photo is too blurry or dark. Please retake.')}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCameraModalOpen(true)}
                      className="px-3.5 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{t.retakeCamera || 'Retake Camera Photo'}</span>
                    </button>
                  </div>
                )}

                {/* Multiple Photos Thumbnail Strip */}
                <div className="space-y-1.5 pt-1 text-left">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>
                      {language === 'hi'
                        ? `कुल ${photos.length} फोटो (विभिन्न कोण):`
                        : language === 'mr'
                        ? `एकूण ${photos.length} फोटो (विविध कोन):`
                        : `Total ${photos.length} photos (multiple angles):`}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      {language === 'hi' ? '+ और फोटो जोड़ सकते हैं' : language === 'mr' ? '+ आणखी जोडू शकता' : '+ Can add more photos'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                    {photos.map((p, idx) => (
                      <div
                        key={p.id}
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`relative w-16 h-16 rounded-xl overflow-hidden cursor-pointer shrink-0 border-2 transition-all ${
                          activePhotoIndex === idx
                            ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105'
                            : 'border-slate-800 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={p.dataUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => handleRemovePhoto(p.id, e)}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] shadow"
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    {/* Add Photo Buttons inside Strip */}
                    <button
                      type="button"
                      onClick={() => setIsCameraModalOpen(true)}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-emerald-600/70 hover:border-emerald-500 bg-emerald-950/40 text-emerald-400 flex flex-col items-center justify-center shrink-0 active:scale-95 transition-all text-xs font-bold"
                      title="Camera"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-[9px] mt-0.5">+ {language === 'hi' ? 'कैमरा' : language === 'mr' ? 'कॅमेरा' : 'Camera'}</span>
                    </button>

                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-700 hover:border-slate-500 bg-slate-900 text-slate-300 flex flex-col items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-all text-xs font-bold">
                      <span>🖼️</span>
                      <span className="text-[9px] mt-0.5">+ {language === 'hi' ? 'गैलरी' : language === 'mr' ? 'गॅलरी' : 'Gallery'}</span>
                      <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Retake and Gallery Action Controls */}
                <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCameraModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold rounded-2xl cursor-pointer border border-slate-600 shadow"
                  >
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>{t.retakeCamera}</span>
                  </button>
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold rounded-2xl cursor-pointer border border-slate-600 shadow">
                    <span>{t.chooseGallery}</span>
                    <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                  </label>
                </div>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-emerald-950 text-emerald-400 flex items-center justify-center border-2 border-emerald-800 shadow-lg">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-base font-black text-white block">{t.takeOrUploadPrompt}</span>
                  <span className="text-xs text-slate-400 block">
                    {language === 'hi'
                      ? 'आगे, पीछे, लेबल या सर्किट बोर्ड की स्पष्ट फोटो लें (1 से अधिक फोटो भी जोड़ सकते हैं)'
                      : language === 'mr'
                      ? 'समोरील, मागील, लेबल किंवा सर्किट बोर्डचा स्पष्ट फोटो काढा (१ पेक्षा जास्त फोटो जोडू शकता)'
                      : 'Capture clear photos from multiple angles (front, back, label, PCB details)'}
                  </span>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCameraModalOpen(true)}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black rounded-2xl cursor-pointer shadow-lg flex items-center gap-1.5 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{language === 'hi' ? 'कैमरा खोलें' : language === 'mr' ? 'कॅमेरा उघडा' : 'Camera'}</span>
                  </button>
                  <label className="px-5 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold rounded-2xl cursor-pointer border border-slate-700 shadow flex items-center gap-1.5 transition-all">
                    <span>{language === 'hi' ? '🖼️ गैलरी' : language === 'mr' ? '🖼️ गॅलरी' : '🖼️ Gallery'}</span>
                    <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Hazardous Materials Safety Warning Alert */}
          {(selectedCategory === 'BATTERY' || selectedCategory === 'CRT' || aiPrediction?.category === 'BATTERY' || aiPrediction?.category === 'CRT') && (
            <div className="bg-amber-950/80 border-2 border-amber-600/70 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-200 shadow-md">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-black block text-amber-300">
                  {language === 'hi' ? '⚠️ खतरनाक सामग्री सुरक्षा नियम:' : language === 'mr' ? '⚠️ घातक साहित्य सुरक्षा नियम:' : '⚠️ Hazardous Material Safety Alert:'}
                </span>
                <p className="text-[11px] leading-relaxed text-amber-100/90">
                  {language === 'hi'
                    ? 'बैटरी या सीआरटी को कभी भी न तोड़ें, खोलें या जलाएं नहीं। जहरीले रसायन व एसिड से बचें। केवल सुरक्षित दूरी से बाहरी फोटो लें।'
                    : language === 'mr'
                    ? 'बॅटरी किंवा सीआरटी कधीही फोडू नका, उघडू नका किंवा जाळू नका. विषारी रसायने व अॅसिड टाळा. केवळ सुरक्षित अंतरावरून बाहेरून फोटो काढा.'
                    : 'Never puncture, smash or burn batteries or CRTs. Avoid toxic lead/acid exposure. Only photograph intact equipment safely.'}
                </p>
              </div>
            </div>
          )}

          {/* Transparent Heuristic Vision Suggestion Box */}
          {aiPrediction && (
            <div className="bg-emerald-950/80 border-2 border-emerald-500/60 rounded-2xl p-4 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-emerald-300">
                    {language === 'hi' ? 'पहचान सुझाव:' : language === 'mr' ? 'ओळख सूचना:' : 'Vision Suggestion:'}
                  </span>
                  <span className="font-black text-sm text-white">
                    {categoryLabels[aiPrediction.category]?.[language] || aiPrediction.category}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-900/90 text-emerald-300 text-[10px] font-black border border-emerald-700">
                  {language === 'hi' ? 'नियम-आधारित सुझाव — पुष्टि आवश्यक' : language === 'mr' ? 'नियमांवर आधारित शिफारस — पुष्टी आवश्यक' : 'Rule-Based Suggestion — Confirmation Required'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-emerald-900/60 flex-wrap gap-2">
                <span className="text-[11px] text-slate-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    {language === 'hi'
                      ? 'सामग्री सुझाव — पुष्टि आवश्यक:'
                      : language === 'mr'
                      ? 'साहित्य शिफारस — पुष्टी आवश्यक:'
                      : 'Material Suggestion — Manual Confirmation Required:'}
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectCategory(aiPrediction.category);
                      handleProceedToStep2();
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {language === 'hi' ? 'यह श्रेणी स्वीकारें' : language === 'mr' ? 'ही श्रेणी स्वीकारा' : 'Accept Category'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToStep2}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold shadow active:scale-95 transition-all"
                  >
                    <span>
                      {language === 'hi' ? 'अन्य बदलें ➔' : language === 'mr' ? 'इतर बदला ➔' : 'Change ➔'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation to Step 2 - Fully Localized (Bug Fix for "Next: Select Material") */}
          <button
            type="button"
            onClick={handleProceedToStep2}
            className="w-full min-h-[52px] py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition-all mt-4"
          >
            <span>
              {language === 'hi'
                ? 'सामग्री चुनें ➔'
                : language === 'mr'
                ? 'साहित्य प्रकार निवडा ➔'
                : 'Select Material ➔'}
            </span>
          </button>
        </div>
      )}

      {/* STEP 2: PICTORIAL MATERIAL CARDS (8 CORE MANDATORY CATEGORIES) */}
      {wizardStep === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">2</span>
              <span>{language === 'hi' ? 'सामग्री की श्रेणी चुनें' : language === 'mr' ? 'साहित्य प्रकार निवडा' : 'Select Material Category'}</span>
            </label>
            <span className="text-xs text-emerald-400 font-bold">{language === 'hi' ? '1 टैप से चुनें' : language === 'mr' ? '१ टॅपमध्ये निवडा' : '1-Tap to Select'}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {MATERIAL_CATEGORIES.map(({ key: cat, icon, fallbackRate, examples }) => {
              const info = categoryLabels[cat];
              const isSelected = selectedCategory === cat;
              const rate = livePrices[cat] || fallbackRate;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelectCategory(cat)}
                  className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between min-h-[125px] active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-950/90 border-emerald-500 text-white ring-2 ring-emerald-500/50 shadow-lg scale-[1.02]'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-3xl">{icon}</span>
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 font-mono">₹{rate}/kg</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-xs sm:text-sm leading-tight text-white">{info[language] || cat}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {examples[language] || examples.en}
                    </p>
                    <span className="text-[10px] text-emerald-400 font-extrabold mt-1 block">
                      ₹{rate}/kg {language === 'hi' ? 'भाव' : language === 'mr' ? 'दर' : 'rate'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setWizardStep(1)}
              className="w-1/3 min-h-[48px] py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{wizardTitles.backBtn}</span>
            </button>
            <button
              type="button"
              onClick={() => setWizardStep(3)}
              className="w-2/3 min-h-[48px] py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-2xl text-xs font-black shadow-lg flex items-center justify-center gap-1.5"
            >
              <span>{language === 'hi' ? 'वजन व स्थिति दर्ज करें ➔' : language === 'mr' ? 'वजन व स्थिती नोंदवा ➔' : 'Enter Weight & Condition ➔'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: APPROXIMATE WEIGHT & CONDITION ENTRY WITH REAL DEVICE GPS */}
      {wizardStep === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">3</span>
            <span>{language === 'hi' ? 'लगभग वजन व स्थिति दर्ज करें' : language === 'mr' ? 'अंदाजे वजन व स्थिती नोंदवा' : 'Enter Weight & Condition'}</span>
          </label>

          {/* Dominant Numeric Weight Display */}
          <div className="bg-slate-950 p-4 rounded-2xl border-2 border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {language === 'hi' ? 'कुल वजन:' : language === 'mr' ? 'एकूण वजन:' : 'Total Weight:'}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={approxWeight}
                  onChange={(e) => setApproxWeight(e.target.value)}
                  className="bg-transparent text-white font-mono text-4xl sm:text-5xl font-black focus:outline-none w-36"
                  required
                />
                <span className="text-xl sm:text-2xl font-black text-emerald-400">KG</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetWeight}
              className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700 flex items-center gap-1 text-xs font-bold"
              title={language === 'hi' ? 'वजन रीसेट करें' : language === 'mr' ? 'वजन रीसेट करा' : 'Reset Weight'}
            >
              <RotateCcw className="w-4 h-4" />
              <span>{language === 'hi' ? 'रीसेट' : language === 'mr' ? 'रीसेट' : 'Reset'}</span>
            </button>
          </div>

          {/* Large Touch Steppers (+1, +5, +10, +25 KG) */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[1, 5, 10, 25].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleAddWeight(amt)}
                className="py-3 bg-slate-950 hover:bg-emerald-950/80 active:scale-95 text-emerald-300 font-black text-sm rounded-xl border border-slate-800 hover:border-emerald-600 transition-all flex items-center justify-center gap-1 shadow"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>{amt} kg</span>
              </button>
            ))}
          </div>

          {/* Condition Selector (3 Large Cards) */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              {language === 'hi' ? 'सामग्री की स्थिति:' : language === 'mr' ? 'मालाची स्थिती:' : 'Item Condition:'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'INTACT', label: t.intact, icon: '🟢', desc: language === 'hi' ? '100% पूरा भाव' : language === 'mr' ? '१००% पूर्ण दर' : '100% Rate' },
                { key: 'DAMAGED', label: t.damaged, icon: '🟡', desc: language === 'hi' ? '85% भाव' : language === 'mr' ? '८५% दर' : '85% Rate' },
                { key: 'DISMANTLED', label: t.dismantled, icon: '🟠', desc: language === 'hi' ? '75% भाव' : language === 'mr' ? '७५% दर' : '75% Rate' }
              ].map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCondition(c.key as LotCondition)}
                  className={`p-3 rounded-xl text-center border transition-all ${
                    condition === c.key
                      ? 'bg-emerald-950 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-base block">{c.icon}</span>
                  <span className="font-extrabold text-xs block mt-1">{c.label}</span>
                  <span className="text-[9px] text-slate-400 block">{c.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scrap Collection Location & GPS Status Badge */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-white block">
                  {collectorProfile?.district || 'Lucknow'}, {collectorProfile?.state || 'Uttar Pradesh'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {gpsLocation.source === 'DEVICE_GPS' && gpsLocation.latitude && gpsLocation.longitude
                    ? `🛰️ GPS: ${gpsLocation.latitude}, ${gpsLocation.longitude} (±${gpsLocation.accuracy || 10}m)`
                    : language === 'hi' ? '📍 जिला मंडी केंद्र' : language === 'mr' ? '📍 जिल्हा केंद्र' : '📍 District Centroid Fallback'}
                </span>
              </div>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
              gpsLocation.source === 'DEVICE_GPS'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {gpsLocation.source === 'DEVICE_GPS' ? '🟢 GPS ACTIVE' : '🏷️ DISTRICT'}
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setWizardStep(2)}
              className="w-1/3 min-h-[48px] py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{wizardTitles.backBtn}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const w = parseFloat(approxWeight);
                if (!w || w <= 0) {
                  showToast(language === 'hi' ? 'कृपया सही वजन दर्ज करें' : language === 'mr' ? 'कृपया योग्य वजन नोंदवा' : 'Please enter valid weight', 'warning');
                  return;
                }
                setWizardStep(4);
              }}
              className="w-2/3 min-h-[48px] py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-2xl text-xs font-black shadow-lg flex items-center justify-center gap-1.5"
            >
              <span>{language === 'hi' ? 'अनुमानित भाव देखें ➔' : language === 'mr' ? 'अंदाजे दर पहा ➔' : 'View Valuation ➔'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: INSTANT ESTIMATED VALUE & BENCHMARK TRANSPARENCY */}
      {wizardStep === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">4</span>
              <span>{language === 'hi' ? 'अनुमानित मूल्य व सरकारी भाव' : language === 'mr' ? 'अंदाजे मूल्य व बाजार दर' : 'Estimated Valuation & Mandi Rate'}</span>
            </label>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
              priceSources[selectedCategory] === 'LIVE'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-amber-950 text-amber-300 border-amber-800'
            }`}>
              {priceSources[selectedCategory] === 'LIVE' ? '🟢 LIVE MANDI RATE' : '🏷️ BENCHMARK RATE'}
            </span>
          </div>

          {/* Glowing Valuation Box */}
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border-2 border-emerald-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                  {language === 'hi' ? 'अपेक्षित भुगतान राशि' : language === 'mr' ? 'अपेक्षित रक्कम' : 'Expected Payment Range'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) {
                    stop();
                  } else {
                    speakValuation();
                  }
                }}
                className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
                  isSpeaking
                    ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-300'
                    : 'bg-emerald-600/30 hover:bg-emerald-600/50 border-emerald-500/40 text-emerald-300'
                }`}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-4 h-4 animate-bounce" />
                    <span>{t.voicePlaying || (language === 'hi' ? 'आवाज़ चल रही है...' : language === 'mr' ? 'आवाज सुरू आहे...' : 'Playing voice...')}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 animate-pulse" />
                    <span>{language === 'hi' ? 'भाव सुनें' : language === 'mr' ? 'दर ऐका' : 'Listen Rate'}</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-5xl font-black text-emerald-300 font-mono">
                ₹{valuation.min.toLocaleString('en-IN')} – ₹{valuation.max.toLocaleString('en-IN')}
              </span>
            </div>

            <p className="text-xs text-slate-400">
              {language === 'hi' ? 'सरकारी प्रमाणित दर' : language === 'mr' ? 'प्रमाणित बाजार दर' : 'Mandi Rate'}: ₹{valuation.ratePerKg}/kg • {language === 'hi' ? 'वजन' : language === 'mr' ? 'वजन' : 'Weight'}: {approxWeight} kg • {language === 'hi' ? 'स्थिति' : language === 'mr' ? 'स्थिती' : 'Condition'}: {condition}
            </p>
          </div>

          {/* Fair Price Uplift Benefit Box */}
          <div className="bg-slate-950 border border-emerald-900/60 p-4 rounded-2xl space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{language === 'hi' ? 'कबाड़ीवाला कनेक्ट का पारदर्शी लाभ:' : language === 'mr' ? 'कबाडीवाला कनेक्टचा पारदर्शक फायदा:' : 'Transparent Platform Benefit:'}</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {language === 'hi'
                ? 'स्थानीय बिचौलिए के मुकाबले +72% तक अतिरिक्त कमाई। प्रमाणित वजन पर तुरंत भुगतान।'
                : language === 'mr'
                ? 'स्थानिक दलालापेक्षा +७२% पर्यंत जास्त कमाई. वजन तपासणीनंतर तत्काळ पावती.'
                : 'Up to +72% higher net income vs informal middlemen. Immediate calibrated weighbridge receipt.'}
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setWizardStep(3)}
              className="w-1/3 min-h-[48px] py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{wizardTitles.backBtn}</span>
            </button>
            <button
              type="button"
              onClick={() => setWizardStep(5)}
              className="w-2/3 min-h-[48px] py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-2xl text-xs font-black shadow-lg flex items-center justify-center gap-1.5"
            >
              <span>{language === 'hi' ? 'लॉट की समीक्षा करें ➔' : language === 'mr' ? 'लॉटची तपासणी करा ➔' : 'Review Lot ➔'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW AND CREATE DIGITAL LOT (PERSISTENCE) */}
      {wizardStep === 5 && (
        <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">5</span>
              <span>{language === 'hi' ? 'अंतिम समीक्षा व लॉट पुष्टि' : language === 'mr' ? 'अंतिम तपासणी व पुष्टी' : 'Review & Submit Lot'}</span>
            </label>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-black border border-emerald-800">
              🟢 LIVE RECORD
            </span>
          </div>

          {/* Visual Review Summary Card */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3.5">
            <div className="flex items-center gap-3">
              {photos.length > 0 ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-700 shrink-0 shadow-md">
                  <img
                    src={photos[0].dataUrl}
                    alt={selectedCategory}
                    className="w-full h-full object-cover"
                  />
                  {photos.length > 1 && (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-950/90 text-emerald-300 text-[9px] font-black border border-slate-700">
                      +{photos.length - 1}
                    </span>
                  )}
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 text-2xl shrink-0">
                  📷
                </div>
              )}
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  {selectedCategory}
                </span>
                <h3 className="text-base font-black text-white leading-tight">
                  {categoryLabels[selectedCategory]?.[language] || selectedCategory}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'hi' ? 'वजन' : language === 'mr' ? 'वजन' : 'Weight'}: <b className="text-white">{approxWeight} kg</b> • {language === 'hi' ? 'स्थिति' : language === 'mr' ? 'स्थिती' : 'Condition'}: <b className="text-emerald-300">{condition}</b>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/80">
                <span className="text-[10px] text-slate-400 block">{language === 'hi' ? 'सरकारी दर:' : language === 'mr' ? 'बाजार दर:' : 'Mandi Rate:'}</span>
                <span className="font-extrabold text-white">₹{valuation.ratePerKg}/kg</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80">
                <span className="text-[10px] text-slate-400 block">{language === 'hi' ? 'अनुमानित भुगतान:' : language === 'mr' ? 'अंदाजे रक्कम:' : 'Estimated Payout:'}</span>
                <span className="font-black text-emerald-400">₹{valuation.min} – ₹{valuation.max}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 col-span-2">
                <span className="text-[10px] text-slate-400 block">{language === 'hi' ? 'कलेक्शन स्थान:' : language === 'mr' ? 'संकलन ठिकाण:' : 'Collection Location:'}</span>
                <span className="font-bold text-slate-200 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  {collectorProfile?.district || 'Lucknow'}, {collectorProfile?.state || 'UP'}
                  {gpsLocation.source === 'DEVICE_GPS' && (
                    <span className="text-[9px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 rounded border border-emerald-800 ml-1">
                      🛰️ GPS OK
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Submission and Edit Buttons */}
          <div className="space-y-3 pt-1">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleCreateLot()}
              className="w-full min-h-[56px] py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-base rounded-2xl shadow-2xl shadow-emerald-950 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              <span>{isSubmitting ? wizardTitles.creatingBtn : wizardTitles.createLotBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => setWizardStep(1)}
              className="w-full min-h-[44px] py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-2xl text-xs font-bold"
            >
              {language === 'hi' ? '⬅ विवरण संशोधित करें' : language === 'mr' ? '⬅ तपशील बदला' : '⬅ Edit Details'}
            </button>
          </div>
        </div>
      )}

      {/* Real Hardware Camera Modal */}
      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};
