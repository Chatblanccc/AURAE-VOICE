'use client';

import Link from 'next/link';
import { useLanguageStore } from '@/store/useLanguageStore';
import { t } from '@/lib/landing-i18n';

export function HowItWorksSection() {
  const { lang } = useLanguageStore();
  const tx = t[lang].howItWorks;

  return (
    <section
      id="how-it-works"
      data-lp-how-section
      data-active-step="0"
      className="lp-how-section px-6 py-24"
      style={{ background: 'var(--lp-bg-band)' }}
    >
      <div className="hidden lg:block max-w-6xl mx-auto">
        <div className="lp-how-sticky">
          <div className="lp-how-showroom-shell">
            <div className="lp-how-showroom-copy">
              <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--lp-coral)', letterSpacing: '0.12em' }}>
                {tx.overline}
              </p>
              <h2 className="lp-serif text-5xl font-medium mb-5" style={{ color: 'var(--lp-text-on-dark)', lineHeight: '1.15' }}>
                {tx.heading}
              </h2>
              <p className="text-lg max-w-lg" style={{ color: 'var(--lp-text-on-dark-muted)', lineHeight: '1.60' }}>
                {tx.subheading}
              </p>

              <div className="lp-how-markers" aria-label={tx.heading}>
                {tx.steps.map((step, i) => (
                  <div key={step.number} className={`lp-how-marker lp-how-marker-${i}`} role="listitem">
                    <span className="lp-how-marker-number">{step.number}</span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--lp-text-on-dark)' }}>{step.title}</p>
                      <p className="mt-1 text-xs" style={{ color: 'var(--lp-text-on-dark-muted)' }}>{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-medium transition-all duration-200 cursor-pointer"
                  style={{ background: 'var(--lp-terracotta)', color: 'var(--lp-text-on-dark)', boxShadow: '0 0 0 1px var(--lp-terracotta)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#b8573a';
                    e.currentTarget.style.boxShadow = '0 0 0 1px #b8573a, 0 4px 20px rgba(201,100,66,0.40)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--lp-terracotta)';
                    e.currentTarget.style.boxShadow = '0 0 0 1px var(--lp-terracotta)';
                  }}
                >
                  {tx.cta}
                </Link>
                <p className="mt-4 text-sm" style={{ color: 'var(--lp-text-on-dark-muted)' }}>{tx.ctaNote}</p>
              </div>
            </div>

            <div className="lp-how-showroom-rail" data-lp-how-rail>
              <div className="lp-how-step-stage">
                {tx.steps.map((step, i) => (
                  <article key={step.number} className={`lp-how-step-card lp-how-step-card-${i}`}>
                    <div className="lp-how-step-headline">
                      <span className="lp-how-step-index">{step.number}</span>
                      <h3 className="lp-how-step-title lp-serif font-medium">{step.title}</h3>
                    </div>
                    <p className="lp-how-step-body text-base max-w-xl">
                      {step.description}
                    </p>
                    <div className="lp-how-step-footer">
                      <span className="lp-how-step-chip">{step.detail}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--lp-coral)', letterSpacing: '0.12em' }}>
            {tx.overline}
          </p>
          <h2 className="lp-serif text-4xl md:text-5xl font-medium mb-5" style={{ color: 'var(--lp-text-on-dark)', lineHeight: '1.20' }}>
            {tx.heading}
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--lp-text-on-dark-muted)', lineHeight: '1.60' }}>
            {tx.subheading}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {tx.steps.map((step, i) => (
            <article
              key={i}
              className="relative rounded-2xl p-7 h-full"
              style={{
                background: 'linear-gradient(165deg, rgba(255,255,255,0.07), rgba(255,255,255,0.01) 60%), var(--lp-bg-card-muted)',
                border: '1px solid var(--lp-border-soft)',
              }}
            >
              <div className="flex items-center justify-between gap-4 mb-6">
                <span
                  className="inline-flex items-center justify-center rounded-full text-xs font-semibold"
                  style={{
                    minWidth: '2.85rem',
                    minHeight: '2.85rem',
                    color: 'var(--lp-text-on-dark)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: 'rgba(255,255,255,0.06)',
                    letterSpacing: '0.14em',
                  }}
                >
                  {step.number}
                </span>
                <span
                  className="inline-flex rounded-full px-3 py-1.5 text-xs font-medium"
                  style={{ border: '1px solid rgba(201,100,66,0.24)', color: 'var(--lp-coral)', background: 'rgba(201,100,66,0.10)' }}
                >
                  {step.detail}
                </span>
              </div>
              <h3 className="lp-serif text-xl font-medium mb-3" style={{ color: 'var(--lp-text-on-dark)', lineHeight: '1.30' }}>
                {step.title}
              </h3>
              <p className="text-sm" style={{ color: 'var(--lp-text-on-dark-muted)', lineHeight: '1.60' }}>
                {step.description}
              </p>
            </article>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-medium transition-all duration-200 cursor-pointer"
            style={{ background: 'var(--lp-terracotta)', color: 'var(--lp-text-on-dark)', boxShadow: '0 0 0 1px var(--lp-terracotta)' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#b8573a';
              e.currentTarget.style.boxShadow = '0 0 0 1px #b8573a, 0 4px 20px rgba(201,100,66,0.40)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--lp-terracotta)';
              e.currentTarget.style.boxShadow = '0 0 0 1px var(--lp-terracotta)';
            }}
          >
            {tx.cta}
          </Link>
          <p className="mt-4 text-sm" style={{ color: 'var(--lp-text-on-dark-muted)' }}>{tx.ctaNote}</p>
        </div>
      </div>
    </section>
  );
}
