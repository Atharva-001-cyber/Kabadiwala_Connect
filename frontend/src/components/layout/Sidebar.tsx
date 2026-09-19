import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Recycle,
  LayoutDashboard,
  PlusCircle,
  Truck,
  Search,
  IndianRupee,
  Link2,
  Receipt,
  ShieldCheck,
  User,
  Inbox,
  Scale,
  Factory,
  FileCheck2,
  FileSpreadsheet,
  Globe2,
  AlertTriangle,
  Gavel,
  Database,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types';
import { formatUserDisplayName, formatLocationString } from '../../i18n/translations';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse, onCloseMobile }) => {
  const { role, user, collectorProfile, recyclerProfile, logout } = useAuth();
  const { t, language } = useLanguage();
  const location = useLocation();
  const path = location.pathname;

  // Role-Specific Navigation Definitions
  const getNavItems = (currentRole: UserRole) => {
    switch (currentRole) {
      case 'COLLECTOR':
        return [
          { to: '/collector', label: t.navDashboard, icon: LayoutDashboard, exact: true },
          { to: '/collector/add', label: t.navAddLot, icon: PlusCircle, highlight: true },
          { to: '/collector/requests', label: t.navRequests, icon: Truck },
          { to: '/collector/recyclers', label: t.navRecyclers, icon: Search },
          { to: '/collector/prices', label: t.navPrices, icon: IndianRupee },
          { to: '/collector/tracking', label: t.navTracking, icon: Link2 },
          { to: '/collector/ledger', label: t.navLedger, icon: Receipt },
          { to: '/collector/safety', label: t.navSafety, icon: ShieldCheck },
          { to: '/collector/profile', label: t.navProfile, icon: User }
        ];

      case 'RECYCLER':
        return [
          { to: '/recycler', label: t.navRecyclerDashboard, icon: LayoutDashboard, exact: true },
          { to: '/recycler/requests', label: t.navIncomingRequests, icon: Inbox },
          { to: '/recycler/pickups', label: t.navPickups, icon: Truck },
          { to: '/recycler/handover', label: t.navHandover, icon: Scale, highlight: true },
          { to: '/recycler/inventory', label: t.navInventory, icon: Factory },
          { to: '/recycler/transactions', label: t.navTransactions, icon: FileCheck2 },
          { to: '/recycler/profile', label: t.navFacilityProfile, icon: User }
        ];

      case 'ADMIN':
        return [
          { to: '/admin', label: t.navAdminDashboard, icon: LayoutDashboard, exact: true },
          { to: '/admin/map', label: t.navGeoMap, icon: Globe2, highlight: true },
          { to: '/admin/recyclers', label: t.navRecyclerVerify, icon: ShieldCheck },
          { to: '/admin/anomalies', label: t.navAnomaly, icon: AlertTriangle },
          { to: '/admin/disputes', label: t.navDisputes, icon: Gavel },
          { to: '/admin/datasets', label: t.navDatasets, icon: Database }
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems(role);

  // Theme accents per role (Adaptive Light & Dark - High Contrast)
  const roleTheme = {
    COLLECTOR: {
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-extrabold',
      activeItem: 'bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-400 border-emerald-600 dark:border-emerald-500 font-black shadow-sm border-r-4',
      hoverItem: 'hover:bg-emerald-50 dark:hover:bg-slate-800/80 hover:text-emerald-900 dark:hover:text-emerald-300 text-slate-800 dark:text-slate-300 font-bold',
      roleTitle: t.roleCollector,
      roleIcon: '📦',
      accentGradient: 'from-emerald-600 to-teal-500'
    },
    RECYCLER: {
      badgeBg: 'bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-300 font-extrabold',
      activeItem: 'bg-blue-100/90 dark:bg-blue-950/80 text-blue-950 dark:text-blue-400 border-blue-600 dark:border-blue-500 font-black shadow-sm border-r-4',
      hoverItem: 'hover:bg-blue-50 dark:hover:bg-slate-800/80 hover:text-blue-900 dark:hover:text-blue-300 text-slate-800 dark:text-slate-300 font-bold',
      roleTitle: t.roleRecycler,
      roleIcon: '🏭',
      accentGradient: 'from-blue-600 to-cyan-500'
    },
    ADMIN: {
      badgeBg: 'bg-purple-100 dark:bg-purple-950 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-300 font-extrabold',
      activeItem: 'bg-purple-100/90 dark:bg-purple-950/80 text-purple-950 dark:text-purple-400 border-purple-600 dark:border-purple-500 font-black shadow-sm border-r-4',
      hoverItem: 'hover:bg-purple-50 dark:hover:bg-slate-800/80 hover:text-purple-900 dark:hover:text-purple-300 text-slate-800 dark:text-slate-300 font-bold',
      roleTitle: t.roleAdmin,
      roleIcon: '🛡️',
      accentGradient: 'from-purple-600 to-indigo-500'
    }
  }[role];

  // User display name & localized placeholder handling
  const rawName =
    role === 'COLLECTOR' ? (collectorProfile?.name || user?.name) :
    role === 'RECYCLER' ? (recyclerProfile?.facilityName || user?.name) :
    user?.name;

  const userName = formatUserDisplayName(rawName, role, language);

  const userSubtext =
    role === 'COLLECTOR' ? formatLocationString(collectorProfile?.district || 'Lucknow', collectorProfile?.state || 'UP', language) :
    role === 'RECYCLER' ? (recyclerProfile?.registrationNo
      ? `${recyclerProfile.registrationNo} • ${recyclerProfile.authorizationStatus === 'AUTHORIZED' ? (language === 'hi' ? 'अधिकृत' : language === 'mr' ? 'अधिकृत' : 'Authorized') : (language === 'hi' ? 'लंबित' : language === 'mr' ? 'प्रलंबित' : 'Pending')}`
      : (language === 'hi' ? 'प्लेटफॉर्म-प्रबंधित अधिकृत' : language === 'mr' ? 'प्लॅटफॉर्म-व्यवस्थापित अधिकृत' : 'Platform-Managed Authorization')) :
    (language === 'hi' ? 'एसपीसीबी / सीपीसीबी निगरानी प्रकोष्ठ' : language === 'mr' ? 'एसपीसीबी / सीपीसीबी देखरेख कक्ष' : 'SPCB / CPCB Oversight Cell');

  return (
    <aside
      className={`h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out select-none ${
        isCollapsed ? 'w-20' : 'w-68 sm:w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-3.5 sm:px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 transition-colors">
        <Link
          to={`/${role.toLowerCase()}`}
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 min-w-0 flex-1 group"
        >
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${roleTheme.accentGradient} flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform`}>
            <Recycle className="w-5 h-5 animate-spin-slow" />
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs sm:text-sm tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  {t.appTitle}
                </span>
                <span className="px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shrink-0">
                  #229
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {t.slogan}
              </p>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isCollapsed ? t.expandSidebar : t.collapseSidebar}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Pill Banner */}
      <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800/60 transition-colors">
        <div
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-bold ${roleTheme.badgeBg} ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-sm shrink-0">{roleTheme.roleIcon}</span>
            {!isCollapsed && <span className="truncate font-black tracking-wide">{roleTheme.roleTitle}</span>}
          </div>
          {!isCollapsed && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = item.exact
            ? path === item.to
            : path === item.to || path.startsWith(`${item.to}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all border ${
                isActive
                  ? `${roleTheme.activeItem} border-l-4`
                  : `border-transparent ${roleTheme.hoverItem}`
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-current' : 'text-slate-400'}`} />
              
              {!isCollapsed && (
                <span className="font-bold truncate flex-1">{item.label}</span>
              )}

              {!isCollapsed && item.highlight && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shrink-0"></span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* CPCB EPR Compliance & National Helpline Card */}
      {!isCollapsed && (
        <div className="mx-3 mb-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-emerald-500/30 text-[10px] space-y-1 shadow-sm transition-colors">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {language === 'hi' ? 'CPCB अनुसूची-I प्रमाणित' : language === 'mr' ? 'CPCB अनुसूची-I प्रमाणित' : 'CPCB Schedule-I Certified'}
            </span>
          </div>
          <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">
            {language === 'hi' ? 'भारत सरकार • ई-कचरा नियम 2022' : language === 'mr' ? 'भारत सरकार • ई-कचरा नियम 2022' : 'Govt. of India • E-Waste Rules 2022'}
          </p>
          <div className="pt-1 flex items-center justify-between text-[9px] text-slate-600 dark:text-slate-300 font-mono border-t border-slate-200 dark:border-slate-800">
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              {language === 'hi' ? 'हेल्पलाइन:' : language === 'mr' ? 'हेल्पलाइन:' : 'Helpline:'}
            </span>
            <span>1800-E-WASTE</span>
          </div>
        </div>
      )}

      {/* User / Session Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 transition-colors">
        <div className={`flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-sm ${isCollapsed ? 'justify-center' : ''}`}>
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleTheme.accentGradient} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
            {userName.charAt(0)}
          </div>

          {!isCollapsed && (
            <div className="overflow-hidden flex-1 min-w-0">
              <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate block">
                {userName}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
                {userSubtext}
              </span>
            </div>
          )}

          {!isCollapsed && (
            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
              title={t.signOut}
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
