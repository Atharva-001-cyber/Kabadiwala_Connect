import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, CollectorProfile, RecyclerProfile } from '../types';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';
import { signInWithGoogle } from '../services/firebase';

export interface LoginResult {
  success: boolean;
  role?: UserRole;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  collectorProfile: CollectorProfile | null;
  recyclerProfile: RecyclerProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoUser: boolean;
  loginWithOtp: (
    phone: string,
    otp: string,
    role?: UserRole,
    name?: string,
    district?: string,
    extra?: { facilityName?: string; adminPasscode?: string }
  ) => Promise<LoginResult>;
  loginWithGoogle: (role: UserRole, district?: string) => Promise<LoginResult>;
  switchDemoRole: (role: UserRole) => Promise<LoginResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { 
    name?: string; 
    district?: string; 
    state?: string; 
    preferredPaymentMethod?: string; 
    upiId?: string;
    kycStatus?: any;
    kycMaskedId?: string;
    address?: string;
  }) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [collectorProfile, setCollectorProfile] = useState<CollectorProfile | null>(() => {
    try {
      const stored = localStorage.getItem('collectorProfile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [recyclerProfile, setRecyclerProfile] = useState<RecyclerProfile | null>(() => {
    try {
      const stored = localStorage.getItem('recyclerProfile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [role, setRole] = useState<UserRole>(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? (JSON.parse(stored).role as UserRole) || 'COLLECTOR' : 'COLLECTOR';
    } catch {
      return 'COLLECTOR';
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const token = getAuthToken();
    const storedUser = localStorage.getItem('user');
    // If token exists and we already have cached user, do NOT block the UI!
    return Boolean(token && !storedUser);
  });

  const refreshUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        setRole(res.user.role);
        setCollectorProfile(res.collectorProfile || null);
        setRecyclerProfile(res.recyclerProfile || null);
      }
    } catch (e) {
      console.warn('Could not restore auth session:', e);
      removeAuthToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const loginWithOtp = async (
    phone: string,
    otp: string,
    selectedRole?: UserRole,
    name?: string,
    district?: string,
    extra?: { facilityName?: string; adminPasscode?: string }
  ): Promise<LoginResult> => {
    try {
      setIsLoading(true);
      const res = await api.verifyOtp({
        phone,
        otp,
        selectedRole,
        name,
        district,
        facilityName: extra?.facilityName,
        adminPasscode: extra?.adminPasscode
      });
      if (res.success && res.token) {
        setAuthToken(res.token);
        setUser(res.user);
        setRole(res.user.role);
        setCollectorProfile(res.collectorProfile || null);
        setRecyclerProfile(res.recyclerProfile || null);
        return { success: true, role: res.user.role };
      }
      return { success: false, message: 'Invalid OTP or authentication failed' };
    } catch (err: any) {
      console.warn('Login error:', err.message || 'Login failed');
      return { success: false, message: err.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (selectedRole: UserRole, district?: string): Promise<LoginResult> => {
    try {
      setIsLoading(true);
      const fbRes = await signInWithGoogle();
      if (!fbRes.success || !fbRes.user) {
        return {
          success: false,
          message: fbRes.error || 'Google Sign-in was cancelled or failed'
        };
      }

      const res = await api.syncGoogleUser({
        googleUser: {
          uid: fbRes.user.uid,
          email: fbRes.user.email,
          displayName: fbRes.user.displayName,
          photoURL: fbRes.user.photoURL,
          phoneNumber: fbRes.user.phoneNumber
        },
        role: selectedRole,
        district
      });

      if (res.success && res.token) {
        setAuthToken(res.token);
        setUser(res.user);
        setRole(res.user.role);
        setCollectorProfile(res.collectorProfile || null);
        setRecyclerProfile(res.recyclerProfile || null);
        return { success: true, role: res.user.role };
      }
      return { success: false, message: 'Could not sync Google profile' };
    } catch (err: any) {
      console.warn('Google login error:', err.message || 'Login failed');
      return { success: false, message: err.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoRole = async (targetRole: UserRole): Promise<LoginResult> => {
    const rolePhones: Record<UserRole, string> = {
      COLLECTOR: '9876543210',
      RECYCLER: '9820098200',
      ADMIN: '9999999999'
    };
    const phone = rolePhones[targetRole];
    const otp = targetRole === 'RECYCLER' ? '123456' : '1234';
    return await loginWithOtp(phone, otp, targetRole);
  };

  const updateProfile = async (data: { 
    name?: string; 
    district?: string; 
    state?: string; 
    preferredPaymentMethod?: string; 
    upiId?: string;
    kycStatus?: any;
    kycMaskedId?: string;
    address?: string;
  }) => {
    try {
      const res = await api.updateProfile(data);
      if (res.success) {
        if (res.user) setUser(res.user);
        if (res.collectorProfile) setCollectorProfile(res.collectorProfile);
        if (res.recyclerProfile) setRecyclerProfile(res.recyclerProfile);
        return { success: true };
      }
      return { success: false, message: 'Update failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Update failed' };
    }
  };

  const logout = () => {
    removeAuthToken();
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('collectorProfile');
      localStorage.removeItem('recyclerProfile');
      localStorage.removeItem('authUser');
    } catch {}
    setUser(null);
    setCollectorProfile(null);
    setRecyclerProfile(null);
    setRole('COLLECTOR');
  };

  const DEMO_PHONES = ['9876543210', '9820098200', '9999999999'];
  const isDemoUser = Boolean(user?.phone && DEMO_PHONES.includes(user.phone.trim().replace(/\D/g, '')));

  return (
    <AuthContext.Provider
      value={{
        user,
        collectorProfile,
        recyclerProfile,
        role,
        isAuthenticated: !!user,
        isLoading,
        isDemoUser,
        loginWithOtp,
        loginWithGoogle,
        switchDemoRole,
        logout,
        refreshUser,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
