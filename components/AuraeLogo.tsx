'use client';

import { useThemeStore } from '@/store/useThemeStore';

// ─── Stateless icon (no hooks — safe for any component context) ──────────────

interface AuraeLogoIconProps {
  size?: number;
  /**
   * Fill color for the bars.
   * Defaults to terracotta #C96442 (the brand accent) which reads well
   * on both light and dark surfaces.
   */
  color?: string;
  className?: string;
}

/**
 * AURAE VOICE mark: seven rounded bars arranged in a symmetric bell-curve
 * waveform, evoking a voice waveform / audio visualiser.
 *
 * Heights (100 px viewBox): 22 · 44 · 66 · 80 · 66 · 44 · 22
 * All bars are vertically centred at y = 50.
 *
 * Keep in sync with `app/icon.svg` (favicon / browser tab).
 */
export function AuraeLogoIcon({
  size = 32,
  color = '#C96442',
  className = '',
}: AuraeLogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="6"  y="39" width="9" height="22" rx="4.5" fill={color} />
      <rect x="19" y="28" width="9" height="44" rx="4.5" fill={color} />
      <rect x="32" y="17" width="9" height="66" rx="4.5" fill={color} />
      <rect x="45" y="10" width="9" height="80" rx="4.5" fill={color} />
      <rect x="58" y="17" width="9" height="66" rx="4.5" fill={color} />
      <rect x="71" y="28" width="9" height="44" rx="4.5" fill={color} />
      <rect x="84" y="39" width="9" height="22" rx="4.5" fill={color} />
    </svg>
  );
}

// ─── Logo + optional wordmark (reads theme) ──────────────────────────────────

interface AuraeLogoProps {
  size?: number;
  showWordmark?: boolean;
  /** Override icon color. Defaults to terracotta #C96442. */
  color?: string;
  className?: string;
}

/**
 * AuraeLogoIcon + optional "AURAE VOICE / AI English Tutor" wordmark.
 * Wordmark text colour adapts to the current dark / light theme.
 */
export function AuraeLogo({
  size = 32,
  showWordmark = false,
  color = '#C96442',
  className = '',
}: AuraeLogoProps) {
  const { mode } = useThemeStore();
  const textColor = mode === 'dark' ? '#d8d4cb' : '#141413';
  const subColor  = mode === 'dark' ? 'rgba(176,174,165,.50)' : 'rgba(20,20,19,.38)';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <AuraeLogoIcon size={size} color={color} />
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span
            className="font-bold tracking-tight"
            style={{
              fontSize: Math.round(size * 0.44),
              letterSpacing: '0.04em',
              color: textColor,
            }}
          >
            AURAE VOICE
          </span>
          <span
            className="font-medium tracking-widest uppercase"
            style={{
              fontSize: Math.round(size * 0.22),
              letterSpacing: '0.18em',
              color: subColor,
            }}
          >
            AI English Tutor
          </span>
        </div>
      )}
    </div>
  );
}
