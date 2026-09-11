import React, { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, Calendar, CheckCircle2, ArrowDownLeft, Wallet, Receipt, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { PaymentLedgerEntry } from '../../types';
import { getCategoryLabel } from '../../i18n/translations';

export const EarningsLedgerPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<PaymentLedgerEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLedger = async () => {
      setLoading(true);
      try {
        const res = await api.getCollectorLedger();
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

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Wallet className="w-7 h-7 text-emerald-400" />
              <span>{t.earningsLedger}</span>
            </h1>
            <p className="text-xs text-slate-300 font-medium mt-1">
              {language === 'hi' ? 'कलेक्टर खाता पासबुक: स्क्रैप बिक्री, कांटे के वजन एवं भुगतान का पारदर्शी रिकॉर्ड' : language === 'mr' ? 'खाते पासबुक: ई-कचरा विक्री, प्रत्यक्ष वजन व पारदर्शक पावती नोंद' : 'Collector Passbook: Verified scale weight, transaction vouchers and payment ledger'}
            </p>
          </div>

          <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-black self-start sm:self-auto shadow">
            {language === 'hi' ? 'लेजर वाउचर रिकॉर्ड' : language === 'mr' ? 'लेजर पावती नोंद' : 'Double-Entry Ledger Vouchers'}
          </div>
        </div>

        {/* 4 Financial Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shadow-inner">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t.todaysEarnings}
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
              ₹{(summary?.todayEarnings || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shadow-inner">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'hi' ? 'साप्ताहिक कमाई (7 दिन)' : language === 'mr' ? 'साप्ताहिक कमाई (7 दिवस)' : 'Weekly Earnings (7 Days)'}
            </span>
            <div className="text-2xl font-black text-white mt-1 font-mono">
              ₹{(summary?.weeklyEarnings || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shadow-inner">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'hi' ? 'मासिक कमाई (30 दिन)' : language === 'mr' ? 'मासिक कमाई (30 दिवस)' : 'Monthly Earnings (30 Days)'}
            </span>
            <div className="text-2xl font-black text-white mt-1 font-mono">
              ₹{(summary?.monthlyEarnings || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shadow-inner">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'hi' ? 'कुल आजीवन कमाई' : language === 'mr' ? 'एकूण कमाई' : 'Total Earnings'}
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
              ₹{(summary?.totalEarnings || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Cash vs UPI Breakdown */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800 text-xs font-bold">
          <span className="text-slate-400">{language === 'hi' ? 'निपटान माध्यम:' : language === 'mr' ? 'पेमेंट पद्धत:' : 'Settlement Mode:'}</span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
            {language === 'hi' ? '💵 नकद भुगतान:' : language === 'mr' ? '💵 रोख रक्कम:' : '💵 Cash:'} ₹{(summary?.cashEarnings || 0).toLocaleString('en-IN')}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-blue-950 text-blue-300 border border-blue-800 font-mono">
            {language === 'hi' ? '📱 डिजिटल यूपीआई:' : language === 'mr' ? '📱 यूपीआय:' : '📱 UPI:'} ₹{(summary?.upiEarnings || 0).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Analytical Unit Economics Comparison Box */}
        {(summary as any)?.unitEconomics && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-950 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  {language === 'hi' ? '💡 बिचौलिए के मुकाबले अतिरिक्त आय:' : language === 'mr' ? '💡 दलालापेक्षा अतिरिक्त उत्पन्न:' : '💡 Net Uplift vs Informal Middleman:'}
                </span>
                <span className="text-[9px] font-mono font-bold text-amber-300/90 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-800/60">
                  {language === 'hi' ? 'प्रारंभिक आर्थिक मॉडल' : language === 'mr' ? 'आर्थिक मॉडेल' : 'Benchmark Model • Field Validation Required'}
                </span>
              </div>
              <p className="text-slate-300 mt-0.5">
                {language === 'hi'
                  ? 'पारंपरिक स्थानीय बिचौलिए के मुकाबले डिजिटल कांटे एवं सीधे रीसाइक्लर भाव से अनुमानित बचत व मुनाफा।'
                  : language === 'mr'
                  ? 'स्थानिक मध्यस्थांपेक्षा थेट कारखान्याशी जोडल्यामुळे व अचूक काट्यामुळे अतिरिक्त नफा.'
                  : 'Estimated fair-price premium and weighbridge accuracy gain versus informal middlemen.'}
              </p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <span className="text-[11px] text-emerald-400 font-bold block">{language === 'hi' ? 'सीधा संभावित मुनाफा:' : language === 'mr' ? 'थेट संभाव्य नफा:' : 'Direct Platform Margin Uplift:'}</span>
              <span className="text-xl font-black text-emerald-300 font-mono">
                +₹{(summary as any).unitEconomics.netUpliftAmount.toLocaleString('en-IN')} (+{(summary as any).unitEconomics.netUpliftPercentage}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Transaction History Vouchers */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Receipt className="w-4 h-4 text-emerald-400" />
          <span>{language === 'hi' ? 'सत्यापित भुगतान रसीदें' : language === 'mr' ? 'सत्यापित पावत्या' : 'Digital Handover Vouchers'}</span>
        </h2>

        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
            {language === 'hi' ? 'लेजर बहीखाता लोड हो रहा है...' : language === 'mr' ? 'लेजर लोड होत आहे...' : 'Loading transaction vouchers...'}
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
            {language === 'hi' ? 'अभी तक कोई पूर्ण भुगतान दर्ज नहीं है।' : language === 'mr' ? 'कोणतीही नोंद उपलब्ध नाही.' : 'No completed settlement vouchers yet.'}
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-slate-900 border-2 border-slate-800 hover:border-emerald-600/50 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-800 shrink-0">
                  <ArrowDownLeft className="w-6 h-6" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-base text-white">{getCategoryLabel(tx.materialCategory, language)} {language === 'hi' ? 'बिक्री' : language === 'mr' ? 'विक्री' : 'Sale'}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      {language === 'hi' ? 'वाउचर:' : language === 'mr' ? 'पावती:' : 'Voucher:'} {tx.transactionRef}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {language === 'hi' ? 'क्रेता:' : language === 'mr' ? 'खरेदीदार:' : 'Buyer:'} <b className="text-white">{tx.recyclerName}</b> • {tx.weight} {language === 'hi' ? 'किग्रा' : language === 'mr' ? 'किलो' : 'kg'} @ ₹{tx.ratePerKg}/{language === 'hi' ? 'किग्रा' : language === 'mr' ? 'किलो' : 'kg'}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    {new Date(tx.timestamp).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="text-right self-end sm:self-center">
                <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  +₹{tx.amount.toLocaleString('en-IN')}
                </div>
                <div className="flex flex-col items-end gap-1 mt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-300 bg-emerald-950 px-2.5 py-1 rounded-xl border border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{tx.paymentMethod === 'CASH' ? (language === 'hi' ? '💵 नकद भुगतान' : language === 'mr' ? '💵 रोख पेमेंट' : '💵 Cash') : (language === 'hi' ? '📱 लेजर वाउचर' : language === 'mr' ? '📱 लेजर पावती' : '📱 Ledger Voucher')} ✓</span>
                  </span>
                  <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    {tx.recordType === 'DIGITAL_LEDGER_VOUCHER' ? (language === 'hi' ? 'बहीखाता वाउचर' : language === 'mr' ? 'लेजर पावती' : 'Digital Ledger Voucher') : (tx.recordType || 'DIGITAL_LEDGER_VOUCHER')}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
