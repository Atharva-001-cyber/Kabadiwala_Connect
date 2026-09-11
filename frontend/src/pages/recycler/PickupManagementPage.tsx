import React, { useState, useEffect } from 'react';
import { Truck, Calendar, Clock, User, Phone, CheckCircle2, ArrowRight, MapPin, Navigation } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Lot, Pickup } from '../../types';
import { getStatusLabel, getCategoryLabel } from '../../i18n/translations';

export const PickupManagementPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [lots, setLots] = useState<Lot[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState<string>('11:00 AM - 01:00 PM');
  const [driverName, setDriverName] = useState<string>('Mohan Singh');
  const [driverContact, setDriverContact] = useState<string>('9876501234');
  const [vehicleNumber, setVehicleNumber] = useState<string>('UP32-EW-9021');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      const [lotsRes, pickupsRes] = await Promise.all([
        api.getLots(),
        api.getPickups()
      ]);
      if (lotsRes.success) {
        setLots(lotsRes.lots);
        const accepted = lotsRes.lots.filter(l => l.status === 'ACCEPTED');
        if (accepted.length > 0 && !selectedLotId) {
          setSelectedLotId(accepted[0].id);
        }
      }
      if (pickupsRes.success) setPickups(pickupsRes.pickups);
    } catch (e) {
      console.warn('Pickup fetch failed:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Schedule failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const acceptedLots = lots.filter(l => l.status === 'ACCEPTED');

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

          <form onSubmit={handleSchedule} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">
                {language === 'hi' ? 'स्वीकृत लॉट चुनें:' : language === 'mr' ? 'मान्य लॉट निवडा:' : 'Select Accepted Lot:'}
              </label>
              <select
                value={selectedLotId}
                onChange={(e) => setSelectedLotId(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500"
                required
              >
                {acceptedLots.length === 0 ? (
                  <option value="">
                    {language === 'hi' ? 'कोई नया स्वीकृत लॉट नहीं है' : language === 'mr' ? 'कोणताही नवीन मान्य लॉट नाही' : 'No pending accepted lots'}
                  </option>
                ) : (
                  acceptedLots.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.id} - {getCategoryLabel(l.materialCategory, language)} ({l.approxWeight} kg)
                    </option>
                  ))
                )}
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
        </div>

        {/* Active Scheduled Pickups Feed */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
            {language === 'hi' ? 'शेड्यूल किए गए पिकअप' : language === 'mr' ? 'नियोजित केलेले पिकअप' : 'Scheduled Pickups Feed'}
          </h2>

          {pickups.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 font-medium text-xs">
              {language === 'hi' ? 'अभी कोई पिकअप शेड्यूल नहीं है।' : language === 'mr' ? 'सध्या कोणताही पिकअप नियोजित नाही.' : 'No pickups currently scheduled.'}
            </div>
          ) : (
            pickups.map((p) => (
              <div
                key={p.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-950 text-purple-400 flex items-center justify-center font-bold border border-purple-800 shrink-0">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-400">{p.lotId}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
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

                <div className="text-right self-end sm:self-center">
                  <span className="text-[10px] text-slate-500 font-mono block">ID: {p.id}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
