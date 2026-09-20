import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  IndianRupee,
  RefreshCw,
  Search,
  Sparkles,
  X,
  Info
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { onPlatformSync } from '../../services/realtime';
import { Lot, Offer } from '../../types';
import { getCategoryLabel, formatUserDisplayName } from '../../i18n/translations';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge } from '../../components/common/StatusBadge';

export const MyRequestsPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [lots, setLots] = useState<Lot[]>([]);
  const [offersMap, setOffersMap] = useState<Record<string, Offer[]>>({});
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'ACCEPTED' | 'COMPLETED'>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  // Offer confirmation modal state
  const [selectedOfferForAcceptance, setSelectedOfferForAcceptance] = useState<{ offer: Offer; lot: Lot } | null>(null);
  const [acceptingInProgress, setAcceptingInProgress] = useState<boolean>(false);

  const fetchData = async (silent = false) => {
    if (!silent && lots.length === 0) setLoading(true);
    try {
      let collectorId = '';
      try {
        const cp = localStorage.getItem('collectorProfile');
        const u = localStorage.getItem('user');
        if (cp) collectorId = JSON.parse(cp)?.id;
        if (!collectorId && u) collectorId = JSON.parse(u)?.id;
      } catch {}

      const isRealCollector = collectorId && collectorId !== 'col_1';
      let res = await api.getLots(collectorId ? { collectorId } : {});
      if (!isRealCollector && res.success && res.lots.length === 0) {
        res = await api.getLots({});
      }

      if (res.success) {
        setLots(res.lots);
        const lotIds = res.lots.map(l => l.id);
        if (lotIds.length > 0 && (api as any).getOffersForLots) {
          const offersRes = await (api as any).getOffersForLots(lotIds);
          const offersAcc: Record<string, Offer[]> = {};
          (offersRes.offers || []).forEach((o: Offer) => {
            if (!offersAcc[o.lotId]) offersAcc[o.lotId] = [];
            offersAcc[o.lotId].push(o);
          });
          setOffersMap(offersAcc);
        } else {
          setOffersMap({});
        }
      }
    } catch (err) {
      console.warn('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Real-time synchronization on Supabase Cloud database events
    const unsubscribeSync = onPlatformSync(() => {
      fetchData(true);
    });

    // Background auto-refresh polling fallback (8 seconds)
    const interval = setInterval(() => {
      fetchData(true);
    }, 8000);

    return () => {
      unsubscribeSync();
      clearInterval(interval);
    };
  }, []);

  const handleConfirmAcceptOffer = async () => {
    if (!selectedOfferForAcceptance) return;
    setAcceptingInProgress(true);
    try {
      const res = await api.acceptOffer(selectedOfferForAcceptance.offer.id);
      if (res.success) {
        setSelectedOfferForAcceptance(null);
        showToast(
          language === 'hi'
            ? 'ऑफर सफलतापूर्वक स्वीकार कर लिया गया है! रीसाइक्लर को वाहन पिकअप का अनुरोध भेजा गया।'
            : language === 'mr'
            ? 'ऑफर यशस्वीपणे स्वीकारली आहे! रिसायकलरला वाहन पाठवण्याची विनंती केली आहे.'
            : 'Offer accepted! Recycler notified to schedule doorstep collection.',
          'success'
        );
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || (language === 'hi' ? 'ऑफर स्वीकारना विफल रहा' : language === 'mr' ? 'ऑफर स्वीकारणे अयशस्वी' : 'Failed to accept offer'), 'error');
    } finally {
      setAcceptingInProgress(false);
    }
  };

  const filteredLots = lots.filter((lot) => {
    if (filterTab === 'ACTIVE') return lot.status === 'CREATED' || lot.status === 'OFFER_RECEIVED';
    if (filterTab === 'ACCEPTED') return lot.status === 'ACCEPTED' || lot.status === 'PICKUP_SCHEDULED';
    if (filterTab === 'COMPLETED') return lot.status === 'RECEIVED' || lot.status === 'PROCESSING' || lot.status === 'RECYCLED';
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-2">
              <Truck className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'स्वच्छ एवं हरित सर्कुलर आपूर्ति श्रृंखला' : language === 'mr' ? 'स्वच्छ व हरित वर्तुळाकार पुरवठा साखळी' : 'Clean & Green Circular Supply Chain'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>🚚</span>
              <span>{t.myRequests}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {language === 'hi' ? 'आपके द्वारा बनाए गए सभी डिजिटल लॉट, रीसाइक्लर के भाव और पिकअप की स्थिति' : language === 'mr' ? 'आपण तयार केलेले सर्व लॉट, रिसायकलरचे दर व पिकअप स्थिती' : 'All your registered scrap lots, quoted bids, and collection milestones'}
            </p>
          </div>

          <Link
            to="/collector/add"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 self-start sm:self-auto transition-all"
          >
            <span>{language === 'hi' ? '+ नया लॉट' : language === 'mr' ? '+ नवीन लॉट' : '+ New Lot'}</span>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-t border-slate-200 dark:border-slate-800 pt-3 overflow-x-auto text-xs font-bold">
          {[
            { key: 'ALL', label: language === 'hi' ? 'सभी लॉट' : language === 'mr' ? 'सर्व लॉट' : 'All Lots' },
            { key: 'ACTIVE', label: language === 'hi' ? 'प्रतीक्षारत / ऑफर आए' : language === 'mr' ? 'प्रतीक्षेत / ऑफर आल्या' : 'Active / Bids' },
            { key: 'ACCEPTED', label: language === 'hi' ? 'स्वीकृत / पिकअप' : language === 'mr' ? 'स्वीकृत / पिकअप' : 'Scheduled' },
            { key: 'COMPLETED', label: language === 'hi' ? 'रीसायकल पूर्ण' : language === 'mr' ? 'पूर्ण झालेले' : 'Completed' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key as any)}
              className={`px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                filterTab === tab.key
                  ? 'bg-white dark:bg-emerald-600 text-emerald-800 dark:text-white shadow-sm font-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lots List */}
      <div className="space-y-4">
        {loading ? (
          <LoadingSkeleton type="card" count={4} />
        ) : filteredLots.length === 0 ? (
          <EmptyState
            title={language === 'hi' ? 'इस श्रेणी में कोई लॉट नहीं मिला' : language === 'mr' ? 'या प्रकारात कोणताही लॉट आढळला नाही' : 'No Lots Found in this Category'}
            description={language === 'hi' ? 'आपने अभी तक इस स्थिति में कोई स्क्रैप लॉट नहीं बनाया है। नया लॉट बनाकर खरीदारों से बोलियां प्राप्त करें।' : language === 'mr' ? 'तुम्ही अद्याप या स्थितीत कोणताही लॉट तयार केलेला नाही. नवीन लॉट जोडून बोली मिळवा.' : 'You have not created any scrap lots under this filter. Add a new scrap lot to receive formal competitive recycler bids.'}
            actionText={language === 'hi' ? 'नया ई-कचरा लॉट जोड़ें' : language === 'mr' ? 'नवीन लॉट जोडा' : 'Add New Scrap Lot'}
            actionLink="/collector/add"
          />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredLots.map((lot) => {
            const offers = offersMap[lot.id] || [];
            const pendingOffers = offers.filter((o) => o.status === 'PENDING');
            const acceptedOffer = offers.find((o) => o.status === 'ACCEPTED');

            // Find highest rate among pending offers
            const highestRate = pendingOffers.length > 0
              ? Math.max(...pendingOffers.map((o) => o.offeredRatePerKg))
              : 0;

            const statusBadges: Record<string, { label: string; color: string }> = {
              CREATED: { label: language === 'hi' ? 'रीसाइक्लर की प्रतीक्षा' : language === 'mr' ? 'रिसायकलरची प्रतीक्षा' : 'Awaiting Bids', color: 'bg-slate-800 text-slate-300 border-slate-700' },
              OFFER_RECEIVED: {
                label: `${pendingOffers.length} ${language === 'hi' ? 'नए ऑफर आए हैं!' : language === 'mr' ? 'नवीन ऑफर्स आल्या आहेत!' : 'New Offers Received!'}`,
                color: 'bg-amber-950 text-amber-300 border-amber-800'
              },
              ACCEPTED: { label: language === 'hi' ? 'ऑफर स्वीकृत' : language === 'mr' ? 'ऑफर स्वीकृत' : 'Offer Accepted', color: 'bg-blue-950 text-blue-300 border-blue-800' },
              PICKUP_SCHEDULED: { label: language === 'hi' ? 'पिकअप शेड्यूल है' : language === 'mr' ? 'पिकअप नियोजित' : 'Pickup Scheduled', color: 'bg-purple-950 text-purple-300 border-purple-800' },
              RECEIVED: { label: language === 'hi' ? 'हैंडओवर संपन्न / पेमेंट पूरा' : language === 'mr' ? 'हँडओव्हर पूर्ण / पेमेंट पूर्ण' : 'Handover & Settled', color: 'bg-teal-950 text-teal-300 border-teal-800' },
              RECYCLER_RECEIVED: { label: language === 'hi' ? 'वेयरहाउस में प्राप्त' : language === 'mr' ? 'वेअरहाऊसमध्ये प्राप्त' : 'Warehouse Received', color: 'bg-teal-950 text-teal-300 border-teal-800' },
              SORTED: { label: language === 'hi' ? 'छंटाई व घटक विघटन' : language === 'mr' ? 'वर्गीकरण व घटक विभाजन' : 'Sorted & Depopulated', color: 'bg-cyan-950 text-cyan-300 border-cyan-800' },
              PROCESSING: { label: language === 'hi' ? 'फैक्ट्री में सुरक्षित प्रोसेसिंग' : language === 'mr' ? 'कारखान्यात सुरक्षित प्रक्रिया' : 'Under Processing', color: 'bg-indigo-950 text-indigo-300 border-indigo-800' },
              RECOVERED: { label: language === 'hi' ? 'दुर्लभ धातुएं पुनर्प्राप्त' : language === 'mr' ? 'दुर्मिळ धातू पुनर्प्राप्त' : 'Metals Recovered', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
              RECYCLED: { label: language === 'hi' ? '100% औपचारिक रीसायकल' : language === 'mr' ? '१००% अधिकृत रीसायकल' : '100% Formally Recycled', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' }
            };

            const currentBadge = statusBadges[lot.status] || statusBadges.CREATED;

            return (
              <div
                key={lot.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 transition-all"
              >
                {/* Lot Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={lot.imageUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&q=80'}
                      alt={lot.materialCategory}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400">{lot.id}</span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${currentBadge.color}`}>
                          {currentBadge.label}
                        </span>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                            lot.dataSource === 'LIVE'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}
                        >
                          {lot.dataSource === 'LIVE' ? '🟢 LIVE' : '🏷️ DEMO SEED'}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                          lot.condition === 'INTACT'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700'
                            : lot.condition === 'DAMAGED'
                            ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700'
                            : 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-700'
                        }`}>
                          {lot.condition === 'INTACT'
                            ? (language === 'hi' ? '🟢 साबुत' : language === 'mr' ? '🟢 अखंड' : '🟢 Intact')
                            : lot.condition === 'DAMAGED'
                            ? (language === 'hi' ? '🟡 क्षतिग्रस्त' : language === 'mr' ? '🟡 खराब' : '🟡 Damaged')
                            : (language === 'hi' ? '🟠 खुला हुआ' : language === 'mr' ? '🟠 वेगळे केलेले' : '🟠 Dismantled')}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                        {getCategoryLabel(lot.subCategory || lot.materialCategory, language)}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {language === 'hi' ? 'वजन:' : language === 'mr' ? 'वजन:' : 'Weight:'} <b className="text-slate-900 dark:text-white">{lot.approxWeight} {language === 'hi' || language === 'mr' ? 'किग्रा' : 'kg'}</b> • {language === 'hi' ? 'स्थिति:' : language === 'mr' ? 'स्थिती:' : 'Condition:'} <b className="text-slate-700 dark:text-slate-200">{lot.condition === 'INTACT' ? (language === 'hi' ? 'साबुत' : language === 'mr' ? 'अखंड' : 'Intact') : lot.condition === 'DAMAGED' ? (language === 'hi' ? 'क्षतिग्रस्त' : language === 'mr' ? 'खराब' : 'Damaged') : (language === 'hi' ? 'खुला हुआ' : language === 'mr' ? 'वेगळे केलेले' : 'Dismantled')}</b> • {language === 'hi' ? 'बेंचमार्क अनुमान:' : language === 'mr' ? 'बाजार अंदाज:' : 'Benchmark Est:'} <b className="text-emerald-700 dark:text-emerald-300">₹{lot.estimatedValueMin} – ₹{lot.estimatedValueMax}</b>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                    {/* Find Recyclers link if in CREATED or OFFER_RECEIVED status */}
                    {(lot.status === 'CREATED' || lot.status === 'OFFER_RECEIVED') && (
                      <Link
                        to={`/collector/recyclers?lotId=${lot.id}`}
                        className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-700 shadow-sm"
                      >
                        <Search className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{language === 'hi' ? 'रीसाइक्लर खोजें' : language === 'mr' ? 'रिसायकलर शोधा' : 'Find Recyclers'}</span>
                      </Link>
                    )}

                    <Link
                      to={`/collector/tracking/${lot.id}`}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                    >
                      <span>{language === 'hi' ? 'लाइव ट्रैकिंग' : language === 'mr' ? 'थेट ट्रॅकिंग' : 'Live Tracking'}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </Link>

                    {(lot.status === 'ACCEPTED' || lot.status === 'PICKUP_SCHEDULED' || lot.status === 'RECEIVED' || lot.status === 'RECYCLED') && (
                      <Link
                        to={`/collector/handover/${lot.id}`}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <span>{language === 'hi' ? 'हैंडओवर पर्ची' : language === 'mr' ? 'हँडओव्हर पावती' : 'Handover Receipt'}</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Recycler Offers Box (If any pending offers exist) */}
                {pendingOffers.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-amber-300 dark:border-amber-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <IndianRupee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>
                          {language === 'hi' ? 'रीसाइक्लर की बोलियां' : language === 'mr' ? 'कारखान्यांच्या बोली' : 'Formal Recycler Bids'} ({pendingOffers.length} {language === 'hi' ? 'बोलियां' : language === 'mr' ? 'बोली' : 'Bids'})
                        </span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{language === 'hi' ? 'पारदर्शी ऑफर तुलना' : language === 'mr' ? 'पारदर्शक तुलना' : 'Bid Comparison'}</span>
                    </div>

                    <div className="space-y-2.5">
                      {pendingOffers.map((offer) => {
                        const isTopRate = offer.offeredRatePerKg === highestRate;
                        return (
                          <div
                            key={offer.id}
                            className={`bg-white dark:bg-slate-900 border p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                              isTopRate ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-slate-900 dark:text-white">
                                  {formatUserDisplayName(offer.recyclerName, 'RECYCLER', language)}
                                </span>
                                {isTopRate && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    <span>{t.bestRateBadge}</span>
                                  </span>
                                )}
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                                  {language === 'hi' ? 'CPCB पंजीकृत' : language === 'mr' ? 'CPCB नोंदणीकृत' : 'CPCB Registered'}
                                </span>
                              </div>

                              <div className="text-xs text-slate-600 dark:text-slate-300 space-x-2">
                                <span>
                                  {language === 'hi' ? 'ऑफर दर:' : language === 'mr' ? 'दर:' : 'Rate:'} <b className="text-emerald-700 dark:text-emerald-400 font-black text-sm">₹{offer.offeredRatePerKg}/{language === 'hi' || language === 'mr' ? 'किग्रा' : 'kg'}</b>
                                </span>
                                <span>•</span>
                                <span>
                                  {language === 'hi' ? 'कुल राशि' : language === 'mr' ? 'एकूण रक्कम' : 'Total Value'} ({lot.approxWeight} {language === 'hi' || language === 'mr' ? 'किग्रा' : 'kg'}): <b className="text-slate-900 dark:text-white font-extrabold text-sm">₹{offer.totalOfferedPrice}</b>
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>
                                  {offer.pickupOffered ? (language === 'hi' ? 'मुफ्त डोरस्टेप पिकअप (₹0 कटौती)' : language === 'mr' ? 'मोफत पिकअप (₹० वजावट)' : 'Free Doorstep Collection') : (language === 'hi' ? 'स्वयं डिलीवरी' : language === 'mr' ? 'स्वतः वाहतूक' : 'Self Drop')}
                                </span>
                              </div>

                              {offer.notes && <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">"{offer.notes}"</p>}
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedOfferForAcceptance({ offer, lot })}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1.5 self-end sm:self-center shrink-0 transition-all"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{language === 'hi' ? 'ऑफर स्वीकारें' : language === 'mr' ? 'ऑफर स्वीकारा' : 'Accept Offer'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Accepted Offer Summary */}
                {acceptedOffer && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700/50 rounded-2xl p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">{language === 'hi' ? 'स्वीकृत रीसाइक्लर:' : language === 'mr' ? 'स्वीकृत कारखाना:' : 'Accepted Recycler:'}</span>
                      <span className="font-black text-slate-900 dark:text-white text-sm">{formatUserDisplayName(acceptedOffer.recyclerName, 'RECYCLER', language)}</span>
                      <span className="text-slate-600 dark:text-slate-300 block mt-0.5">
                        {language === 'hi' ? 'स्वीकृत दर:' : language === 'mr' ? 'स्वीकृत दर:' : 'Accepted Rate:'} <b>₹{acceptedOffer.offeredRatePerKg}/{language === 'hi' || language === 'mr' ? 'किग्रा' : 'kg'}</b> ({language === 'hi' ? 'अनुमानित कुल:' : language === 'mr' ? 'अंदाजे एकूण:' : 'Est Total:'} <b>₹{acceptedOffer.totalOfferedPrice}</b>)
                      </span>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">{language === 'hi' ? 'लॉजिस्टिक्स स्थिति:' : language === 'mr' ? 'लॉजिस्टिक्स स्थिती:' : 'Logistics Status:'}</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">
                        {lot.status === 'PICKUP_SCHEDULED' ? (language === 'hi' ? '🚚 गाड़ी रवाना हो चुकी है' : language === 'mr' ? '🚚 वाहन निघाले आहे' : '🚚 Vehicle Dispatched') : (language === 'hi' ? 'सत्यापित' : language === 'mr' ? 'पडताळणी पूर्ण' : 'Verified')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Offer Acceptance Confirmation Modal */}
      {selectedOfferForAcceptance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-emerald-500 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>🤝</span>
                <span>{language === 'hi' ? 'ऑफर स्वीकृति पुष्टि' : language === 'mr' ? 'ऑफर पुष्टीकरण' : 'Confirm Deal'}</span>
              </h3>
              <button
                onClick={() => setSelectedOfferForAcceptance(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{language === 'hi' ? 'लॉट संख्या:' : language === 'mr' ? 'लॉट क्रमांक:' : 'Lot ID:'}</span>
                <b className="font-mono text-emerald-700 dark:text-emerald-400">{selectedOfferForAcceptance.lot.id}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{language === 'hi' ? 'रीसाइक्लर:' : language === 'mr' ? 'रिसायकलर:' : 'Recycler:'}</span>
                <b className="text-slate-900 dark:text-white">{formatUserDisplayName(selectedOfferForAcceptance.offer.recyclerName, 'RECYCLER', language)}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{language === 'hi' ? 'सामग्री व वजन:' : language === 'mr' ? 'साहित्य व वजन:' : 'Item & Weight:'}</span>
                <b className="text-slate-900 dark:text-white">
                  {getCategoryLabel(selectedOfferForAcceptance.lot.subCategory || selectedOfferForAcceptance.lot.materialCategory, language)} ({selectedOfferForAcceptance.lot.approxWeight} {language === 'hi' || language === 'mr' ? 'किग्रा' : 'kg'})
                </b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{language === 'hi' ? 'प्रस्तावित दर:' : language === 'mr' ? 'प्रस्तावित दर:' : 'Offered Rate:'}</span>
                <b className="text-emerald-600 dark:text-emerald-400 text-sm font-black">₹{selectedOfferForAcceptance.offer.offeredRatePerKg} / {language === 'hi' || language === 'mr' ? 'किग्रा' : 'kg'}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{language === 'hi' ? 'अनुमानित कुल राशि:' : language === 'mr' ? 'एकूण रक्कम:' : 'Total Value:'}</span>
                <b className="text-slate-900 dark:text-white font-black text-base">₹{selectedOfferForAcceptance.offer.totalOfferedPrice}</b>
              </div>
              <div className="flex justify-between text-emerald-700 dark:text-emerald-300">
                <span>{language === 'hi' ? 'पिकअप मोड:' : language === 'mr' ? 'पिकअप पद्धत:' : 'Collection Mode:'}</span>
                <b>
                  {selectedOfferForAcceptance.offer.pickupOffered ? (language === 'hi' ? 'मुफ्त डोरस्टेप पिकअप (₹0 कटौती)' : language === 'mr' ? 'मोफत पिकअप (₹० वजावट)' : 'Free Doorstep Collection') : (language === 'hi' ? 'स्वयं डिलीवरी' : language === 'mr' ? 'स्वतः वाहतूक' : 'Self Drop')}
                </b>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              {language === 'hi' ? 'इस ऑफर को स्वीकार करने पर यह रीसाइक्लर पिकअप शेड्यूल करेगा।' : language === 'mr' ? 'ही ऑफर स्वीकारल्यानंतर संबंधित रिसायकलर पिकअप नियोजित करेल.' : 'Accepting this formal bid initiates immediate collection scheduling.'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOfferForAcceptance(null)}
                disabled={acceptingInProgress}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                {language === 'hi' ? 'वापस' : language === 'mr' ? 'मागे' : 'Back'}
              </button>
              <button
                type="button"
                onClick={handleConfirmAcceptOffer}
                disabled={acceptingInProgress}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950 flex items-center gap-1.5"
              >
                {acceptingInProgress ? (language === 'hi' ? 'स्वीकार हो रहा...' : language === 'mr' ? 'स्वीकारत आहे...' : 'Accepting...') : (language === 'hi' ? 'हाँ, ऑफर स्वीकार करें' : language === 'mr' ? 'होय, ऑफर स्वीकारा' : 'Accept Offer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
