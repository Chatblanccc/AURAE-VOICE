'use client';

import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';

/** Shared light/dark toggle — used on /chat, landing navbar, etc. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme, mode } = useThemeStore();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${className}`}
      style={{ color: theme.textMuted, background: theme.bgInput }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = theme.accentText;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = theme.textMuted;
      }}
      title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {mode === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
