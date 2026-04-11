'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useThemeStore } from '@/store/useThemeStore';
import { AuraeLogoIcon } from '@/components/AuraeLogo';

const WECHAT_ENABLED = !!(
  process.env.NEXT_PUBLIC_WECHAT_ENABLED === 'true'
);

function SignInContent() {
  const { theme, mode } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/chat';

  // Keep data-theme in sync on this page too
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const handleGoogle = async () => {
    setLoading(true);
    await signIn('google', { callbackUrl });
  };

  const handleWeChat = async () => {
    if (!WECHAT_ENABLED) return;
    setLoading(true);
    await signIn('wechat', { callbackUrl });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: theme.bgMain }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-48 -left-48 w-96 h-96 rounded-full"
          style={{ background: `radial-gradient(circle, ${theme.glowStrong} 0%, transparent 70%)` }}
        />
        <div
          className="absolute -bottom-48 -right-48 w-96 h-96 rounded-full"
          style={{ background: `radial-gradient(circle, ${theme.glowSubtle} 0%, transparent 70%)` }}
        />
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-7"
        style={{
          background: theme.bgCard,
          border: `1px solid ${theme.bgCardBorder}`,
          backdropFilter: 'blur(20px)',
          boxShadow: mode === 'dark'
            ? '0 24px 64px rgba(0,0,0,.45)'
            : '0 8px 40px rgba(0,0,0,.10)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <AuraeLogoIcon
            size={56}
            color="#C96442"
          />
          <div className="text-center">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: theme.textPrimary }}
            >
              AURAE VOICE
            </h1>
            <p
              className="text-xs font-medium tracking-widest uppercase mt-0.5"
              style={{ color: theme.accentPale }}
            >
              AI English Tutor
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px" style={{ background: theme.separatorColor }} />

        {/* Sub-heading */}
        <p className="text-sm text-center" style={{ color: theme.textMuted }}>
          Sign in to save your progress and continue past conversations on any device.
        </p>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-3">
          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl font-medium text-sm transition-all duration-200 disabled:opacity-50 cursor-pointer"
            style={{
              background: mode === 'dark' ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.95)',
              border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)'}`,
              color: theme.textPrimary,
              boxShadow: mode === 'light' ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = mode === 'dark' ? 'rgba(255,255,255,.11)' : 'rgba(255,255,255,1)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = mode === 'dark' ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.95)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Google colour logo (SVG) */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {/* WeChat */}
          <button
            onClick={handleWeChat}
            disabled={!WECHAT_ENABLED || loading}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl font-medium text-sm relative cursor-not-allowed"
            style={{
              background: mode === 'dark' ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.03)',
              border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.07)'}`,
              color: theme.textDim,
              opacity: 0.6,
            }}
          >
            {/* WeChat green icon */}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <ellipse cx="7.5" cy="8" rx="5.5" ry="4.5" fill="#07C160" opacity="0.8"/>
              <ellipse cx="14" cy="10.5" rx="4.5" ry="3.5" fill="#07C160" opacity="0.6"/>
              <circle cx="5.8" cy="7.5" r="0.9" fill="white"/>
              <circle cx="8.8" cy="7.5" r="0.9" fill="white"/>
              <circle cx="12.5" cy="10.2" r="0.75" fill="white"/>
              <circle cx="15" cy="10.2" r="0.75" fill="white"/>
            </svg>
            使用微信登录
            {/* Coming soon badge */}
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md"
              style={{
                background: 'rgba(201,100,66,.15)',
                color: theme.accentText,
                border: `1px solid rgba(201,100,66,.20)`,
              }}
            >
              Coming Soon
            </span>
          </button>
        </div>

        {/* Footer note */}
        <p className="text-[10px] text-center" style={{ color: theme.textDimmer }}>
          By signing in you agree to our terms of service.
          Your data is stored securely and never shared.
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  );
}
