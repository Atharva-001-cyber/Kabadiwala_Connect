import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Factory, Truck, CheckCircle2, Clock, Scale, ArrowRight, ShieldCheck, ShieldAlert, AlertTriangle, Layers, IndianRupee } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { SafeImage } from '../../components/common/SafeImage';
import { api } from '../../services/api';
import { onPlatformSync } from '../../services/realtime';
import { Lot, Pickup } from '../../types';
import { getStatusLabel, getCategoryLabel } from '../../i18n/translations';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export const RecyclerDashboard: React.FC = () => {
  const { user, recyclerProfile } = useAuth();
  const { language, t } = useLanguage();
  const [lots, setLots] = useState<Lot[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const [lotsRes, pickupsRes] = await Promise.all([
          api.getLots(),
          api.getPickups()
        ]);
        if (lotsRes.success) setLots(lotsRes.lots);
        if (pickupsRes.success) setPickups(pickupsRes.pickups);
      } catch (err) {
        console.warn('Recycler fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Real-time synchronization on Supabase database events
    const unsubscribeSync = onPlatformSync(() => {
      fetchData(true);
    });

    // Background auto-refresh polling (8 seconds)
    const interval = setInterval(() => {
      fetchData(true);
    }, 8000);

    return () => {
      unsubscribeSync();
      clearInterval(interval);
    };
  }, []);

  const newRequests = lots.filter(l => l.status === 'CREATED' || l.status === 'OFFER_RECEIVED');
  const pendingPickups = lots.filter(l => l.status === 'ACCEPTED' || l.status === 'PICKUP_SCHEDULED');
  const processingLots = lots.filter(l => ['RECEIVED', 'RECYCLER_RECEIVED', 'SORTED', 'PROCESSING', 'RECOVERED'].includes(l.status));
  const completedLots = lots.filter(l => l.status === 'RECYCLED');
  const totalRecycledKg = completedLots.reduce((sum, l) => sum + (l.approxWeight || 0), 0);

  const authStatus = recyclerProfile?.authorizationStatus || 'AUTHORIZED';
  const isSuspended = authStatus === 'SUSPENDED';
  const isPending = authStatus === 'PENDING_VERIFICATION';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Regulatory Status Alert Banner */}
      {isSuspended && (
        <div className="bg-rose-950/90 border-2 border-rose-600 rounded-3xl p-5 shadow-xl text-rose-200 flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-black text-sm text-white">
              {language === 'hi' ? '🚨 विनियामक सूचना: रीसाइक्लिंग लाइसेंस निलंबित है' : language === 'mr' ? '🚨 नियामक चेतावणी: पुनर्प्रक्रिया परवाना निलंबित आहे' : '🚨 Regulatory Notice: Facility License Suspended'}
            </h4>
            <p className="text-xs text-rose-300 leading-relaxed">
              {language === 'hi'
                ? 'CPCB ई-कचरा (प्रबंधन) नियम 2022 के तहत आपके परिचालन को निलंबित कर दिया गया है। नई बोलियां और लॉट संग्रह अवरुद्ध हैं।'
                : language === 'mr'
                  ? 'CPCB ई-कचरा नियम 2022 अंतर्गत आपले कामकाज निलंबित केले गेले आहे. नवीन बोली व संकलन अवरोधित आहेत.'
                  : 'Your processing authorization has been suspended under E-Waste (Management) Rules 2022. All quotation and collection operations are temporarily restricted.'}
            </p>
          </div>
        </div>
      )}

      {isPending && (
        <div className="bg-amber-950/80 border-2 border-amber-600/80 rounded-3xl p-5 shadow-xl text-amber-200 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-black text-sm text-white">
              {language === 'hi' ? '⏳ विनियामक सत्यापन लंबित है' : language === 'mr' ? '⏳ नियामक पडताळणी प्रलंबित आहे' : '⏳ Facility Authorization Pending Verification'}
            </h4>
            <p className="text-xs text-amber-300 leading-relaxed">
              {language === 'hi'
                ? 'राज्य प्रदूषण नियंत्रण बोर्ड (SPCB) द्वारा आपके दस्तावेजों की समीक्षा की जा रही है। अनुमोदन के उपरांत लॉट बिडिंग सक्रिय होगी।'
                : language === 'mr'
                  ? 'SPCB द्वारे कागदपत्रांची पडताळणी सुरू आहे. मंजुरीनंतर लॉट बोली सक्रिय होईल.'
                  : 'Your facility credentials are under regulatory review by State Pollution Control Board authorities. Bidding and pickup scheduling will be unlocked once authorized.'}
            </p>
          </div>
        </div>
      )}

      {/* Recycler Header Hero Card */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/80 border-2 border-blue-300 dark:border-blue-800 flex items-center justify-center text-blue-800 dark:text-blue-400 shrink-0 shadow-xs">
                <Factory className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display">
                {recyclerProfile?.facilityName || user?.name || 'Registered Recycling Facility'}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-700 dark:text-slate-400 mt-2 font-bold">
              <span className="font-mono font-black text-blue-900 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-300 dark:border-blue-800">
                Reg: {recyclerProfile?.registrationNo || 'Pending Registration Assignment'}
              </span>
              <span>•</span>
              {authStatus === 'AUTHORIZED' ? (
                <span className="inline-flex items-center gap-1 text-emerald-950 dark:text-emerald-300 font-black bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>{language === 'hi' ? 'प्लेटफॉर्म-प्रबंधित अधिकृत' : language === 'mr' ? 'प्लॅटफॉर्म-व्यवस्थापित अधिकृत' : 'Platform-Managed Authorization'}</span>
                </span>
              ) : isSuspended ? (
                <span className="inline-flex items-center gap-1 text-rose-950 dark:text-rose-300 font-black bg-rose-100 dark:bg-rose-950/80 px-2.5 py-0.5 rounded-lg border border-rose-300 dark:border-rose-800">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                  <span>{language === 'hi' ? 'लाइसेंस निलंबित' : language === 'mr' ? 'परवाना निलंबित' : 'License Suspended'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-950 dark:text-amber-300 font-black bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-lg border border-amber-300 dark:border-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>{language === 'hi' ? 'सत्यापन लंबित' : language === 'mr' ? 'पडताळणी प्रलंबित' : 'Pending Verification'}</span>
                </span>
              )}
            </div>
          </div>

          <Link
            to="/recycler/requests"
            className={`px-5 py-2.5 ${isSuspended || isPending ? 'bg-slate-200 dark:bg-slate-800 text-slate-600' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'} active:scale-95 font-black rounded-2xl text-xs flex items-center gap-2 self-start sm:self-center transition-all`}
          >
            <span>{t.viewNewLotsBtn} ({newRequests.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-slate-50 dark:bg-slate-950/70 border-2 border-slate-200 dark:border-slate-800 p-4 rounded-2xl transition-all shadow-xs">
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-wider block">{t.newIncomingLots}</span>
            <span className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1 block font-mono">{newRequests.length}</span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">{t.requiresPriceBids}</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/70 border-2 border-slate-200 dark:border-slate-800 p-4 rounded-2xl transition-all shadow-xs">
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-wider block">{t.pendingPickupsLabel}</span>
            <span className="text-2xl font-black text-purple-700 dark:text-purple-400 mt-1 block font-mono">{pendingPickups.length}</span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">{t.scheduledEnroute}</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/70 border-2 border-slate-200 dark:border-slate-800 p-4 rounded-2xl transition-all shadow-xs">
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-wider block">{t.inProcessingLabel}</span>
            <span className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1 block font-mono">{processingLots.length}</span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">{t.activeHydrometallurgy}</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/70 border-2 border-slate-200 dark:border-slate-800 p-4 rounded-2xl transition-all shadow-xs">
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-wider block">{t.totalFormallyRecycled}</span>
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1 block font-mono">{totalRecycledKg} kg</span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">{t.form6Certified}</span>
          </div>
        </div>
      </div>

      {/* VISUAL RECYCLING BATCH LIFECYCLE PIPELINE DIAGRAM */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-950 border-2 border-blue-500/60 rounded-3xl p-5 shadow-xl text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏭</span>
            <h3 className="font-black text-sm sm:text-base text-white tracking-tight">
              {language === 'hi' ? '4-चरणीय रीसाइक्लिंग जीवनचक्र (Batch Lifecycle Pipeline)' : language === 'mr' ? '4-टप्प्यांची रिसायकलिंग प्रक्रिया' : '4-Stage Recycling Batch Pipeline'}
            </h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-black uppercase tracking-wider">
            {language === 'hi' ? 'CPCB अनुपालित' : language === 'mr' ? 'CPCB अनुपालन' : 'CPCB Statutory Workflow'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative">
          {/* Stage 1 */}
          <div className="bg-white/10 dark:bg-slate-950/80 border border-purple-400/40 rounded-2xl p-3.5 flex flex-col justify-between backdrop-blur-md relative overflow-hidden group hover:border-purple-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-purple-500/30 text-purple-300 flex items-center justify-center font-black text-base border border-purple-400/30">
                1
              </span>
              <span className="text-xl">🚚</span>
            </div>
            <div className="mt-3">
              <span className="text-[10px] font-black text-purple-300 uppercase tracking-wider block">
                {language === 'hi' ? 'संग्रह एवं पिकअप' : language === 'mr' ? 'संकलन व पिकअप' : 'Fleet Dispatch'}
              </span>
              <h4 className="font-extrabold text-xs text-white mt-0.5">
                {language === 'hi' ? 'सत्यापित डिजिटल तौल' : language === 'mr' ? 'सत्यापित डिजिटल वजन' : 'Scale Verification'}
              </h4>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="bg-white/10 dark:bg-slate-950/80 border border-blue-400/40 rounded-2xl p-3.5 flex flex-col justify-between backdrop-blur-md relative overflow-hidden group hover:border-blue-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-blue-500/30 text-blue-300 flex items-center justify-center font-black text-base border border-blue-400/30">
                2
              </span>
              <span className="text-xl">🔬</span>
            </div>
            <div className="mt-3">
              <span className="text-[10px] font-black text-blue-300 uppercase tracking-wider block">
                {language === 'hi' ? 'सामग्री छंटाई' : language === 'mr' ? 'साहित्य वर्गीकरण' : 'Material Sorting'}
              </span>
              <h4 className="font-extrabold text-xs text-white mt-0.5">
                {language === 'hi' ? 'PCB, मेटल व प्लास्टिक पृथक्करण' : language === 'mr' ? 'PCB, धातू व प्लास्टिक वर्गीकरण' : 'PCB & Alloy Segregation'}
              </h4>
            </div>
          </div>

          {/* Stage 3 */}
          <div className="bg-white/10 dark:bg-slate-950/80 border border-cyan-400/40 rounded-2xl p-3.5 flex flex-col justify-between backdrop-blur-md relative overflow-hidden group hover:border-cyan-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-cyan-500/30 text-cyan-300 flex items-center justify-center font-black text-base border border-cyan-400/30">
                3
              </span>
              <span className="text-xl">⚙️</span>
            </div>
            <div className="mt-3">
              <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider block">
                {language === 'hi' ? 'हाइड्रो-धातुकर्म प्रसंस्करण' : language === 'mr' ? 'हायड्रो-प्रक्रिया' : 'Processing Unit'}
              </span>
              <h4 className="font-extrabold text-xs text-white mt-0.5">
                {language === 'hi' ? 'कीमती धातुओं की रिकवरी' : language === 'mr' ? 'मूल्यवान धातू पुनर्प्राप्ती' : 'Precious Metal Extraction'}
              </h4>
            </div>
          </div>

          {/* Stage 4 */}
          <div className="bg-white/10 dark:bg-slate-950/80 border border-emerald-400/40 rounded-2xl p-3.5 flex flex-col justify-between backdrop-blur-md relative overflow-hidden group hover:border-emerald-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/30 text-emerald-300 flex items-center justify-center font-black text-base border border-emerald-400/30">
                4
              </span>
              <span className="text-xl">📜</span>
            </div>
            <div className="mt-3">
              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider block">
                {language === 'hi' ? 'Form-6 EPR प्रमाण' : language === 'mr' ? 'Form-6 EPR पुरावा' : 'Form-6 Certificate'}
              </span>
              <h4 className="font-extrabold text-xs text-white mt-0.5">
                {language === 'hi' ? 'कानूनी CPCB क्रेडिट जारी' : language === 'mr' ? 'कायदेशीर CPCB क्रेडिट्स' : 'Statutory Credit Issuance'}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Recycler Quick Operational Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/recycler/requests"
          className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm hover:shadow-md flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xl border border-amber-200 dark:border-amber-500/30">
              📦
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{t.incomingLotsTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{language === 'hi' ? 'फोटो देखें व दर तय करें' : language === 'mr' ? 'फोटो पहा व दर निश्चित करा' : 'Review photos and quote rates'}</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/recycler/handover"
          className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm hover:shadow-md flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-200 dark:border-emerald-500/30">
              ⚖️
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{t.handoverScaleNav}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.handoverScaleDesc}</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/recycler/inventory"
          className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm hover:shadow-md flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold text-xl border border-purple-200 dark:border-purple-500/30">
              ⚙️
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{t.processingLifecycleNav}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.processingLifecycleDesc}</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Pending Lots Feed */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl space-y-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {t.activeLotsInPipeline}
        </h2>

        {loading ? (
          <LoadingSkeleton variant="card" count={3} />
        ) : lots.length === 0 ? (
          <EmptyState
            title={language === 'hi' ? 'पाइपलाइन में कोई लॉट नहीं है' : language === 'mr' ? 'पायपलाईनमध्ये कोणताही लॉट नाही' : 'No Active Lots in Pipeline'}
            description={language === 'hi' ? 'वर्तमान में कोई सक्रिय स्क्रैप लॉट नहीं है। नए लॉट्स उपलब्ध होने पर यहां प्रदर्शित होंगे।' : language === 'mr' ? 'सध्या कोणताही सक्रिय स्क्रॅप लॉट नाही.' : 'There are currently no active scrap consignments in your processing pipeline.'}
            icon={<Layers className="w-8 h-8 text-blue-500 dark:text-blue-400" />}
          />
        ) : (
          <div className="space-y-3">
            {lots.slice(0, 6).map((lot) => (
              <div
                key={lot.id}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <SafeImage
                    src={lot.imageUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&q=80'}
                    alt={lot.materialCategory}
                    category={lot.materialCategory}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400">{lot.id}</span>
                      <StatusBadge status={lot.status} size="sm" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{getCategoryLabel(lot.materialCategory, language)}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {language === 'hi' ? 'कलेक्टर:' : language === 'mr' ? 'संकलक:' : 'Collector:'} <b className="text-slate-800 dark:text-slate-200">{lot.collectorName}</b> • {lot.approxWeight} kg • {lot.locationDistrict}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {lot.status === 'CREATED' || lot.status === 'OFFER_RECEIVED' ? (
                    <Link
                      to="/recycler/requests"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow"
                    >
                      {t.makeOfferBtn}
                    </Link>
                  ) : lot.status === 'ACCEPTED' ? (
                    <Link
                      to="/recycler/pickups"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow"
                    >
                      {language === 'hi' ? 'पिकअप शेड्यूल करें' : language === 'mr' ? 'पिकअप नियोजित करा' : 'Schedule Pickup'}
                    </Link>
                  ) : (
                    <Link
                      to="/recycler/inventory"
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow"
                    >
                      {language === 'hi' ? 'प्रोसेसिंग अपडेट करें' : language === 'mr' ? 'प्रक्रिया अद्यतन करा' : 'Update Lifecycle'}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

