import React from 'react';
import { 
  User, 
  PackagePlus, 
  Handshake, 
  Tag, 
  Truck, 
  Scale, 
  Boxes, 
  Cpu, 
  WalletCards,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { LotStatus } from '../../types';

interface MaterialJourneyProps {
  currentStatus?: LotStatus;
  className?: string;
  compact?: boolean;
}

export const MaterialJourney: React.FC<MaterialJourneyProps> = ({
  currentStatus,
  className = '',
  compact = false
}) => {
  const { language } = useLanguage();

  const stages = [
    {
      key: 'COLLECTOR',
      label: { en: 'Collector', hi: 'कलेक्टर', mr: 'कलेक्टर' },
      sub: { en: 'Informal Aggregator', hi: 'अनौपचारिक संग्रहकर्ता', mr: 'अनौपचारिक संकलक' },
      icon: User,
      statusMatch: ['CREATED']
    },
    {
      key: 'LOT_CREATED',
      label: { en: 'Lot Created', hi: 'लॉट निर्मित', mr: 'लॉट तयार' },
      sub: { en: 'Photo & AI Verified', hi: 'फोटो व AI सत्यापित', mr: 'फोटो व AI पडताळणी' },
      icon: PackagePlus,
      statusMatch: ['CREATED']
    },
    {
      key: 'RECYCLER_MATCHED',
      label: { en: 'Recycler Matched', hi: 'रीसाइक्लर मैच', mr: 'रीसायकलर जुळला' },
      sub: { en: 'CPCB Authorized', hi: 'CPCB अधिकृत यूनिट्स', mr: 'CPCB अधिकृत युनिट्स' },
      icon: Handshake,
      statusMatch: ['OFFER_RECEIVED']
    },
    {
      key: 'OFFER',
      label: { en: 'Fair Offer', hi: 'पारदर्शी भाव', mr: 'पारदर्शक दर' },
      sub: { en: 'Competitive Quote', hi: 'बिचौलियों से +72%', mr: 'दलालांपेक्षा +72%' },
      icon: Tag,
      statusMatch: ['OFFER_RECEIVED', 'ACCEPTED']
    },
    {
      key: 'PICKUP',
      label: { en: 'Doorstep Pickup', hi: 'डोरस्टेप पिकअप', mr: 'डोरस्टेप पिकअप' },
      sub: { en: 'Zero Deduction', hi: 'निःशुल्क वाहन', mr: 'विनामूल्य वाहन' },
      icon: Truck,
      statusMatch: ['PICKUP_SCHEDULED', 'PICKED_UP']
    },
    {
      key: 'HANDOVER',
      label: { en: 'Scale Handover', hi: 'कांटा सत्यापन', mr: 'काटा पडताळणी' },
      sub: { en: 'Calibrated & OTP', hi: 'डिजिटल OTP सत्यापन', mr: 'डिजिटल OTP पडताळणी' },
      icon: Scale,
      statusMatch: ['RECEIVED', 'RECYCLER_RECEIVED']
    },
    {
      key: 'INVENTORY',
      label: { en: 'Plant Inventory', hi: 'प्लांट आवक', mr: 'प्लांट नोंद' },
      sub: { en: 'Safe Sorting', hi: 'सुरक्षित वर्गीकरण', mr: 'सुरक्षित वर्गीकरण' },
      icon: Boxes,
      statusMatch: ['SORTED']
    },
    {
      key: 'PROCESSING',
      label: { en: 'Formal Recovery', hi: 'धातु निष्कर्षण', mr: 'धातू पुनर्प्राप्ती' },
      sub: { en: 'Li, Co, Cu Extracted', hi: 'महत्वपूर्ण खनिज सुरक्षा', mr: 'खनिज सुरक्षा' },
      icon: Cpu,
      statusMatch: ['PROCESSING', 'RECOVERED']
    },
    {
      key: 'PAYMENT',
      label: { en: 'Instant Payment', hi: 'तत्काल भुगतान', mr: 'त्वरित पेमेंट' },
      sub: { en: 'Passbook Voucher', hi: 'सीधा बैंक / नकद', mr: 'थेट बँक / रोख' },
      icon: WalletCards,
      statusMatch: ['RECYCLED']
    }
  ];

  const getStageIndex = (status?: LotStatus) => {
    if (!status) return 0;
    switch (status) {
      case 'CREATED': return 1;
      case 'OFFER_RECEIVED': return 3;
      case 'ACCEPTED': return 3;
      case 'PICKUP_SCHEDULED':
      case 'PICKED_UP': return 4;
      case 'RECEIVED':
      case 'RECYCLER_RECEIVED': return 5;
      case 'SORTED': return 6;
      case 'PROCESSING':
      case 'RECOVERED': return 7;
      case 'RECYCLED': return 8;
      default: return 0;
    }
  };

  const activeIndex = getStageIndex(currentStatus);

  const titleText =
    language === 'hi'
      ? 'सामग्री यात्रा (Material Journey)'
      : language === 'mr'
      ? 'साहित्य प्रवास (Material Journey)'
      : 'Material Journey: Informal Collector to Formal Recycler';

  const subtitleText =
    language === 'hi'
      ? 'अनौपचारिक कबाड़ीवाले से अधिकृत राष्ट्रीय रीसाइक्लिंग व महत्वपूर्ण खनिज सुरक्षा तक की विश्वसनीय श्रृंखला'
      : language === 'mr'
      ? 'अनौपचारिक कबाडीवाल्यापासून अधिकृत राष्ट्रीय पुनर्प्रक्रिया आणि खनिज सुरक्षेपर्यंतची साखळी'
      : 'Bringing informal scrap collectors into the verified formal recycling ecosystem with CPCB compliance.';

  return (
    <div className={`p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden transition-colors ${className}`}>
      {!compact && (
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight font-display">
                {titleText}
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
              CPCB E-Waste Rules 2022
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {subtitleText}
          </p>
        </div>
      )}

      {/* Responsive Horizontal / Scrollable Flow */}
      <div className="relative overflow-x-auto pb-2 pt-1 no-scrollbar">
        <div className="flex items-center min-w-max gap-2 sm:gap-3">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <React.Fragment key={stage.key}>
                <div
                  className={`flex flex-col items-center text-center p-2.5 sm:p-3 rounded-2xl border transition-all min-w-[100px] sm:min-w-[110px] max-w-[125px] ${
                    isCurrent
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-md'
                      : isCompleted
                      ? 'bg-white dark:bg-slate-950 border-emerald-300 dark:border-emerald-800/60 text-slate-800 dark:text-slate-200 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs mb-2 transition-all ${
                      isCurrent
                        ? 'bg-emerald-600 text-white font-black shadow-md'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/60'
                        : 'bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>

                  <span className={`text-[11px] font-black leading-tight block ${isCurrent ? 'text-emerald-900 dark:text-white' : isCompleted ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                    {stage.label[language] || stage.label.en}
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-0.5 leading-tight truncate w-full">
                    {stage.sub[language] || stage.sub.en}
                  </span>
                </div>

                {idx < stages.length - 1 && (
                  <div
                    className={`w-4 sm:w-6 h-0.5 shrink-0 rounded-full ${
                      idx < activeIndex ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
