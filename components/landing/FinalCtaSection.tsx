'use client';

import Link from 'next/link';
import { useLanguageStore } from '@/store/useLanguageStore';
import { t } from '@/lib/landing-i18n';

export function FinalCtaSection() {
  const { lang } = useLanguageStore();
  const tx = t[lang].finalCta;

  return (
    <section className="py-28 px-6 text-center" style={{ background: '#f5f4ed' }}>
      <div className="max-w-2xl mx-auto">
        <h2
          className="lp-serif text-4xl md:text-5xl font-medium mb-5"
          style={{ color: '#141413', lineHeight: '1.20' }}
        >
          {tx.heading}
        </h2>
        <p className="text-lg mb-10" style={{ color: '#5e5d59', lineHeight: '1.60' }}>
          {tx.subheading}
        </p>
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-medium transition-all duration-200 cursor-pointer"
          style={{ background: '#c96442', color: '#faf9f5', boxShadow: '0 0 0 1px #c96442' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#b8573a';
            e.currentTarget.style.boxShadow = '0 0 0 1px #b8573a, 0 4px 20px rgba(201,100,66,0.35)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#c96442';
            e.currentTarget.style.boxShadow = '0 0 0 1px #c96442';
          }}
        >
          {tx.cta}
        </Link>
      </div>
    </section>
  );
}
