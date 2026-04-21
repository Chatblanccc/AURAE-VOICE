'use client';

import Link from 'next/link';
import { useLanguageStore } from '@/store/useLanguageStore';
import { t } from '@/lib/landing-i18n';
import { AuraeLogoIcon } from '@/components/AuraeLogo';

type HeroSectionProps = {
  publicUsernames: string[];
};

export function HeroSection({ publicUsernames }: HeroSectionProps) {
  const { lang } = useLanguageStore();
  const tx = t[lang].hero;
  const names = publicUsernames.length > 0
    ? publicUsernames
    : ['AURAE User', 'Voice Builder', 'Global Creator', 'AI Team'];
  const uniqueNames = Array.from(new Set(names));
  const enableMarquee = uniqueNames.length >= 8;
  const scrollingNames = enableMarquee ? [...uniqueNames, ...uniqueNames] : uniqueNames;

  return (
    <section data-lp-hero-section className="lp-hero-section relative">
      <div className="lp-hero-stage flex min-h-screen items-center overflow-hidden px-6 pb-20 pt-36">
        <div className="absolute inset-0 -z-30 bg-[#141413]" />

        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/og-default.svg"
          className="lp-hero-video absolute inset-0 -z-20 h-full w-full object-cover"
          src="/video.mp4"
          aria-hidden="true"
          onError={(e) => {
            (e.target as HTMLVideoElement).style.display = 'none';
          }}
        >
          Your browser does not support the video tag.
        </video>

        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(8,8,8,0.38)_0%,rgba(8,8,8,0.55)_52%,rgba(8,8,8,0.72)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(201,100,66,0.24),transparent_42%),radial-gradient(circle_at_86%_82%,rgba(217,119,87,0.2),transparent_46%)]" />
        <div className="lp-hero-tech-overlay absolute inset-0 -z-10" aria-hidden="true" />
        <div className="lp-hero-tech-beam absolute inset-0 -z-10" aria-hidden="true" />

        <div className="lp-hero-copy relative z-10 mx-auto max-w-5xl text-center">
          <div className="lp-hero-badge inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-md">
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#c96442]" />
            <span className="text-xs font-medium tracking-wide text-white/80">{tx.badge}</span>
          </div>

          <h1
            className="lp-serif mx-auto mt-8 max-w-4xl text-5xl font-medium text-white md:text-6xl lg:text-7xl"
            style={{ lineHeight: '1.1', textShadow: '0 4px 26px rgba(0,0,0,0.4)' }}
          >
            {tx.headlineLine1}
            <br />
            <span style={{ color: '#d97757' }}>{tx.headlineAccent}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-xl text-white/80 md:text-2xl" style={{ lineHeight: '1.55' }}>
            {tx.subtitle}
          </p>

          <div className="lp-hero-actions mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sign-in"
              className="flex cursor-pointer items-center gap-2 rounded-xl px-7 py-3.5 text-base font-medium text-white transition-all duration-200"
              style={{ background: '#c96442', boxShadow: '0 0 0 1px #c96442' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#b8573a';
                e.currentTarget.style.boxShadow = '0 0 0 1px #b8573a, 0 4px 20px rgba(201,100,66,0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#c96442';
                e.currentTarget.style.boxShadow = '0 0 0 1px #c96442';
              }}
            >
              <AuraeLogoIcon size={16} color="white" className="flex-shrink-0" />
              {tx.ctaPrimary}
            </Link>
            <a
              href="#how-it-works"
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-base font-medium text-white backdrop-blur-md transition-all duration-200"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }}
            >
              {tx.ctaSecondary}
            </a>
          </div>

          <div className="lp-hero-proof mx-auto mt-14 max-w-3xl">
            <div className="mb-4 text-sm text-white/60">{tx.socialProof}</div>
            <div className="lp-marquee-track [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <div className={enableMarquee ? 'lp-marquee-content' : 'lp-pill-list'}>
                {scrollingNames.map((name, index) => (
                  <span
                    key={`${name}-${index}`}
                    className="lp-user-pill !border-white/25 !bg-white/10 !text-white/85 backdrop-blur-md"
                    title={name}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
