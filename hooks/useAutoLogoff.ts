'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const;

export function useAutoLogoff() {
  const { logout, user } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;

    const minutes = parseInt(
      document.cookie
        .split('; ')
        .find(r => r.startsWith('autoLogoffMinutes='))
        ?.split('=')[1] ?? '120',
      10
    );
    const ms = minutes * 60 * 1000;

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        logout();
      }, ms);
    };

    reset();
    EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      EVENTS.forEach(e => window.removeEventListener(e, reset));
    };
  }, [user, logout]);
}
