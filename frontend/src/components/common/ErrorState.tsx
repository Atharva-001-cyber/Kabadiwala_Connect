import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  className = ''
}) => {
  const { language } = useLanguage();

  const defaultTitle =
    language === 'hi'
      ? 'डेटा लोड करने में असमर्थ'
      : language === 'mr'
      ? 'डेटा लोड करण्यात त्रुटी'
      : 'Unable to load data';

  const defaultMessage =
    language === 'hi'
      ? 'कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।'
      : language === 'mr'
      ? 'कृपया तुमचे इंटरनेट कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.'
      : 'Please check your connection and try again.';

  const retryText =
    language === 'hi' ? 'पुनः प्रयास करें' : language === 'mr' ? 'पुन्हा प्रयत्न करा' : 'Retry';

  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl bg-rose-950/30 border border-rose-800/60 text-center max-w-md mx-auto my-6 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-900/40 border border-rose-700/60 flex items-center justify-center text-rose-400 mx-auto mb-3 shadow">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-black text-white">{title || defaultTitle}</h3>
      <p className="text-xs text-rose-300 mt-1 max-w-xs mx-auto leading-relaxed">
        {message || defaultMessage}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{retryText}</span>
        </button>
      )}
    </div>
  );
};
