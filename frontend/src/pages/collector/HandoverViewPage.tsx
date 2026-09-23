import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  Award, 
  ArrowLeft, 
  MapPin, 
  Scale, 
  AlertTriangle,
  Receipt,
  FileCheck,
  RefreshCw,
  Lock,
  Check,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Lot, HandoverRecord, Pickup } from '../../types';
import { GreenCertificateModal } from '../../components/common/GreenCertificateModal';
import { getStatusLabel, getCategoryLabel } from '../../i18n/translations';
import { WhatsAppReceiptButton } from '../../components/common/WhatsAppReceiptButton';

export const HandoverViewPage: React.FC = () => {
  const { lotId } = useParams<{ lotId: string }>();
  const { language, t } = useLanguage();
  const { showToast } = useToast();

  const [lot, setLot] = useState<Lot | null>(null);
  const [handover, setHandover] = useState<HandoverRecord | null>(null);
  const [pickup, setPickup] = useState<Pickup | null>(null);
  const [showCertModal, setShowCertModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Verification form state for pending handovers
  const [inputWeight, setInputWeight] = useState<string>('98.6');
  const [inputOtp, setInputOtp] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI'>('UPI');
  const [verifying, setVerifying] = useState<boolean>(false);

  const fetchLotData = async () => {
    if (!lotId) return;
    setLoading(true);
    try {
      const res = await api.getLotById(lotId);
      if (res.success) {
        setLot(res.lot);
        setPickup(res.pickup || null);
        setHandover(res.handover || null);
        if (res.lot.approxWeight) {
          setInputWeight(String(res.lot.approxWeight === 100 ? 98.6 : res.lot.approxWeight));
        }
        if (res.lot.handoverOtp) {
          setInputOtp(res.lot.handoverOtp);
        }
      }
    } catch (err) {
      console.warn('Failed to load handover details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLotData();
  }, [lotId]);

  const handleVerifyScaleWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lot) return;
    setVerifying(true);
    try {
      const weightVal = parseFloat(inputWeight) || lot.approxWeight;
      const res = await api.verifyHandover({
        lotId: lot.id,
        actualWeight: weightVal,
        handoverOtp: inputOtp || lot.handoverOtp,
        paymentMethod
      });

      if (res.success) {
        showToast(
          language === 'hi'
            ? 'भौतिक कांटा वजन एवं OTP सत्यापन सफल! डिजिटल हैंडओवर रसीद जनरेट हो गई।'
            : language === 'mr'
            ? 'काटा वजन व OTP पडताळणी यशस्वी! डिजिटल पावती तयार झाली.'
            : 'Scale weight & OTP verified! Digital handover receipt generated successfully.',
          'success'
        );
        fetchLotData();
      }
    } catch (err: any) {
      showToast(err.message || 'Verification failed. Check OTP and scale entry.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400">{language === 'hi' ? 'हैंडओवर पर्ची लोड हो रही है...' : language === 'mr' ? 'हँडओव्हर पावती लोड होत आहे...' : 'Loading handover details...'}</div>;
  }

  if (!lot) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-slate-400">{language === 'hi' ? 'लॉट विवरण नहीं मिला।' : language === 'mr' ? 'लॉट तपशील आढळला नाही.' : 'Lot not found.'}</p>
        <Link to="/collector/requests" className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold">
          {language === 'hi' ? 'वापस जाएं' : language === 'mr' ? 'मागे जा' : 'Go Back'}
        </Link>
      </div>
    );
  }

  const isCompleted = Boolean(handover) || lot.status === 'RECEIVED' || lot.status === 'RECYCLED' || lot.status === 'RECYCLER_RECEIVED' || lot.status === 'SORTED' || lot.status === 'PROCESSING' || lot.status === 'RECOVERED';
  const weightDiff = handover ? Number((handover.actualWeight - lot.approxWeight).toFixed(1)) : 0;
  const isGpsReal = handover?.locationSource === 'DEVICE_GPS';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/collector/requests"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'hi' ? 'लॉट सूची पर वापस' : language === 'mr' ? 'लॉट यादीवर परत' : 'Back to Requests'}</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{lot.id}</span>
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
            isCompleted
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
          }`}>
            {isCompleted ? (language === 'hi' ? '✅ हैंडओवर संपन्न' : language === 'mr' ? '✅ हँडओव्हर पूर्ण' : '✅ Handover Completed') : (language === 'hi' ? '🔄 हैंडओवर जारी' : language === 'mr' ? '🔄 हँडओव्हर सुरु' : '🔄 Handover in Progress')}
          </span>
        </div>
      </div>

      {/* Main Card Container */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
        
        {/* Header Section */}
        <div className="text-center space-y-2 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border-2 shadow-sm ${
            isCompleted
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
              : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800'
          }`}>
            {isCompleted ? <Scale className="w-8 h-8" /> : <RefreshCw className="w-8 h-8 animate-spin" />}
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {isCompleted
              ? (language === 'hi' ? '✅ डिजिटल हैंडओवर रसीद' : language === 'mr' ? '✅ डिजिटल हँडओव्हर पावती' : '✅ Digital Handover Receipt')
              : (language === 'hi' ? '🔄 हैंडओवर प्रक्रिया जारी' : language === 'mr' ? '🔄 हँडओव्हर प्रक्रिया सुरु' : '🔄 Handover in Progress')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isCompleted
              ? (language === 'hi' ? 'ई-कचरा भौतिक हस्तांतरण एवं इलेक्ट्रॉनिक कांटा सत्यापन पर्ची' : language === 'mr' ? 'ई-कचरा हस्तांतरण व प्रत्यक्ष वजन पावती' : 'E-Waste Physical Handover & Calibrated Weighbridge Slip')
              : (language === 'hi' ? 'भौतिक स्क्रैप कांटा वजन एवं OTP सत्यापन प्रतीक्षित' : language === 'mr' ? 'प्रत्यक्ष वजन व OTP पडताळणी प्रलंबित' : 'Physical Scrap Scale Weighment & OTP Verification Pending')}
          </p>
        </div>

        {/* OTP DISPLAY CARD */}
        <div className={`border-2 rounded-3xl p-6 text-center space-y-2 shadow-sm ${
          isCompleted
            ? 'bg-emerald-50/50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
            : 'bg-gradient-to-br from-amber-50 via-orange-50 to-white dark:from-amber-950/40 dark:via-slate-950 dark:to-amber-950/40 border-amber-400'
        }`}>
          <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
            {t.handoverOtp} {isCompleted && '✓ (VERIFIED)'}
          </span>
          <div className="font-mono text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-widest py-2">
            {lot.handoverOtp || handover?.handoverOtp || '1066'}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            {isCompleted
              ? (language === 'hi' ? '✓ यह 4-अंकीय कोड भौतिक कांटा वजन के दौरान ड्राइवर द्वारा सत्यापित किया जा चुका है।' : language === 'mr' ? '✓ हा ४-अंकी कोड ड्रायव्हरद्वारे पडताळला गेला आहे.' : '✓ This 4-digit code was verified by the driver during physical weighment.')
              : (language === 'hi' ? '⚠️ यह 4-अंकीय कोड रीसाइक्लर के ड्राइवर को केवल कांटे पर वजन होने के बाद ही बताएं।' : language === 'mr' ? '⚠️ हा ४-अंकी कोड काट्यावर वजन पूर्ण झाल्यानंतरच ड्रायव्हरला सांगा.' : '⚠️ Share this 4-digit code with the vehicle driver only after physical scale weighment.')}
          </p>
        </div>

        {/* WEIGHBRIDGE & SCALE COMPARISON BOX */}
        <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 text-xs space-y-3 shadow-inner">
          <h4 className="font-black text-slate-900 dark:text-white text-sm flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
              <span>{language === 'hi' ? 'इलेक्ट्रॉनिक कांटा वजन सत्यापन' : language === 'mr' ? 'काट्यावरील प्रत्यक्ष वजन तपासणी' : 'Calibrated Scale Weighment Verification'}</span>
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
              isCompleted ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}>
              {isCompleted ? (language === 'hi' ? 'सत्यापित' : language === 'mr' ? 'पडताळलेले' : 'Verified') : (language === 'hi' ? 'प्रतीक्षित' : language === 'mr' ? 'प्रलंबित' : 'Pending Verification')}
            </span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-slate-500 text-[11px] font-bold block">{language === 'hi' ? 'सामग्री स्थिति:' : language === 'mr' ? 'साहित्य स्थिती:' : 'Condition:'}</span>
              <span className="font-black text-amber-600 dark:text-amber-300 text-sm mt-0.5 block">
                {lot.condition === 'INTACT'
                  ? (language === 'hi' ? '🟢 साबुत (Intact)' : language === 'mr' ? '🟢 अखंड (Intact)' : '🟢 Intact')
                  : lot.condition === 'DAMAGED'
                  ? (language === 'hi' ? '🟡 क्षतिग्रस्त (Damaged)' : language === 'mr' ? '🟡 खराब (Damaged)' : '🟡 Damaged')
                  : (language === 'hi' ? '🟠 खुला हुआ (Dismantled)' : language === 'mr' ? '🟠 वेगळे केलेले (Dismantled)' : '🟠 Dismantled')}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-slate-500 text-[11px] font-bold block">{language === 'hi' ? 'कलेक्टर अनुमानित वजन:' : language === 'mr' ? 'अंदाजे वजन:' : 'Collector Estimated Weight:'}</span>
              <span className="font-black text-slate-900 dark:text-white text-lg mt-0.5 block">{lot.approxWeight} kg</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-slate-500 text-[11px] font-bold block">{language === 'hi' ? 'कांटे का वास्तविक वजन:' : language === 'mr' ? 'काट्यावरील प्रत्यक्ष वजन:' : 'Verified Scale Weight:'}</span>
              <span className={`font-black text-lg mt-0.5 block ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {handover ? `${handover.actualWeight} kg` : (language === 'hi' ? 'सत्यापन बाकी ⏳' : language === 'mr' ? 'तपासणी बाकी ⏳' : 'Pending Verification ⏳')}
              </span>
            </div>
          </div>

          {handover && (
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] flex items-center justify-between shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 font-medium">{language === 'hi' ? 'वजन अंतर:' : language === 'mr' ? 'वजन फरक:' : 'Tare Variance:'}</span>
              <span className={`font-black ${weightDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {weightDiff > 0 ? `+${weightDiff} kg` : `${weightDiff} kg`} ({handover.weightDiffPercentage}%)
              </span>
            </div>
          )}
        </div>

        {/* IN-LINE SCALE & OTP VERIFICATION FORM (IF NOT YET VERIFIED) */}
        {!isCompleted && (
          <form onSubmit={handleVerifyScaleWeight} className="bg-amber-50/70 dark:bg-amber-950/20 border-2 border-amber-400 dark:border-amber-600/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                {language === 'hi' ? 'कांटा वजन एवं OTP सत्यापन पूर्ण करें' : language === 'mr' ? 'वजन व OTP पडताळणी पूर्ण करा' : 'Verify Scale Weight & OTP to Complete Handover'}
              </h3>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {language === 'hi'
                ? 'ड्राइवर द्वारा इलेक्ट्रॉनिक कांटे (Scale) पर मापा गया वास्तविक वजन और 4-अंकीय OTP दर्ज करके हैंडओवर संपन्न करें:'
                : language === 'mr'
                ? 'काट्यावर मोजलेले प्रत्यक्ष वजन आणि ४-अंकी OTP टाका:'
                : 'Enter the actual measured weighbridge reading and 4-digit OTP to complete physical handover:'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'hi' ? 'कांटे का वास्तविक वजन (kg):' : language === 'mr' ? 'काट्यावरील प्रत्यक्ष वजन (kg):' : 'Verified Weight (kg):'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={inputWeight}
                  onChange={(e) => setInputWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'hi' ? '4-अंकीय हैंडओवर OTP:' : language === 'mr' ? '४-अंकी OTP:' : 'Handover OTP:'}
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={inputOtp}
                  onChange={(e) => setInputOtp(e.target.value)}
                  placeholder="e.g. 1066"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 tracking-widest text-center"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'hi' ? 'भुगतान विधि:' : language === 'mr' ? 'पेमेंट पद्धत:' : 'Payment Method:'}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="UPI">Instant UPI Direct Transfer</option>
                  <option value="CASH">Cash Settlement Voucher</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {verifying ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === 'hi' ? 'कांटा वजन एवं OTP सत्यापित करें (हैंडओवर पूर्ण)' : language === 'mr' ? 'काटा वजन व OTP पडताळा (हँडओव्हर पूर्ण)' : 'Verify Scale Weight & OTP (Complete Handover)'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* DRIVER & VEHICLE DETAILS */}
        {pickup && (
          <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-xs space-y-2.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800/80 pb-2">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Truck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>{language === 'hi' ? 'पिकअप वाहन एवं अधिकृत ड्राइवर' : language === 'mr' ? 'वाहन व अधिकृत ड्रायव्हर' : 'Collection Vehicle & Driver'}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-black dark:border-purple-800">
                {getStatusLabel(pickup.status, language)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px]">{language === 'hi' ? 'ड्राइवर का नाम:' : language === 'mr' ? 'ड्रायव्हरचे नाव:' : 'Driver Name:'}</span>
                <span className="font-black text-slate-900 dark:text-white text-sm">{pickup.driverName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">{language === 'hi' ? 'वाहन नंबर:' : language === 'mr' ? 'वाहन क्रमांक:' : 'Vehicle No:'}</span>
                <span className="font-black text-slate-900 dark:text-white font-mono text-sm">{pickup.vehicleNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">{language === 'hi' ? 'तारीख:' : language === 'mr' ? 'तारीख:' : 'Date:'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{pickup.scheduledDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">{language === 'hi' ? 'समय:' : language === 'mr' ? 'वेळ:' : 'Time:'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{pickup.timeSlot}</span>
              </div>
            </div>
          </div>
        )}

        {/* GPS TELEMETRY & LOCATION PROVENANCE */}
        {handover && (
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{language === 'hi' ? 'हैंडओवर स्थान:' : language === 'mr' ? 'हँडओव्हर ठिकाण:' : 'Geotagged Handover Location:'}</span>
              </span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                isGpsReal
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              }`}>
                {isGpsReal ? (language === 'hi' ? '🟢 डिवाइस GPS' : language === 'mr' ? '🟢 डिव्हाइस GPS' : '🟢 Device GPS') : (language === 'hi' ? '📍 जिला सेंट्रोइड' : language === 'mr' ? '📍 जिल्हा केंद्र' : '📍 District Centroid')}
              </span>
            </div>
            <p className="text-slate-800 dark:text-slate-200 font-medium">
              {handover.gpsLocation ? `${handover.gpsLocation.lat.toFixed(4)}° N, ${handover.gpsLocation.lng.toFixed(4)}° E` : `${lot.locationDistrict}, ${lot.locationState}`}
              {handover.deviceAccuracyMeters && ` (${language === 'hi' ? 'सटीकता' : language === 'mr' ? 'अचूकता' : 'Accuracy'}: ±${handover.deviceAccuracyMeters}m)`}
            </p>
          </div>
        )}

        {/* SETTLED PAYMENT VOUCHER BOX */}
        {handover && (
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white dark:from-slate-950 dark:to-emerald-950/40 p-4 rounded-2xl border border-emerald-300 dark:border-emerald-500/50 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                  {language === 'hi' ? 'भुगतान वाउचर:' : language === 'mr' ? 'पेमेंट पावती:' : 'Settled Ledger Voucher:'}
                </span>
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  ₹{handover.finalPaymentAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-black rounded-xl dark:border-emerald-800 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {handover.paymentMethod} {language === 'hi' ? 'चुकता' : language === 'mr' ? 'पूर्ण' : 'Settled'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {language === 'hi' ? '* यह प्लेटफॉर्म डिजिटल लेजर वाउचर है। नकद/यूपीआई भुगतान की पुष्टि भौतिक रूप से कांटा बिंदु पर की गई है।' : language === 'mr' ? '* ही डिजिटल लेजर पावती आहे. रोख/यूपीआय पेमेंटची प्रत्यक्ष पुष्टी झाली आहे.' : '* Digital ledger voucher. Settlement verified at physical weighment point.'}
            </p>
          </div>
        )}

        {/* RECEIPT SLIP & GREEN CERTIFICATE ACTIONS */}
        {isCompleted ? (
          <div className="space-y-3 pt-2">
            <WhatsAppReceiptButton 
              lot={lot} 
              handover={handover} 
              className="w-full min-h-[52px]"
            />

            <button
              type="button"
              onClick={() => setShowCertModal(true)}
              className="w-full min-h-[56px] py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Award className="w-5 h-5" />
              <span>{language === 'hi' ? 'ग्रीन रीसाइक्लिंग सर्टिफिकेट देखें (Form-6 Digital Proof)' : language === 'mr' ? 'ग्रीन रीसायकलिंग प्रमाणपत्र पहा (Form-6 Digital Proof)' : 'View Green Recycling Certificate (Form-6 Proof)'}</span>
            </button>
          </div>
        ) : (
          <div className="bg-slate-100 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>{language === 'hi' ? 'रसीद एवं ग्रीन प्रमाणपत्र ताला लगा है' : language === 'mr' ? 'पावती व प्रमाणपत्र लॉक आहे' : 'Receipt & Recycling Certificate Locked'}</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {language === 'hi'
                ? 'कांटा वजन एवं OTP सत्यापन पूर्ण होने के बाद ही व्हाट्सएप रसीद एवं ग्रीन रीसाइक्लिंग सर्टिफिकेट अनलॉक होगा।'
                : language === 'mr'
                ? 'वजन व OTP पडताळणी पूर्ण झाल्यानंतरच पावती व प्रमाणपत्र अनलॉक होईल.'
                : 'WhatsApp Receipt & Green Recycling Certificate will unlock automatically once physical weighment and OTP verification are completed.'}
            </p>
          </div>
        )}
      </div>

      {showCertModal && (
        <GreenCertificateModal
          lot={lot}
          handover={handover || undefined}
          onClose={() => setShowCertModal(false)}
        />
      )}
    </div>
  );
};
