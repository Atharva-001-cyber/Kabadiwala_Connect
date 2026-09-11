import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, MapPin, IndianRupee, Truck, Send, CheckCircle2, XCircle, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { SafeImage } from '../../components/common/SafeImage';
import { api } from '../../services/api';
import { Lot, Offer } from '../../types';
import { getStatusLabel, getCategoryLabel } from '../../i18n/translations';

export const IncomingRequestsPage: React.FC = () => {
  const { recyclerProfile } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [lots, setLots] = useState<Lot[]>([]);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [offeredRate, setOfferedRate] = useState<string>('95');
  const [pickupOffered, setPickupOffered] = useState<boolean>(true);
  const [etaHours, setEtaHours] = useState<string>('24');
  const [notes, setNotes] = useState<string>('Standard CPCB certified doorstep pickup with digital scale.');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isAuthorized = (recyclerProfile?.authorizationStatus || 'AUTHORIZED') === 'AUTHORIZED';

  const fetchLots = async () => {
    try {
      const res = await api.getLots();
      if (res.success) {
        setLots(res.lots);
      }
    } catch (e) {
      console.warn('Failed to load lots:', e);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  const handleOpenOfferModal = (lot: Lot) => {
    if (!isAuthorized) {
      showToast(
        recyclerProfile?.authorizationStatus === 'SUSPENDED'
          ? 'Quotation blocked: Facility license is SUSPENDED by regulatory authority.'
          : 'Quotation blocked: Facility authorization is PENDING SPCB verification.',
        'error'
      );
      return;
    }
    setSelectedLot(lot);
    const baseRates: Record<string, number> = {
      PCB: 95,
      BATTERY: 110,
      CABLE: 74,
      MOTOR: 65,
      CRT: 22,
      LCD: 48,
      MAGNET: 55,
      MIXED_PLASTIC: 18
    };
    setOfferedRate(String(baseRates[lot.materialCategory] || 80));
    setSuccessMsg(null);
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot || submitting) return;

    setSubmitting(true);
    try {
      const res = await api.createOffer({
        lotId: selectedLot.id,
        offeredRatePerKg: parseFloat(offeredRate),
        pickupOffered,
        pickupEtaHours: parseInt(etaHours, 10) || 24,
        notes
      });

      if (res.success) {
        showToast(t.offerSubmittedSuccess, 'success');
        setSuccessMsg(t.offerSubmittedSuccess);
        setTimeout(() => {
          setSelectedLot(null);
          setSuccessMsg(null);
          fetchLots();
        }, 1200);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to submit offer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <span>📦</span>
          <span>{t.incomingLotsTitle}</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          {t.incomingLotsSubtitle}
        </p>
      </div>

      {/* Regulatory Status Alert Banner */}
      {!isAuthorized && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 shadow-lg ${
          recyclerProfile?.authorizationStatus === 'SUSPENDED'
            ? 'bg-rose-950/80 border-rose-600 text-rose-200'
            : 'bg-amber-950/80 border-amber-600 text-amber-200'
        }`}>
          <ShieldAlert className={`w-5 h-5 shrink-0 mt-0.5 ${
            recyclerProfile?.authorizationStatus === 'SUSPENDED' ? 'text-rose-400' : 'text-amber-400'
          }`} />
          <div className="text-xs space-y-0.5">
            <span className="font-black text-sm block">
              {recyclerProfile?.authorizationStatus === 'SUSPENDED'
                ? (language === 'hi' ? 'परिचालन प्रतिबंधित: लाइसेंस निलंबित है' : language === 'mr' ? 'कामकाज प्रतिबंधित: परवाना निलंबित आहे' : 'Operations Restricted: License Suspended')
                : (language === 'hi' ? 'विनियामक सत्यापन लंबित है' : language === 'mr' ? 'नियामक पडताळणी प्रलंबित आहे' : 'Regulatory Verification Pending')}
            </span>
            <p className="opacity-90">
              {recyclerProfile?.authorizationStatus === 'SUSPENDED'
                ? (language === 'hi' ? 'CPCB ई-कचरा नियमों के अनुसार निलंबित रीसाइक्लर बोलियां प्रस्तुत नहीं कर सकते।' : language === 'mr' ? 'CPCB नियमांनुसार निलंबित रिसायकलर नवीन बोली करू शकत नाहीत.' : 'Suspended facilities are legally prohibited from placing bids under CPCB E-Waste rules.')
                : (language === 'hi' ? 'राज्य प्रदूषण नियंत्रण बोर्ड द्वारा सत्यापन पूर्ण होने तक नई बोलियां प्रस्तुत करना प्रतिबंधित है।' : language === 'mr' ? 'SPCB द्वारे पडताळणी पूर्ण होईपर्यंत नवीन बोली करणे प्रतिबंधित आहे.' : 'Quoting is disabled until state regulatory authorities verify your operating credentials.')}
            </p>
          </div>
        </div>
      )}

      {/* Lots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lots.map((lot) => (
          <div
            key={lot.id}
            className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-3xl p-5 shadow-xl space-y-4 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <SafeImage
                  src={lot.imageUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&q=80'}
                  alt={lot.materialCategory}
                  category={lot.materialCategory}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-700 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-400">{lot.id}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {getStatusLabel(lot.status, language)}
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                      lot.dataSource === 'LIVE'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {lot.dataSource === 'LIVE' ? t.liveBadge : t.demoBadge}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white mt-0.5">{getCategoryLabel(lot.materialCategory, language)}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>{lot.collectorName} • {lot.locationDistrict}, {lot.locationState}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Weight and Valuation details */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">{t.totalWeight}</span>
                <span className="font-black text-white text-sm">{lot.approxWeight} kg</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">{t.condition}</span>
                <span className="font-bold text-slate-300">{lot.condition}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">{t.estimatedValue}</span>
                <span className="font-bold text-emerald-400">₹{lot.estimatedValueMin} – ₹{lot.estimatedValueMax}</span>
              </div>
            </div>

            {lot.description && (
              <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 italic">
                "{lot.description}"
              </p>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-mono">
                {new Date(lot.createdAt).toLocaleDateString('en-IN')}
              </span>

              {(lot as any).myOffer?.status === 'ACCEPTED' ? (
                <Link
                  to="/recycler/pickups"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow flex items-center gap-1.5 active:scale-95"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'डील स्वीकृत • पिकअप शेड्यूल करें' : language === 'mr' ? 'ऑफर स्वीकृत • पिकअप नियोजित करा' : 'Deal Accepted • Schedule Pickup'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (lot as any).myOffer?.status === 'PENDING' ? (
                <div className="px-3.5 py-2 bg-slate-800 border border-blue-500/50 text-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    {language === 'hi'
                      ? `बोली सक्रिय: ₹${(lot as any).myOffer.offeredRatePerKg}/kg`
                      : language === 'mr'
                      ? `बोली पाठवली: ₹${(lot as any).myOffer.offeredRatePerKg}/kg`
                      : `Bid Active: ₹${(lot as any).myOffer.offeredRatePerKg}/kg`}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!isAuthorized}
                  onClick={() => handleOpenOfferModal(lot)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold shadow flex items-center gap-1.5 ${
                    isAuthorized
                      ? 'bg-blue-600 hover:bg-blue-500 active:scale-95 text-white'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                  title={!isAuthorized ? 'CPCB Authorization Required' : undefined}
                >
                  <span>{isAuthorized ? t.makeOfferBtn : (language === 'hi' ? 'अनुमति प्रतीक्षित' : language === 'mr' ? 'परवानगी प्रलंबित' : 'Auth Required')}</span>
                  {isAuthorized && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Make Offer Modal */}
      {selectedLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-blue-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">{t.makeOfferModalTitle}</h3>
                <p className="text-xs text-blue-400 font-mono">{selectedLot.id} • {getCategoryLabel(selectedLot.materialCategory, language)}</p>
              </div>
              <button
                onClick={() => setSelectedLot(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {successMsg ? (
              <div className="bg-emerald-950 border border-emerald-500 rounded-2xl p-4 text-center text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-1" />
                {successMsg}
              </div>
            ) : (
              <form onSubmit={handleSubmitOffer} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    {t.offeredRateLabel}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={offeredRate}
                      onChange={(e) => setOfferedRate(e.target.value)}
                      className="w-full pl-4 pr-16 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xl font-black focus:outline-none focus:border-blue-500"
                      required
                    />
                    <span className="absolute right-3 top-3 text-slate-400 font-bold">₹ / kg</span>
                  </div>
                  <div className="flex justify-between text-slate-400 mt-1 font-bold">
                    <span>{t.estimatedTotalLabel}</span>
                    <span className="text-emerald-400 font-black text-sm">
                      ₹{Math.round((parseFloat(offeredRate) || 0) * selectedLot.approxWeight).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-slate-300">{t.pickupIncludedLabel}</span>
                  <input
                    type="checkbox"
                    checked={pickupOffered}
                    onChange={(e) => setPickupOffered(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    {t.pickupEtaLabel}
                  </label>
                  <select
                    value={etaHours}
                    onChange={(e) => setEtaHours(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="12">{t.eta12h}</option>
                    <option value="24">{t.eta24h}</option>
                    <option value="48">{t.eta48h}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    {t.notesToCollectorLabel}
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 text-xs"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? t.loadingText : t.sendOfferBtn}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

