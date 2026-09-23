import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  IndianRupee,
  Truck,
  Receipt,
  Inbox,
  Scale,
  Factory,
  FileCheck2,
  Globe2,
  AlertTriangle,
  ShieldCheck,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types';

export const MobileBottomNav: React.FC = () => {
  const { role } = useAuth();
  const { language, t } = useLanguage();
  const location = useLocation();
  const path = location.pathname;

  const getMobileItems = (currentRole: UserRole) => {
    switch (currentRole) {
      case 'COLLECTOR':
        return [
          { to: '/collector', label: t.navDashboard, icon: LayoutDashboard, exact: true },
          { to: '/collector/prices', label: t.navPrices, icon: IndianRupee },
          { to: '/collector/add', label: t.navAddLot, icon: PlusCircle, isCenter: true },
          { to: '/collector/requests', label: t.navRequests, icon: Truck },
          { to: '/collector/ledger', label: t.navLedger, icon: Receipt }
        ];

      case 'RECYCLER':
        return [
          { to: '/recycler', label: t.navDashboard, icon: LayoutDashboard, exact: true },
          { to: '/recycler/requests', label: t.navIncomingRequests, icon: Inbox },
          { to: '/recycler/handover', label: t.navHandover, icon: Scale, isCenter: true },
          { to: '/recycler/pickups', label: t.navPickups, icon: Truck },
          { to: '/recycler/inventory', label: t.navInventory, icon: Factory }
        ];

      case 'ADMIN':
        return [
          { to: '/admin', label: language === 'hi' ? 'डैशबोर्ड' : language === 'mr' ? 'डॅशबोर्ड' : 'Overview', icon: LayoutDashboard, exact: true },
          { to: '/admin/recyclers', label: language === 'hi' ? 'रीसाइक्लर्स' : language === 'mr' ? 'रिसायकलर' : 'Recyclers', icon: ShieldCheck },
          { to: '/admin/map', label: language === 'hi' ? 'जीआईएस मैप' : language === 'mr' ? 'नकाशा' : 'GIS Map', icon: Globe2, isCenter: true },
          { to: '/admin/anomalies', label: language === 'hi' ? 'विसंगतियां' : language === 'mr' ? 'विसंगती' : 'Anomalies', icon: AlertTriangle },
          { to: '/admin/datasets', label: language === 'hi' ? 'डेटासेट' : language === 'mr' ? 'डेटासेट' : 'Datasets', icon: Database }
        ];

      default:
        return [];
    }
  };

  const items = getMobileItems(role);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-1 px-2 md:hidden shadow-lg safe-area-bottom transition-colors">
      <div className="flex items-center justify-around w-full max-w-md mx-auto">
        {items.map((item) => {
          const isActive = item.exact
            ? path === item.to
            : path === item.to || path.startsWith(`${item.to}/`);
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center -mt-5"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-600/30 dark:shadow-emerald-950 flex items-center justify-center ring-4 ring-slate-50 dark:ring-slate-900 hover:scale-105 active:scale-95 transition-all">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 mt-1 max-w-[60px] truncate text-center">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[48px] py-1 px-1 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold mt-0.5 max-w-[62px] truncate text-center leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
