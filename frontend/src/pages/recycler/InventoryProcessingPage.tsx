import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  Factory, 
  Sparkles, 
  RefreshCw, 
  Award,
  ShieldCheck,
  FileCheck,
  AlertCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { onPlatformSync } from '../../services/realtime';
import { Lot } from '../../types';
import { getStatusLabel, getCategoryLabel } from '../../i18n/translations';
import { GreenCertificateModal } from '../../components/common/GreenCertificateModal';

const FACILITY_STATUSES = ['RECEIVED', 'RECYCLER_RECEIVED', 'SORTED', 'PROCESSING', 'RECOVERED', 'RECYCLED'];

const PIPELINE_STEPS = [
  { stage: 'RECEIVED', num: '1', title: 'Intake Scale', desc: 'Tare Verified' },
  { stage: 'SORTED', num: '2', title: 'Segregation', desc: 'Manual / Depopulation' },
  { stage: 'PROCESSING', num: '3', title: 'Refining', desc: 'Hydrometallurgy' },
  { stage: 'RECOVERED', num: '4', title: 'Metal Recovery', desc: 'Critical Minerals' },
  { stage: 'RECYCLED', num: '5', title: '100% Recycled', desc: 'Form-6 Ready' }
];

export const InventoryProcessingPage: React.FC = () => {
  const { user, recyclerProfile } = useAuth();
  const myRecyclerId = recyclerProfile?.id || user?.id || 'rec_abc_1';

  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const queryLotId = searchParams.get('lotId');

  const [lots, setLots] = useState<Lot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string>(queryLotId || '');
  const [targetStage, setTargetStage] = useState<string>('SORTED');
  const [recoveredDetails, setRecoveredDetails] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showCertModal, setShowCertModal] = useState<boolean>(false);
  const [filterTab, setFilterTab] = useState<'ALL' | 'IN_PROCESS' | 'COMPLETED'>('ALL');

  const getStageDefaultNote = (stage: string, category?: string, weight: number = 10): string => {
    const w = weight > 0 ? weight : 10;
    const cat = (category || 'BATTERY').toUpperCase();

    if (stage === 'RECOVERED' || stage === 'RECYCLED') {
      if (cat.includes('BATT')) {
        return `Recovered: ${(w * 0.42).toFixed(1)}kg Lithium Carbonate (Li2CO3), ${(w * 0.28).toFixed(1)}kg Cobalt, ${(w * 0.15).toFixed(1)}kg Nickel, ${(w * 0.11).toFixed(1)}kg High-Purity Copper Foil`;
      }
      if (cat.includes('PCB') || cat.includes('CIRCUIT')) {
        return `Recovered: ${(w * 0.55).toFixed(1)}kg Refined Copper (Cu 99.9%), ${(w * 0.18).toFixed(1)}g Gold (Au 99.99%), ${(w * 0.75).toFixed(1)}g Silver (Ag), ${(w * 0.15).toFixed(1)}kg Aluminium`;
      }
      if (cat.includes('CABLE') || cat.includes('WIRE')) {
        return `Recovered: ${(w * 0.65).toFixed(1)}kg Bare Copper Wire (Grade A 99.9%), ${(w * 0.30).toFixed(1)}kg Recycled PVC/XLPE Granules`;
      }
      if (cat.includes('MOTOR')) {
        return `Recovered: ${(w * 0.68).toFixed(1)}kg Ferrous Stator Core Scrap, ${(w * 0.26).toFixed(1)}kg Pure Copper Windings, ${(w * 0.04).toFixed(1)}kg NdFeB Magnets`;
      }
      return `Recovered: ${(w * 0.60).toFixed(1)}kg Recycled High-Grade Fractions, ${(w * 0.35).toFixed(1)}kg Polymer Byproducts`;
    }

    switch (stage) {
      case 'RECYCLER_RECEIVED':
      case 'RECEIVED':
        return 'Warehouse intake scale verified; lot segregated and logged into facility ledger.';
      case 'SORTED':
        return 'Surface-mount depopulation, component desoldering, and manual hazardous segregation completed.';
      case 'PROCESSING':
        return 'Hydrometallurgical acid leaching and closed-loop electrolyte separation active.';
      case 'RECYCLED':
        return '100% Formally Recycled. Hazardous residues neutralized. CPCB Form-6 Certificate generated.';
      default:
        return 'Facility processing status advanced.';
    }
  };

  const getNextDefaultStage = (currentStatus?: string): string => {
    switch (currentStatus) {
      case 'RECEIVED':
      case 'RECYCLER_RECEIVED':
        return 'SORTED';
      case 'SORTED':
        return 'PROCESSING';
      case 'PROCESSING':
        return 'RECOVERED';
      case 'RECOVERED':
        return 'RECYCLED';
      case 'RECYCLED':
        return 'RECYCLED';
      default:
        return 'SORTED';
    }
  };

  const fetchLots = async () => {
    try {
      const res = await api.getLots({ limit: '150' });
      if (res.success) {
        setLots(res.lots);
      }
    } catch (e) {
      console.warn('Inventory fetch error:', e);
    }
  };

  useEffect(() => {
    fetchLots();

    const unsubscribeSync = onPlatformSync(() => {
      fetchLots();
    });

    const interval = setInterval(() => {
      fetchLots();
    }, 8000);

    return () => {
      unsubscribeSync();
      clearInterval(interval);
    };
  }, []);

  // Filter lots belonging strictly to this recycler facility
  const facilityLots = lots.filter(l => {
    const isMine = (!l.selectedRecyclerId || l.selectedRecyclerId === myRecyclerId);
    return isMine && FACILITY_STATUSES.includes(l.status);
  });

  // Sort: Active in-processing lots first, then newest lots
  const sortedEligibleLots = [...facilityLots].sort((a, b) => {
    const aIsDone = a.status === 'RECYCLED' ? 1 : 0;
    const bIsDone = b.status === 'RECYCLED' ? 1 : 0;
    if (aIsDone !== bIsDone) return aIsDone - bIsDone;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  // Filter by tabs
  const displayedLots = sortedEligibleLots.filter(l => {
    if (filterTab === 'IN_PROCESS') return l.status !== 'RECYCLED';
    if (filterTab === 'COMPLETED') return l.status === 'RECYCLED';
    return true;
  });

  // Auto-select initial lot
  useEffect(() => {
    if (sortedEligibleLots.length === 0) return;
    const activeLots = sortedEligibleLots.filter(l => l.status !== 'RECYCLED');

    if (queryLotId && sortedEligibleLots.some(l => l.id === queryLotId)) {
      setSelectedLotId(queryLotId);
      const matched = sortedEligibleLots.find(l => l.id === queryLotId)!;
      const initialTarget = getNextDefaultStage(matched.status);
      setTargetStage(initialTarget);
      setRecoveredDetails(getStageDefaultNote(initialTarget, matched.materialCategory, matched.actualWeight || matched.approxWeight));
    } else if (!selectedLotId || !sortedEligibleLots.some(l => l.id === selectedLotId)) {
      const defaultLot = activeLots.length > 0 ? activeLots[0] : sortedEligibleLots[0];
      setSelectedLotId(defaultLot.id);
      const initialTarget = getNextDefaultStage(defaultLot.status);
      setTargetStage(initialTarget);
      setRecoveredDetails(getStageDefaultNote(initialTarget, defaultLot.materialCategory, defaultLot.actualWeight || defaultLot.approxWeight));
    }
  }, [sortedEligibleLots.length, queryLotId]);

  const currentLot = sortedEligibleLots.find(l => l.id === selectedLotId) || sortedEligibleLots[0];

  // Compute facility-isolated inventory weights
  const inventoryWeights: Record<string, number> = {
    PCB: 0,
    BATTERY: 0,
    CABLE: 0,
    MOTOR: 0,
    CRT: 0,
    LCD: 0,
    MAGNET: 0,
    MIXED_PLASTIC: 0
  };

  facilityLots.forEach(l => {
    const rawCat = (l.materialCategory || 'PCB').toUpperCase();
    let mapped = rawCat;
    if (rawCat.includes('BATT')) mapped = 'BATTERY';
    else if (rawCat.includes('PCB') || rawCat.includes('CIRCUIT')) mapped = 'PCB';
    else if (rawCat.includes('CABLE') || rawCat.includes('WIRE')) mapped = 'CABLE';
    else if (rawCat.includes('MOTOR')) mapped = 'MOTOR';
    else if (rawCat.includes('CRT')) mapped = 'CRT';
    else if (rawCat.includes('LCD') || rawCat.includes('DISPLAY')) mapped = 'LCD';
    else if (rawCat.includes('MAGNET')) mapped = 'MAGNET';
    else if (rawCat.includes('PLASTIC')) mapped = 'MIXED_PLASTIC';

    const weight = Number(l.actualWeight || l.approxWeight) || 0;
    if (inventoryWeights[mapped] !== undefined) {
      inventoryWeights[mapped] = Number((inventoryWeights[mapped] + weight).toFixed(1));
    }
  });

  // Calculate current stage index for Stepper
  const getStageStepIndex = (status?: string): number => {
    switch (status) {
      case 'RECEIVED':
      case 'RECYCLER_RECEIVED':
        return 0;
      case 'SORTED':
        return 1;
      case 'PROCESSING':
        return 2;
      case 'RECOVERED':
        return 3;
      case 'RECYCLED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStageStepIndex(currentLot?.status);
  const isLotFullyRecycled = currentLot?.status === 'RECYCLED';

  // Valid next stages
  const getValidNextStages = (lot?: Lot): { value: string; label: string }[] => {
    if (!lot) return [];
    const all = [
      { value: 'SORTED', label: '2. ' + t.stageSorting },
      { value: 'PROCESSING', label: '3. ' + t.stageProcessing },
      { value: 'RECOVERED', label: '4. ' + t.stageRecovered },
      { value: 'RECYCLED', label: '5. ' + t.stageRecycled }
    ];

    switch (lot.status) {
      case 'RECEIVED':
      case 'RECYCLER_RECEIVED':
        return all;
      case 'SORTED':
        return all.slice(1);
      case 'PROCESSING':
        return all.slice(2);
      case 'RECOVERED':
        return all.slice(3);
      default:
        return [];
    }
  };

  const validNextStages = getValidNextStages(currentLot);

  const handleLotSelect = (lotId: string) => {
    setSelectedLotId(lotId);
    const l = sortedEligibleLots.find(item => item.id === lotId);
    if (l) {
      const next = getNextDefaultStage(l.status);
      setTargetStage(next);
      setRecoveredDetails(getStageDefaultNote(next, l.materialCategory, l.actualWeight || l.approxWeight));
    }
  };

  const handleStageChange = (newStage: string) => {
    setTargetStage(newStage);
    if (currentLot) {
      setRecoveredDetails(getStageDefaultNote(newStage, currentLot.materialCategory, currentLot.actualWeight || currentLot.approxWeight));
    }
  };

  const handleTabChange = (tab: 'ALL' | 'IN_PROCESS' | 'COMPLETED') => {
    setFilterTab(tab);
    const filtered = sortedEligibleLots.filter(l => {
      if (tab === 'IN_PROCESS') return l.status !== 'RECYCLED';
      if (tab === 'COMPLETED') return l.status === 'RECYCLED';
      return true;
    });
    if (filtered.length > 0 && !filtered.some(l => l.id === selectedLotId)) {
      handleLotSelect(filtered[0].id);
    }
  };

  const handleUpdateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotId || submitting || isLotFullyRecycled) return;

    setSubmitting(true);
    try {
      const res = await api.updateProcessingStage({
        lotId: selectedLotId,
        stage: targetStage,
        recoveredDetails,
        facilityLocation: `${recyclerProfile?.facilityName || 'Authorized Recycling Plant'}, ${recyclerProfile?.district || 'Lucknow'}`
      });

      if (res.success && res.lot) {
        const updatedLot = res.lot;

        // 1. INSTANT LOCAL STATE UPDATE (0ms) - Stepper, Dropdown, Inventory all update in this very frame!
        setLots(prev => prev.map(l => l.id === updatedLot.id ? updatedLot : l));

        // 2. Prepare next stage inputs immediately
        const nextStage = getNextDefaultStage(updatedLot.status);
        setTargetStage(nextStage);
        setRecoveredDetails(getStageDefaultNote(
          nextStage, 
          updatedLot.materialCategory, 
          updatedLot.actualWeight || updatedLot.approxWeight
        ));

        // 3. If lot reached RECYCLED while on IN_PROCESS tab, switch to ALL so user sees the Form-6 Green Certificate card!
        if (updatedLot.status === 'RECYCLED' && filterTab === 'IN_PROCESS') {
          setFilterTab('ALL');
        }

        showToast(
          language === 'hi' 
            ? `लॉट स्थिति सफलतापूर्वक '${targetStage}' में अपडेट हो गई!`
            : `Lot status successfully advanced to '${targetStage}'!`,
          'success'
        );

        // 4. Background fresh sync
        fetchLots();
      }
    } catch (err: any) {
      showToast(err.message || 'Stage update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>⚙️</span>
              <span>{t.inventoryProcessingTitle}</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Facility: <b className="text-emerald-400">{recyclerProfile?.facilityName || 'ABC E-Waste Recycling Pvt Ltd'}</b> • CPCB EPR Rule 19 Compliant
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-950 text-emerald-300 rounded-xl text-xs font-mono font-bold border border-emerald-800">
              Active Lots: {facilityLots.filter(l => l.status !== 'RECYCLED').length}
            </span>
            <span className="px-3 py-1 bg-blue-950 text-blue-300 rounded-xl text-xs font-mono font-bold border border-blue-800">
              Recycled: {facilityLots.filter(l => l.status === 'RECYCLED').length}
            </span>
          </div>
        </div>
      </div>

      {/* Material Inventory Stock Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>{t.materialStockTitle} ({recyclerProfile?.facilityName || 'My Facility Stock'})</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {Object.entries(inventoryWeights).map(([cat, weight]) => (
            <div key={cat} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-400 block">{cat}</span>
                <span className="text-lg font-black text-white">{weight} kg</span>
              </div>
              <span className="text-xl">
                {cat === 'PCB' && '📟'}
                {cat === 'BATTERY' && '🔋'}
                {cat === 'CABLE' && '🔌'}
                {cat === 'MOTOR' && '⚙️'}
                {cat === 'CRT' && '📺'}
                {cat === 'LCD' && '🖥️'}
                {cat === 'MAGNET' && '🧲'}
                {cat === 'MIXED_PLASTIC' && '♻️'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* INTERACTIVE 5-STAGE VISUAL LIFECYCLE STEPPER */}
      {currentLot && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Lifecycle Pipeline Progress: <b className="text-emerald-400 font-mono">{currentLot.id}</b></span>
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              {getCategoryLabel(currentLot.materialCategory, language)} ({currentLot.actualWeight || currentLot.approxWeight} kg)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
            {PIPELINE_STEPS.map((step, idx) => {
              const isPast = isLotFullyRecycled ? idx <= currentStepIdx : idx < currentStepIdx;
              const isCurrent = !isLotFullyRecycled && idx === currentStepIdx;
              const isPending = !isLotFullyRecycled && idx > currentStepIdx;

              return (
                <div 
                  key={step.stage}
                  className={`p-3 rounded-2xl border transition-all text-xs relative ${
                    isPast 
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : isCurrent
                      ? 'bg-gradient-to-br from-emerald-950 to-slate-950 border-2 border-emerald-500 text-white shadow-lg ring-2 ring-emerald-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                      isPast 
                        ? 'bg-emerald-500 text-slate-950'
                        : isCurrent
                        ? 'bg-emerald-400 text-slate-950 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isPast ? '✓' : step.num}
                    </span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                        ACTIVE
                      </span>
                    )}
                    {isLotFullyRecycled && idx === 4 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black animate-pulse">
                        DONE
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-xs truncate">{step.title}</div>
                  <div className="text-[10px] opacity-80 truncate">{step.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STAGE PROGRESSION & LOT MANAGEMENT */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
              {t.advanceStageTitle}
            </h2>
            <p className="text-[11px] text-slate-400">
              Advance material batches through legal recycling checkpoints and generate CPCB Form-6 proofs
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => handleTabChange('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterTab === 'ALL' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({facilityLots.length})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('IN_PROCESS')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterTab === 'IN_PROCESS' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              In-Process ({facilityLots.filter(l => l.status !== 'RECYCLED').length})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('COMPLETED')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterTab === 'COMPLETED' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Completed ({facilityLots.filter(l => l.status === 'RECYCLED').length})
            </button>
          </div>
        </div>

        {displayedLots.length === 0 ? (
          <div className="bg-slate-950 rounded-2xl p-8 text-center space-y-3 border border-slate-800">
            <Factory className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-medium">
              No lots found matching the selected filter in your facility inventory.
            </p>
          </div>
        ) : (
          <form onSubmit={handleUpdateStage} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">{t.selectLotPrompt}</label>
                <select
                  value={selectedLotId}
                  onChange={(e) => handleLotSelect(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500 text-xs"
                  required
                >
                  {displayedLots.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.id} - {getCategoryLabel(l.materialCategory, language)} ({l.actualWeight || l.approxWeight} kg) [{getStatusLabel(l.status, language)}]
                    </option>
                  ))}
                </select>
              </div>

              {!isLotFullyRecycled ? (
                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">{t.nextStagePrompt}</label>
                  <select
                    value={targetStage}
                    onChange={(e) => handleStageChange(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    {validNextStages.map(s => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-800 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-xs block">100% Formally Recycled</span>
                    <span className="text-[10px] text-slate-400">Terminal lifecycle state reached. Certificate ready below.</span>
                  </div>
                </div>
              )}
            </div>

            {/* If lot is already recycled, show Certificate card instead of Advance button */}
            {isLotFullyRecycled ? (
              <div className="bg-gradient-to-r from-emerald-950/80 to-teal-950/60 border-2 border-emerald-500/80 rounded-2xl p-6 text-center space-y-3 shadow-xl">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">This Consignment is 100% Formally Recycled!</h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                    All hazardous materials neutralized, valuable secondary raw materials extracted, and CPCB Form-6 manifest generated.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCertModal(true)}
                    className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg inline-flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <Award className="w-4 h-4" />
                    <span>View CPCB Form-6 Certificate (Green Certificate)</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-300">
                      {t.recoveredDetailsLabel}
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      CPCB Rule 2022 Recovery Standards
                    </span>
                  </div>
                  <input
                    type="text"
                    value={recoveredDetails}
                    onChange={(e) => setRecoveredDetails(e.target.value)}
                    placeholder="Recovered fractions..."
                    className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-xs font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    * Logged into immutable double-entry traceability audit trail.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedLotId || isLotFullyRecycled}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold rounded-2xl shadow-xl flex items-center justify-center gap-2 text-sm transition-all"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  <span>{submitting ? t.updatingStage : t.advanceStageBtn}</span>
                </button>
              </>
            )}
          </form>
        )}
      </div>

      {/* GREEN CERTIFICATE MODAL */}
      {showCertModal && currentLot && (
        <GreenCertificateModal
          lot={currentLot}
          onClose={() => setShowCertModal(false)}
        />
      )}
    </div>
  );
};
