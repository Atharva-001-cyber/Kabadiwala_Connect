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
import { getStatusLabel, formatUserDisplayName, formatAnomalyDescription } from '../../i18n/translations';

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
        return { 
          label: language === 'hi' ? 'कांटा वजन अंतर' : language === 'mr' ? 'वजन तफावत' : 'Scale Tare Discrepancy', 
          icon: Scale, 
          color: 'text-amber-800 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/80 dark:border-amber-800' 
        };
      case 'PRICE_OUTLIER':
        return { 
          label: language === 'hi' ? 'बाजार भाव भिन्नता' : language === 'mr' ? 'बाजार दर फरक' : 'Market Rate Outlier', 
          icon: DollarSign, 
          color: 'text-purple-800 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-950/80 dark:border-purple-800' 
        };
      case 'REPEATED_SUSPICIOUS':
        return { 
          label: language === 'hi' ? 'एआई विजन गुणवत्ता ध्वज' : language === 'mr' ? 'एआय व्हिजन गुणवत्ता ध्वज' : 'AI Vision Quality Flag', 
          icon: Camera, 
          color: 'text-cyan-800 bg-cyan-50 border-cyan-200 dark:text-cyan-300 dark:bg-cyan-950/80 dark:border-cyan-800' 
        };
      case 'UNVERIFIED_RECYCLER':
        return { 
          label: language === 'hi' ? 'अनुपालन उल्लंघन' : language === 'mr' ? 'अनुपालन उल्लंघन' : 'Compliance Breach', 
          icon: ShieldAlert, 
          color: 'text-red-800 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/80 dark:border-red-800' 
        };
      default:
        return { 
          label: type, 
          icon: AlertTriangle, 
          color: 'text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-900 dark:border-slate-700' 
        };
    }
  };

  const getEntityDisplay = (item: AnomalyFlag) => {
    const type = item.entityType || 'LOT';
    if (type === 'PRICE' || item.lotId?.includes('RATE_BENCHMARK') || item.lotId === 'PRICE_UPDATE') {
      return {
        prefix: `🏷️ ${language === 'hi' ? 'मूल्य कॉरिडोर' : language === 'mr' ? 'मूल्य कॉरिडोर' : 'Price Corridor'}`,
        value: language === 'hi' ? 'पीसीबी बेंचमार्क (लखनऊ)' : language === 'mr' ? 'पीसीबी बेंचमार्क (लखनऊ)' : 'PCB Benchmark (Lucknow)',
        badgeColor: 'text-purple-800 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-950 dark:border-purple-800'
      };
    }
    if (type === 'RECYCLER' || item.lotId?.startsWith('rec_')) {
      return {
        prefix: `🏭 ${language === 'hi' ? 'संयंत्र' : language === 'mr' ? 'सुविधा' : 'Facility'}`,
        value: formatUserDisplayName('Apex Scrap Dismantlers', 'RECYCLER', language),
        badgeColor: 'text-red-800 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950 dark:border-red-800'
      };
    }
    return {
      prefix: `📦 ${language === 'hi' ? 'लॉट' : language === 'mr' ? 'लॉट' : 'Lot'}`,
      value: item.lotId,
      badgeColor: 'text-amber-800 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950 dark:border-amber-800'
    };
  };

  const formatDaemonName = (daemon: string, lang: string): string => {
    if (lang === 'en') return daemon;
    const isHi = lang === 'hi';
    let str = daemon;
    str = str
      .replace(/^AI_/i, isHi ? 'एआई_' : 'एआय_')
      .replace(/DIGITAL_SCALE_TARE_DAEMON/i, isHi ? 'डिजिटल_कांटा_टेयर_डेमन' : 'डिजिटल_काटा_टेअर_डेमन')
      .replace(/PRICE_CORRIDOR_CHECKER/i, isHi ? 'मूल्य_कॉरिडोर_जांचकर्ता' : 'मूल्य_कॉरिडोर_तपासणीस')
      .replace(/SCALE_TARE_DAEMON/i, isHi ? 'कांटा_टेयर_डेमन' : 'काटा_टेअर_डेमन')
      .replace(/CORRIDOR_CHECKER/i, isHi ? 'कॉरिडोर_जांचकर्ता' : 'कॉरिडोर_तपासणीस')
      .replace(/PRICE_ORACLE/i, 'मूल्य_ओरेकल')
      .replace(/VISION_AUDITOR/i, isHi ? 'विजन_ऑडिटर' : 'व्हिजन_ऑडिटर')
      .replace(/SCALE_INTEGRITY/i, isHi ? 'कांटा_अखंडता' : 'काटा_अखंडता')
      .replace(/CPCB_COMPLIANCE/i, 'सीपीसीबी_अनुपालन')
      .replace(/MANUAL_AUDIT/i, 'मैन्युअल_ऑडिट')
      .replace(/_AUDITOR/i, '_ऑडिटर')
      .replace(/_ORACLE/i, '_ओरेकल')
      .replace(/_CHECKER/i, isHi ? '_जांचकर्ता' : '_तपासणीस')
      .replace(/_DAEMON/i, '_डेमन');
    return str;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-600/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40 flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {t.adminAnomalyTitle}
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-amber-50 text-amber-800 dark:bg-amber-900/80 dark:text-amber-300 border border-amber-200 dark:border-amber-600/60">
                  {language === 'hi' ? 'एआई अखंडता इंजन' : language === 'mr' ? 'एआय अखंडता इंजिन' : 'AI INTEGRITY ENGINE'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                {t.adminAnomalySubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchAnomalies(false)}
              disabled={isRefreshing}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-600 dark:text-amber-400' : ''}`} />
              <span>{isRefreshing ? (language === 'hi' ? 'सिंक हो रहा है...' : language === 'mr' ? 'सिंक होत आहे...' : 'Syncing...') : (language === 'hi' ? 'लाइव डीबी सिंक करें' : language === 'mr' ? 'लाइव्ह डीबी सिंक करा' : 'Sync Live DB')}</span>
            </button>
            <span className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-black border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
              <span>{language === 'hi' ? 'केंद्रीय ऑडिट गेटवे सक्रिय' : language === 'mr' ? 'केंद्रीय ऑडिट गेटवे सक्रिय' : 'CENTRAL AUDIT GATEWAY ACTIVE'}</span>
            </span>
          </div>
        </div>

        {/* 5-Column Executive KPI Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80">
          <div className="bg-white dark:bg-slate-950/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-sm space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase block">
              {language === 'hi' ? 'कुल विसंगतियां' : language === 'mr' ? 'एकूण विसंगती' : 'Total Flags'}
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono block">
              {kpis.total}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {language === 'hi' ? 'सभी निगरानी की गई घटनाएं' : language === 'mr' ? 'सर्व निरीक्षण केलेल्या घटना' : 'All Monitored Events'}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-950/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-sm space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase block">
              {language === 'hi' ? 'गंभीर चेतावनी' : language === 'mr' ? 'गंभीर इशारे' : 'Critical Alerts'}
            </span>
            <span className="text-xl font-black text-red-600 dark:text-red-400 font-mono block">
              {kpis.high}
            </span>
            <span className="text-[10px] text-red-600/80 dark:text-red-400/80 font-bold">
              {language === 'hi' ? 'कार्रवाई आवश्यक' : language === 'mr' ? 'कारवाई आवश्यक' : 'Action Required'}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-950/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-sm space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase block">
              {language === 'hi' ? 'वजन विसंगतियां' : language === 'mr' ? 'वजन तफावत' : 'Tare Variances'}
            </span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono block">
              {kpis.tare}
            </span>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-bold">
              {language === 'hi' ? 'कांटा अंशांकन' : language === 'mr' ? 'काटा कॅलिब्रेशन' : 'Scale Calibration'}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-950/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-sm space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase block">
              {language === 'hi' ? 'जांच जारी' : language === 'mr' ? 'तपासणी सुरू' : 'Under Review'}
            </span>
            <span className="text-xl font-black text-cyan-600 dark:text-cyan-400 font-mono block">
              {kpis.underReview}
            </span>
            <span className="text-[10px] text-cyan-600/80 dark:text-cyan-400/80 font-bold">
              {language === 'hi' ? 'ऑडिटर नियुक्त' : language === 'mr' ? 'ऑडिटर नियुक्त' : 'Auditor Assigned'}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-950/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-sm space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase block">
              {language === 'hi' ? 'सुलझाए गए' : language === 'mr' ? 'निकाली काढलेले' : 'Resolved & Cleared'}
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono block">
              {kpis.resolved}
            </span>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-bold">
              {language === 'hi' ? 'ऑडिट पूर्ण' : language === 'mr' ? 'ऑडिट पूर्ण' : 'Audit Completed'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { value: 'ALL', label: `${language === 'hi' ? 'सभी' : language === 'mr' ? 'सर्व' : 'All'} (${kpis.total})` },
            { value: 'OPEN', label: `${language === 'hi' ? 'समीक्षाधीन' : language === 'mr' ? 'उघडे' : 'Open'} (${kpis.open})` },
            { value: 'UNDER_REVIEW', label: `${language === 'hi' ? 'जांच जारी' : language === 'mr' ? 'तपासणी सुरू' : 'Under Review'} (${kpis.underReview})` },
            { value: 'RESOLVED', label: `${language === 'hi' ? 'निस्तारित' : language === 'mr' ? 'निकाली' : 'Resolved'} (${kpis.resolved})` },
            { value: 'DISMISSED', label: `${language === 'hi' ? 'खारिज' : language === 'mr' ? 'फेटाळलेले' : 'Dismissed'} (${kpis.dismissed})` }
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilterStatus(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterStatus === tab.value
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-950 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-white'
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
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">{language === 'hi' ? 'सभी गंभीरता' : language === 'mr' ? 'सर्व तीव्रता' : 'All Severity'}</option>
            <option value="HIGH">{language === 'hi' ? 'उच्च गंभीरता' : language === 'mr' ? 'उच्च तीव्रता' : 'High Severity'}</option>
            <option value="MEDIUM">{language === 'hi' ? 'मध्यम गंभीरता' : language === 'mr' ? 'मध्यम तीव्रता' : 'Medium Severity'}</option>
            <option value="LOW">{language === 'hi' ? 'निम्न गंभीरता' : language === 'mr' ? 'कमी तीव्रता' : 'Low Severity'}</option>
          </select>

          {/* Search Input */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'hi' ? 'लॉट, विसंगति, प्रकार खोजें...' : language === 'mr' ? 'लॉट, विसंगती, प्रकार शोधा...' : 'Search lot, type, keyword...'}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {language === 'hi' 
              ? 'सुपाबेस क्लाउड से एआई विसंगति जांच डेटा सिंक हो रहा है...' 
              : language === 'mr' 
              ? 'सुपाबेस क्लाउडवरून एआय विसंगती शोध फीड सिंक होत आहे...' 
              : 'Synchronizing AI Anomaly Detection Feed from Supabase Cloud...'}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {language === 'hi' 
              ? 'चुने गए फ़िल्टर के अनुसार कोई विसंगतियां नहीं मिलीं।' 
              : language === 'mr' 
              ? 'निवडलेल्या फिल्टरनुसार कोणतीही विसंगती आढळली नाही.' 
              : 'No anomalies matching selected filters.'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'hi' 
              ? 'सभी इलेक्ट्रॉनिक कचरा लेनदेन सीपीसीबी वजन व मूल्य मानदंडों के अनुरूप हैं।' 
              : language === 'mr' 
              ? 'सर्व इलेक्ट्रॉनिक कचरा व्यवहार सीपीसीबी वजन आणि किमतीच्या मानकांनुसार आहेत.' 
              : 'All electronic scrap transactions conform to CPCB tare and price benchmarks.'}
          </p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setFilterStatus('ALL'); setFilterSeverity('ALL'); }}
            className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-amber-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-amber-300 text-xs font-bold rounded-xl transition-all"
          >
            {language === 'hi' ? 'फ़िल्टर रीसेट करें' : language === 'mr' ? 'फिल्टर रीसेट करा' : 'Reset Filters'}
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
              className={`bg-white dark:bg-slate-900 border ${
                isHigh && !isResolved && !isDismissed
                  ? 'border-red-300 dark:border-red-800/80 shadow-red-500/10' 
                  : isUnderReview
                  ? 'border-cyan-300 dark:border-cyan-800/80'
                  : 'border-slate-200 dark:border-slate-800'
              } hover:border-emerald-300 dark:hover:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md space-y-4 text-xs transition-all`}
            >
              {/* Card Header: Entity Badge, Severity, Type, Daemon & Timestamp */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Entity Identifier Pill */}
                  <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black border flex items-center gap-1.5 ${entityMeta.badgeColor}`}>
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">{entityMeta.prefix}:</span>
                    <span className="tracking-wide">{entityMeta.value}</span>
                  </div>

                  {/* Severity Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border flex items-center gap-1 ${
                      item.severity === 'HIGH'
                        ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                        : item.severity === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                        : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${item.severity === 'HIGH' ? 'bg-red-500 animate-pulse' : item.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                    <span>
                      {item.severity === 'HIGH'
                        ? (language === 'hi' ? 'उच्च गंभीरता' : language === 'mr' ? 'उच्च तीव्रता' : 'HIGH SEVERITY')
                        : item.severity === 'MEDIUM'
                        ? (language === 'hi' ? 'मध्यम गंभीरता' : language === 'mr' ? 'मध्यम तीव्रता' : 'MEDIUM SEVERITY')
                        : (language === 'hi' ? 'निम्न गंभीरता' : language === 'mr' ? 'कमी तीव्रता' : 'LOW SEVERITY')}
                    </span>
                  </span>

                  {/* Anomaly Type Pill */}
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 ${typeMeta.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span>{typeMeta.label}</span>
                  </span>

                  {/* Flagged by Daemon Pill */}
                  {item.flaggedBy && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[9px] text-slate-600 dark:text-slate-400">
                      {language === 'hi' ? 'द्वारा ' : language === 'mr' ? 'द्वारे ' : 'via '}
                      {formatDaemonName(item.flaggedBy, language)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px] self-start sm:self-center">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(item.createdAt).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Anomaly Description Box */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {formatAnomalyDescription(item.description, language)}
                </p>

                {/* Resolution Notes (if resolved) */}
                {item.resolutionNotes && (
                  <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {language === 'hi' ? 'निपटारा ऑडिट रिकॉर्ड: ' : language === 'mr' ? 'निकाली नोंद: ' : 'Resolution Audit Record: '}
                      </span>
                      <span>{formatAnomalyDescription(item.resolutionNotes, language)}</span>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                    {language === 'hi' ? 'वर्तमान स्थिति:' : language === 'mr' ? 'सध्याची स्थिती:' : 'Current Status:'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                    isResolved
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                      : isDismissed
                      ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      : isUnderReview
                      ? 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800'
                      : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
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
                      className="px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 dark:bg-cyan-950 dark:hover:bg-cyan-900 dark:border-cyan-700 dark:text-cyan-300 font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'जांच करें' : language === 'mr' ? 'तपासणी करा' : 'Investigate'}</span>
                    </button>
                  )}

                  {/* Resolve Anomaly Button */}
                  {!isResolved && (
                    <button
                      type="button"
                      onClick={() => setActionModal({ isOpen: true, anomaly: item, targetStatus: 'RESOLVED', notes: '' })}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
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
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-bold transition-all active:scale-95"
                    >
                      <span>{t.dismissAnomalyBtn}</span>
                    </button>
                  )}

                  {/* Reopen Action (if resolved/dismissed) */}
                  {(isResolved || isDismissed) && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(item.id, 'OPEN')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:text-white font-bold transition-all text-xs"
                    >
                      <span>{language === 'hi' ? 'केस पुनः खोलें' : language === 'mr' ? 'केस पुन्हा उघडा' : 'Re-Open Case'}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/80 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              {actionModal.targetStatus === 'RESOLVED' ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-7 h-7 text-slate-500 dark:text-slate-400 shrink-0" />
              )}
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {actionModal.targetStatus === 'RESOLVED' 
                    ? (language === 'hi' ? 'विसंगति निस्तारित एवं क्लियर करें' : language === 'mr' ? 'विसंगती निकाली काढा व स्पष्ट करा' : 'Resolve & Clear Anomaly') 
                    : (language === 'hi' ? 'विसंगति ध्वज खारिज करें' : language === 'mr' ? 'विसंगती ध्वज फेटाळा' : 'Dismiss Anomaly Flag')}
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {actionModal.anomaly.lotId || actionModal.anomaly.id}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {formatAnomalyDescription(actionModal.anomaly.description, language)}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {language === 'hi' ? 'निपटारा व ऑडिट टिप्पणी (वैकल्पिक):' : language === 'mr' ? 'निकाली व ऑडिट टिप्पणी (पर्यायी):' : 'Resolution & Audit Notes (Optional):'}
              </label>
              <textarea
                value={actionModal.notes}
                onChange={(e) => setActionModal({ ...actionModal, notes: e.target.value })}
                placeholder={
                  actionModal.targetStatus === 'RESOLVED'
                    ? (language === 'hi' ? 'उदा. वजन अंतर की जांच की गई; कांटा पुनः अंशांकित।' : language === 'mr' ? 'उदा. वजन तफावतीची तपासणी केली; काटा पुन्हा कॅलिब्रेट केला.' : 'e.g. Tare variance audited; scale recalibrated against test weight.')
                    : (language === 'hi' ? 'उदा. गलत चेतावनी; स्वीकार्य बाजार उतार-चढ़ाव की पुष्टि।' : language === 'mr' ? 'उदा. चुकीचा इशारा; स्वीकार्य बाजार घसरणीची पडताळणी.' : 'e.g. False positive; verified acceptable market fluctuation.')
                }
                rows={3}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActionModal({ isOpen: false, anomaly: null, targetStatus: 'RESOLVED', notes: '' })}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(actionModal.anomaly!.id, actionModal.targetStatus, actionModal.notes)}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow transition-all active:scale-95 ${
                  actionModal.targetStatus === 'RESOLVED'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {actionModal.targetStatus === 'RESOLVED'
                  ? (language === 'hi' ? 'निपटारा की पुष्टि करें' : language === 'mr' ? 'निकालीची पुष्टी करा' : 'Confirm Resolution')
                  : (language === 'hi' ? 'खारिज करने की पुष्टि करें' : language === 'mr' ? 'फेटाळण्याची पुष्टी करा' : 'Confirm Dismissal')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
