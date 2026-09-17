import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, PackageOpen } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
  onAction?: () => void;
  action?: {
    label: string;
    onClick?: () => void;
    to?: string;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = PackageOpen,
  title,
  description,
  actionText,
  actionLink,
  onAction,
  action,
  className = ''
}) => {
  const effectiveActionText = action?.label || actionText;
  const effectiveActionLink = action?.to || actionLink;
  const effectiveOnAction = action?.onClick || onAction;

  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === 'function') {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className="w-8 h-8 text-slate-400" />;
    }
    return <PackageOpen className="w-8 h-8 text-slate-400" />;
  };

  return (
    <div
      className={`p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/90 flex flex-col items-center justify-center max-w-lg mx-auto my-6 shadow-sm transition-colors ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4 shadow-sm">
        {renderIcon()}
      </div>
      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-sm leading-relaxed">
        {description}
      </p>

      {effectiveActionText && (
        <div className="mt-5">
          {effectiveActionLink ? (
            <Link
              to={effectiveActionLink}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black shadow-lg shadow-emerald-950/40 transition-all"
            >
              {effectiveActionText}
            </Link>
          ) : effectiveOnAction ? (
            <button
              type="button"
              onClick={effectiveOnAction}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black shadow-lg shadow-emerald-950/40 transition-all"
            >
              {effectiveActionText}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};
