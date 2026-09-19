import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  Cpu, 
  Award, 
  Building2, 
  CheckCircle2, 
  ToggleLeft, 
  ToggleRight, 
  Info, 
  ArrowRight, 
  Coins, 
  Layers, 
  ExternalLink,
  Flame
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { getEprMarketplaceFeatureState, setEprMarketplaceFeatureState } from '../../config/features';
import { calculateCriticalMineralYield, MineralYieldResult } from '../../utils/criticalMineralCalculator';
import { getCategoryLabel, formatUserDisplayName } from '../../i18n/translations';

interface EprTraceabilityMarketplaceProps {
  lotCategory?: string;
  lotWeightKg?: number;
  primaryPayoutAmount?: number;
  collectorName?: string;
  recyclerName?: string;
  compact?: boolean;
}

export const EprTraceabilityMarketplace: React.FC<EprTraceabilityMarketplaceProps> = ({
  lotCategory = 'PCB',
  lotWeightKg = 50,
  primaryPayoutAmount = 1250,
  collectorName = 'Ramesh Kumar (CPCB Verified)',
  recyclerName = 'EcoRecycle India Pvt Ltd',
  compact = false
}) => {
  const { language } = useLanguage();
  const { showToast } = useToast();

  const [isEnabled, setIsEnabled] = useState<boolean>(getEprMarketplaceFeatureState());
  const [activeTab, setActiveTab] = useState<'MINERALS' | 'PROVENANCE' | 'B2B_DEMO'>('MINERALS');

  // Simulated OEM Corporate Buyers
  const [oemBuyers, setOemBuyers] = useState([
    { id: 'oem_1', name: 'Samsung India Electronics', logo: '📱', creditsRequested: 1500, pricePerCredit: 350, status: 'MATCHED' },
    { id: 'oem_2', name: 'boAt Lifestyle (Imagine Marketing)', logo: '🎧', creditsRequested: 850, pricePerCredit: 320, status: 'AVAILABLE' },
    { id: 'oem_3', name: 'Dell Technologies India', logo: '💻', creditsRequested: 2400, pricePerCredit: 380, status: 'AVAILABLE' }
  ]);

  const [purchasedOemId, setPurchasedOemId] = useState<string | null>(null);

  // Sync state when global feature toggle changes
  useEffect(() => {
    const handleToggleChanged = () => {
      setIsEnabled(getEprMarketplaceFeatureState());
    };
    window.addEventListener('epr_feature_toggle_changed', handleToggleChanged);
    return () => window.removeEventListener('epr_feature_toggle_changed', handleToggleChanged);
  }, []);

  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    setEprMarketplaceFeatureState(newState);

    showToast(
      newState
        ? (language === 'hi' ? '✅ CPCB EPR ट्रैसेबिलिटी प्रोटोकॉल एक्टिव हुआ!' : '✅ EPR Traceability Protocol Activated!')
        : (language === 'hi' ? '📴 EPR मार्केटप्लेस फ़ीचर डिसएबल हुआ (नॉर्मल ऐप)' : '📴 EPR Marketplace Disabled (Normal App)'),
      newState ? 'success' : 'info'
    );
  };

  const yieldData: MineralYieldResult = calculateCriticalMineralYield(lotCategory, lotWeightKg);

  const handleSimulateOemPurchase = (oemId: string, oemName: string, amount: number) => {
    setPurchasedOemId(oemId);
    showToast(
      language === 'hi'
        ? `🎁 सिमुलेशन: ${oemName} ने CPCB क्रेडिट खरीदा! +₹${amount} सेकंडरी बोनस कबाड़ीवाले के खाते में जमा!`
        : `🎁 Simulation: ${oemName} purchased provenance credit! +₹${amount} Secondary Royalty Bonus routed to Collector!`,
      'success'
    );
  };

  if (!isEnabled) {
    return (
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
          <span className="font-mono font-bold">EPR Traceability Protocol Feature: <b>OFF 📴</b></span>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black flex items-center gap-1 active:scale-95 transition-all shadow-xs"
        >
          <ToggleRight className="w-3.5 h-3.5" />
          <span>Enable Prototype Demo (ON ✅)</span>
        </button>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-950 text-white rounded-2xl p-4 border-2 border-emerald-500/50 shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-emerald-800/60 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black text-white">EPR Material Provenance & Mineral Yield</span>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            className="text-[10px] text-emerald-300 hover:text-white font-mono flex items-center gap-1 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700"
            title="Toggle Feature ON/OFF"
          >
            <span>ON ✅</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
          <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[9px]">⚡ Electrolytic Cu:</span>
            <span className="font-black text-amber-400">{yieldData.copperKg} kg</span>
          </div>
          <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[9px]">🟡 24K Gold (Au):</span>
            <span className="font-black text-yellow-300">{yieldData.goldGrams} g</span>
          </div>
          <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[9px]">⚪ Fine Silver (Ag):</span>
            <span className="font-black text-slate-200">{yieldData.silverGrams} g</span>
          </div>
          <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[9px]">🔋 Cobalt/Lithium:</span>
            <span className="font-black text-teal-300">{yieldData.cobaltLithiumKg} kg</span>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono pt-1 text-emerald-300 border-t border-slate-800">
          <span>Token: <b>{yieldData.traceabilityHash}</b></span>
          <span className="text-amber-300 font-bold">Proposed Secondary Bonus: +₹{yieldData.estimatedEprCreditValue}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-white border-2 border-emerald-500/60 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Background Neon Glow */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Feature Toggle Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-2xl shadow-lg border border-emerald-400 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white">
                {language === 'hi'
                  ? 'EPR मैटेरियल ट्रैसेबिलिटी एवं ग्रीन डिविडेंड प्रोटोकॉल'
                  : 'EPR Material Traceability & Green Dividend Protocol'}
              </h3>
              <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                PROPOSED CPCB FRAMEWORK — PROTOTYPE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {language === 'hi'
                ? 'CPCB नियम 19 मैटेरियल ट्रैसेबिलिटी ऑैडिट एवं दुर्लभ खनिज (Critical Minerals) रिकवरी यील्ड मॉडल।'
                : 'CPCB Rule 19 E-Waste Material Provenance & Critical Mineral Mass Balance Estimator.'}
            </p>
          </div>
        </div>

        {/* Feature Toggle Switch ON / OFF */}
        <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 self-start sm:self-center">
          <span className="text-[11px] font-mono font-bold text-slate-300">Feature Status:</span>
          <button
            type="button"
            onClick={handleToggle}
            className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow ${
              isEnabled 
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {isEnabled ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>ON ✅</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-slate-400" />
                <span>OFF 📴</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary Settlement vs Secondary Proposed Dividend Card */}
      <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-emerald-500/40 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <span className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>{language === 'hi' ? 'द्विस्तरीय भुगतान संरचना (Two-Tier Settlement Architecture)' : 'Two-Tier Payment Settlement Architecture'}</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {language === 'hi' ? 'Collector:' : language === 'mr' ? 'संकलक:' : 'Collector:'} <b className="text-white">{formatUserDisplayName(collectorName, 'COLLECTOR', language)}</b>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Tier 1: Primary Guaranteed Settlement */}
          <div className="p-3.5 bg-emerald-950/60 rounded-xl border border-emerald-500/40 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'hi' ? '1. प्राथमिक गारंटीकृत भुगतान' : language === 'mr' ? '1. प्राथमिक हमी दिलेले पेमेंट' : '1. Primary Guaranteed Settlement'}</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[9px] font-black uppercase">
                {language === 'hi' ? 'तत्काल नकद/UPI' : language === 'mr' ? 'झटपट रोख/UPI' : 'INSTANT CASH/UPI'}
              </span>
            </div>
            <div className="text-2xl font-black text-white font-mono pt-1">
              ₹{primaryPayoutAmount.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-emerald-200/80">
              {language === 'hi'
                ? `डिलीवरी पर रीसाइक्लर (${formatUserDisplayName(recyclerName, 'RECYCLER', language)}) द्वारा प्रत्यक्ष वजन पैमाने का भुगतान।`
                : language === 'mr'
                ? `डिलीव्हरीच्या वेळी रिसायकलर (${formatUserDisplayName(recyclerName, 'RECYCLER', language)}) द्वारे थेट तोल मूल्य भरले जाते.`
                : `Direct physical scale weighment value paid by Recycler (${recyclerName}) at delivery.`}
            </p>
          </div>

          {/* Tier 2: Secondary Proposed EPR Royalty Bonus */}
          <div className="p-3.5 bg-amber-950/40 rounded-xl border border-amber-500/40 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'hi' ? '2. द्वितीयक प्रस्तावित ईपीआर रॉयल्टी' : language === 'mr' ? '2. द्वितीयक प्रस्तावित EPR रॉयल्टी' : '2. Secondary Proposed EPR Royalty'}</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[9px] font-mono font-bold">
                {language === 'hi' ? 'प्रस्तावित बोनस' : language === 'mr' ? 'प्रस्तावित बोनस' : 'PROPOSED BONUS'}
              </span>
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono pt-1 flex items-center gap-2">
              <span>+₹{yieldData.estimatedEprCreditValue}</span>
              {purchasedOemId && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                  {language === 'hi' ? 'सत्यापित ✓' : language === 'mr' ? 'जुळले ✓' : 'MATCHED ✓'}
                </span>
              )}
            </div>
            <p className="text-[10px] text-amber-200/80">
              {language === 'hi'
                ? 'कॉर्पोरेट ब्रांड्स द्वारा सामग्री साक्ष्य क्रेडिट खरीदने पर द्वितीयक बोनस भुगतान।'
                : language === 'mr'
                ? 'कॉर्पोरेट ब्रँडद्वारे मटेरियल क्रेडिट्स खरेदी केल्यावर द्वितीयक बोनस लागू.'
                : 'Optional secondary bonus routed when corporate brands purchase material provenance credits.'}
            </p>
          </div>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('MINERALS')}
          className={`px-3.5 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 ${
            activeTab === 'MINERALS'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>
            {language === 'hi'
              ? `दुर्लभ खनिज निष्कर्षण (${lotWeightKg} किग्रा ${getCategoryLabel(lotCategory, language)})`
              : language === 'mr'
              ? `दुर्लभ खनिज निष्कर्षण (${lotWeightKg} किग्रॅ ${getCategoryLabel(lotCategory, language)})`
              : `Critical Mineral Yield (${lotWeightKg} kg ${lotCategory})`}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PROVENANCE')}
          className={`px-3.5 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 ${
            activeTab === 'PROVENANCE'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>{language === 'hi' ? 'CPCB नियम 19 साक्ष्य पास' : language === 'mr' ? 'CPCB नियम १९ पुरावा पास' : 'CPCB Rule 19 Provenance Pass'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('B2B_DEMO')}
          className={`px-3.5 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 ${
            activeTab === 'B2B_DEMO'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-blue-400" />
          <span>{language === 'hi' ? 'कॉर्पोरेट B2B हब' : language === 'mr' ? 'कॉर्पोरेट B2B हब' : 'Simulated Corporate B2B Hub'}</span>
        </button>
      </div>

      {/* Tab 1: Critical Mineral Recovery Yield */}
      {activeTab === 'MINERALS' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block font-bold">
                ⚡ {language === 'hi' ? 'इलेक्ट्रिकल तांबा (Cu)' : language === 'mr' ? 'इलेक्ट्रोलाइटिक तांबे (Cu)' : 'Electrolytic Copper (Cu)'}
              </span>
              <p className="text-xl font-black text-amber-400">
                {yieldData.copperKg} <span className="text-xs text-slate-400">{language === 'hi' ? 'किग्रा' : language === 'mr' ? 'किग्रॅ' : 'kg'}</span>
              </p>
              <span className="text-[9px] text-slate-500 block">{language === 'hi' ? 'उच्च शुद्धता ग्रेड' : language === 'mr' ? 'उच्च शुद्धता ग्रेड' : 'High Purity Grade'}</span>
            </div>

            <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block font-bold">
                🟡 {language === 'hi' ? '24K शुद्ध सोना (Au)' : language === 'mr' ? '24K शुद्ध सोने (Au)' : '24K Gold Yield (Au)'}
              </span>
              <p className="text-xl font-black text-yellow-300">
                {yieldData.goldGrams} <span className="text-xs text-slate-400">{language === 'hi' || language === 'mr' ? 'ग्राम' : 'grams'}</span>
              </p>
              <span className="text-[9px] text-slate-500 block">{language === 'hi' ? 'पीसीबी पिन सोना' : language === 'mr' ? 'पीसीबी पिन सोने' : 'PCB Contact Pin Gold'}</span>
            </div>

            <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block font-bold">
                ⚪ {language === 'hi' ? 'शुद्ध चांदी (Ag)' : language === 'mr' ? 'शुद्ध चांदी (Ag)' : 'Fine Silver Yield (Ag)'}
              </span>
              <p className="text-xl font-black text-slate-200">
                {yieldData.silverGrams} <span className="text-xs text-slate-400">{language === 'hi' || language === 'mr' ? 'ग्राम' : 'grams'}</span>
              </p>
              <span className="text-[9px] text-slate-500 block">{language === 'hi' ? 'सोल्डर मिश्र धातु रिकवरी' : language === 'mr' ? 'सोल्डर मिश्र धातू रिकव्हरी' : 'Solder Alloy Recovery'}</span>
            </div>

            <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block font-bold">
                🔋 {language === 'hi' ? 'कोबाल्ट व लिथियम (Co/Li)' : language === 'mr' ? 'कोबाल्ट व लिथियम (Co/Li)' : 'Cobalt & Lithium (Co/Li)'}
              </span>
              <p className="text-xl font-black text-teal-300">
                {yieldData.cobaltLithiumKg} <span className="text-xs text-slate-400">{language === 'hi' ? 'किग्रा' : language === 'mr' ? 'किग्रॅ' : 'kg'}</span>
              </p>
              <span className="text-[9px] text-slate-500 block">{language === 'hi' ? 'बैटरी कैथोड धातु' : language === 'mr' ? 'बॅटरी कॅथोड धातू' : 'Battery Cathode Metal'}</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-emerald-400" />
              <span>
                {language === 'hi' 
                  ? <>कार्बन व भारी धातु सुरक्षा: <b>{yieldData.co2DivertedKg} kg CO₂e</b> बचाव | <b>{yieldData.leadPreventedKg} kg सीसा (Lead)</b> बचाव</>
                  : language === 'mr'
                  ? <>कार्बन व जड धातू संरक्षण: <b>{yieldData.co2DivertedKg} kg CO₂e</b> बचाव | <b>{yieldData.leadPreventedKg} kg शिसे (Lead)</b> बचाव</>
                  : <>Carbon & Heavy Metal Protection: <b>{yieldData.co2DivertedKg} kg CO₂e</b> diverted | <b>{yieldData.leadPreventedKg} kg Lead</b> prevented</>}
              </span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-1 rounded border border-emerald-800 font-bold">
              {language === 'hi' ? 'USGS धातु विज्ञान मानक' : language === 'mr' ? 'USGS धातूशास्त्र मानके' : 'USGS metallurgical standards'}
            </span>
          </div>
        </div>
      )}

      {/* Tab 2: CPCB Rule 19 Digital Provenance Pass */}
      {activeTab === 'PROVENANCE' && (
        <div className="space-y-3 animate-fadeIn text-xs">
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 font-mono">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-emerald-400 font-bold">Rule 19 Certificate Token</span>
              <span className="text-white font-black">{yieldData.traceabilityHash}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span className="text-slate-500">First-Mile Collector:</span> <span className="text-white block font-bold">{collectorName}</span></div>
              <div><span className="text-slate-500">Authorized Recycler:</span> <span className="text-white block font-bold">{recyclerName}</span></div>
              <div><span className="text-slate-500">Mass Balance Verified:</span> <span className="text-emerald-400 block font-bold">{lotWeightKg} kg {lotCategory}</span></div>
              <div><span className="text-slate-500">CPCB Framework Status:</span> <span className="text-amber-300 block font-bold">PROPOSED PROTOTYPE DEMO</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Simulated Corporate B2B Buyer Hub */}
      {activeTab === 'B2B_DEMO' && (
        <div className="space-y-3 animate-fadeIn text-xs">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
            <span>Corporate B2B Simulated Marketplace (Demo for SIH Judges)</span>
            <span className="text-amber-300 font-bold">Proposed Framework</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {oemBuyers.map((oem) => (
              <div
                key={oem.id}
                className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                  purchasedOemId === oem.id
                    ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/40'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{oem.logo}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    purchasedOemId === oem.id
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {purchasedOemId === oem.id ? 'CREDIT MATCHED ✓' : `Rate: ₹${oem.pricePerCredit}`}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-white text-xs">{oem.name}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">EPR Target: {oem.creditsRequested} Tonnes</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSimulateOemPurchase(oem.id, oem.name, oem.pricePerCredit)}
                  className={`w-full py-2 rounded-xl font-black text-[11px] flex items-center justify-center gap-1 transition-all active:scale-95 ${
                    purchasedOemId === oem.id
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>{purchasedOemId === oem.id ? 'Credit Purchased ✓' : 'Simulate OEM Purchase'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
