import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Truck, Calendar, Clock, User, Phone, CheckCircle2, ArrowRight, MapPin, Navigation, PackageCheck, Sparkles, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { onPlatformSync } from '../../services/realtime';
import { Lot, Pickup } from '../../types';
import { getStatusLabel, getCategoryLabel } from '../../i18n/translations';

export const PickupManagementPage: React.FC = () => {
  const { user, recyclerProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const queryLotId = searchParams.get('lotId');
  const activeRecId = recyclerProfile?.id || user?.id || 'rec_abc_1';

  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [lots, setLots] = useState<Lot[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
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
        api.getLots({ limit: '100' }),
        api.getPickups({ recyclerId: activeRecId, limit: '50' })
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
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <span>🚚</span>
          <span>{language === 'hi' ? 'पिकअप एवं लॉजिस्टिक्स प्रबंधन' : language === 'mr' ? 'पिकअप व लॉजिस्टिक्स व्यवस्थापन' : 'Pickup & Logistics Management'}</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          {language === 'hi'
            ? 'स्वीकृत लॉट के लिए डोरस्टेप वाहन, समय स्लॉट एवं ड्राइवर असाइन करें'
            : language === 'mr'
            ? 'मान्य लॉटसाठी डोअरस्टेप वाहन, वेळ स्लॉट व चालक नियुक्त करा'
            : 'Assign doorstep collection vehicle, driver, and time slot for accepted lots'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule Form */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>{language === 'hi' ? 'नया पिकअप शेड्यूल करें' : language === 'mr' ? 'नवीन पिकअप नियोजित करा' : 'Schedule Doorstep Pickup'}</span>
          </h2>

          {acceptedLots.length === 0 ? (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <span>💡</span>
                <span>
                  {language === 'hi'
                    ? 'कोई नया स्वीकृत लॉट लंबित नहीं है'
                    : language === 'mr'
                    ? 'कोणताही नवीन मान्य लॉट प्रलंबित नाही'
                    : 'No pending accepted deals right now'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {language === 'hi'
                  ? 'सभी स्वीकृत लॉट का पिकअप शेड्यूल हो चुका है। नए लॉट्स पर अपनी प्रतिस्पर्धी बोलियां लगाने के लिए इनकमिंग रिक्वेस्ट्स देखें।'
                  : language === 'mr'
                  ? 'सर्व मान्य लॉटचे पिकअप नियोजित झाले आहे. नवीन लॉट्सवर बोली लावण्यासाठी इनकमिंग विनंत्या पहा.'
                  : 'All accepted consignments have been scheduled. Check incoming lots to quote competitive bids.'}
              </p>
              <Link
                to="/recycler/requests"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-black shadow flex items-center justify-center gap-1.5 transition-all"
              >
                <span>{language === 'hi' ? 'इनकमिंग लॉट्स देखें' : language === 'mr' ? 'इनकमिंग लॉट्स पहा' : 'Browse Incoming Requests'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSchedule} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  {language === 'hi' ? 'स्वीकृत लॉट चुनें:' : language === 'mr' ? 'मान्य लॉट निवडा:' : 'Select Accepted Lot:'}
                </label>
                <select
                  value={selectedLotId}
                  onChange={(e) => setSelectedLotId(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-purple-500/60 rounded-xl text-white font-bold focus:outline-none focus:border-purple-400"
                  required
                >
                  {acceptedLots.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.id} - {getCategoryLabel(l.materialCategory, language)} ({l.approxWeight} kg)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  {language === 'hi' ? 'पिकअप तारीख:' : language === 'mr' ? 'पिकअप दिनांक:' : 'Pickup Date:'}
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  {language === 'hi' ? 'समय स्लॉट:' : language === 'mr' ? 'वेळ स्लॉट:' : 'Time Slot:'}
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500"
                >
                  <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                  <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                  <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                  <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  {language === 'hi' ? 'ड्राइवर का नाम:' : language === 'mr' ? 'चालकाचे नाव:' : 'Driver Name:'}
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    {language === 'hi' ? 'मोबाइल नंबर:' : language === 'mr' ? 'मोबाईल नंबर:' : 'Mobile Number:'}
                  </label>
                  <input
                    type="tel"
                    value={driverContact}
                    onChange={(e) => setDriverContact(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    {language === 'hi' ? 'वाहन नंबर:' : language === 'mr' ? 'वाहन क्रमांक:' : 'Vehicle Number:'}
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold font-mono focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || acceptedLots.length === 0}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all"
              >
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
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-purple-400" />
              <span>{language === 'hi' ? 'शेड्यूल किए गए पिकअप' : language === 'mr' ? 'नियोजित केलेले पिकअप' : 'Scheduled Pickups Feed'}</span>
              <span className="text-xs font-mono text-purple-400">({displayedPickups.length})</span>
            </h2>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setFeedFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all ${feedFilter === 'ALL' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                All ({pickups.length})
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter('SCHEDULED')}
                className={`px-2.5 py-1 rounded-lg transition-all ${feedFilter === 'SCHEDULED' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Scheduled ({pickups.filter(p => p.status === 'SCHEDULED').length})
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter('COMPLETED')}
                className={`px-2.5 py-1 rounded-lg transition-all ${feedFilter === 'COMPLETED' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Completed ({pickups.filter(p => p.status === 'COMPLETED').length})
              </button>
            </div>
          </div>

          {displayedPickups.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 font-medium text-xs">
              {language === 'hi' ? 'अभी कोई पिकअप शेड्यूल नहीं है।' : language === 'mr' ? 'सध्या कोणताही पिकअप नियोजित नाही.' : 'No pickups currently match this filter.'}
            </div>
          ) : (
            displayedPickups.map((p) => (
              <div
                key={p.id}
                className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4.5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold border shrink-0 ${
                    p.status === 'COMPLETED'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-purple-950 text-purple-400 border-purple-800'
                  }`}>
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-400">{p.lotId}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        p.status === 'COMPLETED'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-purple-950 text-purple-300 border-purple-800'
                      }`}>
                        {getStatusLabel(p.status, language)}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white mt-0.5">
                      {language === 'hi' ? 'तारीख' : language === 'mr' ? 'दिनांक' : 'Date'}: {p.scheduledDate} ({p.timeSlot})
                    </p>
                    <p className="text-xs text-slate-400">
                      {language === 'hi' ? 'ड्राइवर' : language === 'mr' ? 'चालक' : 'Driver'}: <b className="text-slate-200">{p.driverName}</b> ({p.driverContact}) • {language === 'hi' ? 'वाहन' : language === 'mr' ? 'वाहन' : 'Vehicle'}: <b className="font-mono text-slate-300">{p.vehicleNumber}</b>
                    </p>
                  </div>
                </div>

                <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <span className="text-[10px] text-slate-500 font-mono block">ID: {p.id}</span>
                  {p.status === 'SCHEDULED' ? (
                    <Link
                      to={`/recycler/handover?lotId=${p.lotId}`}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl text-xs font-black shadow flex items-center gap-1 transition-all"
                      title="Proceed to Digital Scale Weighment & Handover Verification"
                    >
                      <span>{language === 'hi' ? 'कांटा और हैंडओवर' : language === 'mr' ? 'काटा व हँडओव्हर' : 'Scale & Handover'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      to={`/collector/handover/${p.lotId}`}
                      className="px-3 py-1 bg-emerald-950/80 border border-emerald-700 text-emerald-300 hover:bg-emerald-900 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
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
