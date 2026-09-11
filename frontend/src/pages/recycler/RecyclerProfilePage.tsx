import React from 'react';
import { Factory, ShieldCheck, MapPin, Phone, Award, Calendar, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getCategoryLabel } from '../../i18n/translations';

export const RecyclerProfilePage: React.FC = () => {
  const { recyclerProfile, user } = useAuth();
  const { language, t } = useLanguage();

  const profile = recyclerProfile || {
    id: 'rec_1',
    facilityName: 'GreenEarth E-Waste Solutions Pvt Ltd',
    registrationNo: 'CPCB/EWR/UP/LKO/2023/8812',
    authorizationStatus: 'AUTHORIZED',
    authValidUntil: '2027-12-31',
    contactPerson: 'Vikram Mehta',
    contactPhone: '9123456780',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    address: 'Plot 44, UPSIDC Industrial Area, Nadarganj, Lucknow',
    latitude: 26.7825,
    longitude: 80.8712,
    acceptedMaterials: ['PCB', 'BATTERY', 'CRT', 'LCD', 'CABLE', 'MOTOR', 'MAGNET', 'MIXED_PLASTIC'],
    pickupAvailable: true,
    serviceRadiusKm: 45,
    rating: 4.8,
    totalProcessedKg: 14200
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-lg">
              🏭
            </div>
            <div>
              <h1 className="text-xl font-black text-white">{profile.facilityName}</h1>
              <p className="text-xs font-mono text-blue-400 font-bold">{profile.registrationNo}</p>
              <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                <ShieldCheck className="w-3 h-3" />
                <span>{language === 'hi' ? 'प्लेटफॉर्म-प्रबंधित अधिकृत रीसाइक्लर' : language === 'mr' ? 'प्लॅटफॉर्म-व्यवस्थापित अधिकृत रिसायकलर' : 'Platform-Managed Authorization'}</span>
              </div>
            </div>
          </div>

          <div className="text-right self-start sm:self-center bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 block">{language === 'hi' ? 'लाइसेंस वैधता अवधि' : language === 'mr' ? 'परवाना वैधता' : 'Authorization Valid Until'}</span>
            <span className="text-sm font-mono font-black text-emerald-400">{profile.authValidUntil}</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block">{language === 'hi' ? 'अधिकृत संपर्क अधिकारी' : language === 'mr' ? 'अधिकृत संपर्क अधिकारी' : 'Contact Officer'}</span>
            <span className="font-bold text-white text-sm">{profile.contactPerson}</span>
            <span className="text-slate-400 block font-mono">{profile.contactPhone}</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block">{language === 'hi' ? 'फैक्ट्री स्थान एवं GPS' : language === 'mr' ? 'कारखाना ठिकाण व GPS' : 'Facility Location & GPS'}</span>
            <span className="font-bold text-white text-sm">{profile.address}</span>
            <span className="text-slate-400 block font-mono">{profile.latitude}° N, {profile.longitude}° E</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block">{language === 'hi' ? 'डोरस्टेप पिकअप लॉजिस्टिक्स' : language === 'mr' ? 'पिकअप लॉजिस्टिक्स' : 'Doorstep Pickup Logistics'}</span>
            <span className="font-bold text-emerald-400 text-sm">{profile.pickupAvailable ? (language === 'hi' ? 'सक्रिय' : language === 'mr' ? 'सक्रिय' : 'Active') : (language === 'hi' ? 'स्वयं डिलीवरी' : language === 'mr' ? 'स्वतः डिलिव्हरी' : 'Self-delivery')}</span>
            <span className="text-slate-400 block">{language === 'hi' ? 'सेवा दायरा:' : language === 'mr' ? 'सेवा क्षेत्र:' : 'Service Radius:'} {profile.serviceRadiusKm} km</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block">{language === 'hi' ? 'कुल प्रमाणित रीसाइक्लिंग' : language === 'mr' ? 'एकूण प्रमाणित रीसायकलिंग' : 'Total Certified Recycling'}</span>
            <span className="font-bold text-emerald-400 text-sm">{(profile.totalProcessedKg / 1000).toFixed(1)} {language === 'hi' ? 'मीट्रिक टन' : language === 'mr' ? 'मेट्रिक टन' : 'Metric Tons'}</span>
            <span className="text-slate-400 block">{language === 'hi' ? 'रेटिंग:' : language === 'mr' ? 'रेटिंग:' : 'Rating:'} ★ {profile.rating} / 5.0</span>
          </div>
        </div>

        {/* Accepted Materials Badges */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            {language === 'hi' ? 'अधिकृत सामग्री श्रेणियां:' : language === 'mr' ? 'अधिकृत साहित्य प्रकार:' : 'Authorized Materials Categories:'}
          </span>
          <div className="flex flex-wrap gap-2">
            {profile.acceptedMaterials.map((mat) => (
              <span
                key={mat}
                className="px-3 py-1 rounded-xl bg-slate-950 text-slate-200 text-xs font-bold border border-slate-800"
              >
                {getCategoryLabel(mat, language)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
