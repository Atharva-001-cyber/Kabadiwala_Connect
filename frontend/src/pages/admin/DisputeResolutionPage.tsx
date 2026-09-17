import React, { useState, useEffect, useMemo } from 'react';
import { 
  Scale, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Search, 
  Filter, 
  ShieldCheck, 
  Clock, 
  User, 
  Building2, 
  Phone, 
  MapPin, 
  FileText, 
  RefreshCw, 
  X, 
  ExternalLink, 
  Gavel, 
  ArrowRight,
  Sparkles,
  Award
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Dispute, DisputeStatus } from '../../types';
import { getStatusLabel } from '../../i18n/translations';

export const DisputeResolutionPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Modal state for issuing arbitration ruling
  const [activeModalDispute, setActiveModalDispute] = useState<Dispute | null>(null);
  const [rulingStatus, setRulingStatus] = useState<DisputeStatus>('RESOLVED');
  const [rulingNotes, setRulingNotes] = useState<string>('');
  const [submittingRuling, setSubmittingRuling] = useState(false);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await api.getDisputes();
      if (res.success) {
        setDisputes(res.disputes);
      }
    } catch (e) {
      console.warn('Disputes fetch error:', e);
      showToast(
        language === 'hi'
          ? 'विवाद डेटा लोड करने में समस्या आई'
          : language === 'mr'
          ? 'तक्रार डेटा लोड करताना त्रुटी आली'
          : 'Failed to load disputes feed',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();

    const handleSync = (e: any) => {
      if (e.detail?.table === 'disputes') {
        fetchDisputes();
      }
    };
    window.addEventListener('kb:sync', handleSync);
    return () => window.removeEventListener('kb:sync', handleSync);
  }, []);

  // Compute KPI metrics
  const stats = useMemo(() => {
    const total = disputes.length;
    const openCount = disputes.filter(d => d.status === 'OPEN').length;
    const underReview = disputes.filter(d => d.status === 'UNDER_REVIEW').length;
    const tareArbitrations = disputes.filter(d => 
      d.reason.toLowerCase().includes('tare') || 
      d.reason.toLowerCase().includes('weigh') || 
      d.reason.toLowerCase().includes('scale')
    ).length;
    const resolved = disputes.filter(d => d.status === 'RESOLVED').length;

    return { total, openCount, underReview, tareArbitrations, resolved };
  }, [disputes]);

  // Filtered disputes
  const filteredDisputes = useMemo(() => {
    return disputes.filter(d => {
      // Status filter
      if (statusFilter === 'OPEN' && d.status !== 'OPEN') return false;
      if (statusFilter === 'UNDER_REVIEW' && d.status !== 'UNDER_REVIEW') return false;
      if (statusFilter === 'RESOLVED' && d.status !== 'RESOLVED') return false;
      if (statusFilter === 'REJECTED' && d.status !== 'REJECTED') return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.id.toLowerCase().includes(q) ||
        d.lotId.toLowerCase().includes(q) ||
        d.reason.toLowerCase().includes(q) ||
        d.details.toLowerCase().includes(q) ||
        (d.collectorName && d.collectorName.toLowerCase().includes(q)) ||
        (d.recyclerName && d.recyclerName.toLowerCase().includes(q)) ||
        (d.resolutionNotes && d.resolutionNotes.toLowerCase().includes(q))
      );
    });
  }, [disputes, statusFilter, searchQuery]);

  const openRulingModal = (dispute: Dispute) => {
    setActiveModalDispute(dispute);
    setRulingStatus(dispute.status === 'RESOLVED' ? 'RESOLVED' : 'RESOLVED');
    setRulingNotes(dispute.resolutionNotes || dispute.adminNotes || '');
  };

  const applyPreset = (text: string) => {
    setRulingNotes(text);
  };

  const handleExecuteRuling = async () => {
    if (!activeModalDispute) return;
    if (!rulingNotes.trim()) {
      showToast(
        language === 'hi' 
          ? 'कृपया मध्यस्थता निर्णय या प्रशासनिक टिप्पणी दर्ज करें' 
          : language === 'mr'
          ? 'कृपया मध्यस्थी निर्णय किंवा टीप प्रविष्ट करा'
          : 'Please enter official mediation notes or ruling rationale',
        'warning'
      );
      return;
    }

    setSubmittingRuling(true);
    try {
      const res = await api.updateDisputeStatus(activeModalDispute.id, {
        status: rulingStatus,
        resolution: rulingNotes
      });

      if (res.success) {
        showToast(
          language === 'hi'
            ? `विवाद '${rulingStatus}' के रूप में सफलतापूर्वक निस्तारित किया गया!`
            : language === 'mr'
            ? `वाद '${rulingStatus}' म्हणून यशस्वीरीत्या निकाली काढण्यात आला!`
            : `CPCB arbitration verdict recorded as '${rulingStatus}'!`,
          'success'
        );
        setActiveModalDispute(null);
        setRulingNotes('');
        await fetchDisputes();
      }
    } catch (err: any) {
      showToast(err.message || 'Ruling update failed', 'error');
    } finally {
      setSubmittingRuling(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Executive Header */}
      <div className="bg-gradient-to-br from-white via-slate-50 to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                <Scale className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'hi' 
                  ? 'केंद्रीय विवाद मध्यस्थता एवं विधिक माप विज्ञान समाधान' 
                  : language === 'mr' 
                  ? 'केंद्रीय वाद मध्यस्थी आणि विधिक मापशास्त्र निवारण' 
                  : 'CPCB Dispute Arbitration & Legal Metrology Tribunal'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                CENTRAL TRIBUNAL ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
              {language === 'hi'
                ? 'कलेक्टर एवं अधिकृत रीसाइक्लर के मध्य इलेक्ट्रॉनिक तराजू वजन अंतर, टियर कटौती, सामग्री पुनर्वर्गीकरण एवं एस्क्रो भुगतान का केंद्रीय न्यायिक निस्तारण।'
                : language === 'mr'
                ? 'संकलक व अधिकृत रिसायकलर यांच्यातील इलेक्ट्रॉनिक वजन तफावत, टियर कपात, साहित्य पुनर्वर्गीकरण आणि एस्क्रो देयकांचे केंद्रीय लवादाद्वारे निवारण.'
                : 'Central statutory arbitration desk for resolving electronic scale tare variances, grade downgrades, and escrow payouts under the Legal Metrology Act.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDisputes}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
              <span>{language === 'hi' ? 'रीफ्रेश' : language === 'mr' ? 'ताजे करा' : 'Refresh Feed'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 KPI Executive Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Disputes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {language === 'hi' ? 'कुल विवाद' : language === 'mr' ? 'एकूण तक्रारी' : 'Total Filed'}
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stats.total}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            {language === 'hi' ? 'आधिकारिक सीपीसीबी रिकॉर्ड' : language === 'mr' ? 'अधिकृत सीपीसीबी नोंदी' : 'Official CPCB Dossiers'}
          </div>
        </div>

        {/* Action Required / Open */}
        <div className="bg-rose-50/40 dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 shadow-sm hover:border-rose-300 dark:hover:border-rose-700/60 transition-all">
          <div className="flex items-center justify-between text-rose-800 dark:text-rose-300 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {language === 'hi' ? 'तत्काल कार्रवाई आवश्यक' : language === 'mr' ? 'तातडीने कारवाई आवश्यक' : 'Action Required'}
            </span>
            <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">{stats.openCount}</div>
          <div className="text-[10px] text-rose-700 dark:text-rose-300/80 mt-1 font-medium">
            {stats.openCount > 0 ? (
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                Tribunal Mediation Pending
              </span>
            ) : (
              'All Actions Clear'
            )}
          </div>
        </div>

        {/* Under Review */}
        <div className="bg-amber-50/40 dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 shadow-sm hover:border-amber-300 dark:hover:border-amber-700/60 transition-all">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {language === 'hi' ? 'जांच जारी' : language === 'mr' ? 'तपास सुरू' : 'Under Review'}
            </span>
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{stats.underReview}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            {language === 'hi' ? 'समीक्षा एवं दस्तावेज ऑडिट' : language === 'mr' ? 'कागदपत्र तपासणी' : 'Technical Assay Active'}
          </div>
        </div>

        {/* Tare Arbitrations */}
        <div className="bg-cyan-50/40 dark:bg-slate-900 border border-cyan-200 dark:border-cyan-900/40 rounded-2xl p-4 shadow-sm hover:border-cyan-300 dark:hover:border-cyan-700/60 transition-all">
          <div className="flex items-center justify-between text-cyan-800 dark:text-cyan-300 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {language === 'hi' ? 'वजन व तराजू विवाद' : language === 'mr' ? 'वजन व काटा वाद' : 'Tare / Weighment'}
            </span>
            <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-700 dark:text-cyan-400">{stats.tareArbitrations}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            {language === 'hi' ? 'विधिक माप विज्ञान एक्ट 2009' : language === 'mr' ? 'विधिक मापशास्त्र कायदा' : 'Legal Metrology Audited'}
          </div>
        </div>

        {/* Settled & Closed */}
        <div className="bg-emerald-50/40 dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-all col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {language === 'hi' ? 'निस्तारित एवं बंद' : language === 'mr' ? 'निकाली व बंद' : 'Settled & Closed'}
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.resolved}</div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400/80 mt-1 font-medium">
            {language === 'hi' ? 'डिजिटल प्रमाण सहित सील' : language === 'mr' ? 'डिजिटल प्रमाणपत्रासह बंद' : 'Signed Vouchers Reconciled'}
          </div>
        </div>
      </div>

      {/* Search & Filter Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'hi'
                  ? 'लॉट आईडी, कलेक्टर नाम, रीसाइक्लर केंद्र या विवाद के कारण से खोजें...'
                  : language === 'mr'
                  ? 'लॉट आयडी, संकलकाचे नाव, रिसायकलर किंवा कारणावरून शोधा...'
                  : 'Search by Lot ID, Collector name, Recycler facility, or dispute reason...'
              }
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: language === 'hi' ? 'सभी विवाद' : language === 'mr' ? 'सर्व' : 'All Disputes', count: stats.total },
              { id: 'OPEN', label: language === 'hi' ? 'कार्रवाई आवश्यक' : language === 'mr' ? 'कार्रवाई आवश्यक' : 'Action Required', count: stats.openCount },
              { id: 'UNDER_REVIEW', label: language === 'hi' ? 'समीक्षाधीन' : language === 'mr' ? 'तपास सुरू' : 'Under Review', count: stats.underReview },
              { id: 'RESOLVED', label: language === 'hi' ? 'निस्तारित' : language === 'mr' ? 'निकाली' : 'Resolved', count: stats.resolved },
              { id: 'REJECTED', label: language === 'hi' ? 'खारिज' : language === 'mr' ? 'फेटाळलेले' : 'Rejected', count: disputes.filter(d => d.status === 'REJECTED').length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  statusFilter === tab.id ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Disputes List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs font-medium space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
            <p>
              {language === 'hi' 
                ? 'सीपीसीबी केंद्रीय विवाद रजिस्ट्री से लाइव डेटा लोड किया जा रहा है...' 
                : language === 'mr' 
                ? 'सीपीसीबी केंद्रीय वाद नोंदणीवरून थेट डेटा लोड होत आहे...' 
                : 'Connecting to CPCB Central Dispute Registry...'}
            </p>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs font-medium space-y-2">
            <Scale className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-slate-900 dark:text-white font-bold text-sm">
              {language === 'hi' ? 'कोई विवाद रिकॉर्ड नहीं मिला' : language === 'mr' ? 'कोणतीही तक्रार नोंद आढळली नाही' : 'No Dispute Records Found'}
            </h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search criteria or active filters.'
                : 'All e-waste transaction handovers are running smoothly without unresolved discrepancies.'}
            </p>
          </div>
        ) : (
          filteredDisputes.map((d) => (
            <div
              key={d.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 text-xs transition-all relative overflow-hidden"
            >
              {/* Top Case Meta Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Dispute ID Badge */}
                  <span className="font-mono font-bold text-cyan-800 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/60 px-2.5 py-1 rounded-xl text-[11px]">
                    {d.id}
                  </span>

                  {/* Lot ID Badge */}
                  <span className="font-mono font-bold text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-2.5 py-1 rounded-xl text-[11px] flex items-center gap-1">
                    <span>📦</span>
                    <span>Lot: {d.lotId}</span>
                  </span>

                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1.5 ${
                    d.status === 'RESOLVED'
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/80'
                      : d.status === 'UNDER_REVIEW'
                      ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700/80'
                      : d.status === 'REJECTED'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                      : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-700/80 animate-pulse'
                  }`}>
                    {d.status === 'RESOLVED' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : d.status === 'UNDER_REVIEW' ? (
                      <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    )}
                    <span>{getStatusLabel(d.status, language)}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Filed: {new Date(d.createdAt).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Dispute Core Issue Box */}
              <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                    CLAIM SUBJECT
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    {d.reason}
                  </h3>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                  {d.details}
                </p>
              </div>

              {/* Dual-Party Dossier Grid (Collector vs Recycler) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Collector (Claimant) */}
                <div className="bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400">
                      <User className="w-3.5 h-3.5" />
                      CLAIMANT (GROUND COLLECTOR)
                    </span>
                    <span className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono">
                      {d.raisedByUserId || 'COL_REG'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {d.collectorName || d.raisedByName || 'Authorized Collector'}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{d.collectorPhone || '9876543210'}</span>
                    </div>
                  </div>
                </div>

                {/* Recycler Facility (Respondent) */}
                <div className="bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                      <Building2 className="w-3.5 h-3.5" />
                      RESPONDENT (RECYCLER FACILITY)
                    </span>
                    <span className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono">
                      {d.recyclerId || 'REC_REG'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {d.recyclerName || 'GreenEarth E-Waste Solutions Pvt Ltd'}
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 text-[11px] flex-wrap">
                      {d.recyclerContact && d.recyclerContact !== 'N/A' && (
                        <span>Contact: <b className="text-slate-700 dark:text-slate-300">{d.recyclerContact}</b></span>
                      )}
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{d.recyclerPhone || 'N/A'}</span>
                      </div>
                      {d.recyclerLocation && d.recyclerLocation !== 'N/A' && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{d.recyclerLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Resolution Rationale (If Resolved) */}
              {(d.resolutionNotes || d.adminNotes || d.status === 'RESOLVED') && (
                <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                  <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      OFFICIAL CPCB TRIBUNAL RULING & SETTLEMENT RECORD
                    </span>
                    {d.resolvedAt && (
                      <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400/80">
                        {new Date(d.resolvedAt).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <p className="text-emerald-900 dark:text-emerald-200 text-xs leading-relaxed font-medium">
                    {d.resolutionNotes || d.adminNotes || 'CPCB Legal Metrology Mediation: Digital load cell calibration record certified compliant with standards. Mutual settlement confirmed.'}
                  </p>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Governed under CPCB E-Waste Management Rules & Legal Metrology Act</span>
                </div>

                <div className="flex items-center gap-2 self-end">
                  <button
                    onClick={() => openRulingModal(d)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all text-xs"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    <span>
                      {d.status === 'RESOLVED'
                        ? (language === 'hi' ? 'निर्णय समीक्षा / संशोधन' : language === 'mr' ? 'निर्णय पुनरावलोकन' : 'Review & Update Ruling')
                        : (language === 'hi' ? 'मध्यस्थता निर्णय जारी करें' : language === 'mr' ? 'लवाद निर्णय द्या' : 'Issue Tribunal Ruling')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CPCB Arbitration Ruling Modal */}
      {activeModalDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                  <Gavel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {language === 'hi' ? 'सीपीसीबी मध्यस्थता निर्णय एवं आदेश' : language === 'mr' ? 'सीपीसीबी लवाद निर्णय' : 'CPCB Statutory Arbitration Ruling'}
                  </h3>
                  <div className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400">
                    Case: {activeModalDispute.id} | Lot: {activeModalDispute.lotId}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveModalDispute(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Case Overview Preview */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">CLAIM REASON</span>
                <span className="text-slate-600 dark:text-slate-400">
                  Claimant: <b className="text-slate-900 dark:text-white">{activeModalDispute.collectorName || 'Collector'}</b>
                </span>
              </div>
              <p className="text-slate-900 dark:text-white font-medium">{activeModalDispute.reason}</p>
            </div>

            {/* Status Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider text-[11px]">
                {language === 'hi' ? 'न्यायिक आदेश का निर्णय (Status)' : language === 'mr' ? 'निर्णयाची स्थिती' : 'Arbitration Ruling Verdict'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'RESOLVED', label: 'RESOLVED (SETTLED)', color: 'bg-emerald-600 border-emerald-500 text-white' },
                  { id: 'UNDER_REVIEW', label: 'UNDER REVIEW', color: 'bg-purple-600 border-purple-500 text-white' },
                  { id: 'REJECTED', label: 'DISMISSED / REJECTED', color: 'bg-rose-600 border-rose-500 text-white' },
                  { id: 'OPEN', label: 'RE-OPEN CASE', color: 'bg-amber-600 border-amber-500 text-white' }
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setRulingStatus(st.id as DisputeStatus)}
                    className={`py-2 px-2.5 rounded-xl text-center text-[10px] font-bold border transition-all ${
                      rulingStatus === st.id
                        ? st.color + ' shadow-lg'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pre-fill Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                CPCB Standard Rationale Presets (Click to Auto-fill)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('Official CPCB Mediation: Digital load cell calibration record certified compliant with Legal Metrology Act standards. Tare weight adjusted and digital settlement voucher issued.')}
                  className="text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 text-[10px] text-slate-700 dark:text-slate-300 transition-all space-y-0.5"
                >
                  <div className="font-bold text-indigo-700 dark:text-indigo-400">⚖️ Digital Tare Calibration Settlement</div>
                  <p className="text-slate-500 dark:text-slate-400 line-clamp-1">Legal Metrology certified calibration verified on site.</p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('Escrow Gateway Reconciled: Transaction RRN verified successful via bank webhook. Collector bank account credited in full.')}
                  className="text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 text-[10px] text-slate-700 dark:text-slate-300 transition-all space-y-0.5"
                >
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">💳 Instant Payout Reconciled</div>
                  <p className="text-slate-500 dark:text-slate-400 line-clamp-1">Banking UPI gateway RRN confirmed and credited.</p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('Joint Inspection Audit: Batch re-inspected under optical spectrometry. Rate differential adjusted according to certified composite assay report.')}
                  className="text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 text-[10px] text-slate-700 dark:text-slate-300 transition-all space-y-0.5"
                >
                  <div className="font-bold text-cyan-700 dark:text-cyan-400">🔬 Material Grading Assay Accord</div>
                  <p className="text-slate-500 dark:text-slate-400 line-clamp-1">Physical spectrometry audit resolved rate classification.</p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('Technical Review: Discrepancy within permissible tare tolerance (+-0.5%). Facility weighment verified accurate and claim dismissed.')}
                  className="text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 text-[10px] text-slate-700 dark:text-slate-300 transition-all space-y-0.5"
                >
                  <div className="font-bold text-rose-700 dark:text-rose-400">📋 Permissible Tolerance Dismissal</div>
                  <p className="text-slate-500 dark:text-slate-400 line-clamp-1">Weight within legal margin, facility weighment upheld.</p>
                </button>
              </div>
            </div>

            {/* Custom Notes Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider text-[11px]">
                {language === 'hi' ? 'विस्तृत प्रशासनिक मध्यस्थता टिप्पणी' : language === 'mr' ? 'तपशीलवार लवाद टीप' : 'Official Ruling Rationale & Legal Audit Notes'}
              </label>
              <textarea
                rows={4}
                value={rulingNotes}
                onChange={(e) => setRulingNotes(e.target.value)}
                placeholder="Enter official CPCB tribunal decision, legal metrology certificate number, or settlement details..."
                className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 transition-all leading-relaxed"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveModalDispute(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                {language === 'hi' ? 'रद्द करें' : language === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleExecuteRuling}
                disabled={submittingRuling}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
              >
                {submittingRuling ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Recording Ruling...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {language === 'hi' ? 'आधिकारिक निर्णय मुहरबंद करें' : language === 'mr' ? 'निर्णय शिक्कामोर्तब करा' : 'Confirm & Seal Verdict'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
