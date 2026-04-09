'use client';

import React from 'react';
import { AvatarCharacter } from './AvatarCharacter';
import { TrumpAvatarCharacter } from './TrumpAvatarCharacter';
import { useThemeStore } from '@/store/useThemeStore';

// CSS keyframes are injected by VoiceInterface via the shared STYLES constant.

export interface AvatarSceneProps {
  size?: number;
  isListening?: boolean;
  isSpeaking?: boolean;
  isLoading?: boolean;
  persona?: 'alex' | 'trump';
}

const PERSONA_CONFIG = {
  alex: {
    name: 'Alex',
    subtitle: 'AI English Tutor',
    accent: '#FE8113',
    accentActive: '#FF9E45',
    accentListening: '#FFA855',
    borderColor: (isDark: boolean) => isDark ? 'rgba(254,129,19,.12)' : 'rgba(254,129,19,.18)',
    haloActive: (isDark: boolean) => `rgba(254,129,19,${isDark ? '.22' : '.14'})`,
    haloIdle:   (isDark: boolean) => `rgba(254,129,19,${isDark ? '.10' : '.07'})`,
  },
  trump: {
    name: 'Donald',
    subtitle: '45th President',
    accent: '#CC1A1A',
    accentActive: '#E03030',
    accentListening: '#E84040',
    borderColor: (isDark: boolean) => isDark ? 'rgba(204,26,26,.14)' : 'rgba(204,26,26,.20)',
    haloActive: (isDark: boolean) => `rgba(204,26,26,${isDark ? '.22' : '.14'})`,
    haloIdle:   (isDark: boolean) => `rgba(204,26,26,${isDark ? '.10' : '.06'})`,
  },
};

export const AvatarScene: React.FC<AvatarSceneProps> = ({
  size = 220,
  isListening = false,
  isSpeaking = false,
  isLoading = false,
  persona = 'alex',
}) => {
  const { theme } = useThemeStore();
  const isActive = isListening || isSpeaking || isLoading;
  const isDark = theme.mode === 'dark';
  const cfg = PERSONA_CONFIG[persona];

  const avatarHeight = Math.round(size * (210 / 200));
  const cardW = size + 24;
  const cardH = avatarHeight + 8;
  const haloSize = Math.round(size * 0.72);

  const accentColor = isLoading
    ? '#94a3b8'
    : isListening
    ? cfg.accentListening
    : isSpeaking
    ? cfg.accentActive
    : cfg.accent;

  // Card glow — Trump uses red-toned glow animations
  const isAlex = persona === 'alex';
  const cardGlowAnim = isDark
    ? isLoading
      ? 'sceneThinkGlow 1.8s ease-in-out infinite'
      : isActive
      ? (isAlex ? 'sceneActiveGlow 1.4s ease-in-out infinite' : 'sceneTrumpActiveGlow 1.4s ease-in-out infinite')
      : (isAlex ? 'sceneIdleGlow 4s ease-in-out infinite' : 'sceneTrumpIdleGlow 4s ease-in-out infinite')
    : isLoading
    ? 'sceneThinkGlowLight 1.8s ease-in-out infinite'
    : isActive
    ? (isAlex ? 'sceneActiveGlowLight 1.4s ease-in-out infinite' : 'sceneTrumpActiveGlowLight 1.4s ease-in-out infinite')
    : (isAlex ? 'sceneIdleGlowLight 4s ease-in-out infinite' : 'sceneTrumpIdleGlowLight 4s ease-in-out infinite');

  const statusLabel = isSpeaking
    ? 'Speaking'
    : isLoading
    ? 'Thinking…'
    : isListening
    ? 'Listening'
    : 'Ready';

  const statusTextColor = isActive ? accentColor : theme.textMuted;
  const statusDotBg = isActive ? accentColor : theme.statusDotIdle;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>

      {/* Card wrapper */}
      <div
        style={{
          position: 'relative',
          width: cardW,
          height: cardH,
          borderRadius: 24,
          background: theme.bgAvatarCard,
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: `1px solid ${cfg.borderColor(isDark)}`,
          overflow: 'hidden',
          animation: cardGlowAnim,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Ambient radial glow */}
        <div
          style={{
            position: 'absolute',
            width: haloSize,
            height: haloSize,
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: isLoading
              ? `radial-gradient(circle, ${isDark ? 'rgba(148,163,184,.18)' : 'rgba(100,130,180,.12)'} 0%, transparent 70%)`
              : `radial-gradient(circle, ${isActive ? cfg.haloActive(isDark) : cfg.haloIdle(isDark)} 0%, transparent 70%)`,
            animation: isActive ? 'sceneHaloPulse 1.6s ease-in-out infinite' : 'sceneHaloPulse 4s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            borderRadius: '24px 24px 0 0',
            background: isActive
              ? `linear-gradient(90deg, transparent, ${accentColor}, transparent)`
              : `linear-gradient(90deg, transparent, ${cfg.accent}40, transparent)`,
            opacity: isActive ? 0.9 : isDark ? 0.4 : 0.5,
            transition: 'opacity .5s ease',
            zIndex: 3,
          }}
        />

        {/* Avatar SVG */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {persona === 'trump' ? (
            <TrumpAvatarCharacter size={size} isListening={isListening} isSpeaking={isSpeaking} isLoading={isLoading} />
          ) : (
            <AvatarCharacter size={size} isListening={isListening} isSpeaking={isSpeaking} isLoading={isLoading} />
          )}
        </div>
      </div>

      {/* Name badge */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          animation: 'sceneBadgeFade .5s ease-out both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: cfg.accent,
            textShadow: isDark ? `0 0 18px ${cfg.accent}80` : `0 1px 6px ${cfg.accent}50`,
          }}>
            {cfg.name}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: statusDotBg,
              boxShadow: isActive ? `0 0 8px ${accentColor}` : 'none',
              transition: 'background .4s, box-shadow .4s',
              display: 'inline-block',
            }} />
            <span style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.08em',
              color: statusTextColor,
              transition: 'color .4s',
              textTransform: 'uppercase',
            }}>
              {statusLabel}
            </span>
          </div>
        </div>
        <span style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: theme.accentPale,
        }}>
          {cfg.subtitle}
        </span>
      </div>
    </div>
  );
};
