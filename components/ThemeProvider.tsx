'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/useThemeStore';

/** Syncs the Zustand theme mode to a data-theme attribute on <html> so that
 *  global CSS can react to the current theme without prop-drilling. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  return <>{children}</>;
}
