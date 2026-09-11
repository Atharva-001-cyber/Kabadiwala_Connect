import React, { useState, useEffect } from 'react';
import { Scale, CheckCircle2, ShieldCheck, Camera, IndianRupee, AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { Lot, HandoverRecord } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

import { getDeviceLocation, LocationResult } from '../../utils/geolocation';
import { getCategoryLabel } from '../../i18n/translations';

export const HandoverVerificationPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [lots, setLots] = useState<Lot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [actualWeight, setActualWeight] = useState<string>('12.5');
  const [handoverOtp, setHandoverOtp] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI'>('CASH');
  const [driverName, setDriverName] = useState<string>('Suresh Yadav');
  const [proofImage, setProofImage] = useState<string>('https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80');
  const [locationData, setLocationData] = useState<LocationResult | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successResult, setSuccessResult] = useState<any>(null);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasSignature, setHasSignature] = useState<boolean>(false);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const fetchLots = async () => {
    try {
      const res = await api.getLots();
      if (res.success) {
        // Filter lots in ACCEPTED or PICKUP_SCHEDULED status ready for physical handover
        const pending = res.lots.filter((l: Lot) => l.status === 'ACCEPTED' || l.status === 'PICKUP_SCHEDULED');
        setLots(pending);
        if (pending.length > 0 && !selectedLotId) {
          setSelectedLotId(pending[0].id);
          setActualWeight(String(pending[0].approxWeight));
          if (pending[0].handoverOtp) {
            setHandoverOtp(pending[0].handoverOtp);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load lots for handover:', err);
    }
  };

  useEffect(() => {
    fetchLots();
    getDeviceLocation().then(setLocationData);
  }, []);

  const selectedLot = lots.find(l => l.id === selectedLotId);
  const approx = selectedLot ? selectedLot.approxWeight : 10;
  const actualNum = parseFloat(actualWeight) || approx;
  const diff = Number((actualNum - approx).toFixed(2));
  const diffPercent = approx > 0 ? Number(((diff / approx) * 100).toFixed(1)) : 0;
  const isHighVariance = Math.abs(diffPercent) >= 30;

  const ratePerKg = selectedLot?.quotedPrice ? Math.round(selectedLot.quotedPrice / (selectedLot.approxWeight || 1)) : 95;
  const finalAmount = Math.round(actualNum * ratePerKg);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotId) {
      showToast(t.handoverPleaseSelectLot || 'Please select a lot', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const signatureImageUrl = hasSignature && canvasRef.current ? canvasRef.current.toDataURL('image/png') : undefined;

      const res = await api.verifyHandover({
        lotId: selectedLotId,
        actualWeight: actualNum,
        proofImageUrl: proofImage,
        signatureImageUrl,
        handoverOtp,
        paymentMethod,
        driverName,
        latitude: locationData?.latitude,
        longitude: locationData?.longitude,
        locationSource: locationData?.locationSource || 'DISTRICT_FALLBACK',
        deviceAccuracyMeters: locationData?.accuracyMeters
      });

      if (res.success) {
        showToast(t.handoverSuccessTitle || 'Handover and payment verified!', 'success');
        setSuccessResult(res);
        fetchLots();
      }
    } catch (err: any) {
      showToast(err.message || t.handoverVerifyFailed || 'Verification failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <span>⚖️</span>
          <span>{t.handoverVerificationTitle}</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          {t.handoverSubtitle}
        </p>
      </div>

      {successResult ? (
        <div className="bg-slate-900 border border-emerald-500 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-xl font-black text-white">{t.handoverSuccessTitle}</h2>
            <p className="text-xs text-emerald-400 font-mono mt-1">
              Handover Ref: {successResult.handover.id} • Lot: {successResult.lot.id}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl text-xs text-left space-y-2 border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-400">{t.handoverVerifiedWeight}</span>
              <span className="font-bold text-white text-sm">{successResult.handover.actualWeight} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{t.handoverVariance}</span>
              <span className={`font-bold ${successResult.handover.weightDifference >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {successResult.handover.weightDifference} kg ({successResult.handover.weightDiffPercentage}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{t.handoverTotalSettled}</span>
              <span className="font-black text-emerald-400 text-base">₹{successResult.handover.finalPaymentAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setSuccessResult(null);
              fetchLots();
            }}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-xs shadow"
          >
            {t.handoverNextBtn}
          </button>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
          {/* Step 1: Select Lot */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {t.handoverSelectLot}
            </label>
            <select
              value={selectedLotId}
              onChange={(e) => {
                setSelectedLotId(e.target.value);
                const l = lots.find(item => item.id === e.target.value);
                if (l) {
                  setActualWeight(String(l.approxWeight));
                  if (l.handoverOtp) setHandoverOtp(l.handoverOtp);
                  else setHandoverOtp('');
                }
              }}
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-2xl text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
              required
            >
              {lots.length === 0 ? (
                <option value="">{t.handoverNoLots}</option>
              ) : (
                lots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.id} - {getCategoryLabel(l.materialCategory, language)} ({l.approxWeight} kg) - {l.collectorName}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Step 2: Weight Verification & Automatic Variance Calculation */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-300">
              {t.handoverActualWeight}
            </label>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <span className="text-[10px] text-slate-500 block">{t.handoverCollectorWeight}</span>
                <span className="text-base font-bold text-slate-300 font-mono">{approx} kg</span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={actualWeight}
                  onChange={(e) => setActualWeight(e.target.value)}
                  placeholder="12.5"
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-900 border border-emerald-500 rounded-xl text-white font-mono text-xl font-black focus:outline-none"
                  required
                />
                <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">kg</span>
              </div>
            </div>

            {/* Difference Indicator */}
            <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between font-bold ${
              isHighVariance
                ? 'bg-red-950/80 border-red-700 text-red-300'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}>
              <span>{t.handoverVariance}</span>
              <span>{diff >= 0 ? `+${diff}` : `${diff}`} kg ({diffPercent}%)</span>
            </div>

            {isHighVariance && (
              <p className="text-[11px] text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{t.handoverVarianceWarning}</span>
              </p>
            )}
          </div>

          {/* Step 3: Enter Collector OTP & Payment Settlement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">
                {t.handoverEnterOtp}
              </label>
              <input
                type="text"
                maxLength={4}
                value={handoverOtp}
                onChange={(e) => setHandoverOtp(e.target.value)}
                placeholder="4821"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-center text-lg font-black tracking-widest focus:outline-none focus:border-emerald-500"
                required
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">{t.handoverOtpDesc}</span>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5">
                {t.handoverPaymentMethod}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="CASH">{t.handoverCash}</option>
                <option value="UPI">{t.handoverUpi}</option>
              </select>
              <span className="text-[10px] text-emerald-400 mt-0.5 block font-bold">
                {t.handoverTotalPayable} ₹{finalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Location & GPS Provenance */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">{t.handoverLocationSource}</span>
              <span className="font-mono text-white font-bold">
                {locationData ? `${locationData.latitude}° N, ${locationData.longitude}° E` : (language === 'hi' ? 'GPS प्राप्त किया जा रहा है...' : language === 'mr' ? 'GPS मिळवत आहे...' : 'Fetching GPS...')}
              </span>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
              locationData?.locationSource === 'DEVICE_GPS'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {locationData?.locationSource === 'DEVICE_GPS'
                ? (language === 'hi' ? `📍 डिवाइस GPS (±${locationData.accuracyMeters}m)` : language === 'mr' ? `📍 डिव्हाइस GPS (±${locationData.accuracyMeters}m)` : `📍 Device GPS (±${locationData.accuracyMeters}m)`)
                : (language === 'hi' ? '📍 जिला फॉलबैक' : language === 'mr' ? '📍 जिल्हा फॉलबॅक' : '📍 District Fallback')}
            </span>
          </div>

          {/* Step 5: Collector Digital Finger Signature Pad */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 block">
                {t.handoverSignatureTitle}
              </label>
              {hasSignature && (
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                >
                  {t.handoverClearSig}
                </button>
              )}
            </div>
            <canvas
              ref={canvasRef}
              width={400}
              height={90}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              className="w-full h-[90px] bg-slate-900 border border-dashed border-slate-700 rounded-xl cursor-crosshair touch-none"
            />
            <span className="text-[10px] text-slate-500 block">
              {t.handoverSigDesc}
            </span>
          </div>

          <p className="text-[10px] text-slate-400 italic">
            {t.handoverDisclaimer}
          </p>

          {/* Submit Handover */}
          <button
            type="submit"
            disabled={submitting || lots.length === 0}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-base rounded-2xl shadow-xl flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{submitting ? t.handoverSubmitting : t.handoverSubmitBtn}</span>
          </button>
        </form>
      )}
    </div>
  );
};
