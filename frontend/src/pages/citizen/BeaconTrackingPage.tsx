import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Radio, 
  MapPin, 
  Phone, 
  User, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  ShieldCheck, 
  Star, 
  Coins, 
  Truck, 
  Award,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { CitizenHeader } from '../../components/layout/CitizenHeader';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { CitizenBeacon } from '../../types';
import { formatUserDisplayName, formatAddressLocation } from '../../i18n/translations';

export const BeaconTrackingPage: React.FC = () => {
  const { beaconId } = useParams<{ beaconId: string }>();
  const { language } = useLanguage();
  const { showToast } = useToast();

  const [beacon, setBeacon] = useState<CitizenBeacon | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');
  const [ratedSuccess, setRatedSuccess] = useState<boolean>(false);

  useEffect(() => {
    const fetchBeaconData = async () => {
      if (!beaconId) return;
      setLoading(true);
      try {
        const res = await api.getBeaconById(beaconId);
        if (res.success && res.beacon) {
          setBeacon(res.beacon);
        }
      } catch (err) {
        console.warn('Failed to load beacon tracking:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBeaconData();

    // Poll every 3 seconds for real-time status updates from active collectors
    const interval = setInterval(fetchBeaconData, 3000);
    return () => clearInterval(interval);
  }, [beaconId]);

  const handleSimulateCollectorAccept = async () => {
    if (!beaconId) return;
    try {
      const colName = language === 'hi' ? 'रमेश कुमार (CPCB अधिकृत)' : language === 'mr' ? 'रमेश कुमार (CPCB अधिकृत)' : 'Ramesh Kumar (CPCB Verified)';
      const res = await api.acceptCitizenBeacon(
        beaconId,
        'col_1',
        colName,
        '9876543210'
      );
      if (res.success && res.beacon) {
        setBeacon(res.beacon);
        showToast(language === 'hi' ? '👷 अधिकृत कबाड़ीवाले रमेश कुमार ने आपका पिकअप स्वीकार किया!' : language === 'mr' ? '👷 अधिकृत संकलक रमेश कुमार यांनी आपला पिकअप स्वीकारला!' : '👷 Collector Ramesh Kumar accepted your pickup request!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to accept', 'error');
    }
  };

  const handleSimulateComplete = async () => {
    if (!beaconId || !beacon) return;
    try {
      const res = await api.updateBeaconStatus(
        beaconId,
        'COMPLETED',
        8.5,
        420,
        'CASH'
      );
      if (res.success && res.beacon) {
        setBeacon(res.beacon);
        showToast(language === 'hi' ? '💰 पिकअप संपन्न! आपके दरवाजे पर ₹420 नकद भुगतान किया गया!' : language === 'mr' ? '💰 पिकअप पूर्ण! आपल्या दारात ₹420 रोख जमा!' : '💰 Pickup Completed! ₹420 paid at doorstep!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to complete', 'error');
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beaconId) return;
    try {
      const res = await api.rateCitizenBeacon(beaconId, rating, feedback);
      if (res.success) {
        setRatedSuccess(true);
        showToast(language === 'hi' ? '⭐ प्रतिक्रिया के लिए धन्यवाद! आपका ग्रीन सर्टिफिकेट जारी किया गया।' : language === 'mr' ? '⭐ अभिप्रायाबद्दल धन्यवाद! आपले ग्रीन प्रमाणपत्र जारी केले.' : '⭐ Thank you for rating the collector!', 'success');
      }
    } catch {
      showToast('Failed to submit rating', 'error');
    }
  };

  if (loading && !beacon) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
        <CitizenHeader />
        <div className="flex-1 flex items-center justify-center py-20 text-slate-400 font-bold text-xs">
          {language === 'hi' ? 'बीकन स्थिति लोड हो रही है...' : language === 'mr' ? 'बीकन स्थिती लोड होत आहे...' : 'Loading Beacon Status...'}
        </div>
      </div>
    );
  }

  if (!beacon) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
        <CitizenHeader />
        <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-4">
          <p className="text-slate-500 dark:text-slate-400 font-bold">
            {language === 'hi' ? 'बीकन अनुरोध नहीं मिला।' : language === 'mr' ? 'बीकन विनंती सापडली नाही.' : 'Beacon request not found.'}
          </p>
          <Link to="/citizen" className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow">
            {language === 'hi' ? 'नागरिक पोर्टल पर जाएं' : language === 'mr' ? 'नागरिक पोर्टलवर जा' : 'Go to Citizen Disposal Portal'}
          </Link>
        </div>
      </div>
    );
  }

  const isAssigned = beacon.status === 'COLLECTOR_ASSIGNED' || beacon.status === 'IN_TRANSIT' || beacon.status === 'COMPLETED';
  const isCompleted = beacon.status === 'COMPLETED';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <CitizenHeader />

      <main className="w-full max-w-3xl mx-auto px-4 py-8 space-y-6 pb-20">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/citizen"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'hi' ? 'नया ई-कचरा पिकअप अनुरोध' : language === 'mr' ? 'नवीन ई-कचरा पिकअप विनंती' : 'New Disposal Request'}</span>
          </Link>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{beacon.id}</span>
        </div>

        {/* Main Beacon Journey Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border-2 border-emerald-200 dark:border-emerald-800 shadow-sm">
              <Radio className="w-8 h-8 animate-pulse text-emerald-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {language === 'hi' ? 'स्मार्ट ई-कचरा बीकन सीधा सफर' : language === 'mr' ? 'स्मार्ट ई-कचरा बीकन थेट प्रवास' : 'Smart E-Waste Beacon Live Journey'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {beacon.citizenName && <span className="font-bold text-slate-700 dark:text-slate-300">{formatUserDisplayName(beacon.citizenName, 'CITIZEN', language)} • </span>}
              {formatAddressLocation(beacon.address, language)} • {beacon.district === 'Lucknow' ? (language === 'hi' || language === 'mr' ? 'लखनऊ' : 'Lucknow') : beacon.district}
            </p>
          </div>

          {/* Real OTP Display Card */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white dark:from-emerald-950 dark:via-slate-950 dark:to-emerald-950 border-2 border-emerald-500 rounded-3xl p-6 text-center space-y-1 shadow-sm">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">
              {language === 'hi' ? 'पिकअप सुरक्षा ओटीपी (ओटीपी)' : language === 'mr' ? 'पिकअप सुरक्षा ओटीपी (ओटीपी)' : 'Pickup Security OTP'}
            </span>
            <div className="font-mono text-4xl sm:text-5xl font-black text-emerald-900 dark:text-white tracking-widest py-1">
              {beacon.pickupOtp}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              {language === 'hi' ? 'कांटे पर इलेक्ट्रॉनिक तौल के बाद यह 4-अंकीय कोड कबाड़ीवाले को बताएं।' : language === 'mr' ? 'काट्यावर अचूक वजनानंतर हा 4-अंकी कोड संकलकाला द्या.' : 'Share this 4-digit code with collector at doorstep after weighment.'}
            </p>
          </div>

          {/* Live Stepper Status */}
          <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              {language === 'hi' ? 'लाइव पिकअप प्रगति' : language === 'mr' ? 'थेट पिकअप प्रगती' : 'Live Collection Progress'}
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>1. {language === 'hi' ? `बीकन सिग्नल प्रसारित (${beacon.district === 'Lucknow' ? 'लखनऊ' : beacon.district} परिसर)` : language === 'mr' ? `बीकन सिग्नल प्रसारित (${beacon.district === 'Lucknow' ? 'लखनऊ' : beacon.district} परिसर)` : `Beacon Signal Broadcast Active (${beacon.district} Ward)`}</span>
              </div>

              <div className={`flex items-center gap-3 ${isAssigned ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-5 h-5 shrink-0 ${isAssigned ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>2. {language === 'hi' ? `संकलक नियुक्त (${beacon.assignedCollectorName || 'CPCB कबाड़ीवाले की प्रतीक्षा...'})` : language === 'mr' ? `संकलक नियुक्त (${beacon.assignedCollectorName || 'CPCB संकलकाची प्रतीक्षा...'})` : `Collector Assigned (${beacon.assignedCollectorName || 'Awaiting CPCB Collector Acceptance...'})`}</span>
              </div>

              <div className={`flex items-center gap-3 ${isCompleted ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-5 h-5 shrink-0 ${isCompleted ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>3. {language === 'hi' ? `कांटा तौल व नकद भुगतान (${isCompleted ? `₹${beacon.finalPaidAmount || 420}` : 'पिकअप लंबित'})` : language === 'mr' ? `काटा वजन व रोख मोबदला (${isCompleted ? `₹${beacon.finalPaidAmount || 420}` : 'पिकअप प्रलंबित'})` : `Weighment & Doorstep Cash Paid (${isCompleted ? `₹${beacon.finalPaidAmount || 420}` : 'Pending Pick Up'})`}</span>
              </div>
            </div>

            {!isAssigned && (
              <button
                type="button"
                onClick={handleSimulateCollectorAccept}
                className="w-full py-2.5 bg-emerald-700/80 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-xs border border-emerald-500/30"
              >
                ⚡ {language === 'hi' ? 'डेमो सिमुलेशन: संकलक स्वीकृति सिमुलेट करें' : language === 'mr' ? 'डेमो सिम्युलेशन: संकलक स्वीकृती सिम्युलेट करा' : 'Demo Simulation: Fast-track Collector Acceptance'}
              </button>
            )}

            {isAssigned && !isCompleted && (
              <button
                type="button"
                onClick={handleSimulateComplete}
                className="w-full py-2.5 bg-emerald-700/80 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-xs border border-emerald-500/30"
              >
                ⚡ {language === 'hi' ? 'डेमो सिमुलेशन: पिकअप पूर्ण व ₹420 जमा करें' : language === 'mr' ? 'डेमो सिम्युलेशन: पिकअप पूर्ण व ₹420 जमा करा' : 'Demo Simulation: Complete Pickup & Pay ₹420'}
              </button>
            )}
          </div>

          {/* Assigned Collector Card */}
          {isAssigned && (
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-500" />
                  <span>{language === 'hi' ? 'नियुक्त CPCB अधिकृत संकलक' : language === 'mr' ? 'नियुक्त CPCB अधिकृत संकलक' : 'Assigned CPCB Collector'}</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black">
                  {language === 'hi' ? 'CPCB अधिकृत' : language === 'mr' ? 'CPCB अधिकृत' : 'CPCB VERIFIED'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-sm">{beacon.assignedCollectorName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{beacon.assignedCollectorVehicle || (language === 'hi' ? 'CPCB पंजीकृत ई-रिक्शा' : 'CPCB Verified Transport')}</p>
                </div>

                <a
                  href={`tel:${beacon.assignedCollectorPhone || '9876543210'}`}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'कलेक्टर को कॉल करें' : language === 'mr' ? 'संकलकाला कॉल करा' : 'Call Collector'}</span>
                </a>
              </div>
            </div>
          )}

          {/* Post Pickup Rating Form */}
          {isCompleted && !ratedSuccess && (
            <form onSubmit={handleRatingSubmit} className="bg-emerald-50 dark:bg-emerald-950/60 p-5 rounded-2xl border-2 border-emerald-500/40 space-y-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {language === 'hi' ? 'सेवा रेटिंग एवं फीडबैक दर्ज करें' : language === 'mr' ? 'सेवा रेटिंग व अभिप्राय नोंदवा' : 'Rate Collector Service & Submit Feedback'}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-2xl transition-transform hover:scale-110"
                  >
                    {star <= rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={language === 'hi' ? 'उदा. सही समय पर पिकअप, विनम्र व्यवहार!' : language === 'mr' ? 'उदा. वेळेवर पिकअप, चांगले वर्तन!' : 'e.g. Prompt doorstep pickup, polite behavior!'}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-bold"
              />

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow active:scale-95 transition-all"
              >
                {language === 'hi' ? 'रेटिंग जमा करें व ग्रीन सर्टिफिकेट पाएं' : language === 'mr' ? 'रेटिंग सबमिट करा व ग्रीन प्रमाणपत्र मिळवा' : 'Submit Rating & Get Green Certificate'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
