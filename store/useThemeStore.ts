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
      mode: 'dark',
      theme: darkTheme,
      toggleTheme: () =>
        set((state) => {
          const newMode: ThemeMode = state.mode === 'dark' ? 'light' : 'dark';
          return { mode: newMode, theme: newMode === 'dark' ? darkTheme : lightTheme };
        }),
    }),
    { name: 'speakstar-theme' }
  )
);
