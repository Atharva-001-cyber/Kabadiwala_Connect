import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Volume2, 
  VolumeX,
  MapPin, 
  PlusCircle, 
  X, 
  Coins, 
  Scale, 
  Calculator, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Wifi, 
  WifiOff, 
  Compass,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useSpeech } from '../../hooks/useSpeech';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { PriceRecord, MaterialCategory, RecyclerProfile } from '../../types';
import { categoryLabels, getCategoryLabel, formatLocationString, MANDI_LOCATIONS, DISTRICT_STATE_MAP } from '../../i18n/translations';

export const PriceBoardPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { speak, stop, isSpeaking } = useSpeech();
  const { showToast } = useToast();

  const [selectedDistrict, setSelectedDistrict] = useState<string>('Lucknow');
  const [prices, setPrices] = useState<PriceRecord[]>([]);
  const [recyclers, setRecyclers] = useState<RecyclerProfile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory>('PCB');
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Transparent Valuation Calculator state
  const [calcWeight, setCalcWeight] = useState<string>('15');
  const [calcCondition, setCalcCondition] = useState<'INTACT' | 'DAMAGED' | 'DISMANTLED'>('INTACT');
  const [valBreakdown, setValBreakdown] = useState<any>(null);

  // New Price Entry Modal (Admin/Authorized)
  const [showAddPriceModal, setShowAddPriceModal] = useState<boolean>(false);
  const [inputCategory, setInputCategory] = useState<MaterialCategory>('PCB');
  const [inputRate, setInputRate] = useState<string>('98');
  const [inputSource, setInputSource] = useState<string>('Local Mandi Survey');
  const [submittingPrice, setSubmittingPrice] = useState<boolean>(false);

  const currentLocation = MANDI_LOCATIONS.find(l => l.district.toLowerCase() === selectedDistrict.toLowerCase()) || {
    district: selectedDistrict,
    state: DISTRICT_STATE_MAP[selectedDistrict] || ''
  };

  // Listen to online/offline network changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchPricesAndRecyclers = async () => {
    setLoading(true);
    try {
      const [priceRes, recyclerRes] = await Promise.all([
        api.getPriceBoard(selectedDistrict),
        api.getRecyclers({ district: selectedDistrict })
      ]);

      if (priceRes.success) {
        setPrices(priceRes.prices);
      }
      if (recyclerRes.success) {
        setRecyclers(recyclerRes.recyclers || []);
      }
    } catch (e) {
      console.warn('Failed to load prices/recyclers:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (cat: MaterialCategory, dist: string) => {
    try {
      const res = await api.getPriceHistory(cat, 30, dist);
      if (res.success) {
        setHistoryData(res);
      }
    } catch (e) {
      console.warn('Failed to load history:', e);
      setHistoryData(null);
    }
  };

  const updateValuationBreakdown = async (cat: MaterialCategory, weightStr: string, cond: string, dist: string) => {
    const w = parseFloat(weightStr);
    if (!w || w <= 0) return;
    try {
      const res = await api.estimateLotValue({
        materialCategory: cat,
        weight: w,
        condition: cond,
        district: dist
      });
      if (res.success) {
        setValBreakdown(res);
      }
    } catch (err) {
      console.warn('Error estimating value:', err);
    }
  };

  useEffect(() => {
    fetchPricesAndRecyclers();
  }, [selectedDistrict]);

  useEffect(() => {
    fetchHistory(selectedCategory, selectedDistrict);
    updateValuationBreakdown(selectedCategory, calcWeight, calcCondition, selectedDistrict);
  }, [selectedCategory, selectedDistrict, calcWeight, calcCondition]);

  // Real GPS District Locator
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      showToast(language === 'hi' ? 'इस डिवाइस पर GPS उपलब्ध नहीं है।' : 'GPS is not available on this device.', 'warning');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        setGpsActive(true);

        // Approximate nearest district without external reverse-geocoding API
        if (latitude > 25.5 && longitude < 82) {
          setSelectedDistrict('Lucknow');
        } else if (latitude < 20 && longitude < 75) {
          setSelectedDistrict('Pune');
        } else if (latitude >= 20 && latitude <= 22 && longitude >= 78) {
          setSelectedDistrict('Nagpur');
        } else if (latitude > 27) {
          setSelectedDistrict('Delhi NCR');
        } else if (latitude < 14) {
          setSelectedDistrict('Bengaluru');
        }
      },
      (err) => {
        console.warn('GPS denied or error:', err.message);
        showToast(language === 'hi' ? 'GPS अनुमति अस्वीकृत हुई। डिफ़ॉल्ट जिला सूची का उपयोग किया जा रहा है।' : 'GPS permission denied. Using district selection.', 'warning');
      },
      { timeout: 8000 }
    );
  };

  const handleCreatePriceObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPrice(true);
    try {
      const res = await api.updateObservedPrice({
        materialCategory: inputCategory,
        subCategory: `${inputCategory} Verified Mandi Scrap`,
        district: selectedDistrict,
        ratePerKg: parseFloat(inputRate),
        source: inputSource,
        sourceType: 'ADMIN_BENCHMARK'
      });
      if (res.success) {
        showToast(res.message, 'success');
        setShowAddPriceModal(false);
        fetchPricesAndRecyclers();
        fetchHistory(selectedCategory, selectedDistrict);
      }
    } catch (err: any) {
      showToast(err.message || 'Price update failed', 'error');
    } finally {
      setSubmittingPrice(false);
    }
  };

  // Web Speech Audio
  const speakAllPrices = () => {
    if (prices.length === 0) return;
    const currencyUnit = language === 'en' ? 'rupees' : 'रुपये';
    const topRates = prices.slice(0, 4).map(p => `${categoryLabels[p.materialCategory]?.[language] || p.materialCategory} ${p.prevailingBuyPrice} ${currencyUnit}`).join(', ');
    const text = language === 'hi'
      ? `${selectedDistrict} मंडी में आज के मुख्य भाव: ${topRates} प्रति किलो हैं।`
      : language === 'mr'
      ? `${selectedDistrict} बाजारपेठेत आजचे मुख्य दर: ${topRates} प्रति किलो आहेत.`
      : `Today's benchmark e-waste buying rates in ${selectedDistrict}: ${topRates} per kg.`;
    speak(text, language);
  };

  const speakCategoryRate = (price: PriceRecord) => {
    const catName = categoryLabels[price.materialCategory]?.[language] || price.materialCategory;
    const trendWord = price.trend === 'UP' 
      ? (language === 'hi' ? 'बढ़ रहा है' : language === 'mr' ? 'वाढत आहे' : 'rising')
      : price.trend === 'DOWN'
      ? (language === 'hi' ? 'घट रहा है' : language === 'mr' ? 'कमी होत आहे' : 'falling')
      : (language === 'hi' ? 'स्थिर है' : language === 'mr' ? 'स्थिर आहे' : 'stable');

    const text = language === 'hi'
      ? `${catName} का आज का मंडी भाव ${price.prevailingBuyPrice} रुपये प्रति किलो है। न्यूनतम ${price.minPrice} और अधिकतम ${price.maxPrice} रुपये है। भाव का रुझान ${trendWord}।`
      : language === 'mr'
      ? `${catName} चा आजचा बाजारभाव ${price.prevailingBuyPrice} रुपये प्रति किलो आहे. किमान ${price.minPrice} आणि कमाल ${price.maxPrice} रुपये आहे. भाव ${trendWord}.`
      : `${catName} current rate is ${price.prevailingBuyPrice} rupees per kg. Market range is ${price.minPrice} to ${price.maxPrice}. Trend is ${trendWord}.`;
    speak(text, language);
  };

  const speakCalculatedValue = () => {
    if (!valBreakdown?.estimatedValue) return;
    const catName = categoryLabels[selectedCategory]?.[language] || selectedCategory;
    const est = valBreakdown.estimatedValue;
    const text = language === 'hi'
      ? `${calcWeight} किलो ${catName} की अनुमानित कमाई ${est.min} से ${est.max} रुपये के बीच है। यह केवल अनुमान है, अंतिम भुगतान कांटे पर वजन के बाद होगा।`
      : language === 'mr'
      ? `${calcWeight} किलो ${catName} ची अंदाजे कमाई ${est.min} ते ${est.max} रुपयांच्या दरम्यान आहे. हा केवळ अंदाज आहे, अंतिम रक्कम काट्यावर वजन झाल्यावर ठरेल.`
      : `Estimated earnings for ${calcWeight} kg of ${catName} is between ${est.min} and ${est.max} rupees. This is an estimate only, not a guaranteed final sale price.`;
    speak(text, language);
  };

  // Find active recycler bid for a category
  const getRecyclerOfferForCategory = (cat: MaterialCategory) => {
    let highest = 0;
    let recName = '';
    recyclers.forEach(r => {
      const rate = r.baseOfferedRates?.[cat];
      if (rate && rate > highest) {
        highest = rate;
        recName = r.facilityName;
      }
    });
    return highest > 0 ? { rate: highest, recName } : null;
  };

  const selectedPriceRecord = prices.find(p => p.materialCategory === selectedCategory) || prices[0];

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Top Header & District Switcher */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Coins className="w-7 h-7 text-amber-400" />
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {t.priceBoardTitle}
              </h1>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1">
              {language === 'hi'
                ? 'EPR नियम 2022 के तहत अधिकृत रीसाइक्लर्स और प्लेटफ़ॉर्म खरीद दरों पर आधारित पारदर्शी बेंचमार्क भाव'
                : language === 'mr'
                ? 'ई-कचरा नियम २०२२ अंतर्गत अधिकृत पुनर्वापरदार आणि व्यवहार नोंदींवर आधारित पारदर्शक बाजारभाव'
                : 'Transparent benchmark rates based on authorized recycler quotes and verified platform observations'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Online / Offline Sync Badge */}
            <span className={`px-3 py-1.5 rounded-xl text-[11px] font-black border flex items-center gap-1.5 ${
              isOnline 
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' 
                : 'bg-amber-950/80 text-amber-300 border-amber-800'
            }`}>
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isOnline ? (language === 'hi' ? '🟢 ऑनलाइन कनेक्टेड' : language === 'mr' ? '🟢 ऑनलाइन कनेक्टेड' : '🟢 Online Connected') : (language === 'hi' ? '🟡 ऑफलाइन कैश्ड' : language === 'mr' ? '🟡 ऑफलाइन कॅश' : '🟡 Offline Cached')}</span>
            </span>

            <button
              onClick={() => setShowAddPriceModal(true)}
              className="min-h-[44px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-2xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 shadow"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>{language === 'hi' ? 'नया भाव दर्ज करें' : language === 'mr' ? 'नवीन दर नोंदवा' : 'Record Rate'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isSpeaking) {
                  stop();
                } else {
                  speakAllPrices();
                }
              }}
              className={`min-h-[44px] px-4 py-2 active:scale-95 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg transition-all ${
                isSpeaking
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 shadow-amber-950'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
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
                  <span>{t.listenPrice}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* District Selector & GPS Button */}
        <div className="space-y-2 pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              {language === 'hi' ? 'जिला / मंडी चुनें:' : language === 'mr' ? 'जिल्हा / बाजार निवडा:' : 'Select District / Mandi:'}
            </span>

            <button
              onClick={handleUseGps}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                gpsActive 
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700 shadow-md shadow-emerald-950' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>{gpsActive ? `🛰️ GPS (${gpsCoords?.lat.toFixed(2)}, ${gpsCoords?.lng.toFixed(2)})` : (t.useGpsDistrict || '🛰️ Use GPS')}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {MANDI_LOCATIONS.map((loc) => (
              <button
                key={loc.district}
                onClick={() => {
                  setSelectedDistrict(loc.district);
                  setGpsActive(false);
                }}
                className={`min-h-[38px] px-4 py-1.5 rounded-xl font-bold transition-all shrink-0 active:scale-95 ${
                  selectedDistrict === loc.district
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {formatLocationString(loc.district, loc.state, language)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 8 Pictorial Material Rate Cards (Mandatory PS Categories) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>{language === 'hi' ? 'मंडी खरीद भाव' : language === 'mr' ? 'बाजार खरेदी दर' : 'Mandi Buy Rates'} ({formatLocationString(currentLocation.district, currentLocation.state, language)})</span>
            <span className="text-[10px] text-slate-400 font-normal">{t.heroPriceTag}</span>
          </h2>
          <span className="text-[11px] text-slate-400">{language === 'hi' ? 'कार्ड पर टैप करके कैलकुलेटर में जांचें ⬇️' : language === 'mr' ? 'कार्डवर टॅप करून कॅल्क्युलेटरमध्ये तपासा ⬇️' : 'Tap card to test in calculator ⬇️'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {prices.map((price) => {
            const catInfo = categoryLabels[price.materialCategory];
            const isUp = price.priceChange7DaysPercent > 0;
            const isDown = price.priceChange7DaysPercent < 0;
            const isSelected = selectedCategory === price.materialCategory;
            const recBid = getRecyclerOfferForCategory(price.materialCategory);

            return (
              <div
                key={price.id}
                onClick={() => setSelectedCategory(price.materialCategory)}
                className={`bg-slate-900 border-2 rounded-3xl p-5 flex flex-col justify-between shadow-xl transition-all hover:scale-[1.01] cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-emerald-950/50 bg-slate-900/90'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Category Header with Icon & Voice Button */}
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl p-2 bg-slate-950 rounded-2xl border border-slate-800 shrink-0">
                        {price.materialCategory === 'PCB' && '📟'}
                        {price.materialCategory === 'BATTERY' && '🔋'}
                        {price.materialCategory === 'CABLE' && '🔌'}
                        {price.materialCategory === 'MOTOR' && '⚙️'}
                        {price.materialCategory === 'CRT' && '📺'}
                        {price.materialCategory === 'LCD' && '🖥️'}
                        {price.materialCategory === 'MAGNET' && '🧲'}
                        {price.materialCategory === 'MIXED_PLASTIC' && '♻️'}
                      </span>
                      <div>
                        <h3 className="font-black text-base text-white leading-tight">
                          {catInfo?.[language] || price.materialCategory}
                        </h3>
                        <span className="text-[11px] text-slate-400 block line-clamp-1 mt-0.5 font-medium">
                          {price.subCategory}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakCategoryRate(price);
                      }}
                      className="p-2.5 rounded-2xl bg-slate-800 hover:bg-emerald-950/80 border border-slate-700 hover:border-emerald-600 text-emerald-300 transition-all shrink-0 active:scale-90"
                      title={t.listenPrice}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Price Box with Provenance Badge */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 my-2 shadow-inner space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold uppercase tracking-wider text-slate-400">
                        {t.prevailingRate}
                      </span>
                      {/* Strictly distinguish LIVE vs BENCHMARK vs SEED */}
                      <span className={`font-black px-2 py-0.5 rounded-full border ${
                        price.dataSource === 'LIVE'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : price.sourceType === 'ADMIN_BENCHMARK'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {price.dataSource === 'LIVE'
                          ? '🟢 LIVE OBSERVATION'
                          : price.sourceType === 'ADMIN_BENCHMARK'
                          ? '🟡 BENCHMARK'
                          : '🏷️ DEMO / BASELINE'}
                      </span>
                    </div>

                    {/* Giant Price Number */}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
                        ₹{price.prevailingBuyPrice}
                      </span>
                      <span className="text-xs font-bold text-slate-400">/ {price.unit}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex justify-between pt-1 border-t border-slate-900">
                      <span>{language === 'hi' ? 'मंडी रेंज' : language === 'mr' ? 'बाजार मर्यादा' : 'Mandi Range'}: <b className="text-slate-200 font-mono">₹{price.minPrice} – ₹{price.maxPrice}</b></span>
                      <span className="text-slate-500">📍 {formatLocationString(currentLocation.district, currentLocation.state, language)}</span>
                    </div>
                  </div>

                  {/* Recycler Live Offer Indicator (if available) */}
                  <div className="bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/80 text-[11px] mb-2.5">
                    {recBid ? (
                      <div className="flex items-center justify-between text-emerald-400 font-bold">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide">{t.recycOffer}:</span>
                        <span className="font-mono">₹{recBid.rate}/kg ({recBid.recName.slice(0, 14)}...)</span>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-[10px] flex items-center justify-between">
                        <span>{t.recycOffer}:</span>
                        <span className="italic">{t.noRecycOffer}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 7-Day Trend Badge */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400 text-[11px] font-medium">{t.trend7Days}:</span>
                  <span
                    className={`inline-flex items-center gap-1 font-black text-[11px] px-2.5 py-1 rounded-full ${
                      isUp
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : isDown
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isUp && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                    {isDown && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                    {!isUp && !isDown && <Minus className="w-3.5 h-3.5" />}
                    <span>{price.priceChange7DaysPercent > 0 ? `+${price.priceChange7DaysPercent}%` : `${price.priceChange7DaysPercent}%`}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transparent Valuation Calculator (Low-Literacy Friendly) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-2xl">
              <Calculator className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {t.calculatorTitle || (language === 'hi' ? 'पारदर्शी भाव कैलकुलेटर' : language === 'mr' ? 'पारदर्शक दर कॅल्क्युलेटर' : 'Value Estimator')}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {categoryLabels[selectedCategory]?.[language] || selectedCategory} • {t.calcSubtitle || 'वजन और स्थिति के अनुसार तत्काल अनुमानित कमाई'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isSpeaking) {
                stop();
              } else {
                speakCalculatedValue();
              }
            }}
            className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 border self-start sm:self-auto active:scale-95 transition-all ${
              isSpeaking
                ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4 animate-bounce" />
                <span>{t.voicePlaying || (language === 'hi' ? 'आवाज़ चल रही है...' : language === 'mr' ? 'आवाज सुरू आहे...' : 'Playing voice...')}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>{language === 'hi' ? 'अनुमानित कमाई सुनें' : language === 'mr' ? 'अंदाजे कमाई ऐका' : 'Listen Valuation'}</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Inputs Column */}
          <div className="space-y-4">
            {/* Weight Input + Steppers */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                {t.enterWeight || (language === 'hi' ? 'वजन (किलो / KG):' : language === 'mr' ? 'वजन (किलो / KG):' : 'Weight (KG):')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-2 bg-slate-950 border-2 border-emerald-600/60 rounded-2xl text-white font-mono font-black text-2xl focus:outline-none focus:border-emerald-400"
                />
                <span className="px-4 py-3 bg-slate-800 text-slate-200 font-bold rounded-2xl text-sm border border-slate-700">
                  KG
                </span>
              </div>

              {/* Quick Increment Touch Steppers */}
              <div className="grid grid-cols-5 gap-2 mt-2">
                {[1, 5, 10, 25].map(step => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(calcWeight) || 0;
                      setCalcWeight((cur + step).toString());
                    }}
                    className="min-h-[40px] py-1.5 bg-slate-950 hover:bg-slate-800 active:scale-95 text-emerald-400 font-bold text-xs rounded-xl border border-slate-800"
                  >
                    +{step} kg
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCalcWeight('5')}
                  className="min-h-[40px] py-1.5 bg-slate-950 hover:bg-slate-800 active:scale-95 text-slate-400 font-bold text-xs rounded-xl border border-slate-800"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Condition Selection Cards */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                {t.selectCondition || (language === 'hi' ? 'सामान की स्थिति:' : language === 'mr' ? 'मालाची स्थिती:' : 'Condition:')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'INTACT', label: t.intact, factor: '100%' },
                  { id: 'DAMAGED', label: t.damaged, factor: '85%' },
                  { id: 'DISMANTLED', label: t.dismantled, factor: '75%' }
                ].map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCalcCondition(c.id as any)}
                    className={`min-h-[44px] p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center transition-all active:scale-95 ${
                      calcCondition === c.id
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-600 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{c.label}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">{c.factor}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Value Calculation Output Box */}
          <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4 shadow-inner">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider">
                  {t.estEarnings || (language === 'hi' ? 'अनुमानित कमाई' : language === 'mr' ? 'अंदाजे कमाई' : 'Estimated Range')}
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800 font-bold">
                  {selectedDistrict} {language === 'hi' ? 'मंडी दर आधार' : language === 'mr' ? 'बाजार दर आधार' : 'Mandi Baseline'}
                </span>
              </div>

              {/* Giant Valuation Amount */}
              <div className="mt-2 text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
                ₹{valBreakdown?.estimatedValue?.min || 0} – ₹{valBreakdown?.estimatedValue?.max || 0}
              </div>

              {/* Formula breakdown */}
              <div className="mt-3 p-3 bg-slate-900 rounded-2xl border border-slate-800/80 space-y-1 text-xs">
                <span className="text-[10px] text-slate-500 uppercase tracking-wide block font-bold">
                  {t.estFormula || (language === 'hi' ? 'पारदर्शी गणना सूत्र' : language === 'mr' ? 'पारदर्शक सूत्र' : 'Formula Breakdown')}:
                </span>
                <p className="font-mono text-slate-300 text-xs">
                  {calcWeight} kg × ₹{selectedPriceRecord?.prevailingBuyPrice || 0}/kg × {calcCondition === 'INTACT' ? '1.0' : calcCondition === 'DAMAGED' ? '0.85' : '0.75'}
                </p>
              </div>
            </div>

            {/* Prominent Low-Literacy Disclaimer */}
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-2xl flex items-start gap-2.5 text-xs text-amber-300/90 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                {t.estDisclaimer || (language === 'hi'
                  ? 'यह केवल प्रारंभिक अनुमानित मूल्य है, अंतिम बिक्री कीमत नहीं। अंतिम भुगतान अधिकृत रीसाइक्लर के डिजिटल कांटे पर वास्तविक वजन के बाद होगा।'
                  : language === 'mr'
                  ? 'हा केवळ प्राथमिक अंदाज आहे, अंतिम विक्री किंमत नाही. प्रत्यक्ष वजन तपासणीनंतर अधिकृत पावतीद्वारे अंतिम रक्कम दिली जाईल.'
                  : 'This is an estimate only, not a guaranteed final sale price. Final payout is settled after verified digital scale weighment.')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Distinction of Three Price Concepts (PS Requirement) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Info className="w-5 h-5 text-emerald-400" />
          <h3 className="font-black text-white text-sm sm:text-base">
            {t.threePriceStagesTitle || (language === 'hi' ? 'भाव के 3 स्पष्ट चरण समझें' : language === 'mr' ? 'दरांचे ३ टप्पे समजून घ्या' : 'Three Price Stages')}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Stage A */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-300">
                {t.stageEstTitle || (language === 'hi' ? '1. अनुमानित मूल्य' : language === 'mr' ? '1. अंदाजे मूल्य' : '1. Estimated')}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{language === 'hi' ? 'प्रारंभिक' : language === 'mr' ? 'प्रारंभिक' : 'Estimated'}</span>
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono">
              ₹{valBreakdown?.estimatedValue?.min || 0} – ₹{valBreakdown?.estimatedValue?.max || 0}
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {t.stageEstDesc || 'लॉट बनाते समय मंडी दर और वजन पर आधारित प्रारंभिक अनुमान।'}
            </p>
          </div>

          {/* Stage B */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-300">
                {t.stageQuoteTitle || (language === 'hi' ? '2. खरीदार की बोली' : language === 'mr' ? '2. खरेदीदाराची बोली' : '2. Quoted')}
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800">
                {language === 'hi' ? 'औपचारिक ऑफर' : language === 'mr' ? 'अधिकृत ऑफर' : 'Formal Bid'}
              </span>
            </div>
            <div className="text-xl font-black text-amber-400 font-mono">
              {valBreakdown?.recyclerQuotedPrice 
                ? `₹${valBreakdown.recyclerQuotedPrice.totalQuotedAmount} (₹${valBreakdown.recyclerQuotedPrice.offeredRatePerKg}/kg)` 
                : (language === 'hi' ? 'अभी कोई बोली नहीं' : language === 'mr' ? 'सध्या कोणतीही बोली नाही' : 'No quote yet')}
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {valBreakdown?.recyclerQuotedPrice 
                ? `${valBreakdown.recyclerQuotedPrice.recyclerName} द्वारा दी गई बोली`
                : (t.stageQuoteDesc || 'अधिकृत रीसाइक्लर द्वारा आपके सामान के लिए दिया गया औपचारिक ऑफर।')}
            </p>
          </div>

          {/* Stage C */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-300">
                {t.stageFinalTitle || (language === 'hi' ? '3. अंतिम बिक्री मूल्य' : language === 'mr' ? '3. अंतिम विक्री मूल्य' : '3. Final Sale')}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{language === 'hi' ? 'कांटे पर तौल' : language === 'mr' ? 'काट्यावर वजन' : 'Scale Weight'}</span>
            </div>
            <div className="text-xl font-black text-teal-400 font-mono">
              {valBreakdown?.finalSaleBenchmark
                ? `₹${valBreakdown.finalSaleBenchmark.settledAmount} (${language === 'hi' ? 'सत्यापित' : language === 'mr' ? 'सत्यापित' : 'Settled'})`
                : (language === 'hi' ? 'हैंडओवर तौल के बाद' : language === 'mr' ? 'हँडओव्हर वजनानंतर' : 'After Scale Handover')}
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {t.stageFinalDesc || 'भौतिक कांटे पर वजन जांचने के बाद सीधे खाते/कैश में मिलने वाली रसीद राशि।'}
            </p>
          </div>
        </div>
      </div>

      {/* Historical Real Price Trend Inspector (100% Genuine Stored Logs) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">
                {language === 'hi' ? 'ऐतिहासिक भाव विश्लेषण' : language === 'mr' ? 'ऐतिहासिक दर विश्लेषण' : 'Historical Price Analysis'} ({categoryLabels[selectedCategory]?.[language] || selectedCategory})
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                historyData?.hasSufficientData
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {historyData?.hasSufficientData ? (language === 'hi' ? '🟢 100% वास्तविक मंडी लॉग' : language === 'mr' ? '🟢 १००% प्रत्यक्ष बाजार नोंदी' : '🟢 100% Mandi Logs') : (language === 'hi' ? 'डेटा प्रतीक्षारत' : language === 'mr' ? 'डेटा प्रतीक्षेत' : 'Pending Data')}
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">
              {categoryLabels[selectedCategory]?.[language] || selectedCategory} • {selectedDistrict} {language === 'hi' ? 'मंडी' : language === 'mr' ? 'बाजार' : 'Mandi'}
            </h3>
          </div>

          {historyData?.observedTrend && historyData.observedTrend !== 'INSUFFICIENT_DATA' && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-2xl border border-slate-800 text-xs">
              <span className="text-slate-400 text-[11px]">{language === 'hi' ? 'देखा गया रुझान:' : language === 'mr' ? 'नोंदवलेला कल:' : 'Observed Trend:'}</span>
              <span className={`font-black flex items-center gap-1 ${
                historyData.observedTrend === 'UP' ? 'text-emerald-400' : historyData.observedTrend === 'DOWN' ? 'text-red-400' : 'text-slate-300'
              }`}>
                {historyData.observedTrend === 'UP' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                {historyData.observedTrend === 'DOWN' && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                {!['UP', 'DOWN'].includes(historyData.observedTrend) && <Minus className="w-3.5 h-3.5" />}
                <span>{historyData.trendPercent > 0 ? `+${historyData.trendPercent}%` : `${historyData.trendPercent}%`}</span>
              </span>
            </div>
          )}
        </div>

        {/* Clean Visual Bar Trend from Genuine Stored Records */}
        {historyData?.hasSufficientData && historyData.history.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">{language === 'hi' ? 'समयरेखा के अनुसार वास्तविक भाव लॉग (₹/kg):' : language === 'mr' ? 'काळानुसार प्रत्यक्ष दर नोंदी (₹/kg):' : 'Observed Price Log Timeline (₹/kg):'}</p>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-2">
              {historyData.history.slice(-12).map((point: any, idx: number) => {
                const maxPrice = Math.max(...historyData.history.map((h: any) => h.price), 100);
                const heightPercent = Math.min(Math.max((point.price / maxPrice) * 100, 25), 100);
                return (
                  <div key={idx} className="flex flex-col items-center gap-1 group">
                    <span className="text-[10px] font-bold text-slate-300 font-mono">₹{point.price}</span>
                    <div className="w-full bg-slate-950 rounded-xl h-24 flex items-end p-1 border border-slate-800">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-lg group-hover:from-emerald-400 group-hover:to-teal-300 transition-all"
                      ></div>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono truncate w-full text-center">
                      {point.date ? point.date.slice(5) : `W${idx+1}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Honest Empty State: ZERO mathematical sine wave synthesis */
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-2">
            <Info className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">
              {t.noHistory || (language === 'hi' ? 'अभी पर्याप्त भाव डेटा उपलब्ध नहीं है' : language === 'mr' ? 'अद्याप पुरेसा दर इतिहास उपलब्ध नाही' : 'Not enough price history yet')}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {t.noHistoryDesc || 'जैसे-जैसे इस जिले में नई मंडियों के वास्तविक भाव दर्ज होंगे, ऐतिहासिक ट्रेंड यहाँ दिखाई देगा। हम कोई नकली या कृत्रिम ग्राफ़ नहीं बनाते।'}
            </p>
          </div>
        )}
      </div>

      {/* Record Live Price Modal (Admin/Authorized Mandi Audit) */}
      {showAddPriceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-white">{language === 'hi' ? 'नया वास्तविक भाव दर्ज करें' : language === 'mr' ? 'नवीन प्रत्यक्ष दर नोंदवा' : 'Record Live Rate'}</h3>
              <button onClick={() => setShowAddPriceModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePriceObservation} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">{language === 'hi' ? 'सामग्री श्रेणी:' : language === 'mr' ? 'सामग्री श्रेणी:' : 'Material Category:'}</label>
                <select
                  value={inputCategory}
                  onChange={(e) => setInputCategory(e.target.value as MaterialCategory)}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                >
                  {(['PCB', 'BATTERY', 'CABLE', 'MOTOR', 'CRT', 'LCD', 'MAGNET', 'MIXED_PLASTIC'] as MaterialCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryLabel(cat, language)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">{language === 'hi' ? 'दर (₹/किग्रा):' : language === 'mr' ? 'दर (₹/किग्रा):' : 'Rate (₹/kg):'}</label>
                <input
                  type="number"
                  step="0.5"
                  value={inputRate}
                  onChange={(e) => setInputRate(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold text-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">{language === 'hi' ? 'सूचना स्रोत:' : language === 'mr' ? 'माहिती स्रोत:' : 'Source Description:'}</label>
                <input
                  type="text"
                  value={inputSource}
                  onChange={(e) => setInputSource(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  required
                />
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                जिला: <b className="text-white">{selectedDistrict}</b> • सत्यापन: <b className="text-emerald-400">±40% बेंचमार्क गार्ड सक्रिय</b>
              </div>

              <button
                type="submit"
                disabled={submittingPrice}
                className="w-full min-h-[48px] py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow active:scale-95"
              >
                {submittingPrice ? (language === 'hi' ? 'दर्ज हो रहा...' : language === 'mr' ? 'नोंद होत आहे...' : 'Submitting...') : (language === 'hi' ? 'लाइव भाव सबमिट करें' : language === 'mr' ? 'थेट दर सबमिट करा' : 'Submit Real Rate')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
