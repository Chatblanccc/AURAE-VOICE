// ─── Design tokens aligned with DESIGN.md (Claude / Anthropic parchment palette) ───
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
  // Accent — Terracotta (#c96442) replacing orange
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
  // Ambient glow (rgba values)
  glowStrong: string;
  glowMid: string;
  glowSubtle: string;
}

// ─── Dark theme — Near Black (#141413) canvas ────────────────────────────────
export const darkTheme: Theme = {
  mode: 'dark',
  // Surfaces — warm charcoal family
  bgMain:           '#141413',
  bgSidebar:        'rgba(48,48,46,.88)',
  bgSidebarBorder:  'rgba(201,100,66,.12)',
  bgCard:           'rgba(48,48,46,.55)',
  bgCardBorder:     'rgba(255,255,255,.06)',
  bgInput:          'rgba(61,61,58,.70)',
  bgInputBorder:    'rgba(201,100,66,.18)',
  bgAvatarCard:     'rgba(20,20,19,.75)',
  bgFooter:         'rgba(20,20,19,.96)',
  bgFooterBorder:   'rgba(201,100,66,.10)',
  bgStatusPill:     'rgba(48,48,46,.55)',
  // Text — Ivory / Warm Silver / Stone Gray
  textPrimary:   'rgba(250,249,245,.92)',   // ~Ivory
  textSecondary: 'rgba(176,174,165,.90)',   // Warm Silver
  textMuted:     'rgba(135,134,127,.80)',   // Stone Gray
  textDim:       'rgba(135,134,127,.50)',
  textDimmer:    'rgba(135,134,127,.30)',
  // Terracotta accent (#c96442)
  accent:      '#c96442',
  accentDark:  '#b8573a',
  accentLight: '#d97757',                  // Coral
  accentPale:  'rgba(217,119,87,.65)',
  accentText:  '#d97757',
  // Status
  statusDotActive: '#22c55e',
  statusDotIdle:   '#30302e',
  // Chat bubbles
  bubbleUserBg:     'rgba(201,100,66,.12)',
  bubbleUserBorder: 'rgba(201,100,66,.32)',
  bubbleUserText:   'rgba(250,249,245,.88)',
  bubbleAIBg:       'rgba(255,255,255,.05)',
  bubbleAIBorder:   'rgba(255,255,255,.07)',
  bubbleAIText:     'rgba(176,174,165,.85)',
  // Misc
  scrollbarColor:  'rgba(201,100,66,.12)',
  separatorColor:  'rgba(48,48,46,.90)',
  // Glow
  glowStrong: 'rgba(201,100,66,.09)',
  glowMid:    'rgba(201,100,66,.06)',
  glowSubtle: 'rgba(184,87,58,.06)',
};

// ─── Light theme — Parchment (#f5f4ed) canvas ────────────────────────────────
export const lightTheme: Theme = {
  mode: 'light',
  // Surfaces — parchment / ivory family
  bgMain:           '#f5f4ed',             // Parchment
  bgSidebar:        'rgba(250,249,245,.97)', // ~Ivory
  bgSidebarBorder:  'rgba(232,230,220,.80)', // Border Warm
  bgCard:           'rgba(250,249,245,.88)',
  bgCardBorder:     'rgba(240,238,230,.95)', // Border Cream
  bgInput:          'rgba(250,249,245,.95)',
  bgInputBorder:    'rgba(201,100,66,.22)',
  bgAvatarCard:     'rgba(250,249,245,.93)',
  bgFooter:         'rgba(245,244,237,.98)', // Parchment
  bgFooterBorder:   'rgba(232,230,220,.85)', // Border Warm
  bgStatusPill:     'rgba(250,249,245,.92)',
  // Text — Near Black / Olive Gray / Stone Gray
  textPrimary:   '#141413',                // Anthropic Near Black
  textSecondary: '#5e5d59',                // Olive Gray
  textMuted:     '#87867f',                // Stone Gray
  textDim:       'rgba(135,134,127,.65)',
  textDimmer:    'rgba(135,134,127,.45)',
  // Terracotta accent (#c96442)
  accent:      '#c96442',
  accentDark:  '#b8573a',
  accentLight: '#d97757',
  accentPale:  'rgba(180,87,58,.65)',
  accentText:  '#c96442',
  // Status
  statusDotActive: '#16a34a',
  statusDotIdle:   '#e8e6dc',              // Border Warm
  // Chat bubbles
  bubbleUserBg:     'rgba(201,100,66,.09)',
  bubbleUserBorder: 'rgba(201,100,66,.28)',
  bubbleUserText:   '#141413',
  bubbleAIBg:       'rgba(0,0,0,.03)',
  bubbleAIBorder:   'rgba(0,0,0,.07)',
  bubbleAIText:     '#5e5d59',             // Olive Gray
  // Misc
  scrollbarColor:  'rgba(201,100,66,.18)',
  separatorColor:  'rgba(232,230,220,.70)',
  // Glow
  glowStrong: 'rgba(201,100,66,.07)',
  glowMid:    'rgba(201,100,66,.05)',
  glowSubtle: 'rgba(184,87,58,.04)',
};
