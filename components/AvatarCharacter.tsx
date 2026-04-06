'use client';

import React from 'react';

// CSS keyframes are injected by VoiceInterface via the shared STYLES constant.

export interface AvatarCharacterProps {
  size?: number;
  isListening?: boolean;
  isSpeaking?: boolean;
  isLoading?: boolean;
}

export const AvatarCharacter: React.FC<AvatarCharacterProps> = ({
  size = 200,
  isListening = false,
  isSpeaking  = false,
  isLoading   = false,
}) => {
  const isIdle = !isListening && !isSpeaking && !isLoading;

  // ── Animations ─────────────────────────────────────────────────────────────
  const headAnim   = isListening ? 'avatarHeadTilt 2.2s ease-in-out infinite'
                   : isIdle      ? 'avatarFloat 4s ease-in-out infinite'
                   : isSpeaking  ? 'avatarFloat 1.2s ease-in-out infinite'
                   : 'none';

  const bodyAnim   = isIdle ? 'avatarBreath 4s ease-in-out infinite' : 'none';
  const browsAnim  = isListening ? 'avatarBrowLift 1.6s ease-in-out infinite' : 'none';
  const eyeDartAnim = isLoading  ? 'avatarPupilThink 2s ease-in-out infinite' : 'none';

  // ── Colours ─────────────────────────────────────────────────────────────────
  const headBrown   = '#B8651D';   // main head
  const headDark    = '#9A500F';   // top/back of head (slightly darker)
  const facePatch   = '#F2C882';   // light beige face centre
  const faceShadow  = '#E8B060';   // subtle shadow on face edges
  const earOuter    = '#A85C18';   // ear outer ring
  const earMid      = '#D08840';   // ear middle
  const earInner    = '#EDB878';   // ear centre
  const eyeRing     = '#E0A858';   // eye socket area (slightly darker than face)
  const eyeDark     = '#0C0804';   // iris / pupil
  const eyeShine1   = '#FFFFFF';   // main sparkle
  const eyeShine2   = 'rgba(255,255,255,0.55)'; // secondary shine
  const noseDot     = '#7A4010';   // nostril dots
  const browColor   = '#7A3E0A';   // brows
  const mouthLine   = '#6A3008';   // closed mouth stroke
  const mouthOpen   = '#3D1404';   // open mouth interior
  const teethWhite  = '#FFFAF5';   // teeth strip
  const cheekPink   = '#E8855A';   // subtle warm cheek blush

  // SVG canvas: 200 × 210  (head centred at 100, 100)
  const vw = 200, vh = 210;

  return (
    <svg
      width={size}
      height={size * (vh / vw)}
      viewBox={`0 0 ${vw} ${vh}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible', display: 'block' }}
    >
      <defs>
        {/* Head gradient — darker on top/back, lighter at face centre */}
        <radialGradient id="mkHeadGrad" cx="48%" cy="42%" r="58%">
          <stop offset="0%"   stopColor="#D07828" />
          <stop offset="60%"  stopColor={headBrown} />
          <stop offset="100%" stopColor={headDark} />
        </radialGradient>

        {/* Face patch gradient */}
        <radialGradient id="mkFaceGrad" cx="44%" cy="35%" r="62%">
          <stop offset="0%"   stopColor="#FBE0AA" />
          <stop offset="60%"  stopColor={facePatch} />
          <stop offset="100%" stopColor={faceShadow} />
        </radialGradient>

        {/* Eye iris gradient */}
        <radialGradient id="mkEyeGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#2A1808" />
          <stop offset="100%" stopColor={eyeDark} />
        </radialGradient>

        {/* Cheek soft glow */}
        <radialGradient id="mkCheekL" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={cheekPink} stopOpacity="0.35" />
          <stop offset="100%" stopColor={cheekPink} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mkCheekR" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={cheekPink} stopOpacity="0.35" />
          <stop offset="100%" stopColor={cheekPink} stopOpacity="0" />
        </radialGradient>

        {/* Thinking dots gradient */}
        <radialGradient id="mkDotGrad" cx="50%" cy="20%" r="70%">
          <stop offset="0%"   stopColor="#FFA855" />
          <stop offset="100%" stopColor="#FE8113" />
        </radialGradient>

        {/* Clip for open mouth */}
        <clipPath id="mouthClip">
          <ellipse cx="100" cy="140" rx="20" ry="13" />
        </clipPath>
      </defs>

      {/* ── Whole-body breath wrapper ──────────────────────────────────────── */}
      <g style={{ transformOrigin: '100px 140px', animation: bodyAnim }}>

        {/* ── Ears (behind head) ──────────────────────────────────────────── */}
        {/* Left ear */}
        <circle cx="22" cy="104" r="26" fill={earOuter} />
        <circle cx="22" cy="104" r="18" fill={earMid} />
        <circle cx="22" cy="104" r="11" fill={earInner} />
        {/* Right ear */}
        <circle cx="178" cy="104" r="26" fill={earOuter} />
        <circle cx="178" cy="104" r="18" fill={earMid} />
        <circle cx="178" cy="104" r="11" fill={earInner} />

        {/* ── Head + face group (float / tilt) ─────────────────────────────── */}
        <g style={{ transformOrigin: '100px 100px', animation: headAnim }}>

          {/* ── Main head circle ─────────────────────────────────────────── */}
          <circle cx="100" cy="100" r="88" fill="url(#mkHeadGrad)" />

          {/* ── Face patch (lighter oval, centred slightly lower) ─────────── */}
          <ellipse cx="100" cy="112" rx="62" ry="68" fill="url(#mkFaceGrad)" />

          {/* ── Cheek blush ──────────────────────────────────────────────── */}
          <ellipse cx="52"  cy="124" rx="22" ry="14" fill="url(#mkCheekL)"
            opacity={isListening ? 1.8 : 1} />
          <ellipse cx="148" cy="124" rx="22" ry="14" fill="url(#mkCheekR)"
            opacity={isListening ? 1.8 : 1} />

          {/* ── Eye sockets (slightly darker circle behind each eye) ──────── */}
          <circle cx="72" cy="90" r="23" fill={eyeRing} />
          <circle cx="128" cy="90" r="23" fill={eyeRing} />

          {/* ── Eyebrows ─────────────────────────────────────────────────── */}
          <g style={{ animation: browsAnim, transformOrigin: '72px 64px' }}>
            <path d="M54,68 Q72,61 90,67"
              stroke={browColor} strokeWidth="5" strokeLinecap="round" fill="none" />
          </g>
          <g style={{ animation: browsAnim, transformOrigin: '128px 64px' }}>
            <path d="M110,67 Q128,61 146,68"
              stroke={browColor} strokeWidth="5" strokeLinecap="round" fill="none" />
          </g>

          {/* ── Left eye ──────────────────────────────────────────────────── */}
          <circle cx="72" cy="90" r="19" fill={eyeDark} />
          {/* Iris detail */}
          <g style={{ animation: eyeDartAnim, transformOrigin: '72px 90px' }}>
            <circle cx="72" cy="90" r="10" fill="#1E0E04" />
            {/* Main sparkle */}
            <circle cx="64" cy="82" r="6" fill={eyeShine1} />
            {/* Secondary sparkle */}
            <circle cx="78" cy="84" r="3" fill={eyeShine2} />
          </g>
          {/* Subtle lower lid shadow */}
          <path d="M53,100 Q72,107 91,100"
            stroke={faceShadow} strokeWidth="1.2" fill="none" opacity="0.5" />

          {/* ── Right eye ─────────────────────────────────────────────────── */}
          <circle cx="128" cy="90" r="19" fill={eyeDark} />
          <g style={{ animation: eyeDartAnim, transformOrigin: '128px 90px' }}>
            <circle cx="128" cy="90" r="10" fill="#1E0E04" />
            <circle cx="120" cy="82" r="6" fill={eyeShine1} />
            <circle cx="134" cy="84" r="3" fill={eyeShine2} />
          </g>
          <path d="M109,100 Q128,107 147,100"
            stroke={faceShadow} strokeWidth="1.2" fill="none" opacity="0.5" />

          {/* ── Nose ─────────────────────────────────────────────────────── */}
          {/* Nose bump (small oval) */}
          <ellipse cx="100" cy="118" rx="10" ry="7" fill={faceShadow} opacity="0.45" />
          {/* Nostril dots */}
          <circle cx="95"  cy="120" r="3.5" fill={noseDot} opacity="0.75" />
          <circle cx="105" cy="120" r="3.5" fill={noseDot} opacity="0.75" />

          {/* ── Mouth ────────────────────────────────────────────────────── */}
          {isSpeaking ? (
            /* ── Open mouth — animates via monkeyMouthOpen keyframe ──────── */
            <g style={{ transformOrigin: '100px 140px', animation: 'monkeyMouthOpen 0.3s ease-in-out infinite' }}>
              {/* Mouth cavity */}
              <ellipse cx="100" cy="140" rx="20" ry="13" fill={mouthOpen} />
              {/* Teeth strip */}
              <rect x="81" y="136" width="38" height="8" rx="4" fill={teethWhite}
                clipPath="url(#mouthClip)" />
              {/* Tongue hint */}
              <ellipse cx="100" cy="147" rx="10" ry="5" fill="#C05040" opacity="0.7"
                clipPath="url(#mouthClip)" />
              {/* Upper lip line */}
              <path d="M80,134 Q100,130 120,134"
                stroke={mouthLine} strokeWidth="2" strokeLinecap="round" fill="none" />
            </g>
          ) : (
            /* ── Closed smile ─────────────────────────────────────────────── */
            <path
              d="M80,136 Q100,150 120,136"
              stroke={mouthLine}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* ── Thinking dots ─────────────────────────────────────────────── */}
          {isLoading && (
            <g>
              {[0, 1, 2].map(i => (
                <circle
                  key={i}
                  cx={88 + i * 12}
                  cy={162}
                  r={4}
                  fill="url(#mkDotGrad)"
                  style={{
                    transformOrigin: `${88 + i * 12}px 162px`,
                    animation: `avatarThinkDot 0.9s ease-in-out ${i * 0.22}s infinite`,
                  }}
                />
              ))}
            </g>
          )}

        </g>
        {/* ── End head group ──────────────────────────────────────────────── */}

        {/* ── Tiny neck + shoulders ─────────────────────────────────────────── */}
        <rect x="85" y="184" width="30" height="16" rx="8" fill={headBrown} />
        <path
          d="M30,210 L30,200 Q45,190 75,186 Q90,184 100,184 Q110,184 125,186 Q155,190 170,200 L170,210 Z"
          fill={headDark}
        />

      </g>
    </svg>
  );
};
