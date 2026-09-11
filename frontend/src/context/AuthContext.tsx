import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, CollectorProfile, RecyclerProfile } from '../types';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';

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
  loginWithOtp: (
    phone: string,
    otp: string,
    role?: UserRole,
    name?: string,
    district?: string,
    extra?: { facilityName?: string; adminPasscode?: string }
  ) => Promise<LoginResult>;
  switchDemoRole: (role: UserRole) => Promise<LoginResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { name?: string; district?: string; state?: string; preferredPaymentMethod?: string; upiId?: string }) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [collectorProfile, setCollectorProfile] = useState<CollectorProfile | null>(null);
  const [recyclerProfile, setRecyclerProfile] = useState<RecyclerProfile | null>(null);
  const [role, setRole] = useState<UserRole>('COLLECTOR');
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  const updateProfile = async (data: { name?: string; district?: string; state?: string; preferredPaymentMethod?: string; upiId?: string }) => {
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
    setUser(null);
    setCollectorProfile(null);
    setRecyclerProfile(null);
    setRole('COLLECTOR');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        collectorProfile,
        recyclerProfile,
        role,
        isAuthenticated: !!user,
        isLoading,
        loginWithOtp,
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
