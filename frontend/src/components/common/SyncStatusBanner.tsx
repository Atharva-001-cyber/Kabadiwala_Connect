import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useSync } from '../../context/SyncContext';
import { useLanguage } from '../../context/LanguageContext';
import { OfflineDraftList } from './OfflineDraftList';
import { useOfflineReadiness } from '../../services/offlineReadiness';

export const SyncStatusBanner: React.FC = () => {
  const { isOnline, pendingCount, failedCount, legacyCount, isSyncing, syncNow } = useSync();
  const { t, language } = useLanguage();
  const { ready, storageWarning } = useOfflineReadiness();

  if (!import.meta.env.PROD && isOnline && pendingCount === 0 && legacyCount === 0 && !storageWarning) {
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
      <div className="flex flex-wrap items-center gap-2 max-w-xl" role="status" aria-live="polite">
        <OfflineDraftList />
        <span>{ready ? (language === 'hi' ? 'ऑफलाइन ऐप और AI फ़ाइलें उपलब्ध हैं।' : language === 'mr' ? 'ऑफलाइन अ‍ॅप आणि AI फाइल्स उपलब्ध आहेत.' : 'Offline app and AI files available.') : (language === 'hi' ? 'ऑफलाइन डाउनलोड बाकी/अनुपलब्ध — AI न चले तो श्रेणी स्वयं चुनें।' : language === 'mr' ? 'ऑफलाइन डाउनलोड बाकी/अनुपलब्ध — AI न चालल्यास श्रेणी निवडा.' : 'Offline setup pending/unavailable. If AI is unavailable, select category manually.')}</span>
        {storageWarning && <span>Device storage nearly full. Keep pending drafts; free other storage before adding photos.</span>}
        {failedCount > 0 && <span>{failedCount} {language === 'hi' ? 'अपलोड असफल — ड्राफ्ट सुरक्षित है। दोबारा कोशिश करें।' : language === 'mr' ? 'अपलोड अयशस्वी — मसुदे सुरक्षित आहेत.' : 'uploads need attention. Drafts retained; retry or contact support.'}</span>}
        {legacyCount > 0 && <span>{legacyCount} {language === 'hi' ? 'पुराने ड्राफ्ट का खाता अज्ञात है; सहायता से रिकवर करें।' : language === 'mr' ? 'जुन्या मसुद्यांचे खाते अज्ञात आहे; मदत घ्या.' : 'legacy drafts have no owner; contact support for recovery. Not deleted.'}</span>}
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
            <span>{t.offlineMode} — {language === 'hi' ? 'नए लॉट फ़ोन में सुरक्षित सेव होंगे' : language === 'mr' ? 'नवीन लॉट फोनमध्ये सुरक्षित सेव्ह होतील' : 'New lots saved safely on device'}</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <RefreshCw className={`w-4 h-4 text-amber-400 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{pendingCount} {isSyncing ? (language === 'hi' ? 'लॉट सिंक हो रहे हैं' : language === 'mr' ? 'लॉट सिंक होत आहेत' : 'lots syncing') : (language === 'hi' ? 'लॉट फोन पर सुरक्षित — अपलोड बाकी' : language === 'mr' ? 'लॉट फोनवर सुरक्षित — अपलोड बाकी' : 'lots saved on device — upload pending')}</span>
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
