import React, { useState, useEffect } from 'react';
import { 
  ArrowDownLeft, 
  CheckCircle2, 
  Award, 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Loader2, 
  Building2, 
  Globe,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { onPlatformSync } from '../../services/realtime';
import { PaymentLedgerEntry, Lot, HandoverRecord } from '../../types';
import { GreenCertificateModal } from '../../components/common/GreenCertificateModal';
import { getCategoryLabel } from '../../i18n/translations';

export const RecyclerTransactionsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, recyclerProfile } = useAuth();
  const { showToast } = useToast();

  const myRecyclerId = recyclerProfile?.id || user?.id || 'rec_abc_1';
  const facilityName = recyclerProfile?.facilityName || 'ABC E-Waste Recycling Pvt Ltd';

  const [scope, setScope] = useState<'MY_FACILITY' | 'ALL_NETWORK'>('MY_FACILITY');
  const [transactions, setTransactions] = useState<PaymentLedgerEntry[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'CASH' | 'UPI'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Certificate Modal State
  const [selectedLotForCert, setSelectedLotForCert] = useState<Lot | null>(null);
  const [selectedHandoverForCert, setSelectedHandoverForCert] = useState<HandoverRecord | null>(null);
  const [loadingCertLotId, setLoadingCertLotId] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const recId = scope === 'MY_FACILITY' ? myRecyclerId : undefined;
      const res = await api.getRecyclerTransactions(recId);
      if (res.success) {
        setTransactions(res.transactions);
        setSummary(res.summary);
      }
    } catch (err) {
      console.warn('Payments fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    const unsubscribeSync = onPlatformSync(() => {
      fetchTransactions();
    });

    return () => {
      unsubscribeSync();
    };
  }, [scope, myRecyclerId]);

  const handleOpenCertificate = async (lotId: string) => {
    setLoadingCertLotId(lotId);
    try {
      const res = await api.getLotById(lotId);
      if (res.success && res.lot) {
        setSelectedLotForCert(res.lot);
        setSelectedHandoverForCert((res.handover as HandoverRecord) || null);
      }
    } catch (e) {
      showToast(
        language === 'hi'
          ? `लॉट ${lotId} का प्रमाणपत्र लोड नहीं हो सका`
          : language === 'mr'
          ? `लॉट ${lotId} चे प्रमाणपत्र लोड करता आले नाही`
          : `Could not load certificate for lot ${lotId}`,
        'error'
      );
    } finally {
      setLoadingCertLotId(null);
    }
  };

  const exportLedgerCsv = () => {
    if (transactions.length === 0) return;

    const headers = [
      'Transaction Ref',
      'Lot ID',
      'Timestamp',
      'Material Category',
      'Weight (kg)',
      'Rate (INR/kg)',
      'Amount (INR)',
      'Payment Method',
      'Payout Status',
      'Recycler Facility'
    ];

    const rows = filteredTransactions.map(t => [
      `"${t.transactionRef || ''}"`,
      `"${t.lotId || ''}"`,
      `"${new Date(t.timestamp).toLocaleString('en-IN')}"`,
      `"${t.materialCategory || ''}"`,
      t.weight,
      t.ratePerKg,
      t.amount,
      `"${t.paymentMethod || ''}"`,
      `"${t.payoutStatus || 'SETTLED'}"`,
      `"${t.recyclerName || facilityName}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CPCB_E_Waste_Ledger_${scope}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(
      language === 'hi' ? 'बहीखाता CSV सफलतापूर्वक डाउनलोड हुआ' : 'CPCB Ledger CSV exported successfully',
      'success'
    );
  };

  // Filtered transactions computation
  const filteredTransactions = transactions.filter(tx => {
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const matchLot = (tx.lotId || '').toLowerCase().includes(q);
      const matchRef = (tx.transactionRef || '').toLowerCase().includes(q);
      const matchCat = (tx.materialCategory || '').toLowerCase().includes(q);
      if (!matchLot && !matchRef && !matchCat) return false;
    }
    if (paymentFilter !== 'ALL') {
      if (paymentFilter === 'CASH' && tx.paymentMethod !== 'CASH') return false;
      if (paymentFilter === 'UPI' && tx.paymentMethod === 'CASH') return false;
    }
    if (categoryFilter !== 'ALL') {
      if ((tx.materialCategory || '').toUpperCase() !== categoryFilter) return false;
    }
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-2">
              <FileText className="w-3.5 h-3.5" />
              <span>CPCB Rule 19 Double-Entry Accounting</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📜</span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {language === 'hi' ? 'रीसाइक्लर वित्तीय बहीखाता एवं रसीदें' : language === 'mr' ? 'रिसायकलर वित्तीय नोंदवही व पावत्या' : 'Recycler Financial Ledger'}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Facility: <b className="text-emerald-700 dark:text-emerald-400">{facilityName}</b> • Cryptographically Verified Vouchers
            </p>
          </div>

          {/* Facility Scope Toggle & CSV Export Button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setScope('MY_FACILITY')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  scope === 'MY_FACILITY'
                    ? 'bg-white dark:bg-emerald-600 text-emerald-800 dark:text-white shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>My Facility</span>
              </button>
              <button
                type="button"
                onClick={() => setScope('ALL_NETWORK')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  scope === 'ALL_NETWORK'
                    ? 'bg-white dark:bg-emerald-600 text-emerald-800 dark:text-white shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>All Network</span>
              </button>
            </div>

            <button
              type="button"
              onClick={exportLedgerCsv}
              disabled={filteredTransactions.length === 0}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              title="Export official CPCB compliance ledger"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 text-xs">
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {language === 'hi' ? 'कुल भुगतान' : language === 'mr' ? 'एकूण वितरण' : 'Total Disbursed'}
            </span>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
              ₹{(summary?.totalDisbursedINR || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              100% formal banking / verified cash
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {language === 'hi' ? 'कुल प्राप्त वजन' : language === 'mr' ? 'एकूण प्राप्त वजन' : 'Total Weight Procured'}
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {Number((summary?.totalWeightKg || 0).toFixed(1)).toLocaleString('en-IN')} kg
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Tare-calibrated scale weights
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {language === 'hi' ? 'निस्तारित लेनदेन' : language === 'mr' ? 'पूर्ण झालेले व्यवहार' : 'Settled Transactions'}
            </span>
            <div className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1">
              {summary?.totalTransactions || 0}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Cryptographically verified vouchers
            </span>
          </div>
        </div>
      </div>

      {/* Transaction Records Table with Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                {language === 'hi' ? 'भुगतान बहीखाता इतिहास' : language === 'mr' ? 'पेमेंट नोंदवही इतिहास' : 'Payment Disbursal Ledger'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
                {filteredTransactions.length} of {transactions.length}
              </span>
            </h2>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Lot ID or Ref..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs w-44 sm:w-56"
              />
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPaymentFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  paymentFilter === 'ALL' ? 'bg-white dark:bg-emerald-600 text-emerald-800 dark:text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('CASH')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  paymentFilter === 'CASH' ? 'bg-white dark:bg-emerald-600 text-emerald-800 dark:text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('UPI')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  paymentFilter === 'UPI' ? 'bg-white dark:bg-emerald-600 text-emerald-800 dark:text-white shadow-sm font-black' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                UPI / Voucher
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-12 text-center space-y-3 border border-slate-200 dark:border-slate-800">
            <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Synchronizing cryptographic financial ledger from Supabase...
            </p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-8 text-center space-y-3 border border-slate-200 dark:border-slate-800">
            <FileText className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              No transactions match the selected filter criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800/80 hover:border-emerald-400/60 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold shrink-0 border border-blue-200 dark:border-blue-900/40">
                    <ArrowDownLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-blue-700 dark:text-blue-400">{tx.lotId}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        Ref: {tx.transactionRef}
                      </span>
                      {scope === 'ALL_NETWORK' && tx.recyclerName && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold">
                          {tx.recyclerName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                      {getCategoryLabel(tx.materialCategory, language)} • {tx.weight} kg @ ₹{tx.ratePerKg}/kg
                    </p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {new Date(tx.timestamp).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-base font-black text-emerald-700 dark:text-emerald-400">
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 inline-block mt-0.5">
                      {tx.paymentMethod === 'CASH'
                        ? (language === 'hi' ? '💵 नकद भुगतान' : language === 'mr' ? '💵 रोख देयक' : '💵 Cash Paid')
                        : (language === 'hi' ? '📱 लेजर वाउचर' : language === 'mr' ? '📱 लेजर व्हाउचर' : '📱 Ledger Voucher')} ✓
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenCertificate(tx.lotId)}
                    disabled={loadingCertLotId === tx.lotId}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                    title="View Green Recycling Certificate"
                  >
                    {loadingCertLotId === tx.lotId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Award className="w-3.5 h-3.5" />
                    )}
                    <span>{t.greenCertTitle}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GREEN CERTIFICATE MODAL WITH FULL HANDOVER PROPS */}
      {selectedLotForCert && (
        <GreenCertificateModal
          lot={selectedLotForCert}
          handover={selectedHandoverForCert || undefined}
          onClose={() => {
            setSelectedLotForCert(null);
            setSelectedHandoverForCert(null);
          }}
        />
      )}
    </div>
  );
};
