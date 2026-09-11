import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, MapPin, Phone, Calendar, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { RecyclerProfile, RecyclerAuthStatus } from '../../types';
import { getCategoryLabel } from '../../i18n/translations';

export const RecyclerVerificationPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [recyclers, setRecyclers] = useState<RecyclerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    recycler: RecyclerProfile | null;
    targetStatus: RecyclerAuthStatus;
  }>({
    isOpen: false,
    recycler: null,
    targetStatus: 'SUSPENDED'
  });

  const fetchRecyclers = async () => {
    setLoading(true);
    try {
      const res = await api.getRecyclers({ onlyAuthorized: 'false' });
      if (res.success) {
        setRecyclers(res.recyclers);
      }
    } catch (e) {
      console.warn('Recyclers fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecyclers();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: RecyclerAuthStatus) => {
    try {
      const res = await api.updateRecyclerAuthStatus(id, newStatus);
      if (res.success) {
        showToast(t.recyclerStatusUpdated, 'success');
        fetchRecyclers();
      }
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    } finally {
      setConfirmModal({ isOpen: false, recycler: null, targetStatus: 'SUSPENDED' });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <span>🛡️</span>
          <span>{t.adminRecyclerTitle}</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          {t.adminRecyclerSubtitle}
        </p>
      </div>

      {/* Recyclers List */}
      <div className="space-y-4">
        {recyclers.map((rec) => {
          const isAuth = rec.authorizationStatus === 'AUTHORIZED';
          const isPending = rec.authorizationStatus === 'PENDING_VERIFICATION';
          const isSuspended = rec.authorizationStatus === 'SUSPENDED';

          return (
            <div
              key={rec.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-white">{rec.facilityName}</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                        isAuth
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : isPending
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-red-950 text-red-300 border-red-800'
                      }`}
                    >
                      {isAuth
                        ? (language === 'hi' ? 'अधिकृत' : language === 'mr' ? 'अधिकृत' : 'Authorized')
                        : isPending
                        ? (language === 'hi' ? 'सत्यापन लंबित' : language === 'mr' ? 'पडताळणी प्रलंबित' : 'Pending Verification')
                        : (language === 'hi' ? 'निलंबित' : language === 'mr' ? 'निलंबित' : 'Suspended')}
                    </span>
                  </div>

                  <p className="font-mono text-slate-400 mt-1">
                    {language === 'hi' ? 'पंजीकरण संख्या' : language === 'mr' ? 'नोंदणी क्रमांक' : 'Registration No'}: <b className="text-slate-200">{rec.registrationNo}</b>
                  </p>
                  <p className="text-slate-400 mt-0.5">
                    {language === 'hi' ? 'स्थान' : language === 'mr' ? 'स्थान' : 'Location'}: {rec.address} ({rec.district}, {rec.state})
                  </p>
                  <p className="text-slate-400 mt-0.5">
                    {language === 'hi' ? 'संपर्क' : language === 'mr' ? 'संपर्क' : 'Contact'}: {rec.contactPerson} ({rec.contactPhone})
                  </p>
                </div>

                <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 self-start sm:self-center">
                  <span className="text-[10px] text-slate-500 block">
                    {language === 'hi' ? 'वैधता' : language === 'mr' ? 'वैधता' : 'Valid Until'}
                  </span>
                  <span className="font-mono font-bold text-slate-200">{rec.authValidUntil}</span>
                </div>
              </div>

              {/* Accepted Materials */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800">
                <span className="font-bold text-slate-400 mr-1">
                  {language === 'hi' ? 'अनुमोदित श्रेणियां:' : language === 'mr' ? 'मान्यताप्राप्त श्रेणी:' : 'Authorized Categories:'}
                </span>
                {rec.acceptedMaterials.map((mat) => (
                  <span key={mat} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold">
                    {getCategoryLabel(mat, language)}
                  </span>
                ))}
              </div>

              {/* Admin Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                {!isAuth && (
                  <button
                    onClick={() => setConfirmModal({ isOpen: true, recycler: rec, targetStatus: 'AUTHORIZED' })}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.approveLicenseBtn}</span>
                  </button>
                )}

                {isAuth && (
                  <button
                    onClick={() => setConfirmModal({ isOpen: true, recycler: rec, targetStatus: 'SUSPENDED' })}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{t.suspendLicenseBtn}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && confirmModal.recycler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-black text-white">
                {confirmModal.targetStatus === 'SUSPENDED' ? t.confirmSuspendTitle : t.confirmApproveTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              {confirmModal.targetStatus === 'SUSPENDED'
                ? t.confirmSuspendDesc
                : `${confirmModal.recycler.facilityName} (${confirmModal.recycler.registrationNo})`}
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, recycler: null, targetStatus: 'SUSPENDED' })}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(confirmModal.recycler!.id, confirmModal.targetStatus)}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow ${
                  confirmModal.targetStatus === 'SUSPENDED'
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
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

