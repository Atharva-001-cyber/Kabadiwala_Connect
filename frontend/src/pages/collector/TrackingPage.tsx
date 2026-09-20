import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Search, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Key, 
  Volume2, 
  VolumeX, 
  FileText, 
  QrCode, 
  X, 
  Printer, 
  Building2,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useSpeech } from '../../hooks/useSpeech';
import { api } from '../../services/api';
import { onPlatformSync } from '../../services/realtime';
import { Lot, TraceabilityLog, RecyclerProfile } from '../../types';
import { getStatusLabel, getCategoryLabel, formatUserDisplayName, formatLocationString } from '../../i18n/translations';
import { MaterialJourney } from '../../components/common/MaterialJourney';
import { LogisticsTimeline } from '../../components/common/LogisticsTimeline';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { UrbanMiningVisualizer } from '../../components/common/UrbanMiningVisualizer';

export const TrackingPage: React.FC = () => {
  const { lotId: paramLotId } = useParams<{ lotId: string }>();
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const { speak, stop, isSpeaking } = useSpeech();

  const [searchLotId, setSearchLotId] = useState<string>(paramLotId || '');
  const [lot, setLot] = useState<Lot | null>(null);
  const [recycler, setRecycler] = useState<RecyclerProfile | null>(null);
  const [timeline, setTimeline] = useState<TraceabilityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [allLots, setAllLots] = useState<Lot[]>([]);

  // Cryptographic Integrity Verification State
  const [verifyingChain, setVerifyingChain] = useState<boolean>(false);
  const [integrityResult, setIntegrityResult] = useState<any>(null);

  // Digital CPCB Form-6 Manifest Modal
  const [showManifestModal, setShowManifestModal] = useState<boolean>(false);

  const fetchTraceability = async (targetId: string, silent = false) => {
    if (!targetId) return;
    if (!silent && !lot) setLoading(true);
    setIntegrityResult(null);
    try {
      const res = await api.getTraceability(targetId);
      if (res.success && res.lot) {
        setLot(res.lot);
        setRecycler(res.recycler || null);
        setTimeline(res.timeline || []);
      } else {
        setLot(null);
        setRecycler(null);
        setTimeline([]);
      }
    } catch (err) {
      console.warn('Traceability fetch error:', err);
      setLot(null);
      setRecycler(null);
      setTimeline([]);
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
    let collectorId = '';
    try {
      const cp = localStorage.getItem('collectorProfile');
      const u = localStorage.getItem('user');
      if (cp) collectorId = JSON.parse(cp)?.id;
      if (!collectorId && u) collectorId = JSON.parse(u)?.id;
    } catch {}

    const loadLots = async () => {
      const isRealCollector = collectorId && collectorId !== 'col_1';
      let res = await api.getLots(collectorId ? { collectorId } : {});
      if (!isRealCollector && res.success && res.lots.length === 0) {
        res = await api.getLots({});
      }
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
    };
    loadLots().catch(console.warn);
  }, [paramLotId]);

  useEffect(() => {
    if (paramLotId) {
      setSearchLotId(paramLotId);
      fetchTraceability(paramLotId);
    }
  }, [paramLotId]);

  // Real-time synchronization when Recycler verifies scale or advances lifecycle stages
  useEffect(() => {
    const unsubscribeSync = onPlatformSync(() => {
      if (searchLotId) {
        fetchTraceability(searchLotId);
      }
    });
    return () => {
      unsubscribeSync();
    };
  }, [searchLotId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTraceability(searchLotId.trim());
  };

  // 5 Canonical Milestone Stages
  const stages = [
    { key: 'COLLECTED', label: t.stepCollected || 'Lot Created' },
    { key: 'PICKUP_DONE', label: t.stepPickup || 'Pickup Scheduled' },
    { key: 'RECYCLER_RECEIVED', label: t.stepReceived || 'Facility Received' },
    { key: 'PROCESSING', label: t.stepProcessing || 'Processing Active' },
    { key: 'RECYCLED', label: t.stepRecycled || 'Recycled & Recovered' }
  ];

  const getStageIndex = (status: string) => {
    if (status === 'CREATED' || status === 'OFFER_RECEIVED' || status === 'ACCEPTED') return 0;
    if (status === 'PICKUP_SCHEDULED' || status === 'PICKED_UP') return 1;
    if (status === 'RECEIVED' || status === 'RECYCLER_RECEIVED') return 2;
    if (status === 'SORTED' || status === 'PROCESSING' || status === 'RECOVERED') return 3;
    if (status === 'RECYCLED') return 4;
    return 0;
  };

  const currentStageIdx = lot ? getStageIndex(lot.status) : 0;

  // Professional locale date formatting
  const formatAuditDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Vernacular Voice Text-to-Speech Output
  const speakLifecycleStatus = () => {
    if (!lot) return;
    const catName = getCategoryLabel(lot.materialCategory, language);
    const stageName = stages[currentStageIdx]?.label || '';
    const currentStatusText = getStatusLabel(lot.status, language);

    const text = language === 'hi'
      ? `लॉट ${lot.id} की वर्तमान स्थिति ${currentStatusText} है। कुल वजन ${lot.approxWeight} किलोग्राम ${catName} है। यह वर्तमान में 5 में से चरण ${currentStageIdx + 1}, ${stageName} पर है।`
      : language === 'mr'
      ? `लॉट ${lot.id} ची सध्याची स्थिती ${currentStatusText} आहे. एकूण वजन ${lot.approxWeight} किलो ${catName} आहे. हा ५ पैकी टप्पा ${currentStageIdx + 1}, ${stageName} वर आहे.`
      : `Lot ${lot.id} current status is ${currentStatusText}. Consignment weight: ${lot.approxWeight} kg of ${catName}. Current milestone is stage ${currentStageIdx + 1} of 5, ${stageName}.`;

    speak(text, language);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Header & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>🔍</span>
              <span>{t.trackingTitle}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {language === 'hi' ? 'कलेक्टर से लेकर अंतिम धातु निष्कर्षण तक हर कदम का संपूर्ण ऑडिट रिकॉर्ड' : language === 'mr' ? 'कलेक्टरपासून पुनर्प्रक्रियेपर्यंत प्रत्येक टप्प्याची नोंद' : 'Full chain-of-custody audit logs from field collection to smelting'}
            </p>
          </div>

          {/* Voice Speaker Button for Informal Scrap Collectors */}
          {lot && (
            <button
              type="button"
              onClick={() => {
                if (isSpeaking) {
                  stop();
                } else {
                  speakLifecycleStatus();
                }
              }}
              className={`min-h-[44px] px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow transition-all shrink-0 active:scale-95 ${
                isSpeaking
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 shadow-amber-950'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-emerald-950'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4 animate-bounce" />
                  <span>{language === 'hi' ? 'आवाज़ बंद करें' : language === 'mr' ? 'आवाज थांबवा' : 'Stop Audio'}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 animate-pulse" />
                  <span>{language === 'hi' ? 'आवाज़ में सुनें' : language === 'mr' ? 'आवाजात ऐका' : 'Listen Status'}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchLotId}
              onChange={(e) => setSearchLotId(e.target.value)}
              placeholder="EW-LKO-2026-469806"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-mono text-sm font-bold focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-extrabold shadow flex items-center gap-1 shrink-0 active:scale-95"
          >
            <span>{language === 'hi' ? 'ट्रैक करें' : language === 'mr' ? 'ट्रॅक करा' : 'Track'}</span>
          </button>
        </form>

        {/* Quick Multi-Lot Selector */}
        {allLots.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
                <span>📦</span>
                <span>{language === 'hi' ? `आपके पंजीकृत लॉट (${allLots.length}):` : language === 'mr' ? `आपले नोंदणीकृत लॉट (${allLots.length}):` : `Your Registered Lots (${allLots.length}):`}</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">{language === 'hi' ? 'लॉट पर टैप करके लाइव स्टेटस देखें' : 'Tap any lot to view live tracking'}</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1.5">
              {allLots.map((l) => {
                const isSelected = searchLotId === l.id;
                const catIcon = l.materialCategory === 'PCB' ? '📟'
                  : l.materialCategory === 'BATTERY' ? '🔋'
                  : l.materialCategory === 'CABLE' ? '🔌'
                  : l.materialCategory === 'MOTOR' ? '⚙️'
                  : '📦';

                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setSearchLotId(l.id);
                      fetchTraceability(l.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold shrink-0 transition-all flex items-center gap-1.5 active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>{catIcon}</span>
                    <span>{l.id}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-sans font-bold ${
                      l.status === 'RECYCLED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                        : l.status === 'CREATED'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                        : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                    }`}>
                      {l.status === 'RECYCLED' ? '5/5 ✓' : l.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton variant="detail" count={1} />
      ) : !lot ? (
        <div className="space-y-4">
          <EmptyState
            title={language === 'hi' ? 'लॉट आईडी नहीं मिली' : language === 'mr' ? 'लॉट क्रमांक आढळला नाही' : 'Lot Identifier Not Found'}
            description={language === 'hi' ? 'कृपया ऊपर दिए गए पंजीकृत लॉट में से चुनें या एक मान्य लॉट आईडी दर्ज करें।' : language === 'mr' ? 'कृपया वरीलपैकी अचूक क्रमांक निवडा.' : 'Please select from your registered lots above or search with an authentic lot identifier.'}
            icon={<Search className="w-8 h-8 text-emerald-400" />}
            action={allLots.length > 0 ? {
              label: language === 'hi' ? `नवीनतम लॉट लोड करें (${allLots[0].id})` : language === 'mr' ? `नवीनतम लॉट लोड करा (${allLots[0].id})` : `Load Latest Lot (${allLots[0].id})`,
              onClick: () => {
                setSearchLotId(allLots[0].id);
                fetchTraceability(allLots[0].id);
              }
            } : undefined}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Signature 9-Stage National Recycling Journey */}
          <MaterialJourney currentStatus={lot.status} />

          {/* Top Lot Summary Card with Value and Form-6 Action */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 tracking-wider block">{lot.id}</span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">{getCategoryLabel(lot.materialCategory, language)}</h2>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowManifestModal(true)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{language === 'hi' ? 'CPCB Form-6 मेनिफेस्ट' : language === 'mr' ? 'CPCB Form-6 मॅनिफेस्ट' : 'CPCB Form-6 Manifest'}</span>
                </button>

                <StatusBadge status={lot.status} />
              </div>
            </div>

            {/* 5-Column Metadata Grid (Includes Payout / Valuation) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">{language === 'hi' ? 'कलेक्टर' : language === 'mr' ? 'कलेक्टर' : 'Collector'}</span>
                <span className="font-black text-slate-900 dark:text-white truncate block mt-0.5">
                  {formatUserDisplayName(lot.collectorName, 'COLLECTOR', language)}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">{language === 'hi' ? 'स्थिति' : language === 'mr' ? 'स्थिती' : 'Condition'}</span>
                <span className="font-black text-amber-700 dark:text-amber-300 text-xs truncate block mt-0.5">
                  {lot.condition === 'INTACT'
                    ? (language === 'hi' ? '🟢 साबुत (Intact)' : language === 'mr' ? '🟢 अखंड' : '🟢 Intact')
                    : lot.condition === 'DAMAGED'
                    ? (language === 'hi' ? '🟡 क्षतिग्रस्त' : language === 'mr' ? '🟡 खराब' : '🟡 Damaged')
                    : (language === 'hi' ? '🟠 खुला हुआ' : language === 'mr' ? '🟠 वेगळे केलेले' : '🟠 Dismantled')}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">{language === 'hi' ? 'वजन' : language === 'mr' ? 'वजन' : 'Weight'}</span>
                <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm block mt-0.5">
                  {lot.approxWeight} {language === 'hi' ? 'किग्रा' : language === 'mr' ? 'किलो' : 'kg'}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">{language === 'hi' ? 'अनुमानित कमाई' : language === 'mr' ? 'अंदाजे कमाई' : 'Est. Payout'}</span>
                <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm block mt-0.5">
                  ₹{(lot.quotedPrice || lot.estimatedValueAvg || Math.round(lot.approxWeight * 105)).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">{language === 'hi' ? 'स्थान' : language === 'mr' ? 'स्थान' : 'District'}</span>
                <span className="font-black text-slate-900 dark:text-white block mt-0.5 truncate">
                  {formatLocationString(lot.locationDistrict, lot.locationState, language)}
                </span>
              </div>
            </div>

            {/* Continuous 5-Stage Stepper Progress Line */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{language === 'hi' ? 'प्रगति यात्रा:' : language === 'mr' ? 'प्रगती प्रवास:' : 'Lifecycle Progression:'}</span>
                </span>
                <span className="text-emerald-800 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 text-[11px]">
                  {currentStageIdx + 1} / 5 {language === 'hi' ? 'चरण पूर्ण' : language === 'mr' ? 'टप्पे पूर्ण' : 'Stages Complete'}
                </span>
              </div>

              <div className="relative pt-2 pb-1">
                {/* Background Connecting Line */}
                <div className="absolute top-6 left-[10%] right-[10%] h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0 rounded-full">
                  {/* Dynamic Filled Active Progress Bar */}
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-700 rounded-full"
                    style={{ width: `${(Math.min(currentStageIdx, 4) / 4) * 100}%` }}
                  />
                </div>

                {/* 5 Milestone Step Nodes */}
                <div className="grid grid-cols-5 relative z-10">
                  {stages.map((stage, idx) => {
                    const isCompleted = idx <= currentStageIdx;
                    const isCurrent = idx === currentStageIdx;

                    return (
                      <div key={stage.key} className="flex flex-col items-center gap-1.5 text-center px-0.5">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                            isCurrent
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/30 shadow-md scale-110'
                              : isCompleted
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-2 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <span className={`text-[10px] font-black leading-tight block ${
                          isCurrent ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' : isCompleted ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
                        }`}>
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Urban Mining & Critical Mineral Yield Audit (Ministry of Mines & JNARDDC Mandate) */}
          <UrbanMiningVisualizer
            category={lot.materialCategory}
            weightKg={lot.actualWeight || lot.approxWeight || 10}
            compact={false}
          />

          {/* Verified Logistics & Handover Timeline */}
          <LogisticsTimeline lot={lot} />

          {/* Cryptographic SHA-256 Merkle Chain Verification Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {language === 'hi' ? 'क्रिप्टोग्राफिक SHA-256 ऑडिट चेन' : language === 'mr' ? 'क्रिप्टोग्राफिक SHA-256 ऑडिट साखळी' : 'Cryptographic SHA-256 Merkle Chain'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'hi' ? 'प्रत्येक इवेंट पिछले हैश से क्रिप्टोग्राफिकली लिंक है' : language === 'mr' ? 'प्रत्येक नोंद मागील हॅशशी जोडलेली आहे' : 'Every event cryptographically links to the previous SHA-256 hash'}
                </p>
              </div>

              <button
                onClick={handleVerifyIntegrity}
                disabled={verifyingChain}
                className="px-4 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-800 dark:text-emerald-100 dark:border-transparent dark:hover:bg-emerald-700 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 shadow-sm active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${verifyingChain ? 'animate-spin' : ''}`} />
                <span>{verifyingChain ? (language === 'hi' ? 'सत्यापित हो रहा...' : language === 'mr' ? 'तपासत आहे...' : 'Verifying...') : (language === 'hi' ? 'ऑडिट सत्यापित करें' : language === 'mr' ? 'ऑडिट तपासा' : 'Verify Integrity')}</span>
              </button>
            </div>

            {integrityResult && (
              <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                integrityResult.isTamperFree
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/70 dark:border-emerald-500/50 dark:text-emerald-200'
                  : 'bg-red-50 border-red-300 text-red-800 dark:bg-red-950/70 dark:border-red-500/50 dark:text-red-200'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {integrityResult.isTamperFree ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span>{language === 'hi' ? '100% पूर्ण अखंडता सत्यापित' : language === 'mr' ? '१००% अखंडता प्रमाणित' : '100% Tamper-Free & Verified'} (All {integrityResult.totalEvents} Events)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <span>श्रृंखला विसंगति पाई गई! (Compromised Event ID: {integrityResult.compromisedEventId})</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] opacity-90 font-mono">
                  Algorithm: {integrityResult.algorithm} | Root Merkle Block Height: #{integrityResult.totalEvents}
                </p>
              </div>
            )}
          </div>

          {/* Chronological Audit Timeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'hi' ? 'सत्यापित समयरेखा (ऑडिट लॉग)' : language === 'mr' ? 'प्रमाणित वेळेची नोंद' : 'Immutable Chain of Custody Logs'}</span>
            </h3>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {timeline.map((item, idx) => {
                // Resolved actor name ensuring consistency with lot collector
                const resolvedActor = (item.actorRole === 'COLLECTOR')
                  ? (item.actorName && item.actorName !== 'Authorized Collector' ? item.actorName : (lot.collectorName || 'Ramesh Kumar'))
                  : item.actorName;

                return (
                  <div key={item.id || idx} className="relative flex items-start gap-4 pl-1">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow shrink-0 z-10 ring-4 ring-white dark:ring-slate-900">
                      ✓
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex-1 space-y-2.5 shadow-sm">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">{item.title}</h4>
                        <span className="text-[11px] font-mono text-emerald-800 dark:text-emerald-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                          {formatAuditDate(item.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.description}</p>
                      
                      {/* Cryptographic SHA-256 Hashes Display */}
                      {item.eventHash && (
                        <div className="bg-slate-100 dark:bg-slate-900/90 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 font-mono text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <Key className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="text-slate-500 font-bold">Hash:</span>
                            <span className="text-emerald-700 dark:text-emerald-400 truncate font-mono">{item.eventHash}</span>
                          </div>
                          {item.previousEventHash && (
                            <div className="flex items-center gap-1.5 truncate pl-5">
                              <span className="text-slate-500 font-bold">Prev:</span>
                              <span className="text-slate-400 truncate font-mono">{item.previousEventHash.slice(0, 32)}...</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-900 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{item.facilityLocation}</span>
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {language === 'hi' ? 'द्वारा:' : language === 'mr' ? 'द्वारे:' : 'By:'} {formatUserDisplayName(resolvedActor, item.actorRole as any, language)} ({item.actorRole === 'COLLECTOR' ? (t.roleCollector || 'Collector') : item.actorRole === 'RECYCLER' ? (t.roleRecycler || 'Recycler') : item.actorRole === 'ADMIN' ? (t.roleAdmin || 'Admin') : item.actorRole})
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Digital CPCB Form-6 Manifest & QR Inspection Modal */}
      {showManifestModal && lot && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {language === 'hi' ? 'CPCB फॉर्म-6 डिजिटल मेनिफेस्ट' : language === 'mr' ? 'CPCB फॉर्म-६ डिजिटल मॅनिफेस्ट' : 'CPCB Form-6 Movement Manifest'}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Rule 19, E-Waste (Management) Rules, 2022</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManifestModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Manifest Badge & Certificate */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Manifest Number</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">CPCB-MAN-{lot.id.replace('EW-', '')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Generated At</span>
                <span className="text-slate-700 dark:text-slate-200 font-mono text-[11px]">{formatAuditDate(lot.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">E-Waste Category</span>
                <span className="text-slate-900 dark:text-white font-bold">{getCategoryLabel(lot.materialCategory, language)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Scaled Weight</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">{lot.approxWeight} kg ({lot.condition})</span>
              </div>
            </div>

            {/* Consignor & Consignee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-emerald-800 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider block">Consignor (Collector)</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{lot.collectorName}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{lot.locationDistrict}, {lot.locationState}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">KYC: CPCB-REG-COLL-98</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-emerald-800 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider block">Consignee (CPCB Recycler)</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{formatUserDisplayName(recycler?.facilityName || 'GreenEarth E-Waste Solutions Pvt Ltd', 'RECYCLER', language)}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{recycler?.registrationNo || 'CPCB/EWR/UP/LKO/2023/8812'}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Authorized Capacity: 5,400 MTA</p>
              </div>
            </div>

            {/* QR Code Simulation & Hash */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
              <div className="p-2 bg-white rounded-xl shrink-0 shadow-inner flex items-center justify-center">
                <QrCode className="w-16 h-16 text-slate-950" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cryptographic Merkle Genesis Hash</span>
                </div>
                <p className="font-mono text-[9px] text-slate-400 break-all leading-tight">
                  {timeline[0]?.eventHash || '6674ab5b97a74744c4927717280a9ee34df916719a82a8169e0519c75729e623'}
                </p>
                <p className="text-[10px] text-slate-500">Scan via CPCB Enforcement Inspector app to audit live ledger.</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Manifest</span>
              </button>
              <button
                type="button"
                onClick={() => setShowManifestModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
