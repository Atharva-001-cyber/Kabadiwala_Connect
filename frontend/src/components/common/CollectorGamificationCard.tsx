import React from 'react';
import { Award, ShieldCheck, Trophy, Sparkles, CheckCircle2, ChevronRight, Share2, Flame, Scale } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

export interface BadgeTier {
  id: string;
  weightKg: number;
  icon: string;
  titleHi: string;
  titleMr: string;
  titleEn: string;
  colorTheme: string;
  borderTheme: string;
  bgTheme: string;
  benefitHi: string;
  benefitMr: string;
  benefitEn: string;
}

export const MILESTONE_BADGES: BadgeTier[] = [
  {
    id: 'green_warrior',
    weightKg: 100,
    icon: '🥉',
    titleHi: 'Green Warrior (हरित योद्धा)',
    titleMr: 'Green Warrior (हरित योद्धा)',
    titleEn: 'Green Warrior',
    colorTheme: 'from-amber-600 to-emerald-600 text-amber-700 dark:text-amber-300',
    borderTheme: 'border-amber-300 dark:border-amber-700',
    bgTheme: 'bg-amber-50/80 dark:bg-amber-950/40',
    benefitHi: 'CPCB डिजिटल आईडी कार्ड एवं डायरेक्ट यूपीआई पेआउट सुविधा',
    benefitMr: 'CPCB डिजिटल आयडी कार्ड आणि थेट यूपीआय पेआउट सुविधा',
    benefitEn: 'CPCB Digital ID Card & Direct Escrow UPI Payouts'
  },
  {
    id: 'urban_mining_master',
    weightKg: 500,
    icon: '🥈',
    titleHi: 'Urban Mining Master (अर्बन माइनिंग मास्टर)',
    titleMr: 'Urban Mining Master (अर्बन माइनिंग मास्टर)',
    titleEn: 'Urban Mining Master',
    colorTheme: 'from-slate-400 to-teal-500 text-slate-800 dark:text-slate-200',
    borderTheme: 'border-slate-300 dark:border-slate-600',
    bgTheme: 'bg-slate-100/90 dark:bg-slate-800/60',
    benefitHi: '0% प्लेटफॉर्म शुल्क + अधिकृत फैक्ट्रियों से प्राथमिकता बोली',
    benefitMr: '0% प्लॅटफॉर्म फी + अधिकृत कारखान्यांकडून प्राधान्य बोली',
    benefitEn: '0% Platform Convenience Fee + Recycler Priority Bids'
  },
  {
    id: 'cpcb_champion',
    weightKg: 1000,
    icon: '🥇',
    titleHi: 'CPCB Champion Collector (CPCB चैंपियन कलेक्टर)',
    titleMr: 'CPCB Champion Collector (CPCB चॅम्पियन संकलक)',
    titleEn: 'CPCB Champion Collector',
    colorTheme: 'from-yellow-500 via-amber-400 to-emerald-500 text-amber-900 dark:text-yellow-300',
    borderTheme: 'border-yellow-400 dark:border-yellow-500/60',
    bgTheme: 'bg-gradient-to-br from-yellow-50/90 via-amber-50/80 to-emerald-50/90 dark:from-yellow-950/40 dark:to-emerald-950/40',
    benefitHi: 'राष्ट्रीय CPCB सम्मान प्रमाणपत्र + ₹2,000 हरित प्रोत्साहन बोनस',
    benefitMr: 'राष्ट्रीय CPCB सन्मान प्रमाणपत्र + ₹२,००० हरित प्रोत्साहन बोनस',
    benefitEn: 'National CPCB Honors Certificate + ₹2,000 Green Bonus'
  }
];

interface CollectorGamificationCardProps {
  totalWeight: number;
  compact?: boolean;
}

export const CollectorGamificationCard: React.FC<CollectorGamificationCardProps> = ({
  totalWeight,
  compact = false
}) => {
  const { language } = useLanguage();
  const { showToast } = useToast();

  // Find active badge level
  const currentBadge = [...MILESTONE_BADGES]
    .reverse()
    .find(b => totalWeight >= b.weightKg);

  // Find next milestone badge
  const nextBadge = MILESTONE_BADGES.find(b => totalWeight < b.weightKg);

  // Calculate percentage to next milestone
  let progressPercent = 100;
  let remainingKg = 0;

  if (nextBadge) {
    const prevMilestoneWeight = currentBadge ? currentBadge.weightKg : 0;
    const targetWeight = nextBadge.weightKg;
    const progressSpan = targetWeight - prevMilestoneWeight;
    const currentProgress = totalWeight - prevMilestoneWeight;
    progressPercent = Math.min(100, Math.max(0, Math.round((currentProgress / progressSpan) * 100)));
    remainingKg = Math.max(0, Number((targetWeight - totalWeight).toFixed(1)));
  }

  const handleShareBadge = () => {
    const badgeName = currentBadge 
      ? (language === 'hi' ? currentBadge.titleHi : language === 'mr' ? currentBadge.titleMr : currentBadge.titleEn)
      : (language === 'hi' ? 'हरित योद्धा आकांक्षी' : 'Green Warrior Aspirant');

    const shareText = language === 'hi'
      ? `♻️ *पर्यावरण योद्धा उपलब्धि!* 🌿\nमैने कबाड़ीवाला कनेक्ट पर ${totalWeight} kg ई-कचरा रिसाइकल करके *${badgeName}* बैज हासिल किया है! CPCB हरित क्रांति में भागीदार बनें।`
      : `♻️ *पर्यावरण योद्धा संपादन!* 🌿\nमी कबाडीवाला कनेक्ट वर ${totalWeight} kg ई-कचरा रीसायकल करून *${badgeName}* बॅज मिळवला आहे!`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
    showToast(language === 'hi' ? 'व्हाट्सएप पर बैज शेयर किया जा रहा है!' : 'Sharing Green Badge on WhatsApp!', 'success');
  };

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-3.5 border border-emerald-500/40 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentBadge ? currentBadge.icon : '🏅'}</span>
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">
                {language === 'hi' ? 'पर्यावरण योद्धा बैज' : language === 'mr' ? 'पर्यावरण योद्धा बॅज' : 'Green Warrior Status'}
              </span>
              <h4 className="text-xs font-black text-white">
                {currentBadge 
                  ? (language === 'hi' ? currentBadge.titleHi : language === 'mr' ? currentBadge.titleMr : currentBadge.titleEn)
                  : (language === 'hi' ? 'शुरुआती संग्रहकर्ता (0-100 kg)' : 'Starter Collector (0-100 kg)')}
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={handleShareBadge}
            className="p-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
            title="Share Badge"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Compact Progress Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between items-center text-[10px] font-mono text-emerald-200">
            <span>
              {totalWeight} {language === 'hi' || language === 'mr' ? 'किग्रा सत्यापित' : 'kg verified'}
            </span>
            {nextBadge ? (
              <span>
                {language === 'hi'
                  ? `लक्ष्य: ${nextBadge.weightKg} किग्रा (${remainingKg} किग्रा शेष)`
                  : language === 'mr'
                  ? `लक्ष्य: ${nextBadge.weightKg} किग्रा (${remainingKg} किग्रा बाकी)`
                  : `Target: ${nextBadge.weightKg} kg (${remainingKg} kg left)`}
              </span>
            ) : (
              <span className="text-amber-300 font-bold">
                🥇 {language === 'hi' ? 'चैंपियन पीक' : language === 'mr' ? 'चॅम्पियन पीक' : 'Champion Peak'}
              </span>
            )}
          </div>
          <div className="w-full bg-slate-950/80 rounded-full h-2.5 overflow-hidden border border-emerald-500/30">
            <div
              className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/30 dark:border-emerald-500/40 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-2xl shadow-md border border-emerald-400">
            🏅
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {language === 'hi' ? 'पर्यावरण योद्धा गमिफिकेशन एवं ग्रीन बैज' : language === 'mr' ? 'पर्यावरण योद्धा बॅज व गेमिफिकेशन' : 'Collector Gamification & Green Badges'}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                {language === 'hi' ? 'CPCB मील का पत्थर ऑडिट' : language === 'mr' ? 'CPCB मैलाचा दगड ऑडिट' : 'CPCB Milestone Audit'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'hi'
                ? 'अनौपचारिक कबाड़ीवालों के लिए कुल ई-कचरा संग्रह मील के पत्थर पर आधिकारिक हरित सम्मान।'
                : language === 'mr'
                ? 'असंघटित संकलकांसाठी एकूण ई-कचरा संकलन टप्प्यांवर प्रमाणित हरित सन्मान.'
                : 'Recognizing informal scrap collectors with certified green badges on reaching collection targets.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleShareBadge}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow active:scale-95 transition-all self-start sm:self-center"
        >
          <Share2 className="w-4 h-4" />
          <span>{language === 'hi' ? 'व्हाट्सएप पर बैज शेयर करें' : language === 'mr' ? 'बॅज शेयर करा' : 'Share Badge'}</span>
        </button>
      </div>

      {/* Current Active Badge Highlight Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 rounded-2xl border border-emerald-500/50 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl sm:text-5xl drop-shadow-md">
              {currentBadge ? currentBadge.icon : '🥉'}
            </span>
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 tracking-wider block">
                {language === 'hi' ? 'वर्तमान में प्राप्त बैज स्तर:' : language === 'mr' ? 'सध्याचा प्राप्त बॅज स्तर:' : 'Current Unlocked Level:'}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white">
                {currentBadge 
                  ? (language === 'hi' ? currentBadge.titleHi : language === 'mr' ? currentBadge.titleMr : currentBadge.titleEn)
                  : (language === 'hi' ? 'Green Warrior (0 - 100 किग्रा)' : language === 'mr' ? 'Green Warrior (0 - 100 किग्रा)' : 'Green Warrior Aspirant (0 - 100 kg)')}
              </h3>
              <p className="text-xs text-emerald-200 mt-0.5 font-medium">
                {currentBadge 
                  ? (language === 'hi' ? currentBadge.benefitHi : language === 'mr' ? currentBadge.benefitMr : currentBadge.benefitEn)
                  : (language === 'hi' ? 'पहला बैज 100 किग्रा संग्रह करने पर अनलॉक होगा।' : language === 'mr' ? 'पहिला बॅज 100 किग्रा संकलनावर अनलॉक होईल.' : 'Collect 100 kg to unlock your first Green Warrior badge.')}
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-emerald-700/60 sm:pl-4">
            <span className="text-[10px] text-emerald-300 font-bold block uppercase">
              {language === 'hi' ? 'सत्यापित संग्रह:' : language === 'mr' ? 'सत्यापित संग्रह:' : 'Verified Scrap:'}
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {totalWeight} {language === 'hi' || language === 'mr' ? 'किग्रा' : 'kg'}
            </span>
          </div>
        </div>

        {/* Live Progress Bar to Next Tier */}
        <div className="space-y-1.5 pt-2 border-t border-emerald-800/80">
          <div className="flex justify-between items-center text-xs font-mono font-bold">
            <span className="text-emerald-300 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {progressPercent}% {language === 'hi' ? 'अगले मील के पत्थर की ओर' : language === 'mr' ? 'पुढील टप्प्याकडे' : 'towards next milestone'}
              </span>
            </span>
            {nextBadge ? (
              <span className="text-emerald-200">
                {remainingKg} {language === 'hi' || language === 'mr' ? 'किग्रा' : 'kg'} {language === 'hi' ? 'और चाहिए (' : language === 'mr' ? 'बाकी (' : 'needed for '} 
                <b className="text-amber-300">{nextBadge.icon} {language === 'hi' ? nextBadge.titleHi.split('(')[0] : language === 'mr' ? nextBadge.titleMr.split('(')[0] : nextBadge.titleEn}</b>
                {language === 'hi' ? ' हेतु)' : language === 'mr' ? ' साठी)' : ')'}
              </span>
            ) : (
              <span className="text-yellow-300 font-black flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-300" />
                <span>{language === 'hi' ? 'सर्वोच्च राष्ट्रीय स्तर प्राप्त!' : language === 'mr' ? 'सर्वोच्च राष्ट्रीय स्तर प्राप्त!' : 'Top CPCB Level Achieved!'}</span>
              </span>
            )}
          </div>

          <div className="w-full bg-slate-950 rounded-full h-3.5 p-0.5 overflow-hidden border border-emerald-500/40">
            <div
              className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 h-full rounded-full transition-all duration-700 shadow-lg"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3 Milestone Badges Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-500" />
          <span>{language === 'hi' ? 'मील के पत्थर बैज एवं पुरस्कार नियम (Milestone Rules)' : 'Milestone Badges & Benefits'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MILESTONE_BADGES.map((badge) => {
            const isUnlocked = totalWeight >= badge.weightKg;
            const isCurrent = currentBadge?.id === badge.id;

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border-2 transition-all relative space-y-3 ${
                  isUnlocked
                    ? `${badge.bgTheme} ${badge.borderTheme} shadow-sm`
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-70'
                }`}
              >
                {/* Unlocked / Current Pill */}
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{badge.icon}</span>
                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isCurrent ? (language === 'hi' ? 'सक्रिय बैज' : language === 'mr' ? 'सक्रिय बॅज' : 'ACTIVE') : (language === 'hi' ? 'अनलॉक हुआ' : language === 'mr' ? 'अनलॉक झाले' : 'UNLOCKED')}</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                      🔒 {badge.weightKg} {language === 'hi' || language === 'mr' ? 'किग्रा लक्ष्य' : 'kg Target'}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 block">
                    {language === 'hi' ? 'मील का पत्थर:' : language === 'mr' ? 'टप्पा लक्ष्य:' : 'Milestone:'} {badge.weightKg} {language === 'hi' || language === 'mr' ? 'किग्रा' : 'kg'}
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {language === 'hi' ? badge.titleHi : language === 'mr' ? badge.titleMr : badge.titleEn}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                    {language === 'hi' ? badge.benefitHi : language === 'mr' ? badge.benefitMr : badge.benefitEn}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-bold">
                  <span className="text-slate-500">
                    {isUnlocked 
                      ? (language === 'hi' ? 'आवश्यकता पूरी हुई' : language === 'mr' ? 'अट पूर्ण झाली' : 'Requirement Fulfilled') 
                      : `${Math.max(0, badge.weightKg - totalWeight)} ${language === 'hi' || language === 'mr' ? 'किग्रा शेष' : 'kg remaining'}`}
                  </span>
                  {isUnlocked && (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                      <span>{language === 'hi' ? 'सत्यापित' : language === 'mr' ? 'प्रमाणित' : 'Certified'}</span>
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
