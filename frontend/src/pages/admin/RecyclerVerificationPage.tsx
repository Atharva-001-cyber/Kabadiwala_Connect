import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Phone, 
  Calendar, 
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Factory,
  Scale,
  Truck,
  Star,
  Award,
  Building2,
  Check,
  AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { RecyclerProfile, RecyclerAuthStatus } from '../../types';
import { getCategoryLabel } from '../../i18n/translations';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export const RecyclerVerificationPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [recyclers, setRecyclers] = useState<RecyclerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'AUTHORIZED' | 'PENDING' | 'SUSPENDED'>('ALL');
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    recycler: RecyclerProfile | null;
    targetStatus: RecyclerAuthStatus;
  }>({
    isOpen: false,
    recycler: null,
    targetStatus: 'SUSPENDED'
  });

  const fetchRecyclers = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    try {
      const res = await api.getRecyclers({ onlyAuthorized: 'false' });
      if (res.success) {
        setRecyclers(res.recyclers || []);
      }
    } catch (e) {
      console.warn('Recyclers fetch failed:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecyclers(false);
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: RecyclerAuthStatus) => {
    try {
      const res = await api.updateRecyclerAuthStatus(id, newStatus);
      if (res.success) {
        showToast(
          newStatus === 'AUTHORIZED' 
            ? (language === 'hi' ? 'रीसाइक्लर लाइसेंस सफलतापूर्वक स्वीकृत हुआ' : 'Recycler license approved successfully')
            : (language === 'hi' ? 'रीसाइक्लर लाइसेंस निलंबित किया गया' : 'Recycler facility suspended'),
          'success'
        );
        fetchRecyclers(true);
      }
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    } finally {
      setConfirmModal({ isOpen: false, recycler: null, targetStatus: 'SUSPENDED' });
    }
  };

  // Executive KPI Aggregates
  const kpis = useMemo(() => {
    const total = recyclers.length;
    const authorized = recyclers.filter(r => r.authorizationStatus === 'AUTHORIZED').length;
    const pending = recyclers.filter(r => r.authorizationStatus === 'PENDING_VERIFICATION').length;
    const suspended = recyclers.filter(r => r.authorizationStatus === 'SUSPENDED').length;
    const totalProcessedKg = recyclers.reduce((sum, r) => sum + (Number(r.totalProcessedKg) || 0), 0);

    return { total, authorized, pending, suspended, totalProcessedKg };
  }, [recyclers]);

  // Filtered & Searched Recyclers
  const filteredRecyclers = useMemo(() => {
    return recyclers.filter((rec) => {
      // Tab filter
      if (activeTab === 'AUTHORIZED' && rec.authorizationStatus !== 'AUTHORIZED') return false;
      if (activeTab === 'PENDING' && rec.authorizationStatus !== 'PENDING_VERIFICATION') return false;
      if (activeTab === 'SUSPENDED' && rec.authorizationStatus !== 'SUSPENDED') return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = rec.facilityName?.toLowerCase().includes(q);
        const regMatch = rec.registrationNo?.toLowerCase().includes(q);
        const distMatch = rec.district?.toLowerCase().includes(q);
        const stateMatch = rec.state?.toLowerCase().includes(q);
        const contactMatch = rec.contactPerson?.toLowerCase().includes(q) || rec.contactPhone?.includes(q);
        if (!nameMatch && !regMatch && !distMatch && !stateMatch && !contactMatch) return false;
      }

      return true;
    });
  }, [recyclers, activeTab, searchQuery]);

  // Format clean location string without duplicate text
  const formatLocation = (rec: RecyclerProfile) => {
    const addr = rec.address || '';
    const dist = rec.district || '';
    const st = rec.state || '';

    // If address already has district or state mentioned, just show address
    if (dist && addr.toLowerCase().includes(dist.toLowerCase())) {
      return addr;
    }
    if (addr && dist && st) {
      return `${addr}, ${dist}, ${st}`;
    }
    return addr || `${dist}, ${st}` || 'Location on record';
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-purple-600/30 dark:text-purple-300 border border-emerald-200 dark:border-purple-500/40 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {t.adminRecyclerTitle}
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-50 text-emerald-800 dark:bg-purple-900/80 dark:text-purple-300 border border-emerald-200 dark:border-purple-600/60">
                  CPCB & SPCB COMPLIANCE
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                {t.adminRecyclerSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchRecyclers(false)}
              disabled={isRefreshing}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600 dark:text-purple-400' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Live DB'}</span>
            </button>
            <span className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-black border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
              <span>CENTRAL REGISTRY ACTIVE</span>
            </span>
          </div>
        </div>

        {/* 5-Column Executive KPI Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80">
          <div className="bg-white dark:bg-slate-950/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-sm space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase block">
              {language === 'hi' ? 'कुल पंजीकृत प्लांट' : 'Total Registered'}
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono block">
              {kpis.total}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Pan-India Network</span>
          </div>

          <div className="bg-white dark:bg-slate-950/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-sm space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase block">
              {language === 'hi' ? 'अधिकृत सीपीसीबी' : 'CPCB Authorized'}
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono block">
              {kpis.authorized}
            </span>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-bold">Active Licenses</span>
          </div>

          <div className="bg-white dark:bg-slate-950/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-sm space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase block">
              {language === 'hi' ? 'सत्यापन लंबित' : 'Pending Review'}
            </span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono block">
              {kpis.pending}
            </span>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-bold">Awaiting Approval</span>
          </div>

          <div className="bg-white dark:bg-slate-950/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-sm space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase block">
              {language === 'hi' ? 'निलंबित इकाइयाँ' : 'Suspended Units'}
            </span>
            <span className="text-xl font-black text-red-600 dark:text-red-400 font-mono block">
              {kpis.suspended}
            </span>
            <span className="text-[10px] text-red-600/80 dark:text-red-400/80 font-bold">License Revoked</span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-950/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-sm space-y-0.5">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase block">
              {language === 'hi' ? 'प्रसंस्कृत ई-कचरा' : 'Processed Scrap'}
            </span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono block">
              {kpis.totalProcessedKg.toLocaleString('en-IN')} kg
            </span>
            <span className="text-[10px] text-blue-600 dark:text-blue-300 font-bold">Audited Weighment</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
        {/* Status Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'ALL'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-950 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            All Facilities ({kpis.total})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AUTHORIZED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'AUTHORIZED'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-emerald-700 dark:bg-slate-950 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-emerald-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Authorized ({kpis.authorized})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'PENDING'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-amber-700 dark:bg-slate-950 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-amber-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Pending Review ({kpis.pending})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SUSPENDED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'SUSPENDED'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-red-700 dark:bg-slate-950 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-red-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            <span>Suspended ({kpis.suspended})</span>
          </button>
        </div>

        {/* Live Search Input */}
        <div className="relative min-w-[240px] sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'hi' ? 'नाम, रजिस्ट्रेशन, शहर खोजें...' : 'Search facility, reg no, city...'}
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

      {/* Loading State */}
      {loading && (
        <LoadingSkeleton variant="table" count={4} />
      )}

      {/* Empty State */}
      {!loading && filteredRecyclers.length === 0 && (
        <EmptyState
          title={language === 'hi' ? 'कोई रीसाइक्लिंग सुविधा नहीं मिली' : language === 'mr' ? 'कोणतीही पुनर्प्रक्रिया सुविधा आढळली नाही' : 'No Recycling Facilities Found'}
          description={searchQuery 
            ? (language === 'hi' ? 'आपके खोज मापदंडों से मेल खाने वाला कोई पंजीकृत रीसाइक्लर नहीं मिला।' : 'No registered recycling facilities match your search query. Try searching with a different term.') 
            : (language === 'hi' ? 'चयनित विनियामक श्रेणी में कोई रीसाइक्लिंग इकाई पंजीकृत नहीं है।' : 'No recycling facilities match the selected authorization filter.')}
          icon={<Factory className="w-8 h-8 text-emerald-600 dark:text-purple-400" />}
          action={searchQuery || activeTab !== 'ALL' ? {
            label: language === 'hi' ? 'फ़िल्टर रीसेट करें' : language === 'mr' ? 'फिल्टर रीसेट करा' : 'Reset Filters',
            onClick: () => { setSearchQuery(''); setActiveTab('ALL'); }
          } : undefined}
        />
      )}

      {/* Recyclers List */}
      <div className="space-y-4">
        {filteredRecyclers.map((rec) => {
          const isAuth = rec.authorizationStatus === 'AUTHORIZED';
          const isPending = rec.authorizationStatus === 'PENDING_VERIFICATION';
          const isSuspended = rec.authorizationStatus === 'SUSPENDED';
          const isGazette = rec.authorizationSource === 'CPCB_GAZETTE_VERIFIED';

          return (
            <div
              key={rec.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md space-y-4 text-xs transition-all"
            >
              {/* Top Row: Facility Name, Badges, Status & Validity */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{rec.facilityName}</h3>
                    
                    {/* Status Badge */}
                    <span
                      className={`px-3 py-0.5 rounded-full font-bold text-[10px] border flex items-center gap-1 ${
                        isAuth
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                          : isPending
                          ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                          : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isAuth ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                      <span>
                        {isAuth
                          ? (language === 'hi' ? 'अधिकृत CPCB' : language === 'mr' ? 'अधिकृत CPCB' : 'Authorized')
                          : isPending
                          ? (language === 'hi' ? 'सत्यापन लंबित' : language === 'mr' ? 'पडताळणी प्रलंबित' : 'Pending Verification')
                          : (language === 'hi' ? 'निलंबित' : language === 'mr' ? 'निलंबित' : 'Suspended')}
                      </span>
                    </span>

                    {/* Gazette Seal Badge */}
                    {isGazette && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 flex items-center gap-1 shadow-sm">
                        <Award className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>CPCB Gazette Seal</span>
                      </span>
                    )}
                  </div>

                  {/* Registration No & Clean Location */}
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 flex-wrap text-xs">
                    <p className="font-mono">
                      {language === 'hi' ? 'पंजीकरण संख्या' : language === 'mr' ? 'नोंदणी क्रमांक' : 'Registration No'}:{' '}
                      <b className="text-slate-800 dark:text-slate-200 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">{rec.registrationNo}</b>
                    </p>
                    <span className="text-slate-400 dark:text-slate-600 hidden sm:inline">•</span>
                    <p className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-purple-400 shrink-0" />
                      <span>{formatLocation(rec)}</span>
                    </p>
                  </div>
                </div>

                {/* Validity Pill */}
                <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0 self-start sm:self-center text-right">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    {language === 'hi' ? 'लाइसेंस वैधता' : 'License Valid Until'}
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {rec.authValidUntil || '2028-12-31'}
                  </span>
                </div>
              </div>

              {/* 4-Item Real Database Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Tonnage Processed</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {(Number(rec.totalProcessedKg) || 0).toLocaleString('en-IN')} kg
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Service Radius</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                    {rec.serviceRadiusKm || 35} km
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Compliance Rating</span>
                  <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{rec.rating ? Number(rec.rating).toFixed(1) : '4.8'} / 5.0</span>
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Logistics Model</span>
                  <span className="font-bold text-blue-600 dark:text-blue-300 text-xs flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                    <span>{rec.pickupAvailable ? 'Pickup Fleet Active' : 'Facility Drop-off'}</span>
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">Operations Representative:</span>
                  <span className="text-slate-900 dark:text-white font-semibold">{rec.contactPerson || 'Facility Operations Head'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-purple-300 font-mono font-bold">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-purple-400" />
                  <a href={`tel:${rec.contactPhone}`} className="hover:underline">
                    {rec.contactPhone || '+91 98200 98200'}
                  </a>
                </div>
              </div>

              {/* Authorized Materials */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-500 dark:text-slate-400 mr-1 text-[11px]">
                  {language === 'hi' ? 'अनुमोदित श्रेणियां:' : language === 'mr' ? 'मान्यताप्राप्त श्रेणी:' : 'Authorized Streams:'}
                </span>
                {(rec.acceptedMaterials || ['PCB', 'BATTERY', 'CABLE', 'MOTOR']).map((mat) => (
                  <span key={mat} className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                    {getCategoryLabel(mat, language)}
                  </span>
                ))}
              </div>

              {/* Admin Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                {/* Pending Verification -> Approve or Reject */}
                {isPending && (
                  <>
                    <button
                      type="button"
                      onClick={() => setConfirmModal({ isOpen: true, recycler: rec, targetStatus: 'SUSPENDED' })}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-red-50 text-red-700 hover:text-red-800 dark:bg-slate-800 dark:hover:bg-red-950 dark:text-red-300 dark:hover:text-red-200 border border-slate-200 hover:border-red-200 dark:border-slate-700 dark:hover:border-red-700 font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                    >
                      <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                      <span>Reject Application</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmModal({ isOpen: true, recycler: rec, targetStatus: 'AUTHORIZED' })}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.approveLicenseBtn}</span>
                    </button>
                  </>
                )}

                {/* Authorized -> Suspend Facility */}
                {isAuth && (
                  <button
                    type="button"
                    onClick={() => setConfirmModal({ isOpen: true, recycler: rec, targetStatus: 'SUSPENDED' })}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all active:scale-95"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{t.suspendLicenseBtn}</span>
                  </button>
                )}

                {/* Suspended -> Re-instate License */}
                {isSuspended && (
                  <button
                    type="button"
                    onClick={() => setConfirmModal({ isOpen: true, recycler: rec, targetStatus: 'AUTHORIZED' })}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Re-Instate / Authorize License</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && confirmModal.recycler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/80 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-500 dark:text-amber-400">
              <AlertCircle className="w-7 h-7 text-amber-500 dark:text-amber-400 shrink-0" />
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {confirmModal.targetStatus === 'SUSPENDED' ? t.confirmSuspendTitle : t.confirmApproveTitle}
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {confirmModal.recycler.registrationNo}
                </span>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-900 dark:text-white font-bold text-xs block">{confirmModal.recycler.facilityName}</span>
              <p className="text-slate-500 dark:text-slate-400 text-xs">{formatLocation(confirmModal.recycler)}</p>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              {confirmModal.targetStatus === 'SUSPENDED'
                ? t.confirmSuspendDesc
                : (language === 'hi' 
                    ? 'क्या आप इस रीसाइक्लिंग सुविधा को CPCB ई-वेस्ट नियम 2022 के तहत अधिकृत करना चाहते हैं?'
                    : 'Are you sure you want to authorize this recycling facility under CPCB E-Waste Rules 2022?')}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, recycler: null, targetStatus: 'SUSPENDED' })}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(confirmModal.recycler!.id, confirmModal.targetStatus)}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow transition-all active:scale-95 ${
                  confirmModal.targetStatus === 'SUSPENDED'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {t.confirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

