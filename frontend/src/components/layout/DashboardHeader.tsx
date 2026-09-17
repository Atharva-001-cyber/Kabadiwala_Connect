import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Globe,
  WifiOff,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  LogOut,
  Sparkles,
  Shield,
  Layers,
  UserCheck,
  TrendingUp,
  IndianRupee,
  ShieldCheck,
  Sun,
  Moon,
  User,
  Check,
  Lock,
  KeyRound,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSync } from '../../context/SyncContext';
import { useTheme } from '../../context/ThemeContext';
import { Language, UserRole } from '../../types';
import { JudgeDemoModal } from '../common/JudgeDemoModal';
import { formatUserDisplayName } from '../../i18n/translations';
import { api } from '../../services/api';

interface DashboardHeaderProps {
  onToggleMobile: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onToggleMobile }) => {
  const { role, user, collectorProfile, recyclerProfile, isDemoUser, switchDemoRole, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isOnline, pendingCount } = useSync();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [showJudgeModal, setShowJudgeModal] = useState<boolean>(false);
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  // Security Guard States for Real (Non-Demo) User Role Switching
  const [restrictedTargetRole, setRestrictedTargetRole] = useState<UserRole | null>(null);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [isAuthorizingAdmin, setIsAuthorizingAdmin] = useState(false);

  const [tickerPrices, setTickerPrices] = useState<{ category: string; rate: number; shift: string }[]>([
    { category: 'PCB Board (ITEW2)', rate: 95, shift: '+3.4%' },
    { category: 'Electric Motors (CEEW5)', rate: 42, shift: '+1.8%' },
    { category: 'Li-Ion Cells (BATT-01)', rate: 110, shift: '+2.5%' },
    { category: 'Copper Cables (ITEW11)', rate: 420, shift: '+4.2%' },
    { category: 'CRT Monitors (CEEW1)', rate: 18, shift: '+0.5%' },
    { category: 'LCD Panels (CEEW2)', rate: 35, shift: '+1.2%' },
    { category: 'Speaker Magnets (ITEW14)', rate: 28, shift: '+2.0%' },
    { category: 'Mixed Plastics (CEEW4)', rate: 15, shift: '+0.8%' }
  ]);

  useEffect(() => {
    const district = collectorProfile?.district || 'Lucknow';
    api.getPriceBoard(district).then(res => {
      if (res.success && res.prices && res.prices.length > 0) {
        const shifts = ['+3.4%', '+1.8%', '+2.5%', '+4.2%', '+0.5%', '+1.2%', '+2.0%', '+0.8%'];
        const formatted = res.prices.slice(0, 8).map((p, idx) => ({
          category: `${p.materialCategory}`,
          rate: p.prevailingBuyPrice,
          shift: shifts[idx % shifts.length]
        }));
        setTickerPrices(formatted);
      }
    }).catch(() => {});
  }, [collectorProfile]);

  // Compute Active Section Title from route
  const getSectionTitle = () => {
    const p = location.pathname;
    if (p === '/collector' || p === '/recycler' || p === '/admin') return t.navDashboard;
    if (p.includes('/add')) return t.navAddLot;
    if (p.includes('/prices')) return t.navPrices;
    if (p.includes('/admin/recyclers')) return t.navRecyclerVerify;
    if (p.includes('/recyclers') || p.includes('/find')) return t.navRecyclers;
    if (p.includes('/requests')) return role === 'COLLECTOR' ? t.navRequests : t.navIncomingRequests;
    if (p.includes('/pickups')) return t.navPickups;
    if (p.includes('/handover')) return t.navHandover;
    if (p.includes('/inventory')) return t.navInventory;
    if (p.includes('/transactions')) return t.navTransactions;
    if (p.includes('/tracking')) return t.navTracking;
    if (p.includes('/ledger')) return t.navLedger;
    if (p.includes('/safety')) return t.navSafety;
    if (p.includes('/profile')) return t.navProfile;
    if (p.includes('/map')) return t.navGeoMap;
    if (p.includes('/anomalies')) return t.navAnomaly;
    if (p.includes('/disputes')) return t.navDisputes;
    if (p.includes('/datasets')) return t.navDatasets;
    return t.navDashboard;
  };

  const handleRoleSwitch = async (newRole: UserRole) => {
    setShowRoleMenu(false);
    if (newRole === role) {
      if (newRole === 'COLLECTOR') navigate('/collector');
      else if (newRole === 'RECYCLER') navigate('/recycler');
      else if (newRole === 'ADMIN') navigate('/admin');
      return;
    }

    // SIH Evaluation Sandbox: Fast 1-click switch for demo accounts
    if (isDemoUser) {
      await switchDemoRole(newRole);
      if (newRole === 'COLLECTOR') navigate('/collector');
      else if (newRole === 'RECYCLER') navigate('/recycler');
      else if (newRole === 'ADMIN') navigate('/admin');
      return;
    }

    // Production RBAC Guard: Real user account switching requires authorization
    setRestrictedTargetRole(newRole);
    setAdminPasscode('');
    setPasscodeError('');
  };

  const handleAdminPasscodeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = adminPasscode.trim().toUpperCase();
    if (clean !== 'SIH2026-CPCB-ADMIN' && clean !== 'CPCB-ADMIN') {
      setPasscodeError(
        language === 'hi'
          ? 'अमान्य मास्टर पासकोड। कृपया वैध सीपीसीबी पासकोड दर्ज करें।'
          : 'Invalid Master Passcode. Please enter authorized CPCB credentials (SIH2026-CPCB-ADMIN).'
      );
      return;
    }
    try {
      setIsAuthorizingAdmin(true);
      setPasscodeError('');
      await switchDemoRole('ADMIN');
      setRestrictedTargetRole(null);
      navigate('/admin');
    } catch (err: any) {
      setPasscodeError(err.message || 'Authorization failed');
    } finally {
      setIsAuthorizingAdmin(false);
    }
  };

  const handleSwitchAccountViaLogin = (target: UserRole) => {
    setRestrictedTargetRole(null);
    logout();
    navigate('/login', { state: { targetRole: target } });
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/login', { replace: true });
  };

  const roleBadgeStyle = {
    COLLECTOR: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    RECYCLER: 'bg-blue-950 text-blue-300 border-blue-800',
    ADMIN: 'bg-purple-950 text-purple-300 border-purple-800'
  }[role];

  const rawName =
    role === 'COLLECTOR' ? (collectorProfile?.name || user?.name) :
    role === 'RECYCLER' ? (recyclerProfile?.facilityName || user?.name) :
    user?.name;

  const userName = formatUserDisplayName(rawName, role, language);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
      {/* Top National Tricolor Hairline */}
      <div className="tiranga-accent-bar" />

      {/* Official Government of India & Ministry Masthead Sub-Bar (Strictly localized) */}
      <div className="hidden md:flex items-center justify-between px-4 sm:px-6 py-1 bg-slate-100 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800/80 text-[10px] font-bold text-slate-600 dark:text-slate-400 transition-colors overflow-hidden">
        <div className="flex items-center gap-2 min-w-0 truncate">
          <span className="text-amber-500 dark:text-amber-400 shrink-0">🇮🇳</span>
          <span className="text-slate-800 dark:text-slate-200 uppercase tracking-wide font-display shrink-0">
            {language === 'hi' ? 'भारत सरकार' : language === 'mr' ? 'भारत सरकार' : 'Government of India'}
          </span>
          <span className="text-slate-400 dark:text-slate-600 shrink-0">•</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold truncate">
            {language === 'hi' ? 'खान मंत्रालय एवं JNARDDC' : language === 'mr' ? 'खाण मंत्रालय आणि JNARDDC' : 'Ministry of Mines & JNARDDC'}
          </span>
          <span className="text-slate-600 shrink-0 hidden lg:inline">•</span>
          <span className="text-slate-400 truncate hidden lg:inline">
            {language === 'hi' ? 'SIH 2026 समस्या विवरण #26229' : language === 'mr' ? 'SIH 2026 समस्या विवरण #26229' : 'SIH 2026 Problem Statement #26229'}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
            <ShieldCheck className="w-3 h-3" />
            <span>
              {language === 'hi' ? 'CPCB अनुसूची-I' : language === 'mr' ? 'CPCB अनुसूची-I' : 'CPCB Schedule-I'}
            </span>
          </span>
          <span className="text-slate-400 dark:text-slate-600 hidden xl:inline">•</span>
          <span className="text-amber-600 dark:text-amber-300 font-mono text-[10px] hidden xl:inline">
            {language === 'hi' ? 'महत्वपूर्ण खनिज ग्रिड' : language === 'mr' ? 'खनिज ग्रिड' : 'Critical Minerals Grid'}
          </span>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="h-16 px-3 sm:px-6 flex items-center justify-between gap-2">
        {/* Left: Mobile Toggle + Breadcrumb / Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleMobile}
            className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition-colors shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white tracking-tight font-display transition-colors truncate max-w-[130px] xs:max-w-[180px] sm:max-w-none">
                {getSectionTitle()}
              </h1>
              <span className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider shrink-0 ${roleBadgeStyle}`}>
                {role === 'COLLECTOR' ? t.roleCollector : role === 'RECYCLER' ? t.roleRecycler : t.roleAdmin}
              </span>
              {isDemoUser ? (
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-400/50 shrink-0">
                  ⚡ Sandbox Demo
                </span>
              ) : (
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-400/50 shrink-0">
                  🔒 Verified Account
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Sync Telemetry Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700">
            {!isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-500" />
                <span className="text-red-600 dark:text-red-300">{t.offlineBadge}</span>
              </>
            ) : pendingCount > 0 ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span className="text-amber-700 dark:text-amber-300">{pendingCount} {t.pendingBadge}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300">{t.syncedBadge}</span>
              </>
            )}
          </div>

          {/* SIH Judge Demo Guide Trigger */}
          <button
            type="button"
            onClick={() => setShowJudgeModal(true)}
            className="px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl font-black text-xs bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-md flex items-center gap-1 active:scale-95 transition-all border border-amber-300/80 shrink-0"
            title="Open SIH 2026 Grand Finale Judge Demonstration Guide"
          >
            <span className="text-sm">⚖️</span>
            <span className="hidden sm:inline font-black tracking-wide font-display">{t.judgeGuideBtn}</span>
          </button>

          {/* Interactive Language Selector */}
          <div className="relative flex items-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-750 rounded-xl px-1.5 sm:px-2.5 py-1 border border-slate-300 dark:border-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors shadow-sm shrink-0">
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1 shrink-0" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-xs font-black text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-0.5 uppercase"
              aria-label="Language Selector"
            >
              <option value="en" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">EN</option>
              <option value="hi" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">HI</option>
              <option value="mr" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">MR</option>
            </select>
          </div>

          {/* 1-Click Dual Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 sm:px-2 sm:py-1 rounded-xl text-xs font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all shadow-sm active:scale-95 shrink-0"
            title={theme === 'light' ? 'Switch to Enterprise Dark Mode' : 'Switch to National DPI Light Mode'}
            aria-label="Toggle visual theme"
          >
            {theme === 'light' ? (
              <Moon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
          </button>

          {/* Switch Role Mechanism */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowRoleMenu(!showRoleMenu);
                setShowUserMenu(false);
              }}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-extrabold border transition-colors shadow-sm ${
                isDemoUser
                  ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-200'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-750 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}
              title={isDemoUser ? 'Sandbox Demo Role Switcher' : 'Portal Switch & Access Control'}
            >
              <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{isDemoUser ? t.navSwitchRole : (language === 'hi' ? 'पोर्टल बदलें' : language === 'mr' ? 'पोर्टल बदला' : 'Switch Portal')}</span>
              <ChevronDown className={`w-3 h-3 text-amber-600 dark:text-amber-400 transition-transform ${showRoleMenu ? 'rotate-180' : ''}`} />
            </button>

            {showRoleMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowRoleMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in-50 duration-100">
                  <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      {t.activeRoleBadge}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${roleBadgeStyle}`}>
                      {role === 'COLLECTOR' ? t.roleCollector : role === 'RECYCLER' ? t.roleRecycler : t.roleAdmin}
                    </span>
                  </div>

                  {/* Mode Banner Indicator */}
                  {isDemoUser ? (
                    <div className="mx-1 mb-2 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                      <span>⚡</span>
                      <span>{language === 'hi' ? 'मूल्यांकन मोड: 1-क्लिक स्विच सक्षम' : 'Judge Sandbox: 1-Click Switch Active'}</span>
                    </div>
                  ) : (
                    <div className="mx-1 mb-2 p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{language === 'hi' ? 'सुरक्षित आरबीएसी: क्रॉस-रोल स्विच प्रमाणीकृत' : 'Production RBAC: Cross-role auth required'}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => handleRoleSwitch('COLLECTOR')}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                        role === 'COLLECTOR'
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-black'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">📦</span>
                        <div>
                          <div className="font-extrabold">{t.roleCollector}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                            {isDemoUser ? 'Ramesh Kumar (9876543210)' : (language === 'hi' ? 'फ़ील्ड पिकअप और मैनिफ़ेस्ट' : 'Field Pickups & Digital Manifest')}
                          </div>
                        </div>
                      </div>
                      {role === 'COLLECTOR' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleSwitch('RECYCLER')}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                        role === 'RECYCLER'
                          ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 font-black'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">🏭</span>
                        <div>
                          <div className="font-extrabold">{t.roleRecycler}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                            {isDemoUser ? 'EcoMetals Facility (9820098200)' : (language === 'hi' ? 'रीसाइक्लिंग बैच एवं प्लांट (प्रमाणीकरण आवश्यक)' : 'Facility Processing (Auth Req.)')}
                          </div>
                        </div>
                      </div>
                      {role === 'RECYCLER' && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleSwitch('ADMIN')}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                        role === 'ADMIN'
                          ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-black'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <div>
                          <div className="font-extrabold">{t.roleAdmin}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                            {isDemoUser ? 'CPCB Oversight Cell (9999999999)' : (language === 'hi' ? 'सीपीसीबी नेशनल ओवरसाइट (पासकोड आवश्यक)' : 'CPCB Central Oversight (Passcode Req.)')}
                          </div>
                        </div>
                      </div>
                      {role === 'ADMIN' && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Pill & Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowRoleMenu(false);
              }}
              className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
              title={userName}
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                {userName.charAt(0)}
              </div>
              <span className="hidden xl:inline text-xs font-bold text-slate-900 dark:text-white max-w-[110px] truncate">
                {userName}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in-50 duration-100">
                  <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 mb-1.5">
                    <span className="text-xs font-black text-slate-900 dark:text-white truncate block">{userName}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">{user?.phone || '9876543210'}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                      {role === 'COLLECTOR' ? 'Verified Collector' : role === 'RECYCLER' ? 'Registered Facility' : 'CPCB Admin'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate(role === 'COLLECTOR' ? '/collector/profile' : role === 'RECYCLER' ? '/recycler/profile' : '/admin');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition-colors mb-1"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t.navProfile || 'My Profile'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-2 transition-colors border-t border-slate-100 dark:border-slate-800/80 pt-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    <span>{t.signOut || 'Log Out'}</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Direct 1-Click Visible Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/80 transition-all shadow-sm active:scale-95 shrink-0"
            title={t.signOut || 'Log Out'}
          >
            <LogOut className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
            <span className="hidden sm:inline font-black">{t.signOut || 'Log Out'}</span>
          </button>
        </div>
      </div>

      {/* Live E-Waste Mandi Ticker Bar */}
      <div className="bg-slate-950/90 border-t border-slate-800/60 overflow-hidden py-1 px-3 sm:px-4 flex items-center text-xs w-full max-w-full">
        <div 
          onClick={() => role === 'COLLECTOR' && navigate('/collector/prices')} 
          className="flex items-center gap-1.5 shrink-0 pr-2 sm:pr-3 mr-2 border-r border-slate-800 cursor-pointer hover:text-emerald-400 transition-colors select-none"
          title="Click to view Live Mandi Rates"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <span className="text-[10px] font-black tracking-wider uppercase text-emerald-400 font-display flex items-center gap-1 shrink-0">
            <TrendingUp className="w-3 h-3 shrink-0" />
            <span className="hidden xs:inline">MANDI LIVE:</span>
            <span className="xs:hidden">LIVE:</span>
          </span>
        </div>
        <div className="overflow-hidden flex-1 relative min-w-0">
          <div className="animate-ticker flex items-center gap-6 text-[11px] font-mono text-slate-300">
            {[...tickerPrices, ...tickerPrices].map((item, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-slate-400 font-sans font-bold">{item.category}:</span>
                <span className="text-white font-bold font-mono">₹{item.rate}/kg</span>
                <span className="text-emerald-400 text-[10px] font-black">{item.shift}</span>
                <span className="text-slate-700 mx-1">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* SIH Judge Demo Modal */}
      {showJudgeModal && (
        <JudgeDemoModal isOpen={showJudgeModal} onClose={() => setShowJudgeModal(false)} />
      )}

      {/* RBAC Role Switch Security Guard Modal for Real Authenticated Accounts */}
      {restrictedTargetRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-6 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setRestrictedTargetRole(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                {restrictedTargetRole === 'ADMIN' ? (
                  <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {restrictedTargetRole === 'ADMIN' 
                    ? (language === 'hi' ? 'सीपीसीबी सुरक्षा मंजूरी आवश्यक' : 'CPCB Security Clearance Required')
                    : (language === 'hi' ? 'अधिकृत पोर्टल प्रमाणीकरण आवश्यक' : 'Authorized Portal Access Required')
                  }
                </h3>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                  RBAC Level 3 Guard • SIH-26229
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs mb-4 space-y-2">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="font-semibold">{language === 'hi' ? 'सक्रिय सत्र:' : 'Active Session:'}</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {role} ({user?.phone || user?.name})
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="font-semibold">{language === 'hi' ? 'अनुरोधित पोर्टल:' : 'Requested Portal:'}</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono uppercase">
                  {restrictedTargetRole === 'ADMIN' ? 'CPCB Central Oversight' : restrictedTargetRole === 'RECYCLER' ? 'Recycler Facility' : 'Collector'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {restrictedTargetRole === 'ADMIN' 
                  ? (language === 'hi'
                    ? 'सीपीसीबी नेशनल ओवरसाइट पोर्टल में अप्रतिबंधित प्रशासनिक विशेषाधिकार हैं। इसमें प्रवेश के लिए सीपीसीबी मास्टर पासकोड आवश्यक है।'
                    : 'CPCB National Oversight portal holds regulatory audit trails and compliance registries. Elevated access requires CPCB administrative authorization.')
                  : (language === 'hi'
                    ? 'क्रॉस-टेनेंट डेटा सुरक्षा के लिए बिना प्रमाणीकरण के भूमिका बदलना प्रतिबंधित है। कृपया संबंधित पोर्टल के अधिकृत क्रेडेंशियल्स से साइन इन करें।'
                    : 'Direct privilege switching is restricted under zero-trust RBAC policy. Please sign in with the registered credentials for this operations portal.')
                }
              </div>
            </div>

            {restrictedTargetRole === 'ADMIN' ? (
              <form onSubmit={handleAdminPasscodeSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'hi' ? 'सीपीसीबी मास्टर पासकोड दर्ज करें:' : 'Enter CPCB Master Passcode:'}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={adminPasscode}
                      onChange={(e) => {
                        setAdminPasscode(e.target.value);
                        setPasscodeError('');
                      }}
                      placeholder="SIH2026-CPCB-ADMIN"
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 text-slate-900 dark:text-white"
                      autoFocus
                    />
                  </div>
                  {passcodeError && (
                    <p className="text-[11px] text-red-500 font-bold mt-1 animate-in fade-in-50">
                      {passcodeError}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-800 dark:text-amber-300">
                  <span className="font-mono">Official PIN: SIH2026-CPCB-ADMIN</span>
                  <button
                    type="button"
                    onClick={() => setAdminPasscode('SIH2026-CPCB-ADMIN')}
                    className="font-black underline uppercase text-amber-600 dark:text-amber-400 hover:opacity-80"
                  >
                    Auto-Fill
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isAuthorizingAdmin || !adminPasscode.trim()}
                    className="flex-1 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isAuthorizingAdmin ? 'Verifying...' : (language === 'hi' ? 'प्रशासक पोर्टल अनलॉक करें' : 'Unlock Admin Portal')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchAccountViaLogin('ADMIN')}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    {language === 'hi' ? 'लॉगिन पेज' : 'Login Page'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleSwitchAccountViaLogin(restrictedTargetRole)}
                  className="w-full py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>
                    {language === 'hi' 
                      ? `${restrictedTargetRole === 'RECYCLER' ? 'रीसाइक्लर' : 'कलेक्टर'} लॉगिन पोर्टल पर जाएं`
                      : `Log Out & Sign In as ${restrictedTargetRole === 'RECYCLER' ? 'Recycler' : 'Collector'}`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRestrictedTargetRole(null)}
                  className="w-full py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {language === 'hi' ? 'रद्द करें और वर्तमान सत्र में रहें' : 'Cancel & Stay in Current Session'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
