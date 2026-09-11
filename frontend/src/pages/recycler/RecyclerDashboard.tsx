import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Factory, Truck, CheckCircle2, Clock, Scale, ArrowRight, ShieldCheck, ShieldAlert, AlertTriangle, Layers, IndianRupee } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { SafeImage } from '../../components/common/SafeImage';
import { api } from '../../services/api';
import { Lot, Pickup } from '../../types';
import { getStatusLabel, getCategoryLabel } from '../../i18n/translations';

export const RecyclerDashboard: React.FC = () => {
  const { user, recyclerProfile } = useAuth();
  const { language, t } = useLanguage();
  const [lots, setLots] = useState<Lot[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [lotsRes, pickupsRes] = await Promise.all([
          api.getLots({ limit: '40' }),
          api.getPickups({ limit: '30' })
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
  }, []);

  const newRequests = lots.filter(l => l.status === 'CREATED' || l.status === 'OFFER_RECEIVED');
  const pendingPickups = lots.filter(l => l.status === 'ACCEPTED' || l.status === 'PICKUP_SCHEDULED');
  const processingLots = lots.filter(l => l.status === 'RECEIVED' || l.status === 'PROCESSING');
  const completedLots = lots.filter(l => l.status === 'RECYCLED');
  const totalRecycledKg = completedLots.reduce((sum, l) => sum + (l.approxWeight || 0), 0);

  const authStatus = recyclerProfile?.authorizationStatus || 'AUTHORIZED';
  const isSuspended = authStatus === 'SUSPENDED';
  const isPending = authStatus === 'PENDING_VERIFICATION';

  return (
    <div className="space-y-6 pb-16">
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

      {/* Recycler Header Bar */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 border border-blue-800/60 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Factory className="w-6 h-6 text-blue-400" />
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {recyclerProfile?.facilityName || user?.name || 'Registered Recycling Facility'}
              </h1>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
              <span className="font-mono text-blue-300">
                Reg: {recyclerProfile?.registrationNo || 'Pending Registration Assignment'}
              </span>
              <span>•</span>
              {authStatus === 'AUTHORIZED' ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'प्लेटफॉर्म-प्रबंधित अधिकृत' : language === 'mr' ? 'प्लॅटफॉर्म-व्यवस्थापित अधिकृत' : 'Platform-Managed Authorization'}</span>
                </span>
              ) : isSuspended ? (
                <span className="inline-flex items-center gap-1 text-rose-400 font-bold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'लाइसेंस निलंबित' : language === 'mr' ? 'परवाना निलंबित' : 'License Suspended'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'सत्यापन लंबित' : language === 'mr' ? 'पडताळणी प्रलंबित' : 'Pending Verification'}</span>
                </span>
              )}
            </div>
          </div>

          <Link
            to="/recycler/requests"
            className={`px-5 py-2.5 ${isSuspended || isPending ? 'bg-slate-800 hover:bg-slate-750 text-slate-300' : 'bg-blue-600 hover:bg-blue-500 text-white'} active:scale-95 font-bold rounded-2xl text-xs shadow flex items-center gap-1.5 self-start sm:self-center`}
          >
            <span>{t.viewNewLotsBtn} ({newRequests.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">{t.newIncomingLots}</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">{newRequests.length}</span>
            <span className="text-[10px] text-slate-500">{t.requiresPriceBids}</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">{t.pendingPickupsLabel}</span>
            <span className="text-2xl font-black text-purple-400 mt-1 block">{pendingPickups.length}</span>
            <span className="text-[10px] text-slate-500">{t.scheduledEnroute}</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">{t.inProcessingLabel}</span>
            <span className="text-2xl font-black text-blue-400 mt-1 block">{processingLots.length}</span>
            <span className="text-[10px] text-slate-500">{t.activeHydrometallurgy}</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">{t.totalFormallyRecycled}</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{totalRecycledKg} kg</span>
            <span className="text-[10px] text-slate-500">{t.form6Certified}</span>
          </div>
        </div>
      </div>

      {/* Recycler Quick Operational Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/recycler/requests"
          className="bg-slate-900 hover:bg-slate-850 border border-slate-800 p-5 rounded-3xl shadow-lg flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl border border-amber-500/30">
              📦
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">{t.incomingLotsTitle}</h3>
              <p className="text-xs text-slate-400">{language === 'hi' ? 'फोटो देखें व दर तय करें' : language === 'mr' ? 'फोटो पहा व दर निश्चित करा' : 'Review photos and quote rates'}</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/recycler/handover"
          className="bg-slate-900 hover:bg-slate-850 border border-slate-800 p-5 rounded-3xl shadow-lg flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/30">
              ⚖️
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">{t.handoverScaleNav}</h3>
              <p className="text-xs text-slate-400">{t.handoverScaleDesc}</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/recycler/inventory"
          className="bg-slate-900 hover:bg-slate-850 border border-slate-800 p-5 rounded-3xl shadow-lg flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xl border border-purple-500/30">
              ⚙️
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">{t.processingLifecycleNav}</h3>
              <p className="text-xs text-slate-400">{t.processingLifecycleDesc}</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Pending Lots Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
          {t.activeLotsInPipeline}
        </h2>

        <div className="space-y-3">
          {lots.slice(0, 4).map((lot) => (
            <div
              key={lot.id}
              className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <SafeImage
                  src={lot.imageUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&q=80'}
                  alt={lot.materialCategory}
                  category={lot.materialCategory}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-400">{lot.id}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {getStatusLabel(lot.status, language)}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mt-0.5">{getCategoryLabel(lot.materialCategory, language)}</h4>
                  <p className="text-xs text-slate-400">
                    {language === 'hi' ? 'कलेक्टर:' : language === 'mr' ? 'संकलक:' : 'Collector:'} <b className="text-slate-200">{lot.collectorName}</b> • {lot.approxWeight} kg • {lot.locationDistrict}
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
      </div>
    </div>
  );
};

