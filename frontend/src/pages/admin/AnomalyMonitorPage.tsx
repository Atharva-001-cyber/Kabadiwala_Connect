import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Eye, 
  Filter,
  RefreshCw,
  Scale,
  DollarSign,
  Camera,
  AlertCircle,
  Clock,
  Check,
  Building2,
  FileCheck2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { AnomalyFlag, AnomalyStatus, AnomalySeverity, AnomalyType } from '../../types';
import { getStatusLabel } from '../../i18n/translations';

export const AnomalyMonitorPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [anomalies, setAnomalies] = useState<AnomalyFlag[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Resolution Notes Modal State
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    anomaly: AnomalyFlag | null;
    targetStatus: AnomalyStatus;
    notes: string;
  }>({
    isOpen: false,
    anomaly: null,
    targetStatus: 'RESOLVED',
    notes: ''
  });

  const fetchAnomalies = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    try {
      const res = await api.getAnomalies();
      if (res.success) {
        setAnomalies(res.anomalies || []);
      }
    } catch (e) {
      console.warn('Anomaly fetch error:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnomalies(false);
  }, []);

  const handleUpdateStatus = async (id: string, status: AnomalyStatus, notes?: string) => {
    try {
      const res = await api.updateAnomalyStatus(id, status, notes);
      if (res.success) {
        showToast(
          status === 'RESOLVED' 
            ? (language === 'hi' ? 'विसंगति सफलतापूर्वक सुलझाई गई' : 'Anomaly resolved & cleared')
            : status === 'UNDER_REVIEW'
            ? (language === 'hi' ? 'जांच के लिए चिन्हित' : 'Marked under administrative review')
            : (language === 'hi' ? 'विसंगति खारिज की गई' : 'Anomaly dismissed as false positive'),
          'success'
        );
        fetchAnomalies(true);
      }
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setActionModal({ isOpen: false, anomaly: null, targetStatus: 'RESOLVED', notes: '' });
    }
  };

  // Executive KPI Aggregates
  const kpis = useMemo(() => {
    const total = anomalies.length;
    const open = anomalies.filter(a => a.status === 'OPEN').length;
    const high = anomalies.filter(a => a.severity === 'HIGH' && a.status !== 'RESOLVED' && a.status !== 'DISMISSED').length;
    const tare = anomalies.filter(a => a.anomalyType === 'WEIGHT_MISMATCH').length;
    const underReview = anomalies.filter(a => a.status === 'UNDER_REVIEW').length;
    const resolved = anomalies.filter(a => a.status === 'RESOLVED').length;
    const dismissed = anomalies.filter(a => a.status === 'DISMISSED').length;

    return { total, open, high, tare, underReview, resolved, dismissed };
  }, [anomalies]);

  // Filtered & Searched Anomalies
  const filtered = useMemo(() => {
    return anomalies.filter(a => {
      // Status filter
      if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;

      // Severity filter
      if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = a.id?.toLowerCase().includes(q);
        const lotMatch = a.lotId?.toLowerCase().includes(q);
        const descMatch = a.description?.toLowerCase().includes(q);
        const daemonMatch = a.flaggedBy?.toLowerCase().includes(q);
        const typeMatch = a.anomalyType?.toLowerCase().includes(q);
        if (!idMatch && !lotMatch && !descMatch && !daemonMatch && !typeMatch) return false;
      }

      return true;
    });
  }, [anomalies, filterStatus, filterSeverity, searchQuery]);

  // Formatting helpers
  const getAnomalyTypeLabel = (type: AnomalyType) => {
    switch (type) {
      case 'WEIGHT_MISMATCH':
        return { label: 'Scale Tare Discrepancy', icon: Scale, color: 'text-amber-300 bg-amber-950/80 border-amber-800' };
      case 'PRICE_OUTLIER':
        return { label: 'Market Rate Outlier', icon: DollarSign, color: 'text-purple-300 bg-purple-950/80 border-purple-800' };
      case 'REPEATED_SUSPICIOUS':
        return { label: 'AI Vision Quality Flag', icon: Camera, color: 'text-cyan-300 bg-cyan-950/80 border-cyan-800' };
      case 'UNVERIFIED_RECYCLER':
        return { label: 'Compliance Breach', icon: ShieldAlert, color: 'text-red-300 bg-red-950/80 border-red-800' };
      default:
        return { label: type, icon: AlertTriangle, color: 'text-slate-300 bg-slate-900 border-slate-700' };
    }
  };

  const getEntityDisplay = (item: AnomalyFlag) => {
    const type = item.entityType || 'LOT';
    if (type === 'PRICE' || item.lotId?.includes('RATE_BENCHMARK') || item.lotId === 'PRICE_UPDATE') {
      return {
        prefix: '🏷️ Price Corridor',
        value: 'PCB Benchmark (Lucknow)',
        badgeColor: 'text-purple-300 bg-purple-950 border-purple-800'
      };
    }
    if (type === 'RECYCLER' || item.lotId?.startsWith('rec_')) {
      return {
        prefix: '🏭 Facility',
        value: 'Apex Scrap Dismantlers',
        badgeColor: 'text-red-300 bg-red-950 border-red-800'
      };
    }
    return {
      prefix: '📦 Lot',
      value: item.lotId,
      badgeColor: 'text-amber-300 bg-amber-950 border-amber-800'
    };
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border-2 border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {t.adminAnomalyTitle}
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-amber-900/80 text-amber-300 border border-amber-600/60">
                  AI INTEGRITY ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {t.adminAnomalySubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchAnomalies(false)}
              disabled={isRefreshing}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Live DB'}</span>
            </button>
            <span className="px-3 py-2 rounded-xl bg-emerald-950 text-emerald-300 text-xs font-black border border-emerald-800 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>CENTRAL AUDIT GATEWAY ACTIVE</span>
            </span>
          </div>
        </div>

        {/* 5-Column Executive KPI Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/90 space-y-0.5">
            <span className="text-slate-400 text-[10px] font-extrabold uppercase block">
              {language === 'hi' ? 'कुल विसंगतियां' : 'Total Flags'}
            </span>
            <span className="text-xl font-black text-white font-mono block">
              {kpis.total}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">All Monitored Events</span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/90 space-y-0.5">
            <span className="text-slate-400 text-[10px] font-extrabold uppercase block">
              {language === 'hi' ? 'गंभीर चेतावनी' : 'Critical Alerts'}
            </span>
            <span className="text-xl font-black text-red-400 font-mono block">
              {kpis.high}
            </span>
            <span className="text-[10px] text-red-400/80 font-bold">Action Required</span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/90 space-y-0.5">
            <span className="text-slate-400 text-[10px] font-extrabold uppercase block">
              {language === 'hi' ? 'वजन विसंगतियां' : 'Tare Variances'}
            </span>
            <span className="text-xl font-black text-amber-400 font-mono block">
              {kpis.tare}
            </span>
            <span className="text-[10px] text-amber-400/80 font-bold">Scale Calibration</span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/90 space-y-0.5">
            <span className="text-slate-400 text-[10px] font-extrabold uppercase block">
              {language === 'hi' ? 'जांच जारी' : 'Under Review'}
            </span>
            <span className="text-xl font-black text-cyan-400 font-mono block">
              {kpis.underReview}
            </span>
            <span className="text-[10px] text-cyan-400/80 font-bold">Auditor Assigned</span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/90 space-y-0.5">
            <span className="text-slate-400 text-[10px] font-extrabold uppercase block">
              {language === 'hi' ? 'सुलझाए गए' : 'Resolved & Cleared'}
            </span>
            <span className="text-xl font-black text-emerald-400 font-mono block">
              {kpis.resolved}
            </span>
            <span className="text-[10px] text-emerald-400/80 font-bold">Audit Completed</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-lg">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { value: 'ALL', label: `All (${kpis.total})` },
            { value: 'OPEN', label: `Open (${kpis.open})` },
            { value: 'UNDER_REVIEW', label: `Under Review (${kpis.underReview})` },
            { value: 'RESOLVED', label: `Resolved (${kpis.resolved})` },
            { value: 'DISMISSED', label: `Dismissed (${kpis.dismissed})` }
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilterStatus(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterStatus === tab.value
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Severity Filter + Live Search Input */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Severity Dropdown Pill */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 font-bold focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Severity</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>

          {/* Search Input */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'hi' ? 'लॉट, विसंगति, प्रकार खोजें...' : 'Search lot, type, keyword...'}
              className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-3xl">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-300">Synchronizing AI Anomaly Detection Feed from Supabase Cloud...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="p-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="text-sm font-bold text-white">No anomalies matching selected filters.</p>
          <p className="text-xs text-slate-400">All electronic scrap transactions conform to CPCB tare and price benchmarks.</p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setFilterStatus('ALL'); setFilterSeverity('ALL'); }}
            className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Anomalies Feed */}
      <div className="space-y-4">
        {filtered.map((item) => {
          const typeMeta = getAnomalyTypeLabel(item.anomalyType);
          const entityMeta = getEntityDisplay(item);
          const Icon = typeMeta.icon;
          const isHigh = item.severity === 'HIGH';
          const isResolved = item.status === 'RESOLVED';
          const isDismissed = item.status === 'DISMISSED';
          const isUnderReview = item.status === 'UNDER_REVIEW';

          return (
            <div
              key={item.id}
              className={`bg-slate-900 border-2 ${
                isHigh && !isResolved && !isDismissed
                  ? 'border-red-800/80 shadow-red-950/20' 
                  : isUnderReview
                  ? 'border-cyan-800/80'
                  : 'border-slate-800'
              } hover:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 text-xs transition-all`}
            >
              {/* Card Header: Entity Badge, Severity, Type, Daemon & Timestamp */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Entity Identifier Pill */}
                  <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black border flex items-center gap-1.5 ${entityMeta.badgeColor}`}>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{entityMeta.prefix}:</span>
                    <span className="tracking-wide">{entityMeta.value}</span>
                  </div>

                  {/* Severity Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border flex items-center gap-1 ${
                      item.severity === 'HIGH'
                        ? 'bg-red-950 text-red-300 border-red-800'
                        : item.severity === 'MEDIUM'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-blue-950 text-blue-300 border-blue-800'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${item.severity === 'HIGH' ? 'bg-red-400 animate-pulse' : item.severity === 'MEDIUM' ? 'bg-amber-400' : 'bg-blue-400'}`}></span>
                    <span>{item.severity} SEVERITY</span>
                  </span>

                  {/* Anomaly Type Pill */}
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 ${typeMeta.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span>{typeMeta.label}</span>
                  </span>

                  {/* Flagged by Daemon Pill */}
                  {item.flaggedBy && (
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[9px] text-slate-400">
                      via {item.flaggedBy}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px] self-start sm:self-center">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(item.createdAt).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Anomaly Description Box */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <p className="text-sm font-medium text-slate-200 leading-relaxed">
                  {item.description}
                </p>

                {/* Resolution Notes (if resolved) */}
                {item.resolutionNotes && (
                  <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-start gap-2 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white">Resolution Audit Record: </span>
                      <span>{item.resolutionNotes}</span>
                      {item.resolvedAt && (
                        <span className="text-[10px] font-mono text-slate-500 ml-2">
                          ({new Date(item.resolvedAt).toLocaleString('en-IN')})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status & Lifecycle Action Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">
                    {language === 'hi' ? 'वर्तमान स्थिति:' : 'Current Status:'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                    isResolved
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : isDismissed
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : isUnderReview
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}>
                    {getStatusLabel(item.status, language)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {/* Mark Under Review (if OPEN) */}
                  {item.status === 'OPEN' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(item.id, 'UNDER_REVIEW')}
                      className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-bold flex items-center gap-1.5 shadow transition-all active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Investigate</span>
                    </button>
                  )}

                  {/* Resolve Anomaly Button */}
                  {!isResolved && (
                    <button
                      type="button"
                      onClick={() => setActionModal({ isOpen: true, anomaly: item, targetStatus: 'RESOLVED', notes: '' })}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow transition-all active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t.resolveAnomalyBtn}</span>
                    </button>
                  )}

                  {/* Dismiss Anomaly Button */}
                  {!isDismissed && !isResolved && (
                    <button
                      type="button"
                      onClick={() => setActionModal({ isOpen: true, anomaly: item, targetStatus: 'DISMISSED', notes: '' })}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all active:scale-95"
                    >
                      <span>{t.dismissAnomalyBtn}</span>
                    </button>
                  )}

                  {/* Reopen Action (if resolved/dismissed) */}
                  {(isResolved || isDismissed) && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(item.id, 'OPEN')}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white font-bold transition-all text-xs"
                    >
                      <span>Re-Open Case</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Notes & Confirmation Modal */}
      {actionModal.isOpen && actionModal.anomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              {actionModal.targetStatus === 'RESOLVED' ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-7 h-7 text-slate-400 shrink-0" />
              )}
              <div>
                <h3 className="text-base font-black text-white">
                  {actionModal.targetStatus === 'RESOLVED' ? 'Resolve & Clear Anomaly' : 'Dismiss Anomaly Flag'}
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {actionModal.anomaly.lotId || actionModal.anomaly.id}
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300">
              {actionModal.anomaly.description}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">
                Resolution & Audit Notes (Optional):
              </label>
              <textarea
                value={actionModal.notes}
                onChange={(e) => setActionModal({ ...actionModal, notes: e.target.value })}
                placeholder={
                  actionModal.targetStatus === 'RESOLVED'
                    ? 'e.g. Tare variance audited; scale recalibrated against test weight.'
                    : 'e.g. False positive; verified acceptable market fluctuation.'
                }
                rows={3}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActionModal({ isOpen: false, anomaly: null, targetStatus: 'RESOLVED', notes: '' })}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-all"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(actionModal.anomaly!.id, actionModal.targetStatus, actionModal.notes)}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow transition-all active:scale-95 ${
                  actionModal.targetStatus === 'RESOLVED'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {actionModal.targetStatus === 'RESOLVED' ? 'Confirm Resolution' : 'Confirm Dismissal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
