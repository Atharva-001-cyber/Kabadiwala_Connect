import React, { useState } from 'react';
import { 
  Sparkles, 
  Leaf, 
  TreeDeciduous, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  Flame, 
  Info,
  ChevronDown,
  ChevronUp,
  Award
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { MaterialCategory } from '../../types';
import { getCategoryLabel } from '../../i18n/translations';

interface StrategicMineral {
  name: { en: string; hi: string; mr: string };
  symbol: string;
  badgeColor: string;
  borderColor: string;
  yieldPerKg: number; // in grams or kg
  unit: 'g' | 'kg';
  approxRatePerUnit: number; // INR
  isPrecious?: boolean;
}

interface EwasteYieldProfile {
  minerals: StrategicMineral[];
  hazardousNeutralizedKgPerKg: number;
  hazardousName: { en: string; hi: string; mr: string };
  co2SavedKgPerKg: number;
}

const RECOVERY_BENCHMARKS: Record<MaterialCategory, EwasteYieldProfile> = {
  PCB: {
    minerals: [
      {
        name: { en: 'Pure Gold (Au)', hi: 'शुद्ध सोना (Au)', mr: 'शुद्ध सोने (Au)' },
        symbol: 'Au',
        badgeColor: 'bg-amber-400 text-slate-950',
        borderColor: 'border-amber-400/60',
        yieldPerKg: 0.024,
        unit: 'g',
        approxRatePerUnit: 7200,
        isPrecious: true
      },
      {
        name: { en: 'Fine Silver (Ag)', hi: 'शुद्ध चांदी (Ag)', mr: 'चांदी (Ag)' },
        symbol: 'Ag',
        badgeColor: 'bg-slate-200 text-slate-950',
        borderColor: 'border-slate-300/60',
        yieldPerKg: 0.18,
        unit: 'g',
        approxRatePerUnit: 85,
        isPrecious: true
      },
      {
        name: { en: 'Electrolytic Copper', hi: 'इलेक्ट्रिकल तांबा (Cu)', mr: 'तांबे (Cu)' },
        symbol: 'Cu',
        badgeColor: 'bg-orange-500 text-white',
        borderColor: 'border-orange-500/60',
        yieldPerKg: 0.14,
        unit: 'kg',
        approxRatePerUnit: 780
      },
      {
        name: { en: 'Palladium (Pd)', hi: 'पैलेडियम (Pd)', mr: 'पॅलेडियम (Pd)' },
        symbol: 'Pd',
        badgeColor: 'bg-purple-400 text-slate-950',
        borderColor: 'border-purple-400/60',
        yieldPerKg: 0.005,
        unit: 'g',
        approxRatePerUnit: 3400,
        isPrecious: true
      }
    ],
    hazardousNeutralizedKgPerKg: 0.075,
    hazardousName: { 
      en: 'Lead solder & Brominated Flame Retardants (BFR)', 
      hi: 'सीसा (लेड) व ब्रोमिनेटेड ज्वालामंदक रसायन', 
      mr: 'लेड व विषारी रसायने' 
    },
    co2SavedKgPerKg: 2.4
  },
  BATTERY: {
    minerals: [
      {
        name: { en: 'Battery Grade Lithium', hi: 'लिथियम (Li)', mr: 'लिथियम (Li)' },
        symbol: 'Li',
        badgeColor: 'bg-cyan-400 text-slate-950',
        borderColor: 'border-cyan-400/60',
        yieldPerKg: 0.035,
        unit: 'kg',
        approxRatePerUnit: 1800
      },
      {
        name: { en: 'Cobalt Cathode Active', hi: 'कोबाल्ट (Co)', mr: 'कोबाल्ट (Co)' },
        symbol: 'Co',
        badgeColor: 'bg-blue-500 text-white',
        borderColor: 'border-blue-500/60',
        yieldPerKg: 0.085,
        unit: 'kg',
        approxRatePerUnit: 2400
      },
      {
        name: { en: 'Refined Nickel', hi: 'शुद्ध निकेल (Ni)', mr: 'निकेल (Ni)' },
        symbol: 'Ni',
        badgeColor: 'bg-emerald-400 text-slate-950',
        borderColor: 'border-emerald-400/60',
        yieldPerKg: 0.05,
        unit: 'kg',
        approxRatePerUnit: 1400
      },
      {
        name: { en: 'Anode Copper Foil', hi: 'एनोड कॉपर फॉइल', mr: 'एनोड तांबे' },
        symbol: 'Cu',
        badgeColor: 'bg-orange-500 text-white',
        borderColor: 'border-orange-500/60',
        yieldPerKg: 0.07,
        unit: 'kg',
        approxRatePerUnit: 780
      }
    ],
    hazardousNeutralizedKgPerKg: 0.32,
    hazardousName: { 
      en: 'Corrosive Lithium Salts & Heavy Electrolytes', 
      hi: 'ज्वलनशील लिथियम लवण व विषैला इलेक्ट्रोलाइट', 
      mr: 'ज्वलनशील लिथियम क्षार व आम्ल' 
    },
    co2SavedKgPerKg: 3.2
  },
  CABLE: {
    minerals: [
      {
        name: { en: 'High-Conductivity Copper', hi: 'उच्च चालकता तांबा', mr: 'विद्युत तांबे' },
        symbol: 'Cu',
        badgeColor: 'bg-orange-500 text-white',
        borderColor: 'border-orange-500/60',
        yieldPerKg: 0.58,
        unit: 'kg',
        approxRatePerUnit: 780
      },
      {
        name: { en: 'Electrical Aluminium', hi: 'इलेक्ट्रिकल एल्युमिनियम', mr: 'अ‍ॅल्युमिनियम' },
        symbol: 'Al',
        badgeColor: 'bg-slate-300 text-slate-950',
        borderColor: 'border-slate-400/60',
        yieldPerKg: 0.12,
        unit: 'kg',
        approxRatePerUnit: 210
      },
      {
        name: { en: 'Virgin Polymer Resin', hi: 'रीसायकल पॉलीमर दाना', mr: 'पॉलिमर दाणे' },
        symbol: 'PVC',
        badgeColor: 'bg-teal-400 text-slate-950',
        borderColor: 'border-teal-400/60',
        yieldPerKg: 0.28,
        unit: 'kg',
        approxRatePerUnit: 45
      }
    ],
    hazardousNeutralizedKgPerKg: 0.03,
    hazardousName: { 
      en: 'Dioxin-forming PVC Plasticizers', 
      hi: 'डायऑक्सिन बनाने वाले प्लास्टिक प्लास्टिसाइज़र', 
      mr: 'डायऑक्सिन निर्माण करणारे प्लास्टिक' 
    },
    co2SavedKgPerKg: 2.8
  },
  MOTOR: {
    minerals: [
      {
        name: { en: 'Winding Copper Wire', hi: 'वाइंडिंग तांबे का तार', mr: 'वाइंडिंग तांब्याची तार' },
        symbol: 'Cu',
        badgeColor: 'bg-orange-500 text-white',
        borderColor: 'border-orange-500/60',
        yieldPerKg: 0.19,
        unit: 'kg',
        approxRatePerUnit: 780
      },
      {
        name: { en: 'Silicon Electrical Steel', hi: 'सिलिकॉन स्टील कोर', mr: 'सिलिकॉन स्टील' },
        symbol: 'Fe-Si',
        badgeColor: 'bg-indigo-400 text-slate-950',
        borderColor: 'border-indigo-400/60',
        yieldPerKg: 0.65,
        unit: 'kg',
        approxRatePerUnit: 42
      },
      {
        name: { en: 'Neodymium Rare Earth', hi: 'नियोडिमियम दुर्लभ खनिज', mr: 'नियोडिमियम दुर्मिळ खनिज' },
        symbol: 'Nd',
        badgeColor: 'bg-fuchsia-400 text-slate-950',
        borderColor: 'border-fuchsia-400/60',
        yieldPerKg: 0.012,
        unit: 'kg',
        approxRatePerUnit: 3500
      }
    ],
    hazardousNeutralizedKgPerKg: 0.04,
    hazardousName: { 
      en: 'Insulating Varnish & Waste Grease', 
      hi: 'इंसुलेटिंग वार्निश व पुराना ग्रीस', 
      mr: 'इन्सुलेटिंग वार्निश व जुने वंगण' 
    },
    co2SavedKgPerKg: 2.1
  },
  MAGNET: {
    minerals: [
      {
        name: { en: 'Neodymium (NdFeB)', hi: 'नियोडिमियम चुंबक धातु', mr: 'नियोडिमियम धातू' },
        symbol: 'Nd',
        badgeColor: 'bg-fuchsia-400 text-slate-950',
        borderColor: 'border-fuchsia-400/60',
        yieldPerKg: 0.32,
        unit: 'kg',
        approxRatePerUnit: 4200
      },
      {
        name: { en: 'Dysprosium Additive', hi: 'डिस्प्रोसियम दुर्लभ धातु', mr: 'डिस्प्रोसियम धातू' },
        symbol: 'Dy',
        badgeColor: 'bg-purple-400 text-slate-950',
        borderColor: 'border-purple-400/60',
        yieldPerKg: 0.04,
        unit: 'kg',
        approxRatePerUnit: 8500
      },
      {
        name: { en: 'High Purity Iron', hi: 'शुद्ध चुंबकीय लोहा', mr: 'शुद्ध लोह' },
        symbol: 'Fe',
        badgeColor: 'bg-slate-300 text-slate-950',
        borderColor: 'border-slate-400/60',
        yieldPerKg: 0.62,
        unit: 'kg',
        approxRatePerUnit: 38
      }
    ],
    hazardousNeutralizedKgPerKg: 0.02,
    hazardousName: { 
      en: 'Corrosive Nickel-Copper Plating', 
      hi: 'संक्षारक निकेल-कॉपर कोटिंग', 
      mr: 'गंजरोधक निकेल कोटिंग' 
    },
    co2SavedKgPerKg: 4.5
  },
  CRT: {
    minerals: [
      {
        name: { en: 'Electron Gun Shielding', hi: 'चुंबकीय धातु शील्ड', mr: 'धातू शील्ड' },
        symbol: 'Fe-Ni',
        badgeColor: 'bg-slate-300 text-slate-950',
        borderColor: 'border-slate-400/60',
        yieldPerKg: 0.15,
        unit: 'kg',
        approxRatePerUnit: 36
      },
      {
        name: { en: 'Deflection Yoke Copper', hi: 'योक कॉपर कॉइल', mr: 'योक तांबे' },
        symbol: 'Cu',
        badgeColor: 'bg-orange-500 text-white',
        borderColor: 'border-orange-500/60',
        yieldPerKg: 0.08,
        unit: 'kg',
        approxRatePerUnit: 780
      }
    ],
    hazardousNeutralizedKgPerKg: 0.65,
    hazardousName: { 
      en: 'Leaded Glass & Toxic Phosphor Coating', 
      hi: 'सीसा युक्त कांच व विषैला फास्फोरस चूर्ण', 
      mr: 'लेडयुक्त काच व फॉस्फरस' 
    },
    co2SavedKgPerKg: 1.2
  },
  LCD: {
    minerals: [
      {
        name: { en: 'Indium Tin Oxide (ITO)', hi: 'इंडियम दुर्लभ तत्व (In)', mr: 'इंडियम धातू (In)' },
        symbol: 'In',
        badgeColor: 'bg-cyan-300 text-slate-950',
        borderColor: 'border-cyan-400/60',
        yieldPerKg: 0.003,
        unit: 'kg',
        approxRatePerUnit: 6200
      },
      {
        name: { en: 'Optical Acrylic PMMA', hi: 'ऑप्टिकल एक्रिलिक शीट', mr: 'ऑप्टिकल अ‍ॅक्रेलिक' },
        symbol: 'PMMA',
        badgeColor: 'bg-teal-300 text-slate-950',
        borderColor: 'border-teal-400/60',
        yieldPerKg: 0.38,
        unit: 'kg',
        approxRatePerUnit: 75
      },
      {
        name: { en: 'Aluminium Chassis', hi: 'एल्युमिनियम बॉडी फ्रेम', mr: 'अ‍ॅल्युमिनियम फ्रेम' },
        symbol: 'Al',
        badgeColor: 'bg-slate-200 text-slate-950',
        borderColor: 'border-slate-300/60',
        yieldPerKg: 0.22,
        unit: 'kg',
        approxRatePerUnit: 210
      }
    ],
    hazardousNeutralizedKgPerKg: 0.02,
    hazardousName: { 
      en: 'CCFL Cold-Cathode Mercury Vapor', 
      hi: 'पारा (मर्करी) वाष्प ट्यूब्स', 
      mr: 'पारा (मर्क्युरी) बाष्प' 
    },
    co2SavedKgPerKg: 1.7
  },
  MIXED_PLASTIC: {
    minerals: [
      {
        name: { en: 'Flame Retardant ABS Granules', hi: 'रीसायकल एबीएस दाना', mr: 'रीसायकल एबीएस दाणे' },
        symbol: 'ABS',
        badgeColor: 'bg-teal-400 text-slate-950',
        borderColor: 'border-teal-400/60',
        yieldPerKg: 0.52,
        unit: 'kg',
        approxRatePerUnit: 48
      },
      {
        name: { en: 'Polycarbonate Chassis Pellets', hi: 'पॉलीकार्बोनेट प्लास्टिक दाना', mr: 'पॉलीकार्बोनेट दाणे' },
        symbol: 'PC',
        badgeColor: 'bg-sky-400 text-slate-950',
        borderColor: 'border-sky-400/60',
        yieldPerKg: 0.35,
        unit: 'kg',
        approxRatePerUnit: 65
      }
    ],
    hazardousNeutralizedKgPerKg: 0.05,
    hazardousName: { 
      en: 'Persistent Organic Pollutants (POPs)', 
      hi: 'स्थायी जैविक प्रदूषक (POPs)', 
      mr: 'पर्यावरणास घातक प्लास्टिक घटक' 
    },
    co2SavedKgPerKg: 1.5
  }
};

interface UrbanMiningVisualizerProps {
  category: MaterialCategory;
  weightKg: number;
  className?: string;
  compact?: boolean;
}

export const UrbanMiningVisualizer: React.FC<UrbanMiningVisualizerProps> = ({
  category,
  weightKg,
  className = '',
  compact = false
}) => {
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(!compact);

  const profile = RECOVERY_BENCHMARKS[category] || RECOVERY_BENCHMARKS.PCB;
  const validWeight = Math.max(0.5, Number(weightKg) || 1);

  // Calculate environmental impacts
  const co2PreventedKg = Math.round(validWeight * profile.co2SavedKgPerKg * 10) / 10;
  const treesEquivalent = Math.max(1, Math.round(co2PreventedKg / 18));
  const toxicNeutralizedKg = Math.round(validWeight * profile.hazardousNeutralizedKgPerKg * 100) / 100;

  // Calculate total mineral recovery valuation
  const calculatedMinerals = profile.minerals.map((m) => {
    const rawYield = m.yieldPerKg * validWeight;
    let displayYield = '';
    let estimatedValue = 0;

    if (m.unit === 'g') {
      displayYield = rawYield >= 1000 
        ? `${(rawYield / 1000).toFixed(3)} kg` 
        : `${rawYield.toFixed(2)} g`;
      estimatedValue = Math.round(rawYield * (m.approxRatePerUnit / (m.unit === 'g' ? 1 : 1000)));
    } else {
      displayYield = `${rawYield.toFixed(2)} kg`;
      estimatedValue = Math.round(rawYield * m.approxRatePerUnit);
    }

    return {
      ...m,
      displayYield,
      estimatedValue
    };
  });

  const totalMineralValue = calculatedMinerals.reduce((sum, m) => sum + m.estimatedValue, 0);

  return (
    <div
      className={`rounded-3xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 border-2 border-emerald-500/30 dark:border-emerald-500/40 p-5 sm:p-6 shadow-md dark:shadow-2xl space-y-4 relative overflow-hidden group transition-colors ${className}`}
    >
      {/* Background Subtle Shimmer Accents */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/40 flex items-center justify-center font-bold shadow-inner">
            <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{language === 'hi' ? 'शहरी खनन एवं रणनीतिक खनिज रिकवरी' : language === 'mr' ? 'शहरी खाणकाम व खनिज पुनर्प्राप्ती' : 'Urban Mining & Critical Mineral Yield'}</span>
              </h4>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                JNARDDC & CPCB
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              {language === 'hi'
                ? `${validWeight} किग्रा ${getCategoryLabel(category, language)} से निकलने वाले प्रमाणित मूल्यवान धातु`
                : language === 'mr'
                ? `${validWeight} किलो ${getCategoryLabel(category, language)} मधील पुनर्प्राप्त होणारी खनिजे`
                : `Certified strategic mineral yield from ${validWeight} kg of formal ${getCategoryLabel(category, 'en')}`}
            </p>
          </div>
        </div>

        {compact && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 active:scale-95 transition-all text-xs flex items-center gap-1 font-bold"
          >
            <span>{isExpanded ? 'Hide' : 'Inspect Yield'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Body: Strategic Minerals Grid */}
      {isExpanded && (
        <div className="space-y-4 pt-1 relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {calculatedMinerals.map((mineral, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/90 border ${mineral.borderColor} hover:border-emerald-500/80 transition-all duration-300 space-y-2 shadow-sm dark:shadow-inner group/card relative`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md font-mono ${mineral.badgeColor}`}>
                    {mineral.symbol}
                  </span>
                  {mineral.isPrecious && (
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-300 flex items-center gap-0.5">
                      <Award className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                      <span>{language === 'hi' ? 'कीमती' : 'Precious'}</span>
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block truncate">
                    {mineral.name[language] || mineral.name.en}
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono block mt-0.5">
                    {mineral.displayYield}
                  </span>
                </div>

                <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 pt-1 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-500">Value:</span>
                  <span className="font-bold">~₹{mineral.estimatedValue.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Environmental Net Positive Safeguards Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-emerald-50/80 dark:bg-slate-950/80 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2.5 shadow-sm">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                <Leaf className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block uppercase font-bold">CO₂ Footprint Avoided</span>
                <span className="font-black text-emerald-800 dark:text-emerald-300 text-sm font-mono">{co2PreventedKg} kg CO₂e</span>
              </div>
            </div>

            <div className="bg-teal-50/80 dark:bg-slate-950/80 p-3 rounded-2xl border border-teal-200 dark:border-teal-900/60 flex items-center gap-2.5 shadow-sm">
              <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 shrink-0">
                <TreeDeciduous className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block uppercase font-bold">Tree Equivalence</span>
                <span className="font-black text-teal-800 dark:text-teal-300 text-sm font-mono">~{treesEquivalent} Mature Trees</span>
              </div>
            </div>

            <div className="bg-rose-50/80 dark:bg-slate-950/80 p-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 flex items-center gap-2.5 shadow-sm">
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block uppercase font-bold">Toxics Safely Neutralized</span>
                <span className="font-black text-rose-800 dark:text-rose-300 text-sm font-mono">{toxicNeutralizedKg} kg</span>
              </div>
            </div>
          </div>

          {/* Scientific Credibility Footnote */}
          <div className="bg-slate-100 dark:bg-slate-950/95 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 flex-wrap gap-2 shadow-sm">
            <div className="flex items-center gap-1.5 min-w-0">
              <Info className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">
                {language === 'hi'
                  ? `वैज्ञानिक रूप से निष्प्रभावी: ${profile.hazardousName[language] || profile.hazardousName.en}`
                  : `Safely neutralized: ${profile.hazardousName[language] || profile.hazardousName.en}`}
              </span>
            </div>
            <span className="font-mono text-emerald-800 dark:text-emerald-400 font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 shrink-0">
              Circular Rate: 96.4%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
