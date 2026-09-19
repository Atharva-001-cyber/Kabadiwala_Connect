import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Truck, Calendar, Clock, User, Phone, CheckCircle2, ArrowRight, MapPin, Navigation, PackageCheck, Sparkles, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { onPlatformSync } from '../../services/realtime';
import { Lot, Pickup } from '../../types';
import { getStatusLabel, getCategoryLabel, formatUserDisplayName } from '../../i18n/translations';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export const PickupManagementPage: React.FC = () => {
  const { user, recyclerProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const queryLotId = searchParams.get('lotId');
  const activeRecId = recyclerProfile?.id || user?.id || 'rec_abc_1';

  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [lots, setLots] = useState<Lot[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLotId, setSelectedLotId] = useState<string>(queryLotId || '');
  const [scheduledDate, setScheduledDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState<string>('11:00 AM - 01:00 PM');
  const [driverName, setDriverName] = useState<string>('Mohan Singh');
  const [driverContact, setDriverContact] = useState<string>('9876501234');
  const [vehicleNumber, setVehicleNumber] = useState<string>('UP32-EW-9021');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'SCHEDULED' | 'COMPLETED'>('ALL');

  const fetchData = async () => {
    try {
      const [lotsRes, pickupsRes] = await Promise.all([
        api.getLots(),
        api.getPickups({ recyclerId: activeRecId })
      ]);
      if (lotsRes.success) {
        setLots(lotsRes.lots);
        const accepted = lotsRes.lots.filter(l => 
          (l.status === 'ACCEPTED' || (l.selectedRecyclerId === activeRecId && l.selectedOfferId && l.status !== 'PICKUP_SCHEDULED' && l.status !== 'RECEIVED' && l.status !== 'RECYCLED' && l.status !== 'PROCESSING')) &&
          (!l.selectedRecyclerId || l.selectedRecyclerId === activeRecId)
        );
        if (queryLotId && lotsRes.lots.some(l => l.id === queryLotId)) {
          setSelectedLotId(queryLotId);
        } else if (accepted.length > 0 && !selectedLotId) {
          setSelectedLotId(accepted[0].id);
        }
      }
      if (pickupsRes.success) {
        setPickups(pickupsRes.pickups);
      }
    } catch (e) {
      console.warn('Pickup fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Real-time sync on Supabase events
    const unsubscribeSync = onPlatformSync(() => {
      fetchData();
    });

    const interval = setInterval(() => {
      fetchData();
    }, 8000);

    return () => {
      unsubscribeSync();
      clearInterval(interval);
    };
  }, [activeRecId]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotId) {
      showToast(
        language === 'hi' ? 'कृपया लॉट चुनें' : language === 'mr' ? 'कृपया लॉट निवडा' : 'Please select an accepted lot',
        'warning'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.schedulePickup({
        lotId: selectedLotId,
        scheduledDate,
        timeSlot,
        driverName,
        driverContact,
        vehicleNumber
      });
      if (res.success) {
        showToast(
          language === 'hi'
            ? 'पिकअप सफलतापूर्वक शेड्यूल हो गया है!'
            : language === 'mr'
            ? 'पिकअप यशस्वीरीत्या नियोजित केले आहे!'
            : 'Pickup successfully scheduled!',
          'success'
        );
        setSelectedLotId('');
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Schedule failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const acceptedLots = lots.filter(l => 
    (l.status === 'ACCEPTED' || (l.selectedRecyclerId === activeRecId && l.selectedOfferId && l.status !== 'PICKUP_SCHEDULED' && l.status !== 'RECEIVED' && l.status !== 'RECYCLED' && l.status !== 'PROCESSING')) &&
    (!l.selectedRecyclerId || l.selectedRecyclerId === activeRecId)
  );

  const displayedPickups = pickups.filter(p => {
    if (feedFilter === 'SCHEDULED') return p.status === 'SCHEDULED';
    if (feedFilter === 'COMPLETED') return p.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 text-purple-700 dark:text-purple-300 text-xs font-black uppercase tracking-wider mb-2">
              <Truck className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'डोरस्टेप लॉजिस्टिक्स बेड़ा' : language === 'mr' ? 'डोअरस्टेप लॉजिस्टिक्स ताफा' : 'Doorstep Logistics Fleet'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{language === 'hi' ? 'पिकअप एवं लॉजिस्टिक्स प्रबंधन' : language === 'mr' ? 'पिकअप व लॉजिस्टिक्स व्यवस्थापन' : 'Pickup & Logistics Management'}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {language === 'hi'
                ? 'स्वीकृत लॉट के लिए डोरस्टेप वाहन, समय स्लॉट एवं ड्राइवर असाइन करें'
                : language === 'mr'
                ? 'मान्य लॉटसाठी डोअरस्टेप वाहन, वेळ स्लॉट व चालक नियुक्त करा'
                : 'Assign doorstep collection vehicle, driver, and time slot for accepted lots'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
              <span>{pickups.filter(p => p.status === 'SCHEDULED').length} {language === 'hi' || language === 'mr' ? 'सक्रिय पिकअप' : 'Active Pickups'}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span>{language === 'hi' ? 'नया पिकअप शेड्यूल करें' : language === 'mr' ? 'नवीन पिकअप नियोजित करा' : 'Schedule Doorstep Pickup'}</span>
          </h2>

          {acceptedLots.length === 0 ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                <span>💡</span>
                <span>
                  {language === 'hi'
                    ? 'कोई नया स्वीकृत लॉट लंबित नहीं है'
                    : language === 'mr'
                    ? 'कोणताही नवीन मान्य लॉट प्रलंबित नाही'
                    : 'No pending accepted deals right now'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'hi'
                  ? 'सभी स्वीकृत लॉट का पिकअप शेड्यूल हो चुका है। नए लॉट्स पर अपनी प्रतिस्पर्धी बोलियां लगाने के लिए इनकमिंग रिक्वेस्ट्स देखें।'
                  : language === 'mr'
                  ? 'सर्व मान्य लॉटचे पिकअप नियोजित झाले आहे. नवीन लॉट्सवर बोली लावण्यासाठी इनकमिंग विनंत्या पहा.'
                  : 'All accepted consignments have been scheduled. Check incoming lots to quote competitive bids.'}
              </p>
              <Link
                to="/recycler/requests"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1.5 transition-all"
              >
                <span>{language === 'hi' ? 'इनकमिंग लॉट्स देखें' : language === 'mr' ? 'इनकमिंग लॉट्स पहा' : 'Browse Incoming Requests'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSchedule} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {language === 'hi' ? 'स्वीकृत लॉट चुनें:' : language === 'mr' ? 'मान्य लॉट निवडा:' : 'Select Accepted Lot:'}
                </label>
                <select
                  value={selectedLotId}
                  onChange={(e) => setSelectedLotId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-purple-500/60 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  required
                >
                  {acceptedLots.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.id} - {getCategoryLabel(l.materialCategory, language)} ({l.approxWeight} {language === 'hi' || language === 'mr' ? 'किग्रा' : 'kg'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {language === 'hi' ? 'पिकअप तारीख:' : language === 'mr' ? 'पिकअप दिनांक:' : 'Pickup Date:'}
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {language === 'hi' ? 'समय स्लॉट:' : language === 'mr' ? 'वेळ स्लॉट:' : 'Time Slot:'}
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                >
                  <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                  <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                  <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                  <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {language === 'hi' ? 'ड्राइवर का नाम:' : language === 'mr' ? 'चालकाचे नाव:' : 'Driver Name:'}
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {language === 'hi' ? 'मोबाइल नंबर:' : language === 'mr' ? 'मोबाईल नंबर:' : 'Mobile Number:'}
                  </label>
                  <input
                    type="tel"
                    value={driverContact}
                    onChange={(e) => setDriverContact(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    {language === 'hi' ? 'वाहन नंबर:' : language === 'mr' ? 'वाहन क्रमांक:' : 'Vehicle Number:'}
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || acceptedLots.length === 0}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <Truck className="w-4 h-4" />
                <span>
                  {submitting
                    ? t.loadingText
                    : language === 'hi'
                    ? 'पिकअप कन्फर्म करें'
                    : language === 'mr'
                    ? 'पिकअप निश्चित करा'
                    : 'Confirm & Schedule Pickup'}
                </span>
              </button>
            </form>
          )}
        </div>

        {/* Active Scheduled Pickups Feed */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{language === 'hi' ? 'शेड्यूल किए गए पिकअप' : language === 'mr' ? 'नियोजित केलेले पिकअप' : 'Scheduled Pickups Feed'}</span>
              <span className="text-xs font-mono text-purple-600 dark:text-purple-400">({displayedPickups.length})</span>
            </h2>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setFeedFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition-all ${feedFilter === 'ALL' ? 'bg-white dark:bg-purple-600 text-purple-700 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                {language === 'hi' ? 'सभी' : language === 'mr' ? 'सर्व' : 'All'} ({pickups.length})
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter('SCHEDULED')}
                className={`px-3 py-1 rounded-lg transition-all ${feedFilter === 'SCHEDULED' ? 'bg-white dark:bg-purple-600 text-purple-700 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                {language === 'hi' ? 'शेड्यूल किए गए' : language === 'mr' ? 'नियोजित' : 'Scheduled'} ({pickups.filter(p => p.status === 'SCHEDULED').length})
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter('COMPLETED')}
                className={`px-3 py-1 rounded-lg transition-all ${feedFilter === 'COMPLETED' ? 'bg-white dark:bg-purple-600 text-purple-700 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                {language === 'hi' || language === 'mr' ? 'पूर्ण' : 'Completed'} ({pickups.filter(p => p.status === 'COMPLETED').length})
              </button>
            </div>
          </div>

          {loading ? (
            <LoadingSkeleton variant="card" count={3} />
          ) : displayedPickups.length === 0 ? (
            <EmptyState
              title={language === 'hi' ? 'कोई पिकअप निर्धारित नहीं है' : language === 'mr' ? 'कोणताही पिकअप नियोजित नाही' : 'No Scheduled Pickups Found'}
              description={language === 'hi' ? 'वर्तमान में इस फ़िल्टर के तहत कोई पिकअप नहीं है। स्वीकृत लॉट का चयन करके नया पिकअप शेड्यूल करें।' : language === 'mr' ? 'सध्या कोणताही पिकअप नियोजित नाही.' : 'No doorstep pickups currently match this filter. Select an accepted lot from the schedule form to dispatch a vehicle.'}
              icon={<Truck className="w-8 h-8 text-purple-600 dark:text-purple-400" />}
            />
          ) : (
            displayedPickups.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-400/80 rounded-2xl p-4.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold border shrink-0 ${
                    p.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                      : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800'
                  }`}>
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-purple-600 dark:text-purple-400">{p.lotId}</span>
                      <StatusBadge status={p.status} size="sm" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                      {language === 'hi' ? 'तारीख' : language === 'mr' ? 'दिनांक' : 'Date'}: {p.scheduledDate} ({p.timeSlot})
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {language === 'hi' ? 'ड्राइवर' : language === 'mr' ? 'चालक' : 'Driver'}: <b className="text-slate-800 dark:text-slate-200">{formatUserDisplayName(p.driverName, 'DRIVER', language)}</b> ({p.driverContact}) • {language === 'hi' ? 'वाहन' : language === 'mr' ? 'वाहन' : 'Vehicle'}: <b className="font-mono text-slate-700 dark:text-slate-300">{p.vehicleNumber}</b>
                    </p>
                  </div>
                </div>

                <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">ID: {p.id}</span>
                  {p.status === 'SCHEDULED' ? (
                    <Link
                      to={`/recycler/handover?lotId=${p.lotId}`}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1 transition-all"
                      title="Proceed to Digital Scale Weighment & Handover Verification"
                    >
                      <span>{language === 'hi' ? 'कांटा और हैंडओवर' : language === 'mr' ? 'काटा व हँडओव्हर' : 'Scale & Handover'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      to={`/collector/handover/${p.lotId}`}
                      className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{language === 'hi' ? 'हैंडओवर पर्ची' : language === 'mr' ? 'पावती पहा' : 'Handover Slip'}</span>
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
