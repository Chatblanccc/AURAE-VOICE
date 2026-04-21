'use client';

import type { CSSProperties } from 'react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { t } from '@/lib/landing-i18n';

const featureIcons = [
  // Real-Time AI Conversation
  <svg key="0" width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="9" stroke="#c96442" strokeWidth="1.5"/>
    <path d="M7 11c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4" stroke="#c96442" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="11" cy="11" r="1.5" fill="#c96442"/>
  </svg>,
  // Instant Grammar Feedback
  <svg key="1" width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path d="M4 7h14M4 11h10M4 15h7" stroke="#c96442" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="17" cy="15" r="3" stroke="#c96442" strokeWidth="1.5"/>
    <path d="M17 14v1.5l1 1" stroke="#c96442" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>,
  // Pronunciation Coaching
  <svg key="2" width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path d="M11 3v2M11 17v2M3 11h2M17 11h2M5.6 5.6l1.4 1.4M15 15l1.4 1.4M5.6 16.4L7 15M15 7l1.4-1.4" stroke="#c96442" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="11" cy="11" r="4" stroke="#c96442" strokeWidth="1.5"/>
  </svg>,
  // Multi-Scene Practice
  <svg key="3" width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <rect x="3" y="4" width="16" height="12" rx="2" stroke="#c96442" strokeWidth="1.5"/>
    <path d="M7 9h8M7 12h5" stroke="#c96442" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 18h4" stroke="#c96442" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M11 16v2" stroke="#c96442" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>,
  // Progress Tracking
  <svg key="4" width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <path d="M4 16L8 8l4 6 3-4 3 6" stroke="#c96442" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="17" cy="5" r="2" stroke="#c96442" strokeWidth="1.5"/>
    <path d="M17 7v2" stroke="#c96442" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>,
  // Adaptive Learning
  <svg key="5" width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <circle cx="11" cy="8" r="3" stroke="#c96442" strokeWidth="1.5"/>
    <path d="M5 18c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#c96442" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M16 4l1.5 1.5L16 7" stroke="#c96442" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
];

export function FeaturesSection() {
  const { lang } = useLanguageStore();
  const tx = t[lang].features;

  return (
    <section id="features" className="py-24 px-6" style={{ background: 'var(--lp-bg-page)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--lp-terracotta)', letterSpacing: '0.12em' }}>
            {tx.overline}
          </p>
          <h2 className="lp-serif text-4xl md:text-5xl font-medium mb-5" style={{ color: 'var(--lp-text)', lineHeight: '1.20' }}>
            {tx.heading}
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--lp-text-muted)', lineHeight: '1.60' }}>
            {tx.subheading}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tx.items.map((feature, i) => (
            <div
              key={i}
              data-lp-reveal
              className="rounded-2xl p-7 transition-all duration-200 cursor-default"
              style={{
                '--lp-reveal-index': i,
                background: 'var(--lp-bg-card)',
                border: '1px solid var(--lp-border)',
                boxShadow: 'var(--lp-shadow-card) 0px 4px 24px',
              } as CSSProperties}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 1px var(--lp-ring-warm), var(--lp-shadow-card) 0px 8px 32px';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--lp-shadow-card) 0px 4px 24px';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(201,100,66,0.08)' }}>
                {featureIcons[i]}
              </div>
              <h3 className="lp-serif text-xl font-medium mb-3" style={{ color: 'var(--lp-text)', lineHeight: '1.30' }}>
                {feature.title}
              </h3>
              <p className="text-sm" style={{ color: 'var(--lp-text-muted)', lineHeight: '1.60' }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
