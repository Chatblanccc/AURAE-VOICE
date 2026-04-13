'use client';

import { useState } from 'react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { t } from '@/lib/landing-i18n';

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderBottom: '1px solid var(--lp-border)' }}>
      <button
        className="w-full flex items-start justify-between gap-4 py-6 text-left cursor-pointer"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-base font-medium" style={{ color: 'var(--lp-text)', lineHeight: '1.50' }}>
          {question}
        </span>
        <span
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
          style={{ background: open ? 'var(--lp-terracotta)' : 'var(--lp-border)', transform: open ? 'rotate(45deg)' : 'none' }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M5 1v8M1 5h8" stroke={open ? 'var(--lp-text-on-dark)' : 'var(--lp-text-subtle)'} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </span>
      </button>
      {open && (
        <div className="pb-6">
          <p className="text-base" style={{ color: 'var(--lp-text-muted)', lineHeight: '1.65' }}>{answer}</p>
        </div>
      )}
    </div>
  );
}

export function FaqSection() {
  const { lang } = useLanguageStore();
  const tx = t[lang].faq;

  return (
    <section id="faq" className="py-28 px-6" style={{ background: 'var(--lp-bg-page)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--lp-terracotta)', letterSpacing: '0.12em' }}>
            {tx.overline}
          </p>
          <h2 className="lp-serif text-4xl md:text-5xl font-medium" style={{ color: 'var(--lp-text)', lineHeight: '1.20' }}>
            {tx.heading}
          </h2>
        </div>

        <div className="rounded-2xl px-8 overflow-hidden" style={{ background: 'var(--lp-bg-card)', border: '1px solid var(--lp-border)', boxShadow: 'var(--lp-shadow-card) 0px 4px 24px' }}>
          {tx.items.map((item, i) => (
            <FaqItem key={i} question={item.question} answer={item.answer} />
          ))}
        </div>

        <p className="text-center mt-10 text-sm" style={{ color: 'var(--lp-text-subtle)' }}>
          {tx.emailNote}{' '}
          <a
            href="mailto:hello@aurae.ai"
            className="underline transition-colors duration-200"
            style={{ color: 'var(--lp-text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--lp-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--lp-text-muted)')}
          >
            {tx.emailLink}
          </a>{' '}
          {tx.emailSuffix}
        </p>
      </div>
    </section>
  );
}
