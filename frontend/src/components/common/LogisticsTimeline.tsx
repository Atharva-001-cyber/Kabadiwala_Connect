import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  Truck, 
  Scale, 
  FileCheck2, 
  MapPin, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { Lot, Pickup, LotStatus, PickupStatus } from '../../types';
import { getStatusLabel } from '../../i18n/translations';

interface LogisticsTimelineProps {
  lot?: Lot;
  pickup?: Pickup;
  className?: string;
}

export const LogisticsTimeline: React.FC<LogisticsTimelineProps> = ({
  lot,
  pickup,
  className = ''
}) => {
  const { language } = useLanguage();

  // Real backend milestone steps
  const steps = [
    {
      key: 'REQUESTED',
      label: { en: 'Scrap Lot Requested', hi: 'स्क्रैप लॉट अनुरोधित', mr: 'स्क्रॅप लॉट विनंती केली' },
      desc: { en: 'Lot created and published to authorized recyclers', hi: 'लॉट निर्मित व अधिकृत खरीदारों को भेजा गया', mr: 'लॉट तयार करून रीसायकलरना पाठवला' },
      isPassed: Boolean(lot),
      isCurrent: lot?.status === 'CREATED' || lot?.status === 'OFFER_RECEIVED',
      timestamp: lot?.createdAt
    },
    {
      key: 'ACCEPTED',
      label: { en: 'Offer Accepted', hi: 'पारदर्शी भाव स्वीकृत', mr: 'पारदर्शक दर मान्य' },
      desc: { en: 'Collector locked deal with competitive recycler bid', hi: 'कलेक्टर द्वारा सर्वोत्तम दर स्वीकृत', mr: 'कलेक्टरने सर्वोत्तम दर निवडला' },
      isPassed: ['ACCEPTED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'RECEIVED', 'RECYCLER_RECEIVED', 'SORTED', 'PROCESSING', 'RECOVERED', 'RECYCLED'].includes(lot?.status || ''),
      isCurrent: lot?.status === 'ACCEPTED',
      timestamp: lot?.updatedAt
    },
    {
      key: 'ASSIGNED',
      label: { en: 'Pickup Assigned & Scheduled', hi: 'पिकअप वाहन निर्धारित', mr: 'पिकअप वाहन निश्चित' },
      desc: { 
        en: pickup?.scheduledDate ? `Scheduled for ${new Date(pickup.scheduledDate).toLocaleDateString('en-IN')}` : 'Doorstep vehicle scheduled by recycler', 
        hi: pickup?.scheduledDate ? `दिनांक ${new Date(pickup.scheduledDate).toLocaleDateString('en-IN')} हेतु निर्धारित` : 'रीसाइक्लर द्वारा डोरस्टेप वाहन निर्धारित', 
        mr: pickup?.scheduledDate ? `तारीख ${new Date(pickup.scheduledDate).toLocaleDateString('en-IN')} साठी नियोजित` : 'रीसायकलरद्वारे वाहन नियोजित' 
      },
      isPassed: ['PICKUP_SCHEDULED', 'PICKED_UP', 'RECEIVED', 'RECYCLER_RECEIVED', 'SORTED', 'PROCESSING', 'RECOVERED', 'RECYCLED'].includes(lot?.status || '') || pickup?.status === 'SCHEDULED' || pickup?.status === 'IN_TRANSIT' || pickup?.status === 'COMPLETED',
      isCurrent: lot?.status === 'PICKUP_SCHEDULED' && (!pickup || pickup?.status === 'SCHEDULED'),
      meta: pickup?.vehicleNumber ? `Vehicle: ${pickup.vehicleNumber}` : undefined
    },
    {
      key: 'IN_TRANSIT',
      label: { en: 'Vehicle In-Transit', hi: 'वाहन रास्ते में है', mr: 'वाहन मार्गावर आहे' },
      desc: { en: 'Recycler logistics vehicle moving to collection point', hi: 'रीसाइक्लर वाहन संग्रह स्थल की ओर अग्रसर', mr: 'रीसायकलर वाहन संकलन केंद्राकडे येत आहे' },
      isPassed: ['PICKED_UP', 'RECEIVED', 'RECYCLER_RECEIVED', 'SORTED', 'PROCESSING', 'RECOVERED', 'RECYCLED'].includes(lot?.status || '') || pickup?.status === 'IN_TRANSIT' || pickup?.status === 'COMPLETED',
      isCurrent: pickup?.status === 'IN_TRANSIT' || lot?.status === 'PICKED_UP'
    },
    {
      key: 'COLLECTED',
      label: { en: 'Weighed & Handed Over', hi: 'कांटा वजन व सत्यापन', mr: 'काटा वजन व पडताळणी' },
      desc: { 
        en: lot?.actualWeight ? `Verified scale weight: ${lot.actualWeight} kg` : 'Digital scale verification with 4-digit OTP', 
        hi: lot?.actualWeight ? `कांटे का प्रमाणित वजन: ${lot.actualWeight} किलो` : 'डिजिटल कांटे का वजन व 4-अंकों का OTP', 
        mr: lot?.actualWeight ? `काट्यावरील प्रत्यक्ष वजन: ${lot.actualWeight} किलो` : 'काटा पडताळणी व 4-अंकी OTP' 
      },
      isPassed: ['RECEIVED', 'RECYCLER_RECEIVED', 'SORTED', 'PROCESSING', 'RECOVERED', 'RECYCLED'].includes(lot?.status || '') || pickup?.status === 'COMPLETED',
      isCurrent: lot?.status === 'RECEIVED' || lot?.status === 'RECYCLER_RECEIVED',
      meta: lot?.handoverOtp ? `OTP: ${lot.handoverOtp}` : undefined
    },
    {
      key: 'COMPLETED',
      label: { en: 'Recycled & Settled', hi: 'पुनर्चक्रित व भुगतान संपन्न', mr: 'पुनर्प्रक्रिया व देयक पूर्ण' },
      desc: { en: 'Form-6 certificate issued, ledger voucher generated', hi: 'CPCB Form-6 जारी, लेजर वाउचर प्राप्त', mr: 'CPCB Form-6 जारी, पावती जमा' },
      isPassed: lot?.status === 'RECYCLED',
      isCurrent: lot?.status === 'RECYCLED'
    }
  ];

  return (
    <div className={`p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-purple-400" />
          <h4 className="text-sm sm:text-base font-black text-white">
            {language === 'hi' ? 'लॉजिस्टिक्स एवं पिकअप प्रगति' : language === 'mr' ? 'लॉजिस्टिक्स व पिकअप प्रगती' : 'Logistics & Handover Timeline'}
          </h4>
        </div>
        {lot?.status && (
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
            Status: {getStatusLabel(lot.status, language)}
          </span>
        )}
      </div>

      <div className="space-y-4 pt-1">
        {steps.map((step, idx) => {
          const isDone = step.isPassed;
          const isCurr = step.isCurrent;

          return (
            <div key={step.key} className="flex items-start gap-3.5 relative group">
              {/* Timeline Connector Line */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute left-4 top-8 w-0.5 h-[calc(100%+0.5rem)] -ml-[1px] ${
                    isDone ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                />
              )}

              {/* Node Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                  isCurr
                    ? 'bg-purple-600 text-white ring-4 ring-purple-900/50 shadow-lg'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : isCurr ? (
                  <Clock className="w-4 h-4 text-white animate-spin-slow" />
                ) : (
                  <span className="text-xs font-bold text-slate-500">{idx + 1}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h5 className={`text-xs sm:text-sm font-black tracking-tight ${isCurr ? 'text-purple-300' : isDone ? 'text-white' : 'text-slate-500'}`}>
                    {step.label[language] || step.label.en}
                  </h5>
                  {step.meta && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {step.meta}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {step.desc[language] || step.desc.en}
                </p>
                {step.timestamp && (
                  <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                    {new Date(step.timestamp).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
