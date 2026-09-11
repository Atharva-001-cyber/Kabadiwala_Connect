import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Recycle, Globe, UserCheck, Shield, LogOut, CheckCircle2, AlertCircle, WifiOff, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSync } from '../../context/SyncContext';
import { Language, UserRole } from '../../types';
import { JudgeDemoModal } from './JudgeDemoModal';

export const Navbar: React.FC = () => {
  const { user, role, switchDemoRole, logout, isAuthenticated } = useAuth();
  const { language, t } = useLanguage();
  const { isOnline, pendingCount } = useSync();
  const navigate = useNavigate();
  const [showJudgeModal, setShowJudgeModal] = useState<boolean>(false);

  const handleRoleChange = async (newRole: UserRole) => {
    await switchDemoRole(newRole);
    if (newRole === 'COLLECTOR') navigate('/collector');
    else if (newRole === 'RECYCLER') navigate('/recycler');
    else if (newRole === 'ADMIN') navigate('/admin');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Slogan */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition-transform">
              <Recycle className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
                  {t.appTitle}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
                  SIH #229
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                {t.slogan}
              </p>
            </div>
          </Link>

          {/* Right Controls: Role Switcher + Language Selector + Sync Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sync Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700">
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
              className="px-3 py-1.5 rounded-xl font-black text-xs bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-950/40 flex items-center gap-1.5 active:scale-95 transition-all border border-amber-400/50 animate-pulse"
              title="Open SIH 2026 Grand Finale Judge Demonstration Guide"
            >
              <span>⚖️</span>
              <span className="hidden sm:inline">{t.judgeGuideBtn}</span>
            </button>

            {/* Quick Demo Persona Switcher */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 text-xs">
              <button
                type="button"
                onClick={() => handleRoleChange('COLLECTOR')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  role === 'COLLECTOR'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title={t.roleCollector}
              >
                <span>📦</span>
                <span className="hidden sm:inline">{t.roleCollector}</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('RECYCLER')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  role === 'RECYCLER'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title={t.roleRecycler}
              >
                <span>🏭</span>
                <span className="hidden sm:inline">{t.roleRecycler}</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('ADMIN')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  role === 'ADMIN'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title={t.roleAdmin}
              >
                <Shield className="w-3 h-3 text-purple-200" />
                <span className="hidden sm:inline">{t.roleAdmin}</span>
              </button>
            </div>

            {/* Language Indicator (Non-Interactive) */}
            <div className="flex items-center bg-slate-800 rounded-xl px-2.5 py-1 border border-slate-700 text-xs font-bold text-slate-200 select-none">
              <Globe className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
              <span>{language === 'hi' ? 'हिंदी (HI)' : language === 'mr' ? 'मराठी (MR)' : 'English (EN)'}</span>
            </div>

            {/* Auth State Button */}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                title={t.logout}
                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t.logout}</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow flex items-center gap-1"
              >
                <span>🔑</span>
                <span>{t.login}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* SIH Judge Demo Guide Modal */}
      <JudgeDemoModal isOpen={showJudgeModal} onClose={() => setShowJudgeModal(false)} />
    </header>
  );
};
