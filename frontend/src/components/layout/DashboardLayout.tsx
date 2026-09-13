import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { SyncStatusBanner } from '../common/SyncStatusBanner';
import { KabaadSaathiAssistant } from '../common/KabaadSaathiAssistant';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const DashboardLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Pre-warm SWR cache in the background during idle time so navigation is instantaneous (<50ms)
  useEffect(() => {
    const prewarmCache = () => {
      try {
        if (role === 'COLLECTOR') {
          let colId = '';
          try {
            const cp = localStorage.getItem('collectorProfile');
            if (cp) colId = JSON.parse(cp)?.id;
          } catch {}
          api.getLots(colId ? { collectorId: colId, limit: '50' } : { limit: '50' }).catch(() => {});
          api.getRecyclers({ district: 'Lucknow' }).catch(() => {});
          api.getPriceBoard('Lucknow').catch(() => {});
          api.getCollectorLedger(colId || 'col_1').catch(() => {});
        } else if (role === 'RECYCLER') {
          api.getLots({ limit: '40' }).catch(() => {});
          api.getRecyclers({ district: 'Lucknow' }).catch(() => {});
        }
      } catch {}
    };

    const timer = setTimeout(prewarmCache, 250);
    return () => clearTimeout(timer);
  }, [role]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans overflow-x-hidden">
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: Fixed on Desktop, Sliding Drawer on Mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:static md:z-auto transition-transform duration-300 ease-in-out shrink-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          onCloseMobile={() => setIsMobileOpen(false)}
        />
      </div>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader onToggleMobile={() => setIsMobileOpen(!isMobileOpen)} />
        <SyncStatusBanner />

        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 pb-24 md:pb-8">
          {children || <Outlet />}
        </main>

        {/* Mobile Thumb Navigation */}
        <MobileBottomNav />

        {/* Multilingual Voice Copilot for Waste Collectors */}
        {role === 'COLLECTOR' && <KabaadSaathiAssistant />}
      </div>
    </div>
  );
};
