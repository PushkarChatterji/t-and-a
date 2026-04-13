'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserProfile } from '@/types/user';

const SESSION_KEY = 'ep_user';

function readCachedUser(): UserProfile | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (accessToken: string, user: UserProfile) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const cached = typeof window !== 'undefined' ? readCachedUser() : null;
  const [state, setState] = useState<AuthState>({
    user: cached,
    accessToken: null,
    // Always loading until the refresh attempt completes — cached user is optimistic
    isLoading: true,
  });

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/users/me', { credentials: 'include' });
      if (res.ok) {
        const { data } = await res.json();
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
        setState(prev => ({ ...prev, user: data, isLoading: false }));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
        setState({ user: null, accessToken: null, isLoading: false });
      }
    } catch {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // On mount, revalidate the session. If we had a cached user, do it silently (no spinner).
  useEffect(() => {
    const controller = new AbortController();
    const hasCached = state.user !== null;

    // Failsafe: only apply hard timeout when we have no cached user (showing spinner)
    const timeout = hasCached ? null : setTimeout(() => {
      controller.abort();
      setState({ user: null, accessToken: null, isLoading: false });
    }, 8000);

    const init = async () => {
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          signal: controller.signal,
        });
        if (refreshRes.ok) {
          const { data } = await refreshRes.json();
          setState(prev => ({ ...prev, accessToken: data.accessToken, isLoading: false }));
          await refreshUser();
        } else {
          sessionStorage.removeItem(SESSION_KEY);
          setState({ user: null, accessToken: null, isLoading: false });
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        // Network error — keep cached user if we have one, just clear loading
        if (!hasCached) setState({ user: null, accessToken: null, isLoading: false });
        else setState(prev => ({ ...prev, isLoading: false }));
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    };
    init();
    return () => { if (timeout) clearTimeout(timeout); controller.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback((accessToken: string, user: UserProfile) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setState({ user, accessToken, isLoading: false });
  }, []);

  const logout = useCallback(async () => {
    sessionStorage.removeItem(SESSION_KEY);
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setState({ user: null, accessToken: null, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
