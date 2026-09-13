import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Factory, 
  Recycle, 
  AlertTriangle, 
  Scale, 
  MapPin, 
  Database, 
  FileSpreadsheet, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp,
  Layers,
  Key,
  Cpu,
  BatteryCharging,
  Tv,
  Monitor,
  Cable,
  Zap,
  Magnet,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getCategoryLabel } from '../../i18n/translations';
import { api } from '../../services/api';

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  PCB: Cpu,
  BATTERY: BatteryCharging,
  CRT: Tv,
  LCD: Monitor,
  CABLE: Cable,
  MOTOR: Zap,
  MAGNET: Magnet,
  MIXED_PLASTIC: Layers
};

export const AdminDashboard: React.FC = () => {
  const { language, t } = useLanguage();
  const [kpis, setKpis] = useState<any>(null);
  const [materialBreakdown, setMaterialBreakdown] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchKPIs = useCallback(async (isSilent: boolean = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const res = await api.getAdminKPIs();
      if (res.success) {
        setKpis(res.kpis);
        setMaterialBreakdown(res.materialBreakdown || {});
      }
    } catch (err) {
      console.warn('Admin KPI fetch error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchKPIs(false);
    // Live polling every 15 seconds to keep admin national telemetry synchronized with field operations
    const interval = setInterval(() => fetchKPIs(true), 15000);
    return () => clearInterval(interval);
  }, [fetchKPIs]);

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Admin National Hub Header */}
      <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-slate-950 border-2 border-purple-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {language === 'hi' ? 'सीपीसीबी राष्ट्रीय ई-कचरा ईपीआर निगरानी केंद्र' : language === 'mr' ? 'सीपीसीबी राष्ट्रीय ई-कचरा ईपीआर देखरेख केंद्र' : 'CPCB National E-Waste EPR Monitoring Hub'}
                </h1>
                <p className="text-xs text-purple-200/90 font-medium">
                  {language === 'hi' ? 'केंद्रीय प्रदूषण नियंत्रण बोर्ड • एसआईएच 2026 समस्या विवरण #229' : language === 'mr' ? 'केंद्रीय प्रदूषण नियंत्रण मंडळ • एसआयएच 2026 समस्या विवरण #229' : 'Central Pollution Control Board • SIH 2026 Problem Statement #229'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => fetchKPIs(false)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-purple-700 text-purple-200 shadow transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
              title="Refresh National Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync Live'}</span>
            </button>
            <span className="px-3 py-2 rounded-xl bg-emerald-950 text-emerald-300 text-xs font-black border border-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{language === 'hi' ? 'ईपीआर ऑडिट सक्रिय' : language === 'mr' ? 'ईपीआर ऑडिट सक्रिय' : 'EPR AUDIT ACTIVE'}</span>
            </span>
            <Link
              to="/admin/map"
              className="min-h-[40px] px-4 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all"
            >
              <MapPin className="w-4 h-4" />
              <span>{language === 'hi' ? 'ई-वेस्ट जीआईएस मैप' : language === 'mr' ? 'ई-कचरा जीआयएस नकाशा' : 'E-Waste GIS Map'}</span>
            </Link>
          </div>
        </div>

        {/* 4 Core High-Level Ecosystem KPIs with Data Source Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 text-xs">
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl shadow-inner space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-extrabold uppercase text-[10px]">{language === 'hi' ? 'पंजीकृत कबाड़ीवाले' : language === 'mr' ? 'नोंदणीकृत कबाडीवाले' : 'Registered Collectors'}</span>
              <span className="text-[9px] font-mono text-emerald-400 font-bold">LIVE DB</span>
            </div>
            <span className="text-3xl font-black text-white font-mono block mt-1">{kpis?.totalCollectors || 0}</span>
            <span className="text-[10px] text-emerald-400 font-bold">
              {language === 'hi' ? '100% सत्यापित केवाईसी' : language === 'mr' ? '100% पडताळणी केलेले केवायसी' : '100% KYC Profiled'}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl shadow-inner space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-extrabold uppercase text-[10px]">{language === 'hi' ? 'अधिकृत रीसाइक्लर' : language === 'mr' ? 'अधिकृत रिसायकलर' : 'Gazetted Recyclers'}</span>
              <span className="text-[9px] font-mono text-blue-400 font-bold">CPCB GAZETTE</span>
            </div>
            <span className="text-3xl font-black text-blue-400 font-mono block mt-1">
              {kpis?.authorizedRecyclers || 0} / {kpis?.totalRecyclers || 0}
            </span>
            <span className="text-[10px] text-blue-300">
              {language === 'hi' ? 'अधिकृत क्षमता ट्रैकिंग' : language === 'mr' ? 'अधिकृत क्षमता ट्रॅकिंग' : 'Authorized Capacity Tracking'}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl shadow-inner space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-extrabold uppercase text-[10px]">{language === 'hi' ? 'कुल रीसायकल कचरा' : language === 'mr' ? 'एकूण रीसायकल कचरा' : 'E-Waste Recycled'}</span>
              <span className="text-[9px] font-mono text-emerald-400 font-bold">FORM-6</span>
            </div>
            <span className="text-3xl font-black text-emerald-400 font-mono block mt-1">
              {(kpis?.totalWeightRecycledKg || 0).toLocaleString('en-IN')} kg
            </span>
            <span className="text-[10px] text-emerald-300 font-bold">
              {kpis?.formalRecyclingRatePercent || 0}% {language === 'hi' ? 'औपचारिक पुनर्चक्रण दर' : language === 'mr' ? 'अधिकृत पुनर्प्रक्रिया दर' : 'Formal Diversion Rate'}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl shadow-inner space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-extrabold uppercase text-[10px]">{language === 'hi' ? 'लेजर भुगतान' : language === 'mr' ? 'लेजर पेमेंट' : 'Ledger Settlement'}</span>
              <span className="text-[9px] font-mono text-slate-400 font-bold">VOUCHERS</span>
            </div>
            <span className="text-3xl font-black text-emerald-400 font-mono block mt-1">
              ₹{(kpis?.totalDisbursedValueINR || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {language === 'hi' ? '100% सत्यापन योग्य डबल-एंट्री' : language === 'mr' ? '100% पडताळणीयोग्य डबल-एंट्री' : '100% Traceable Double-Entry'}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Quick Governance Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <Link
          to="/admin/recyclers"
          className="bg-slate-900 hover:bg-slate-850 border-2 border-slate-800 hover:border-blue-500/50 p-5 rounded-3xl shadow-xl flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-2xl border border-blue-500/30">
              🏭
            </div>
            <div>
              <h3 className="font-black text-base text-white">{language === 'hi' ? 'रीसाइक्लर सत्यापन व क्षमता' : language === 'mr' ? 'रिसायकलर पडताळणी व क्षमता' : 'Recycler Gazette Verification'}</h3>
              <p className="text-slate-400 mt-0.5">{language === 'hi' ? 'अनुसूची-1 लाइसेंस व क्षमता ऑडिट' : language === 'mr' ? 'परवाना व क्षमता ऑडिट' : 'Audit Schedule-I licenses & capacity'}</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white" />
        </Link>

        <Link
          to="/admin/anomalies"
          className="bg-slate-900 hover:bg-slate-850 border-2 border-slate-800 hover:border-amber-500/50 p-5 rounded-3xl shadow-xl flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-2xl border border-amber-500/30">
              ⚠️
            </div>
            <div>
              <h3 className="font-black text-base text-white">{language === 'hi' ? 'Z-स्कोर विसंगति विश्लेषक' : language === 'mr' ? 'Z-स्कोर विसंगती विश्लेषक' : 'Z-Score Anomaly Investigator'}</h3>
              <p className="text-slate-400 mt-0.5">{kpis?.openAnomalies || 0} {language === 'hi' ? 'संदेहास्पद वजन/दर मामले' : language === 'mr' ? 'संशयास्पद वजन/दर केसेस' : 'flagged scale/price outliers'}</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white" />
        </Link>

        <Link
          to="/admin/datasets"
          className="bg-slate-900 hover:bg-slate-850 border-2 border-slate-800 hover:border-emerald-500/50 p-5 rounded-3xl shadow-xl flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-2xl border border-emerald-500/30">
              📊
            </div>
            <div>
              <h3 className="font-black text-base text-white">{language === 'hi' ? 'डायनामिक डेटासेट मैनेजर' : language === 'mr' ? 'डायनॅमिक डेटासेट मॅनेजर' : 'Dynamic Dataset Manager'}</h3>
              <p className="text-slate-400 mt-0.5">{language === 'hi' ? 'सीपीसीबी/ईपीआर व YOLO ML डेटा निर्यात' : language === 'mr' ? 'सीपीसीबी/ईपीआर व YOLO डेटा निर्यात' : 'Export CPCB/EPR CSV & YOLO ML manifests'}</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white" />
        </Link>
      </div>

      {/* Material Volume Breakdown Analytics */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>{language === 'hi' ? 'सामग्री संग्रह वितरण (एनालिटिक्स)' : language === 'mr' ? 'साहित्य संकलन विश्लेषण' : 'Material Category Ingestion Analytics'}</span>
          </h2>
          <span className="text-xs text-slate-500 font-bold">{language === 'hi' ? 'कुल 8 श्रेणियां' : language === 'mr' ? 'एकूण ८ प्रकार' : 'Total 8 Categories'}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
          {Object.entries(materialBreakdown)
            .sort(([, a], [, b]) => b - a)
            .map(([cat, weight]) => {
              const pct = kpis?.totalWeightCollectedKg > 0 ? ((weight / kpis.totalWeightCollectedKg) * 100).toFixed(1) : '0';
              const IconComp = CATEGORY_ICONS[cat] || Layers;
              return (
                <div key={cat} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-purple-500/50 space-y-2.5 shadow-inner transition-all group">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-purple-950/80 border border-purple-800 flex items-center justify-center text-purple-300 shrink-0 group-hover:scale-110 transition-transform">
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-black text-slate-200 truncate">{getCategoryLabel(cat, language)}</span>
                    </div>
                    <span className="font-mono text-emerald-400 font-black shrink-0">{pct}%</span>
                  </div>
                  <div className="text-xl font-black text-white font-mono">
                    {Number(weight).toLocaleString('en-IN', { maximumFractionDigits: 1 })} kg
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.max(0, Number(pct)))}%` }}
                      className="bg-gradient-to-r from-purple-600 via-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    ></div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
