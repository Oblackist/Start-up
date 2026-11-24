import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { User } from '../types';
import {
  ApiErrorClass,
  authLogin,
  authLogout,
  authMe,
  authRegister,
  authCsrf,
} from './api';

export interface AuthState {
  user: User | null;
  loading: boolean;
  sessionExpired: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string, captchaToken?: string) => Promise<{ user?: User; mfa_required?: boolean; challenge_token?: string }>;
  register: (name: string, email: string, password: string, confirm: string, captchaToken?: string) => ReturnType<typeof authRegister>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  clearSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  const refresh = useCallback(async () => {
    try {
      const { user: u } = await authMe();
      setUser(u);
      try {
        await authCsrf();
      } catch {
        // ignore CSRF errors
      }
    } catch (err: unknown) {
      if (err instanceof ApiErrorClass && err.status === 401) {
        setUser(null);
      } else {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string, captchaToken?: string) => {
      const result = await authLogin({
        email,
        password,
        captcha_token: captchaToken,
      });
      if (result.mfa_required) return result;
      const u = result.user;
      if (!u) throw new Error('Giriş cavabı etibarsızdır');
      setUser(u);
      setSessionExpired(false);
      try {
        await authCsrf();
      } catch {
        // ignored
      }
      return { user: u };
    },
    [],
  );

  const register = useCallback(
    async (name: string, email: string, password: string, confirm: string, captchaToken?: string) => {
      const result = await authRegister({
        name,
        email,
        password,
        confirm,
        captcha_token: captchaToken,
      });
      if (!result.requires_verification) {
        setUser(result.user);
        setSessionExpired(false);
      }
      return result;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authLogout();
    } catch {
      // ignored
    } finally {
      setUser(null);
    }
  }, []);

  const clearSessionExpired = useCallback(() => setSessionExpired(false), []);

  useEffect(() => {
    function onUnauthorized() {
      if (userRef.current) {
        setSessionExpired(true);
        setUser(null);
      }
    }
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      sessionExpired,
      login,
      register,
      logout,
      refresh,
      clearSessionExpired,
    }),
    [
      user,
      loading,
      sessionExpired,
      login,
      register,
      logout,
      refresh,
      clearSessionExpired,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
