import React, { useState, useEffect } from 'react';
import { Scale, CheckCircle2, AlertCircle, MessageSquare, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Dispute, DisputeStatus } from '../../types';
import { getStatusLabel } from '../../i18n/translations';

export const DisputeResolutionPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [adminNote, setAdminNote] = useState<string>('');
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await api.getDisputes();
      if (res.success) {
        setDisputes(res.disputes);
      }
    } catch (e) {
      console.warn('Disputes fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (id: string, status: DisputeStatus) => {
    try {
      const res = await api.updateDisputeStatus(id, {
        status,
        adminNotes: adminNote || 'Admin reviewed scale records and electronic signatures.',
        resolution: 'Verified against certified electronic scale weights and signed digital voucher.'
      });
      if (res.success) {
        showToast(
          language === 'hi'
            ? `विवाद '${status}' के रूप में सफलतापूर्वक निस्तारित किया गया!`
            : language === 'mr'
            ? `वाद '${status}' म्हणून यशस्वीरीत्या निकाली काढण्यात आला!`
            : `Dispute successfully marked as '${status}'!`,
          'success'
        );
        setSelectedDisputeId(null);
        setAdminNote('');
        fetchDisputes();
      }
    } catch (err: any) {
      showToast(err.message || 'Resolve failed', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <span>⚖️</span>
          <span>{language === 'hi' ? 'विवाद समाधान केंद्र' : language === 'mr' ? 'तक्रार निवारण केंद्र' : 'Dispute Management & Mediation'}</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          {language === 'hi'
            ? 'कलेक्टर एवं रीसाइक्लर के बीच वजन या भुगतान संबंधी शिकायतों की निष्पक्ष मध्यस्थता'
            : language === 'mr'
            ? 'संकलक व रिसायकलर यांच्यातील वजन किंवा देयके संबंधी तक्रारींची निष्पक्ष मध्यस्थी'
            : 'Fair mediation and resolution of scale weight or payment disputes between collectors and recyclers'}
        </p>
      </div>

      {/* Disputes List */}
      <div className="space-y-4">
        {disputes.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs font-medium">
            {language === 'hi' ? 'कोई सक्रिय विवाद दर्ज नहीं है।' : language === 'mr' ? 'कोणताही सक्रिय वाद नोंदवलेला नाही.' : 'No active disputes filed.'}
          </div>
        ) : (
          disputes.map((d) => (
            <div
              key={d.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-purple-400">{d.lotId}</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    d.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {getStatusLabel(d.status, language)}
                  </span>
                  <span className="text-slate-400">
                    {language === 'hi' ? 'दर्जकर्ता' : language === 'mr' ? 'नोंदवणारा' : 'Raised by'}: <b className="text-white">{d.raisedByName}</b> ({d.raisedByRole})
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(d.createdAt).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <h4 className="font-bold text-white text-sm">{d.reason}</h4>
                <p className="text-slate-300">{d.details}</p>
              </div>

              {d.adminNotes && (
                <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/60 text-emerald-200">
                  <span className="font-bold block text-[10px] uppercase">
                    {language === 'hi' ? 'प्रशासनिक टिप्पणी:' : language === 'mr' ? 'प्रशासकीय टीप:' : 'Admin Resolution Notes:'}
                  </span>
                  <p className="mt-0.5">{d.adminNotes}</p>
                  {d.resolution && (
                    <p className="text-emerald-300 font-bold mt-1">
                      {language === 'hi' ? 'निर्णय' : language === 'mr' ? 'निर्णय' : 'Resolution'}: {d.resolution}
                    </p>
                  )}
                </div>
              )}

              {d.status !== 'RESOLVED' && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <input
                    type="text"
                    placeholder={
                      language === 'hi'
                        ? 'मध्यस्थता निर्णय या टिप्पणी दर्ज करें...'
                        : language === 'mr'
                        ? 'मध्यस्थी निर्णय किंवा टीप प्रविष्ट करा...'
                        : 'Enter mediation notes or settlement rationale...'
                    }
                    value={selectedDisputeId === d.id ? adminNote : ''}
                    onChange={(e) => {
                      setSelectedDisputeId(d.id);
                      setAdminNote(e.target.value);
                    }}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleResolve(d.id, 'RESOLVED')}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1 shadow transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'समाधान दर्ज करें' : language === 'mr' ? 'निवारण नोंदवा' : 'Resolve Dispute'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

