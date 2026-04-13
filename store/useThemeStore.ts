import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme, ThemeMode, darkTheme, lightTheme } from '@/lib/themes';

interface ThemeStore {
  mode: ThemeMode;
  theme: Theme;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      /** Default light for first visit; persisted mode wins after rehydrate. */
      mode: 'light' as ThemeMode,
      theme: lightTheme,
      toggleTheme: () =>
        set((state) => {
          const newMode: ThemeMode = state.mode === 'dark' ? 'light' : 'dark';
          return { mode: newMode, theme: newMode === 'dark' ? darkTheme : lightTheme };
        }),
    }),
    {
      name: 'aurae-theme',
      partialize: (state) => ({ mode: state.mode }),
      merge: (persisted, current) => {
        const p = persisted as Partial<{ mode?: ThemeMode }> | undefined;
        const mode: ThemeMode =
          p?.mode === 'dark' || p?.mode === 'light' ? p.mode : current.mode;
        return {
          ...current,
          mode,
          theme: mode === 'dark' ? darkTheme : lightTheme,
        };
      },
    }
  )
);
