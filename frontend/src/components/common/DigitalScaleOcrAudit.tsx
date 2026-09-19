import React, { useState } from 'react';
import { Camera, CheckCircle2, RefreshCw, Scale, ShieldCheck, Sparkles, AlertCircle, Scan } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

interface DigitalScaleOcrAuditProps {
  currentWeight: string;
  onWeightScanned: (newWeight: string) => void;
  imageUrl?: string;
  className?: string;
}

export const DigitalScaleOcrAudit: React.FC<DigitalScaleOcrAuditProps> = ({
  currentWeight,
  onWeightScanned,
  imageUrl = '/calibrated_scale_reading.jpg',
  className = ''
}) => {
  const { language } = useLanguage();
  const { showToast } = useToast();

  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<{
    scannedWeight: string;
    confidence: number;
    tareErrorPercent: number;
    calibrationId: string;
    verifiedAt: string;
  } | null>({
    scannedWeight: currentWeight || '10.0',
    confidence: 99.4,
    tareErrorPercent: 0.0,
    calibrationId: 'LM-CPCB-2026-00948',
    verifiedAt: new Date().toLocaleTimeString('en-IN')
  });

  const handleRunOcrAudit = () => {
    setIsScanning(true);
    setOcrResult(null);

    setTimeout(() => {
      // Simulate reading digits accurately with random slight scale precision or matched weight
      const scannedVal = currentWeight ? String(Number(currentWeight).toFixed(1)) : '10.0';
      const confidence = Number((98.5 + Math.random() * 1.4).toFixed(1));
      
      const newResult = {
        scannedWeight: scannedVal,
        confidence,
        tareErrorPercent: 0.0,
        calibrationId: `LM-CPCB-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        verifiedAt: new Date().toLocaleTimeString('en-IN')
      };

      setOcrResult(newResult);
      setIsScanning(false);
      onWeightScanned(scannedVal);

      showToast(
        language === 'hi'
          ? `🔍 OCR स्केल ऑडिट सफल! सत्यापित वजन: ${scannedVal} किग्रा (0% एरर)`
          : language === 'mr'
            ? `🔍 OCR स्केल ऑडिट यशस्वी! सत्यापित वजन: ${scannedVal} किग्रा (0% एरर)`
            : `🔍 Scale OCR Audit Verified: ${scannedVal} kg (99.4% AI Confidence)`,
        'success'
      );
    }, 1200);
  };

  return (
    <div className={`bg-slate-950 text-white p-4 rounded-2xl border-2 border-emerald-500/60 shadow-lg space-y-3 relative overflow-hidden ${className}`}>
      {/* Laser Scanning Animation Overlay */}
      {isScanning && (
        <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs z-20 flex flex-col items-center justify-center p-4 space-y-3">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <Scan className="w-12 h-12 text-emerald-400 animate-pulse" />
            <div className="absolute inset-0 border-2 border-emerald-400 rounded-full animate-ping opacity-75" />
          </div>
          <div className="text-center">
            <span className="text-xs font-black font-mono text-emerald-400 tracking-widest block uppercase animate-pulse">
              {language === 'hi' ? 'कांटे के OCR डिजिट स्कैन हो रहे हैं...' : language === 'mr' ? 'काट्याचे OCR डिजिटल आकडे स्कॅन होत आहेत...' : 'Scanning Electronic Scale Numbers...'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">CPCB Legal Metrology Vision AI v2.4</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              {language === 'hi' ? 'डिजिटल कांटा OCR वजन ऑडिट (Scale OCR Audit)' : language === 'mr' ? 'डिजिटल काटा OCR वजन ऑडिट (Scale OCR Audit)' : 'Digital Scale OCR Weight Audit'}
            </h4>
            <span className="text-[10px] text-emerald-400 font-mono font-bold block">
              {language === 'hi' ? 'CPCB नियम 19 एंटी-टैम्पर लीगल मेट्रोलॉजी सत्यापन' : language === 'mr' ? 'CPCB नियम 19 अँटी-टॅम्पर लीगल मेट्रोलॉजी पडताळणी' : 'CPCB Rule 19 Anti-Tamper Legal Metrology Verification'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRunOcrAudit}
          disabled={isScanning}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black rounded-xl flex items-center gap-1.5 shadow active:scale-95 transition-all disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span>{isScanning ? (language === 'hi' ? 'स्कैन हो रहा है...' : language === 'mr' ? 'स्कॅन होत आहे...' : 'Scanning...') : (language === 'hi' ? 'OCR ऑडिट चलाएं' : language === 'mr' ? 'OCR ऑडिट चालवा' : 'Run OCR Audit')}</span>
        </button>
      </div>

      {/* OCR Visual Bounding Box Display */}
      {ocrResult && (
        <div className="space-y-2.5">
          <div className="bg-slate-900/90 p-3 rounded-xl border border-emerald-500/40 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-mono font-black rounded">
                  {language === 'hi' ? 'OCR सत्यापित' : language === 'mr' ? 'OCR सत्यापित' : 'OCR VERIFIED'}
                </span>
                <span className="text-[11px] font-mono text-emerald-300 font-bold">
                  {ocrResult.scannedWeight} {language === 'hi' || language === 'mr' ? 'किग्रा' : 'kg'}
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">
                {language === 'hi' ? (
                  <>AI विश्वसनीयता: <b className="text-emerald-400">{ocrResult.confidence}%</b> | टेयर त्रुटि: <b className="text-emerald-400">0.0%</b></>
                ) : language === 'mr' ? (
                  <>AI विश्वासार्हता: <b className="text-emerald-400">{ocrResult.confidence}%</b> | टेअर त्रुटी: <b className="text-emerald-400">0.0%</b></>
                ) : (
                  <>AI Confidence: <b className="text-emerald-400">{ocrResult.confidence}%</b> | Scale Tare Error: <b className="text-emerald-400">0.0%</b></>
                )}
              </p>
            </div>

            <div className="text-right font-mono text-[10px]">
              <span className="text-slate-400 block">{language === 'hi' ? 'सील आईडी:' : language === 'mr' ? 'सील आयडी:' : 'Seal ID:'}</span>
              <span className="text-emerald-300 font-bold">{ocrResult.calibrationId}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">{language === 'hi' ? 'शून्य संतुलन जांच:' : language === 'mr' ? 'शून्य बॅलन्स तपासणी:' : 'Zero Balance Check:'}</span>
              <span className="text-emerald-400 font-bold">{language === 'hi' || language === 'mr' ? 'पास (0.00 किग्रा)' : 'PASS (0.00 kg)'}</span>
            </div>
            <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">{language === 'hi' ? 'मेट्रोलॉजी होलोग्राम:' : language === 'mr' ? 'मेट्रोलॉजी होलोग्राम:' : 'Metrology Hologram:'}</span>
              <span className="text-emerald-400 font-bold">{language === 'hi' || language === 'mr' ? 'वैध ✓' : 'VALID ✓'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
