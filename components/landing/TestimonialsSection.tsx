'use client';

import { useLanguageStore } from '@/store/useLanguageStore';
import { t } from '@/lib/landing-i18n';

const avatarColors = ['#7eb8c9', '#e8a87c', '#9b8ec4', '#74b87e', '#c4a87c', '#c47c8e'];
const avatarInitials = ['YT', 'MG', 'WL', 'FA', 'LM', 'PK'];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 14 14" fill="#c96442" aria-hidden="true">
          <path d="M7 1l1.5 3.2 3.5.5-2.5 2.4.6 3.4L7 9l-3.1 1.5.6-3.4L2 4.7l3.5-.5L7 1z"/>
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const { lang } = useLanguageStore();
  const tx = t[lang].testimonials;

  return (
    <section className="py-28 px-6" style={{ background: '#f5f4ed' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: '#c96442', letterSpacing: '0.12em' }}>
            {tx.overline}
          </p>
          <h2 className="lp-serif text-4xl md:text-5xl font-medium mb-5" style={{ color: '#141413', lineHeight: '1.20' }}>
            {tx.heading}
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: '#5e5d59', lineHeight: '1.60' }}>
            {tx.subheading}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tx.items.map((item, i) => (
            <div key={i} className="rounded-2xl p-7 flex flex-col gap-5" style={{ background: '#faf9f5', border: '1px solid #f0eee6', boxShadow: 'rgba(0,0,0,0.04) 0px 4px 24px' }}>
              <StarRating count={5} />
              <p className="text-base flex-1" style={{ color: '#4d4c48', lineHeight: '1.65' }}>
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-1" style={{ borderTop: '1px solid #f0eee6' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ background: avatarColors[i], color: '#fff' }}>
                  {avatarInitials[i]}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#141413' }}>{item.name}</p>
                  <p className="text-xs" style={{ color: '#87867f' }}>{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
