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
    <section className="relative overflow-hidden pt-40 pb-28 px-6" style={{ background: 'var(--lp-bg-page)' }}>
      {/* Ambient glows */}
      <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] opacity-30" aria-hidden="true" style={{ background: 'radial-gradient(ellipse at 70% 20%, #d97757 0%, transparent 60%)' }}/>
      <div className="pointer-events-none absolute bottom-0 left-0 w-[400px] h-[400px] opacity-20" aria-hidden="true" style={{ background: 'radial-gradient(ellipse at 30% 80%, #c96442 0%, transparent 60%)' }}/>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8" style={{ background: 'var(--lp-bg-ivory)', border: '1px solid var(--lp-border)', boxShadow: '0 0 0 1px var(--lp-ring-warm)' }}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--lp-terracotta)' }}/>
          <span className="text-xs font-medium tracking-wide" style={{ color: 'var(--lp-text-muted)' }}>{tx.badge}</span>
        </div>

        {/* Headline */}
        <h1 className="lp-serif text-5xl md:text-6xl lg:text-7xl font-medium mb-6" style={{ color: 'var(--lp-text)', lineHeight: '1.10' }}>
          {tx.headlineLine1}<br />
          <span style={{ color: 'var(--lp-terracotta)' }}>{tx.headlineAccent}</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-10" style={{ color: 'var(--lp-text-muted)', lineHeight: '1.60' }}>
          {tx.subtitle}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/sign-in"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-medium transition-all duration-200 cursor-pointer"
            style={{ background: 'var(--lp-terracotta)', color: 'var(--lp-text-on-dark)', boxShadow: '0 0 0 1px var(--lp-terracotta)' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#b8573a';
              e.currentTarget.style.boxShadow = '0 0 0 1px #b8573a, 0 4px 20px rgba(201,100,66,0.35)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--lp-terracotta)';
              e.currentTarget.style.boxShadow = '0 0 0 1px var(--lp-terracotta)';
            }}
          >
            <AuraeLogoIcon size={16} color="var(--lp-text-on-dark)" className="flex-shrink-0" />
            {tx.ctaPrimary}
          </Link>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-medium transition-all duration-200 cursor-pointer"
            style={{ background: 'var(--lp-bg-ivory)', color: 'var(--lp-text-charcoal)', border: '1px solid var(--lp-border)', boxShadow: '0 0 0 1px var(--lp-ring-warm)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--lp-border)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--lp-bg-ivory)')}
          >
            {tx.ctaSecondary}
          </a>
        </div>

        {/* Social proof */}
        <div className="mt-14 max-w-3xl mx-auto">
          <div className="text-sm mb-4" style={{ color: 'var(--lp-text-subtle)' }}>
            {tx.socialProof}
          </div>
          <div className="lp-marquee-track">
            <div className={enableMarquee ? "lp-marquee-content" : "lp-pill-list"}>
              {scrollingNames.map((name, index) => (
                <span
                  key={`${name}-${index}`}
                  className="lp-user-pill"
                  title={name}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product preview mockup */}
      <div className="relative max-w-3xl mx-auto mt-20">
        <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--lp-bg-mock)', border: '1px solid var(--lp-bg-card-muted)', boxShadow: '0 24px 64px var(--lp-shadow-card), 0 0 0 1px var(--lp-bg-card-muted)' }}>
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: '1px solid var(--lp-bg-card-muted)' }}>
            <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }}/>
            <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }}/>
            <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }}/>
            <div className="flex-1 flex justify-center">
              <div className="px-4 py-1 rounded-md text-xs" style={{ background: 'var(--lp-bg-mock-surface)', color: 'var(--lp-text-subtle)' }}>
                {tx.urlBar}
              </div>
            </div>
          </div>
          {/* Chat area */}
          <div className="px-6 py-8 space-y-5">
            {/* AI greeting */}
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #c96442, #d97757)' }}
                aria-hidden="true"
              >
                <AuraeLogoIcon size={22} color="var(--lp-text-on-dark)" />
              </div>
              <div className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm" style={{ background: 'var(--lp-bg-mock-surface)' }}>
                <p className="text-sm" style={{ color: 'var(--lp-text-on-dark)', lineHeight: '1.6' }}>{tx.chatGreeting}</p>
              </div>
            </div>
            {/* User reply */}
            <div className="flex items-start gap-3 flex-row-reverse">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--lp-border-soft)' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="var(--lp-warm-silver)" aria-hidden="true">
                  <circle cx="8" cy="5" r="3"/>
                  <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
                </svg>
              </div>
              <div className="rounded-2xl rounded-tr-sm px-4 py-3 max-w-sm" style={{ background: 'var(--lp-terracotta)' }}>
                <p className="text-sm" style={{ color: 'var(--lp-text-on-dark)', lineHeight: '1.6' }}>{tx.chatUserReply}</p>
              </div>
            </div>
            {/* AI response + feedback */}
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #c96442, #d97757)' }}
                aria-hidden="true"
              >
                <AuraeLogoIcon size={22} color="var(--lp-text-on-dark)" />
              </div>
              <div className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs" style={{ background: 'var(--lp-bg-mock-surface)' }}>
                <p className="text-sm mb-2" style={{ color: 'var(--lp-text-on-dark)', lineHeight: '1.6' }}>{tx.chatWaiterReply} 🌟</p>
                <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(201,100,66,0.15)', border: '1px solid rgba(201,100,66,0.3)', color: 'var(--lp-coral)' }}>
                  {tx.chatFeedback}
                </div>
              </div>
            </div>
            {/* Voice indicator */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl" style={{ background: 'var(--lp-bg-mock-surface)', border: '1px solid var(--lp-border-soft)' }}>
                <div className="flex items-center gap-1">
                  {[3,5,7,5,3,7,4].map((h, i) => (
                    <div key={i} className="w-1 rounded-full" style={{ height: `${h * 3}px`, background: 'var(--lp-terracotta)', opacity: 0.7 + i * 0.04 }}/>
                  ))}
                </div>
                <span className="text-xs" style={{ color: 'var(--lp-text-subtle)' }}>{tx.chatListening}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
