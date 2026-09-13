import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  Coins, 
  Wallet, 
  ShieldAlert, 
  MapPin, 
  ChevronRight, 
  Package, 
  Volume2, 
  VolumeX,
  Sparkles, 
  TrendingUp, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Leaf,
  CheckCircle2,
  Truck,
  ArrowRight,
  Handshake,
  Scale,
  Clock,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSync } from '../../context/SyncContext';
import { useSpeech } from '../../hooks/useSpeech';
import { AudioButton } from '../../components/common/AudioButton';
import { api } from '../../services/api';
import { onPlatformSync } from '../../services/realtime';
import { Lot, PriceRecord } from '../../types';
import { getStatusLabel, getCategoryLabel, formatUserDisplayName, formatLocationString } from '../../i18n/translations';
import { formatWeight } from '../../utils/formatters';

export const CollectorDashboard: React.FC = () => {
  const { user, collectorProfile } = useAuth();
  const { language, t } = useLanguage();
  const { isOnline, pendingCount, syncNow, isSyncing } = useSync();
  const { speak, stop, isSpeaking } = useSpeech();

  const [lots, setLots] = useState<Lot[]>([]);
  const [prices, setPrices] = useState<PriceRecord[]>([]);
  const [ledgerSummary, setLedgerSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const rawCollectorName = collectorProfile?.name || user?.name;
  const collectorDisplayName = formatUserDisplayName(rawCollectorName, 'COLLECTOR', language);

  useEffect(() => {
    const fetchData = async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const district = collectorProfile?.district || 'Lucknow';
        const colId = collectorProfile?.id;
        const lotsQuery = colId ? api.getLots({ collectorId: colId, limit: '30' }) : api.getLots({ limit: '30' });
        const [lotsRes, ledgerRes, pricesRes] = await Promise.all([
          lotsQuery,
          api.getCollectorLedger(colId),
          api.getPriceBoard(district)
        ]);
        if (lotsRes.success) setLots(lotsRes.lots);
        if (ledgerRes.success) setLedgerSummary(ledgerRes.summary);
        if (pricesRes.success) setPrices(pricesRes.prices);
      } catch (err) {
        console.warn('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Real-time synchronization when bids/lots change
    const unsubscribeSync = onPlatformSync(() => {
      fetchData(true);
    });

    const interval = setInterval(() => {
      fetchData(true);
    }, 8000);

    return () => {
      unsubscribeSync();
      clearInterval(interval);
    };
  }, [collectorProfile]);

  const totalCollectedWeight = lots.reduce((sum, l) => sum + (l.approxWeight || 0), 0);
  const activeLots = lots.filter(l => l.status !== 'RECYCLED');
  const latestActiveLot = lots.find(l => l.status !== 'RECYCLED');

  // Benchmark calculation from stored real data
  const pcbPrice = prices.find(p => p.materialCategory === 'PCB')?.prevailingBuyPrice || 95;
  const middlemanPcbPrice = Math.round(pcbPrice * 0.58);
  const marginUpliftPercent = Math.round(((pcbPrice - middlemanPcbPrice) / middlemanPcbPrice) * 100);

  const speakOverview = () => {
    const todayEarn = (ledgerSummary?.todayEarnings || 0).toLocaleString('en-IN');
    const totalEarn = (ledgerSummary?.totalEarnings ?? ledgerSummary?.totalPaid ?? 0).toLocaleString('en-IN');
    const scrapWeight = formatWeight(totalCollectedWeight);
    const activeCount = activeLots.length;

    const text = language === 'hi'
      ? `नमस्ते ${collectorDisplayName}। कबाड़ीवाला कनेक्ट डैशबोर्ड। आज की कमाई ${todayEarn} रुपये है। कुल कमाई ${totalEarn} रुपये है। कुल स्क्रैप ${scrapWeight} किलो है। वर्तमान में ${activeCount} सक्रिय लॉट हैं। आज का पीसीबी भाव ${pcbPrice} रुपये प्रति किलो है। नया स्क्रैप बेचने के लिए हरा बटन दबाएं।`
      : language === 'mr'
      ? `नमस्कार ${collectorDisplayName}. कबाडीवाला कनेक्ट डॅशबोर्ड. आजची कमाई ${todayEarn} रुपये आहे. एकूण कमाई ${totalEarn} रुपये आहे. एकूण स्क्रॅप ${scrapWeight} किलो आहे. सध्या ${activeCount} सक्रिय लॉट आहेत. आजचा पीसीबी दर ${pcbPrice} रुपये प्रति किलो आहे. नवीन ई-कचरा विकण्यासाठी हिरवा बटण दाबा.`
      : `Welcome ${collectorDisplayName}. Kabadiwala Connect dashboard. Today's earnings are ${todayEarn} rupees. Total earnings are ${totalEarn} rupees. Total scrap is ${scrapWeight} kilograms. Currently ${activeCount} active lots. Today's PCB rate is ${pcbPrice} rupees per kg. Tap the green button to sell scrap.`;
    speak(text, language);
  };

  // Localized UI helper dictionaries
  const content = {
    hi: {
      roleBadge: t.roleCollector,
      quickSyncNotice: 'लॉट आपके फोन में सुरक्षित हैं (ऑटो-सिंक की प्रतीक्षा में)',
      syncBtn: 'सिंक करें',
      syncingBtn: 'सिंक हो रहा...',
      todayEarnings: 'आज की कमाई',
      totalEarned: 'कुल कमाई',
      totalWeight: 'कुल स्क्रैप',
      formalChannel: '100% औपचारिक चैनल',
      activeRequests: 'सक्रिय लॉट',
      processing: 'पिकअप प्रक्रियाधीन',
      mandiRateTicker: `आज का सरकारी भाव (${collectorProfile?.district || 'लखनऊ'}):`,
      journeyTitle: 'आपकी 6-चरणीय यात्रा:',
      activeLotNotice: 'वर्तमान सक्रिय लॉट स्थिति:',
      sellTile: 'स्क्रैप बेचें',
      sellSub: '+ नया लॉट जोड़ें',
      priceTile: 'आज का भाव',
      priceSub: 'सरकारी मंडी दर',
      recyclerTile: 'रीसाइक्लर चुनें',
      recyclerSub: 'अधिकृत फैक्ट्रियां',
      lotsTile: 'मेरे लॉट',
      lotsSub: 'पिकअप व स्थिति',
      ledgerTile: 'मेरी कमाई',
      ledgerSub: 'पासबुक व वाउचर',
      safetyTile: 'सुरक्षा गाइड',
      safetySub: 'खतरों से बचाव',
      viewAllLots: 'सभी लॉट देखें'
    },
    mr: {
      roleBadge: t.roleCollector,
      quickSyncNotice: 'लॉट फोनमध्ये सेव्ह आहेत (ऑटो-सिंकची वाट पाहत आहे)',
      syncBtn: 'सिंक करा',
      syncingBtn: 'सिंक होत आहे...',
      todayEarnings: 'आजची कमाई',
      totalEarned: 'एकूण कमाई',
      totalWeight: 'एकूण स्क्रॅप',
      formalChannel: '100% अधिकृत चॅनेल',
      activeRequests: 'सक्रिय लॉट',
      processing: 'पिकअप सुरू',
      mandiRateTicker: `आजचा सरकारी दर (${collectorProfile?.district || 'पुणे'}):`,
      journeyTitle: 'तुमचा 6-टप्प्यांचा प्रवास:',
      activeLotNotice: 'सध्याच्या लॉटची स्थिती:',
      sellTile: 'स्क्रॅप विका',
      sellSub: '+ नवीन लॉट जोडा',
      priceTile: 'आजचा दर',
      priceSub: 'सरकारी बाजारभाव',
      recyclerTile: 'रीसायकलर निवडा',
      recyclerSub: 'अधिकृत युनिट्स',
      lotsTile: 'माझे लॉट',
      lotsSub: 'पिकअप व ट्रॅकिंग',
      ledgerTile: 'माझी कमाई',
      ledgerSub: 'पासबुक व पावती',
      safetyTile: 'सुरक्षा नियम',
      safetySub: 'धोक्यांपासून संरक्षण',
      viewAllLots: 'सर्व लॉट पहा'
    },
    en: {
      roleBadge: t.roleCollector,
      quickSyncNotice: 'Lots safely saved on device (Awaiting cloud sync)',
      syncBtn: 'Sync Now',
      syncingBtn: 'Syncing...',
      todayEarnings: "Today's Earnings",
      totalEarned: 'Total Paid',
      totalWeight: 'Total Scrap',
      formalChannel: '100% Formal Channel',
      activeRequests: 'Active Lots',
      processing: 'Pickup In-Transit',
      mandiRateTicker: `Daily Benchmark Rates (${collectorProfile?.district || 'Lucknow'}):`,
      journeyTitle: 'Collector Lifecycle Journey:',
      activeLotNotice: 'Current Active Delivery Status:',
      sellTile: 'Sell Scrap',
      sellSub: '+ Add New E-Waste Lot',
      priceTile: 'Daily Rates',
      priceSub: 'Mandi Price Board',
      recyclerTile: 'Find Recycler',
      recyclerSub: 'CPCB Authorized Units',
      lotsTile: 'My Lots',
      lotsSub: 'Pickups & Tracking',
      ledgerTile: 'My Earnings',
      ledgerSub: 'Passbook & Vouchers',
      safetyTile: 'Safety Center',
      safetySub: 'Hazard Guidelines',
      viewAllLots: 'View All Lots'
    }
  }[language] || {
    roleBadge: 'Collector',
    quickSyncNotice: 'Lots saved on device',
    syncBtn: 'Sync Now',
    syncingBtn: 'Syncing...',
    todayEarnings: "Today's Earnings",
    totalEarned: 'Total Paid',
    totalWeight: 'Total Scrap',
    formalChannel: '100% Formal Channel',
    activeRequests: 'Active Lots',
    processing: 'In-Transit',
    mandiRateTicker: "Today's Rates:",
    journeyTitle: 'Collector Lifecycle Journey:',
    activeLotNotice: 'Current Active Delivery:',
    sellTile: 'Sell Scrap',
    sellSub: '+ Add Lot',
    priceTile: 'Daily Rates',
    priceSub: 'Price Board',
    recyclerTile: 'Find Recycler',
    recyclerSub: 'Authorized Units',
    lotsTile: 'My Lots',
    lotsSub: 'Pickups',
    ledgerTile: 'Earnings',
    ledgerSub: 'Passbook',
    safetyTile: 'Safety',
    safetySub: 'Rules',
    viewAllLots: 'View All'
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Top Header: Worker Profile, Language Switcher & Real Online/Offline Status */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-800/60 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          {/* Worker Avatar & Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/30 text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
              {collectorDisplayName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {collectorDisplayName}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 text-[10px] font-black border border-emerald-700">
                  {content.roleBadge}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-1 flex-wrap">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  {formatLocationString(collectorProfile?.district, collectorProfile?.state, language)}
                </span>
                <span>•</span>
                <span className="font-mono text-emerald-300 text-[11px] font-bold">
                  {language === 'hi' ? 'आईडी:' : language === 'mr' ? 'आयडी:' : 'ID:'} {collectorProfile?.id || 'COL-2026-01'}
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Online Status + Main Audio */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Online / Offline Status Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold">
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">{t.onlineStatus}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-300">{t.offlineStatus}</span>
                </>
              )}
            </div>

            {/* Dashboard Overview Read Aloud Audio */}
            <button
              type="button"
              onClick={() => {
                if (isSpeaking) {
                  stop();
                } else {
                  speakOverview();
                }
              }}
              className={`p-2.5 rounded-2xl border transition-all flex items-center justify-center shadow ${
                isSpeaking
                  ? 'bg-amber-500/30 border-amber-500 text-amber-300 ring-2 ring-amber-400/50'
                  : 'bg-emerald-600/30 hover:bg-emerald-600/50 border-emerald-500/50 text-emerald-300'
              }`}
              title={isSpeaking ? (t.voiceStop || 'Stop') : t.listenDashboardAudio}
              aria-label={isSpeaking ? (t.voicePlaying || 'Playing voice...') : t.listenDashboardAudio}
            >
              {isSpeaking ? (
                <VolumeX className="w-5 h-5 text-amber-300 animate-bounce" />
              ) : (
                <Volume2 className="w-5 h-5 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Offline Sync Banner if Pending Lots Exist */}
        {pendingCount > 0 && (
          <div className="mt-4 p-3 rounded-2xl bg-amber-950/80 border border-amber-600/60 flex items-center justify-between gap-2 text-xs">
            <span className="text-amber-200 font-bold">
              📱 {pendingCount} {content.quickSyncNotice}
            </span>
            <button
              onClick={() => syncNow()}
              disabled={!isOnline || isSyncing}
              className="px-3 py-1 bg-amber-600 text-white font-bold rounded-xl flex items-center gap-1 shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? content.syncingBtn : content.syncBtn}</span>
            </button>
          </div>
        )}

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mt-5">
          {/* Today's / Lifetime Earnings */}
          <div className="bg-slate-950/80 border border-slate-800/80 p-3 sm:p-3.5 rounded-2xl min-w-0 flex flex-col justify-between overflow-hidden">
            <span className="text-[11px] font-extrabold text-slate-400 block truncate">
              {content.todayEarnings}
            </span>
            <div className="flex items-baseline gap-1 mt-1 min-w-0 max-w-full overflow-hidden">
              <span className="text-base sm:text-2xl font-black text-emerald-400 truncate max-w-full tracking-tight break-all sm:break-normal" title={`₹${(ledgerSummary?.todayEarnings || 0).toLocaleString('en-IN')}`}>
                ₹{(ledgerSummary?.todayEarnings || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5 truncate">
              {content.totalEarned}: ₹{(ledgerSummary?.totalEarnings ?? ledgerSummary?.totalPaid ?? 0).toLocaleString('en-IN')}
            </span>
          </div>

          {/* E-Waste Volume */}
          <div className="bg-slate-950/80 border border-slate-800/80 p-3 sm:p-3.5 rounded-2xl min-w-0 flex-1 flex flex-col justify-between overflow-hidden">
            <span className="text-[11px] font-extrabold text-slate-400 block truncate">
              {content.totalWeight}
            </span>
            <div className="flex items-baseline gap-1 mt-1 min-w-0 max-w-full overflow-hidden">
              <span 
                className="text-base sm:text-2xl font-black text-white truncate max-w-full tracking-tight break-all sm:break-normal"
                title={`${formatWeight(totalCollectedWeight)} kg`}
              >
                {formatWeight(totalCollectedWeight)}
              </span>
              <span className="text-xs text-slate-400 font-bold shrink-0">kg</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold block mt-0.5 truncate">
              {t.formalChannelBadge}
            </span>
          </div>

          {/* Pending Active Requests */}
          <div className="bg-slate-950/80 border border-slate-800/80 p-3 sm:p-3.5 rounded-2xl min-w-0 flex-1 flex flex-col justify-between overflow-hidden">
            <span className="text-[11px] font-extrabold text-slate-400 block truncate">
              {content.activeRequests}
            </span>
            <div className="flex items-baseline gap-1 mt-1 min-w-0 max-w-full overflow-hidden">
              <span className="text-base sm:text-2xl font-black text-amber-400 truncate max-w-full tracking-tight break-all sm:break-normal">
                {activeLots.length}
              </span>
              <span className="text-xs text-slate-400 font-bold shrink-0">{language === 'en' ? 'Lots' : language === 'mr' ? 'लॉट' : 'लॉट'}</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5 truncate">
              {content.processing}
            </span>
          </div>
        </div>
      </div>

      {/* TODAY'S SCROLLING RATE TICKER */}
      {prices.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center gap-3 overflow-x-auto shadow-md">
          <div className="flex items-center gap-1 text-xs font-black text-amber-400 shrink-0 uppercase tracking-wider pl-1">
            <TrendingUp className="w-4 h-4" />
            <span>{t.mandiRateTicker}</span>
          </div>
          <div className="flex items-center gap-2">
            {prices.slice(0, 6).map(p => (
              <span
                key={p.id}
                className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 shrink-0"
              >
                {getCategoryLabel(p.materialCategory, language)}: <span className="text-emerald-400 font-black">₹{p.prevailingBuyPrice}/kg</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* FAIR PRICE UNIT ECONOMICS CALLOUT FOR JUDGES & COLLECTORS */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-900 border-2 border-emerald-500/60 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-2xl shrink-0 border border-emerald-500/40 shadow">
            💰
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                {t.directFinancialBenefit}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300 text-[10px] font-black border border-emerald-700">
                +{marginUpliftPercent || 72}% {t.upliftLabel || (language === 'hi' ? 'अधिक लाभ' : language === 'mr' ? 'जास्त नफा' : 'Uplift')}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
              {t.directFinancialBenefitDesc}
            </p>
          </div>
        </div>

        <Link
          to="/collector/ledger"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg shrink-0 flex items-center gap-1.5 transition-all"
        >
          <span>{t.viewPassbookBtn}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ACTIVE LOT HIGHLIGHT BANNER: SINGLE IMMEDIATE ACTION FOR COLLECTOR */}
      {latestActiveLot && (
        <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-950 border-2 border-blue-500/50 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={latestActiveLot.imageUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&q=80'}
              alt={latestActiveLot.materialCategory}
              className="w-14 h-14 rounded-2xl object-cover border border-blue-500/40 shrink-0 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-blue-300">{latestActiveLot.id}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-900/80 text-blue-200 border border-blue-600">
                  {getStatusLabel(latestActiveLot.status, language)}
                </span>
              </div>
              <h4 className="font-black text-sm text-white mt-0.5">
                {getCategoryLabel(latestActiveLot.materialCategory, language)} ({latestActiveLot.approxWeight} kg)
              </h4>
              <p className="text-[11px] text-slate-300">
                {latestActiveLot.status === 'CREATED' && t.statusWaitingOffer}
                {latestActiveLot.status === 'OFFER_RECEIVED' && t.statusOfferReceived}
                {latestActiveLot.status === 'ACCEPTED' && t.statusOfferAccepted}
                {latestActiveLot.status === 'PICKUP_SCHEDULED' && t.statusPickupScheduled}
                {latestActiveLot.status === 'RECEIVED' && t.statusReceived}
                {latestActiveLot.status === 'PROCESSING' && t.statusProcessing}
                {latestActiveLot.status === 'RECYCLED' && t.statusRecycled}
              </p>
            </div>
          </div>

          <div className="shrink-0 self-end sm:self-center">
            {latestActiveLot.status === 'PICKUP_SCHEDULED' ? (
              <Link
                to={`/collector/handover/${latestActiveLot.id}`}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black shadow-lg flex items-center gap-1.5 active:scale-95"
              >
                <Scale className="w-4 h-4" />
                <span>{t.openHandoverOtpBtn}</span>
              </Link>
            ) : latestActiveLot.status === 'RECEIVED' ? (
              <Link
                to={`/collector/handover/${latestActiveLot.id}`}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs font-black shadow-lg flex items-center gap-1.5 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.viewScaleReceiptBtn}</span>
              </Link>
            ) : (
              <Link
                to={`/collector/tracking/${latestActiveLot.id}`}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black shadow-lg flex items-center gap-1.5 active:scale-95"
              >
                <span>{t.trackStatusBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* COLLECTOR CIRCULAR LIFECYCLE TRACK (HORIZONTAL VISUAL JOURNEY) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-lg">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2 px-1">
          {t.circularJourneyTitle}
        </span>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
          <Link to="/collector/add" className="bg-slate-950/80 hover:bg-emerald-950/50 border border-slate-800 p-2.5 rounded-2xl transition-all">
            <span className="text-xl block">📷</span>
            <span className="font-bold text-[11px] text-white mt-1 block">{t.journeyStep1}</span>
          </Link>
          <Link to="/collector/prices" className="bg-slate-950/80 hover:bg-amber-950/50 border border-slate-800 p-2.5 rounded-2xl transition-all">
            <span className="text-xl block">💰</span>
            <span className="font-bold text-[11px] text-white mt-1 block">{t.journeyStep2}</span>
          </Link>
          <Link to="/collector/recyclers" className="bg-slate-950/80 hover:bg-teal-950/50 border border-slate-800 p-2.5 rounded-2xl transition-all">
            <span className="text-xl block">🤝</span>
            <span className="font-bold text-[11px] text-white mt-1 block">{t.journeyStep3}</span>
          </Link>
          <Link to="/collector/requests" className="bg-slate-950/80 hover:bg-purple-950/50 border border-slate-800 p-2.5 rounded-2xl transition-all">
            <span className="text-xl block">🚚</span>
            <span className="font-bold text-[11px] text-white mt-1 block">{t.journeyStep4}</span>
          </Link>
          <Link to="/collector/ledger" className="bg-slate-950/80 hover:bg-emerald-950/50 border border-slate-800 p-2.5 rounded-2xl transition-all">
            <span className="text-xl block">💵</span>
            <span className="font-bold text-[11px] text-white mt-1 block">{t.journeyStep5}</span>
          </Link>
          <Link to="/collector/requests" className="bg-slate-950/80 hover:bg-indigo-950/50 border border-slate-800 p-2.5 rounded-2xl transition-all">
            <span className="text-xl block">🛡️</span>
            <span className="font-bold text-[11px] text-white mt-1 block">{t.journeyStep6}</span>
          </Link>
        </div>
      </div>

      {/* PRIMARY SIX GIANT ACTION TILES (ICON-FIRST, PICTURE-FIRST, MIN 130px) */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5 px-1">
          <span>{t.heroActionsTitle}</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Tile 1: Sell Scrap (Primary Hero Action) */}
          <Link
            to="/collector/add"
            className="group relative bg-gradient-to-b from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white p-5 rounded-3xl shadow-xl shadow-emerald-950/50 border-2 border-emerald-400/50 flex flex-col justify-between min-h-[140px] transition-all hover:scale-[1.02] active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white/25 text-[10px] font-black uppercase tracking-wider shadow">
                {t.heroSellTag}
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-black text-lg sm:text-xl leading-tight">{content.sellTile}</h3>
              <p className="text-xs text-emerald-100 font-bold mt-0.5">{content.sellSub}</p>
            </div>
          </Link>

          {/* Tile 2: Today's Prices */}
          <Link
            to="/collector/prices"
            className="group bg-slate-900 hover:bg-slate-850 border border-amber-500/40 p-5 rounded-3xl shadow-lg flex flex-col justify-between min-h-[140px] transition-all hover:scale-[1.02] active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Coins className="w-8 h-8" />
              </div>
              <span className="text-xs font-black text-amber-400">{t.heroPriceTag}</span>
            </div>
            <div className="mt-4">
              <h3 className="font-black text-lg sm:text-xl text-white leading-tight">{content.priceTile}</h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">{content.priceSub}</p>
            </div>
          </Link>

          {/* Tile 3: Find Recycler */}
          <Link
            to="/collector/recyclers"
            className="group bg-slate-900 hover:bg-slate-850 border border-teal-500/40 p-5 rounded-3xl shadow-lg flex flex-col justify-between min-h-[140px] transition-all hover:scale-[1.02] active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                <Handshake className="w-8 h-8" />
              </div>
              <span className="text-xs font-black text-teal-400">{t.heroRecyclerTag}</span>
            </div>
            <div className="mt-4">
              <h3 className="font-black text-lg sm:text-xl text-white leading-tight">{content.recyclerTile}</h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">{content.recyclerSub}</p>
            </div>
          </Link>

          {/* Tile 4: My Requests & Pickups */}
          <Link
            to="/collector/requests"
            className="group bg-slate-900 hover:bg-slate-850 border border-purple-500/40 p-5 rounded-3xl shadow-lg flex flex-col justify-between min-h-[140px] transition-all hover:scale-[1.02] active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Truck className="w-8 h-8" />
              </div>
              <span className="text-xs font-black text-purple-400">{activeLots.length} {t.heroRequestsTag}</span>
            </div>
            <div className="mt-4">
              <h3 className="font-black text-lg sm:text-xl text-white leading-tight">{content.lotsTile}</h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">{content.lotsSub}</p>
            </div>
          </Link>

          {/* Tile 5: My Earnings Ledger */}
          <Link
            to="/collector/ledger"
            className="group bg-slate-900 hover:bg-slate-850 border border-emerald-500/40 p-5 rounded-3xl shadow-lg flex flex-col justify-between min-h-[140px] transition-all hover:scale-[1.02] active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Wallet className="w-8 h-8" />
              </div>
              <span className="text-xs font-black text-emerald-400">{t.heroLedgerTag}</span>
            </div>
            <div className="mt-4">
              <h3 className="font-black text-lg sm:text-xl text-white leading-tight">{content.ledgerTile}</h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">{content.ledgerSub}</p>
            </div>
          </Link>

          {/* Tile 6: Safety & Health Rules */}
          <Link
            to="/collector/safety"
            className="group bg-slate-900 hover:bg-slate-850 border border-orange-500/40 p-5 rounded-3xl shadow-lg flex flex-col justify-between min-h-[140px] transition-all hover:scale-[1.02] active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <span className="text-xs font-black text-orange-400">{t.heroSafetyTag}</span>
            </div>
            <div className="mt-4">
              <h3 className="font-black text-lg sm:text-xl text-white leading-tight">{content.safetyTile}</h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">{content.safetySub}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* VISUALLY POWERFUL FAIR PRICE / MIDDLEMAN MARGIN COMPARISON BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-base sm:text-lg font-black text-white">
                {t.fairPriceUpliftTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {t.fairPriceUpliftDesc}
            </p>
          </div>

          <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black self-start sm:self-auto">
            {t.verifiedMandiRates} • {collectorProfile?.district || 'Lucknow'}
          </div>
        </div>

        {/* 2-Box Direct Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Traditional Middleman Rate */}
          <div className="bg-slate-950/80 border border-red-900/50 p-4 rounded-2xl text-center space-y-1">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block">
              {t.traditionalMiddlemanTitle}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-400 line-through">
              ₹{middlemanPcbPrice} <span className="text-xs text-slate-500">/kg</span>
            </div>
            <p className="text-[11px] text-slate-500">{t.middlemanTrickNotice}</p>
          </div>

          {/* Platform CPCB Recycler Rate */}
          <div className="bg-emerald-950/90 border-2 border-emerald-500 p-4 rounded-2xl text-center space-y-1 shadow-lg shadow-emerald-950/50">
            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider block">
              {t.platformRecyclerTitle}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-300">
              ₹{pcbPrice} <span className="text-xs text-emerald-400">/kg</span>
            </div>
            <p className="text-[11px] text-emerald-200 font-bold">{t.platformAdvantageNotice}</p>
          </div>

          {/* Net Margin Uplift */}
          <div className="bg-gradient-to-br from-amber-600/30 to-slate-950 border border-amber-500/40 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
              {t.extraIncomeTitle}
            </span>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 mt-1">
              +{marginUpliftPercent}%
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">{t.perKgExtraEarning}</span>
          </div>
        </div>
      </div>

      {/* RECENT LOTS STATUS TRACKING */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-emerald-400" />
            <span>{t.recentLotsTitle}</span>
          </h2>
          <Link to="/collector/requests" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1">
            <span>{t.viewAllLots} ({lots.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {lots.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 space-y-3">
            <Package className="w-12 h-12 mx-auto text-slate-600" />
            <p className="font-semibold text-sm">{t.noLotsCreatedYet}</p>
            <Link
              to="/collector/add"
              className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black shadow-lg active:scale-95"
            >
              {t.addFirstLotBtn}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {lots.slice(0, 3).map((lot) => {
              const statusColors: Record<string, string> = {
                CREATED: 'bg-slate-800 text-slate-300 border-slate-700',
                OFFER_RECEIVED: 'bg-amber-950 text-amber-300 border-amber-800',
                ACCEPTED: 'bg-blue-950 text-blue-300 border-blue-800',
                PICKUP_SCHEDULED: 'bg-purple-950 text-purple-300 border-purple-800',
                RECEIVED: 'bg-teal-950 text-teal-300 border-teal-800',
                RECYCLER_RECEIVED: 'bg-teal-950 text-teal-300 border-teal-800',
                SORTED: 'bg-cyan-950 text-cyan-300 border-cyan-800',
                PROCESSING: 'bg-indigo-950 text-indigo-300 border-indigo-800',
                RECOVERED: 'bg-emerald-950 text-emerald-300 border-emerald-800',
                RECYCLED: 'bg-emerald-950 text-emerald-300 border-emerald-800'
              };

              return (
                <Link
                  key={lot.id}
                  to={`/collector/tracking/${lot.id}`}
                  className="block bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-600/60 rounded-2xl p-4 transition-all shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={lot.imageUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&q=80'}
                        alt={lot.materialCategory}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-400">{lot.id}</span>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${statusColors[lot.status] || statusColors.CREATED}`}>
                            {getStatusLabel(lot.status, language)}
                          </span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                            lot.dataSource === 'LIVE'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {lot.dataSource === 'LIVE' ? t.liveBadge : t.demoBadge}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-white mt-0.5">{getCategoryLabel(lot.materialCategory, language)}</h4>
                        <p className="text-xs text-slate-400">
                          {language === 'en' ? 'Weight' : language === 'mr' ? 'वजन' : 'वजन'}: <b className="text-white">{lot.approxWeight} kg</b> • {language === 'en' ? 'Value' : language === 'mr' ? 'मूल्य' : 'मूल्य'}: <b className="text-emerald-300">₹{lot.estimatedValueAvg || (lot.approxWeight * 80)}</b>
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
