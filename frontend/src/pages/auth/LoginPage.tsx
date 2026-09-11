import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Recycle,
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Sparkles,
  Volume2,
  VolumeX,
  Globe,
  TrendingUp,
  Scale,
  FileCheck,
  Shield,
  AlertTriangle,
  RotateCcw,
  Building2,
  MapPin,
  KeyRound,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useSpeech } from '../../hooks/useSpeech';
import { UserRole, Language } from '../../types';
import { api } from '../../services/api';

const DEMO_PHONE_BY_ROLE: Record<UserRole, string> = {
  COLLECTOR: '9876543210',
  RECYCLER: '9820098200',
  ADMIN: '9999999999'
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRole, setSelectedRole] = useState<UserRole>(() => {
    const target = (location.state as any)?.targetRole;
    if (target === 'COLLECTOR' || target === 'RECYCLER' || target === 'ADMIN') {
      return target;
    }
    const searchParams = new URLSearchParams(location.search);
    const paramRole = searchParams.get('role')?.toUpperCase();
    if (paramRole === 'COLLECTOR' || paramRole === 'RECYCLER' || paramRole === 'ADMIN') {
      return paramRole;
    }
    return 'COLLECTOR';
  });

  const [phone, setPhone] = useState<string>(() => {
    const target = (location.state as any)?.targetRole;
    const searchParams = new URLSearchParams(location.search);
    const paramRole = searchParams.get('role')?.toUpperCase();
    const initialRole: UserRole = (target === 'COLLECTOR' || target === 'RECYCLER' || target === 'ADMIN')
      ? target
      : (paramRole === 'COLLECTOR' || paramRole === 'RECYCLER' || paramRole === 'ADMIN')
        ? paramRole
        : 'COLLECTOR';
    return DEMO_PHONE_BY_ROLE[initialRole];
  });
  const [userName, setUserName] = useState('');
  const [district, setDistrict] = useState('Lucknow');
  const [facilityName, setFacilityName] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [roleConflict, setRoleConflict] = useState<{
    hasConflict: boolean;
    registeredRole?: UserRole;
    registeredName?: string;
  } | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const [otp, setOtp] = useState(() => (selectedRole === 'RECYCLER' ? '' : '1234'));
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showJudgeDrawer, setShowJudgeDrawer] = useState(false);

  const { loginWithOtp, switchDemoRole } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { showToast } = useToast();
  const { speak, stop, isSpeaking } = useSpeech();

  useEffect(() => {
    let timer: any;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  useEffect(() => {
    const stateTarget = (location.state as any)?.targetRole;
    const searchParams = new URLSearchParams(location.search);
    const paramRole = searchParams.get('role')?.toUpperCase();
    const target = (stateTarget && (stateTarget === 'COLLECTOR' || stateTarget === 'RECYCLER' || stateTarget === 'ADMIN'))
      ? stateTarget
      : (paramRole && (paramRole === 'COLLECTOR' || paramRole === 'RECYCLER' || paramRole === 'ADMIN'))
        ? paramRole
        : null;

    if (target) {
      const validRole = target as UserRole;
      setSelectedRole(validRole);
      setPhone(DEMO_PHONE_BY_ROLE[validRole]);
      setOtp(validRole === 'RECYCLER' ? '' : '1234');
      setOtpSent(false);
      setRoleConflict(null);
      setIsNewUser(false);
    }
  }, [location.state, location.search]);

  const checkRoleConflict = async (activePhone: string, currentRole: UserRole) => {
    if (activePhone.length !== 10) {
      setRoleConflict(null);
      setIsNewUser(false);
      return;
    }
    try {
      const res = await api.checkPhoneRole(activePhone);
      if (res.exists && res.role && res.role !== currentRole) {
        setRoleConflict({
          hasConflict: true,
          registeredRole: res.role,
          registeredName: res.name
        });
        setIsNewUser(false);
      } else {
        setRoleConflict(null);
        setIsNewUser(!res.exists);
        if (res.name && !userName) {
          setUserName(res.name);
        }
      }
    } catch (e) {
      console.warn('Role conflict check error:', e);
    }
  };

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setPhone(cleaned);
    if (cleaned.length === 10) {
      checkRoleConflict(cleaned, selectedRole);
    } else {
      setRoleConflict(null);
      setIsNewUser(false);
    }
  };

  const handleRoleSelect = (newRole: UserRole) => {
    setSelectedRole(newRole);
    const demoPhone = DEMO_PHONE_BY_ROLE[newRole];
    setPhone(demoPhone);
    setOtp(newRole === 'RECYCLER' ? '' : '1234');
    setOtpSent(false);
    setRoleConflict(null);
    setIsNewUser(false);
    setAdminPasscode('');
    setResendTimer(0);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const activePhone = phone.trim() || DEMO_PHONE_BY_ROLE[selectedRole];
    if (activePhone.length < 10) {
      showToast(t.phoneRequired || 'Please enter a valid 10-digit mobile number', 'warning');
      return;
    }

    if (roleConflict?.hasConflict) {
      showToast(
        language === 'hi'
          ? `यह नंबर ${roleConflict.registeredRole} के रूप में पंजीकृत है। कृपया सही पोर्टल चुनें।`
          : language === 'mr'
          ? `हा नंबर ${roleConflict.registeredRole} म्हणून नोंदणीकृत आहे. कृपया योग्य पोर्टल निवडा.`
          : `This number is registered as ${roleConflict.registeredRole}. Please switch tabs.`,
        'warning'
      );
      return;
    }

    // If Admin role and not official demo phone, require passcode before issuing OTP
    if (selectedRole === 'ADMIN' && activePhone !== '9999999999' && !adminPasscode.trim()) {
      showToast(
        language === 'hi'
          ? 'प्रशासक लॉगिन के लिए CPCB मास्टर पासकोड अनिवार्य है।'
          : language === 'mr'
          ? 'प्रशासक लॉगिनसाठी CPCB मास्टर पासकोड आवश्यक आहे.'
          : 'CPCB Master Passcode is required for Admin login.',
        'warning'
      );
      return;
    }

    setPhone(activePhone);
    setIsSendingOtp(true);

    try {
      const res = await api.sendOtp({
        phone: activePhone,
        role: selectedRole,
        language,
        name: userName.trim() || undefined
      });
      setIsSendingOtp(false);

      if (res.roleConflict) {
        setRoleConflict({
          hasConflict: true,
          registeredRole: res.existingRole,
          registeredName: res.registeredName
        });
        showToast(
          language === 'hi'
            ? `भूमिका टकराव: यह नंबर ${res.existingRole} के रूप में पंजीकृत है!`
            : language === 'mr'
            ? `भूमिका संघर्ष: हा नंबर ${res.existingRole} म्हणून नोंदणीकृत आहे!`
            : `Role Conflict: Registered under ${res.existingRole} portal!`,
          'warning'
        );
        return;
      }

      if (res.success) {
        setOtpSent(true);
        setResendTimer(60);
        if (selectedRole === 'RECYCLER') {
          setOtp(res.demoOtp || '123456');
          showToast(
            language === 'hi'
              ? `रीसाइक्लर सत्यापन OTP: ${res.demoOtp || '123456'}`
              : language === 'mr'
              ? `रिसायकलर पडताळणी OTP: ${res.demoOtp || '123456'}`
              : `Recycler Verification OTP: ${res.demoOtp || '123456'}`,
            'info'
          );
        } else {
          setOtp(res.demoOtp || '1234');
          showToast(
            language === 'hi'
              ? `सत्यापन OTP: ${res.demoOtp || '1234'}`
              : language === 'mr'
              ? `पडताळणी OTP: ${res.demoOtp || '1234'}`
              : `Verification OTP: ${res.demoOtp || '1234'}`,
            'info'
          );
        }
      }
    } catch (err: any) {
      setIsSendingOtp(false);
      showToast(err.message || 'Failed to send OTP. Please try again.', 'error');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      showToast(language === 'hi' ? 'कृपया OTP दर्ज करें' : language === 'mr' ? 'कृपया OTP प्रविष्ट करा' : 'Please enter the OTP', 'warning');
      return;
    }
    setIsSubmitting(true);
    const activePhone = phone.trim() || DEMO_PHONE_BY_ROLE[selectedRole];
    const result = await loginWithOtp(
      activePhone,
      otp.trim(),
      selectedRole,
      userName.trim() || undefined,
      district,
      {
        facilityName: facilityName.trim() || undefined,
        adminPasscode: adminPasscode.trim() || undefined
      }
    );
    setIsSubmitting(false);

    if (result.success && result.role) {
      showToast(language === 'hi' ? 'लॉगिन सफल!' : language === 'mr' ? 'लॉगिन यशस्वी!' : 'Login successful!', 'success');
      navigate('/' + result.role.toLowerCase());
    } else {
      showToast(result.message || (language === 'hi' ? 'लॉगिन विफल रहा।' : language === 'mr' ? 'लॉगिन अयशस्वी.' : 'Login failed. Please verify credentials or requested OTP.'), 'error');
    }
  };

  const handleJudgeOneClick = async (targetRole: UserRole) => {
    setIsSubmitting(true);
    const result = await switchDemoRole(targetRole);
    setIsSubmitting(false);
    if (result.success && result.role) {
      showToast(
        language === 'hi' ? `${targetRole} सत्र सक्रिय किया गया` : language === 'mr' ? `${targetRole} सत्र सक्रिय केले` : `Activated ${targetRole} session`,
        'success'
      );
      navigate('/' + result.role.toLowerCase());
    } else {
      showToast(result.message || 'Demo activation failed', 'error');
    }
  };

  const speakWelcome = () => {
    const welcomeTexts = {
      hi: 'कबाड़ीवाला कनेक्ट में आपका स्वागत है। आप अपना ई-वेस्ट यहाँ बेच सकते हैं। अपनी भूमिका चुनें और मोबाइल नंबर से आसानी से लॉगिन करें।',
      mr: 'कबाडीवाला कनेक्ट मध्ये आपले स्वागत आहे. तुम्ही तुमचा ई-वेस्ट येथे विकू शकता. आपली भूमिका निवडा आणि सहज लॉगिन करा.',
      en: 'Welcome to Kabadiwala Connect. You can sell your e-waste here. Select your designated role and log in with your verified credentials.'
    };
    speak(welcomeTexts[language], language);
  };

  const roleMeta = {
    COLLECTOR: {
      portalTitle: t.portalCollector || 'Collector Portal',
      streamBadge: language === 'hi' ? 'अनौपचारिक ई-कचरा संकलन' : language === 'mr' ? 'अनौपचारिक ई-कचरा संकलन' : 'Informal Collection Stream',
      title: t.authCollectorTitle,
      desc: t.authCollectorDesc,
      borderColor: 'border-emerald-500',
      activeTab: 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40',
      boxBg: 'bg-emerald-950/40 border-emerald-800/60',
      accentColor: 'text-emerald-400',
      btnBg: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950',
      icon: '📦',
      highlights: [
        language === 'hi' ? 'दलाल-मुक्त पारदर्शी भाव' : language === 'mr' ? 'दलालमुक्त पारदर्शक दर' : 'Zero Middleman Deductions',
        language === 'hi' ? 'कांटे का पक्का डिजिटल वजन' : language === 'mr' ? 'काट्याचे अचूक डिजिटल वजन' : 'Certified Scale Weight Receipts',
        language === 'hi' ? 'सीधा UPI अथवा नकद भुगतान' : language === 'mr' ? 'थेट UPI किंवा रोख पेमेंट' : 'Instant Bank/Cash Passbook Settlement'
      ]
    },
    RECYCLER: {
      portalTitle: t.portalRecycler || 'Recycler Portal',
      streamBadge: language === 'hi' ? 'CPCB पंजीकृत रीसाइक्लिंग केंद्र' : language === 'mr' ? 'CPCB नोंदणीकृत रिसायकलिंग केंद्र' : 'Registered Facility Stream',
      title: t.authRecyclerTitle,
      desc: t.authRecyclerDesc,
      borderColor: 'border-blue-500',
      activeTab: 'bg-blue-600 text-white shadow-lg shadow-blue-950/40',
      boxBg: 'bg-blue-950/40 border-blue-800/60',
      accentColor: 'text-blue-400',
      btnBg: 'bg-blue-600 hover:bg-blue-500 shadow-blue-950',
      icon: '🏭',
      highlights: [
        language === 'hi' ? 'प्लेटफॉर्म-प्रबंधित अधिकृत रीसाइक्लर' : language === 'mr' ? 'प्लॅटफॉर्म-व्यवस्थापित अधिकृत रिसायकलर' : 'Platform-Managed Authorization',
        language === 'hi' ? 'मुफ्त वाहन पिकअप प्रबंधन' : language === 'mr' ? 'मोफत वाहन पिकअप व्यवस्थापन' : 'Doorstep Fleet Logistics Dispatch',
        language === 'hi' ? 'कानूनी Form-6 EPR प्रमाण जारी' : language === 'mr' ? 'कायदेशीर Form-6 EPR पुरावा' : 'Statutory Form-6 EPR Credit Issuance'
      ]
    },
    ADMIN: {
      portalTitle: t.portalAdmin || 'Regulatory Admin Portal',
      streamBadge: language === 'hi' ? 'राज्य / राष्ट्रीय विनियामक प्रकोष्ठ' : language === 'mr' ? 'राज्य / राष्ट्रीय नियामक कक्ष' : 'State & National Oversight Cell',
      title: t.authAdminTitle,
      desc: t.authAdminDesc,
      borderColor: 'border-purple-500',
      activeTab: 'bg-purple-600 text-white shadow-lg shadow-purple-950/40',
      boxBg: 'bg-purple-950/40 border-purple-800/60',
      accentColor: 'text-purple-400',
      btnBg: 'bg-purple-600 hover:bg-purple-500 shadow-purple-950',
      icon: '🛡️',
      highlights: [
        language === 'hi' ? 'राष्ट्रीय ई-कचरा GIS गतिविधि मैप' : language === 'mr' ? 'राष्ट्रीय ई-कचरा GIS नकाशा' : 'National GIS Density Telemetry',
        language === 'hi' ? 'AI मूल्य व विसंगति धोखाधड़ी जांच' : language === 'mr' ? 'AI दर व विसंगती तपासणी' : 'Automated ML Anomaly Detection',
        language === 'hi' ? 'रीसाइक्लर निलंबन व बहाली अधिकार' : language === 'mr' ? 'रिसायकलर निलंबन व पुनर्बहाली' : 'Gazette License Regulatory Controls'
      ]
    }
  }[selectedRole];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      {/* Top Government-Grade Unauthenticated Header */}
      <header className="h-16 px-4 sm:px-8 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-950">
            <Recycle className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                {t.appTitle}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                SIH #229
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Right Header Controls: Audio Assistance & Single Language Switcher */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (isSpeaking) {
                stop();
              } else {
                speakWelcome();
              }
            }}
            className={`p-2 rounded-xl border transition-all ${isSpeaking
                ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700'
              }`}
            title={isSpeaking ? (t.voiceStop || 'Stop') : (t.audioGuidanceBtn || 'Audio Guidance')}
            aria-label={isSpeaking ? (t.voicePlaying || 'Playing voice...') : (t.audioGuidanceBtn || 'Audio Guidance')}
          >
            {isSpeaking ? (
              <VolumeX className="w-4 h-4 animate-bounce" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          {/* SINGLE Language Selector on Login Page */}
          <div className="relative flex items-center bg-slate-800 rounded-xl px-2.5 py-1.5 border border-slate-700">
            <Globe className="w-4 h-4 text-emerald-400 mr-1.5 shrink-0" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-xs font-black text-slate-200 focus:outline-none cursor-pointer"
              aria-label="Language Selector"
            >
              <option value="hi" className="bg-slate-900 text-white">हिंदी (HI)</option>
              <option value="mr" className="bg-slate-900 text-white">मराठी (MR)</option>
              <option value="en" className="bg-slate-900 text-white">English (EN)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Authentication Arena */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-1/4 -left-32 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 backdrop-blur-xl">
          {/* Left Column: Platform Identity & Environmental Mission */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/60 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-extrabold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'MoEFCC एवं CPCB अनुपालित' : language === 'mr' ? 'MoEFCC आणि CPCB अनुपालन' : 'MoEFCC & CPCB Compliant'}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {t.loginSubtitle}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                {t.slogan}
              </p>

              {/* 3 Value Pillars */}
              <div className="space-y-3 pt-4 border-t border-slate-800/80">
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <div className="w-6 h-6 rounded-lg bg-emerald-900/60 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">
                      {language === 'hi' ? 'पारदर्शी मंडी दरें' : language === 'mr' ? 'पारदर्शक बाजार भाव' : 'Guaranteed Benchmark Rates'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {language === 'hi' ? 'बिचौलियों के मुकाबले 72% तक अतिरिक्त आय' : language === 'mr' ? 'दलालांपेक्षा 72% पर्यंत जास्त उत्पन्न' : '+72% margin uplift vs informal middlemen'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <div className="w-6 h-6 rounded-lg bg-blue-900/60 border border-blue-700/60 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                    <Scale className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">
                      {language === 'hi' ? 'डिजिटल कांटा व वजन सत्यापन' : language === 'mr' ? 'डिजिटल काटा व वजन पडताळणी' : 'Certified Scale Verification'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {language === 'hi' ? 'सटीक इलेक्ट्रॉनिक तौल व तत्काल भुगतान पर्ची' : language === 'mr' ? 'अचूक इलेक्ट्रॉनिक वजन व त्वरित पावती' : 'Zero tare deductions and tamper-evident weights'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <div className="w-6 h-6 rounded-lg bg-purple-900/60 border border-purple-700/60 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                    <FileCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">
                      {language === 'hi' ? 'कानूनी Form-6 व EPR क्रेडिट्स' : language === 'mr' ? 'कायदेशीर Form-6 व EPR क्रेडिट्स' : 'Form-6 & SHA-256 Traceability'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {language === 'hi' ? 'ब्लॉकचेन-सत्यापित एंड-टू-एंड रीसाइक्लिंग प्रमाण' : language === 'mr' ? 'ब्लॉकचेन-सत्यापित संपूर्ण रिसायकलिंग पुरावा' : 'Immutable Merkle custody proof for state audit'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800 text-[11px] text-slate-400">
              {language === 'hi' ? '🇮🇳 भारत सरकार • SIH 2026 ग्रैंड फिनाले' : language === 'mr' ? '🇮🇳 भारत सरकार • SIH 2026 ग्रँड फिनाले' : '🇮🇳 Government of India • SIH 2026 Grand Finale'}
            </div>
          </div>

          {/* Right Column: SINGLE Role Selector + Differentiated Auth Box */}
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-5 flex flex-col justify-between bg-slate-900">
            <div className="space-y-4">
              {/* SINGLE Role Selector */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">
                  {language === 'hi' ? 'अपनी भूमिका चुनें' : language === 'mr' ? 'आपली भूमिका निवडा' : 'Select Portal Role'}
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { r: 'COLLECTOR', label: t.roleCollector, icon: '📦' },
                    { r: 'RECYCLER', label: t.roleRecycler, icon: '🏭' },
                    { r: 'ADMIN', label: t.roleAdmin, icon: '🛡️' }
                  ].map((item) => {
                    const isSelected = selectedRole === item.r;
                    return (
                      <button
                        key={item.r}
                        type="button"
                        onClick={() => handleRoleSelect(item.r as UserRole)}
                        className={`p-3 rounded-2xl text-center border font-bold text-xs transition-all duration-200 flex flex-col items-center gap-1 ${isSelected
                            ? `${roleMeta.activeTab} border-transparent ring-2 ring-white/20`
                            : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-750 hover:text-white'
                          }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="truncate font-black">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Role Context & Specific Highlights */}
              <div className={`p-4 rounded-2xl border ${roleMeta.boxBg} space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black uppercase tracking-wider ${roleMeta.accentColor}`}>
                    {roleMeta.portalTitle}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono font-bold">
                    {roleMeta.streamBadge}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 font-medium">
                  {roleMeta.desc}
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1.5 border-t border-slate-800 text-[10px] text-slate-300">
                  {roleMeta.highlights.map((h, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="text-emerald-400">✓</span> {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Role Conflict Warning Banner (Option 2 Role Guard) */}
              {roleConflict?.hasConflict && (
                <div className="p-4 rounded-2xl bg-amber-950/80 border-2 border-amber-500 space-y-2.5 animate-in fade-in-50">
                  <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>{t.roleConflictNotice || 'भूमिका टकराव / Role Conflict'}</span>
                  </div>
                  <p className="text-xs text-amber-200 font-medium leading-relaxed">
                    {language === 'hi'
                      ? `यह मोबाइल नंबर (+91 ${phone}) पहले से ${roleConflict.registeredRole} के रूप में पंजीकृत है। कृपया ${roleConflict.registeredRole} पोर्टल चुनें।`
                      : language === 'mr'
                      ? `हा मोबाईल नंबर (+91 ${phone}) आधीच ${roleConflict.registeredRole} म्हणून नोंदणीकृत आहे. कृपया योग्य पोर्टल निवडा.`
                      : `This mobile number (+91 ${phone}) is already registered as a ${roleConflict.registeredRole}. To prevent duplicacy, please switch to the correct portal.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRoleSelect(roleConflict.registeredRole as UserRole)}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>
                      {language === 'hi'
                        ? `🔄 ${roleConflict.registeredRole} पोर्टल पर स्विच करें`
                        : language === 'mr'
                        ? `🔄 ${roleConflict.registeredRole} पोर्टलवर जा`
                        : `🔄 Switch to ${roleConflict.registeredRole} Portal`}
                    </span>
                  </button>
                </div>
              )}

              {/* Mobile Number & OTP Verification Form */}
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        {selectedRole === 'ADMIN'
                          ? (language === 'hi' ? 'अधिकृत प्रशासक मोबाइल नंबर' : language === 'mr' ? 'अधिकृत प्रशासक मोबाईल नंबर' : 'Authorized Administrator Mobile')
                          : t.enterMobile}
                      </label>
                      {selectedRole === 'ADMIN' && (
                        <span className="text-[10px] font-extrabold text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                          {language === 'hi' ? '🔒 विनियामक क्रेडेंशियल आवश्यक' : language === 'mr' ? '🔒 नियामक ओळख आवश्यक' : '🔒 Authorized Credentials Required'}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-extrabold text-sm">
                        +91
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder={selectedRole === 'ADMIN' ? '99999 99999' : selectedRole === 'RECYCLER' ? '98200 98200' : '98765 43210'}
                        className={`w-full pl-14 pr-4 py-3 bg-slate-800 border rounded-2xl text-white font-mono font-bold text-base focus:outline-none transition-all ${
                          roleConflict?.hasConflict
                            ? 'border-amber-500 ring-1 ring-amber-500'
                            : 'border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                        }`}
                        required
                        aria-label="Mobile Number"
                      />
                      <Phone className="w-5 h-5 absolute right-3.5 top-3 text-slate-500" />
                    </div>
                  </div>

                  {/* Dynamic New User Registration Fields */}
                  {isNewUser && !roleConflict?.hasConflict && (
                    <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3 animate-in fade-in-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-xs">
                          <UserPlus className="w-4 h-4" />
                          <span>{t.newUserNotice || 'नया उपयोगकर्ता पंजीकरण'}</span>
                        </div>
                        <span className="text-[10px] bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded font-mono font-bold">
                          Real-time Supabase Cloud
                        </span>
                      </div>

                      {selectedRole === 'COLLECTOR' && (
                        <>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">
                              {t.fullNameLabel || 'पूरा नाम'} <span className="text-emerald-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                              placeholder={language === 'hi' ? 'उदा. रमेश कुमार' : language === 'mr' ? 'उदा. रमेश कुमार' : 'e.g. Ramesh Kumar'}
                              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium text-xs focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">
                              {t.districtLabel || 'जिला (स्थान)'}
                            </label>
                            <div className="relative">
                              <select
                                value={district}
                                onChange={(e) => setDistrict(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                              >
                                <option value="Lucknow">Lucknow (उत्तर प्रदेश)</option>
                                <option value="Pune">Pune (महाराष्ट्र)</option>
                                <option value="Nagpur">Nagpur (महाराष्ट्र)</option>
                                <option value="Delhi NCR">Delhi NCR</option>
                                <option value="Bengaluru">Bengaluru (कर्नाटक)</option>
                                <option value="Mumbai">Mumbai (महाराष्ट्र)</option>
                              </select>
                              <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            </div>
                          </div>
                        </>
                      )}

                      {selectedRole === 'RECYCLER' && (
                        <>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">
                              {t.facilityNameLabel || 'रीसाइक्लिंग केंद्र / फर्म का नाम'} <span className="text-blue-400">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                value={facilityName}
                                onChange={(e) => setFacilityName(e.target.value)}
                                placeholder="e.g. GreenEarth E-Waste Solutions Pvt Ltd"
                                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                              />
                              <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">
                              {t.fullNameLabel || 'संपर्क व्यक्ति का नाम'}
                            </label>
                            <input
                              type="text"
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                              placeholder="e.g. Operations Manager"
                              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">
                              {t.districtLabel || 'जिला / परिचालन क्षेत्र'}
                            </label>
                            <div className="relative">
                              <select
                                value={district}
                                onChange={(e) => setDistrict(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                              >
                                <option value="Lucknow">Lucknow (Uttar Pradesh)</option>
                                <option value="Pune">Pune (Maharashtra)</option>
                                <option value="Nagpur">Nagpur (Maharashtra)</option>
                                <option value="Delhi NCR">Delhi NCR</option>
                                <option value="Bengaluru">Bengaluru (Karnataka)</option>
                                <option value="Mumbai">Mumbai (Maharashtra)</option>
                              </select>
                              <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Admin Master Passcode Security Field */}
                  {selectedRole === 'ADMIN' && phone !== '9999999999' && (
                    <div className="p-3.5 rounded-2xl bg-purple-950/60 border border-purple-600/60 space-y-2 animate-in fade-in-50">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-purple-200">
                          {t.adminPasscodeLabel || 'CPCB मास्टर पासकोड (अनिवार्य)'} <span className="text-red-400">*</span>
                        </label>
                        <span className="text-[10px] text-purple-300 font-mono bg-purple-900/80 px-2 py-0.5 rounded">
                          Security Guard
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="password"
                          value={adminPasscode}
                          onChange={(e) => setAdminPasscode(e.target.value)}
                          placeholder="SIH2026-CPCB-ADMIN"
                          className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-purple-500/60 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                        />
                        <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-purple-400" />
                      </div>
                      <p className="text-[10px] text-purple-300/80 font-mono">
                        SIH Jury Key: <span className="font-bold text-white">SIH2026-CPCB-ADMIN</span>
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSendingOtp || Boolean(roleConflict?.hasConflict)}
                    className={`w-full py-3.5 ${roleMeta.btnBg} active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all ${
                      isSendingOtp || roleConflict?.hasConflict ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    <span>{isSendingOtp ? (language === 'hi' ? 'OTP भेजा जा रहा है...' : language === 'mr' ? 'OTP पाठवला जात आहे...' : 'Sending OTP...') : t.sendOtp}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerify} className="space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        {selectedRole === 'RECYCLER'
                          ? (language === 'hi' ? 'एसएमएस से प्राप्त 6-अंकीय OTP दर्ज करें' : language === 'mr' ? 'SMS द्वारे प्राप्त 6-अंकी OTP टाका' : 'Enter 6-digit SMS OTP')
                          : t.enterOtp}
                      </label>
                      {selectedRole === 'RECYCLER' ? (
                        <span className="text-[11px] text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60 font-mono">
                          SIH Judge Demo OTP: 123456
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                          {t.demoLoginTip}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        maxLength={selectedRole === 'RECYCLER' ? 6 : 4}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder={selectedRole === 'RECYCLER' ? '••••••' : '1234'}
                        className="w-full pl-10 pr-4 py-3 bg-slate-800 border-2 border-emerald-500 rounded-2xl text-white font-mono tracking-widest text-center text-xl font-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                        aria-label="OTP"
                      />
                      <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3.5 ${roleMeta.btnBg} active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all`}
                  >
                    {isSubmitting ? (
                      <span>{t.verifying}</span>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>{t.verifyOtp}</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-slate-400 hover:text-slate-200 font-semibold"
                    >
                      {t.changeMobile || '← मोबाइल नंबर बदलें'}
                    </button>
                    {resendTimer > 0 ? (
                      <span className="text-slate-500 font-mono">
                        {t.resendOtpIn || 'पुनः OTP'} ({resendTimer}s)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        className="text-emerald-400 hover:text-emerald-300 font-bold underline"
                      >
                        {t.resendOtp || 'OTP पुनः भेजें'}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* SIH Judge Evaluation Quick-Access Drawer */}
            <div className="pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowJudgeDrawer(!showJudgeDrawer)}
                className="w-full flex items-center justify-between text-xs text-amber-300 font-extrabold p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 hover:bg-amber-950/50 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-400" />
                  <span className="tracking-tight">⚖️ {language === 'hi' ? 'SIH 2026 मूल्यांकन / जज डेमो त्वरित प्रवेश' : language === 'mr' ? 'SIH 2026 मूल्यमापन / परीक्षक डेमो त्वरित प्रवेश' : 'SIH 2026 Evaluation / Judge Demo Quick-Access'}</span>
                </div>
                <span className="text-[10px] text-amber-400 font-mono font-bold">
                  {showJudgeDrawer
                    ? (language === 'hi' ? '▲ त्वरित प्रवेश छुपाएं' : language === 'mr' ? '▲ त्वरित प्रवेश लपवा' : '▲ Hide Quick-Access')
                    : (language === 'hi' ? '▼ डेमो खाते देखें' : language === 'mr' ? '▼ डेमो खाती पहा' : '▼ View Demo Accounts')}
                </span>
              </button>

              {showJudgeDrawer && (
                <div className="mt-2.5 p-3 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-2.5 animate-in fade-in-50 duration-150">
                  <div className="text-[11px] text-amber-200/80 font-medium flex items-center justify-between">
                    <span>{language === 'hi' ? 'हैकथॉन जजों के त्वरित मूल्यांकन हेतु पूर्व-कॉन्फ़िगर किए गए खाते:' : language === 'mr' ? 'हॅकाथॉन परीक्षकांच्या त्वरित मूल्यमापनासाठी पूर्व-कॉन्फिगर केलेली खाती:' : 'Pre-configured test accounts for rapid hackathon jury review:'}</span>
                    <span className="font-mono text-[10px] text-emerald-400 font-bold">Collector/Admin OTP: 1234 • Recycler Demo OTP: 123456</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleJudgeOneClick('COLLECTOR')}
                      className="p-2.5 bg-slate-900 hover:bg-emerald-950/50 border border-slate-700 hover:border-emerald-600/60 rounded-xl text-left transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-emerald-400">📦 {t.roleCollector}</span>
                        <span className="text-[9px] font-mono text-slate-400 group-hover:text-emerald-300">98765 43210</span>
                      </div>
                      <span className="text-[11px] font-bold text-white block truncate">{language === 'hi' ? 'रमेश कुमार' : language === 'mr' ? 'रमेश कुमार' : 'Ramesh Kumar'}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{language === 'hi' ? 'लखनऊ स्क्रैप क्लस्टर' : language === 'mr' ? 'लखनऊ स्क्रॅप क्लस्टर' : 'Lucknow Scrap Cluster'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleJudgeOneClick('RECYCLER')}
                      className="p-2.5 bg-slate-900 hover:bg-blue-950/50 border border-slate-700 hover:border-blue-600/60 rounded-xl text-left transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-blue-400">🏭 {t.roleRecycler}</span>
                        <span className="text-[9px] font-mono text-slate-400 group-hover:text-blue-300">98200 98200</span>
                      </div>
                      <span className="text-[11px] font-bold text-white block truncate">ABC E-Waste Recycling Pvt Ltd</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-emerald-400 block truncate">CPCB Authorized</span>
                        <span className="text-[9px] font-mono font-black text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-700/60">
                          SIH Judge Demo OTP: 123456
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleJudgeOneClick('ADMIN')}
                      className="p-2.5 bg-slate-900 hover:bg-purple-950/50 border border-slate-700 hover:border-purple-600/60 rounded-xl text-left transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-purple-400">🛡️ {t.roleAdmin}</span>
                        <span className="text-[9px] font-mono text-slate-400 group-hover:text-purple-300">99999 99999</span>
                      </div>
                      <span className="text-[11px] font-bold text-white block truncate">{language === 'hi' ? 'नियामक अधिकारी' : language === 'mr' ? 'नियामक अधिकारी' : 'Regulatory Officer'}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{language === 'hi' ? 'राष्ट्रीय विनियामक प्रकोष्ठ' : language === 'mr' ? 'राष्ट्रीय नियामक कक्ष' : 'National Oversight Cell'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modern Compact Environmental Footer */}
      <footer className="h-10 px-4 sm:px-8 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
        <div>{language === 'hi' ? 'स्मार्ट इंडिया हैकथॉन 2026 • पर्यावरण, वन और जलवायु परिवर्तन मंत्रालय' : language === 'mr' ? 'स्मार्ट इंडिया हॅकाथॉन 2026 • पर्यावरण, वन आणि हवामान बदल मंत्रालय' : 'Smart India Hackathon 2026 • Ministry of Environment, Forest and Climate Change'}</div>
        <div className="hidden sm:block">{language === 'hi' ? 'CPCB ई-कचरा नियम 2022 • विस्तारित निर्माता उत्तरदायित्व (EPR)' : language === 'mr' ? 'CPCB ई-कचरा नियम 2022 • विस्तारित उत्पादक जबाबदारी (EPR)' : 'CPCB E-Waste Rules 2022 • Extended Producer Responsibility (EPR)'}</div>
      </footer>
    </div>
  );
};
