import React, { useState, useEffect } from 'react';
import { MapPin, Factory, ShieldCheck, Layers, Users } from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export const EwasteGeoMapPage: React.FC = () => {
  const { language } = useLanguage();
  const [mapData, setMapData] = useState<any>(null);
  const [selectedCluster, setSelectedCluster] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMap = async () => {
      setLoading(true);
      try {
        const res = await api.getAdminMapData();
        if (res.success) {
          setMapData(res);
          if (res.collectionClusters.length > 0) {
            setSelectedCluster(res.collectionClusters[0]);
          }
        }
      } catch (err) {
        console.warn('Map data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMap();
  }, []);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <span>🗺️</span>
          <span>
            {language === 'hi'
              ? 'राष्ट्रीय ई-कचरा जीआईएस मैप'
              : language === 'mr'
              ? 'राष्ट्रीय ई-कचरा जीआयएस नकाशा'
              : 'National E-Waste GIS Activity Map'}
          </span>
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          {language === 'hi'
            ? 'क्षेत्रीय ई-कचरा संग्रह घनत्व एवं अधिकृत रीसाइक्लिंग हब का भौगोलिक विश्लेषण'
            : language === 'mr'
            ? 'प्रादेशिक ई-कचरा संकलन घनता आणि अधिकृत पुनर्प्रक्रिया केंद्रांचे भौगोलिक विश्लेषण'
            : 'Geographic telemetry and density analysis of regional e-waste collection and authorized recycling plants'}
        </p>
      </div>

      {/* Map Simulation & District Cluster Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Map Canvas Representation */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>
                {language === 'hi'
                  ? 'भारत ई-कचरा हॉटस्पॉट'
                  : language === 'mr'
                  ? 'भारत ई-कचरा हॉटस्पॉट'
                  : 'India E-Waste Hotspots (Geographic Density Radar)'}
              </span>
            </span>
            <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
              Live CPCB Telemetry
            </span>
          </div>

          {/* Interactive Visual Radar Grid */}
          <div className="w-full h-80 bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden flex items-center justify-center p-4">
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-20"></div>

            {/* Simulated Nodes across India Grid */}
            {mapData?.collectionClusters.map((cluster: any, idx: number) => {
              const positions: Record<string, { top: string; left: string }> = {
                Lucknow: { top: '38%', left: '52%' },
                Pune: { top: '65%', left: '38%' },
                Nagpur: { top: '55%', left: '48%' },
                'Delhi NCR': { top: '28%', left: '44%' },
                Bengaluru: { top: '78%', left: '42%' }
              };
              const pos = positions[cluster.district] || { top: '50%', left: '50%' };
              const isSelected = selectedCluster?.district === cluster.district;

              return (
                <button
                  key={cluster.district}
                  type="button"
                  onClick={() => setSelectedCluster(cluster)}
                  style={{ top: pos.top, left: pos.left }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-all ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'
                  }`}
                >
                  <div className="relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg border-2 ${
                      isSelected ? 'bg-emerald-500 text-slate-950 border-white ring-4 ring-emerald-500/30' : 'bg-slate-900 text-emerald-400 border-emerald-500'
                    }`}>
                      📦
                    </div>
                  </div>
                  <span className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded bg-slate-900/90 text-white font-bold text-[10px] border border-slate-700 shadow-md">
                    {cluster.district} ({cluster.totalWeightKg} kg)
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>
                {language === 'hi'
                  ? 'संग्रह हब'
                  : language === 'mr'
                  ? 'संकलन केंद्र'
                  : 'Collection Hotspot'}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
              <span>
                {language === 'hi'
                  ? 'अधिकृत रीसाइक्लिंग प्लांट'
                  : language === 'mr'
                  ? 'अधिकृत पुनर्प्रक्रिया प्रकल्प'
                  : 'Recycling Facility'}
              </span>
            </span>
          </div>
        </div>

        {/* Selected Cluster Detail Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>
              {language === 'hi'
                ? 'जिला गतिविधि विश्लेषण'
                : language === 'mr'
                ? 'जिल्हा उपक्रम विश्लेषण'
                : 'District Activity Analysis'}
            </span>
          </h3>

          {selectedCluster ? (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-500 block">
                  {language === 'hi' ? 'चयनित जिला' : language === 'mr' ? 'निवडलेला जिल्हा' : 'Selected District'}
                </span>
                <h4 className="text-lg font-black text-white">{selectedCluster.district}, {selectedCluster.state}</h4>
                <p className="text-slate-400 font-mono">GPS: {selectedCluster.lat}° N, {selectedCluster.lng}° E</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">
                    {language === 'hi' ? 'सक्रिय कलेक्टर' : language === 'mr' ? 'सक्रिय संकलक' : 'Active Collectors'}
                  </span>
                  <span className="font-bold text-white text-base">{selectedCluster.activeCollectors}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">
                    {language === 'hi' ? 'कुल जमा वजन' : language === 'mr' ? 'एकूण संकलित वजन' : 'Total Scrap Weight'}
                  </span>
                  <span className="font-bold text-emerald-400 text-base">{selectedCluster.totalWeightKg} kg</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">
                  {language === 'hi' ? 'पंजीकृत डिजिटल लॉट्स' : language === 'mr' ? 'नोंदणीकृत डिजिटल लॉट्स' : 'Registered Digital Lots'}
                </span>
                <span className="font-bold text-white text-base">{selectedCluster.totalLots}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'नक्शे पर किसी भी जिले पर क्लिक करें।'
                : language === 'mr'
                ? 'नकाशावरील कोणत्याही जिल्ह्यावर क्लिक करा.'
                : 'Click any district node on the radar grid to view details.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
