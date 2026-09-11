import React, { useState, useEffect } from 'react';
import { Layers, CheckCircle2, ArrowRight, Factory, Sparkles, RefreshCw, Award } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Lot } from '../../types';
import { getStatusLabel, getCategoryLabel } from '../../i18n/translations';

export const InventoryProcessingPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [lots, setLots] = useState<Lot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [targetStage, setTargetStage] = useState<string>('SORTED');
  const [recoveredDetails, setRecoveredDetails] = useState<string>('Recovered: 8.5kg Refined Copper, 1.8kg Aluminium, 2.5kg Plastic Fractions');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchLots = async () => {
    try {
      const res = await api.getLots({ limit: '40' });
      if (res.success) {
        setLots(res.lots);
        const processingEligible = res.lots.filter(l => l.status === 'RECEIVED' || l.status === 'PROCESSING');
        if (processingEligible.length > 0 && !selectedLotId) {
          setSelectedLotId(processingEligible[0].id);
        }
      }
    } catch (e) {
      console.warn('Inventory fetch error:', e);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  const eligibleLots = lots.filter(l => l.status === 'RECEIVED' || l.status === 'PROCESSING');
  const currentLot = eligibleLots.find(l => l.id === selectedLotId) || eligibleLots[0];

  // Compute inventory category weights
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

  lots.forEach(l => {
    if (l.status === 'RECEIVED' || l.status === 'PROCESSING' || l.status === 'RECYCLED') {
      inventoryWeights[l.materialCategory] = (inventoryWeights[l.materialCategory] || 0) + l.approxWeight;
    }
  });

  const getValidStagesForLot = (lot?: Lot): { value: string; label: string }[] => {
    const allStages = [
      { value: 'RECYCLER_RECEIVED', label: t.stageWarehouseReceived },
      { value: 'SORTED', label: t.stageSorting },
      { value: 'PROCESSING', label: t.stageProcessing },
      { value: 'RECOVERED', label: t.stageRecovered },
      { value: 'RECYCLED', label: t.stageRecycled }
    ];

    if (!lot) return allStages;
    if (lot.status === 'RECEIVED') {
      return allStages.filter(s => ['SORTED', 'PROCESSING'].includes(s.value));
    }
    if (lot.status === 'PROCESSING') {
      return allStages.filter(s => ['SORTED', 'PROCESSING', 'RECOVERED', 'RECYCLED'].includes(s.value));
    }
    if (lot.status === 'RECYCLED') {
      return allStages.filter(s => s.value === 'RECYCLED');
    }
    return allStages;
  };

  const validStages = getValidStagesForLot(currentLot);

  useEffect(() => {
    if (validStages.length > 0 && !validStages.some(s => s.value === targetStage)) {
      setTargetStage(validStages[0].value);
    }
  }, [selectedLotId, validStages, targetStage]);

  const handleUpdateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotId || submitting) return;

    setSubmitting(true);
    try {
      const res = await api.updateProcessingStage({
        lotId: selectedLotId,
        stage: targetStage,
        recoveredDetails
      });

      if (res.success) {
        const msg = {
          hi: `लॉट स्थिति सफलतापूर्वक '${targetStage}' में अपडेट हो गई!`,
          mr: `लॉट स्थिती यशस्वीरीत्या '${targetStage}' मध्ये अद्यतन केली!`,
          en: `Lot status successfully updated to '${targetStage}'!`
        }[language] || `Lot status successfully updated to '${targetStage}'!`;
        showToast(msg, 'success');
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
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <span>⚙️</span>
          <span>{t.inventoryProcessingTitle}</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          {t.inventoryProcessingSubtitle}
        </p>
      </div>

      {/* Material Inventory Stock Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>{t.materialStockTitle}</span>
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

      {/* Stage Progression Update Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-300">
          {t.advanceStageTitle}
        </h2>

        <form onSubmit={handleUpdateStage} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">{t.selectLotPrompt}</label>
              <select
                value={selectedLotId}
                onChange={(e) => setSelectedLotId(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500"
                required
              >
                {eligibleLots.length === 0 ? (
                  <option value="">
                    {language === 'hi' ? 'प्रसंस्करण हेतु कोई प्राप्त लॉट उपलब्ध नहीं' : language === 'mr' ? 'प्रक्रियेसाठी कोणतेही प्राप्त लॉट उपलब्ध नाही' : 'No received lots in facility inventory'}
                  </option>
                ) : (
                  eligibleLots.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.id} - {getCategoryLabel(l.materialCategory, language)} ({l.approxWeight} kg) [{getStatusLabel(l.status, language)}]
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5">{t.nextStagePrompt}</label>
              <select
                value={targetStage}
                onChange={(e) => setTargetStage(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500"
              >
                {validStages.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1.5">
              {t.recoveredDetailsLabel}
            </label>
            <input
              type="text"
              value={recoveredDetails}
              onChange={(e) => setRecoveredDetails(e.target.value)}
              placeholder="Recovered: 3.4g Gold, 1.2g Tantalum, 8.9kg Refined Copper"
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedLotId}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? t.updatingStage : t.advanceStageBtn}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

