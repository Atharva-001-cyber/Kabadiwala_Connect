import React, { useState } from 'react';
import { User, MapPin, Phone, Globe, Award, ShieldCheck, LogOut, Edit3, Check, X, ShieldAlert, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { formatUserDisplayName, formatLocationString } from '../../i18n/translations';

export const CollectorProfilePage: React.FC = () => {
  const { user, collectorProfile, logout, updateProfile } = useAuth();
  const { language, t } = useLanguage();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(collectorProfile?.name || user?.name || '');
  const [editDistrict, setEditDistrict] = useState(collectorProfile?.district || 'Lucknow');
  const [editUpiId, setEditUpiId] = useState(collectorProfile?.upiId || '');
  const [isSaving, setIsSaving] = useState(false);

  const rawName = collectorProfile?.name || user?.name;
  const displayName = formatUserDisplayName(rawName, 'COLLECTOR', language);
  const isKycVerified = collectorProfile?.kycStatus === 'KYC_VERIFIED';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await updateProfile({
      name: editName.trim() || undefined,
      district: editDistrict.trim() || undefined,
      upiId: editUpiId.trim() || undefined
    });
    setIsSaving(false);

    if (res.success) {
      showToast(language === 'hi' ? 'प्रोफ़ाइल अपडेट हो गई!' : language === 'mr' ? 'प्रोफाइल अपडेट झाली!' : 'Profile updated successfully!', 'success');
      setIsEditing(false);
    } else {
      showToast(res.message || (language === 'hi' ? 'अपडेट विफल रहा' : language === 'mr' ? 'अपडेट अयशस्वी' : 'Update failed'), 'error');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-16">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Profile Card Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white text-2xl font-black shadow-lg">
              📦
            </div>
            <div>
              <h1 className="text-xl font-black text-white">{displayName}</h1>
              <p className="text-xs font-mono text-emerald-400 font-bold">
                {language === 'hi' ? 'आईडी:' : language === 'mr' ? 'आयडी:' : 'ID:'} {collectorProfile?.id || user?.id || 'COL-2026-01'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {isKycVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    {language === 'hi' ? 'सत्यापित ई-कलेक्टर' : language === 'mr' ? 'प्रमाणित ई-संकलक' : 'Verified E-Collector'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 text-[10px] font-bold border border-amber-800">
                    <ShieldAlert className="w-3 h-3 text-amber-400" />
                    {language === 'hi' ? 'KYC प्रतीक्षारत (डेमो)' : language === 'mr' ? 'KYC प्रलंबित (डेमो)' : 'KYC Pending (Demo)'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (!isEditing) {
                setEditName(collectorProfile?.name || user?.name || '');
                setEditDistrict(collectorProfile?.district || 'Lucknow');
                setEditUpiId(collectorProfile?.upiId || '');
              }
              setIsEditing(!isEditing);
            }}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title={isEditing ? 'Cancel' : 'Edit Profile'}
          >
            {isEditing ? <X className="w-4 h-4 text-red-400" /> : <Edit3 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        {/* Truthful KYC & Verification Transparency Banner */}
        <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
          isKycVerified
            ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-300'
            : 'bg-amber-950/30 border-amber-800/80 text-amber-300'
        }`}>
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              {isKycVerified ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-amber-400" />}
              <span>
                {isKycVerified
                  ? (language === 'hi' ? 'आधार / UIDAI सत्यापन (मास्क किया हुआ)' : language === 'mr' ? 'आधार पडताळणी (मास्क केलेले)' : 'UIDAI Aadhaar Verification (Masked)')
                  : (language === 'hi' ? 'ई-केवाईसी स्थिति (सत्यनिष्ठ रिपोर्ट)' : language === 'mr' ? 'ई-केवायसी स्थिती' : 'e-KYC Status (Truthful Report)')}
              </span>
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">
              {isKycVerified ? (collectorProfile?.kycMaskedId || 'XXXX-XXXX-8921') : 'PENDING'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isKycVerified
              ? (language === 'hi' ? 'पहचान सत्यापित। कोई भी कच्चा आधार नंबर डेटाबेस में असुरक्षित रूप से स्टोर नहीं किया जाता।' : language === 'mr' ? 'ओळख सत्यापित. कच्चा आधार क्रमांक कधीही उघड केला जात नाही.' : 'Identity verified with masked UIDAI token. Raw Aadhaar numbers are never stored.')
              : (language === 'hi' ? 'सरकारी API क्रेडेंशियल कॉन्फ़िगर नहीं हैं। डेमो मोड में वास्तविक आधार डेटा का ढोंग नहीं किया जाता।' : language === 'mr' ? 'सरकारी API कॉन्फिगर नाही. डेमो मोडमध्ये खोटी पडताळणी केली जात नाही.' : 'Official UIDAI verification API is not configured in this sandbox environment. Truthful KYC_PENDING status is displayed.')}
          </p>
        </div>

        {/* Edit Form or Info Grid */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider">
              {language === 'hi' ? 'प्रोफ़ाइल विवरण संपादित करें' : language === 'mr' ? 'प्रोफाइल तपशील संपादित करा' : 'Edit Profile Details'}
            </h3>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                {language === 'hi' ? 'पूरा नाम' : language === 'mr' ? 'पूर्ण नाव' : 'Full Name'}
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Atharva Ranjan Soni"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                {language === 'hi' ? 'जिला / कार्य क्षेत्र' : language === 'mr' ? 'जिल्हा / कार्यक्षेत्र' : 'District / Operating Area'}
              </label>
              <input
                type="text"
                value={editDistrict}
                onChange={(e) => setEditDistrict(e.target.value)}
                placeholder="e.g. Lucknow, Kanpur, Pune"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                {language === 'hi' ? 'UPI आईडी (भुगतान हेतु)' : language === 'mr' ? 'UPI आयडी (पेमेंटसाठी)' : 'UPI ID (For Digital Ledger Voucher)'}
              </label>
              <input
                type="text"
                value={editUpiId}
                onChange={(e) => setEditUpiId(e.target.value)}
                placeholder="e.g. user@oksbi or 9876543210@paytm"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {language === 'hi' ? '⚠️ आंतरिक लेजर वाउचर में उपयोग होता है। बैंक गेटवे कनेक्ट न होने तक यह सैंडबॉक्स मोड में रहता है।' : language === 'mr' ? '⚠️ अंतर्गत लेजर व्हाउचरसाठी वापरले जाते. गेटवे कनेक्ट होईपर्यंत हे सँडबॉक्स मोडमध्ये आहे.' : '⚠️ Used for internal ledger vouchers. Operates in sandbox mode until payment gateway is connected.'}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : (language === 'hi' ? 'सहेजें' : language === 'mr' ? 'जतन करा' : 'Save Changes')}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
              >
                {language === 'hi' ? 'रद्द करें' : language === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'hi' ? 'मोबाइल नंबर:' : language === 'mr' ? 'मोबाईल नंबर:' : 'Mobile Number:'}</span>
              </span>
              <span className="font-mono font-bold text-white">+91 {collectorProfile?.phone || user?.phone || ''}</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'hi' ? 'कार्य क्षेत्र:' : language === 'mr' ? 'कार्यक्षेत्र:' : 'Operating Area:'}</span>
              </span>
              <span className="font-bold text-white">
                {formatLocationString(collectorProfile?.district || 'Lucknow', collectorProfile?.state || 'Uttar Pradesh', language)}
              </span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'hi' ? 'UPI आईडी:' : language === 'mr' ? 'UPI आयडी:' : 'UPI ID:'}</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {collectorProfile?.upiId || (language === 'hi' ? 'कॉन्फ़िगर नहीं' : language === 'mr' ? 'कॉन्फिगर नाही' : 'Not Configured')}
              </span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'hi' ? 'कुल एकत्र ई-कचरा:' : language === 'mr' ? 'एकूण जमा ई-कचरा:' : 'Total Collected Scrap:'}</span>
              </span>
              <span className="font-bold text-emerald-400 text-sm">
                {collectorProfile?.totalWeightCollected ?? 0} {language === 'hi' ? 'किग्रा' : language === 'mr' ? 'किलो' : 'kg'}
              </span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'hi' ? 'पसंदीदा भाषा:' : language === 'mr' ? 'पसंतीची भाषा:' : 'Preferred Language:'}</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-emerald-400 border border-slate-800">
                {language === 'hi' ? 'हिंदी (HI)' : language === 'mr' ? 'मराठी (MR)' : 'English (EN)'}
              </span>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full py-3 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{t.logout || (language === 'hi' ? 'खाता से बाहर निकलें' : language === 'mr' ? 'खात्यातून बाहेर पडा' : 'Logout')}</span>
        </button>
      </div>
    </div>
  );
};
