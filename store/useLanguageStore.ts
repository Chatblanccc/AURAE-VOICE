import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'zh';

interface LanguageState {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
      toggleLang: () => set({ lang: get().lang === 'en' ? 'zh' : 'en' }),
    }),
      { name: 'aurae-lang' }
  )
);
