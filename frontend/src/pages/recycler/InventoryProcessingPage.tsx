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
import { getStatusLabel, getCategoryLabel, formatUserDisplayName } from '../../i18n/translations';
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
    const isHi = language === 'hi';
    const isMr = language === 'mr';
    const prefix = isHi ? 'पुनर्प्राप्त:' : isMr ? 'पुनर्प्राप्त:' : 'Recovered:';
    const kgUnit = isHi || isMr ? 'किग्रा' : 'kg';
    const gUnit = isHi || isMr ? 'ग्राम' : 'g';

    if (stage === 'RECOVERED' || stage === 'RECYCLED') {
      if (cat.includes('BATT')) {
        return `${prefix} ${(w * 0.42).toFixed(1)}${kgUnit} ${isHi ? 'लिथियम कार्बोनेट' : isMr ? 'लिथियम कार्बोनेट' : 'Lithium Carbonate'} (Li2CO3), ${(w * 0.28).toFixed(1)}${kgUnit} ${isHi ? 'कोबाल्ट' : isMr ? 'कोबाल्ट' : 'Cobalt'}, ${(w * 0.15).toFixed(1)}${kgUnit} ${isHi ? 'निकल' : isMr ? 'निकल' : 'Nickel'}, ${(w * 0.11).toFixed(1)}${kgUnit} ${isHi ? 'कॉपर फ़ॉइल' : isMr ? 'कॉपर फॉइल' : 'Copper Foil'}`;
      }
      if (cat.includes('PCB') || cat.includes('CIRCUIT')) {
        return `${prefix} ${(w * 0.55).toFixed(1)}${kgUnit} ${isHi ? 'शुद्ध तांबा (Cu 99.9%)' : isMr ? 'शुद्ध तांबे (Cu 99.9%)' : 'Refined Copper (Cu 99.9%)'}, ${(w * 0.18).toFixed(1)}${gUnit} ${isHi ? 'सोना (Au 99.99%)' : isMr ? 'सोने (Au 99.99%)' : 'Gold (Au 99.99%)'}, ${(w * 0.75).toFixed(1)}${gUnit} ${isHi ? 'चांदी (Ag)' : isMr ? 'चांदी (Ag)' : 'Silver (Ag)'}, ${(w * 0.15).toFixed(1)}${kgUnit} ${isHi ? 'एल्युमीनियम' : isMr ? 'ॲल्युमिनियम' : 'Aluminium'}`;
      }
      if (cat.includes('CABLE') || cat.includes('WIRE')) {
        return `${prefix} ${(w * 0.65).toFixed(1)}${kgUnit} ${isHi ? 'तांबे का तार' : isMr ? 'तांब्याची तार' : 'Bare Copper Wire'}, ${(w * 0.30).toFixed(1)}${kgUnit} ${isHi ? 'रीसाइकिल्ड PVC प्लास्टिक दाने' : isMr ? 'रिसायकल केलेले PVC प्लास्टिक' : 'Recycled PVC Granules'}`;
      }
      if (cat.includes('MOTOR')) {
        return `${prefix} ${(w * 0.68).toFixed(1)}${kgUnit} ${isHi ? 'स्टेटर कोर स्क्रैप' : isMr ? 'स्टेटर कोर स्क्रॅप' : 'Ferrous Stator Core Scrap'}, ${(w * 0.26).toFixed(1)}${kgUnit} ${isHi ? 'तांबे की वाइंडिंग' : isMr ? 'तांब्याची वाईंडिंग' : 'Pure Copper Windings'}, ${(w * 0.04).toFixed(1)}${kgUnit} ${isHi ? 'चुंबक (NdFeB)' : isMr ? 'चुंबक (NdFeB)' : 'NdFeB Magnets'}`;
      }
      return `${prefix} ${(w * 0.60).toFixed(1)}${kgUnit} ${isHi ? 'उच्च श्रेणी रीसाइकिल्ड अंश' : isMr ? 'उच्च श्रेणी रिसायकल केलेले अंश' : 'Recycled High-Grade Fractions'}, ${(w * 0.35).toFixed(1)}${kgUnit} ${isHi ? 'पॉलिमर उपोत्पाद' : isMr ? 'पॉलिमर उपउत्पादने' : 'Polymer Byproducts'}`;
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
      const res = await api.getLots();
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

  const pipelineSteps = [
    {
      stage: 'RECEIVED',
      num: '1',
      title: language === 'hi' ? 'आवक कांटा' : language === 'mr' ? 'आवक काटा' : 'Intake Scale',
      desc: language === 'hi' ? 'वजन सत्यापित' : language === 'mr' ? 'वजन पडताळले' : 'Tare Verified'
    },
    {
      stage: 'SORTED',
      num: '2',
      title: language === 'hi' ? 'पृथक्करण' : language === 'mr' ? 'वर्गीकरण' : 'Segregation',
      desc: language === 'hi' ? 'मैनुअल छंटाई' : language === 'mr' ? 'मॅन्युअल विभागणी' : 'Manual / Depopulation'
    },
    {
      stage: 'PROCESSING',
      num: '3',
      title: language === 'hi' ? 'शोधन' : language === 'mr' ? 'शुद्धीकरण' : 'Refining',
      desc: language === 'hi' ? 'धातुशोधन' : language === 'mr' ? 'हायड्रोमेटॅलर्जी' : 'Hydrometallurgy'
    },
    {
      stage: 'RECOVERED',
      num: '4',
      title: language === 'hi' ? 'धातु पुनर्प्राप्ति' : language === 'mr' ? 'धातू पुनर्प्राप्ती' : 'Metal Recovery',
      desc: language === 'hi' ? 'महत्वपूर्ण खनिज' : language === 'mr' ? 'महत्त्वाचे खनिज' : 'Critical Minerals'
    },
    {
      stage: 'RECYCLED',
      num: '5',
      title: language === 'hi' ? '100% रीसाइक्लिंग' : language === 'mr' ? '100% रिसायकल' : '100% Recycled',
      desc: language === 'hi' ? 'फॉर्म-6 तैयार' : language === 'mr' ? 'फॉर्म-6 तयार' : 'Form-6 Ready'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-2">
              <Factory className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'संयंत्र प्रसंस्करण एवं शोधन' : language === 'mr' ? 'प्रक्रिया व शुद्धीकरण' : 'Plant Processing & Refining'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>⚙️</span>
              <span>{t.inventoryProcessingTitle}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {language === 'hi' ? 'सुविधा:' : language === 'mr' ? 'सुविधा:' : 'Facility:'} <b className="text-emerald-700 dark:text-emerald-400">{formatUserDisplayName(recyclerProfile?.facilityName || 'ABC E-Waste Recycling Pvt Ltd', 'RECYCLER', language)}</b> • {language === 'hi' ? 'CPCB ईपीआर नियम 19 अनुपालित' : language === 'mr' ? 'CPCB ईपीआर नियम 19 सुसंगत' : 'CPCB EPR Rule 19 Compliant'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-mono font-black border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{language === 'hi' ? 'सक्रिय:' : language === 'mr' ? 'सक्रिय:' : 'Active:'} {facilityLots.filter(l => l.status !== 'RECYCLED').length}</span>
            </span>
            <span className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-xl text-xs font-mono font-black border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{language === 'hi' ? 'रीसाइक्लिंग पूर्ण:' : language === 'mr' ? 'पुनर्प्रक्रिया पूर्ण:' : 'Recycled:'} {facilityLots.filter(l => l.status === 'RECYCLED').length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Material Inventory Stock Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{t.materialStockTitle} ({formatUserDisplayName(recyclerProfile?.facilityName || 'My Facility Stock', 'RECYCLER', language)})</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {Object.entries(inventoryWeights).map(([cat, weight]) => (
            <div key={cat} className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
              <div>
                <span className="font-bold text-slate-500 dark:text-slate-400 block">{getCategoryLabel(cat, language)}</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">{weight} {language === 'hi' || language === 'mr' ? 'किग्रा' : 'kg'}</span>
              </div>
              <span className="text-2xl p-2 rounded-xl bg-white dark:bg-slate-900 shadow-2xs border border-slate-100 dark:border-slate-800">
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'hi' ? 'लाइफसाइकिल पाइपलाइन प्रगति:' : language === 'mr' ? 'लाइफसायकल पाइपलाइन प्रगती:' : 'Lifecycle Pipeline Progress:'} <b className="text-emerald-700 dark:text-emerald-400 font-mono">{currentLot.id}</b></span>
            </span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {getCategoryLabel(currentLot.materialCategory, language)} • {currentLot.actualWeight || currentLot.approxWeight} {language === 'hi' || language === 'mr' ? 'किग्रा' : 'kg'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            {pipelineSteps.map((step, idx) => {
              const isPast = isLotFullyRecycled ? idx <= currentStepIdx : idx < currentStepIdx;
              const isCurrent = !isLotFullyRecycled && idx === currentStepIdx;
              const isPending = !isLotFullyRecycled && idx > currentStepIdx;

              return (
                <div 
                  key={step.stage}
                  className={`p-3.5 rounded-2xl border transition-all text-xs relative ${
                    isPast 
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 shadow-2xs'
                      : isCurrent
                      ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-slate-950 border-2 border-emerald-600 dark:border-emerald-500 text-slate-900 dark:text-white shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                      isPast 
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-emerald-500 text-white animate-pulse'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {isPast ? '✓' : step.num}
                    </span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-extrabold tracking-wider">
                        {language === 'hi' ? 'सक्रिय' : language === 'mr' ? 'सक्रिय' : 'ACTIVE'}
                      </span>
                    )}
                    {isLotFullyRecycled && idx === 4 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black animate-pulse">
                        {language === 'hi' || language === 'mr' ? 'पूर्ण' : 'DONE'}
                      </span>
                    )}
                  </div>
                  <div className="font-extrabold text-xs truncate text-slate-900 dark:text-white">{step.title}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{step.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STAGE PROGRESSION & LOT MANAGEMENT */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              {t.advanceStageTitle}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'hi'
                ? 'कानूनी रीसाइक्लिंग चेकपॉइंट के माध्यम से सामग्री बैचों को आगे बढ़ाएं और CPCB फॉर्म-6 प्रमाण बनाएं'
                : language === 'mr'
                ? 'कायदेशीर रिसायकलिंग तपासणीद्वारे सामग्रीच्या बॅचेस पुढे न्या आणि CPCB फॉर्म-6 पुरावे तयार करा'
                : 'Advance material batches through legal recycling checkpoints and generate CPCB Form-6 proofs'}
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleTabChange('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTab === 'ALL' ? 'bg-white dark:bg-emerald-600 text-emerald-800 dark:text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {language === 'hi' ? 'सभी' : language === 'mr' ? 'सर्व' : 'All'} ({facilityLots.length})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('IN_PROCESS')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTab === 'IN_PROCESS' ? 'bg-white dark:bg-emerald-600 text-emerald-800 dark:text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {language === 'hi' ? 'प्रसंस्करण में' : language === 'mr' ? 'प्रक्रियेत' : 'In-Process'} ({facilityLots.filter(l => l.status !== 'RECYCLED').length})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTab === 'COMPLETED' ? 'bg-white dark:bg-emerald-600 text-emerald-800 dark:text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {language === 'hi' || language === 'mr' ? 'पूर्ण' : 'Completed'} ({facilityLots.filter(l => l.status === 'RECYCLED').length})
            </button>
          </div>
        </div>

        {displayedLots.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-8 text-center space-y-3 border border-slate-200 dark:border-slate-800">
            <Factory className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {language === 'hi' ? 'आपकी सुविधा इन्वेंटरी में चयनित फ़िल्टर से मेल खाता कोई लॉट नहीं मिला।' : language === 'mr' ? 'तुमच्या सुविधेतील इन्व्हेंटरीमध्ये निवडलेल्या फिल्टरशी जुळणारा कोणताही लॉट आढळला नाही.' : 'No lots found matching the selected filter in your facility inventory.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleUpdateStage} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t.selectLotPrompt}</label>
                <select
                  value={selectedLotId}
                  onChange={(e) => handleLotSelect(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs"
                  required
                >
                  {displayedLots.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.id} - {getCategoryLabel(l.materialCategory, language)} ({l.actualWeight || l.approxWeight} {language === 'hi' || language === 'mr' ? 'किग्रा' : 'kg'}) [{getStatusLabel(l.status, language)}]
                    </option>
                  ))}
                </select>
              </div>

              {!isLotFullyRecycled ? (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t.nextStagePrompt}</label>
                  <select
                    value={targetStage}
                    onChange={(e) => handleStageChange(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs"
                  >
                    {validNextStages.map(s => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-xs block">{language === 'hi' ? '100% औपचारिक रीसाइक्लिंग पूर्ण' : language === 'mr' ? '100% औपचारिक रिसायकल पूर्ण' : '100% Formally Recycled'}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{language === 'hi' ? 'अंतिम जीवनचक्र स्थिति तक पहुंच गया। नीचे प्रमाणपत्र तैयार है।' : language === 'mr' ? 'अंतिम जीवनचक्र स्थिती पूर्ण झाली. खाली प्रमाणपत्र तयार आहे.' : 'Terminal lifecycle state reached. Certificate ready below.'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* If lot is already recycled, show Certificate card instead of Advance button */}
            {isLotFullyRecycled ? (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/80 dark:to-teal-950/60 border-2 border-emerald-500/80 rounded-2xl p-6 text-center space-y-3 shadow-md">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">{language === 'hi' ? 'यह खेप 100% औपचारिक रूप से रीसायकल हो चुकी है!' : language === 'mr' ? 'हा माल 100% औपचारिकपणे रिसायकल झाला आहे!' : 'This Consignment is 100% Formally Recycled!'}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
                    {language === 'hi'
                      ? 'सभी खतरनाक सामग्रियां निष्प्रभावी कर दी गई हैं, मूल्यवान द्वितीयक कच्चा माल निकाला गया है, और CPCB फॉर्म-6 मेनिफेस्ट तैयार है।'
                      : language === 'mr'
                      ? 'सर्व धोकादायक साहित्य निष्प्रभ केले आहे, मौल्यवान दुय्यम कच्चा माल काढला आहे आणि CPCB फॉर्म-6 मॅनिफेस्ट तयार आहे.'
                      : 'All hazardous materials neutralized, valuable secondary raw materials extracted, and CPCB Form-6 manifest generated.'}
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCertModal(true)}
                    className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-lg inline-flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <Award className="w-4 h-4" />
                    <span>{t.greenCertTitle}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      {t.recoveredDetailsLabel}
                    </label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                      {language === 'hi' ? 'CPCB नियम 2022 रिकवरी मानक' : language === 'mr' ? 'CPCB नियम 2022 रिकव्हरी मानके' : 'CPCB Rule 2022 Recovery Standards'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={recoveredDetails}
                    onChange={(e) => setRecoveredDetails(e.target.value)}
                    placeholder={language === 'hi' ? 'पुनर्प्राप्त अंश...' : language === 'mr' ? 'पुनर्प्राप्त अंश...' : 'Recovered fractions...'}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-mono font-medium"
                    required
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                    {language === 'hi' ? '* अपरिवर्तनीय डबल-एंट्री ट्रैसेबिलिटी ऑडिट ट्रेल में दर्ज।' : language === 'mr' ? '* अपरिवर्तनीय डबल-एंट्री ट्रॅसेबिलिटी ऑडिट ट्रेलमध्ये नोंदवले.' : '* Logged into immutable double-entry traceability audit trail.'}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedLotId || isLotFullyRecycled}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all"
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
