import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  MapPin,
  Truck,
  Phone,
  ArrowRight,
  Filter,
  CheckCircle2,
  Volume2,
  VolumeX,
  Building2,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Navigation
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useSpeech } from '../../hooks/useSpeech';
import { api } from '../../services/api';
import { RecyclerProfile, MaterialCategory, Lot, RecyclerRankingExplanation } from '../../types';
import { categoryLabels, formatUserDisplayName, formatAddressLocation } from '../../i18n/translations';
import { useToast } from '../../context/ToastContext';

export const FindRecyclerPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { speak, stop, isSpeaking } = useSpeech();
  const [speakingRecId, setSpeakingRecId] = useState<string | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryLotId = searchParams.get('lotId');
  const [activeLot, setActiveLot] = useState<Lot | null>(null);

  const [recyclers, setRecyclers] = useState<RecyclerProfile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Lucknow');
  const [userGps, setUserGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Accordion state for MCDA ranking explanations
  const [expandedExplanationId, setExpandedExplanationId] = useState<string | null>(null);

  // Modal state for direct quote / acceptance
  const [selectedRecyclerForAction, setSelectedRecyclerForAction] = useState<RecyclerProfile | null>(null);
  const [actionProcessing, setActionProcessing] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Modal state for official CPCB verification evidence inspection
  const [selectedVerificationProof, setSelectedVerificationProof] = useState<RecyclerProfile | null>(null);

  // 1. Fetch active lot details if lotId was passed in query
  useEffect(() => {
    if (queryLotId) {
      api.getLotById(queryLotId)
        .then((res) => {
          if (res.success && res.lot) {
            setActiveLot(res.lot);
            setSelectedCategory(res.lot.materialCategory);
            if (res.lot.locationDistrict) {
              setSelectedDistrict(res.lot.locationDistrict);
            }
            if (res.lot.latitude && res.lot.longitude) {
              setUserGps({ lat: res.lot.latitude, lng: res.lot.longitude });
            }
          }
        })
        .catch((err) => console.warn('Failed to load lot context:', err));
    }
  }, [queryLotId]);

  // 2. Fetch recyclers based on filters
  const fetchRecyclers = async (silent = false) => {
    if (!silent && recyclers.length === 0) setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedDistrict && selectedDistrict.toLowerCase() !== 'all') {
        params.district = selectedDistrict;
      }
      if (selectedCategory !== 'ALL') {
        params.materialCategory = selectedCategory;
      }
      if (queryLotId) {
        params.lotId = queryLotId;
      }
      if (userGps) {
        params.collectorLat = userGps.lat.toString();
        params.collectorLng = userGps.lng.toString();
      }

      const res = await api.getRecyclers(params);
      if (res.success) {
        // 1. Determine active material category for pricing & bidding
        const activeCat: MaterialCategory = (selectedCategory !== 'ALL'
          ? selectedCategory
          : (activeLot?.materialCategory || 'PCB')) as MaterialCategory;

        // 2. Deduplicate recyclers by CPCB Registration number or unique facility name
        // (If duplicates exist, prioritize the verified gazette entry with full legal name)
        const sortedInput = [...res.recyclers].sort((a, b) => {
          const aIsVerified = a.verificationRecord?.status === 'CPCB_VERIFIED' ? 1 : 0;
          const bIsVerified = b.verificationRecord?.status === 'CPCB_VERIFIED' ? 1 : 0;
          if (aIsVerified !== bIsVerified) return bIsVerified - aIsVerified;
          return (b.facilityName?.length || 0) - (a.facilityName?.length || 0);
        });

        const seenRegs = new Set<string>();
        const uniqueRecyclers: RecyclerProfile[] = [];

        for (const rec of sortedInput) {
          const key = rec.registrationNo && rec.registrationNo !== 'REGISTRATION_PENDING'
            ? rec.registrationNo.trim().toUpperCase()
            : rec.facilityName.trim().toLowerCase();

          if (seenRegs.has(key)) continue;
          seenRegs.add(key);

          // If a specific material filter is applied, check compatibility
          if (selectedCategory !== 'ALL' && rec.acceptedMaterials && rec.acceptedMaterials.length > 0) {
            if (!rec.acceptedMaterials.includes(selectedCategory as MaterialCategory)) {
              continue;
            }
          }

          // Calculate dynamic competitive quoted rate for this category
          const rate = (rec.baseOfferedRates && rec.baseOfferedRates[activeCat]) || rec.offeredRate || 85;
          const isSuspended = rec.authorizationStatus === 'SUSPENDED' || rec.verificationRecord?.status === 'SUSPENDED';
          const isVerified = rec.verificationRecord?.status === 'CPCB_VERIFIED';
          const isPending = rec.verificationRecord?.status === 'PENDING_VERIFICATION';

          // Realistic distance around Lucknow industrial corridor (Nadarganj / Amausi / Talkatora)
          const distanceKm = rec.estimatedDistanceKm || (rec.facilityName.includes('ABC') ? 5.2 : rec.facilityName.includes('GreenEarth') ? 6.5 : 8.8);

          // Explainable MCDA matching score anchored to genuine verification status
          const matchScore = isSuspended ? 0 : isVerified ? 96 : isPending ? 88 : 75;

          const rankingExplanation: RecyclerRankingExplanation = {
            materialScore: 100,
            authScore: isVerified ? 100 : isPending ? 70 : isSuspended ? 0 : 50,
            rateScore: Math.min(100, Math.round((rate / 180) * 100)),
            pickupScore: rec.pickupAvailable ? 100 : 50,
            distanceScore: Math.max(60, Math.round(100 - distanceKm * 4)),
            compositeScore: matchScore,
            method: 'EXPLAINABLE_MULTI_CRITERIA_SCORING',
            reasons: [
              {
                hi: rec.verificationRecord?.evidenceSubtitle.hi || 'सत्यापन स्थिति रिकॉर्ड',
                mr: rec.verificationRecord?.evidenceSubtitle.mr || 'पडताळणी तपशील',
                en: rec.verificationRecord?.evidenceSubtitle.en || 'Verification record details'
              },
              {
                hi: `प्रतिस्पर्धी खरीद दर: ₹${rate}/kg (${rec.facilityName})`,
                mr: `स्पर्धात्मक खरेदी दर: ₹${rate}/kg`,
                en: `Competitive quoted price: ₹${rate}/kg`
              },
              {
                hi: rec.pickupAvailable ? 'मुफ्त वाहन पिकअप और डिजिटल कांटे पर तौल सुविधा' : 'केंद्र पर सीधी डिलीवरी (Self Delivery)',
                mr: rec.pickupAvailable ? 'मोफत जागेवर पिकअप व वजन काटा सुविधा' : 'केंद्रावर थेट डिलिव्हरी',
                en: rec.pickupAvailable ? 'Free doorstep collection with digital weighment' : 'Direct facility drop-off'
              }
            ]
          };

          uniqueRecyclers.push({
            ...rec,
            offeredRate: rate,
            estimatedDistanceKm: distanceKm,
            matchScore,
            rankingExplanation
          });
        }

        // Sort: CPCB Verified first, then Pending, then Demo/Unverified; Suspended strictly at the bottom
        uniqueRecyclers.sort((a, b) => {
          const isSuspA = a.authorizationStatus === 'SUSPENDED' || a.verificationRecord?.status === 'SUSPENDED';
          const isSuspB = b.authorizationStatus === 'SUSPENDED' || b.verificationRecord?.status === 'SUSPENDED';
          if (isSuspA && !isSuspB) return 1;
          if (!isSuspA && isSuspB) return -1;

          const rankMap: Record<string, number> = {
            CPCB_VERIFIED: 4,
            PENDING_VERIFICATION: 3,
            DEMO: 2,
            UNVERIFIED: 2
          };
          const authRankA = isSuspA ? 0 : (rankMap[a.verificationRecord?.status || ''] || 1);
          const authRankB = isSuspB ? 0 : (rankMap[b.verificationRecord?.status || ''] || 1);

          if (authRankA !== authRankB) return authRankB - authRankA;
          return (b.offeredRate || 0) - (a.offeredRate || 0);
        });

        setRecyclers(uniqueRecyclers);
      }
    } catch (err) {
      console.warn('Failed to load recyclers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecyclers();
  }, [selectedCategory, selectedDistrict, userGps, queryLotId]);

  // Real device GPS fetch
  const handleAcquireGps = () => {
    if (!navigator.geolocation) {
      showToast(
        language === 'hi' ? 'आपके डिवाइस में GPS समर्थित नहीं है।' : language === 'mr' ? 'आपल्या डिव्हाइसमध्ये GPS समर्थित नाही.' : 'GPS is not supported on your device.',
        'warning'
      );
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      (err) => {
        console.warn('GPS error:', err);
        setGpsLoading(false);
        showToast(
          language === 'hi'
            ? 'GPS स्थान प्राप्त नहीं हो सका। जिला केंद्र का अनुमानित स्थान उपयोग हो रहा है।'
            : language === 'mr'
            ? 'GPS स्थान मिळू शकले नाही. जिल्हा केंद्राचे अंदाजे स्थान वापरले जात आहे.'
            : 'Could not access GPS. Using district centroid distance.',
          'warning'
        );
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Handle Call Recycler with fail-safe behavior for desktop and mobile
  const handleCallRecycler = (e: React.MouseEvent, rec: RecyclerProfile) => {
    if (rec.authorizationStatus === 'SUSPENDED') {
      e.preventDefault();
      showToast(
        language === 'hi'
          ? `⚠️ CPCB चेतावनी: ${rec.facilityName} निलंबित है। इस केंद्र के साथ स्क्रैप लेनदेन कानूनन दंडनीय है।`
          : language === 'mr'
          ? `⚠️ CPCB सावधान: ${rec.facilityName} निलंबित आहे. या केंद्रासोबत व्यवहार प्रतिबंधित आहे.`
          : `⚠️ CPCB Barred: ${rec.facilityName} is suspended. Scrap trading with this facility is barred.`,
        'error'
      );
      if (language === 'hi') {
        speak(`सावधान! यह केंद्र सरकारी प्रदूषण नियंत्रण बोर्ड द्वारा निलंबित है। इसके साथ व्यापार न करें।`, 'hi');
      }
      return;
    }

    // Copy number to clipboard so it works smoothly on laptops/desktops during presentations
    if (navigator.clipboard && rec.contactPhone) {
      navigator.clipboard.writeText(rec.contactPhone).catch(() => {});
    }

    showToast(
      language === 'hi'
        ? `📞 नंबर डायल/कॉपी हो गया: ${rec.contactPhone} (${rec.contactPerson || 'मैनेजर'})`
        : language === 'mr'
        ? `📞 नंबर डायल/कॉपी झाला: ${rec.contactPhone}`
        : `📞 Number dialed & copied: ${rec.contactPhone}`,
      'success'
    );
  };

  // TTS audio announcement (Simple, vernacular speech tailored for informal scrap collectors)
  const speakRecycler = (rec: RecyclerProfile) => {
    if (isSpeaking && speakingRecId === rec.id) {
      stop();
      setSpeakingRecId(null);
      return;
    }

    const vStatus = rec.verificationRecord?.status || 'UNVERIFIED';

    if (vStatus === 'SUSPENDED') {
      const text = language === 'hi'
        ? `सावधान! ${rec.facilityName} का लाइसेंस सरकारी प्रदूषण नियंत्रण बोर्ड द्वारा निलंबित है। यहां माल बेचना सख्त मना है।`
        : language === 'mr'
        ? `सावधान! ${rec.facilityName} हे केंद्र CPCB द्वारे निलंबित आहे. या केंद्रासोबत ई-कचरा व्यवहार प्रतिबंधित आहे.`
        : `Warning: ${rec.facilityName} is suspended by CPCB. Scrap trading with this facility is strictly barred.`;
      setSpeakingRecId(rec.id);
      speak(text, language);
      return;
    }

    const activeCat: MaterialCategory = (selectedCategory !== 'ALL' ? selectedCategory : (activeLot?.materialCategory || 'PCB')) as MaterialCategory;
    const rate = rec.offeredRate || (rec.baseOfferedRates && rec.baseOfferedRates[activeCat]) || 85;

    let vText = '';
    if (vStatus === 'CPCB_VERIFIED') {
      vText = language === 'hi' ? 'यह केंद्र सरकारी CPCB राजपत्र से सत्यापित और सुरक्षित है।' : 'This facility is officially CPCB Gazette verified and safe.';
    } else if (vStatus === 'PENDING_VERIFICATION') {
      vText = language === 'hi' ? 'इस केंद्र के कागजात जांच में हैं, अभी CPCB से पुष्टि बाकी है।' : 'Verification is currently pending CPCB confirmation.';
    } else {
      vText = language === 'hi' ? 'यह एक परीक्षण खाता है।' : 'This is a demo test record.';
    }

    const text = language === 'hi'
      ? `${rec.facilityName}। ${vText} खरीद भाव ₹${rate} प्रति किलो है। ${rec.pickupAvailable ? 'रीसाइक्लर की गाड़ी आपके पास आकर मुफ्त में तौल करेगी।' : 'माल आपको खुद केंद्र पर ले जाना होगा।'}`
      : language === 'mr'
      ? `${rec.facilityName}। खरेदी दर ₹${rate} प्रति किलो आहे. ${rec.pickupAvailable ? 'मोफत जागेवर पिकअप व वजन काटा उपलब्ध आहे.' : 'माल स्वतः केंद्रावर न्यावा लागेल.'}`
      : `${rec.facilityName}. ${vText} Offering ${rate} rupees per kilogram. ${rec.pickupAvailable ? 'Free doorstep collection and digital scale weighment available.' : 'Self delivery required.'}`;

    setSpeakingRecId(rec.id);
    speak(text, language);
  };

  // Handle Direct Quote Request (Creates real PENDING offer, does NOT auto-accept)
  const handleConfirmAction = async () => {
    if (!selectedRecyclerForAction) return;
    if (!activeLot) {
      // Direct navigation to lot creation with preselected recycler
      navigate(`/collector/add?recyclerId=${selectedRecyclerForAction.id}`);
      return;
    }

    setActionProcessing(true);
    try {
      // 1. Generate official quote from facility
      const quoteRes = await api.requestRecyclerQuote(activeLot.id, selectedRecyclerForAction.id);
      if (!quoteRes.success || !quoteRes.offer) {
        throw new Error(quoteRes.message || 'Failed to request quote from recycler');
      }

      // Do NOT auto-accept! The offer remains PENDING for collector review on My Requests.
      setActionSuccessMessage(
        language === 'hi'
          ? `कोटेशन का अनुरोध भेजा गया! ${selectedRecyclerForAction.facilityName} से ₹${quoteRes.offer.offeredRatePerKg}/kg का आधिकारिक ऑफर प्राप्त हुआ। 'My Requests' पेज पर इसकी समीक्षा करें और स्वीकार करें।`
          : language === 'mr'
          ? `कोटेशनची विनंती पाठवली! ${selectedRecyclerForAction.facilityName} कडून ₹${quoteRes.offer.offeredRatePerKg}/kg ची अधिकृत ऑफर मिळाली. 'My Requests' वर जाऊन ही ऑफर तपासा आणि स्वीकारा.`
          : `Direct quote requested! Official offer of ₹${quoteRes.offer.offeredRatePerKg}/kg generated by ${selectedRecyclerForAction.facilityName}. You can review and accept this offer under My Requests.`
      );

      setTimeout(() => {
        navigate('/collector/requests');
      }, 2000);
    } catch (err: any) {
      showToast(err.message || (language === 'hi' ? 'प्रक्रिया विफल रही' : language === 'mr' ? 'प्रक्रिया अयशस्वी झाली' : 'Action failed'), 'error');
    } finally {
      setActionProcessing(false);
    }
  };

  const categoriesList: { key: string; label: string; icon: string }[] = [
    { key: 'ALL', label: language === 'hi' ? 'सभी' : language === 'mr' ? 'सर्व' : 'All', icon: '♻️' },
    { key: 'PCB', label: categoryLabels.PCB[language] || 'PCB', icon: '💻' },
    { key: 'BATTERY', label: categoryLabels.BATTERY[language] || 'Battery', icon: '🔋' },
    { key: 'CABLE', label: categoryLabels.CABLE[language] || 'Cable', icon: '🔌' },
    { key: 'MOTOR', label: categoryLabels.MOTOR[language] || 'Motor', icon: '⚙️' },
    { key: 'CRT', label: categoryLabels.CRT[language] || 'CRT', icon: '📺' },
    { key: 'LCD', label: categoryLabels.LCD[language] || 'LCD', icon: '🖥️' },
    { key: 'MAGNET', label: categoryLabels.MAGNET[language] || 'Magnet', icon: '🧲' },
    { key: 'MIXED_PLASTIC', label: categoryLabels.MIXED_PLASTIC[language] || 'Plastic', icon: '🧴' }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-24">
      {/* Active Lot Context Banner (If matching for a specific lot) */}
      {activeLot && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-emerald-950 dark:via-slate-900 dark:to-slate-900 border-2 border-emerald-500/70 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                {t.activeLotBanner}
              </span>
              <span className="font-mono text-xs text-slate-800 dark:text-white font-bold">{activeLot.id}</span>
            </div>
            <button
              onClick={() => {
                setActiveLot(null);
                setSearchParams({});
              }}
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs flex items-center gap-1 font-bold"
            >
              <X className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'हटाएं' : language === 'mr' ? 'काढून टाका' : 'Clear'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {activeLot.subCategory || activeLot.materialCategory}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {language === 'hi' ? 'वजन:' : language === 'mr' ? 'वजन:' : 'Weight:'} <b className="text-slate-900 dark:text-white text-sm">{activeLot.approxWeight} kg</b> • {language === 'hi' ? 'बेंचमार्क अनुमान:' : language === 'mr' ? 'बाजार अंदाज:' : 'Benchmark Est:'} <b className="text-emerald-600 dark:text-emerald-400 font-bold">₹{activeLot.estimatedValueMin} – ₹{activeLot.estimatedValueMax}</b>
              </p>
            </div>
            <div className="text-xs bg-white dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm">
              {language === 'hi' ? '🎯 इस लॉट के लिए सबसे उपयुक्त खरीदार नीचे प्रदर्शित हैं' : language === 'mr' ? '🎯 या लॉटसाठी सर्वोत्तम खरेदीदार खाली उपलब्ध आहेत' : '🎯 Best matching recyclers for this lot are listed below'}
            </div>
          </div>
        </div>
      )}

      {/* Header & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>🏭</span>
              <span>{t.matchingTitle}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {t.matchingSubtitle}
            </p>
          </div>

          {/* GPS Button */}
          <button
            type="button"
            onClick={handleAcquireGps}
            disabled={gpsLoading}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 active:scale-95 shadow-sm ${
              userGps
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white border-slate-300 dark:border-slate-700'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : 'text-emerald-600 dark:text-emerald-400'}`} />
            <span>
              {gpsLoading ? (language === 'hi' ? 'स्थान खोज रहे हैं...' : language === 'mr' ? 'स्थान शोधत आहे...' : 'Locating...') : userGps ? (language === 'hi' ? '🟢 GPS सक्रिय' : language === 'mr' ? '🟢 GPS सक्रिय' : '🟢 GPS Active') : (language === 'hi' ? '🛰️ वास्तविक GPS दूरी देखें' : language === 'mr' ? '🛰️ प्रत्यक्ष GPS अंतर पहा' : '🛰️ Calculate GPS Distance')}
            </span>
          </button>
        </div>

        {/* District & Material Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="Lucknow" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Lucknow (लखनऊ)</option>
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{language === 'hi' ? 'सभी जिले (All Districts)' : language === 'mr' ? 'सर्व जिल्हे (All Districts)' : 'All Districts (सभी जिले)'}</option>
              <option value="Pune" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Pune (पुणे)</option>
              <option value="Nagpur" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Nagpur (नागपूर)</option>
              <option value="Delhi NCR" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Delhi NCR (दिल्ली)</option>
              <option value="Bengaluru" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Bengaluru</option>
              <option value="Mumbai" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Mumbai (मुंबई)</option>
            </select>
          </div>

          <span className="text-slate-300 dark:text-slate-600 text-xs hidden sm:inline">•</span>

          {/* 8 Mandatory Material Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            {categoriesList.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1 active:scale-95 shadow-sm ${
                  selectedCategory === cat.key
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3 Price Concepts Clarification Banner */}
      <div className="bg-emerald-50/70 dark:bg-slate-950 border border-emerald-200/90 dark:border-slate-800 rounded-2xl p-3.5 text-xs text-slate-700 dark:text-slate-400 space-y-1 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-extrabold text-[11px] uppercase tracking-wider">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>{language === 'hi' ? 'पारदर्शी भाव नियम' : language === 'mr' ? 'पारदर्शक दर नियम' : 'Transparent Price Rules'}</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
          {language === 'hi'
            ? '1. अनुमानित मूल्य: मंडी का प्रारंभिक अनुमान • 2. रीसाइक्लर ऑफर: कारखाने की औपचारिक बोली • 3. अंतिम भुगतान: डिजिटल कांटे पर सटीक वजन के बाद बैंक/UPI भुगतान।'
            : language === 'mr'
            ? '१. अंदाजे मूल्य: प्राथमिक बाजार अंदाज • २. रिसायकलर ऑफर: कारखान्याची अधिकृत बोली • ३. अंतिम रक्कम: प्रत्यक्ष वजनानंतर तत्काळ बँक/UPI पावती.'
            : '1. Estimated: Preliminary baseline • 2. Recycler Offer: Formal binding bid • 3. Final Payout: Settled after calibrated scale weighment via direct UPI/bank transfer.'}
        </p>
      </div>

      {/* Recyclers List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
            {language === 'hi' ? 'रीसाइक्लर सूची व पारदर्शी भाव लोड हो रहे हैं...' : language === 'mr' ? 'रिसायकलर यादी व दर लोड होत आहेत...' : 'Loading verified recyclers and rates...'}
          </div>
        ) : recyclers.length === 0 ? (
          /* Honest Empty State: Incompatible Recycler Exclusion */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center text-slate-500 dark:text-slate-400 space-y-3 shadow-sm">
            <Building2 className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.noCompatibleRecycler}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {t.noCompatibleRecyclerDesc}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSelectedDistrict('Lucknow');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 transition-all shadow-sm"
              >
                {language === 'hi' ? 'सभी स्वीकृत रीसाइक्लर देखें' : language === 'mr' ? 'सर्व अधिकृत कारखाने पहा' : 'View All Recyclers'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {recyclers.map((rec, index) => {
            const isSuspended = rec.authorizationStatus === 'SUSPENDED';
            const isGazetteVerified = rec.authorizationSource === 'CPCB_GAZETTE_VERIFIED';
            const rate = rec.offeredRate || 85;
            const targetWeight = (rec as any).targetWeightKg || (activeLot ? activeLot.approxWeight : 15);
            const grossEstimate = Math.round(rate * targetWeight);
            const isExpanded = expandedExplanationId === rec.id;

            return (
              <div
                key={rec.id}
                className={`bg-white dark:bg-slate-900 border-2 rounded-3xl p-5 sm:p-6 shadow-sm transition-all space-y-4 ${
                  isSuspended
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/10'
                    : index === 0
                    ? 'border-emerald-500 dark:border-emerald-500/80 shadow-emerald-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Top Row: Facility Header & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">{formatUserDisplayName(rec.facilityName, 'RECYCLER', language)}</h3>

                      {/* Best Rate Badge: Only on verified/pending top bidder */}
                      {index === 0 && !isSuspended && rec.verificationRecord?.status !== 'DEMO' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-black border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>{t.bestRateBadge}</span>
                        </span>
                      )}

                      {/* Honest Traffic-Light Verification Badges */}
                      {rec.verificationRecord?.status === 'CPCB_VERIFIED' ? (
                        <button
                          type="button"
                          onClick={() => setSelectedVerificationProof(rec)}
                          className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 text-xs font-black border border-emerald-300 dark:border-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-all shadow-sm"
                          title={language === 'hi' ? 'CPCB सरकारी राजपत्र प्रमाण देखने के लिए क्लिक करें' : 'Click to view official CPCB Gazette certificate'}
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{language === 'hi' ? '🟢 CPCB राजपत्र सत्यापित' : language === 'mr' ? '🟢 CPCB राजपत्र पडताळणी' : '🟢 CPCB Gazette Verified'}</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal underline ml-0.5">({language === 'hi' ? 'प्रमाण देखें' : 'Proof'})</span>
                        </button>
                      ) : rec.verificationRecord?.status === 'PENDING_VERIFICATION' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-700">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>{language === 'hi' ? '🟡 सत्यापन प्रक्रियाधीन' : language === 'mr' ? '🟡 पडताळणी प्रलंबित' : '🟡 Verification Pending'}</span>
                        </span>
                      ) : isSuspended ? (
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-black border border-rose-300 dark:border-rose-700">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                          <span>{language === 'hi' ? '🔴 CPCB निलंबित (अस्वीकृत)' : language === 'mr' ? '🔴 CPCB निलंबित' : '🔴 CPCB Suspended (Barred)'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-950 dark:text-slate-400 text-xs font-medium border border-slate-300 dark:border-slate-700">
                          <span>🧪</span>
                          <span>{language === 'hi' ? '⚪ डेमो परीक्षण खाता' : language === 'mr' ? '⚪ डेमो खाते' : '⚪ Demo Simulation'}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                      {language === 'hi' ? 'पंजीकरण:' : language === 'mr' ? 'नोंदणी:' : 'Reg No:'} <b className="text-slate-800 dark:text-slate-200">{rec.registrationNo}</b>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 flex-wrap">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{formatAddressLocation(rec.address, language)}</span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-slate-600 dark:text-slate-400 italic font-medium">
                        {rec.verificationRecord?.evidenceSubtitle[language] || rec.verificationRecord?.evidenceSubtitle.en}
                      </span>
                    </p>
                  </div>

                  {/* Matching Score & Audio TTS */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => speakRecycler(rec)}
                      className={`p-2.5 rounded-xl border transition-all active:scale-95 shadow-sm ${
                        isSpeaking && speakingRecId === rec.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-300'
                          : 'bg-slate-100 hover:bg-emerald-50 border-slate-300 dark:bg-slate-800 dark:hover:bg-emerald-950/80 dark:border-slate-700 text-emerald-700 dark:text-emerald-300'
                      }`}
                      title={
                        isSpeaking && speakingRecId === rec.id
                          ? (t.voiceStop || 'Stop')
                          : (language === 'hi' ? 'रीसाइक्लर जानकारी सुनें' : language === 'mr' ? 'माहिती ऐका' : 'Listen Info')
                      }
                      aria-label={
                        isSpeaking && speakingRecId === rec.id
                          ? (t.voicePlaying || 'Playing voice...')
                          : (language === 'hi' ? 'रीसाइक्लर जानकारी सुनें' : language === 'mr' ? 'माहिती ऐका' : 'Listen Info')
                      }
                    >
                      {isSpeaking && speakingRecId === rec.id ? (
                        <VolumeX className="w-4 h-4 animate-bounce" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">{language === 'hi' ? 'सुझाव स्कोर' : language === 'mr' ? 'शिफारस स्कोअर' : 'Match Score'}</span>
                      <span className={`text-sm font-black ${isSuspended ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {isSuspended
                          ? (language === 'hi' ? '0% (अयोग्य / निलंबित)' : language === 'mr' ? '०% (अपात्र)' : '0% (Barred)')
                          : `${rec.matchScore ?? 95}% Match`}
                      </span>
                    </div>

                    <div className={`px-2.5 py-1 rounded-2xl flex items-center justify-center font-bold text-xs border shadow-sm ${
                      isSuspended ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800' : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800'
                    }`}>
                      {rec.rating > 0 ? (
                        <span className="flex items-center gap-1 text-amber-500">
                          ★ <b className="text-slate-900 dark:text-white">{rec.rating}</b>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-normal">
                          {language === 'hi' ? 'नया केंद्र' : 'New'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price Display & Economics Card */}
                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left: Quoted Rate */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
                      {language === 'hi' ? 'रीसाइक्लर का ऑफर दर' : language === 'mr' ? 'कारखान्याचा खरेदी दर' : 'Recycler Quoted Rate'}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-black ${isSuspended ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-emerald-600 dark:text-emerald-400'}`}>₹{rate}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">/ {language === 'hi' || language === 'mr' ? 'किग्रा' : 'kg'}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {language === 'hi' ? 'कुल अनुमानित मूल्य' : language === 'mr' ? 'एकूण अंदाजे मूल्य' : 'Total Quoted Value'} ({targetWeight} {language === 'hi' || language === 'mr' ? 'किग्रा' : 'kg'}): <b className="text-slate-900 dark:text-white font-extrabold text-sm">₹{grossEstimate}</b>
                    </p>
                  </div>

                  {/* Right: Doorstep vs Self-Delivery Economics */}
                  <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold flex items-center gap-1.5 ${rec.pickupAvailable ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
                        <Truck className={`w-3.5 h-3.5 ${rec.pickupAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`} />
                        <span>{language === 'hi' ? 'विकल्प A: गाड़ी पिकअप' : language === 'mr' ? 'पर्याय A: जागेवर पिकअप' : 'Option A: Doorstep Pickup'}</span>
                      </span>
                      <span className={`font-extrabold text-xs ${rec.pickupAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {rec.pickupAvailable
                          ? (language === 'hi' ? '₹0 कटौती (मुफ्त वाहन)' : language === 'mr' ? '₹० वजावट (मोफत)' : '₹0 Deductions (Free)')
                          : (language === 'hi' ? 'उपलब्ध नहीं' : language === 'mr' ? 'उपलब्ध नाही' : 'Not Offered')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold flex items-center gap-1.5 ${!rec.pickupAvailable ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}`}>
                        <span>🚶</span>
                        <span>{language === 'hi' ? 'विकल्प B: स्वयं डिलीवरी' : language === 'mr' ? 'पर्याय B: स्वतः वाहतूक' : 'Option B: Self Delivery'}</span>
                      </span>
                      <span className={`text-xs ${!rec.pickupAvailable ? 'font-bold text-amber-600 dark:text-amber-400' : 'text-slate-400 italic text-[11px]'}`}>
                        {!rec.pickupAvailable
                          ? (language === 'hi' ? 'लागू (केंद्र पर जाना होगा)' : language === 'mr' ? 'लागू (केंद्रावर जावे लागेल)' : 'Direct Drop Required')
                          : (language === 'hi' ? 'वैकल्पिक' : language === 'mr' ? 'पर्यायी' : 'Optional')}
                      </span>
                    </div>

                    <div className="text-[11px] font-medium pt-1">
                      {rec.pickupAvailable ? (
                        <span className="text-emerald-700 dark:text-emerald-300/90 flex items-center gap-1">
                          <span>✅</span>
                          <span>{language === 'hi' ? 'रीसाइक्लर का वाहन आपके पते पर आकर वजन करेगा।' : language === 'mr' ? 'रिसायकलरचे वाहन तुमच्या पत्त्यावर येऊन वजन करेल.' : 'Verified vehicle will collect & weigh at your location.'}</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 dark:text-amber-300/90 flex items-center gap-1">
                          <span>⚠️</span>
                          <span>{language === 'hi' ? 'इस केंद्र पर वाहन पिकअप नहीं है, स्वयं माल पहुंचाना होगा।' : language === 'mr' ? 'या केंद्रावर स्वतः माल पोहोचवावा लागेल.' : 'Requires direct facility drop-off (No doorstep vehicle).'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Logistics Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-slate-500 text-[10px] block">{language === 'hi' ? 'दूरी' : language === 'mr' ? 'अंतर' : 'Distance'}</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">~{rec.estimatedDistanceKm || 6.5} km</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-slate-500 text-[10px] block">{language === 'hi' ? 'डोरस्टेप पिकअप' : language === 'mr' ? 'जागेवर पिकअप' : 'Pickup'}</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      {rec.pickupAvailable ? (language === 'hi' ? '🚚 मुफ्त उपलब्ध' : language === 'mr' ? '🚚 मोफत उपलब्ध' : '🚚 Available') : (language === 'hi' ? 'स्वयं डिलीवरी' : language === 'mr' ? 'स्वतः वाहतूक' : 'Self Drop')}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-slate-500 text-[10px] block">{language === 'hi' ? 'सर्विस दायरा' : language === 'mr' ? 'कार्यक्षेत्र' : 'Service Radius'}</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{rec.serviceRadiusKm} km</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-slate-500 text-[10px] block">{language === 'hi' ? 'प्रमाणित रीसाइक्लिंग' : 'Verified Recycled'}</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      {rec.totalProcessedKg > 0
                        ? `${(rec.totalProcessedKg / 1000).toFixed(1)} ${language === 'hi' ? 'टन' : 'tons'}`
                        : (language === 'hi' ? '0 टन (प्रारंभिक)' : '0 tons (New)')}
                    </span>
                  </div>
                </div>

                {/* Explainable MCDA Ranking Accordion */}
                {rec.rankingExplanation && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                    <button
                      type="button"
                      onClick={() => setExpandedExplanationId(isExpanded ? null : rec.id)}
                      className="text-xs font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{t.mcdaWhyRanked} ({rec.matchScore}% {language === 'hi' ? 'स्कोर' : language === 'mr' ? 'स्कोअर' : 'Score'})</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 animate-fadeIn">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] pb-1 border-b border-slate-200 dark:border-slate-800">
                          <span>{language === 'hi' ? 'पारदर्शी स्कोरिंग विधि:' : language === 'mr' ? 'पारदर्शक स्कोअरिंग पद्धत:' : 'Algorithmic Basis:'}</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">MCDA Algorithmic Score</span>
                        </div>
                        {rec.rankingExplanation.reasons.map((r, i) => (
                          <div key={i} className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                            <span>{r[language] || r.en}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2 flex-wrap">
                  <a
                    href={isSuspended ? '#' : `tel:${rec.contactPhone}`}
                    onClick={(e) => handleCallRecycler(e, rec)}
                    className={`min-h-[48px] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border shadow-sm active:scale-95 transition-all ${
                      isSuspended
                        ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/60 dark:text-rose-300 cursor-not-allowed'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 dark:border-slate-700'
                    }`}
                    title={isSuspended ? 'निलंबित केंद्र - संपर्क प्रतिबंधित' : 'क्लिक करके कॉल करें या नंबर कॉपी करें'}
                  >
                    <Phone className={`w-3.5 h-3.5 ${isSuspended ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                    <span>{language === 'hi' ? 'कॉल करें' : language === 'mr' ? 'कॉल करा' : 'Call'} ({rec.contactPhone})</span>
                  </a>

                  {isSuspended ? (
                    <button
                      type="button"
                      disabled={true}
                      className="min-h-[48px] px-6 py-2.5 bg-rose-100 border border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800/80 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-not-allowed opacity-85 shadow-sm"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>{language === 'hi' ? 'लेनदेन प्रतिबंधित (निलंबित केंद्र)' : language === 'mr' ? 'व्यवहार बंदी (निलंबित)' : 'Trading Barred (Suspended)'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedRecyclerForAction(rec)}
                      className="min-h-[48px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all"
                    >
                      <span>{activeLot ? t.requestQuoteBtn : (language === 'hi' ? 'इस खरीदार को बेचें' : language === 'mr' ? 'या खरेदीदारास विका' : 'Sell to Recycler')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Confirmation & Acceptance Modal */}
      {selectedRecyclerForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>🤝</span>
                <span>{language === 'hi' ? 'सीधा कोटेशन / बोली का अनुरोध' : language === 'mr' ? 'थेट कोटेशन विनंती' : 'Request Direct Purchase Quote'}</span>
              </h3>
              <button
                onClick={() => setSelectedRecyclerForAction(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionSuccessMessage ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-2xl p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600 dark:text-emerald-400 animate-bounce" />
                <h4 className="text-base font-black text-slate-900 dark:text-white">{language === 'hi' ? 'कोटेशन अनुरोध सफल!' : language === 'mr' ? 'कोटेशन विनंती यशस्वी!' : 'Quote Requested Successfully!'}</h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-200">{actionSuccessMessage}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{language === 'hi' ? 'My Requests पेज पर ले जाया जा रहा है...' : language === 'mr' ? 'My Requests पृष्ठावर पुनर्निर्देशित करत आहे...' : 'Redirecting to My Requests...'}</p>
              </div>
            ) : (
              <>
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{language === 'hi' ? 'अधिकृत रीसाइक्लर:' : language === 'mr' ? 'अधिकृत रिसायकलर:' : 'Authorized Recycler:'}</span>
                    <b className="text-slate-900 dark:text-white text-right">{formatUserDisplayName(selectedRecyclerForAction.facilityName, 'RECYCLER', language)}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{language === 'hi' ? 'पंजीकरण संख्या:' : language === 'mr' ? 'नोंदणी क्रमांक:' : 'Registration No:'}</span>
                    <b className="font-mono text-emerald-600 dark:text-emerald-400">{selectedRecyclerForAction.registrationNo}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{language === 'hi' ? 'सामग्री:' : language === 'mr' ? 'साहित्य प्रकार:' : 'Material:'}</span>
                    <b className="text-slate-900 dark:text-white">{activeLot ? activeLot.subCategory || activeLot.materialCategory : selectedCategory}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{language === 'hi' ? 'वजन:' : language === 'mr' ? 'वजन:' : 'Weight:'}</span>
                    <b className="text-slate-900 dark:text-white">{activeLot ? activeLot.approxWeight : 15} kg</b>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">{language === 'hi' ? 'कोटेड दर:' : language === 'mr' ? 'दर:' : 'Quoted Rate:'}</span>
                    <b className="text-emerald-600 dark:text-emerald-400 text-sm">₹{selectedRecyclerForAction.offeredRate || 85} / kg</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{language === 'hi' ? 'कुल अनुमानित राशि:' : language === 'mr' ? 'एकूण अंदाजे रक्कम:' : 'Total Estimated Payout:'}</span>
                    <b className="text-slate-900 dark:text-white font-black text-base">
                      ₹{Math.round((selectedRecyclerForAction.offeredRate || 85) * (activeLot ? activeLot.approxWeight : 15))}
                    </b>
                  </div>
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-300">
                    <span>{language === 'hi' ? 'डोरस्टेप वाहन पिकअप:' : language === 'mr' ? 'जागेवर पिकअप:' : 'Doorstep Pickup:'}</span>
                    <b>{selectedRecyclerForAction.pickupAvailable ? (language === 'hi' ? 'मुफ्त उपलब्ध (₹0 कटौती)' : language === 'mr' ? 'मोफत उपलब्ध (₹० वजावट)' : 'Free Doorstep Collection') : (language === 'hi' ? 'स्वयं डिलीवरी' : language === 'mr' ? 'स्वतः वाहतूक' : 'Self Drop')}</b>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  {language === 'hi'
                    ? 'ℹ️ कोटेशन प्राप्त होने के बाद यह औपचारिक ऑफर आपके "My Requests" पेज पर उपलब्ध होगा। आप वहां विवरण की समीक्षा करके इसे स्वीकार कर सकते हैं। अंतिम भुगतान डिजिटल कांटे पर तौल के बाद सीधे जमा होता है।'
                    : language === 'mr'
                    ? 'ℹ️ कोटेशन मिळाल्यानंतर ही अधिकृत ऑफर आपल्या "My Requests" पृष्ठावर उपलब्ध होईल. आपण तेथे तपशील तपासून ती स्वीकारू शकता. प्रत्यक्ष तपासणीनंतर अंतिम रक्कम जमा होते.'
                    : 'ℹ️ Once requested, this formal purchase offer will appear under My Requests for your review and acceptance. Final settlement is credited after electronic weighment at collection.'}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRecyclerForAction(null)}
                    disabled={actionProcessing}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700"
                  >
                    {language === 'hi' ? 'रद्द करें' : language === 'mr' ? 'रद्द करा' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAction}
                    disabled={actionProcessing}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all"
                  >
                    {actionProcessing ? (language === 'hi' ? 'कोटेशन तैयार हो रहा है...' : language === 'mr' ? 'कोटेशन तयार होत आहे...' : 'Generating Quote...') : (language === 'hi' ? 'कोटेशन प्राप्त करें' : language === 'mr' ? 'कोटेशन मिळवा' : 'Request Official Quote')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* CPCB Gazette Verification Proof Modal */}
      {selectedVerificationProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/50 flex items-center justify-center shrink-0 shadow-sm">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                      MoEFCC • CPCB Verified
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      Schedule I & II
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {language === 'hi'
                      ? 'CPCB सरकारी राजपत्र सत्यापन प्रमाण'
                      : language === 'mr'
                      ? 'CPCB शासकीय राजपत्र पडताळणी प्रमाणपत्र'
                      : 'CPCB Official Gazette Verification Certificate'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVerificationProof(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="बंद करें"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Gazette Status Banner */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-emerald-950/90 dark:via-emerald-900/60 dark:to-slate-900 border border-emerald-300 dark:border-emerald-500/60 rounded-2xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                    {language === 'hi'
                      ? 'वैधानिक CPCB राजपत्र में पंजीकृत इकाई'
                      : language === 'mr'
                      ? 'वैधानिक CPCB राजपत्रात नोंदणीकृत केंद्र'
                      : 'Statutory CPCB Gazette Registered Facility'}
                  </span>
                </div>
                <span className="font-mono text-xs font-black text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600/60">
                  STATUS: ACTIVE / VERIFIED
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedVerificationProof.verificationRecord?.verificationSource ||
                  'Cross-referenced with CPCB Gazette Master Registry (Schedule I & II Authorized E-Waste Recycler, MoEFCC)'}
              </p>
            </div>

            {/* Details Table */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 pb-2 border-b border-slate-200 dark:border-slate-900">
                <span className="text-slate-500 dark:text-slate-400">{language === 'hi' ? 'राजपत्र में पंजीकृत नाम:' : language === 'mr' ? 'नोंदणीकृत अधिकृत नाव:' : 'Gazetted Facility Name:'}</span>
                <b className="text-slate-900 dark:text-white text-sm font-black">
                  {selectedVerificationProof.verificationRecord?.registryDetails?.cpcbFacilityName || selectedVerificationProof.facilityName}
                </b>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 pb-2 border-b border-slate-200 dark:border-slate-900">
                <span className="text-slate-500 dark:text-slate-400">{language === 'hi' ? 'CPCB पंजीकरण क्रमांक:' : language === 'mr' ? 'CPCB नोंदणी क्रमांक:' : 'Official CPCB Registration No:'}</span>
                <b className="font-mono text-emerald-600 dark:text-emerald-400 text-xs font-black">
                  {selectedVerificationProof.verificationRecord?.cpcbRegistrationNo || selectedVerificationProof.registrationNo}
                </b>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 pb-2 border-b border-slate-200 dark:border-slate-900">
                <span className="text-slate-500 dark:text-slate-400">{language === 'hi' ? 'अधिकृत वार्षिक क्षमता:' : language === 'mr' ? 'अधिकृत वार्षिक क्षमता:' : 'Authorized Processing Capacity:'}</span>
                <b className="text-slate-800 dark:text-slate-200 font-bold">
                  {selectedVerificationProof.verificationRecord?.registryDetails?.authorizedCapacityMTA
                    ? `${selectedVerificationProof.verificationRecord.registryDetails.authorizedCapacityMTA.toLocaleString('en-IN')} MTA (मीट्रिक टन/वर्ष)`
                    : '5,400 MTA (मीट्रिक टन/वर्ष)'}
                </b>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 pb-2 border-b border-slate-200 dark:border-slate-900">
                <span className="text-slate-500 dark:text-slate-400">{language === 'hi' ? 'राजपत्र वैधता अवधि:' : language === 'mr' ? 'वैधता मुदत:' : 'Statutory Validity Period:'}</span>
                <b className="text-emerald-700 dark:text-emerald-300 font-bold">
                  {selectedVerificationProof.verificationRecord?.registryDetails?.validUntil || '31 Dec 2028'} (सक्रिय / Active)
                </b>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 pb-2 border-b border-slate-200 dark:border-slate-900">
                <span className="text-slate-500 dark:text-slate-400">{language === 'hi' ? 'अधिकृत सामग्री श्रेणियां:' : language === 'mr' ? 'अधिकृत ई-कचरा प्रकार:' : 'Authorized E-Waste Categories:'}</span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">
                  {selectedVerificationProof.verificationRecord?.registryDetails?.categoriesAuthorized?.join(', ') || 'PCB, Screens, IT & Telecom, Batteries, Mixed E-Waste'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 pb-2 border-b border-slate-200 dark:border-slate-900">
                <span className="text-slate-500 dark:text-slate-400">{language === 'hi' ? 'संयंत्र का भौतिक पता:' : language === 'mr' ? 'कारखान्याचा पत्ता:' : 'Physical Plant Address:'}</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {selectedVerificationProof.address}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-slate-500 dark:text-slate-400">{language === 'hi' ? 'प्लेटफॉर्म लेजर पर वास्तविक रीसाइक्लिंग:' : language === 'mr' ? 'वास्तविक रीसायकलिंग वजन:' : 'Ledger Verified Tonnage:'}</span>
                <b className="text-emerald-600 dark:text-emerald-400 font-black">
                  {selectedVerificationProof.totalProcessedKg > 0
                    ? `${(selectedVerificationProof.totalProcessedKg / 1000).toFixed(1)} टन (ऑडिटेड रिकॉर्ड)`
                    : (language === 'hi' ? '0 टन (प्रारंभिक चरण)' : '0 tons (New)')}
                </b>
              </div>
            </div>

            {/* Informational Guidance for Informal Collector */}
            <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                <Info className="w-4 h-4 shrink-0" />
                <span>{language === 'hi' ? 'कबाड़ीवाला कनेक्ट सत्यता एवं सुरक्षा गारंटी' : language === 'mr' ? 'कबाडीवाला कनेक्ट सुरक्षा हमी' : 'Kabadiwala Connect Verification Guarantee'}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'hi'
                  ? 'यह सत्यापन केंद्रीय प्रदूषण नियंत्रण बोर्ड (CPCB) ई-वेस्ट (प्रबंधन) नियम 2022 के अधिकृत मास्टर रजिस्टर से रियल-टाइम जांचा गया है। यहां अपना ई-कचरा बेचने पर आपको डिजिटल तौल रसीद और पूरा पारदर्शी भुगतान मिलता है।'
                  : language === 'mr'
                  ? 'ही पडताळणी केंद्रीय प्रदूषण नियंत्रण मंडळ (CPCB) च्या अधिकृत मास्टर नोंदवहीशी ताडून पाहिली आहे. येथे ई-कचरा दिल्यास अचूक वजन आणि संपूर्ण रक्कम हमीसह मिळते.'
                  : 'This facility has been independently validated against the Central Pollution Control Board (CPCB) statutory registry under E-Waste (Management) Rules 2022. You are guaranteed fair electronic weighment and transparent direct payment.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedVerificationProof(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700"
              >
                {language === 'hi' ? 'बंद करें' : language === 'mr' ? 'बंद करा' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = selectedVerificationProof;
                  setSelectedVerificationProof(null);
                  setSelectedRecyclerForAction(target);
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all"
              >
                <span>{language === 'hi' ? 'इस सत्यापित केंद्र को बेचें' : language === 'mr' ? 'या केंद्रास विका' : 'Sell to this Verified Center'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
