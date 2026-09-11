import React, { useState, useEffect } from 'react';
import { IndianRupee, ArrowDownLeft, CheckCircle2, Clock, Award, FileText, Download } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { PaymentLedgerEntry, Lot } from '../../types';
import { GreenCertificateModal } from '../../components/common/GreenCertificateModal';
import { getCategoryLabel } from '../../i18n/translations';

export const RecyclerTransactionsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<PaymentLedgerEntry[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLotForCert, setSelectedLotForCert] = useState<Lot | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const res = await api.getRecyclerTransactions();
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
    fetchTransactions();
  }, []);

  const handleOpenCertificate = async (lotId: string) => {
    try {
      const res = await api.getLotById(lotId);
      if (res.success) {
        setSelectedLotForCert(res.lot);
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
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <span>📜</span>
          <span>{language === 'hi' ? 'रीसाइक्लर वित्तीय बहीखाता एवं रसीदें' : language === 'mr' ? 'रिसायकलर वित्तीय नोंदवही व पावत्या' : 'Recycler Financial Ledger'}</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          {language === 'hi'
            ? 'कलेक्टरों को किए गए भुगतान का प्लेटफॉर्म बहीखाता एवं डिजिटल रीसाइक्लिंग प्रमाणपत्र'
            : language === 'mr'
            ? 'संकलकांना केलेल्या देयकांची नोंदवही व डिजिटल रिसायकलिंग प्रमाणपत्रे'
            : 'Collector payment ledger records and traceable digital recycling certificates'}
        </p>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mt-5 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              {language === 'hi' ? 'कुल भुगतान' : language === 'mr' ? 'एकूण वितरण' : 'Total Disbursed'}
            </span>
            <div className="text-xl font-black text-emerald-400 mt-1">
              ₹{(summary?.totalDisbursedINR || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              {language === 'hi' ? 'कुल प्राप्त वजन' : language === 'mr' ? 'एकूण प्राप्त वजन' : 'Total Weight Procured'}
            </span>
            <div className="text-xl font-black text-white mt-1">
              {summary?.totalWeightKg || 0} kg
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              {language === 'hi' ? 'निस्तारित लेनदेन' : language === 'mr' ? 'पूर्ण झालेले व्यवहार' : 'Settled Transactions'}
            </span>
            <div className="text-xl font-black text-blue-400 mt-1">
              {summary?.totalTransactions || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
          {language === 'hi' ? 'भुगतान बहीखाता इतिहास' : language === 'mr' ? 'पेमेंट नोंदवही इतिहास' : 'Payment Disbursal Ledger'}
        </h2>

        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center font-bold shrink-0">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-400">{tx.lotId}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      Ref: {tx.transactionRef}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white mt-0.5">
                    {getCategoryLabel(tx.materialCategory, language)} • {tx.weight} kg @ ₹{tx.ratePerKg}/kg
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(tx.timestamp).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="text-right">
                  <div className="text-base font-black text-emerald-400">
                    ₹{tx.amount.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {tx.paymentMethod === 'CASH'
                      ? (language === 'hi' ? '💵 नकद भुगतान' : language === 'mr' ? '💵 रोख देयक' : '💵 Cash Paid')
                      : (language === 'hi' ? '📱 लेजर वाउचर' : language === 'mr' ? '📱 लेजर व्हाउचर' : '📱 Ledger Voucher')} ✓
                  </span>
                </div>

                <button
                  onClick={() => handleOpenCertificate(tx.lotId)}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow transition-all"
                  title="View Green Recycling Certificate"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{t.greenCertTitle}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedLotForCert && (
        <GreenCertificateModal
          lot={selectedLotForCert}
          onClose={() => setSelectedLotForCert(null)}
        />
      )}
    </div>
  );
};
