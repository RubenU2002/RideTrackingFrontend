import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getToken } from '@/core/auth/tokenStorage';
import { authService } from '@/core/auth/authService';
import type { User } from '@/core/api/types';
import { authApi } from '@/core/api/client';

type AuthState = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      console.warn('token desde authcontext', token);
      if (token) {
        const me = await authApi.profile();
        setUser(me.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email: string, password: string) => {
    const u = await authService.login(email, password);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const u = await authService.getProfile();
    setUser(u);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshProfile,
    }),
    [user, loading, login, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
