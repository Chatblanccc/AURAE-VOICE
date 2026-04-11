'use client';

import Link from 'next/link';
import { useLanguageStore } from '@/store/useLanguageStore';
import { t } from '@/lib/landing-i18n';

export function HowItWorksSection() {
  const { lang } = useLanguageStore();
  const tx = t[lang].howItWorks;

  return (
    <section id="how-it-works" className="py-28 px-6" style={{ background: '#141413' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: '#d97757', letterSpacing: '0.12em' }}>
            {tx.overline}
          </p>
          <h2 className="lp-serif text-4xl md:text-5xl font-medium mb-5" style={{ color: '#faf9f5', lineHeight: '1.20' }}>
            {tx.heading}
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: '#87867f', lineHeight: '1.60' }}>
            {tx.subheading}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {tx.steps.map((step, i) => (
            <div key={i} className="relative">
              <div className="relative rounded-2xl p-8 h-full" style={{ background: '#30302e', border: '1px solid #3d3d3a' }}>
                <div className="lp-serif text-5xl font-medium mb-6" style={{ color: 'rgba(201,100,66,0.25)' }}>
                  {step.number}
                </div>
                <h3 className="lp-serif text-xl font-medium mb-3" style={{ color: '#faf9f5', lineHeight: '1.30' }}>
                  {step.title}
                </h3>
                <p className="text-sm mb-5" style={{ color: '#87867f', lineHeight: '1.60' }}>
                  {step.description}
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(201,100,66,0.10)', border: '1px solid rgba(201,100,66,0.20)' }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#c96442' }}/>
                  <span className="text-xs font-medium" style={{ color: '#d97757' }}>{step.detail}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-medium transition-all duration-200 cursor-pointer"
            style={{ background: '#c96442', color: '#faf9f5', boxShadow: '0 0 0 1px #c96442' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#b8573a';
              e.currentTarget.style.boxShadow = '0 0 0 1px #b8573a, 0 4px 20px rgba(201,100,66,0.40)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#c96442';
              e.currentTarget.style.boxShadow = '0 0 0 1px #c96442';
            }}
          >
            {tx.cta}
          </Link>
          <p className="mt-4 text-sm" style={{ color: '#5e5d59' }}>{tx.ctaNote}</p>
        </div>
      </div>
    </section>
  );
}
