import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  ArrowDownLeft, 
  Wallet, 
  Receipt, 
  ShieldCheck,
  Search,
  Filter,
  Printer,
  X,
  QrCode,
  ExternalLink,
  Building2,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { PaymentLedgerEntry } from '../../types';
import { getCategoryLabel } from '../../i18n/translations';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { CollectorGamificationCard } from '../../components/common/CollectorGamificationCard';

export const EarningsLedgerPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<PaymentLedgerEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [showUpliftDetails, setShowUpliftDetails] = useState<boolean>(false);

  // Selected Voucher Modal State
  const [selectedVoucher, setSelectedVoucher] = useState<PaymentLedgerEntry | null>(null);

  useEffect(() => {
    let collectorId = 'col_1';
    try {
      const cp = localStorage.getItem('collectorProfile');
      if (cp) {
        const parsed = JSON.parse(cp);
        if (parsed?.id) collectorId = parsed.id;
      }
    } catch {}

    const fetchLedger = async () => {
      setLoading(true);
      try {
        const res = await api.getCollectorLedger(collectorId);
        if (res.success) {
          setSummary(res.summary);
          setTransactions(res.transactions);
        }
      } catch (err) {
        console.warn('Failed to load ledger:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, []);

  const formatTxnDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = !searchQuery || 
      tx.transactionRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.recyclerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.materialCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.lotId && tx.lotId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = filterCategory === 'ALL' || tx.materialCategory === filterCategory;
    const matchesMethod = filterMethod === 'ALL' || 
      (filterMethod === 'CASH' && tx.paymentMethod === 'CASH') ||
      (filterMethod === 'UPI' && tx.paymentMethod !== 'CASH');

    return matchesSearch && matchesCategory && matchesMethod;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header & Passbook Summary */}
      <div className="bg-gradient-to-br from-white via-slate-50 to-emerald-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              <span>{t.earningsLedger}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-300 font-medium mt-1">
              {language === 'hi' 
                ? 'कलेक्टर खाता पासबुक: स्क्रैप बिक्री, कांटे के वजन एवं डिजिटल भुगतान का पारदर्शी रिकॉर्ड' 
                : language === 'mr' 
                ? 'खाते पासबुक: ई-कचरा विक्री, प्रत्यक्ष वजन व पारदर्शक पावती नोंद' 
                : 'Collector Passbook: Verified scale weight, transaction vouchers and payment ledger'}
            </p>
          </div>

          <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300 text-xs font-black self-start sm:self-auto shadow-sm flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{language === 'hi' ? 'CPCB सत्यापित लेजर वाउचर' : language === 'mr' ? 'CPCB प्रमाणित लेजर पावती' : 'CPCB Double-Entry Ledger'}</span>
          </div>
        </div>

        {/* 4 Financial Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-white dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {t.todaysEarnings}
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              ₹{(summary?.todayEarnings || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {language === 'hi' ? 'साप्ताहिक कमाई (7 दिन)' : language === 'mr' ? 'साप्ताहिक कमाई (7 दिवस)' : 'Weekly Earnings (7 Days)'}
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              ₹{(summary?.weeklyEarnings || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {language === 'hi' ? 'मासिक कमाई (30 दिन)' : language === 'mr' ? 'मासिक कमाई (30 दिवस)' : 'Monthly Earnings (30 Days)'}
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              ₹{(summary?.monthlyEarnings || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {language === 'hi' ? 'कुल आजीवन कमाई' : language === 'mr' ? 'एकूण कमाई' : 'Total Earnings'}
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              ₹{(summary?.totalEarnings || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Interactive Settlement Mode Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-xs font-bold">
          <span className="text-slate-500 dark:text-slate-400 mr-1">{language === 'hi' ? 'निपटान माध्यम:' : language === 'mr' ? 'पेमेंट पद्धत:' : 'Settlement Mode:'}</span>
          
          <button
            type="button"
            onClick={() => setFilterMethod('ALL')}
            className={`px-3 py-1.5 rounded-xl border transition-all active:scale-95 shadow-sm ${
              filterMethod === 'ALL'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800 dark:hover:text-white'
            }`}
          >
            {language === 'hi' ? 'सभी भुगतान' : language === 'mr' ? 'सर्व पेमेंट' : 'All Payments'}
          </button>

          <button
            type="button"
            onClick={() => setFilterMethod('CASH')}
            className={`px-3 py-1.5 rounded-xl border transition-all active:scale-95 font-mono shadow-sm ${
              filterMethod === 'CASH'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80'
            }`}
          >
            💵 {language === 'hi' ? 'नकद:' : language === 'mr' ? 'रोख:' : 'Cash:'} ₹{(summary?.cashEarnings || 0).toLocaleString('en-IN')}
          </button>

          <button
            type="button"
            onClick={() => setFilterMethod('UPI')}
            className={`px-3 py-1.5 rounded-xl border transition-all active:scale-95 font-mono shadow-sm ${
              filterMethod === 'UPI'
                ? 'bg-blue-600 text-white border-blue-500 shadow'
                : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80'
            }`}
          >
            📱 {language === 'hi' ? 'यूपीआई / ऑनलाइन:' : language === 'mr' ? 'UPI / ऑनलाईन:' : 'UPI / Online:'} ₹{(summary?.upiEarnings || 0).toLocaleString('en-IN')}
          </button>
        </div>

        {/* Analytical Fair-Price Unit Economics Box */}
        {(summary as any)?.unitEconomics && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/90 dark:via-slate-900 dark:to-slate-950 border border-emerald-300/80 dark:border-emerald-500/40 text-xs space-y-2.5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                    {language === 'hi' ? '💡 बिचौलिए के मुकाबले अतिरिक्त आय:' : language === 'mr' ? '💡 दलालापेक्षा अतिरिक्त उत्पन्न:' : '💡 Net Uplift vs Informal Middleman:'}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{language === 'hi' ? 'सत्यापित पारदर्शी आर्थिक मॉडल' : language === 'mr' ? 'प्रमाणित पारदर्शक मॉडेल' : 'Verified Fair-Price Model'}</span>
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {language === 'hi'
                    ? 'पारंपरिक स्थानीय बिचौलिए के मुकाबले डिजिटल कांटे एवं सीधे रीसाइक्लर भाव से अर्जित शुद्ध अतिरिक्त आय।'
                    : language === 'mr'
                    ? 'स्थानिक मध्यस्थांपेक्षा थेट कारखान्याशी जोडल्यामुळे व अचूक काट्यामुळे मिळालेला जादा नफा.'
                    : 'Realized net earnings premium through certified weighbridges and direct formal recycler rates.'}
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold block">{language === 'hi' ? 'सीधा शुद्ध मुनाफा:' : language === 'mr' ? 'थेट नफा:' : 'Direct Platform Margin Uplift:'}</span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                  +₹{(summary as any).unitEconomics.netUpliftAmount.toLocaleString('en-IN')} (+{(summary as any).unitEconomics.netUpliftPercentage}%)
                </span>
              </div>
            </div>

            {/* Expandable Breakdown Button */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowUpliftDetails(!showUpliftDetails)}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 font-bold flex items-center gap-1 active:scale-95"
              >
                <span>{showUpliftDetails ? (language === 'hi' ? 'विवरण छिपाएं' : language === 'mr' ? 'तपशील लपवा' : 'Hide Economic Breakdown') : (language === 'hi' ? 'आर्थिक विवरण देखें' : language === 'mr' ? 'आर्थिक तपशील पहा' : 'View Economic Breakdown')}</span>
                {showUpliftDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showUpliftDetails && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/50 text-[11px] text-slate-600 dark:text-slate-300 animate-fadeIn">
                  <div className="bg-white dark:bg-slate-950/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">{language === 'hi' ? '1. सीधी मंडी भाव प्रीमियम' : language === 'mr' ? '1. थेट बाजारभाव प्रीमियम' : '1. Direct Mandi Price Premium'}</span>
                    <span>{language === 'hi' ? 'स्थानीय बिचौलिए आमतौर पर 20-25% कम दर देते हैं। सीधे CPCB अधिकृत रीसाइक्लर पारदर्शी रियल-टाइम दरें प्रदान करते हैं।' : language === 'mr' ? 'स्थानिक दलाल २०-२५% कमी दर देतात. थेट CPCB अधिकृत रिसायकलर्स पारदर्शक बेंचमार्क दर देतात.' : 'Local aggregators typically shave 20-25% off scrap value. Direct CPCB authorized recyclers offer transparent real-time benchmark rates.'}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-950/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">{language === 'hi' ? '2. डिजिटल कांटे की सटीकता से लाभ' : language === 'mr' ? '2. डिजिटल काट्याची अचूकता फायदा' : '2. Digital Weighbridge Accuracy Gain'}</span>
                    <span>{language === 'hi' ? 'अनौपचारिक मैनुअल कांटे ~12% वजन कम बताते हैं। कैलिब्रेटेड डिजिटल कांटे 100% सही वजन मूल्य की गारंटी देते हैं।' : language === 'mr' ? 'मॅन्युअल वजन काटा ~१२% वजन कमी दाखवतो. डिजिटल वजन काटा १००% अचूक वजनाची हमी देतो.' : 'Informal manual spring scales siphon ~12% weight. Calibrated digital weighbridge scales guarantee 100% true weight compensation.'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 🏅 Collector Gamification & Green Badges Section */}
      <CollectorGamificationCard totalWeight={(summary as any)?.totalWeight || (summary as any)?.totalWeightCollectedKg || 0} />

      {/* Transaction History & Interactive Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{language === 'hi' ? 'सत्यापित भुगतान रसीदें' : language === 'mr' ? 'सत्यापित पावत्या' : 'Digital Handover Vouchers'}</span>
            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              {filteredTransactions.length}
            </span>
          </h2>

          {/* Search Input Bar */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'hi' ? 'वाउचर, क्रेता या लॉट खोजें...' : 'Search voucher, buyer or lot...'}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-sm"
            />
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
          {[
            { key: 'ALL', label: language === 'hi' ? 'सभी श्रेणियां' : language === 'mr' ? 'सर्व श्रेणी' : 'All Categories' },
            { key: 'BATTERY', label: language === 'hi' ? '🔋 बैटरी' : language === 'mr' ? '🔋 बॅटरी' : '🔋 Batteries' },
            { key: 'PCB', label: language === 'hi' ? '📟 पीसीबी' : language === 'mr' ? '📟 पीसीबी' : '📟 PCBs' },
            { key: 'CABLE', label: language === 'hi' ? '🔌 केबल' : language === 'mr' ? '🔌 केबल' : '🔌 Cables' },
            { key: 'MOTOR', label: language === 'hi' ? '⚙️ मोटर' : language === 'mr' ? '⚙️ मोटर' : '⚙️ Motors' }
          ].map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setFilterCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 active:scale-95 shadow-sm ${
                filterCategory === cat.key
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-400 dark:border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSkeleton type="list" count={4} />
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            title={language === 'hi' ? 'कोई वाउचर नहीं मिला' : language === 'mr' ? 'कोणतीही पावती आढळली नाही' : 'No Vouchers Found'}
            description={language === 'hi' ? 'सत्यापित डिजिटल तौल व स्क्रैप बिक्री के बाद यहाँ लेजर प्रविष्टियां दिखाई देंगी।' : language === 'mr' ? 'प्रमाणित वजन आणि विक्री पूर्ण झाल्यावर येथे नोंदी दिसतील.' : 'Completed scrap sales and certified digital scale transactions will appear here.'}
            actionText={language === 'hi' ? 'नया लॉट जोड़ें' : language === 'mr' ? 'नवीन लॉट जोडा' : 'Add Scrap Lot'}
            actionLink="/collector/add"
          />
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => setSelectedVoucher(tx)}
                className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-200 dark:border-emerald-800 shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                    <ArrowDownLeft className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                        {getCategoryLabel(tx.materialCategory, language)} {language === 'hi' ? 'बिक्री' : language === 'mr' ? 'विक्री' : 'Sale'}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800">
                        {language === 'hi' ? 'वाउचर:' : language === 'mr' ? 'पावती:' : 'Voucher:'} {tx.transactionRef}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {language === 'hi' ? 'क्रेता:' : language === 'mr' ? 'खरेदीदार:' : 'Buyer:'} <b className="text-slate-900 dark:text-white">{tx.recyclerName}</b> • {tx.weight} {language === 'hi' ? 'किग्रा' : language === 'mr' ? 'किलो' : 'kg'} @ ₹{tx.ratePerKg}/{language === 'hi' ? 'किग्रा' : language === 'mr' ? 'किलो' : 'kg'}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      {formatTxnDate(tx.timestamp)}
                    </span>
                  </div>
                </div>

                <div className="text-right self-end sm:self-center">
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    +₹{tx.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="flex flex-col items-end gap-1 mt-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-xl border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{tx.paymentMethod === 'CASH' ? (language === 'hi' ? '💵 नकद भुगतान' : '💵 Spot Cash Disbursal') : (language === 'hi' ? '📱 तत्काल यूपीआई' : '📱 Instant UPI Transfer')} ✓</span>
                    </span>
                    <span className="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 flex items-center gap-1">
                      <span>CPCB Double-Entry Ledger</span>
                      <ExternalLink className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Official CPCB Double-Entry Payment Slip Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {language === 'hi' ? 'डिजिटल हैंडओवर व भुगतान पर्ची' : 'Digital Handover & Settlement Voucher'}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Rule 19, E-Waste (Management) Rules, 2022</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVoucher(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Voucher Metadata */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">Voucher Reference</span>
                <b className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">{selectedVoucher.transactionRef}</b>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">Settlement Date</span>
                <span className="text-slate-800 dark:text-white font-mono">{formatTxnDate(selectedVoucher.timestamp)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">Settlement Status</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 font-bold text-[10px]">
                  🟢 100% PAID & SETTLED IN LEDGER
                </span>
              </div>
            </div>

            {/* Parties Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider block">Buyer (Authorized Recycler)</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{selectedVoucher.recyclerName}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">CPCB/EWR/UP/LKO/2023/8812</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Facility: Phase II Industrial Area, Lucknow</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider block">Seller (Verified Collector)</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Ramesh Kumar</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">KYC: CPCB-REG-COLL-98</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">District: Lucknow, Uttar Pradesh</p>
              </div>
            </div>

            {/* Weighbridge Verification Slip Breakdown */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] block border-b border-slate-200 dark:border-slate-800 pb-1.5">
                Weighbridge Scale Slip & Payment Calculation
              </span>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Material Consignment:</span>
                <b className="text-slate-900 dark:text-white">{getCategoryLabel(selectedVoucher.materialCategory, language)}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Net Scale Weight:</span>
                <b className="text-slate-900 dark:text-white font-mono">{selectedVoucher.weight} kg</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Agreed Buying Rate:</span>
                <b className="text-emerald-600 dark:text-emerald-400 font-mono">₹{selectedVoucher.ratePerKg} / kg</b>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-200 font-bold">Total Net Payout:</span>
                <b className="text-emerald-600 dark:text-emerald-400 font-black text-base font-mono">₹{selectedVoucher.amount.toLocaleString('en-IN')}</b>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>Disbursal Channel:</span>
                <b className="text-slate-800 dark:text-slate-300">{selectedVoucher.paymentMethod === 'CASH' ? '💵 Spot Cash Settlement' : '📱 Instant UPI / Escrow Transfer'}</b>
              </div>
            </div>

            {/* QR Code & Digital Signature */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
              <div className="p-2 bg-white rounded-xl shrink-0 border border-slate-200 shadow-sm">
                <QrCode className="w-14 h-14 text-slate-950" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Digitally Stamped & Immutable</span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">
                  This transaction voucher is linked to CPCB Form-6 Manifest and verifiable via CPCB inspector portal.
                </p>
                <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                  Lot Link: {selectedVoucher.lotId || 'EW-LUC-2026-433278'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 border border-slate-200 dark:border-slate-700"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'पर्ची प्रिंट करें' : 'Print Voucher'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedVoucher(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all"
              >
                {language === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
