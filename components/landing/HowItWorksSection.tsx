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

              <div className="lp-how-markers">
                {tx.steps.map((step, i) => (
                  <div key={step.number} className={`lp-how-marker lp-how-marker-${i}`}>
                    <span className="lp-how-marker-number">{step.number}</span>
                    <div>
                      <p className="text-sm font-medium text-white/90">{step.title}</p>
                      <p className="mt-1 text-xs text-white/50">{step.detail}</p>
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

            <div className="lp-how-showroom-rail">
              <div className="lp-how-step-stage">
                {tx.steps.map((step, i) => (
                  <article key={step.number} className={`lp-how-step-card lp-how-step-card-${i}`}>
                    <div className="lp-how-step-meta">
                      <span className="lp-how-step-index">{step.number}</span>
                      <span className="lp-how-step-chip">{step.detail}</span>
                    </div>
                    <h3 className="lp-how-step-title lp-serif font-medium" style={{ color: 'var(--lp-text-on-dark)', lineHeight: '1.22' }}>
                      {step.title}
                    </h3>
                    <p className="lp-how-step-body text-base max-w-xl" style={{ color: 'var(--lp-text-on-dark-muted)', lineHeight: '1.72' }}>
                      {step.description}
                    </p>
                    <div className="lp-how-step-footer mt-auto">
                      <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg" style={{ background: 'rgba(201,100,66,0.10)', border: '1px solid rgba(201,100,66,0.20)' }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--lp-terracotta)' }}/>
                        <span className="text-xs font-medium" style={{ color: 'var(--lp-coral)' }}>{step.detail}</span>
                      </div>
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
            <div key={i} className="relative">
              <div className="relative rounded-2xl p-8 h-full" style={{ background: 'var(--lp-bg-card-muted)', border: '1px solid var(--lp-border-soft)' }}>
                <div className="lp-serif text-5xl font-medium mb-6" style={{ color: 'rgba(201,100,66,0.25)' }}>
                  {step.number}
                </div>
                <h3 className="lp-serif text-xl font-medium mb-3" style={{ color: 'var(--lp-text-on-dark)', lineHeight: '1.30' }}>
                  {step.title}
                </h3>
                <p className="text-sm mb-5" style={{ color: 'var(--lp-text-on-dark-muted)', lineHeight: '1.60' }}>
                  {step.description}
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(201,100,66,0.10)', border: '1px solid rgba(201,100,66,0.20)' }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--lp-terracotta)' }}/>
                  <span className="text-xs font-medium" style={{ color: 'var(--lp-coral)' }}>{step.detail}</span>
                </div>
              </div>
            </div>
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
