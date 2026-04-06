export type ThemeMode = 'dark' | 'light';

export interface Theme {
  mode: ThemeMode;
  // Backgrounds
  bgMain: string;
  bgSidebar: string;
  bgSidebarBorder: string;
  bgCard: string;
  bgCardBorder: string;
  bgInput: string;
  bgInputBorder: string;
  bgAvatarCard: string;
  bgFooter: string;
  bgFooterBorder: string;
  bgStatusPill: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDim: string;
  textDimmer: string;
  // Accent (orange — same in both themes)
  accent: string;
  accentDark: string;
  accentLight: string;
  accentPale: string;
  accentText: string;
  // Status indicator
  statusDotActive: string;
  statusDotIdle: string;
  // Chat bubbles
  bubbleUserBg: string;
  bubbleUserBorder: string;
  bubbleUserText: string;
  bubbleAIBg: string;
  bubbleAIBorder: string;
  bubbleAIText: string;
  // Misc
  scrollbarColor: string;
  separatorColor: string;
  // Ambient glow opacity multiplier (as CSS rgba values)
  glowStrong: string;
  glowMid: string;
  glowSubtle: string;
}

export const darkTheme: Theme = {
  mode: 'dark',
  bgMain: '#0C0A08',
  bgSidebar: 'rgba(54,54,54,.18)',
  bgSidebarBorder: 'rgba(254,129,19,.08)',
  bgCard: 'rgba(54,54,54,.30)',
  bgCardBorder: 'rgba(255,255,255,.07)',
  bgInput: 'rgba(54,54,54,.40)',
  bgInputBorder: 'rgba(254,129,19,.12)',
  bgAvatarCard: 'rgba(20,14,8,.72)',
  bgFooter: 'rgba(12,10,8,.92)',
  bgFooterBorder: 'rgba(254,129,19,.08)',
  bgStatusPill: 'rgba(54,54,54,.25)',
  textPrimary: 'rgba(255,255,255,.92)',
  textSecondary: 'rgba(255,255,255,.80)',
  textMuted: 'rgba(255,255,255,.30)',
  textDim: 'rgba(255,255,255,.20)',
  textDimmer: 'rgba(255,255,255,.14)',
  accent: '#FE8113',
  accentDark: '#D96B0B',
  accentLight: '#FF9E45',
  accentPale: 'rgba(254,160,80,.60)',
  accentText: '#FFA855',
  statusDotActive: '#22c55e',
  statusDotIdle: '#2A2A2A',
  bubbleUserBg: 'rgba(254,129,19,.10)',
  bubbleUserBorder: 'rgba(254,129,19,.28)',
  bubbleUserText: 'rgba(255,255,255,.85)',
  bubbleAIBg: 'rgba(255,255,255,.05)',
  bubbleAIBorder: 'rgba(255,255,255,.07)',
  bubbleAIText: 'rgba(255,255,255,.80)',
  scrollbarColor: 'rgba(254,129,19,.10)',
  separatorColor: 'rgba(255,255,255,.04)',
  glowStrong: 'rgba(254,129,19,.10)',
  glowMid: 'rgba(254,129,19,.08)',
  glowSubtle: 'rgba(217,107,11,.08)',
};

export const lightTheme: Theme = {
  mode: 'light',
  bgMain: '#FBF7F2',
  bgSidebar: 'rgba(255,252,248,.96)',
  bgSidebarBorder: 'rgba(254,129,19,.18)',
  bgCard: 'rgba(255,255,255,.80)',
  bgCardBorder: 'rgba(0,0,0,.07)',
  bgInput: 'rgba(255,255,255,.90)',
  bgInputBorder: 'rgba(254,129,19,.22)',
  bgAvatarCard: 'rgba(255,252,248,.90)',
  bgFooter: 'rgba(251,247,242,.97)',
  bgFooterBorder: 'rgba(254,129,19,.14)',
  bgStatusPill: 'rgba(255,255,255,.75)',
  textPrimary: 'rgba(28,16,6,.90)',
  textSecondary: 'rgba(28,16,6,.75)',
  textMuted: 'rgba(28,16,6,.45)',
  textDim: 'rgba(28,16,6,.30)',
  textDimmer: 'rgba(28,16,6,.18)',
  accent: '#FE8113',
  accentDark: '#D96B0B',
  accentLight: '#FF9E45',
  accentPale: 'rgba(180,80,0,.65)',
  accentText: '#B85500',
  statusDotActive: '#16a34a',
  statusDotIdle: '#D8D0C8',
  bubbleUserBg: 'rgba(254,129,19,.10)',
  bubbleUserBorder: 'rgba(254,129,19,.30)',
  bubbleUserText: 'rgba(28,16,6,.85)',
  bubbleAIBg: 'rgba(0,0,0,.04)',
  bubbleAIBorder: 'rgba(0,0,0,.08)',
  bubbleAIText: 'rgba(28,16,6,.78)',
  scrollbarColor: 'rgba(254,129,19,.20)',
  separatorColor: 'rgba(0,0,0,.05)',
  glowStrong: 'rgba(254,129,19,.07)',
  glowMid: 'rgba(254,129,19,.05)',
  glowSubtle: 'rgba(217,107,11,.04)',
};
