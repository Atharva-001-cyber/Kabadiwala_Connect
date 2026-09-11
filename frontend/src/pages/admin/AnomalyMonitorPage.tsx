import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, XCircle, Search, Eye, Filter } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { AnomalyFlag, AnomalyStatus } from '../../types';
import { getStatusLabel } from '../../i18n/translations';

export const AnomalyMonitorPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [anomalies, setAnomalies] = useState<AnomalyFlag[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const res = await api.getAnomalies();
      if (res.success) {
        setAnomalies(res.anomalies);
      }
    } catch (e) {
      console.warn('Anomaly fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const handleUpdateStatus = async (id: string, status: AnomalyStatus) => {
    try {
      const res = await api.updateAnomalyStatus(id, status);
      if (res.success) {
        showToast(t.anomalyUpdated, 'success');
        fetchAnomalies();
      }
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  const filterOptions = [
    { value: 'ALL', label: t.filterAll },
    { value: 'OPEN', label: t.filterOpen },
    { value: 'UNDER_REVIEW', label: t.filterUnderReview },
    { value: 'RESOLVED', label: t.filterResolved },
    { value: 'DISMISSED', label: t.filterDismissed }
  ];

  const filtered = anomalies.filter(a => filterStatus === 'ALL' || a.status === filterStatus);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>⚠️</span>
            <span>{t.adminAnomalyTitle}</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {t.adminAnomalySubtitle}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 border-t border-slate-800 pt-3 text-xs font-bold overflow-x-auto pb-1">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                filterStatus === opt.value ? 'bg-amber-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Anomalies Feed */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 font-medium text-xs">
            {t.noAnomaliesFound}
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-400">{item.lotId}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                    item.severity === 'HIGH'
                      ? 'bg-red-950 text-red-300 border-red-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}>
                    {item.severity}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                    {item.anomalyType}
                  </span>
                </div>

                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(item.createdAt).toLocaleString('en-IN')}
                </span>
              </div>

              <p className="text-slate-200 font-medium bg-slate-950 p-3 rounded-xl border border-slate-800">
                {item.description}
              </p>

              <div className="flex items-center justify-between pt-1 text-slate-400">
                <span>
                  {language === 'hi' ? 'स्थिति' : language === 'mr' ? 'स्थिती' : 'Status'}: <b className="text-white font-mono">{getStatusLabel(item.status, language)}</b>
                </span>

                <div className="flex gap-2">
                  {item.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'RESOLVED')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1 shadow transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t.resolveAnomalyBtn}</span>
                    </button>
                  )}
                  {item.status !== 'DISMISSED' && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'DISMISSED')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                    >
                      {t.dismissAnomalyBtn}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

