import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Flame, 
  BatteryCharging, 
  Tv, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Volume2, 
  Wrench,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { AudioButton } from '../../components/common/AudioButton';
import { api } from '../../services/api';

export const SafetyCenterPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getSafetyGuides()
      .then(res => {
        if (res.success && res.guides) setGuides(res.guides);
      })
      .catch(err => console.warn('Safety guides fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-orange-950/40 to-slate-950 border-2 border-orange-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 border-2 border-orange-500/40 flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {t.safetyCenter}
              </h1>
              <p className="text-xs text-orange-200/90 font-medium mt-0.5">
                {language === 'hi' ? 'खुले में जलाने एवं तेजाब लीचिंग के जानलेवा खतरों से बचाव के आवश्यक नियम' : language === 'mr' ? 'उघड्यावर जाळणे व ऍसिड लीचिंगच्या धोक्यांपासून संरक्षणाचे नियम' : 'Crucial health safeguards against toxic burning and acid leaching'}
              </p>
            </div>
          </div>

          <AudioButton
            text={language === 'hi' ? 'सुरक्षा केंद्र। ई-कचरे को कभी भी न जलाएं और न ही तेजाब में डालें।' : language === 'mr' ? 'सुरक्षा केंद्र. ई-कचरा कधीही जाळू नका किंवा ऍसिडमध्ये टाकू नका.' : 'Safety Center. Never burn e-waste or use acid leaching.'}
            label={language === 'hi' ? 'सभी नियम सुनें' : language === 'mr' ? 'नियम ऐका' : 'Listen Rules'}
            size="md"
          />
        </div>

        {/* Golden Rule Warning Banner */}
        <div className="bg-red-950/80 border-2 border-red-500/60 p-4 rounded-2xl flex items-center gap-3 text-xs shadow-inner">
          <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 animate-bounce" />
          <p className="text-red-200 font-bold leading-relaxed">
            {language === 'hi'
              ? 'सख्त कानूनी चेतावनी: ई-कचरा प्रबंधन नियम 2022 के तहत तारों को खुले में जलाना और सर्किट बोर्ड पर एसिड डालना कानूनन अपराध और स्वास्थ्य के लिए अत्यंत घातक है।'
              : language === 'mr'
              ? 'सक्त कायदेशीर इशारा: ई-कचरा नियम २०२२ नुसार उघड्यावर जाळणे किंवा ऍसिडचा वापर करणे कायद्याने गुन्हा व आरोग्यास घातक आहे.'
              : 'Statutory Warning: Under E-Waste Rules 2022, open wire burning and unscientific chemical leaching are prohibited and punishable by law.'}
          </p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-slate-400 text-xs font-bold flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
          <span>{language === 'hi' ? 'सुरक्षा गाइड लोड हो रही है...' : language === 'mr' ? 'सुरक्षा नियम लोड होत आहेत...' : 'Loading safety guides...'}</span>
        </div>
      )}

      {/* Safety Guideline Cards */}
      <div className="space-y-6">
        {guides.map((guide) => {
          const categoryIcons: Record<string, { icon: string; border: string; bg: string }> = {
            CABLE: { icon: '🔥', border: 'border-red-500/40', bg: 'bg-red-950/20' },
            BATTERY: { icon: '⚡', border: 'border-amber-500/40', bg: 'bg-amber-950/20' },
            CRT: { icon: '📺', border: 'border-blue-500/40', bg: 'bg-blue-950/20' },
            PCB: { icon: '🧪', border: 'border-emerald-500/40', bg: 'bg-emerald-950/20' },
            LCD: { icon: '💻', border: 'border-cyan-500/40', bg: 'bg-cyan-950/20' },
            MOTOR: { icon: '⚙️', border: 'border-purple-500/40', bg: 'bg-purple-950/20' },
            MAGNET: { icon: '🧲', border: 'border-rose-500/40', bg: 'bg-rose-950/20' },
            MIXED_PLASTIC: { icon: '♻️', border: 'border-teal-500/40', bg: 'bg-teal-950/20' }
          };

          const style = categoryIcons[guide.category] || { icon: '⚠️', border: 'border-slate-800', bg: 'bg-slate-900' };

          return (
            <div
              key={guide.id}
              className={`bg-slate-900 border-2 ${style.border} rounded-3xl p-5 sm:p-6 shadow-xl space-y-4`}
            >
              {/* Title & Vernacular Voice Button */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center font-bold text-2xl border border-slate-800 shadow">
                    {style.icon}
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-white">
                      {guide.title?.[language] || guide.title?.hi || (typeof guide.title === 'string' ? guide.title : 'सुरक्षा निर्देश')}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {language === 'hi' ? 'श्रेणी:' : language === 'mr' ? 'प्रकार:' : 'Category:'} {guide.category}
                    </span>
                  </div>
                </div>

                {guide.audioText && (
                  <AudioButton
                    text={guide.audioText[language] || guide.audioText.hi || guide.audioText.en || ''}
                    label={language === 'hi' ? 'निर्देश सुनें' : language === 'mr' ? 'सूचना ऐका' : 'Listen'}
                    size="sm"
                  />
                )}
              </div>

              {/* High-Contrast Hazard Box */}
              {guide.hazards && (
                <div className="bg-red-950/60 border border-red-800/70 rounded-2xl p-4 text-xs space-y-1.5 shadow-inner">
                  <div className="flex items-center gap-2 text-red-300 font-black text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{language === 'hi' ? 'गंभीर स्वास्थ्य खतरे:' : language === 'mr' ? 'गंभीर आरोग्याचे धोके:' : 'Severe Health Hazards:'}</span>
                  </div>
                  <ul className="list-disc list-inside text-red-200/90 pl-1 space-y-1 text-xs">
                    {(guide.hazards[language] || guide.hazards.hi || guide.hazards.en || []).map((h: string, idx: number) => (
                      <li key={idx} className="font-medium">{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Visual DOs and DONTs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* DOs */}
                {guide.dos && (
                  <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-2xl p-4 space-y-2.5">
                    <span className="text-xs font-black text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{language === 'hi' ? 'क्या करें (सुरक्षित नियम):' : language === 'mr' ? 'काय करावे (सुरक्षित नियम):' : 'Mandatory Safe DOs:'}</span>
                    </span>
                    <ul className="space-y-2 text-xs text-emerald-200">
                      {(guide.dos[language] || guide.dos.hi || guide.dos.en || []).map((d: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold text-sm">✓</span>
                          <span className="font-medium leading-relaxed">{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* DONTs */}
                {guide.donts && (
                  <div className="bg-red-950/40 border border-red-700/60 rounded-2xl p-4 space-y-2.5">
                    <span className="text-xs font-black text-red-300 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>{language === 'hi' ? 'क्या न करें (सख्त मनाही):' : language === 'mr' ? 'काय करू नये (सक्त मनाई):' : 'Strict Prohibitions (DONTs):'}</span>
                    </span>
                    <ul className="space-y-2 text-xs text-red-200">
                      {(guide.donts[language] || guide.donts.hi || guide.donts.en || []).map((d: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-red-400 font-bold text-sm">✗</span>
                          <span className="font-medium leading-relaxed">{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
