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
  Sparkles,
  PhoneCall,
  Printer,
  Search,
  Droplets,
  HardHat,
  Eye,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { AudioButton } from '../../components/common/AudioButton';
import { api } from '../../services/api';
import { getCategoryLabel } from '../../i18n/translations';

export const SafetyCenterPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Emergency First Aid Toggle
  const [showFirstAid, setShowFirstAid] = useState<boolean>(false);

  // Interactive PPE Checklist State
  const [ppeStatus, setPpeStatus] = useState<{ [key: string]: boolean }>({
    gloves: false,
    goggles: false,
    mask: false,
    boots: false
  });

  const togglePpe = (key: string) => {
    setPpeStatus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isAllPpeChecked = Object.values(ppeStatus).every(Boolean);

  useEffect(() => {
    api.getSafetyGuides()
      .then(res => {
        if (res.success && res.guides) setGuides(res.guides);
      })
      .catch(err => console.warn('Safety guides fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredGuides = guides.filter((g) => {
    const matchesCategory = selectedCategory === 'ALL' || g.category === selectedCategory;
    const titleStr = typeof g.title === 'object' ? (g.title[language] || g.title.en || '') : (g.title || '');
    const hazardsStr = g.hazards ? (g.hazards[language] || g.hazards.en || []).join(' ') : '';
    const dosStr = g.dos ? (g.dos[language] || g.dos.en || []).join(' ') : '';
    const dontsStr = g.donts ? (g.donts[language] || g.donts.en || []).join(' ') : '';
    
    const combinedText = `${titleStr} ${g.category} ${hazardsStr} ${dosStr} ${dontsStr}`.toLowerCase();
    const matchesSearch = !searchQuery || combinedText.includes(searchQuery.toLowerCase().trim());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header with Statutory Legal Warning */}
      <div className="bg-gradient-to-br from-slate-900 via-orange-950/40 to-slate-950 border-2 border-orange-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 border-2 border-orange-500/40 flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>{t.safetyCenter}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-orange-950 text-orange-300 border border-orange-700">
                  CPCB Rule 16
                </span>
              </h1>
              <p className="text-xs text-orange-200/90 font-medium mt-0.5">
                {language === 'hi' 
                  ? 'खुले में जलाने एवं तेजाब लीचिंग के जानलेवा खतरों से बचाव के आवश्यक नियम' 
                  : language === 'mr' 
                  ? 'उघड्यावर जाळणे व ऍसिड लीचिंगच्या धोक्यांपासून संरक्षणाचे नियम' 
                  : 'Crucial health safeguards against toxic burning, acid leaching and heavy metal hazards'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 shadow active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'गाइड प्रिंट करें' : 'Print Handbook'}</span>
            </button>

            <AudioButton
              text={language === 'hi' 
                ? 'सुरक्षा केंद्र। ई-कचरे को कभी भी खुले में न जलाएं और न ही तेजाब में डालें। इससे जानलेवा बीमारियां होती हैं। हमेशा दस्ताने और चश्मा पहनें।' 
                : language === 'mr' 
                ? 'सुरक्षा केंद्र. ई-कचरा कधीही जाळू नका किंवा ऍसिडमध्ये टाकू नका. यामुळे गंभीर आजार होतात. नेहमी हातमोजे वापरा.' 
                : 'Safety Center. Never burn e-waste in open air or use backyard acid leaching. Always wear PPE gloves, goggles and sell intact to authorized recyclers.'}
              label={language === 'hi' ? 'सभी नियम सुनें' : language === 'mr' ? 'नियम ऐका' : 'Listen Rules'}
              size="md"
            />
          </div>
        </div>

        {/* Statutory Legal Warning Banner */}
        <div className="bg-red-950/80 border-2 border-red-500/60 p-4 rounded-2xl flex items-center gap-3 text-xs shadow-inner">
          <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 animate-bounce" />
          <p className="text-red-200 font-bold leading-relaxed">
            {language === 'hi'
              ? 'सख्त कानूनी चेतावनी: ई-कचरा (प्रबंधन) नियम 2022 के तहत तारों को खुले में जलाना और सर्किट बोर्ड पर तेजाब डालना गैर-कानूनी और दंडनीय अपराध है।'
              : language === 'mr'
              ? 'सक्त कायदेशीर इशारा: ई-कचरा नियम २०२२ नुसार उघड्यावर जाळणे किंवा ऍसिडचा वापर करणे कायद्याने गुन्हा व आरोग्यास घातक आहे.'
              : 'Statutory Warning: Under E-Waste (Management) Rules 2022, open wire burning and unscientific chemical leaching are prohibited and severely punishable by law.'}
          </p>
        </div>
      </div>

      {/* Emergency First-Aid & Poison Control Helpline Quick-Bar */}
      <div className="bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-500/40 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-red-500 dark:text-red-400 animate-pulse" />
            <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-wide">
              {language === 'hi' ? 'आपातकालीन सहायता एवं विष नियंत्रण हेल्पलाइन' : '24x7 Emergency Medical & Poison Control Helpline'}
            </h2>
          </div>
          <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 dark:text-red-300 dark:bg-red-950/80 dark:border-red-800 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
            {language === 'hi' ? 'आपात्कालीन हेल्पलाइन्स' : language === 'mr' ? 'आपत्कालीन हेल्पलाईन' : 'Emergency Hotlines'}
          </span>
        </div>

        {/* 4 Emergency Dialing Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <a
            href="tel:112"
            className="p-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-700/70 rounded-2xl flex items-center gap-2.5 transition-all group active:scale-95 shadow-2xs"
          >
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm shrink-0">
              112
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-red-600 dark:text-red-300 font-bold uppercase block truncate">
                {language === 'hi' ? 'राष्ट्रीय हेल्पलाइन' : language === 'mr' ? 'राष्ट्रीय हेल्पलाईन' : 'National Helpline'}
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-200">
                {language === 'hi' ? 'पुलिस / चिकित्सा' : language === 'mr' ? 'पोलिस / वैद्यकीय' : 'Police / Medical'}
              </span>
            </div>
          </a>

          <a
            href="tel:1800116117"
            className="p-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-700/70 rounded-2xl flex items-center gap-2.5 transition-all group active:scale-95 shadow-2xs"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-xs shrink-0">
              AIIMS
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold uppercase block truncate">
                {language === 'hi' ? 'विष सूचना केंद्र' : language === 'mr' ? 'विष माहिती केंद्र' : 'Poison Information'}
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-200">1800-116-117</span>
            </div>
          </a>

          <a
            href="tel:101"
            className="p-3 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/60 dark:hover:bg-orange-900/60 border border-orange-200 dark:border-orange-700/70 rounded-2xl flex items-center gap-2.5 transition-all group active:scale-95 shadow-2xs"
          >
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-sm shrink-0">
              101
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-orange-700 dark:text-orange-300 font-bold uppercase block truncate">
                {language === 'hi' ? 'अग्नि आपात्काल' : language === 'mr' ? 'आग आपत्काळ' : 'Fire Emergency'}
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-orange-700 dark:group-hover:text-orange-200">
                {language === 'hi' ? 'बैटरी आग नियंत्रण' : language === 'mr' ? 'बॅटरी आग नियंत्रण' : 'Battery Fires'}
              </span>
            </div>
          </a>

          <a
            href="tel:18001801717"
            className="p-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-700/70 rounded-2xl flex items-center gap-2.5 transition-all group active:scale-95 shadow-2xs"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
              CPCB
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold uppercase block truncate">
                {language === 'hi' ? 'खतरा नियंत्रण' : language === 'mr' ? 'धोका नियंत्रण' : 'Hazard Control'}
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-200">1800-180-1717</span>
            </div>
          </a>
        </div>

        {/* Expandable Instant First-Aid Protocols */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowFirstAid(!showFirstAid)}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 font-bold flex items-center gap-1.5 active:scale-95"
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>
              {showFirstAid 
                ? (language === 'hi' ? 'प्राथमिक उपचार प्रोटोकॉल छिपाएं' : language === 'mr' ? 'प्राथमिक उपचार प्रोटोकॉल लपवा' : 'Hide Field First-Aid Protocols') 
                : (language === 'hi' ? 'दुर्घटना में तत्काल प्राथमिक उपचार (First Aid) देखें' : language === 'mr' ? 'अपघातात तत्काळ प्राथमिक उपचार (First Aid) पहा' : 'View Immediate Field First-Aid Protocols')}
            </span>
            {showFirstAid ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showFirstAid && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-700 dark:text-slate-300 animate-fadeIn">
              <div className="bg-red-50/60 dark:bg-slate-950 p-3 rounded-2xl border border-red-200 dark:border-red-900/60 space-y-1">
                <span className="font-bold text-red-700 dark:text-red-400 flex items-center gap-1">
                  <span>🧪</span>
                  <span>{language === 'hi' ? 'तेजाब या रसायन छीटें' : language === 'mr' ? 'ऍसिड किंवा रासायनिक संपर्क' : 'Acid or Chemical Splash'}</span>
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {language === 'hi'
                    ? 'प्रभावित त्वचा या आंखों को कम से कम 15 मिनट तक लगातार साफ नल के पानी से धोएं। रगड़ें नहीं। तुरंत डॉक्टर के पास जाएं।'
                    : language === 'mr'
                    ? 'बाधित त्वचा किंवा डोळे कमीत कमी १५ मिनिटे स्वच्छ पाण्याने धुवा. चोळू नका. तत्काळ डॉक्टरांचा सल्ला घ्या.'
                    : 'Flush affected skin or eyes with continuous clean running tap water for at least 15 minutes. Do NOT rub, apply oils or soap. Seek medical attention immediately.'}
                </p>
              </div>

              <div className="bg-amber-50/60 dark:bg-slate-950 p-3 rounded-2xl border border-amber-200 dark:border-amber-900/60 space-y-1">
                <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <span>⚡</span>
                  <span>{language === 'hi' ? 'लिथियम बैटरी तापीय आग' : language === 'mr' ? 'लिथियम बॅटरी तापीय आग' : 'Lithium Battery Thermal Fire'}</span>
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {language === 'hi'
                    ? 'सूखी रेत, मिट्टी या क्लास D अग्निशामक से आग बुझाएं। जलती लिथियम बैटरी पर पानी कभी न डालें (हाइड्रोजन विस्फोट हो सकता है)!'
                    : language === 'mr'
                    ? 'कोरडी वाळू, माती किंवा क्लास D अग्निशामक वापरा. जळत्या लिथियम बॅटरीवर पाणी टाकू नका (हायड्रोजन स्फोट होऊ शकतो)!'
                    : 'Smother fire with dry sand, soil, or Class D dry chemical extinguisher. NEVER pour small amounts of water on burning lithium cells (causes hydrogen explosion)!'}
                </p>
              </div>

              <div className="bg-orange-50/60 dark:bg-slate-950 p-3 rounded-2xl border border-orange-200 dark:border-orange-900/60 space-y-1">
                <span className="font-bold text-orange-700 dark:text-orange-400 flex items-center gap-1">
                  <span>💨</span>
                  <span>{language === 'hi' ? 'जहरीला धुआं फेफड़ों में जाना' : language === 'mr' ? 'विषारी धूर श्वासात जाणे' : 'Toxic Wire Fume Inhalation'}</span>
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {language === 'hi'
                    ? 'व्यक्ति को तुरंत खुली ताजा हवा में लाएं। गले के कपड़े ढीले करें और व्यक्ति को सीधा बैठाएं।'
                    : language === 'mr'
                    ? 'बाधित व्यक्तीला तत्काळ मोकळ्या हवेत आणा. गळ्यातील कपडे सैल करा आणि बसवून ठेवा.'
                    : 'Move patient immediately to open, uncontaminated outdoor air. Keep person upright and loosen tight clothing around neck. Administer oxygen if available.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Personal Protective Equipment (PPE) Checklist */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <HardHat className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {language === 'hi' ? 'अनिवार्य व्यक्तिगत सुरक्षा उपकरण (PPE Kit)' : language === 'mr' ? 'अनिवार्य वैयक्तिक सुरक्षा उपकरणे (PPE Kit)' : 'Mandatory PPE Safety Gear Checklist'}
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {language === 'hi' ? 'कचरा उठाने और हैंडल करने से पहले 4 सुरक्षा साधन अवश्य पहनें' : language === 'mr' ? 'ई-कचरा हाताळण्यापूर्वी ४ सुरक्षा साधने नक्की वापरा' : 'Check off your safety equipment before handling hazardous e-waste'}
              </span>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-black border transition-all ${
            isAllPpeChecked
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-600 shadow-sm'
              : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
          }`}>
            {isAllPpeChecked 
              ? (language === 'hi' ? '🟢 100% सुरक्षा तैयार' : language === 'mr' ? '🟢 १००% सुरक्षा तयार' : '🟢 100% PPE COMPLIANT')
              : (language === 'hi' ? '⚠️ सुरक्षा साधन पहनें' : language === 'mr' ? '⚠️ सुरक्षा साधने वापरा' : '⚠️ PPE GEAR REQUIRED')}
          </span>
        </div>

        {/* 4 Interactive PPE Gear Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            {
              id: 'gloves',
              title: 'Heavy Nitrile Chemical Gloves',
              hindi: 'रासायनिक प्रतिरोधी मोटे दस्ताने',
              marathi: 'रासायनिक प्रतिरोधी जाड हातमोजे',
              descHi: 'बैटरी एसिड, इलेक्ट्रोलाइट रिसाव और तेज पीसीबी किनारों से हाथों की रक्षा करता है।',
              descMr: 'बॅटरी ऍसिड, इलेक्ट्रोलाइट गळती आणि पीसीबीच्या तीक्ष्ण कडांपासून हातांचे संरक्षण करते.',
              descEn: 'Protects hands from battery acids, electrolyte leakages and sharp PCB edges.',
              icon: '🧤'
            },
            {
              id: 'goggles',
              title: 'Impact Safety Eye Goggles',
              hindi: 'सुरक्षा चश्मा (आंखों का बचाव)',
              marathi: 'सुरक्षा चष्मा (डोळ्यांचे रक्षण)',
              descHi: 'सीआरटी टीवी शीशे के टुकड़ों और तेजाब के छीटों से आंखों का बचाव करता है।',
              descMr: 'सीआरटी टीव्हीचे काच व ऍसिडच्या उडणाऱ्या थेंबांपासून डोळ्यांचे रक्षण करते.',
              descEn: 'Shields eyes from exploding vacuum CRT tube shards and corrosive chemical splashes.',
              icon: '🥽'
            },
            {
              id: 'mask',
              title: 'N95 Acid Gas & Dust Respirator',
              hindi: 'N95 मास्क (जहरीले धुएं से बचाव)',
              marathi: 'N95 मास्क (विषारी धुरापासून संरक्षण)',
              descHi: 'कैंसरकारी डाइऑक्सिन, सोल्डर लेड धुएं और जहरीली धूल को फेफड़ों में जाने से रोकता है।',
              descMr: 'कर्करोगास कारणीभूत धूर, शिसे व विषारी धुळीपासून फुफ्फुसांचे रक्षण करते.',
              descEn: 'Blocks inhalation of carcinogenic dioxins, solder lead fumes and toxic dust.',
              icon: '😷'
            },
            {
              id: 'boots',
              title: 'Steel-Toe Reinforced Work Boots',
              hindi: 'मजबूत सुरक्षा जूते (पैरों का बचाव)',
              marathi: 'मजबूत सुरक्षा बूट (पायांचे रक्षण)',
              descHi: 'भारी मोटर ट्रांसफार्मर और नुकीले चेसिस मेटल से पैरों की सुरक्षा करता है।',
              descMr: 'जड मोटार ट्रान्सफॉर्मर व तीक्ष्ण धातूंपासून पायांचे रक्षण करते.',
              descEn: 'Prevents crush injuries from heavy motor transformers and sharp chassis metals.',
              icon: '🥾'
            }
          ].map(item => (
            <div
              key={item.id}
              onClick={() => togglePpe(item.id)}
              className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] ${
                ppeStatus[item.id]
                  ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 dark:bg-emerald-950/60 dark:border-emerald-500 dark:text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    {language === 'hi' ? item.hindi : language === 'mr' ? item.marathi : item.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    {language === 'hi' ? item.descHi : language === 'mr' ? item.descMr : item.descEn}
                  </p>
                </div>
              </div>

              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 font-black text-xs ${
                ppeStatus[item.id]
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-transparent'
              }`}>
                ✓
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Category Filter Pills & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-orange-500" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {language === 'hi' ? 'विशिष्ट सामग्री सुरक्षा नियम' : language === 'mr' ? 'विशिष्ट साहित्य सुरक्षा नियम' : 'Consignment Material Safety Protocols'}
            </h2>
            <span className="text-[10px] font-mono font-bold text-orange-800 bg-orange-50 dark:text-orange-400 dark:bg-orange-950 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
              {filteredGuides.length}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'hi' ? 'खतरा, नियम या सामग्री खोजें...' : language === 'mr' ? 'धोका, नियम किंवा साहित्य शोधा...' : 'Search hazard, rule or category...'}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
          {[
            { key: 'ALL', label: language === 'hi' ? 'सभी श्रेणियां' : language === 'mr' ? 'सर्व प्रकार' : 'All Rules' },
            { key: 'BATTERY', label: language === 'hi' ? '⚡ बैटरी' : language === 'mr' ? '⚡ बॅटरी' : '⚡ Batteries' },
            { key: 'CABLE', label: language === 'hi' ? '🔥 केबल व तार' : language === 'mr' ? '🔥 केबल व वायर' : '🔥 Cables' },
            { key: 'PCB', label: language === 'hi' ? '🧪 पीसीबी व तेजाब' : language === 'mr' ? '🧪 पीसीबी व ऍसिड' : '🧪 PCBs & Acid' },
            { key: 'CRT', label: language === 'hi' ? '📺 सीआरटी टीवी' : language === 'mr' ? '📺 सीआरटी टीव्ही' : '📺 CRTs / TVs' },
            { key: 'LCD', label: language === 'hi' ? '💻 एलसीडी स्क्रीन' : language === 'mr' ? '💻 एलसीडी स्क्रीन' : '💻 LCD Screens' },
            { key: 'MOTOR', label: language === 'hi' ? '⚙️ इलेक्ट्रिक मोटर' : language === 'mr' ? '⚙️ इलेक्ट्रिक मोटार' : '⚙️ Motors' },
            { key: 'MAGNET', label: language === 'hi' ? '🧲 मैग्नेट' : language === 'mr' ? '🧲 चुंबक' : '🧲 Magnets' },
            { key: 'MIXED_PLASTIC', label: language === 'hi' ? '♻️ प्लास्टिक' : language === 'mr' ? '♻️ प्लॅस्टिक' : '♻️ Plastics' }
          ].map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 active:scale-95 ${
                selectedCategory === cat.key
                  ? 'bg-orange-600 text-white shadow font-black'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-slate-500 text-xs font-bold flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span>{language === 'hi' ? 'सुरक्षा गाइड लोड हो रही है...' : language === 'mr' ? 'सुरक्षा नियम लोड होत आहेत...' : 'Loading safety guides...'}</span>
        </div>
      )}

      {/* Safety Guideline Cards */}
      <div className="space-y-6">
        {filteredGuides.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-500 space-y-2 shadow-sm">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-300">
              {language === 'hi' ? 'कोई सुरक्षा निर्देश नहीं मिला।' : 'No safety guidelines found matching your filter.'}
            </p>
            <p className="text-xs text-slate-500">
              {language === 'hi' ? 'कृपया खोज शब्द बदलें या "सभी श्रेणियां" चुनें।' : 'Try clearing your search query or select "All Rules" above.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredGuides.map((guide) => {
            const categoryIcons: Record<string, { icon: string; border: string; bg: string }> = {
              CABLE: { icon: '🔥', border: 'border-red-300 dark:border-red-500/40', bg: 'bg-red-50 dark:bg-red-950/20' },
              BATTERY: { icon: '⚡', border: 'border-amber-300 dark:border-amber-500/40', bg: 'bg-amber-50 dark:bg-amber-950/20' },
              CRT: { icon: '📺', border: 'border-blue-300 dark:border-blue-500/40', bg: 'bg-blue-50 dark:bg-blue-950/20' },
              PCB: { icon: '🧪', border: 'border-emerald-300 dark:border-emerald-500/40', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
              LCD: { icon: '💻', border: 'border-cyan-300 dark:border-cyan-500/40', bg: 'bg-cyan-50 dark:bg-cyan-950/20' },
              MOTOR: { icon: '⚙️', border: 'border-purple-300 dark:border-purple-500/40', bg: 'bg-purple-50 dark:bg-purple-950/20' },
              MAGNET: { icon: '🧲', border: 'border-rose-300 dark:border-rose-500/40', bg: 'bg-rose-50 dark:bg-rose-950/20' },
              MIXED_PLASTIC: { icon: '♻️', border: 'border-teal-300 dark:border-teal-500/40', bg: 'bg-teal-50 dark:bg-teal-950/20' }
            };

            const style = categoryIcons[guide.category] || { icon: '⚠️', border: 'border-slate-200 dark:border-slate-800', bg: 'bg-slate-50 dark:bg-slate-900' };

            return (
              <div
                key={guide.id}
                className={`bg-white dark:bg-slate-900 border-2 ${style.border} rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 transition-all`}
              >
                {/* Title & Vernacular Voice Button */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-bold text-2xl border border-slate-200 dark:border-slate-800 shadow-2xs shrink-0">
                      {style.icon}
                    </div>
                    <div>
                      <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                        {guide.title?.[language] || guide.title?.hi || (typeof guide.title === 'string' ? guide.title : 'सुरक्षा निर्देश')}
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {language === 'hi' ? 'सामग्री श्रेणी:' : language === 'mr' ? 'प्रकार:' : 'Material Category:'} {getCategoryLabel(guide.category, language)}
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
                  <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/70 rounded-2xl p-4 text-xs space-y-1.5 shadow-inner">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-black text-sm">
                      <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                      <span>{language === 'hi' ? 'गंभीर स्वास्थ्य खतरे:' : language === 'mr' ? 'गंभीर आरोग्याचे धोके:' : 'Severe Health Hazards:'}</span>
                    </div>
                    <ul className="list-disc list-inside text-red-900 dark:text-red-200/90 pl-1 space-y-1 text-xs">
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
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700/60 rounded-2xl p-4 space-y-2.5">
                      <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{language === 'hi' ? 'क्या करें (सुरक्षित नियम):' : language === 'mr' ? 'काय करावे (सुरक्षित नियम):' : 'Mandatory Safe DOs:'}</span>
                      </span>
                      <ul className="space-y-2 text-xs text-emerald-900 dark:text-emerald-200">
                        {(guide.dos[language] || guide.dos.hi || guide.dos.en || []).map((d: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">✓</span>
                            <span className="font-medium leading-relaxed">{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* DONTs */}
                  {guide.donts && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-700/60 rounded-2xl p-4 space-y-2.5">
                      <span className="text-xs font-black text-red-800 dark:text-red-300 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span>{language === 'hi' ? 'क्या न करें (सख्त मनाही):' : language === 'mr' ? 'काय करू नये (सक्त मनाई):' : 'Strict Prohibitions (DONTs):'}</span>
                      </span>
                      <ul className="space-y-2 text-xs text-red-900 dark:text-red-200">
                        {(guide.donts[language] || guide.donts.hi || guide.donts.en || []).map((d: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-red-600 dark:text-red-400 font-bold text-sm">✗</span>
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
        )}
      </div>
    </div>
  );
};
