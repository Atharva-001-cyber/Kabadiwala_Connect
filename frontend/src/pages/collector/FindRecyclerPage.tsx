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
  Navigation
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useSpeech } from '../../hooks/useSpeech';
import { api } from '../../services/api';
import { RecyclerProfile, MaterialCategory, Lot } from '../../types';
import { categoryLabels } from '../../i18n/translations';
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
  const fetchRecyclers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { district: selectedDistrict };
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
        setRecyclers(res.recyclers);
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

  // TTS audio announcement
  const speakRecycler = (rec: RecyclerProfile) => {
    if (isSpeaking && speakingRecId === rec.id) {
      stop();
      setSpeakingRecId(null);
      return;
    }
    const isGovt = rec.authorizationSource === 'CPCB_GAZETTE_VERIFIED';
    const rate = rec.offeredRate || rec.baseOfferedRates[selectedCategory as MaterialCategory] || 85;
    const text = language === 'hi'
      ? `${rec.facilityName}, ${isGovt ? 'केंद्रीय प्रदूषण नियंत्रण बोर्ड राजपत्र सत्यापित' : 'प्लेटफॉर्म अधिकृत'} केंद्र है। ऑफर दर ₹${rate} प्रति किलो है। ${rec.pickupAvailable ? 'मुफ्त वाहन पिकअप उपलब्ध है।' : 'स्वयं डिलीवरी केंद्र है।'}`
      : language === 'mr'
      ? `${rec.facilityName}, अधिकृत केंद्र आहे. दर ₹${rate} प्रति किलो आहे. ${rec.pickupAvailable ? 'मोफत वाहन पिकअप उपलब्ध आहे.' : 'स्वतः डिलिव्हरी करावी लागेल.'}`
      : `${rec.facilityName} is a ${isGovt ? 'CPCB Registry Verified' : 'Platform Verified'} facility offering ${rate} rupees per kilogram. ${rec.pickupAvailable ? 'Free doorstep pickup is available.' : 'Self delivery required.'}`;
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
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Active Lot Context Banner (If matching for a specific lot) */}
      {activeLot && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-2 border-emerald-500/60 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-900 text-emerald-300 border border-emerald-700">
                {t.activeLotBanner}
              </span>
              <span className="font-mono text-xs text-white font-bold">{activeLot.id}</span>
            </div>
            <button
              onClick={() => {
                setActiveLot(null);
                setSearchParams({});
              }}
              className="text-slate-400 hover:text-white text-xs flex items-center gap-1 font-bold"
            >
              <X className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'हटाएं' : language === 'mr' ? 'काढून टाका' : 'Clear'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-black text-white">
                {activeLot.subCategory || activeLot.materialCategory}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {language === 'hi' ? 'वजन:' : language === 'mr' ? 'वजन:' : 'Weight:'} <b className="text-white text-sm">{activeLot.approxWeight} kg</b> • {language === 'hi' ? 'बेंचमार्क अनुमान:' : language === 'mr' ? 'बाजार अंदाज:' : 'Benchmark Est:'} <b className="text-emerald-400 font-bold">₹{activeLot.estimatedValueMin} – ₹{activeLot.estimatedValueMax}</b>
              </p>
            </div>
            <div className="text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-emerald-300 font-bold">
              {language === 'hi' ? '🎯 इस लॉट के लिए सबसे उपयुक्त खरीदार नीचे प्रदर्शित हैं' : language === 'mr' ? '🎯 या लॉटसाठी सर्वोत्तम खरेदीदार खाली उपलब्ध आहेत' : '🎯 Best matching recyclers for this lot are listed below'}
            </div>
          </div>
        </div>
      )}

      {/* Header & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>🏭</span>
              <span>{t.matchingTitle}</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {t.matchingSubtitle}
            </p>
          </div>

          {/* GPS Button */}
          <button
            type="button"
            onClick={handleAcquireGps}
            disabled={gpsLoading}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
              userGps
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : 'text-emerald-400'}`} />
            <span>
              {gpsLoading ? (language === 'hi' ? 'स्थान खोज रहे हैं...' : language === 'mr' ? 'स्थान शोधत आहे...' : 'Locating...') : userGps ? (language === 'hi' ? '🟢 GPS सक्रिय' : language === 'mr' ? '🟢 GPS सक्रिय' : '🟢 GPS Active') : (language === 'hi' ? '🛰️ वास्तविक GPS दूरी देखें' : language === 'mr' ? '🛰️ प्रत्यक्ष GPS अंतर पहा' : '🛰️ Calculate GPS Distance')}
            </span>
          </button>
        </div>

        {/* District & Material Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="Lucknow" className="bg-slate-900">Lucknow (लखनऊ)</option>
              <option value="all" className="bg-slate-900">{language === 'hi' ? 'सभी जिले (All Districts)' : language === 'mr' ? 'सर्व जिल्हे (All Districts)' : 'All Districts (सभी जिले)'}</option>
              <option value="Pune" className="bg-slate-900">Pune (पुणे)</option>
              <option value="Nagpur" className="bg-slate-900">Nagpur (नागपूर)</option>
              <option value="Delhi NCR" className="bg-slate-900">Delhi NCR (दिल्ली)</option>
              <option value="Bengaluru" className="bg-slate-900">Bengaluru</option>
              <option value="Mumbai" className="bg-slate-900">Mumbai (मुंबई)</option>
            </select>
          </div>

          <span className="text-slate-500 text-xs hidden sm:inline">•</span>

          {/* 8 Mandatory Material Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            {categoriesList.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1 ${
                  selectedCategory === cat.key
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
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
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 text-xs text-slate-400 space-y-1">
        <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-[11px] uppercase tracking-wider">
          <Info className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? 'पारदर्शी भाव नियम' : language === 'mr' ? 'पारदर्शक दर नियम' : 'Transparent Price Rules'}</span>
        </div>
        <p className="text-[11px] text-slate-300">
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
            {language === 'hi' ? 'रीसाइक्लर सूची व पारदर्शी भाव लोड हो रहे हैं...' : language === 'mr' ? 'रिसायकलर यादी व दर लोड होत आहेत...' : 'Loading verified recyclers and rates...'}
          </div>
        ) : recyclers.length === 0 ? (
          /* Honest Empty State: Incompatible Recycler Exclusion */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-slate-400 space-y-3">
            <Building2 className="w-12 h-12 mx-auto text-slate-600" />
            <h3 className="text-base font-bold text-white">{t.noCompatibleRecycler}</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {t.noCompatibleRecyclerDesc}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSelectedDistrict('Lucknow');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold"
              >
                {language === 'hi' ? 'सभी स्वीकृत रीसाइक्लर देखें' : language === 'mr' ? 'सर्व अधिकृत कारखाने पहा' : 'View All Recyclers'}
              </button>
            </div>
          </div>
        ) : (
          recyclers.map((rec, index) => {
            const isGazetteVerified = rec.authorizationSource === 'CPCB_GAZETTE_VERIFIED';
            const rate = rec.offeredRate || 85;
            const targetWeight = (rec as any).targetWeightKg || (activeLot ? activeLot.approxWeight : 15);
            const grossEstimate = Math.round(rate * targetWeight);
            const isExpanded = expandedExplanationId === rec.id;

            return (
              <div
                key={rec.id}
                className={`bg-slate-900 border-2 rounded-3xl p-5 sm:p-6 shadow-xl transition-all space-y-4 ${
                  index === 0 ? 'border-emerald-500/80 shadow-emerald-950/20' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Facility Header & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-black text-white">{rec.facilityName}</h3>

                      {index === 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 text-[10px] font-black border border-amber-700 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>{t.bestRateBadge}</span>
                        </span>
                      )}

                      {/* Truthful Authorization Source Badge */}
                      {isGazetteVerified ? (
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-xs font-black border border-emerald-700">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{language === 'hi' ? 'CPCB राजपत्र सत्यापित' : language === 'mr' ? 'CPCB राजपत्रात नोंदणीकृत' : 'CPCB GAZETTE VERIFIED'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-slate-950 text-slate-300 text-xs font-bold border border-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>{language === 'hi' ? 'मंच सत्यापित' : language === 'mr' ? 'प्लॅटफॉर्म पडताळणी' : 'PLATFORM VERIFIED'}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 font-mono mt-1">
                      {language === 'hi' ? 'पंजीकरण:' : language === 'mr' ? 'नोंदणी:' : 'Reg No:'} <b className="text-slate-200">{rec.registrationNo}</b>
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{rec.address}</span>
                    </p>
                  </div>

                  {/* Matching Score & Audio TTS */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => speakRecycler(rec)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isSpeaking && speakingRecId === rec.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-300'
                          : 'bg-slate-800 hover:bg-emerald-950/80 border-slate-700 text-emerald-300'
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
                      <span className="text-sm font-black text-emerald-400">{rec.matchScore || 95}% Match</span>
                    </div>

                    <div className="w-10 h-10 rounded-2xl bg-emerald-950 text-emerald-300 flex items-center justify-center font-black text-xs border border-emerald-800 shadow">
                      ★ {rec.rating}
                    </div>
                  </div>
                </div>

                {/* Price Display & Economics Card */}
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left: Quoted Rate */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      {language === 'hi' ? 'रीसाइक्लर का ऑफर दर' : language === 'mr' ? 'कारखान्याचा खरेदी दर' : 'Recycler Quoted Rate'}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-emerald-400">₹{rate}</span>
                      <span className="text-xs text-slate-400 font-bold">/ kg</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      {language === 'hi' ? 'कुल अनुमानित मूल्य' : language === 'mr' ? 'एकूण अंदाजे मूल्य' : 'Total Quoted Value'} ({targetWeight} kg): <b className="text-white font-extrabold text-sm">₹{grossEstimate}</b>
                    </p>
                  </div>

                  {/* Right: Doorstep vs Self-Delivery Economics */}
                  <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{language === 'hi' ? 'विकल्प A: डोरस्टेप पिकअप' : language === 'mr' ? 'पर्याय A: जागेवर पिकअप' : 'Option A: Doorstep Pickup'}</span>
                      </span>
                      <span className="font-extrabold text-emerald-400">{language === 'hi' ? '₹0 कटौती (मुफ्त)' : language === 'mr' ? '₹० वजावट (मोफत)' : '₹0 Deductions (Free)'}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-400 flex items-center gap-1">
                        <span>🚶</span>
                        <span>{language === 'hi' ? 'विकल्प B: स्वयं डिलीवरी' : language === 'mr' ? 'पर्याय B: स्वतः वाहतूक' : 'Option B: Self Delivery'}</span>
                      </span>
                      <span className="text-slate-400 italic text-[11px]">{language === 'hi' ? 'परिवहन खर्च उपलब्ध नहीं' : language === 'mr' ? 'वाहतूक खर्च नाही' : 'Standard Rate'}</span>
                    </div>

                    <div className="text-[11px] text-emerald-300/90 font-medium">
                      {rec.pickupAvailable
                        ? (language === 'hi' ? '✅ रीसाइक्लर का वाहन आपके पते पर आकर वजन करेगा।' : language === 'mr' ? '✅ रिसायकलरचे वाहन तुमच्या पत्त्यावर येऊन वजन करेल.' : '✅ Verified vehicle will collect & weigh at your location.')
                        : (language === 'hi' ? '⚠️ इस केंद्र पर आपको स्वयं माल पहुंचाना होगा।' : language === 'mr' ? '⚠️ या केंद्रावर स्वतः माल पोहोचवावा लागेल.' : '⚠️ Requires direct facility drop-off.')}
                    </div>
                  </div>
                </div>

                {/* Logistics Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">{language === 'hi' ? 'दूरी' : language === 'mr' ? 'अंतर' : 'Distance'}</span>
                    <span className="font-extrabold text-slate-200">~{rec.estimatedDistanceKm || 6.5} km</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">{language === 'hi' ? 'डोरस्टेप पिकअप' : language === 'mr' ? 'जागेवर पिकअप' : 'Pickup'}</span>
                    <span className="font-extrabold text-emerald-400">
                      {rec.pickupAvailable ? (language === 'hi' ? '🚚 मुफ्त उपलब्ध' : language === 'mr' ? '🚚 मोफत उपलब्ध' : '🚚 Available') : (language === 'hi' ? 'स्वयं डिलीवरी' : language === 'mr' ? 'स्वतः वाहतूक' : 'Self Drop')}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">{language === 'hi' ? 'सर्विस दायरा' : language === 'mr' ? 'कार्यक्षेत्र' : 'Service Radius'}</span>
                    <span className="font-extrabold text-slate-200">{rec.serviceRadiusKm} km</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">{language === 'hi' ? 'अधिकृत रीसाइक्लिंग' : language === 'mr' ? 'अधिकृत प्रक्रिया' : 'Recycled'}</span>
                    <span className="font-extrabold text-slate-200">{(rec.totalProcessedKg / 1000).toFixed(1)} {language === 'hi' ? 'टन' : language === 'mr' ? 'टन' : 'tons'}</span>
                  </div>
                </div>

                {/* Explainable MCDA Ranking Accordion */}
                {rec.rankingExplanation && (
                  <div className="border-t border-slate-800 pt-2">
                    <button
                      type="button"
                      onClick={() => setExpandedExplanationId(isExpanded ? null : rec.id)}
                      className="text-xs font-bold text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t.mcdaWhyRanked} ({rec.matchScore}% {language === 'hi' ? 'स्कोर' : language === 'mr' ? 'स्कोअर' : 'Score'})</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 bg-slate-950 rounded-xl p-3 border border-slate-800 text-xs space-y-1.5 animate-fadeIn">
                        <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-800">
                          <span>{language === 'hi' ? 'पारदर्शी स्कोरिंग विधि:' : language === 'mr' ? 'पारदर्शक स्कोअरिंग पद्धत:' : 'Algorithmic Basis:'}</span>
                          <span className="font-mono text-emerald-400">MCDA Algorithmic Score</span>
                        </div>
                        {rec.rankingExplanation.reasons.map((r, i) => (
                          <div key={i} className="flex items-center gap-2 text-slate-300 text-xs">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{r[language] || r.en}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-2 flex-wrap">
                  <a
                    href={`tel:${rec.contactPhone}`}
                    className="min-h-[48px] px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 shadow active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{language === 'hi' ? 'कॉल करें' : language === 'mr' ? 'कॉल करा' : 'Call'} ({rec.contactPhone})</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setSelectedRecyclerForAction(rec)}
                    className="min-h-[48px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950 flex items-center gap-2"
                  >
                    <span>{activeLot ? t.requestQuoteBtn : (language === 'hi' ? 'इस खरीदार को बेचें' : language === 'mr' ? 'या खरेदीदारास विका' : 'Sell to Recycler')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation & Acceptance Modal */}
      {selectedRecyclerForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>🤝</span>
                <span>{language === 'hi' ? 'सीधा कोटेशन / बोली का अनुरोध' : language === 'mr' ? 'थेट कोटेशन विनंती' : 'Request Direct Purchase Quote'}</span>
              </h3>
              <button
                onClick={() => setSelectedRecyclerForAction(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionSuccessMessage ? (
              <div className="bg-emerald-950/60 border border-emerald-700 rounded-2xl p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 animate-bounce" />
                <h4 className="text-base font-black text-white">{language === 'hi' ? 'कोटेशन अनुरोध सफल!' : language === 'mr' ? 'कोटेशन विनंती यशस्वी!' : 'Quote Requested Successfully!'}</h4>
                <p className="text-xs text-emerald-200">{actionSuccessMessage}</p>
                <p className="text-[11px] text-slate-400 font-mono">{language === 'hi' ? 'My Requests पेज पर ले जाया जा रहा है...' : language === 'mr' ? 'My Requests पृष्ठावर पुनर्निर्देशित करत आहे...' : 'Redirecting to My Requests...'}</p>
              </div>
            ) : (
              <>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{language === 'hi' ? 'अधिकृत रीसाइक्लर:' : language === 'mr' ? 'अधिकृत रिसायकलर:' : 'Authorized Recycler:'}</span>
                    <b className="text-white text-right">{selectedRecyclerForAction.facilityName}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{language === 'hi' ? 'पंजीकरण संख्या:' : language === 'mr' ? 'नोंदणी क्रमांक:' : 'Registration No:'}</span>
                    <b className="font-mono text-emerald-400">{selectedRecyclerForAction.registrationNo}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{language === 'hi' ? 'सामग्री:' : language === 'mr' ? 'साहित्य प्रकार:' : 'Material:'}</span>
                    <b className="text-white">{activeLot ? activeLot.subCategory || activeLot.materialCategory : selectedCategory}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{language === 'hi' ? 'वजन:' : language === 'mr' ? 'वजन:' : 'Weight:'}</span>
                    <b className="text-white">{activeLot ? activeLot.approxWeight : 15} kg</b>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-800">
                    <span className="text-slate-400">{language === 'hi' ? 'कोटेड दर:' : language === 'mr' ? 'दर:' : 'Quoted Rate:'}</span>
                    <b className="text-emerald-400 text-sm">₹{selectedRecyclerForAction.offeredRate || 85} / kg</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{language === 'hi' ? 'कुल अनुमानित राशि:' : language === 'mr' ? 'एकूण अंदाजे रक्कम:' : 'Total Estimated Payout:'}</span>
                    <b className="text-white font-black text-base">
                      ₹{Math.round((selectedRecyclerForAction.offeredRate || 85) * (activeLot ? activeLot.approxWeight : 15))}
                    </b>
                  </div>
                  <div className="flex justify-between text-emerald-300">
                    <span>{language === 'hi' ? 'डोरस्टेप वाहन पिकअप:' : language === 'mr' ? 'जागेवर पिकअप:' : 'Doorstep Pickup:'}</span>
                    <b>{selectedRecyclerForAction.pickupAvailable ? (language === 'hi' ? 'मुफ्त उपलब्ध (₹0 कटौती)' : language === 'mr' ? 'मोफत उपलब्ध (₹० वजावट)' : 'Free Doorstep Collection') : (language === 'hi' ? 'स्वयं डिलीवरी' : language === 'mr' ? 'स्वतः वाहतूक' : 'Self Drop')}</b>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
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
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                  >
                    {language === 'hi' ? 'रद्द करें' : language === 'mr' ? 'रद्द करा' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAction}
                    disabled={actionProcessing}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950 flex items-center gap-1.5"
                  >
                    {actionProcessing ? (language === 'hi' ? 'कोटेशन तैयार हो रहा है...' : language === 'mr' ? 'कोटेशन तयार होत आहे...' : 'Generating Quote...') : (language === 'hi' ? 'कोटेशन प्राप्त करें' : language === 'mr' ? 'कोटेशन मिळवा' : 'Request Official Quote')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
