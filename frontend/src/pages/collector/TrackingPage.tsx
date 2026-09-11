import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Clock, MapPin, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Key } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Lot, TraceabilityLog, RecyclerProfile } from '../../types';
import { getStatusLabel, getCategoryLabel, formatUserDisplayName, formatLocationString } from '../../i18n/translations';

export const TrackingPage: React.FC = () => {
  const { lotId: paramLotId } = useParams<{ lotId: string }>();
  const { language, t } = useLanguage();
  const { showToast } = useToast();

  const [searchLotId, setSearchLotId] = useState<string>(paramLotId || '');
  const [lot, setLot] = useState<Lot | null>(null);
  const [recycler, setRecycler] = useState<RecyclerProfile | null>(null);
  const [timeline, setTimeline] = useState<TraceabilityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [allLots, setAllLots] = useState<Lot[]>([]);

  // Cryptographic Integrity Verification State
  const [verifyingChain, setVerifyingChain] = useState<boolean>(false);
  const [integrityResult, setIntegrityResult] = useState<any>(null);

  const fetchTraceability = async (targetId: string) => {
    if (!targetId) return;
    setLoading(true);
    setIntegrityResult(null);
    try {
      const res = await api.getTraceability(targetId);
      if (res.success) {
        setLot(res.lot);
        setRecycler(res.recycler || null);
        setTimeline(res.timeline || []);
      }
    } catch (err) {
      console.warn('Traceability fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    if (!lot) return;
    setVerifyingChain(true);
    try {
      const res = await api.verifyTraceabilityIntegrity(lot.id);
      if (res.success) {
        setIntegrityResult(res);
        showToast(
          language === 'hi' 
            ? 'क्रिप्टोग्राफिक ब्लॉकचेन ऑडिट सत्यापित!' 
            : language === 'mr' 
            ? 'क्रिप्टोग्राफिक ब्लॉकचेन ऑडिट सत्यापित!' 
            : 'Cryptographic hash integrity verified!',
          'success'
        );
      }
    } catch (err: any) {
      showToast(err.message || (language === 'hi' ? 'ऑडिट सत्यापन विफल रहा' : language === 'mr' ? 'ऑडिट पडताळणी अयशस्वी झाली' : 'Integrity audit check failed'), 'error');
    } finally {
      setVerifyingChain(false);
    }
  };

  useEffect(() => {
    api.getLots().then(res => {
      if (res.success && res.lots) {
        setAllLots(res.lots);
        if (!paramLotId) {
          if (res.lots.length > 0) {
            setSearchLotId(res.lots[0].id);
            fetchTraceability(res.lots[0].id);
          } else {
            setSearchLotId('');
          }
        }
      }
    }).catch(console.warn);
  }, [paramLotId]);

  useEffect(() => {
    if (paramLotId) {
      setSearchLotId(paramLotId);
      fetchTraceability(paramLotId);
    }
  }, [paramLotId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTraceability(searchLotId.trim());
  };

  // 5 Canonical Milestone Stages
  const stages = [
    { key: 'COLLECTED', label: t.stepCollected, icon: '📦' },
    { key: 'PICKUP_DONE', label: t.stepPickup, icon: '🚚' },
    { key: 'RECYCLER_RECEIVED', label: t.stepReceived, icon: '🏭' },
    { key: 'PROCESSING', label: t.stepProcessing, icon: '⚙️' },
    { key: 'RECYCLED', label: t.stepRecycled, icon: '♻️' }
  ];

  const getStageIndex = (status: string) => {
    if (status === 'CREATED' || status === 'OFFER_RECEIVED' || status === 'ACCEPTED') return 0;
    if (status === 'PICKUP_SCHEDULED' || status === 'PICKED_UP') return 1;
    if (status === 'RECEIVED') return 2;
    if (status === 'PROCESSING') return 3;
    if (status === 'RECYCLED') return 4;
    return 0;
  };

  const currentStageIdx = lot ? getStageIndex(lot.status) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>🔍</span>
            <span>{t.trackingTitle}</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {language === 'hi' ? 'कलेक्टर से लेकर अंतिम धातु पुनर्प्राप्ति तक हर कदम का संपूर्ण ऑडिट रिकॉर्ड' : language === 'mr' ? 'कलेक्टरपासून पुनर्प्रक्रियेपर्यंत प्रत्येक टप्प्याची नोंद' : 'Full chain-of-custody audit logs from field collection to smelting'}
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchLotId}
              onChange={(e) => setSearchLotId(e.target.value)}
              placeholder="EW-LKO-2026-000101"
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white font-mono text-sm font-bold focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-4 h-4 absolute left-3.5 top-4 text-slate-500" />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-extrabold shadow flex items-center gap-1 shrink-0"
          >
            <span>{language === 'hi' ? 'ट्रैक करें' : language === 'mr' ? 'ट्रॅक करा' : 'Track'}</span>
          </button>
        </form>

        {/* Quick Sample Selector */}
        {allLots.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
            <span className="text-slate-500 shrink-0">{language === 'hi' ? 'आपके लॉट:' : language === 'mr' ? 'आपले लॉट:' : 'Your Lots:'}</span>
            {allLots.slice(0, 4).map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  setSearchLotId(l.id);
                  fetchTraceability(l.id);
                }}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold shrink-0 transition-all ${
                  searchLotId === l.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {l.id}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">{language === 'hi' ? 'ट्रैसेबिलिटी लोड हो रही है...' : language === 'mr' ? 'ट्रॅकिंग लोड होत आहे...' : 'Loading traceability...'}</div>
      ) : !lot ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
          {language === 'hi' ? 'लॉट आईडी नहीं मिली। कृपया सही लॉट संख्या दर्ज करें।' : language === 'mr' ? 'लॉट क्रमांक आढळला नाही. कृपया अचूक क्रमांक टाका.' : 'Lot ID not found. Please enter a valid identifier.'}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Lot Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-400">{lot.id}</span>
                <h2 className="text-lg font-black text-white">{getCategoryLabel(lot.materialCategory, language)}</h2>
              </div>
              <span className="px-3 py-1 bg-emerald-950 text-emerald-300 text-xs font-extrabold rounded-full border border-emerald-800">
                {getStatusLabel(lot.status, language)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">{language === 'hi' ? 'कलेक्टर' : language === 'mr' ? 'कलेक्टर' : 'Collector'}</span>
                <span className="font-bold text-white truncate block">
                  {formatUserDisplayName(lot.collectorName, 'COLLECTOR', language)}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">{language === 'hi' ? 'सामग्री स्थिति' : language === 'mr' ? 'साहित्य स्थिती' : 'Condition'}</span>
                <span className="font-bold text-amber-300 text-xs truncate block">
                  {lot.condition === 'INTACT'
                    ? (language === 'hi' ? '🟢 साबुत (Intact)' : language === 'mr' ? '🟢 अखंड (Intact)' : '🟢 Intact')
                    : lot.condition === 'DAMAGED'
                    ? (language === 'hi' ? '🟡 क्षतिग्रस्त (Damaged)' : language === 'mr' ? '🟡 खराब (Damaged)' : '🟡 Damaged')
                    : (language === 'hi' ? '🟠 खुला हुआ (Dismantled)' : language === 'mr' ? '🟠 वेगळे केलेले (Dismantled)' : '🟠 Dismantled')}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">{language === 'hi' ? 'कुल वजन' : language === 'mr' ? 'एकूण वजन' : 'Weight'}</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {lot.approxWeight} {language === 'hi' ? 'किग्रा' : language === 'mr' ? 'किलो' : 'kg'}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">{language === 'hi' ? 'स्थान' : language === 'mr' ? 'स्थान' : 'District'}</span>
                <span className="font-bold text-white">
                  {formatLocationString(lot.locationDistrict, '', language)}
                </span>
              </div>
            </div>

            {/* 5-Stage Stepper Progress Bar */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>{language === 'hi' ? 'प्रगति यात्रा:' : language === 'mr' ? 'प्रगती प्रवास:' : 'Lifecycle Progression:'}</span>
                <span className="text-emerald-400 font-extrabold">{currentStageIdx + 1} / 5 {language === 'hi' ? 'चरण पूर्ण' : language === 'mr' ? 'टप्पे पूर्ण' : 'Stages Complete'}</span>
              </div>

              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {stages.map((stage, idx) => {
                  const isCompleted = idx <= currentStageIdx;
                  const isCurrent = idx === currentStageIdx;

                  return (
                    <div key={stage.key} className="flex flex-col items-center gap-1.5 text-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCompleted
                            ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/40'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <span className={`text-[9px] font-extrabold leading-tight ${isCurrent ? 'text-emerald-400' : isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cryptographic SHA-256 Audit Chain Verification Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-extrabold text-sm text-white">{language === 'hi' ? 'क्रिप्टोग्राफिक SHA-256 ऑडिट चेन' : language === 'mr' ? 'क्रिप्टोग्राफिक SHA-256 ऑडिट साखळी' : 'Cryptographic SHA-256 Merkle Chain'}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'hi' ? 'प्रत्येक इवेंट पिछले हैश से क्रिप्टोग्राफिकली लिंक है' : language === 'mr' ? 'प्रत्येक नोंद मागील हॅशशी जोडलेली आहे' : 'Every event cryptographically links to the previous SHA-256 hash'}
                </p>
              </div>

              <button
                onClick={handleVerifyIntegrity}
                disabled={verifyingChain}
                className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 shadow active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${verifyingChain ? 'animate-spin' : ''}`} />
                <span>{verifyingChain ? (language === 'hi' ? 'सत्यापित हो रहा...' : language === 'mr' ? 'तपासत आहे...' : 'Verifying...') : (language === 'hi' ? 'ऑडिट सत्यापित करें' : language === 'mr' ? 'ऑडिट तपासा' : 'Verify Integrity')}</span>
              </button>
            </div>

            {integrityResult && (
              <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                integrityResult.isTamperFree
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                  : 'bg-red-950/70 border-red-500/50 text-red-200'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {integrityResult.isTamperFree ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>{language === 'hi' ? '100% पूर्ण अखंडता सत्यापित' : language === 'mr' ? '१००% अखंडता प्रमाणित' : '100% Tamper-Free & Verified'} (All {integrityResult.totalEvents} Events)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <span>श्रृंखला विसंगति पाई गई! (Compromised Event ID: {integrityResult.compromisedEventId})</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] opacity-90">
                  {language === 'hi' ? 'एल्गोरिदम:' : language === 'mr' ? 'अल्गोरिदम:' : 'Algorithm:'} <span className="font-mono">{integrityResult.algorithm}</span>
                </p>
              </div>
            )}
          </div>

          {/* Chronological Audit Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>{language === 'hi' ? 'सत्यापित समयरेखा' : language === 'mr' ? 'प्रमाणित वेळेची नोंद' : 'Immutable Chain of Custody Logs'}</span>
            </h3>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
              {timeline.map((item, idx) => (
                <div key={item.id || idx} className="relative flex items-start gap-4 pl-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow shrink-0 z-10 ring-4 ring-slate-900">
                    ✓
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex-1 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <h4 className="font-extrabold text-sm text-white">{item.title}</h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(item.timestamp).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                    
                    {/* Cryptographic SHA-256 Hashes Display */}
                    {item.eventHash && (
                      <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800/80 font-mono text-[10px] text-slate-400 space-y-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <Key className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="text-slate-500">Hash:</span>
                          <span className="text-emerald-400 truncate">{item.eventHash}</span>
                        </div>
                        {item.previousEventHash && (
                          <div className="flex items-center gap-1.5 truncate pl-4.5">
                            <span className="text-slate-500">Prev:</span>
                            <span className="text-slate-400 truncate">{item.previousEventHash.slice(0, 24)}...</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>{item.facilityLocation}</span>
                      </span>
                      <span className="font-bold text-slate-300">
                        {language === 'hi' ? 'द्वारा:' : language === 'mr' ? 'द्वारे:' : 'By:'} {formatUserDisplayName(item.actorName, item.actorRole as any, language)} ({item.actorRole === 'COLLECTOR' ? t.roleCollector : item.actorRole === 'RECYCLER' ? t.roleRecycler : item.actorRole === 'ADMIN' ? t.roleAdmin : item.actorRole})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
