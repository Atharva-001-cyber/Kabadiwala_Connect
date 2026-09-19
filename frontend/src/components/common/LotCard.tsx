import React from 'react';
import { 
  Scale, 
  MapPin, 
  Calendar, 
  User, 
  ArrowRight, 
  FileText,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { Lot } from '../../types';
import { getCategoryLabel, formatUserDisplayName, formatLocationString } from '../../i18n/translations';
import { StatusBadge } from './StatusBadge';
import { SafeImage } from './SafeImage';
import { formatWeight } from '../../utils/formatters';

interface LotCardProps {
  lot: Lot;
  actionText?: string;
  onAction?: (lot: Lot) => void;
  secondaryActionText?: string;
  onSecondaryAction?: (lot: Lot) => void;
  className?: string;
}

export const LotCard: React.FC<LotCardProps> = ({
  lot,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  className = ''
}) => {
  const { language } = useLanguage();

  const formattedDate = new Date(lot.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const displayWeight = lot.actualWeight != null ? lot.actualWeight : lot.approxWeight;
  const isActualWeight = lot.actualWeight != null;

  return (
    <div
      className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group ${className}`}
    >
      <div>
        {/* Top Header: Lot ID + Status Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs font-black text-slate-800 dark:text-emerald-400 truncate bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800">
              #{lot.id}
            </span>
            {lot.dataSource === 'LIVE' && (
              <span className="text-[9px] font-mono text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 shrink-0">
                LIVE DB
              </span>
            )}
          </div>
          <StatusBadge status={lot.status} size="sm" />
        </div>

        {/* Image & Material Identity */}
        <div className="flex gap-3.5 items-start">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shrink-0 relative shadow-inner">
            <SafeImage
              src={lot.imageUrl || (lot.imageUrls && lot.imageUrls[0]) || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400'}
              alt={lot.materialCategory}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight truncate">
              {getCategoryLabel(lot.subCategory || lot.materialCategory, language)}
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
              {lot.description || (language === 'hi' ? 'ई-कचरा सामग्री' : language === 'mr' ? 'ई-कचरा साहित्य' : 'E-Waste Material')}
            </p>

            {/* Weight Badge */}
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black text-amber-700 dark:text-amber-400">
                <Scale className="w-3.5 h-3.5" />
                <span>{formatWeight(displayWeight)} {language === 'hi' || language === 'mr' ? 'किग्रा' : 'kg'}</span>
                {isActualWeight && (
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-normal">
                    ({language === 'hi' ? 'कांटा सत्यापित' : language === 'mr' ? 'काटा प्रमाणित' : 'scale verified'})
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 9 Required Fields Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-[11px]">
          {/* Location */}
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">
              {formatLocationString(lot.locationDistrict || 'Lucknow', lot.locationState || 'UP', language)}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 justify-end min-w-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="truncate font-mono">{formattedDate}</span>
          </div>

          {/* Collector */}
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 min-w-0">
            <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate font-medium">{formatUserDisplayName(lot.collectorName, 'COLLECTOR', language)}</span>
          </div>

          {/* Valuation / Rate */}
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 justify-end min-w-0">
            <span className="text-slate-500 text-[10px]">{language === 'hi' ? 'मूल्य:' : language === 'mr' ? 'मूल्य:' : 'Val:'}</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 truncate">
              {lot.finalSaleValue != null ? `₹${lot.finalSaleValue}` : lot.estimatedValueAvg ? `₹${lot.estimatedValueAvg}` : (language === 'hi' ? 'कोटेशन लंबित' : language === 'mr' ? 'कोटेशन प्रलंबित' : 'Pending Quote')}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      {(actionText || secondaryActionText) && (
        <div className="pt-2 flex items-center gap-2 border-t border-slate-200 dark:border-slate-800/60">
          {secondaryActionText && onSecondaryAction && (
            <button
              type="button"
              onClick={() => onSecondaryAction(lot)}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors truncate"
            >
              {secondaryActionText}
            </button>
          )}

          {actionText && onAction && (
            <button
              type="button"
              onClick={() => onAction(lot)}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 truncate"
            >
              <span>{actionText}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
