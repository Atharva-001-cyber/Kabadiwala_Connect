import React from 'react';
import { X, Award, ShieldCheck, Printer, CheckCircle2, AlertCircle } from 'lucide-react';
import { Lot, HandoverRecord } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { getCategoryLabel } from '../../i18n/translations';

interface GreenCertificateModalProps {
  lot: Lot;
  handover?: HandoverRecord;
  onClose: () => void;
}

export const GreenCertificateModal: React.FC<GreenCertificateModalProps> = ({ lot, handover, onClose }) => {
  const { t, language } = useLanguage();

  const printCertificate = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border-4 border-emerald-600 my-8">
        {/* Header Bar */}
        <div className="bg-emerald-950 text-white p-4 flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base sm:text-lg tracking-wide">{t.certHeaderTitle}</h3>
              <p className="text-xs text-emerald-300">{t.certHeaderSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-emerald-900 hover:bg-emerald-800 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Regulatory Disclaimer Banner */}
        <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="font-semibold">
            {t.certRegulatoryNotice}
          </span>
        </div>

        {/* Certificate Body */}
        <div className="p-6 sm:p-8 space-y-6 bg-slate-50 border-b border-slate-200">
          {/* Emblem & Title */}
          <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 mb-2 font-black text-xl">
              ♻️
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {t.certChainOfCustodyTitle}
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              {t.appTitle || 'Kabadiwala Connect'} • {language === 'hi' ? 'स्मार्ट इंडिया हैकथॉन 2026 (समस्या विवरण #229)' : language === 'mr' ? 'स्मार्ट इंडिया हॅकाथॉन 2026 (समस्या विवरण #229)' : 'Smart India Hackathon 2026 (PS #229)'}
            </p>
            <div className="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-900 text-xs font-mono font-bold rounded-full border border-emerald-300">
              {t.certAuditRecordId}: KC-EWR-2026-{lot.id.slice(-6)}
            </div>
            <div className="mt-2.5 p-2 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-800 font-semibold text-center">
              ⚠️ {t.certRegulatoryNotice}
            </div>
          </div>

          {/* Certificate Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-slate-500 text-xs block">{t.certDigitalLotId}</span>
              <span className="font-bold text-slate-900 font-mono">{lot.id}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-slate-500 text-xs block">{t.certMaterialCategory}</span>
              <span className="font-bold text-emerald-700">{getCategoryLabel(lot.materialCategory, language)}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-slate-500 text-xs block">{t.certScaleWeight}</span>
              <span className="font-bold text-slate-900">{handover?.actualWeight || lot.approxWeight} kg</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-slate-500 text-xs block">{t.certCollector}</span>
              <span className="font-semibold text-slate-900">{lot.collectorName}</span>
              <span className="text-[10px] text-slate-500 block">{lot.locationDistrict}, {lot.locationState}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-slate-500 text-xs block">{t.certAuthorizedRecycler}</span>
              <span className="font-semibold text-slate-900">GreenEarth E-Waste Solutions</span>
              <span className="text-[10px] text-emerald-700 block">Reg: CPCB/EWR/UP/LKO/8812</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-slate-500 text-xs block">{t.certSettledAmount}</span>
              <span className="font-bold text-emerald-800">₹{(lot.finalSaleValue || lot.quotedPrice || 0).toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-slate-500 block">
                {(handover?.paymentMethod || 'CASH') === 'CASH'
                  ? (language === 'hi' ? '💵 नकद भुगतान' : language === 'mr' ? '💵 रोख देयक' : '💵 Cash')
                  : '📱 UPI'}
              </span>
            </div>
          </div>

          {/* Environmental Impact Declaration */}
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 space-y-1">
              <p className="font-bold">{t.certFormalDeclaration}</p>
              <p>
                {t.certDeclarationText}
              </p>
            </div>
          </div>

          {/* Signatures & Seal */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center font-mono text-[10px] text-center text-slate-600 border border-slate-300">
                [QR VALID]
              </div>
              <div>
                <p className="font-semibold text-slate-800">{t.certVerifiedTimestamp}</p>
                <p className="font-mono text-[10px]">{new Date(lot.updatedAt || lot.createdAt).toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1 text-emerald-700 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.certPlatformSeal}</span>
              </div>
              <p className="text-[10px] text-slate-500">
                {t.appTitle || 'Kabadiwala Connect'} {language === 'hi' ? 'SIH-2026 ऑडिट ट्रेल' : language === 'mr' ? 'SIH-2026 ऑडिट ट्रेल' : 'SIH-2026 Audit Trail'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-xl"
          >
            {t.closeBtn}
          </button>
          <button
            onClick={printCertificate}
            className="px-5 py-2 text-sm font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl shadow flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            {t.certPrintPdf}
          </button>
        </div>
      </div>
    </div>
  );
};

