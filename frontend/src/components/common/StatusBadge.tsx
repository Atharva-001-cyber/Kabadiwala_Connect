import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { getStatusLabel } from '../../i18n/translations';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
  showIcon = true
}) => {
  const { language } = useLanguage();
  const label = getStatusLabel(status, language);

  const getStyle = (s: string) => {
    switch (s) {
      case 'CREATED':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700/80',
          dot: 'bg-blue-600 dark:bg-blue-400'
        };
      case 'OFFER_RECEIVED':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700/80',
          dot: 'bg-amber-600 dark:bg-amber-400'
        };
      case 'ACCEPTED':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700/80',
          dot: 'bg-emerald-600 dark:bg-emerald-400'
        };
      case 'PICKUP_SCHEDULED':
      case 'SCHEDULED':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-700/80',
          dot: 'bg-purple-600 dark:bg-purple-400'
        };
      case 'IN_TRANSIT':
      case 'PICKED_UP':
        return {
          bg: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-700/80',
          dot: 'bg-cyan-600 dark:bg-cyan-400'
        };
      case 'RECEIVED':
      case 'RECYCLER_RECEIVED':
      case 'SORTED':
        return {
          bg: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/80 dark:text-teal-300 dark:border-teal-700/80',
          dot: 'bg-teal-600 dark:bg-teal-400'
        };
      case 'PROCESSING':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-700/80',
          dot: 'bg-indigo-600 dark:bg-indigo-400 animate-pulse'
        };
      case 'RECOVERED':
      case 'RECYCLED':
      case 'COMPLETED':
      case 'AUTHORIZED':
      case 'RESOLVED':
        return {
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/90 dark:text-emerald-200 dark:border-emerald-500/80 font-black',
          dot: 'bg-emerald-600 dark:bg-emerald-400'
        };
      case 'PENDING_VERIFICATION':
      case 'UNDER_REVIEW':
      case 'OPEN':
        return {
          bg: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/80 dark:text-amber-200 dark:border-amber-600/80',
          dot: 'bg-amber-600 dark:bg-amber-400'
        };
      case 'SUSPENDED':
      case 'CANCELLED':
      case 'REJECTED':
      case 'FAILED':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/90 dark:text-rose-300 dark:border-rose-700/80',
          dot: 'bg-rose-600 dark:bg-rose-400'
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
          dot: 'bg-slate-600 dark:bg-slate-400'
        };
    }
  };

  const style = getStyle(status);

  const sizeClass = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-bold'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold border tracking-wide uppercase ${style.bg} ${sizeClass} ${className}`}
    >
      {showIcon && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />}
      <span className="truncate">{label}</span>
    </span>
  );
};
