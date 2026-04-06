'use client';

import React from 'react';
import { AvatarCharacter } from './AvatarCharacter';
import { useThemeStore } from '@/store/useThemeStore';

// CSS keyframes are injected by VoiceInterface via the shared STYLES constant.

export interface AvatarSceneProps {
  size?: number;
  isListening?: boolean;
  isSpeaking?: boolean;
  isLoading?: boolean;
}

export const AvatarScene: React.FC<AvatarSceneProps> = ({
  size = 220,
  isListening = false,
  isSpeaking = false,
  isLoading = false,
}) => {
  const { theme } = useThemeStore();
  const isActive = isListening || isSpeaking || isLoading;
  const isDark = theme.mode === 'dark';

  // Avatar SVG viewBox is 200×210, ratio 1.05
  const avatarHeight = Math.round(size * (210 / 200));

  // Card: slightly wider than the avatar
  const cardW = size + 24;
  const cardH = avatarHeight + 8;

  // Halo circle behind the head region
  const haloSize = Math.round(size * 0.72);

  // Glow animation — dark mode uses full-intensity glows; light mode uses softer ones
  const cardGlowAnim = isDark
    ? isLoading
      ? 'sceneThinkGlow 1.8s ease-in-out infinite'
      : isActive
      ? 'sceneActiveGlow 1.4s ease-in-out infinite'
      : 'sceneIdleGlow 4s ease-in-out infinite'
    : isLoading
    ? 'sceneThinkGlowLight 1.8s ease-in-out infinite'
    : isActive
    ? 'sceneActiveGlowLight 1.4s ease-in-out infinite'
    : 'sceneIdleGlowLight 4s ease-in-out infinite';

  const accentColor = isLoading
    ? '#94a3b8'
    : isListening
    ? '#FFA855'
    : isSpeaking
    ? '#FF9E45'
    : '#FE8113';

  const statusLabel = isSpeaking
    ? 'Speaking'
    : isLoading
    ? 'Thinking…'
    : isListening
    ? 'Listening'
    : 'Ready';

  // Badge status text colour
  const statusTextColor = isActive ? accentColor : theme.textMuted;
  const statusDotBg = isActive ? accentColor : theme.statusDotIdle;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>

      {/* ── Card wrapper ──────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          width: cardW,
          height: cardH,
          borderRadius: 24,
          background: theme.bgAvatarCard,
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: `1px solid ${isDark ? 'rgba(254,129,19,.12)' : 'rgba(254,129,19,.18)'}`,
          overflow: 'hidden',
          animation: cardGlowAnim,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* ── Ambient radial glow behind head ─────────────────────────────── */}
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
              : `radial-gradient(circle, rgba(254,129,19,${isActive ? (isDark ? '.22' : '.14') : (isDark ? '.10' : '.07')}) 0%, transparent 70%)`,
            animation: isActive ? 'sceneHaloPulse 1.6s ease-in-out infinite' : 'sceneHaloPulse 4s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* ── Top accent line ───────────────────────────────────────────────── */}
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
              : 'linear-gradient(90deg, transparent, rgba(254,129,19,.25), transparent)',
            opacity: isActive ? 0.9 : isDark ? 0.4 : 0.5,
            transition: 'opacity .5s ease',
            zIndex: 3,
          }}
        />

        {/* ── Avatar SVG ──────────────────────────────────────────────────── */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <AvatarCharacter
            size={size}
            isListening={isListening}
            isSpeaking={isSpeaking}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* ── Name badge ────────────────────────────────────────────────────── */}
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
            color: '#FE8113',
            textShadow: isDark ? '0 0 18px rgba(254,129,19,.5)' : '0 1px 6px rgba(254,129,19,.3)',
          }}>
            Alex
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
          AI English Tutor
        </span>
      </div>
    </div>
  );
};
