import React, { useState, useEffect } from 'react';
import { 
  Factory, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Award, 
  Calendar, 
  Layers, 
  Edit3, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Download, 
  Truck, 
  UserCheck, 
  Mail, 
  Sparkles, 
  TrendingUp, 
  Save, 
  Loader2 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { MaterialCategory, RecyclerProfile } from '../../types';
import { getCategoryLabel, formatUserDisplayName, formatAddressLocation } from '../../i18n/translations';

const ALL_CATEGORIES: MaterialCategory[] = [
  'PCB',
  'BATTERY',
  'CABLE',
  'MOTOR',
  'LCD',
  'MAGNET',
  'CRT',
  'MIXED_PLASTIC'
];

export const RecyclerProfilePage: React.FC = () => {
  const { recyclerProfile, user, refreshUser } = useAuth();
  const { language, t } = useLanguage();
  const { showToast } = useToast();

  const myRecyclerId = recyclerProfile?.id || user?.id || 'rec_abc_1';

  const [profile, setProfile] = useState<RecyclerProfile | null>(recyclerProfile);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGazetteModal, setShowGazetteModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form states
  const [editPerson, setEditPerson] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRadius, setEditRadius] = useState(50);
  const [editPickup, setEditPickup] = useState(true);
  const [editRates, setEditRates] = useState<Record<string, number>>({});

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.getRecyclerById(myRecyclerId);
      if (res.success && res.recycler) {
        setProfile(res.recycler);
      }
    } catch (e) {
      console.warn('Recycler profile load fallback:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [myRecyclerId]);

  const activeProfile = profile || recyclerProfile || {
    id: 'rec_abc_1',
    userId: 'usr_recycler_abc',
    facilityName: 'ABC E-Waste Recycling Pvt Ltd',
    registrationNo: 'CPCB/EWR/UP/LKO/2023/5521',
    authorizationStatus: 'AUTHORIZED' as any,
    authorizationSource: 'CPCB_GAZETTE_VERIFIED' as any,
    authValidUntil: '2028-12-31',
    contactPerson: 'Arun Bhatia',
    contactPhone: '9820098200',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    address: 'Plot 12, Industrial Area, Amausi, Lucknow, UP 226008',
    latitude: 26.7606,
    longitude: 80.8893,
    acceptedMaterials: ALL_CATEGORIES,
    pickupAvailable: true,
    serviceRadiusKm: 50,
    baseOfferedRates: {
      PCB: 100,
      CABLE: 90,
      BATTERY: 80,
      MOTOR: 65,
      LCD: 45,
      MAGNET: 45,
      CRT: 20,
      MIXED_PLASTIC: 16
    },
    rating: 4.9,
    totalProcessedKg: 42500
  };

  const openEditModal = () => {
    setEditPerson(activeProfile.contactPerson || 'Arun Bhatia');
    setEditPhone(activeProfile.contactPhone || '9820098200');
    setEditRadius(activeProfile.serviceRadiusKm || 50);
    setEditPickup(activeProfile.pickupAvailable !== false);
    setEditRates({ ...(activeProfile.baseOfferedRates || {}) });
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateRecyclerProfile(activeProfile.id, {
        contactPerson: editPerson,
        contactPhone: editPhone,
        serviceRadiusKm: Number(editRadius),
        pickupAvailable: editPickup,
        baseOfferedRates: editRates
      });

      if (res.success && res.recycler) {
        setProfile(res.recycler);
        setShowEditModal(false);
        showToast(
          language === 'hi' ? 'प्रोफ़ाइल एवं खरीद दरें सफलतापूर्वक अपडेट हो गईं!' : 'Facility profile & rates updated successfully!',
          'success'
        );
        if (refreshUser) refreshUser();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return '+91 98200 98200';
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 10) {
      return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
    }
    return phone;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-5">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-lg shrink-0 border border-blue-400/30">
              🏭
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {formatUserDisplayName(activeProfile.facilityName || 'ABC E-Waste Recycling Pvt Ltd', 'RECYCLER', language)}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-500/30 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {language === 'hi'
                      ? 'CPCB राजपत्र सत्यापित (EPR अनुपालन)'
                      : language === 'mr'
                      ? 'CPCB राजपत्र सत्यापित (EPR अनुपालन)'
                      : 'CPCB Gazette Verified (EPR Compliant)'}
                  </span>
                </span>
              </div>
              <p className="text-xs sm:text-sm font-mono text-blue-700 dark:text-blue-400 font-extrabold tracking-wide">
                Reg No: {activeProfile.registrationNo || 'CPCB/EWR/UP/LKO/2023/5521'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'hi' ? 'अधिकृत क्षमता:' : language === 'mr' ? 'अधिकृत क्षमता:' : 'Authorized Capacity:'}{' '}
                <b className="text-emerald-700 dark:text-emerald-400">
                  {language === 'hi' ? '4,800 मीट्रिक टन' : language === 'mr' ? '४,८०० मीट्रिक टन' : '4,800 MTA'}
                </b>{' '}
                • {language === 'hi'
                  ? 'केंद्रीय प्रदूषण नियंत्रण बोर्ड (CPCB) नियम 13 पंजीकृत'
                  : language === 'mr'
                  ? 'मध्यवर्ती प्रदूषण नियंत्रण मंडळ (CPCB) नियम १३ नोंदणीकृत'
                  : 'Central Pollution Control Board (CPCB) Rule 13 Registered'}
              </p>
            </div>
          </div>

          {/* Action Buttons & Expiry Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-right">
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {language === 'hi' ? 'लाइसेंस वैधता' : language === 'mr' ? 'परवाना वैधतेचा कालावधी' : 'Authorization Valid Until'}
              </span>
              <span className="text-sm font-mono font-black text-emerald-700 dark:text-emerald-400">
                {activeProfile.authValidUntil || '2028-12-31'}
              </span>
            </div>

            <button
              type="button"
              onClick={openEditModal}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-white font-bold rounded-2xl text-xs border border-slate-300 dark:border-slate-700 flex items-center gap-2 shadow-sm transition-all"
            >
              <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>
                {language === 'hi' ? 'प्रोफ़ाइल एवं दरें बदलें' : language === 'mr' ? 'प्रोफाईल व दर बदला' : 'Edit Profile & Rates'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowGazetteModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-black rounded-2xl text-xs shadow-md flex items-center gap-2 transition-all"
            >
              <Award className="w-4 h-4 text-emerald-200" />
              <span>
                {language === 'hi' ? 'CPCB राजपत्र देखें' : language === 'mr' ? 'CPCB राजपत्र पहा' : 'View CPCB Gazette'}
              </span>
            </button>
          </div>
        </div>

        {/* 4 Key Operational Specs Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 text-xs">
          {/* Card 1: Contact Officer */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="font-extrabold uppercase tracking-wider text-[10px]">
                {language === 'hi' ? 'संपर्क अधिकारी' : language === 'mr' ? 'संपर्क अधिकारी' : 'Contact Officer'}
              </span>
              <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <span className="font-black text-slate-900 dark:text-white text-sm block">
                {formatUserDisplayName(activeProfile.contactPerson || 'Arun Bhatia', 'RECYCLER', language)}
              </span>
              <span className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>{formatPhone(activeProfile.contactPhone)}</span>
              </span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span>operations@abcewaste.in</span>
              </span>
            </div>
          </div>

          {/* Card 2: Plant Location & Coordinates */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="font-extrabold uppercase tracking-wider text-[10px]">
                {language === 'hi' ? 'प्लांट स्थान एवं GPS' : language === 'mr' ? 'प्लांटचे ठिकाण व GPS' : 'Facility Location & GPS'}
              </span>
              <MapPin className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-xs block line-clamp-2">
                {formatAddressLocation(activeProfile.address || 'Plot 12, Industrial Area, Amausi, Lucknow, UP 226008', language)}
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block mt-1">
                {activeProfile.latitude}° N, {activeProfile.longitude}° E
              </span>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[9px] font-bold border border-blue-200 dark:border-blue-800">
                {language === 'hi' ? 'धर्मकांटा / डिजिटल कांटा सक्रिय' : language === 'mr' ? 'वजन काटा सक्रिय' : 'Weighbridge Active'}
              </span>
            </div>
          </div>

          {/* Card 3: Doorstep Pickup Fleet */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="font-extrabold uppercase tracking-wider text-[10px]">
                {language === 'hi' ? 'पिकअप लॉजिस्टिक्स' : language === 'mr' ? 'पिकअप लॉजिस्टिक्स' : 'Doorstep Pickup Logistics'}
              </span>
              <Truck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm block">
                {activeProfile.pickupAvailable 
                  ? (language === 'hi' ? 'सक्रिय वाहन बेड़ा' : language === 'mr' ? 'सक्रिय वाहने' : 'Active Fleet') 
                  : (language === 'hi' ? 'केवल स्व-डिलीवरी' : language === 'mr' ? 'केवळ स्व-डिलिव्हरी' : 'Self-Delivery Only')}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300 block mt-0.5">
                {language === 'hi' ? 'सेवा दायरा:' : language === 'mr' ? 'सेवा त्रिज्या:' : 'Service Radius:'} <b className="text-slate-900 dark:text-white">{activeProfile.serviceRadiusKm || 50} {language === 'hi' ? 'किमी' : language === 'mr' ? 'किमी' : 'km'}</b>
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                {language === 'hi' ? 'लखनऊ मेट्रो एवं एनसीआर औद्योगिक कॉरिडोर' : language === 'mr' ? 'लखनऊ मेट्रो व एनसीआर औद्योगिक पट्टा' : 'Lucknow Metro & NCR Industrial Corridors'}
              </span>
            </div>
          </div>

          {/* Card 4: Certified Recycling Volume */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="font-extrabold uppercase tracking-wider text-[10px]">
                {language === 'hi' ? 'प्रमाणित रीसाइक्लिंग' : language === 'mr' ? 'प्रमाणित रिसायकलिंग' : 'Total Certified Recycling'}
              </span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm block">
                {((activeProfile.totalProcessedKg || 42500) / 1000).toFixed(1)} {language === 'hi' ? 'मीट्रिक टन' : language === 'mr' ? 'मीट्रिक टन' : 'Metric Tons'}
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-300 font-bold block mt-0.5">
                ★ {activeProfile.rating || 4.9} / 5.0 {language === 'hi' ? 'रेटिंग' : language === 'mr' ? 'रेटिंग' : 'Rating'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                {language === 'hi' ? '211 सत्यापित निपटान एवं फॉर्म-6' : language === 'mr' ? '२११ सत्यापित पावत्या व फॉर्म-६' : '211 Verified Settlements & Form-6s'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Live Base Offered Rates Matrix (₹/kg) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                {language === 'hi'
                  ? 'सामग्री खरीद बेंचमार्क दरें (₹ / किग्रा)'
                  : language === 'mr'
                  ? 'साहित्य खरेदी बेंचमार्क दर (₹ / किग्रॅ)'
                  : 'Material Procurement Benchmark Rates (₹ / kg)'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'hi'
                ? 'CPCB नियम 2022 के तहत भौतिक पैमाने पर आवक पर पंजीकृत कलेक्टरों को दी जाने वाली मानकीकृत दरें'
                : language === 'mr'
                ? 'CPCB नियम २०२२ नुसार नोंदणीकृत संकलकांना दिली जाणारी मानकीकृत दर'
                : 'CPCB Rule 2022 standardized rates offered to registered collectors upon physical scale intake'}
            </p>
          </div>

          <button
            type="button"
            onClick={openEditModal}
            className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>
              {language === 'hi' ? 'दरें अपडेट करें' : language === 'mr' ? 'दर अपडेट करा' : 'Update Rates'}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {ALL_CATEGORIES.map((cat) => {
            const rate = activeProfile.baseOfferedRates?.[cat] || 50;
            return (
              <div 
                key={cat}
                className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 flex flex-col justify-between space-y-2 hover:border-emerald-400/60 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600 dark:text-slate-400 text-xs">
                    {getCategoryLabel(cat, language)}
                  </span>
                  <span className="text-2xl p-1.5 rounded-xl bg-white dark:bg-slate-900 shadow-2xs border border-slate-100 dark:border-slate-800">
                    {cat === 'PCB' && '📟'}
                    {cat === 'BATTERY' && '🔋'}
                    {cat === 'CABLE' && '🔌'}
                    {cat === 'MOTOR' && '⚙️'}
                    {cat === 'LCD' && '🖥️'}
                    {cat === 'MAGNET' && '🧲'}
                    {cat === 'CRT' && '📺'}
                    {cat === 'MIXED_PLASTIC' && '♻️'}
                  </span>
                </div>
                <div>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                    ₹{rate}
                  </span>
                  <span className="text-slate-500 text-[10px] font-bold">
                    {' '}/ {language === 'hi' ? 'किग्रा' : language === 'mr' ? 'किग्रॅ' : 'kg'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: ESG & CPCB Environmental Compliance Dashboard */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                {language === 'hi'
                  ? 'CPCB पर्यावरण प्रभाव एवं ESG अनुपालन लेजर'
                  : language === 'mr'
                  ? 'CPCB पर्यावरण प्रभाव व ESG अनुपालन लेजर'
                  : 'CPCB Environmental Impact & ESG Compliance Ledger'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'hi'
                ? 'भारत सरकार के ईपीआर (EPR) पोर्टल पर पंजीकृत सत्यापित सर्कुलर इकोनॉमी मेट्रिक्स'
                : language === 'mr'
                ? 'भारत सरकारच्या EPR पोर्टलवर नोंदणीकृत सत्यापित सर्कुलर इकॉनॉमी मेट्रिक्स'
                : 'Verified circular economy metrics registered on Government of India EPR Portal'}
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black rounded-xl border border-emerald-200 dark:border-emerald-800">
            {language === 'hi' ? 'EPR ग्रेड A' : language === 'mr' ? 'EPR ग्रेड A' : 'EPR Grade A'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {language === 'hi' ? 'वार्षिक क्षमता (MTA)' : language === 'mr' ? 'वार्षिक क्षमता (MTA)' : 'Annual Capacity (MTA)'}
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {language === 'hi' ? '4,800 मीट्रिक टन' : language === 'mr' ? '४,८०० मीट्रिक टन' : '4,800 MTA'}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {language === 'hi' ? 'CPCB राजपत्र रजिस्टर' : language === 'mr' ? 'CPCB राजपत्र रजिस्टर' : 'CPCB Gazette Registry'}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {language === 'hi' ? 'CO₂ उत्सर्जन बचाव' : language === 'mr' ? 'CO₂ उत्सर्जन बचाव' : 'CO2 Emissions Averted'}
            </span>
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
              ~85.2 MT CO2e
            </span>
            <span className="text-[10px] text-slate-500 block">
              {language === 'hi' ? 'कच्ची धातु प्रगलन से बचाव' : language === 'mr' ? 'कच्च्या धातू वितळवण्यापासून बचाव' : 'Avoided Virgin Smelting'}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {language === 'hi' ? 'लैंडफिल डंपिंग बचाव दर' : language === 'mr' ? 'लँडफिल डंपिंग बचाव दर' : 'Landfill Diversion Rate'}
            </span>
            <span className="text-xl font-black text-teal-700 dark:text-teal-400">96.4%</span>
            <span className="text-[10px] text-slate-500 block">
              {language === 'hi' ? 'शून्य अनियंत्रित डंपिंग' : language === 'mr' ? 'शून्य अनियंत्रित डंपिंग' : 'Zero Unregulated Dumping'}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {language === 'hi' ? 'CPCB फॉर्म-6 अनुपालन' : language === 'mr' ? 'CPCB फॉर्म-६ अनुपालन' : 'CPCB Form-6 Compliance'}
            </span>
            <span className="text-xl font-black text-blue-700 dark:text-blue-400">
              {language === 'hi' ? '100% ट्रेसेबल' : language === 'mr' ? '१००% ट्रेसेबल' : '100% Traceable'}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {language === 'hi' ? 'SHA-256 कस्टडी की सुरक्षा' : language === 'mr' ? 'SHA-256 कस्टडी सुरक्षा' : 'SHA-256 Chain of Custody'}
            </span>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE & RATES MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-xs space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {language === 'hi'
                    ? 'प्लांट प्रोफ़ाइल एवं खरीद दरें अपडेट करें'
                    : language === 'mr'
                    ? 'प्लांट प्रोफाइल व खरेदी दर अपडेट करा'
                    : 'Edit Facility Profile & Base Rates'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'hi' ? 'संपर्क अधिकारी का नाम' : language === 'mr' ? 'संपर्क अधिकाऱ्याचे नाव' : 'Contact Officer Name'}
                  </label>
                  <input
                    type="text"
                    value={editPerson}
                    onChange={(e) => setEditPerson(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'hi' ? 'संपर्क फ़ोन नंबर' : language === 'mr' ? 'संपर्क फोन नंबर' : 'Contact Phone'}
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'hi' ? 'सेवा दायरा (किमी)' : language === 'mr' ? 'सेवा त्रिज्या (किमी)' : 'Service Radius (km)'}
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={editRadius}
                    onChange={(e) => setEditRadius(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'hi' ? 'डोरस्टेप पिकअप सुविधा' : language === 'mr' ? 'पिकअप सुविधा' : 'Doorstep Pickup Available'}
                  </label>
                  <select
                    value={editPickup ? 'true' : 'false'}
                    onChange={(e) => setEditPickup(e.target.value === 'true')}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="true">
                      {language === 'hi' ? 'सक्रिय (डोरस्टेप पिकअप उपलब्ध)' : language === 'mr' ? 'सक्रिय (पिकअप उपलब्ध)' : 'Active (Doorstep Pickup Provided)'}
                    </option>
                    <option value="false">
                      {language === 'hi' ? 'निष्क्रिय (कलेक्टर स्व-डिलीवरी केवल)' : language === 'mr' ? 'निष्क्रिय (केवळ स्व-डिलिव्हरी)' : 'Inactive (Collector Self-Delivery Only)'}
                    </option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
                <label className="block font-extrabold text-slate-800 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  {language === 'hi' ? 'सामग्री खरीद दरें (₹ / किग्रा)' : language === 'mr' ? 'साहित्य खरेदी दर (₹ / किग्रॅ)' : 'Material Procurement Rates (₹ / kg)'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {ALL_CATEGORIES.map((cat) => (
                    <div key={cat} className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="block text-[10px] text-slate-600 dark:text-slate-400 font-bold truncate">
                        {getCategoryLabel(cat, language)}
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-slate-500 font-bold">₹</span>
                        <input
                          type="number"
                          min="1"
                          max="2000"
                          value={editRates[cat] !== undefined ? editRates[cat] : 50}
                          onChange={(e) => setEditRates({ ...editRates, [cat]: Number(e.target.value) })}
                          className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-emerald-700 dark:text-emerald-400 font-black text-xs text-center focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold"
                >
                  {language === 'hi' ? 'रद्द करें' : language === 'mr' ? 'रद्द करा' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>
                    {saving
                      ? (language === 'hi' ? 'सहेजा जा रहा है...' : language === 'mr' ? 'साठवत आहे...' : 'Saving...')
                      : (language === 'hi' ? 'प्रोफ़ाइल एवं दरें सहेजें' : language === 'mr' ? 'प्रोफाईल व दर साठवा' : 'Save Profile & Rates')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL CPCB GAZETTE AUTHORIZATION CERTIFICATE MODAL */}
      {showGazetteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden border-4 border-emerald-600 my-8">
            {/* Header */}
            <div className="bg-emerald-950 text-white p-5 flex items-center justify-between border-b border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-800/80 flex items-center justify-center font-black text-xl">
                  🏛️
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-wide">
                    {language === 'hi'
                      ? 'भारत सरकार • CPCB मास्टर रजिस्ट्री'
                      : language === 'mr'
                      ? 'भारत सरकार • CPCB मास्टर रजिस्ट्री'
                      : 'Government of India • CPCB Master Registry'}
                  </h3>
                  <p className="text-xs text-emerald-300">
                    {language === 'hi'
                      ? 'केंद्रीय प्रदूषण नियंत्रण बोर्ड अधिकृतता (पर्यावरण मंत्रालय)'
                      : language === 'mr'
                      ? 'मध्यवर्ती प्रदूषण नियंत्रण मंडळ अधिकृतता (पर्यावरण मंत्रालय)'
                      : 'Central Pollution Control Board Authorization (MoEFCC)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGazetteModal(false)}
                className="p-1.5 rounded-full bg-emerald-900 hover:bg-emerald-800 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificate Body */}
            <div className="p-6 sm:p-8 space-y-5 bg-slate-50 border-b border-slate-200 text-xs">
              <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-900 mb-1 font-black text-xl">
                  ♻️
                </div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  {language === 'hi'
                    ? 'CPCB अधिकृतता एवं ईपीआर (EPR) रीसाइक्लर पंजीकरण प्रमाण पत्र'
                    : language === 'mr'
                    ? 'CPCB अधिकृतता व EPR रिसायकल नोंदणी प्रमाणपत्र'
                    : 'CERTIFICATE OF CPCB AUTHORIZATION & EPR RECYCLER REGISTRATION'}
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  {language === 'hi'
                    ? 'ई-कचरा (प्रबंधन) नियम, 2022 के नियम 13(3)(i) के तहत जारी'
                    : language === 'mr'
                    ? 'ई-कचरा (व्यवस्थापन) नियम, २०२२ च्या नियम १३(३)(i) अंतर्गत जारी'
                    : 'Issued under Rule 13(3)(i) of E-Waste (Management) Rules, 2022'}
                </p>
                <div className="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-950 font-mono font-bold rounded-full border border-emerald-300">
                  {language === 'hi' ? 'पंजीकरण संख्या:' : language === 'mr' ? 'नोंदणी क्रमांक:' : 'REGISTRATION NO:'} CPCB/EWR/UP/LKO/2023/5521
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-slate-500 text-[10px] block">
                    {language === 'hi' ? 'प्लांट का नाम' : language === 'mr' ? 'प्लांटचे नाव' : 'Facility Name'}
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    {formatUserDisplayName(activeProfile.facilityName || 'ABC E-Waste Recycling Pvt Ltd', 'RECYCLER', language)}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-slate-500 text-[10px] block">
                    {language === 'hi' ? 'अधिकृत रीसाइक्लिंग क्षमता' : language === 'mr' ? 'अधिकृत रिसायकलिंग क्षमता' : 'Authorized Recycling Capacity'}
                  </span>
                  <span className="font-black text-emerald-700 text-xs">
                    {language === 'hi' ? '4,800 मीट्रिक टन / वर्ष (MTA)' : language === 'mr' ? '४,८०० मीट्रिक टन / वर्ष (MTA)' : '4,800 Metric Tons / Annum (MTA)'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-slate-500 text-[10px] block">
                    {language === 'hi' ? 'प्लांट का पता एवं अधिकार क्षेत्र' : language === 'mr' ? 'प्लांटचा पत्ता व अधिकार क्षेत्र' : 'Plant Address & Jurisdiction'}
                  </span>
                  <span className="font-bold text-slate-800 text-xs">
                    {formatAddressLocation(activeProfile.address || 'Plot 12, Industrial Area, Amausi, Lucknow, Uttar Pradesh - 226008', language)}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-slate-500 text-[10px] block">
                    {language === 'hi' ? 'अधिकृतता की वैधता' : language === 'mr' ? 'अधिकृततेची वैधता' : 'Authorization Validity'}
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    {language === 'hi' ? '31 दिसंबर 2028' : language === 'mr' ? '३१ डिसेंबर २०२८' : '31st December 2028'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block">
                    {language === 'hi' ? 'सक्रिय एवं अच्छी स्थिति में' : language === 'mr' ? 'सक्रिय व उत्तम स्थितीत' : 'Active & In Good Standing'}
                  </span>
                </div>
              </div>

              {/* Authorized Categories */}
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-950 text-xs block">
                  {language === 'hi' ? 'अनुमत खतरनाक ई-कचरा श्रेणियां:' : language === 'mr' ? 'अनुमत ई-कचरा श्रेणी:' : 'Permitted Hazardous E-Waste Categories:'}
                </span>
                <p className="text-[11px] text-emerald-900 font-medium">
                  {language === 'hi'
                    ? 'प्रिंटेड सर्किट बोर्ड (PCB), लिथियम-आयन / लेड एसिड बैटरियां, इंसुलेटेड कॉपर केबल, मोटर, एलसीडी स्क्रीन (LCD), मैग्नेट, इंजीनियरिंग प्लास्टिक।'
                    : language === 'mr'
                    ? 'प्रिंटेड सर्किट बोर्ड (PCB), लिथियम-आयन / लेड ॲसिड बॅटरी, इन्सुलेटेड तांब्याच्या तारा, मोटर, एलसीडी स्क्रीन (LCD), मॅग्नेट, इंजिनिअरिंग प्लास्टिक.'
                    : 'Printed Circuit Boards (PCB), Lithium-Ion / Lead Acid Batteries, Insulated Copper Cables, Fractional HP Motors, Liquid Crystal Displays (LCD), Neodymium Rare Earth Magnets, Engineering Grade Polymers.'}
                </p>
              </div>

              {/* Signatures & Seal */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center font-mono text-[9px] text-center text-slate-600 border border-slate-300">
                    [CPCB QR]
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      {language === 'hi' ? 'CPCB निदेशालय द्वारा सत्यापित' : language === 'mr' ? 'CPCB संचालनालयाद्वारे सत्यापित' : 'Verified by CPCB Directorate'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">Gazette Ref: IND-EWR-2023-UP-0881</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 text-emerald-700 font-black">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {language === 'hi' ? 'CPCB आधिकारिक मोहर' : language === 'mr' ? 'CPCB अधिकृत शिक्का' : 'CPCB OFFICIAL SEAL'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {language === 'hi' ? 'भारत सरकार' : language === 'mr' ? 'भारत सरकार' : 'Government of India'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowGazetteModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-xl"
              >
                {language === 'hi' ? 'बंद करें' : language === 'mr' ? 'बंद करा' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 text-sm font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl shadow flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {language === 'hi' ? 'आधिकारिक प्रमाण पत्र प्रिंट करें' : language === 'mr' ? 'अधिकृत प्रमाणपत्र प्रिंट करा' : 'Print Official Certificate'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
