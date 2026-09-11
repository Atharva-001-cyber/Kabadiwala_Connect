import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useSync } from '../../context/SyncContext';
import { useLanguage } from '../../context/LanguageContext';

export const SyncStatusBanner: React.FC = () => {
  const { isOnline, pendingCount, isSyncing, syncNow } = useSync();
  const { t, language } = useLanguage();

  if (isOnline && pendingCount === 0) {
    return null; // Clean UI when everything is synced
  }

  return (
    <div
      className={`w-full py-2 px-4 text-xs sm:text-sm font-medium flex items-center justify-between transition-colors ${
        !isOnline
          ? 'bg-red-900/90 text-red-100 border-b border-red-700'
          : pendingCount > 0
          ? 'bg-amber-900/90 text-amber-100 border-b border-amber-700'
          : 'bg-emerald-900/90 text-emerald-100 border-b border-emerald-700'
      }`}
    >
      <div className="flex items-center gap-2 max-w-xl truncate">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
            <span>{t.offlineMode} — {language === 'hi' ? 'नए लॉट फ़ोन में सुरक्षित सेव होंगे' : language === 'mr' ? 'नवीन लॉट फोनमध्ये सुरक्षित सेव्ह होतील' : 'New lots saved safely on device'}</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <RefreshCw className={`w-4 h-4 text-amber-400 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{pendingCount} {language === 'hi' ? 'लॉट फ़ोन में सेव हैं — सर्वर पर सिंक हो रहे हैं' : language === 'mr' ? 'लॉट फोनमध्ये सेव्ह आहेत — सर्व्हरवर सिंक होत आहेत' : 'lots stored on device — syncing to server'}</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{t.syncedStatus}</span>
          </>
        )}
      </div>

      {isOnline && pendingCount > 0 && (
        <button
          onClick={() => syncNow()}
          disabled={isSyncing}
          className="ml-2 px-3 py-1 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white rounded text-xs font-semibold flex items-center gap-1 shrink-0"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? (language === 'hi' ? 'सिंक हो रहा...' : language === 'mr' ? 'सिंक होत आहे...' : 'Syncing...') : (language === 'hi' ? 'अभी सिंक करें' : language === 'mr' ? 'आत्ता सिंक करा' : 'Sync Now')}
        </button>
      )}
    </div>
  );
};
