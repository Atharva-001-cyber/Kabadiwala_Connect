import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { SplashScreen } from './components/common/SplashScreen';

// Auth
import { LoginPage } from './pages/auth/LoginPage';

// Collector Panel Pages
import { CollectorDashboard } from './pages/collector/CollectorDashboard';
import { AddLotPage } from './pages/collector/AddLotPage';
import { PriceBoardPage } from './pages/collector/PriceBoardPage';
import { FindRecyclerPage } from './pages/collector/FindRecyclerPage';
import { MyRequestsPage } from './pages/collector/MyRequestsPage';
import { HandoverViewPage } from './pages/collector/HandoverViewPage';
import { TrackingPage } from './pages/collector/TrackingPage';
import { EarningsLedgerPage } from './pages/collector/EarningsLedgerPage';
import { SafetyCenterPage } from './pages/collector/SafetyCenterPage';
import { CollectorProfilePage } from './pages/collector/CollectorProfilePage';

// Recycler Panel Pages
import { RecyclerDashboard } from './pages/recycler/RecyclerDashboard';
import { IncomingRequestsPage } from './pages/recycler/IncomingRequestsPage';
import { PickupManagementPage } from './pages/recycler/PickupManagementPage';
import { HandoverVerificationPage } from './pages/recycler/HandoverVerificationPage';
import { InventoryProcessingPage } from './pages/recycler/InventoryProcessingPage';
import { RecyclerTransactionsPage } from './pages/recycler/RecyclerTransactionsPage';
import { RecyclerProfilePage } from './pages/recycler/RecyclerProfilePage';

// Admin Panel Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { RecyclerVerificationPage } from './pages/admin/RecyclerVerificationPage';
import { EwasteGeoMapPage } from './pages/admin/EwasteGeoMapPage';
import { AnomalyMonitorPage } from './pages/admin/AnomalyMonitorPage';
import { DisputeResolutionPage } from './pages/admin/DisputeResolutionPage';
import { DatasetManagerPage } from './pages/admin/DatasetManagerPage';

// Citizen Smart E-Waste Beacon Pages
import { SmartBeaconPage } from './pages/citizen/SmartBeaconPage';
import { BeaconTrackingPage } from './pages/citizen/BeaconTrackingPage';

import { useAuth } from './context/AuthContext';

const ProtectedRoute: React.FC<{
  children?: React.ReactNode;
  allowedRoles?: ('COLLECTOR' | 'RECYCLER' | 'ADMIN')[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-400">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const targetRole = location.pathname.startsWith('/recycler')
      ? 'RECYCLER'
      : location.pathname.startsWith('/admin')
        ? 'ADMIN'
        : 'COLLECTOR';
    return <Navigate to="/login" state={{ from: location, targetRole }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={`/${role.toLowerCase()}`} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

import { speechService } from './services/speechService';

const GlobalVoiceRouteCleaner: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if ((window as any).__isVoiceNavigating) {
        (window as any).__isVoiceNavigating = false;
      } else {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        speechService.stop();
      }
    }
  }, [location.pathname]);

  return null;
};

export const App: React.FC = () => {
  const { role, isAuthenticated } = useAuth();
  const [showSplash, setShowSplash] = React.useState<boolean>(true);

  return (
    <BrowserRouter>
      <GlobalVoiceRouteCleaner />
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Routes>
        {/* Root redirect based on auth & role */}
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to={`/${role.toLowerCase()}`} replace /> : <Navigate to="/login" replace />
          }
        />

        {/* Dedicated Unauthenticated Authentication Portal */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to={`/${role.toLowerCase()}`} replace /> : <LoginPage />
          }
        />

        {/* Authenticated Dashboard Shell */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Collector Routes (Protected strictly for COLLECTOR) */}
          <Route element={<ProtectedRoute allowedRoles={['COLLECTOR']} />}>
            <Route path="/collector" element={<CollectorDashboard />} />
            <Route path="/collector/add" element={<AddLotPage />} />
            <Route path="/collector/prices" element={<PriceBoardPage />} />
            <Route path="/collector/recyclers" element={<FindRecyclerPage />} />
            <Route path="/collector/requests" element={<MyRequestsPage />} />
            <Route path="/collector/handover/:lotId" element={<HandoverViewPage />} />
            <Route path="/collector/tracking/:lotId?" element={<TrackingPage />} />
            <Route path="/collector/ledger" element={<EarningsLedgerPage />} />
            <Route path="/collector/safety" element={<SafetyCenterPage />} />
            <Route path="/collector/profile" element={<CollectorProfilePage />} />
          </Route>

          {/* Recycler Routes (Protected strictly for RECYCLER) */}
          <Route element={<ProtectedRoute allowedRoles={['RECYCLER']} />}>
            <Route path="/recycler" element={<RecyclerDashboard />} />
            <Route path="/recycler/requests" element={<IncomingRequestsPage />} />
            <Route path="/recycler/pickups" element={<PickupManagementPage />} />
            <Route path="/recycler/handover" element={<HandoverVerificationPage />} />
            <Route path="/recycler/inventory" element={<InventoryProcessingPage />} />
            <Route path="/recycler/transactions" element={<RecyclerTransactionsPage />} />
            <Route path="/recycler/profile" element={<RecyclerProfilePage />} />
          </Route>

          {/* Admin Routes (Strictly Protected for ADMIN) */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/recyclers" element={<RecyclerVerificationPage />} />
            <Route path="/admin/map" element={<EwasteGeoMapPage />} />
            <Route path="/admin/anomalies" element={<AnomalyMonitorPage />} />
            <Route path="/admin/disputes" element={<DisputeResolutionPage />} />
            <Route path="/admin/datasets" element={<DatasetManagerPage />} />
          </Route>
        </Route>

        {/* Citizen Smart E-Waste Beacon Disposal Routes (Standalone Public Access) */}
        <Route path="/citizen" element={<SmartBeaconPage />} />
        <Route path="/citizen/track/:beaconId" element={<BeaconTrackingPage />} />

        {/* Fallback Catch-All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
