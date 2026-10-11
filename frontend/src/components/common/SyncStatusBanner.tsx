import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useSync } from '../../context/SyncContext';
import { useLanguage } from '../../context/LanguageContext';
import { OfflineDraftList } from './OfflineDraftList';
import { useOfflineReadiness } from '../../services/offlineReadiness';

export const SyncStatusBanner: React.FC = () => {
  const { isOnline, pendingCount, failedCount, legacyCount, isSyncing, syncNow } = useSync();
  const { t, language } = useLanguage();
  const setup = useOfflineReadiness();
  const { ready, storageWarning } = setup;
  const label = (en: string, hi: string, mr: string) => language === 'hi' ? hi : language === 'mr' ? mr : en;
  const offlineText = ready ? label('Offline app and AI files available.', 'ऑफलाइन ऐप और AI फ़ाइलें उपलब्ध हैं।', 'ऑफलाइन अ‍ॅप आणि AI फाइल्स उपलब्ध आहेत.') :
    setup.state === 'development' ? label('Offline caching is disabled in development; use production preview.', 'डेवलपमेंट में ऑफलाइन कैश बंद है; प्रोडक्शन प्रीव्यू इस्तेमाल करें।', 'डेव्हलपमेंटमध्ये ऑफलाइन कॅश बंद आहे; प्रॉडक्शन प्रीव्ह्यू वापरा.') :
    setup.state === 'unsupported' ? label('Offline setup needs a supported browser and HTTPS.', 'ऑफलाइन सेटअप के लिए समर्थित ब्राउज़र और HTTPS चाहिए।', 'ऑफलाइन सेटअपसाठी समर्थित ब्राउझर आणि HTTPS आवश्यक आहे.') :
    setup.state === 'registration_failed' ? label('Offline setup could not start. Retry when online.', 'ऑफलाइन सेटअप शुरू नहीं हुआ। ऑनलाइन फिर कोशिश करें।', 'ऑफलाइन सेटअप सुरू झाला नाही. ऑनलाइन पुन्हा प्रयत्न करा.') :
    setup.state === 'worker_timeout' ? label('Offline status check timed out. Retry setup.', 'ऑफलाइन स्थिति की जाँच का समय समाप्त हुआ। फिर कोशिश करें।', 'ऑफलाइन स्थिती तपासणीची वेळ संपली. पुन्हा प्रयत्न करा.') :
    setup.state === 'legacy' ? label('Older offline setup detected. Retry to check for an update; save work before reopening all app tabs.', 'पुराना ऑफलाइन सेटअप है। अपडेट जाँचने के लिए फिर कोशिश करें; टैब दोबारा खोलने से पहले काम सेव करें।', 'जुना ऑफलाइन सेटअप आहे. अपडेट तपासा; टॅब पुन्हा उघडण्यापूर्वी काम सेव्ह करा.') :
    setup.state === 'downloading' ? label('Downloading offline files', 'ऑफलाइन फ़ाइलें डाउनलोड हो रही हैं', 'ऑफलाइन फाइल्स डाउनलोड होत आहेत') :
    setup.state === 'checking' || setup.state === 'starting' ? label('Checking offline setup…', 'ऑफलाइन सेटअप जाँच रहे हैं…', 'ऑफलाइन सेटअप तपासत आहे…') :
    setup.appReady ? label('Offline app ready; AI files incomplete. Manual category selection is available.', 'ऑफलाइन ऐप तैयार है; AI फ़ाइलें अधूरी हैं। श्रेणी स्वयं चुन सकते हैं।', 'ऑफलाइन अ‍ॅप तयार; AI फाइल्स अपूर्ण. श्रेणी स्वतः निवडू शकता.') :
    label('Offline app files incomplete. Connect to the internet and retry setup.', 'ऑफलाइन ऐप फ़ाइलें अधूरी हैं। इंटरनेट जोड़कर फिर कोशिश करें।', 'ऑफलाइन अ‍ॅप फाइल्स अपूर्ण. इंटरनेट जोडून पुन्हा प्रयत्न करा.');

  if (!import.meta.env.PROD && isOnline && pendingCount === 0 && legacyCount === 0 && !storageWarning) {
    return null; // Clean UI when everything is synced
  }

  return (
    <div
      className={`w-full py-2 px-4 text-xs sm:text-sm font-medium flex items-center justify-between transition-colors ${
        !isOnline
          ? 'bg-red-900/90 text-red-100 border-b border-red-700'
          : pendingCount > 0 || failedCount > 0 || !ready || storageWarning
          ? 'bg-amber-900/90 text-amber-100 border-b border-amber-700'
          : 'bg-emerald-900/90 text-emerald-100 border-b border-emerald-700'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 max-w-xl" role="status" aria-live="polite">
        <OfflineDraftList />
        <span>{offlineText} {!ready && setup.total > 0 && ` (${setup.completed}/${setup.total} ${label('files', 'फ़ाइलें', 'फाइल्स')})`}</span>
        {(!ready && (setup.missing.length > 0 || Object.keys(setup.failures).length > 0)) && <details className="w-full text-xs">
          <summary className="cursor-pointer">{label('Offline setup details', 'ऑफलाइन सेटअप विवरण', 'ऑफलाइन सेटअप तपशील')}</summary>
          {Object.entries(setup.failures).map(([path, reason]) => <div className="break-all" key={path}>{path}: {reason}</div>)}
          {setup.missing.map(path => <div className="break-all" key={path}>{label('Not downloaded', 'डाउनलोड नहीं हुआ', 'डाउनलोड झाले नाही')}: {path}</div>)}
        </details>}
        {setup.updateWaiting && <span>{label('Update waiting. Save your work, then close all app tabs and reopen to apply safely.', 'अपडेट बाकी है। काम सेव करके सभी ऐप टैब बंद करें और फिर खोलें।', 'अपडेट प्रतीक्षेत. काम सेव्ह करून सर्व अ‍ॅप टॅब बंद करा आणि पुन्हा उघडा.')}</span>}
        {!ready && import.meta.env.PROD && !['unsupported', 'checking', 'downloading'].includes(setup.state) && <button type="button"
          onClick={() => void setup.retry()} disabled={!isOnline || setup.retrying}
          className="px-3 py-1 rounded border border-current disabled:opacity-50">
          {setup.retrying ? label('Retrying…', 'फिर कोशिश हो रही है…', 'पुन्हा प्रयत्न सुरू…') : label('Retry offline setup', 'ऑफलाइन सेटअप फिर करें', 'ऑफलाइन सेटअप पुन्हा करा')}
        </button>}
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
            <span>{failedCount > 0 || legacyCount > 0 ? label('Cloud uploads need attention.', 'क्लाउड अपलोड की जाँच करें।', 'क्लाउड अपलोड तपासा.') : label('Cloud sync: no pending lot uploads.', 'क्लाउड सिंक: कोई लॉट अपलोड बाकी नहीं।', 'क्लाउड सिंक: लॉट अपलोड बाकी नाहीत.')}</span>
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
