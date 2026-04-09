'use client';

import React from 'react';

export interface TrumpAvatarCharacterProps {
  size?: number;
  isListening?: boolean;
  isSpeaking?: boolean;
  isLoading?: boolean;
}

// CSS animation names match the shared STYLES in VoiceInterface.tsx
export const TrumpAvatarCharacter: React.FC<TrumpAvatarCharacterProps> = ({
  size = 200,
  isListening = false,
  isSpeaking = false,
  isLoading = false,
}) => {
  const isIdle = !isListening && !isSpeaking && !isLoading;
  const svgH = Math.round(size * (210 / 200));

  const headAnim = isListening
    ? 'avatarHeadTilt 2.2s ease-in-out infinite'
    : isIdle
    ? 'avatarFloat 4s ease-in-out infinite'
    : isSpeaking
    ? 'avatarFloat 1.2s ease-in-out infinite'
    : 'none';

  const bodyAnim = isIdle ? 'avatarBreath 4s ease-in-out infinite' : 'none';

  return (
    <svg
      width={size}
      height={svgH}
      viewBox="0 0 200 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="tHeadGrad" cx="44%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#F4A060" />
          <stop offset="55%" stopColor="#E8914A" />
          <stop offset="100%" stopColor="#B86028" />
        </radialGradient>
        <radialGradient id="tFaceGrad" cx="42%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#FBBF7A" />
          <stop offset="50%" stopColor="#F4A060" />
          <stop offset="100%" stopColor="#E08040" />
        </radialGradient>
        <radialGradient id="tHairGrad" cx="28%" cy="18%" r="72%">
          <stop offset="0%" stopColor="#F0C830" />
          <stop offset="55%" stopColor="#C89010" />
          <stop offset="100%" stopColor="#7A5508" />
        </radialGradient>
        <clipPath id="tMouthClip">
          <rect x="82" y="136" width="36" height="14" rx="4" />
        </clipPath>
      </defs>

      {/* Body + suit */}
      <g style={{ transformOrigin: '100px 145px', animation: bodyAnim }}>
        {/* Suit body */}
        <path
          d="M 18,210 L 22,192 Q 42,178 80,174 L 88,172 L 100,165 L 112,172 L 120,174 Q 158,178 178,192 L 182,210 Z"
          fill="#1A2850"
        />
        {/* Left lapel */}
        <path d="M 88,172 L 78,188 L 96,188 Z" fill="#243260" />
        {/* Right lapel */}
        <path d="M 112,172 L 122,188 L 104,188 Z" fill="#243260" />
        {/* White shirt */}
        <path d="M 94,168 L 100,162 L 106,168 L 104,174 L 100,172 L 96,174 Z" fill="#EDE9E4" />
        {/* Red tie — the iconic long one */}
        <path
          d="M 97,168 L 100,164 L 103,168 L 102,184 L 100,196 L 98,184 Z"
          fill="#CC1A1A"
        />
        <path
          d="M 97.5,168 L 100,166 L 102.5,168 L 101.5,174 L 100,176 L 98.5,174 Z"
          fill="#E02020"
        />

        {/* Head group */}
        <g style={{ transformOrigin: '100px 105px', animation: headAnim }}>

          {/* Hair shadow (back layer — darker, slightly larger) */}
          <path
            d="M 26,95 Q 28,42 72,18 Q 100,8 132,14 Q 165,24 174,88 Q 158,52 100,48 Q 48,50 26,95 Z"
            fill="#7A5508"
          />

          {/* Main head oval */}
          <ellipse cx="100" cy="110" rx="78" ry="82" fill="url(#tHeadGrad)" />

          {/* Hair main body — the signature comb-over */}
          <path
            d="M 24,92 Q 26,40 74,16 Q 100,8 130,14 Q 128,32 98,46 Q 64,52 24,92 Z"
            fill="url(#tHairGrad)"
          />
          {/* Hair highlight streak */}
          <path
            d="M 42,55 Q 70,28 102,22 Q 124,22 132,30 Q 112,34 92,40 Q 68,46 42,66 Z"
            fill="#F5D040"
            opacity="0.55"
          />
          {/* Right side of hair (swept back) */}
          <path
            d="M 130,14 Q 158,26 172,60 Q 164,38 148,28 Q 140,18 130,14 Z"
            fill="#C89010"
            opacity="0.85"
          />

          {/* Ears */}
          <ellipse cx="24" cy="110" rx="14" ry="18" fill="#E08040" />
          <ellipse cx="24" cy="110" rx="8" ry="11" fill="#F0A060" />
          <ellipse cx="176" cy="110" rx="14" ry="18" fill="#E08040" />
          <ellipse cx="176" cy="110" rx="8" ry="11" fill="#F0A060" />

          {/* Face center — slightly lighter */}
          <ellipse cx="100" cy="118" rx="60" ry="62" fill="url(#tFaceGrad)" />

          {/* Eyebrows — thin, slightly furrowed */}
          <path d="M 60,85 Q 74,81 88,85" stroke="#7A5508" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M 112,85 Q 126,81 140,85" stroke="#7A5508" strokeWidth="3.5" strokeLinecap="round" fill="none" />

          {/* Eyes — slightly squinting / hooded */}
          {/* Left eye white */}
          <ellipse cx="74" cy="98" rx="15" ry="9" fill="#F5F0EC" />
          <ellipse cx="74" cy="99" rx="9" ry="7" fill="#5A3A18" />
          <circle cx="74" cy="99" r="5" fill="#1A0C04" />
          <circle cx="71" cy="96" r="2.5" fill="white" opacity="0.75" />
          {/* Upper eyelid — squint effect */}
          <path d="M 59,95 Q 74,91 89,95" stroke="#E08040" strokeWidth="3.5" strokeLinecap="round" fill="none" />

          {/* Right eye white */}
          <ellipse cx="126" cy="98" rx="15" ry="9" fill="#F5F0EC" />
          <ellipse cx="126" cy="99" rx="9" ry="7" fill="#5A3A18" />
          <circle cx="126" cy="99" r="5" fill="#1A0C04" />
          <circle cx="123" cy="96" r="2.5" fill="white" opacity="0.75" />
          {/* Upper eyelid — squint effect */}
          <path d="M 111,95 Q 126,91 141,95" stroke="#E08040" strokeWidth="3.5" strokeLinecap="round" fill="none" />

          {/* Nose — broader, prominent */}
          <ellipse cx="100" cy="121" rx="10" ry="8" fill="#C07030" opacity="0.4" />
          <circle cx="92" cy="126" r="4.5" fill="#C07030" opacity="0.45" />
          <circle cx="108" cy="126" r="4.5" fill="#C07030" opacity="0.45" />
          <path d="M 92,128 Q 100,133 108,128" stroke="#C07030" strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* Jowls */}
          <ellipse cx="52" cy="134" rx="20" ry="24" fill="#E08040" opacity="0.28" />
          <ellipse cx="148" cy="134" rx="20" ry="24" fill="#E08040" opacity="0.28" />

          {/* Mouth — the Trump pout */}
          {isSpeaking ? (
            <g clipPath="url(#tMouthClip)" style={{ transformOrigin: '100px 143px', animation: 'monkeyMouthOpen 0.3s ease-in-out infinite' }}>
              <ellipse cx="100" cy="143" rx="16" ry="9" fill="#8B1A10" />
              <rect x="84" y="138" width="32" height="7" rx="3" fill="#EDE0D4" />
              <path d="M 84,139 Q 100,135 116,139" stroke="#7A2218" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </g>
          ) : (
            <>
              {/* Upper lip */}
              <path d="M 84,140 Q 92,135 100,137 Q 108,135 116,140 Q 108,145 100,143 Q 92,145 84,140 Z" fill="#CC5035" opacity="0.85" />
              {/* Lip line */}
              <path d="M 84,140 Q 100,136 116,140" stroke="#8B2818" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M 86,140 Q 100,146 114,140" stroke="#8B2818" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </>
          )}

          {/* Thinking dots */}
          {isLoading && (
            <g>
              {[0, 1, 2].map(i => (
                <circle
                  key={i}
                  cx={88 + i * 12}
                  cy={168}
                  r={4}
                  fill="#CC1A1A"
                  style={{
                    transformOrigin: `${88 + i * 12}px 168px`,
                    animation: `avatarThinkDot 0.9s ease-in-out ${i * 0.22}s infinite`,
                  }}
                />
              ))}
            </g>
          )}

        </g>

        {/* Neck */}
        <rect x="84" y="183" width="32" height="16" rx="8" fill="#B86028" />
      </g>
    </svg>
  );
};
