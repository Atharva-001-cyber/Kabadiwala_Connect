import React, { useState } from 'react';
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
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSync } from '../../context/SyncContext';
import { Language, UserRole } from '../../types';
import { JudgeDemoModal } from '../common/JudgeDemoModal';
import { formatUserDisplayName } from '../../i18n/translations';

interface DashboardHeaderProps {
  onToggleMobile: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onToggleMobile }) => {
  const { role, user, collectorProfile, recyclerProfile, switchDemoRole, logout } = useAuth();
  const { language, t } = useLanguage();
  const { isOnline, pendingCount } = useSync();
  const navigate = useNavigate();
  const location = useLocation();

  const [showJudgeModal, setShowJudgeModal] = useState<boolean>(false);
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

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

  const handleRoleSwitch = (newRole: UserRole) => {
    setShowRoleMenu(false);
    if (newRole === role) {
      if (newRole === 'COLLECTOR') navigate('/collector');
      else if (newRole === 'RECYCLER') navigate('/recycler');
      else if (newRole === 'ADMIN') navigate('/admin');
      return;
    }
    // Secure switching: Must log out existing session and redirect to respective portal's login screen
    logout();
    navigate('/login', { state: { targetRole: newRole }, replace: true });
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
    <header className="sticky top-0 z-30 h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shadow-md">
      {/* Left: Mobile Toggle + Breadcrumb / Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobile}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 md:hidden transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
              {getSectionTitle()}
            </h1>
            <span className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${roleBadgeStyle}`}>
              {role === 'COLLECTOR' ? t.roleCollector : role === 'RECYCLER' ? t.roleRecycler : t.roleAdmin}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sync Telemetry Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/90 border border-slate-700">
          {!isOnline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-300">{t.offlineBadge}</span>
            </>
          ) : pendingCount > 0 ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-amber-300">{pendingCount} {t.pendingBadge}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">{t.syncedBadge}</span>
            </>
          )}
        </div>

        {/* SIH Judge Demo Guide Trigger */}
        <button
          type="button"
          onClick={() => setShowJudgeModal(true)}
          className="px-2.5 sm:px-3 py-1.5 rounded-xl font-black text-xs bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-950/40 flex items-center gap-1.5 active:scale-95 transition-all border border-amber-400/50"
          title="Open SIH 2026 Grand Finale Judge Demonstration Guide"
        >
          <span>⚖️</span>
          <span className="hidden sm:inline font-extrabold">{t.judgeGuideBtn}</span>
        </button>

        {/* NON-INTERACTIVE Language Indicator (Language selection is exclusive to Login page) */}
        <div className="flex items-center bg-slate-800/80 rounded-xl px-2.5 py-1.5 border border-slate-700/80 text-xs font-bold text-slate-300 select-none">
          <Globe className="w-3.5 h-3.5 text-emerald-400 mr-1.5 shrink-0" />
          <span className="text-slate-200">
            {language === 'hi' ? 'हिंदी (HI)' : language === 'mr' ? 'मराठी (MR)' : 'English (EN)'}
          </span>
        </div>

        {/* Switch Role Mechanism */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 transition-colors"
            title={t.navSwitchRole}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">{t.navSwitchRole}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in-50 duration-100">
              <div className="px-3 py-1.5 border-b border-slate-800 mb-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  {t.activeRoleBadge}
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {role === 'COLLECTOR' ? t.roleCollector : role === 'RECYCLER' ? t.roleRecycler : t.roleAdmin}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleRoleSwitch('COLLECTOR')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                  role === 'COLLECTOR'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-black'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>📦</span>
                  <span>{t.roleCollector}</span>
                </div>
                {role === 'COLLECTOR' && <span className="text-[10px]">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => handleRoleSwitch('RECYCLER')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                  role === 'RECYCLER'
                    ? 'bg-blue-950 text-blue-300 border border-blue-800 font-black'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>🏭</span>
                  <span>{t.roleRecycler}</span>
                </div>
                {role === 'RECYCLER' && <span className="text-[10px]">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => handleRoleSwitch('ADMIN')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                  role === 'ADMIN'
                    ? 'bg-purple-950 text-purple-300 border border-purple-800 font-black'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span>{t.roleAdmin}</span>
                </div>
                {role === 'ADMIN' && <span className="text-[10px]">✓</span>}
              </button>
            </div>
          )}
        </div>

        {/* User Pill & Profile/Logout */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-xs">
              {userName.charAt(0)}
            </div>
            <span className="hidden xl:inline text-xs font-bold text-white max-w-[120px] truncate">
              {userName}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in-50 duration-100">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <span className="text-xs font-bold text-white truncate block">{userName}</span>
                <span className="text-[10px] text-slate-400 block">{user?.phone || '9876543210'}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/40 hover:text-red-300 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.signOut}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SIH Judge Demo Modal */}
      {showJudgeModal && (
        <JudgeDemoModal isOpen={showJudgeModal} onClose={() => setShowJudgeModal(false)} />
      )}
    </header>
  );
};
