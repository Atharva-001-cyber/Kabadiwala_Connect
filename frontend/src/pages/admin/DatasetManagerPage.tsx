import React, { useState, useEffect } from 'react';
import { Database, Download, FileSpreadsheet, FileCode, CheckCircle2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export const DatasetManagerPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [counts, setCounts] = useState<Record<string, number>>({
    transactions: 4,
    materials: 4,
    prices: 8,
    recyclers: 3,
    traceability: 9,
    collectors: 2
  });

  useEffect(() => {
    const fetchLiveCounts = async () => {
      const keys = ['transactions', 'materials', 'prices', 'recyclers', 'traceability', 'collectors'];
      try {
        const results = await Promise.all(
          keys.map(k => fetch(`/api/admin/datasets/${k}`).then(r => r.json()).catch(() => null))
        );
        const updatedCounts: Record<string, number> = {};
        keys.forEach((k, idx) => {
          if (results[idx] && typeof results[idx].recordCount === 'number') {
            updatedCounts[k] = results[idx].recordCount;
          }
        });
        setCounts(prev => ({ ...prev, ...updatedCounts }));
      } catch (err) {
        console.warn('Could not fetch dynamic dataset counts:', err);
      }
    };
    fetchLiveCounts();
  }, []);

  const datasets = [
    {
      id: 'transactions',
      name: {
        hi: 'लेनदेन व भुगतान डेटासेट',
        mr: 'व्यवहार व पेमेंट डेटासेट',
        en: 'Transaction & Settlement Dataset'
      }[language] || 'Transaction & Settlement Dataset',
      desc: {
        hi: 'डिजिटल लॉट आईडी, कलेक्टर आईडी, रीसाइक्लर आईडी, सामग्री, वजन, निस्तारित राशि एवं समय',
        mr: 'डिजिटल लॉट आयडी, संकलक आयडी, रिसायकलर आयडी, साहित्य, वजन, अंतिम रक्कम व वेळ',
        en: 'Lot ID, Collector ID, Recycler ID, Material, Weight, Quoted Price, Final Price, Settled Cash/UPI, Timestamps'
      }[language],
      recordsCount: counts['transactions'] || 4,
      fields: ['Lot ID', 'Collector ID', 'Material', 'Actual Weight', 'Final Price', 'Payment Mode', 'Timestamp']
    },
    {
      id: 'materials',
      name: {
        hi: 'ई-कचरा सामग्री सूची डेटासेट',
        mr: 'ई-कचरा साहित्य सूची डेटासेट',
        en: 'E-Waste Material Catalog Dataset'
      }[language] || 'E-Waste Material Catalog Dataset',
      desc: {
        hi: 'सामग्री श्रेणी, उप-श्रेणी, वजन, स्थिति (साबुत/टूटा), स्रोत प्रकार, जिला व राज्य',
        mr: 'साहित्य श्रेणी, उप-श्रेणी, वजन, स्थिती, स्त्रोत प्रकार, जिल्हा व राज्य',
        en: 'Material category (8 items), Subcategory, Weight, Condition (Intact/Damaged), Source Type, Location District'
      }[language],
      recordsCount: counts['materials'] || 4,
      fields: ['Lot ID', 'Category', 'Condition', 'Source', 'Approx Weight', 'District', 'State']
    },
    {
      id: 'prices',
      name: {
        hi: 'मूल्य निर्धारण व बेंचमार्क दर डेटासेट',
        mr: 'दर निश्चिती व बेंचमार्क डेटासेट',
        en: 'Price Discovery & Benchmark Dataset'
      }[language] || 'Price Discovery & Benchmark Dataset',
      desc: {
        hi: 'प्रचलित खरीद मूल्य, न्यूनतम/अधिकतम दायरा, 7-दिवसीय रुझान प्रतिशत एवं ऐतिहासिक दरें',
        mr: 'प्रचलित खरेदी दर, किमान/कमाल मर्यादा, 7-दिवसांचा कल व ऐतिहासिक दर',
        en: 'Prevailing buying prices, Min/Max range, 7-day trend %, district-wise benchmark historical data'
      }[language],
      recordsCount: counts['prices'] || 8,
      fields: ['Material', 'Prevailing Buy Price', 'Min Price', 'Max Price', 'Trend %', 'District']
    },
    {
      id: 'recyclers',
      name: {
        hi: 'अधिकृत रीसाइक्लर डायरेक्टरी डेटासेट',
        mr: 'अधिकृत रिसायकलर डिरेक्टरी डेटासेट',
        en: 'Authorized Recycler Dataset'
      }[language] || 'Authorized Recycler Dataset',
      desc: {
        hi: 'संयंत्र का नाम, सीपीसीबी पंजीकरण क्रमांक, सत्यापन स्थिति, सेवा त्रिज्या एवं क्षमता',
        mr: 'संयंत्राचे नाव, सीपीसीबी नोंदणी क्रमांक, पडताळणी स्थिती, सेवा क्षेत्र व क्षमता',
        en: 'Facility Name, CPCB Registration No, Authorization Status, GPS Coords, Service Radius, Capacity'
      }[language],
      recordsCount: counts['recyclers'] || 3,
      fields: ['Facility Name', 'CPCB Reg No', 'Status', 'Valid Until', 'District', 'Service Radius Km']
    },
    {
      id: 'traceability',
      name: {
        hi: 'आजीवन ट्रैसेबिलिटी चक्र डेटासेट',
        mr: 'जीवनचक्र ट्रॅसेबिलिटी डेटासेट',
        en: 'Lifecycle Traceability Dataset'
      }[language] || 'Lifecycle Traceability Dataset',
      desc: {
        hi: 'संग्रहण, पिकअप, वर्गीकरण, दुर्लभ धातु निष्कर्षण एवं फॉर्म-6 हरित रीसाइक्लिंग ऑडिट ट्रेल',
        mr: 'संकलन, पिकअप, वर्गीकरण, धातू पुनर्प्राप्ती व फॉर्म-६ ग्रीन रिसायकलिंग ऑडिट ट्रेल',
        en: 'End-to-end chain of custody: Collection, Pickup, Sorting, Hydrometallurgical recovery, and Final Form-6 recycling'
      }[language],
      recordsCount: counts['traceability'] || 9,
      fields: ['Lot ID', 'Stage', 'Title', 'Location', 'Actor Name', 'Actor Role', 'Timestamp']
    },
    {
      id: 'collectors',
      name: {
        hi: 'कलेक्टर व कबाड़ीवाला समुदाय डेटासेट',
        mr: 'कलेक्टर व कबाडीवाला डेटासेट',
        en: 'Collector & Aggregator Dataset'
      }[language] || 'Collector & Aggregator Dataset',
      desc: {
        hi: 'कलेक्टर आईडी, जिला, राज्य, जीवनकाल संग्रहण मात्रा एवं कुल आय (गोपनीयता सुरक्षित)',
        mr: 'संकलक आयडी, जिल्हा, राज्य, एकूण संकलन वजन व एकूण कमाई',
        en: 'Collector ID, District, Lifetime collection volume, Preferred payment method (Privacy sanitized)'
      }[language],
      recordsCount: counts['collectors'] || 2,
      fields: ['Collector ID', 'District', 'State', 'Total Weight Collected', 'Lifetime Earnings']
    }
  ];

  const handleDownload = (name: string, format: 'json' | 'csv') => {
    const url = `/api/admin/datasets/${name}?format=${format}`;
    const filename = `sih229_${name}_dataset.${format}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(
      language === 'hi'
        ? `${name} डेटासेट (${format.toUpperCase()}) डाउनलोड प्रारंभ!`
        : language === 'mr'
        ? `${name} डेटासेट (${format.toUpperCase()}) डाउनलोड सुरू!`
        : `${name} dataset (${format.toUpperCase()}) download started!`,
      'info'
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <span>📊</span>
          <span>{t.adminDatasetTitle}</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          {t.adminDatasetSubtitle}
        </p>
      </div>

      {/* Dataset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {datasets.map((ds) => (
          <div
            key={ds.id}
            className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-5 shadow-xl space-y-4 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white">{ds.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{ds.desc}</p>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-950 text-emerald-300 font-bold text-xs border border-emerald-800 shrink-0">
                {ds.recordsCount} {t.recordsLabel}
              </span>
            </div>

            {/* Field Schema Tags */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                {t.schemaFieldsLabel}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ds.fields.map((f) => (
                  <span key={f} className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 text-[10px] font-mono border border-slate-800">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => handleDownload(ds.id, 'json')}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 shadow transition-all"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span>{t.downloadJsonBtn}</span>
              </button>

              <button
                onClick={() => handleDownload(ds.id, 'csv')}
                className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{t.downloadCsvBtn}</span>
              </button>
            </div>
          </div>
        ))}

        {/* Machine Learning Vision Training Export Card */}
        <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-5 shadow-xl space-y-4 md:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <h3 className="text-base font-black text-white">
                  {language === 'hi'
                    ? 'एआई विजन मॉडल प्रशिक्षण डेटासेट मैनिफेस्ट (YOLO / MobileNet प्रारूप)'
                    : language === 'mr'
                    ? 'एआय व्हिजन मॉडेल प्रशिक्षण डेटासेट मॅनिफेस्ट (YOLO / MobileNet स्वरूप)'
                    : 'AI Vision Model Training Dataset Manifest (YOLO / MobileNet Format)'}
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {language === 'hi'
                  ? 'कलेक्टरों द्वारा अपलोड किए गए वास्तविक स्क्रैप फोटो एवं मानवीय पुष्टिकरण पर आधारित संरचित कंप्यूटर विजन प्रशिक्षण डेटासेट।'
                  : language === 'mr'
                  ? 'संकलकांनी अपलोड केलेल्या स्क्रॅप फोटो व मानवी पुष्टीकरणावर आधारित संगणक दृष्टी प्रशिक्षण डेटासेट.'
                  : 'Structured computer vision training dataset based on informal collector photographs and human-in-the-loop override auditing.'}
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-300 font-bold text-xs border border-emerald-800 shrink-0">
              YOLOv8 & Pascal VOC Ready
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 bg-slate-950 rounded-lg text-slate-300 font-mono text-[11px] border border-slate-800">
              8 Standard Classes: PCB, BATTERY, CRT, LCD, CABLE, MOTOR, MAGNET, MIXED_PLASTIC
            </span>
            <span className="px-2.5 py-1 bg-slate-950 rounded-lg text-emerald-400 font-mono text-[11px] border border-slate-800">
              {language === 'hi' ? 'मानवीय ऑडिटिंग शामिल' : language === 'mr' ? 'मानवी ऑडिट समाविष्ट' : 'Human Override Auditing Included'}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-end">
            <button
              onClick={async () => {
                try {
                  const res = await api.getMLTrainingExport();
                  if (res.success) {
                    const blob = new Blob([JSON.stringify(res.manifest, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'sih229_ml_vision_training_manifest.json';
                    a.click();
                    showToast(
                      language === 'hi'
                        ? 'ML मैनिफेस्ट डाउनलोड प्रारंभ!'
                        : language === 'mr'
                        ? 'ML मॅनिफेस्ट डाउनलोड सुरू!'
                        : 'ML manifest download started!',
                      'success'
                    );
                  }
                } catch (err: any) {
                  showToast(err.message || 'Export failed', 'error');
                }
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow transition-all"
            >
              <Download className="w-4 h-4" />
              <span>
                {language === 'hi'
                  ? 'डाउनलोड ML ट्रेनिंग मैनिफेस्ट'
                  : language === 'mr'
                  ? 'डाउनलोड ML ट्रेनिंग मॅनिफेस्ट'
                  : 'Download ML Training Manifest (YOLO)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

