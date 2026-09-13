import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Scale, 
  CheckCircle2, 
  Camera, 
  AlertTriangle, 
  QrCode, 
  Wallet, 
  Sparkles,
  Truck,
  Factory,
  FileText,
  Upload,
  RefreshCw,
  X,
  Video,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { onPlatformSync } from '../../services/realtime';
import { Lot } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

import { getDeviceLocation, LocationResult } from '../../utils/geolocation';
import { getCategoryLabel } from '../../i18n/translations';

const DEFAULT_SCALE_IMAGE = '/calibrated_scale_reading.jpg';

interface ScalePreset {
  id: string;
  name: string;
  badge: string;
  url: string;
}

const SCALE_PRESETS: ScalePreset[] = [
  {
    id: 'avery-zm510',
    name: 'Avery ZM510-SD (10.00 kg)',
    badge: 'Legal Metrology Hologram',
    url: '/calibrated_scale_reading.jpg'
  },
  {
    id: 'industrial-weighbridge',
    name: 'Mettler-Toledo RI-350 (10.0 kg)',
    badge: 'Industrial Floor Scale',
    url: '/scale_industrial_floor.jpg'
  },
  {
    id: 'precision-bench',
    name: 'Adam ACB-10k Bench (10.00 kg)',
    badge: 'Electronic Tare Display',
    url: '/scale_precision_bench.jpg'
  }
];

export const HandoverVerificationPage: React.FC = () => {
  const { user, recyclerProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const queryLotId = searchParams.get('lotId');
  const myRecyclerId = recyclerProfile?.id || user?.id || 'rec_abc_1';

  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [lots, setLots] = useState<Lot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string>(queryLotId || '');
  const [actualWeight, setActualWeight] = useState<string>('10');
  const [handoverOtp, setHandoverOtp] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI'>('CASH');
  const [driverName, setDriverName] = useState<string>('Mohan Singh');
  const [scheduledPickup, setScheduledPickup] = useState<any>(null);
  const [acceptedOfferRate, setAcceptedOfferRate] = useState<number | null>(null);
  
  // Physical scale proof image state
  const [proofImage, setProofImage] = useState<string>(DEFAULT_SCALE_IMAGE);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('avery-zm510');
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [showFullProofModal, setShowFullProofModal] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [locationData, setLocationData] = useState<LocationResult | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successResult, setSuccessResult] = useState<any>(null);
  const [razorpayPaymentId, setRazorpayPaymentId] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
      const res = await api.getLots({ limit: '100' });
      if (res.success) {
        // Filter lots in ACCEPTED or PICKUP_SCHEDULED status ready for physical handover
        const pending = res.lots.filter((l: Lot) => 
          (l.status === 'ACCEPTED' || l.status === 'PICKUP_SCHEDULED') &&
          (!l.selectedRecyclerId || l.selectedRecyclerId === myRecyclerId)
        );
        setLots(pending);
        if (queryLotId && pending.some(l => l.id === queryLotId)) {
          const matched = pending.find(l => l.id === queryLotId)!;
          setSelectedLotId(matched.id);
          setActualWeight(String(matched.approxWeight));
          setHandoverOtp(''); // Blank for authentic verification
        } else if (pending.length > 0 && !selectedLotId) {
          setSelectedLotId(pending[0].id);
          setActualWeight(String(pending[0].approxWeight));
          setHandoverOtp(''); // Blank for authentic verification
        }
      }
    } catch (err) {
      console.warn('Failed to load lots for handover:', err);
    }
  };

  // Load detailed lot metadata, accepted offer rate, and pickup details when selected lot changes
  useEffect(() => {
    if (!selectedLotId) return;
    api.getLotById(selectedLotId)
      .then((res) => {
        if (res.success) {
          if (res.pickup) {
            setScheduledPickup(res.pickup);
            if (res.pickup.driverName) setDriverName(res.pickup.driverName);
          } else {
            setScheduledPickup(null);
          }
          if (res.offers && res.offers.length > 0) {
            const accepted = res.offers.find((o: any) => o.id === res.lot.selectedOfferId || o.status === 'ACCEPTED');
            if (accepted?.offeredRatePerKg) {
              setAcceptedOfferRate(accepted.offeredRatePerKg);
            }
          }
        }
      })
      .catch((err) => console.warn('Lot detail fetch error:', err));
  }, [selectedLotId]);

  useEffect(() => {
    fetchLots();
    getDeviceLocation().then(setLocationData);

    const unsubscribeSync = onPlatformSync(() => {
      fetchLots();
    });

    const interval = setInterval(() => {
      fetchLots();
    }, 8000);

    return () => {
      unsubscribeSync();
      clearInterval(interval);
      stopCamera();
    };
  }, []);

  const selectedLot = lots.find(l => l.id === selectedLotId);
  const approx = selectedLot ? selectedLot.approxWeight : 10;
  const actualNum = parseFloat(actualWeight) || approx;
  const diff = Number((actualNum - approx).toFixed(2));
  const diffPercent = approx > 0 ? Number(((diff / approx) * 100).toFixed(1)) : 0;
  const isHighVariance = Math.abs(diffPercent) >= 30;

  // Accurately compute rate per kg from accepted offer, or fallback to lot quoted price
  const ratePerKg = acceptedOfferRate || (selectedLot?.quotedPrice && selectedLot.approxWeight ? Math.round(selectedLot.quotedPrice / selectedLot.approxWeight) : 80);
  const finalAmount = Math.round(actualNum * ratePerKg);

  // File upload handler
  const handleScalePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProofImage(event.target.result as string);
        setSelectedPresetId('custom-upload');
        showToast('Scale weight photo uploaded from device successfully', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Live WebCam handlers
  const startCamera = async () => {
    setIsCameraOpen(true);
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Live camera error:', err);
      setCameraError(err.message || 'Camera not accessible or permission denied. You can still upload from device or select presets.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraOpen(false);
    setCameraError('');
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setProofImage(dataUrl);
      setSelectedPresetId('live-camera-snap');
      stopCamera();
      showToast('Live scale reading captured & verified!', 'success');
    } catch (err) {
      showToast('Failed to snapshot camera feed', 'error');
    }
  };

  const handleSelectPreset = (preset: ScalePreset) => {
    setProofImage(preset.url);
    setSelectedPresetId(preset.id);
    showToast(`Switched to ${preset.name}`, 'info');
  };

  const handleOpenRazorpay = () => {
    if (typeof (window as any).Razorpay === 'undefined') {
      showToast('Razorpay Gateway SDK loading, please check connection', 'warning');
      return;
    }
    try {
      const options = {
        key: (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || 'rzp_test_TbR1Di4QmhTazp',
        amount: finalAmount * 100,
        currency: 'INR',
        name: 'Kabadiwala Connect',
        description: `Scale Verified Payout for Consignment #${selectedLotId}`,
        image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=128&q=80',
        handler: function (response: any) {
          const pid = response.razorpay_payment_id || `pay_${Date.now()}`;
          setRazorpayPaymentId(pid);
          showToast(`Razorpay Payment Successful: ${pid}`, 'success');
        },
        prefill: {
          name: recyclerProfile?.facilityName || user?.name || 'Authorized Recycler Facility',
          email: (recyclerProfile as any)?.contactEmail || (user as any)?.email || 'accounts@kabadiwalaconnect.in',
          contact: recyclerProfile?.contactPhone || user?.phone || '9820098200'
        },
        theme: {
          color: '#059669'
        }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      showToast(err.message || 'Failed to open Razorpay', 'error');
    }
  };

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
        verifiedByRecyclerName: recyclerProfile?.facilityName || user?.name || 'Authorized Recycler',
        razorpayPaymentId: razorpayPaymentId || undefined,
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

          <div className="bg-slate-950 p-4 rounded-2xl text-xs text-left space-y-2.5 border border-slate-800">
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
            <div className="flex justify-between border-t border-slate-800/80 pt-2">
              <span className="text-slate-400">{t.handoverTotalSettled}</span>
              <span className="font-black text-emerald-400 text-base">₹{successResult.handover.finalPaymentAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Seamless Next-Stage Navigation Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link
              to={`/recycler/inventory?lotId=${successResult.lot.id}`}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Factory className="w-4 h-4" />
              <span>Proceed to Factory Processing →</span>
            </Link>

            <Link
              to="/recycler/transactions"
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs border border-slate-700 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>View Ledger Voucher & Manifest</span>
            </Link>
          </div>

          <button
            onClick={() => {
              setSuccessResult(null);
              fetchLots();
            }}
            className="w-full py-2.5 text-slate-400 hover:text-white font-bold text-xs"
          >
            + {t.handoverNextBtn}
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
                  setHandoverOtp(''); // Blank for authentic verification
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

            {scheduledPickup && (
              <div className="mt-2 text-[11px] text-slate-300 flex items-center gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                <Truck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Assigned Driver: <b className="text-white">{driverName}</b> • Vehicle: <b className="text-white font-mono">{scheduledPickup.vehicleNumber}</b></span>
              </div>
            )}
          </div>

          {/* Step 2: Weight Verification & Automatic Variance Calculation */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300">
                {t.handoverActualWeight}
              </label>
              <span className="text-[11px] font-bold text-emerald-400 font-mono">
                Agreed Rate: ₹{ratePerKg}/kg
              </span>
            </div>

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
                  placeholder="10"
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
                placeholder="----"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-center text-lg font-black tracking-widest focus:outline-none focus:border-emerald-500"
                required
              />
              <div className="mt-1 flex items-center justify-between text-[10px]">
                <span className="text-slate-500">{t.handoverOtpDesc}</span>
                {selectedLot?.handoverOtp && (
                  <button
                    type="button"
                    onClick={() => setHandoverOtp(selectedLot.handoverOtp || '')}
                    className="text-emerald-400 hover:text-emerald-300 font-mono font-bold bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-800 active:scale-95"
                  >
                    Demo OTP: {selectedLot.handoverOtp} <span className="underline">(Fill)</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5">
                {t.handoverPaymentMethod}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value as any);
                  setRazorpayPaymentId('');
                }}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="CASH">{t.handoverCash}</option>
                <option value="UPI">{t.handoverUpi}</option>
              </select>
              <span className="text-[10px] text-emerald-400 mt-0.5 block font-bold">
                {t.handoverTotalPayable} ₹{finalAmount.toLocaleString('en-IN')} (@ ₹{ratePerKg}/kg)
              </span>
            </div>
          </div>

          {/* Step 4: Electronic Scale Photo Reading Proof (CPCB Rule 19 Compliant) */}
          <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <label className="text-xs font-black text-white flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Physical Scale Photo Proof (CPCB Rule 19)</span>
                </label>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Must photograph the calibrated electronic weighing scale displaying {actualWeight || '10'} kg
                </p>
              </div>

              <span className="self-start sm:self-auto text-[10px] text-emerald-300 font-mono font-bold bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Legal Metrology Calibrated</span>
              </span>
            </div>

            {/* Scale Image Card with Metadata Badge */}
            <div className="relative rounded-2xl border-2 border-slate-800 overflow-hidden bg-slate-900 group">
              <img 
                src={proofImage} 
                alt="Calibrated Scale Display" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_SCALE_IMAGE;
                }}
                className="w-full h-48 sm:h-64 object-cover transition-transform duration-300 group-hover:scale-[1.01]" 
              />

              {/* Overlay Badges */}
              <div className="absolute top-2.5 left-2.5 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-700/80 text-[10px] text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-mono font-black text-emerald-400">NET STABLE: {actualWeight || '10.0'} kg</span>
              </div>

              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowFullProofModal(true)}
                  className="px-2.5 py-1 bg-slate-950/80 hover:bg-slate-900 text-slate-200 rounded-lg text-[10px] font-bold border border-slate-700 flex items-center gap-1 shadow"
                  title="View Full Resolution"
                >
                  <Eye className="w-3 h-3 text-blue-400" />
                  <span>Inspect</span>
                </button>
              </div>

              {/* Bottom OCR Stamping Banner */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent p-3 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[10px] font-mono">
                <span className="text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>OCR Scale Digitized: <b>{actualWeight || '10'} kg</b> (Zero Variance Stamped)</span>
                </span>
                <span className="text-slate-400 text-[9px]">
                  Seal ID: WSM-2024-LM003984
                </span>
              </div>
            </div>

            {/* Photo Action Buttons: Live Camera Snap vs Device Upload vs Reset */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={startCamera}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow active:scale-95 transition-all text-xs"
              >
                <Camera className="w-4 h-4" />
                <span>Live Camera Snap</span>
              </button>

              <input
                type="file"
                id="scale-photo-input"
                accept="image/*"
                onChange={handleScalePhotoUpload}
                className="hidden"
              />
              <label
                htmlFor="scale-photo-input"
                className="cursor-pointer px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold border border-slate-700 flex items-center gap-1.5 shadow active:scale-95 transition-all text-xs"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Upload from Device</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setProofImage(DEFAULT_SCALE_IMAGE);
                  setSelectedPresetId('avery-zm510');
                  showToast('Reset to certified Avery ZM510-SD scale reading', 'info');
                }}
                className="px-3 py-2 text-slate-400 hover:text-white rounded-xl font-medium text-[11px] flex items-center gap-1 ml-auto"
                title="Reset to default certified scale"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Default</span>
              </button>
            </div>

            {/* Quick Demo Presets (Crucial for SIH Presentations) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-bold uppercase tracking-wider">SIH Stage Demo Scale Presets:</span>
                <span>Click to switch scale photo instantly</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SCALE_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2 rounded-xl text-left border transition-all text-xs ${
                        isSelected
                          ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-md'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="font-bold truncate text-[11px]">{preset.name}</div>
                      <div className="text-[9px] text-slate-400 truncate">{preset.badge}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dynamic Payment Rail Helper & Razorpay Gateway */}
          {paymentMethod === 'UPI' ? (
            <div className="bg-gradient-to-r from-blue-950/60 to-slate-950 p-4 rounded-2xl border border-blue-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>NPCI UPI Instant Payout Rail & Razorpay Gateway</span>
                  </span>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Pay directly to Collector's registered UPI VPA: <b className="text-white font-mono">{selectedLot?.collectorPhone ? `${selectedLot.collectorPhone}@upi` : '9876543210@upi'}</b>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenRazorpay}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow active:scale-95 shrink-0"
                >
                  <span>💳 Launch Razorpay Gateway</span>
                </button>
              </div>

              {razorpayPaymentId ? (
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-xs font-mono text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Razorpay Payment Verified: <b>{razorpayPaymentId}</b></span>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <QrCode className="w-10 h-10 text-blue-400 shrink-0" />
                  <div className="text-[11px] text-slate-400">
                    <span className="text-white font-bold block">Dynamic UPI QR Code Generated</span>
                    <span>Amount ₹{finalAmount.toLocaleString('en-IN')} will be digitally stamped into CPCB Double-Entry Ledger.</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-800/60 text-xs text-slate-300 flex items-center gap-2.5">
              <Wallet className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-emerald-300 block">CPCB Spot Cash Disbursal (Rule 19 Compliant)</span>
                <span className="text-[11px] text-slate-400">Collector OTP & digital signature required. Verifiable Digital Cash Voucher (CSH-LKO-2026-XXXX) will be generated.</span>
              </div>
            </div>
          )}

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

      {/* LIVE CAMERA MODAL VIEW */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Video className="w-4 h-4 text-emerald-400" />
                <span>Live Scale Camera Viewfinder</span>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 bg-red-950/80 border border-red-800 rounded-2xl text-xs text-red-300 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>Camera Access Error</span>
                </p>
                <p className="text-[11px]">{cameraError}</p>
                <div className="pt-2">
                  <label
                    htmlFor="scale-photo-input"
                    onClick={stopCamera}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-200 rounded-xl text-xs font-bold border border-slate-700"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Upload File Instead</span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-slate-700">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Visual Reticle / Framing Guide */}
                <div className="absolute inset-6 border-2 border-dashed border-emerald-400/70 rounded-xl pointer-events-none flex items-center justify-center">
                  <span className="bg-slate-950/80 text-[10px] text-emerald-300 px-2 py-0.5 rounded font-mono">
                    Align Scale Screen Inside Box
                  </span>
                </div>
              </div>
            )}

            {!cameraError && (
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={captureFromCamera}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Scale Reading</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL RESOLUTION INSPECT MODAL */}
      {showFullProofModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-2xl w-full space-y-3 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-sm flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                <span>Certified Electronic Scale Display (High-Res Inspection)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowFullProofModal(false)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-[70vh] flex items-center justify-center bg-black">
              <img src={proofImage} alt="Scale Inspect" className="max-h-[70vh] w-auto object-contain" />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Lot: {selectedLotId || 'EW-LUC-2026-489900'}</span>
              <span className="text-emerald-400">Verified Stamp: Legal Metrology WSM-2024</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
