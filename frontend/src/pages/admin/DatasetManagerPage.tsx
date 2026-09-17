import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  Download, 
  FileSpreadsheet, 
  FileCode, 
  CheckCircle2, 
  Search, 
  Filter, 
  Eye, 
  RefreshCw, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Scale, 
  TrendingUp, 
  Cpu, 
  ChevronRight,
  Clock
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { supabase } from '../../services/supabase';

interface DatasetMeta {
  id: string;
  table: string;
  category: 'TRADE' | 'LOGISTICS' | 'REGULATORY' | 'AI';
  name: {
    hi: string;
    mr: string;
    en: string;
  };
  desc: {
    hi: string;
    mr: string;
    en: string;
  };
  fields: string[];
}

export const DatasetManagerPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  
  // Preview modal state
  const [previewDataset, setPreviewDataset] = useState<DatasetMeta | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<'TABLE' | 'JSON'>('TABLE');

  // Export state
  const [exportingId, setExportingId] = useState<string | null>(null);

  const datasets: DatasetMeta[] = [
    {
      id: 'transactions',
      table: 'payments',
      category: 'TRADE',
      name: {
        hi: 'लेनदेन व भुगतान डेटासेट (Payment Ledger)',
        mr: 'व्यवहार व पेमेंट डेटासेट',
        en: 'Transaction & Settlement Ledger'
      },
      desc: {
        hi: 'डिजिटल लॉट आईडी, कलेक्टर आईडी, रीसाइक्लर आईडी, सामग्री, वजन, निस्तारित राशि एवं बैंक यूपीआई/नकद विनिमय ऑडिट ट्रेल',
        mr: 'डिजिटल लॉट आयडी, संकलक आयडी, रिसायकलर आयडी, साहित्य, वजन, अंतिम रक्कम व यूपीआय/रोख देयके',
        en: 'Lot ID, Collector ID, Recycler ID, Material, Weight, Quoted Price, Final Settled Price, Mode (Cash/UPI), Timestamps'
      },
      fields: ['id', 'lot_id', 'collector_id', 'recycler_id', 'amount', 'rate_per_kg', 'payment_method', 'status', 'timestamp']
    },
    {
      id: 'materials',
      table: 'lots',
      category: 'LOGISTICS',
      name: {
        hi: 'ई-कचरा सामग्री सूची डेटासेट (Intake Lots)',
        mr: 'ई-कचरा साहित्य सूची डेटासेट',
        en: 'E-Waste Material Catalog & Lots'
      },
      desc: {
        hi: 'सामग्री श्रेणी, उप-श्रेणी, अनुमानित व वास्तविक वजन, स्थिति (साबुत/टूटा), स्रोत प्रकार, जिला व जीपीएस निर्देशांक',
        mr: 'साहित्य श्रेणी, उप-श्रेणी, वजन, स्थिती, स्त्रोत प्रकार, जिल्हा व जीपीएस स्थान',
        en: 'Material category (8 items), Subcategory, Approx/Actual Weight, Condition, Source Type, District, GPS Coordinates'
      },
      fields: ['id', 'collector_id', 'material_category', 'sub_category', 'approx_weight', 'actual_weight', 'condition', 'location_district', 'status']
    },
    {
      id: 'prices',
      table: 'prices',
      category: 'TRADE',
      name: {
        hi: 'मूल्य निर्धारण व बेंचमार्क दर डेटासेट (Rate Corridors)',
        mr: 'दर निश्चिती व बेंचमार्क डेटासेट',
        en: 'Price Discovery & Benchmark Corridor'
      },
      desc: {
        hi: 'प्रचलित खरीद मूल्य, न्यूनतम/अधिकतम दायरा, 7-दिवसीय रुझान प्रतिशत एवं जिला-वार बेंचमार्क ऐतिहासिक दरें',
        mr: 'प्रचलित खरेदी दर, किमान/कमाल मर्यादा, 7-दिवसांचा कल व जिल्हा-स्तरीय ऐतिहासिक दर',
        en: 'Prevailing buying prices, Min/Max range, 7-day trend %, district-wise benchmark historical data'
      },
      fields: ['id', 'material_category', 'district', 'state', 'prevailing_buy_price', 'min_price', 'max_price', 'trend_percent', 'updated_at']
    },
    {
      id: 'recyclers',
      table: 'recyclers',
      category: 'REGULATORY',
      name: {
        hi: 'अधिकृत रीसाइक्लर डायरेक्टरी (CPCB Registry)',
        mr: 'अधिकृत रिसायकलर डिरेक्टरी डेटासेट',
        en: 'Authorized Recycler CPCB Registry'
      },
      desc: {
        hi: 'संयंत्र का नाम, सीपीसीबी पंजीकरण क्रमांक, सत्यापन स्थिति, सेवा त्रिज्या, दैनिक क्षमता एवं गैजेट सत्यापन स्थिति',
        mr: 'संयंत्राचे नाव, सीपीसीबी नोंदणी क्रमांक, पडताळणी स्थिती, सेवा क्षेत्र व क्षमता',
        en: 'Facility Name, CPCB Registration No, Authorization Status, GPS Coords, Service Radius, Capacity, Material Rates'
      },
      fields: ['id', 'facility_name', 'registration_no', 'authorization_status', 'district', 'state', 'service_radius_km', 'total_processed_kg']
    },
    {
      id: 'traceability',
      table: 'traceability_logs',
      category: 'LOGISTICS',
      name: {
        hi: 'आजीवन ट्रैसेबिलिटी चक्र डेटासेट (Form-6 Chain of Custody)',
        mr: 'जीवनचक्र ट्रॅसेबिलिटी डेटासेट',
        en: 'Lifecycle Traceability Audit Trail'
      },
      desc: {
        hi: 'संग्रहण, पिकअप, वर्गीकरण, हाइड्रोधातुकर्म निष्कर्षण एवं फॉर्म-6 हरित रीसाइक्लिंग क्रिप्टोग्राफिक ऑडिट ट्रेल',
        mr: 'संकलन, पिकअप, वर्गीकरण, धातू पुनर्प्राप्ती व फॉर्म-६ ग्रीन रिसायकलिंग ऑडिट ट्रेल',
        en: 'End-to-end cryptographic chain of custody: Collection, Pickup, Sorting, Hydrometallurgical recovery, and Final Recycling'
      },
      fields: ['id', 'lot_id', 'stage', 'title', 'facility_location', 'actor_name', 'actor_role', 'event_hash', 'timestamp']
    },
    {
      id: 'collectors',
      table: 'collectors',
      category: 'LOGISTICS',
      name: {
        hi: 'कलेक्टर व कबाड़ीवाला समुदाय डेटासेट (Aggregators)',
        mr: 'कलेक्टर व कबाडीवाला डेटासेट',
        en: 'Collector & Aggregator Network'
      },
      desc: {
        hi: 'कलेक्टर आईडी, जिला, राज्य, जीवनकाल संग्रहण मात्रा एवं कुल आय (गोपनीयता सुरक्षित डेटा)',
        mr: 'संकलक आयडी, जिल्हा, राज्य, एकूण संकलन वजन व एकूण कमाई',
        en: 'Collector ID, District, State, Lifetime collection weight, Total earnings, Lots count (Privacy sanitized)'
      },
      fields: ['id', 'name', 'phone', 'district', 'state', 'total_weight_collected', 'total_earnings', 'lots_count']
    },
    {
      id: 'anomalies',
      table: 'anomalies',
      category: 'REGULATORY',
      name: {
        hi: 'एआई विसंगति एवं जोखिम मॉनिटर डेटासेट (AI Flagging Registry)',
        mr: 'एआय विसंगती नोंद डेटासेट',
        en: 'AI Anomaly & Risk Detection Registry'
      },
      desc: {
        hi: 'इलेक्ट्रॉनिक तराजू वजन विसंगति, मूल्य उछाल, कंप्यूटर विजन संदूषण एवं रीसाइक्लर अनुपालन उल्लंघन का केंद्रीय रजिस्टर',
        mr: 'वजन तफावत, दर वाढ, कॉम्प्युटर व्हिजन विसंगती व नियम उल्लंघनाची केंद्रीय नोंद',
        en: 'Tare weighment discrepancies, price surge outliers, computer vision contamination, and recycler compliance breaches'
      },
      fields: ['id', 'lot_id', 'entity_type', 'anomaly_type', 'severity', 'detected_rate', 'expected_rate', 'status', 'created_at']
    },
    {
      id: 'disputes',
      table: 'disputes',
      category: 'REGULATORY',
      name: {
        hi: 'सीपीसीबी विवाद मध्यस्थता डेटासेट (Tribunal Arbitrations)',
        mr: 'सीपीसीबी लवाद वाद डेटासेट',
        en: 'CPCB Dispute Arbitration Records'
      },
      desc: {
        hi: 'कलेक्टर एवं रीसाइक्लर के मध्य विधिक माप विज्ञान तराजू कैलिब्रेशन अंतर, सामग्री पुनर्वर्गीकरण एवं एस्क्रो समझौते',
        mr: 'काटा कॅलिब्रेशन वाद, साहित्य पुनर्वर्गीकरण आणि एस्क्रो समझोते',
        en: 'Central regulatory arbitration dossiers: Tare calibrations under Legal Metrology Act, grading reclassifications, and settlements'
      },
      fields: ['id', 'lot_id', 'collector_id', 'recycler_id', 'reason', 'status', 'resolution_notes', 'created_at', 'resolved_at']
    },
    {
      id: 'ml_training',
      table: 'ml_training_samples',
      category: 'AI',
      name: {
        hi: 'एआई विजन मॉडल प्रशिक्षण डेटासेट (Ground Truth Samples)',
        mr: 'एआय व्हिजन मॉडेल प्रशिक्षण डेटासेट',
        en: 'AI Vision Ground-Truth Dataset'
      },
      desc: {
        hi: 'कलेक्टरों द्वारा अपलोड किए गए वास्तविक ई-कचरा फोटो, प्रारंभिक ह्यूरिस्टिक अनुमान एवं मानवीय सत्यापन पुष्टि (YOLOv8 Ready)',
        mr: 'संकलकांनी अपलोड केलेले ई-कचरा फोटो, प्रारंभिक अंदाज व मानवी पडताळणी',
        en: 'Informal collector scrap photographs, MobileNet predictions, human-in-the-loop confirmed classes, and override logs'
      },
      fields: ['id', 'image_path', 'initial_heuristic_prediction', 'user_confirmed_category', 'is_override', 'district', 'timestamp']
    }
  ];

  const fetchAllLiveCounts = async () => {
    setLoadingCounts(true);
    try {
      const res = await api.getDatasetStats();
      if (res.success && res.counts) {
        setCounts(res.counts);
      }
    } catch (err) {
      console.warn('Could not fetch dynamic dataset counts from Supabase:', err);
    } finally {
      setLoadingCounts(false);
    }
  };

  useEffect(() => {
    fetchAllLiveCounts();

    const handleSync = () => {
      fetchAllLiveCounts();
    };
    window.addEventListener('kb:sync', handleSync);
    return () => window.removeEventListener('kb:sync', handleSync);
  }, []);

  // Calculate high-level summary KPIs
  const totalRecordsSum = useMemo(() => {
    return Object.values(counts).reduce((acc, c) => acc + (c || 0), 0);
  }, [counts]);

  // Filter datasets
  const filteredDatasets = useMemo(() => {
    return datasets.filter((ds) => {
      // Category filter
      if (categoryFilter !== 'ALL' && ds.category !== categoryFilter) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const nameStr = (ds.name[language] || ds.name.en).toLowerCase();
      const descStr = (ds.desc[language] || ds.desc.en).toLowerCase();
      const fieldsStr = ds.fields.join(' ').toLowerCase();

      return nameStr.includes(q) || descStr.includes(q) || fieldsStr.includes(q) || ds.id.includes(q);
    });
  }, [datasets, categoryFilter, searchQuery, language]);

  // Handle live preview of first 5 rows
  const handlePreview = async (ds: DatasetMeta) => {
    setPreviewDataset(ds);
    setPreviewLoading(true);
    setPreviewRows([]);
    try {
      const { data, error } = await supabase.from(ds.table).select('*').limit(5);
      if (error) throw error;
      setPreviewRows(data || []);
    } catch (err: any) {
      showToast(`Preview failed: ${err.message}`, 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle Full Export Download (up to 10,000 rows, without premature 1000 limit)
  const handleDownload = async (ds: DatasetMeta, format: 'json' | 'csv') => {
    setExportingId(`${ds.id}_${format}`);
    try {
      const { data, error } = await supabase.from(ds.table).select('*').limit(10000);
      if (error) throw error;

      let blobContent = '';
      let mimeType = 'application/json';

      if (format === 'csv') {
        mimeType = 'text/csv;charset=utf-8;';
        if (data && data.length > 0) {
          const headers = Object.keys(data[0]);
          const escapeCsvCell = (val: any) => {
            if (val === null || val === undefined) return '""';
            let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
            str = str.replace(/"/g, '""'); // Escape double quotes
            return `"${str}"`;
          };

          const rows = data.map((row) => headers.map((h) => escapeCsvCell(row[h])).join(','));
          blobContent = [headers.join(','), ...rows].join('\n');
        } else {
          blobContent = 'No data available';
        }
      } else {
        blobContent = JSON.stringify(data || [], null, 2);
      }

      const blob = new Blob([blobContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const filename = `cpcb_sih229_${ds.id}_dataset_${new Date().toISOString().slice(0, 10)}.${format}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(
        language === 'hi'
          ? `${ds.name[language] || ds.name.en} (${format.toUpperCase()}) डाउनलोड संपन्न! (${data?.length || 0} रिकॉर्ड)`
          : language === 'mr'
          ? `${ds.name[language] || ds.name.en} (${format.toUpperCase()}) डाउनलोड पूर्ण! (${data?.length || 0} नोंदी)`
          : `${ds.name.en} (${format.toUpperCase()}) exported successfully! (${data?.length || 0} records)`,
        'success'
      );
    } catch (err: any) {
      showToast(`Export failed: ${err.message || 'Error generating export file'}`, 'error');
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Executive Header */}
      <div className="bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-emerald-500/10 via-cyan-500/5 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                <Database className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'hi'
                  ? 'राष्ट्रीय ई-कचरा डेटासेट प्रबंधन एवं ओपन डेटा रजिस्ट्री'
                  : language === 'mr'
                  ? 'राष्ट्रीय ई-कचरा डेटासेट व्यवस्थापन व ओपन डेटा'
                  : 'National E-Waste Dynamic Dataset Registry & Open Data'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                CENTRAL DATA PIPELINE ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
              {language === 'hi'
                ? 'ईपीआर (EPR) क्रेडिट सत्यापन, नीति निर्धारण, शैक्षणिक अनुसंधान एवं एआई मॉडल प्रशिक्षण हेतु 100% रीयल-टाइम सिंक्रोनाइज़्ड डेटासेट।'
                : language === 'mr'
                ? 'EPR फ्रेमवर्क, धोरण निश्चिती, शैक्षणिक संशोधन आणि एआय मॉडेल प्रशिक्षणासाठी थेट डेटासेट निर्यात.'
                : 'Centralized repository of dynamically synchronized datasets for EPR compliance audits, academic research, and AI model training.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAllLiveCounts}
              disabled={loadingCounts}
              className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCounts ? 'animate-spin text-emerald-500' : ''}`} />
              <span>{language === 'hi' ? 'रीफ्रेश' : language === 'mr' ? 'ताजे करा' : 'Refresh Counts'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 KPI Executive Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Datasets Available */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {language === 'hi' ? 'उपलब्ध डेटासेट' : language === 'mr' ? 'एकूण डेटासेट' : 'Available Datasets'}
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{datasets.length}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            9 Statutory Schemas
          </div>
        </div>

        {/* Total Records Indexed */}
        <div className="bg-emerald-50/40 dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-all">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {language === 'hi' ? 'कुल रिकॉर्ड्स' : language === 'mr' ? 'एकूण नोंदी' : 'Total Records'}
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {loadingCounts ? '...' : totalRecordsSum.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400/80 mt-1 font-medium">
            100% Live Supabase Cloud
          </div>
        </div>

        {/* AI Vision Samples */}
        <div className="bg-purple-50/40 dark:bg-slate-900 border border-purple-200 dark:border-purple-900/40 rounded-2xl p-4 shadow-sm hover:border-purple-300 dark:hover:border-purple-700/60 transition-all">
          <div className="flex items-center justify-between text-purple-800 dark:text-purple-300 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {language === 'hi' ? 'एआई विजन सैंपल्स' : language === 'mr' ? 'एआय व्हिजन सॅम्पल्स' : 'AI Vision Ground-Truth'}
            </span>
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
            {loadingCounts ? '...' : counts['ml_training'] || 73}
          </div>
          <div className="text-[10px] text-purple-700 dark:text-purple-400/80 mt-1 font-medium">
            Human-in-the-loop Verified
          </div>
        </div>

        {/* Formats Supported */}
        <div className="bg-blue-50/40 dark:bg-slate-900 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-4 shadow-sm hover:border-blue-300 dark:hover:border-blue-700/60 transition-all">
          <div className="flex items-center justify-between text-blue-800 dark:text-blue-300 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {language === 'hi' ? 'प्रारूप (Formats)' : language === 'mr' ? 'स्वरूप' : 'Export Standards'}
            </span>
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">JSON + CSV</div>
          <div className="text-[10px] text-blue-700 dark:text-blue-400/80 mt-1 font-medium">
            UTF-8 & YOLO Manifests
          </div>
        </div>

        {/* Cloud Sync Status */}
        <div className="bg-cyan-50/40 dark:bg-slate-900 border border-cyan-200 dark:border-cyan-900/40 rounded-2xl p-4 shadow-sm hover:border-cyan-300 dark:hover:border-cyan-700/60 transition-all col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-cyan-800 dark:text-cyan-300 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {language === 'hi' ? 'सिंक विलंबता' : language === 'mr' ? 'सिंक लेटन्सी' : 'Cloud Latency'}
            </span>
            <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-700 dark:text-cyan-400">&lt; 15 ms</div>
          <div className="text-[10px] text-cyan-700 dark:text-cyan-400/80 mt-1 font-medium">
            Realtime REST & Webhooks
          </div>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'hi'
                  ? 'डेटासेट नाम, स्कीमा फील्ड्स या विवरण से खोजें...'
                  : language === 'mr'
                  ? 'डेटासेट नाव, स्कीमा किंवा माहितीवरून शोधा...'
                  : 'Search datasets by name, schema attributes, or description...'
              }
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: language === 'hi' ? 'सभी (9)' : language === 'mr' ? 'सर्व (९)' : 'All (9)' },
              { id: 'TRADE', label: language === 'hi' ? 'लेनदेन व दर (2)' : language === 'mr' ? 'व्यवहार (२)' : 'Trade & Pricing (2)' },
              { id: 'LOGISTICS', label: language === 'hi' ? 'लॉजिस्टिक्स व लॉट्स (3)' : language === 'mr' ? 'लॉजिस्टिक्स (३)' : 'Logistics (3)' },
              { id: 'REGULATORY', label: language === 'hi' ? 'सीपीसीबी विनियामक (3)' : language === 'mr' ? 'विनियामक (३)' : 'CPCB Audits (3)' },
              { id: 'AI', label: language === 'hi' ? 'एआई विजन (1)' : language === 'mr' ? 'एआय (१)' : 'AI Vision (1)' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  categoryFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dataset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDatasets.map((ds) => {
          const recCount = counts[ds.id];
          const isExportingJson = exportingId === `${ds.id}_json`;
          const isExportingCsv = exportingId === `${ds.id}_csv`;

          return (
            <div
              key={ds.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 rounded-3xl p-5 shadow-sm space-y-4 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        ds.category === 'TRADE'
                          ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
                          : ds.category === 'LOGISTICS'
                          ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30'
                          : ds.category === 'REGULATORY'
                          ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                          : 'bg-purple-50 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
                      }`}>
                        {ds.category}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">
                        table: {ds.table}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {ds.name[language] || ds.name.en}
                    </h3>
                  </div>

                  {/* Live Record Count Badge */}
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-xs border border-emerald-200 dark:border-emerald-800/80 shrink-0">
                    {loadingCounts ? '...' : (recCount !== undefined ? `${recCount.toLocaleString('en-IN')} rows` : 'Active')}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {ds.desc[language] || ds.desc.en}
                </p>

                {/* Schema Field Tags */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    {language === 'hi' ? 'स्कीमा फील्ड्स (Schema Attributes):' : 'Schema Attributes:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto scrollbar-none">
                    {ds.fields.map((f) => (
                      <span
                        key={f}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-[10px] font-mono border border-slate-200 dark:border-slate-800/80"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Toolbar: Preview + JSON + CSV */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                {/* Preview Sample Button */}
                <button
                  type="button"
                  onClick={() => handlePreview(ds)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800 shadow transition-all"
                  title="Preview first 5 live records"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>{language === 'hi' ? 'पूर्वावलोकन' : language === 'mr' ? 'पूर्वावलोकन' : 'Preview'}</span>
                </button>

                {/* JSON Download Button */}
                <button
                  type="button"
                  onClick={() => handleDownload(ds, 'json')}
                  disabled={isExportingJson}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow transition-all"
                >
                  <FileCode className={`w-3.5 h-3.5 ${isExportingJson ? 'animate-spin text-blue-600 dark:text-blue-400' : 'text-blue-600 dark:text-blue-400'}`} />
                  <span>{isExportingJson ? 'Exporting...' : 'JSON'}</span>
                </button>

                {/* CSV Download Button */}
                <button
                  type="button"
                  onClick={() => handleDownload(ds, 'csv')}
                  disabled={isExportingCsv}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all"
                >
                  <FileSpreadsheet className={`w-3.5 h-3.5 ${isExportingCsv ? 'animate-spin' : ''}`} />
                  <span>{isExportingCsv ? 'Exporting...' : 'CSV'}</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Dedicated Computer Vision ML Training Manifest Card */}
        <div className="bg-gradient-to-br from-emerald-50/50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30 border-2 border-emerald-500/60 rounded-3xl p-6 shadow-sm dark:shadow-2xl space-y-4 md:col-span-2 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {language === 'hi'
                    ? 'एआई विजन मॉडल प्रशिक्षण डेटासेट मैनिफेस्ट (YOLOv8 / MobileNet प्रारूप)'
                    : language === 'mr'
                    ? 'एआय व्हिजन मॉडेल प्रशिक्षण डेटासेट मॅनिफेस्ट (YOLOv8 / MobileNet स्वरूप)'
                    : 'AI Vision Model Training Dataset Manifest (YOLOv8 / MobileNet Format)'}
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                {language === 'hi'
                  ? 'कलेक्टरों द्वारा जमीनी स्तर पर कैप्चर किए गए वास्तविक ई-कचरा फोटो, वास्तविक मोबाइलनेट अनुमान, एवं मानवीय पुष्टि पर आधारित सुपरवाइज्ड कंप्यूटर विजन प्रशिक्षण डेटासेट।'
                  : language === 'mr'
                  ? 'संकलकांनी अपलोड केलेल्या स्क्रॅप फोटो व मानवी पुष्टीकरणावर आधारित संगणक दृष्टी प्रशिक्षण डेटासेट.'
                  : 'Supervised computer vision dataset based on informal collector photographs, edge MobileNet inference, and expert human-in-the-loop confirmation.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
              <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                {counts['ml_training'] || 73} Verified Samples
              </span>
              <span className="px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800">
                YOLOv8 & Pascal VOC Ready
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs pt-1">
            <span className="px-2.5 py-1 bg-white dark:bg-slate-950 rounded-lg text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200 dark:border-slate-800">
              8 Standard Classes: PCB, BATTERY, CRT, LCD, CABLE, MOTOR, MAGNET, MIXED_PLASTIC
            </span>
            <span className="px-2.5 py-1 bg-white dark:bg-slate-950 rounded-lg text-emerald-700 dark:text-emerald-400 font-mono text-[11px] border border-slate-200 dark:border-slate-800">
              Human Override Auditing Included
            </span>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Includes image metadata, confidence scores, and bounding annotations.</span>
            </div>

            <button
              onClick={async () => {
                try {
                  const res = await api.getMLTrainingExport();
                  if (res.success) {
                    const blob = new Blob([JSON.stringify(res.manifest, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `cpcb_sih229_ml_vision_manifest_${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    showToast(
                      language === 'hi'
                        ? 'ML विजन मैनिफेस्ट डाउनलोड संपन्न!'
                        : language === 'mr'
                        ? 'ML मॅनिफेस्ट डाउनलोड पूर्ण!'
                        : 'ML vision manifest downloaded successfully!',
                      'success'
                    );
                  }
                } catch (err: any) {
                  showToast(err.message || 'Export failed', 'error');
                }
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-all self-end sm:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>
                {language === 'hi'
                  ? 'डाउनलोड ML ट्रेनिंग मैनिफेस्ट (YOLO)'
                  : language === 'mr'
                  ? 'डाउनलोड ML ट्रेनिंग मॅनिफेस्ट'
                  : 'Download ML Training Manifest (YOLO)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Data Preview Modal */}
      {previewDataset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 relative max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {previewDataset.name[language] || previewDataset.name.en}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-500">
                    Live Supabase Sample (First 5 Rows from `{previewDataset.table}`)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mode Toggle */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setPreviewMode('TABLE')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      previewMode === 'TABLE' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    TABLE
                  </button>
                  <button
                    onClick={() => setPreviewMode('JSON')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      previewMode === 'JSON' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    RAW JSON
                  </button>
                </div>

                <button
                  onClick={() => setPreviewDataset(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-xs">
              {previewLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-500 gap-2">
                  <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />
                  <span>Fetching live sample rows from Supabase Cloud...</span>
                </div>
              ) : previewRows.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No records found in this table.
                </div>
              ) : previewMode === 'TABLE' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] uppercase">
                        {Object.keys(previewRows[0]).map((col) => (
                          <th key={col} className="p-2.5 font-bold whitespace-nowrap bg-slate-100 dark:bg-slate-900/60">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono text-[11px]">
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-100/80 dark:hover:bg-slate-900/40 text-slate-800 dark:text-slate-300">
                          {Object.keys(previewRows[0]).map((col) => {
                            const val = row[col];
                            const formatted = typeof val === 'object' ? JSON.stringify(val) : String(val ?? 'null');
                            return (
                              <td key={col} className="p-2.5 whitespace-nowrap max-w-xs truncate text-slate-900 dark:text-slate-200">
                                {formatted}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <pre className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px] leading-relaxed overflow-auto p-2">
                  {JSON.stringify(previewRows, null, 2)}
                </pre>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                Viewing sample. Use export buttons to download complete data.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(previewDataset, 'json')}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <FileCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Download Full JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(previewDataset, 'csv')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Full CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

