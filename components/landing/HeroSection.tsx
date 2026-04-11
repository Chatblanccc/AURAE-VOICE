'use client';

import Link from 'next/link';
import { useLanguageStore } from '@/store/useLanguageStore';
import { t } from '@/lib/landing-i18n';

export function HeroSection() {
  const { lang } = useLanguageStore();
  const tx = t[lang].hero;

  return (
    <section className="relative overflow-hidden pt-40 pb-28 px-6" style={{ background: '#f5f4ed' }}>
      {/* Ambient glows */}
      <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] opacity-30" aria-hidden="true" style={{ background: 'radial-gradient(ellipse at 70% 20%, #d97757 0%, transparent 60%)' }}/>
      <div className="pointer-events-none absolute bottom-0 left-0 w-[400px] h-[400px] opacity-20" aria-hidden="true" style={{ background: 'radial-gradient(ellipse at 30% 80%, #c96442 0%, transparent 60%)' }}/>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8" style={{ background: '#faf9f5', border: '1px solid #f0eee6', boxShadow: '0 0 0 1px #d1cfc5' }}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#c96442' }}/>
          <span className="text-xs font-medium tracking-wide" style={{ color: '#5e5d59' }}>{tx.badge}</span>
        </div>

        {/* Headline */}
        <h1 className="lp-serif text-5xl md:text-6xl lg:text-7xl font-medium mb-6" style={{ color: '#141413', lineHeight: '1.10' }}>
          {tx.headlineLine1}<br />
          <span style={{ color: '#c96442' }}>{tx.headlineAccent}</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-10" style={{ color: '#5e5d59', lineHeight: '1.60' }}>
          {tx.subtitle}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/sign-in"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-medium transition-all duration-200 cursor-pointer"
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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 1C5.2 1 3 3.7 3 7c0 2 .9 3.7 2.3 4.8L5 13h6l-.3-1.2C12.1 10.7 13 9 13 7c0-3.3-2.2-6-5-6z" fill="white" opacity="0.9"/>
              <path d="M6 14h4v.5a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5V14z" fill="white" opacity="0.7"/>
            </svg>
            {tx.ctaPrimary}
          </Link>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-medium transition-all duration-200 cursor-pointer"
            style={{ background: '#faf9f5', color: '#4d4c48', border: '1px solid #f0eee6', boxShadow: '0 0 0 1px #d1cfc5' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f0eee6')}
            onMouseLeave={e => (e.currentTarget.style.background = '#faf9f5')}
          >
            {tx.ctaSecondary}
          </a>
        </div>

        {/* Social proof */}
        <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {(['#e8a87c', '#7eb8c9', '#9b8ec4', '#74b87e'] as const).map((color, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium" style={{ background: color, borderColor: '#f5f4ed', color: '#fff' }}>
                  {['A', 'B', 'C', 'D'][i]}
                </div>
              ))}
            </div>
            <span className="text-sm" style={{ color: '#87867f' }}>
              <span className="font-semibold" style={{ color: '#141413' }}>2,400+</span> {tx.socialProof}
            </span>
          </div>
          <div className="hidden sm:block w-px h-4" style={{ background: '#e8e6dc' }}/>
          <div className="flex items-center gap-1.5">
            {[1,2,3,4,5].map(i => (
              <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#c96442" aria-hidden="true">
                <path d="M7 1l1.5 3.2 3.5.5-2.5 2.4.6 3.4L7 9l-3.1 1.5.6-3.4L2 4.7l3.5-.5L7 1z"/>
              </svg>
            ))}
            <span className="text-sm ml-1" style={{ color: '#87867f' }}>
              <span className="font-semibold" style={{ color: '#141413' }}>4.9</span>/5 {tx.rating}
            </span>
          </div>
        </div>
      </div>

      {/* Product preview mockup */}
      <div className="relative max-w-3xl mx-auto mt-20">
        <div className="rounded-3xl overflow-hidden" style={{ background: '#141413', border: '1px solid #30302e', boxShadow: 'rgba(0,0,0,0.15) 0px 24px 64px, 0 0 0 1px #30302e' }}>
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: '1px solid #30302e' }}>
            <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }}/>
            <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }}/>
            <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }}/>
            <div className="flex-1 flex justify-center">
              <div className="px-4 py-1 rounded-md text-xs" style={{ background: '#30302e', color: '#87867f' }}>
                {tx.urlBar}
              </div>
            </div>
          </div>
          {/* Chat area */}
          <div className="px-6 py-8 space-y-5">
            {/* AI greeting */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #c96442, #d97757)' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 2C5.8 2 4 3.8 4 6c0 1.5.8 2.8 2 3.5V11h4V9.5C11.2 8.8 12 7.5 12 6c0-2.2-1.8-4-4-4z" fill="white" opacity="0.9"/>
                  <path d="M6 12h4v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-1z" fill="white" opacity="0.7"/>
                </svg>
              </div>
              <div className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm" style={{ background: '#30302e' }}>
                <p className="text-sm" style={{ color: '#faf9f5', lineHeight: '1.6' }}>{tx.chatGreeting}</p>
              </div>
            </div>
            {/* User reply */}
            <div className="flex items-start gap-3 flex-row-reverse">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#3d3d3a' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="#b0aea5" aria-hidden="true">
                  <circle cx="8" cy="5" r="3"/>
                  <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
                </svg>
              </div>
              <div className="rounded-2xl rounded-tr-sm px-4 py-3 max-w-sm" style={{ background: '#c96442' }}>
                <p className="text-sm" style={{ color: '#faf9f5', lineHeight: '1.6' }}>{tx.chatUserReply}</p>
              </div>
            </div>
            {/* AI response + feedback */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #c96442, #d97757)' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 2C5.8 2 4 3.8 4 6c0 1.5.8 2.8 2 3.5V11h4V9.5C11.2 8.8 12 7.5 12 6c0-2.2-1.8-4-4-4z" fill="white" opacity="0.9"/>
                  <path d="M6 12h4v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-1z" fill="white" opacity="0.7"/>
                </svg>
              </div>
              <div className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs" style={{ background: '#30302e' }}>
                <p className="text-sm mb-2" style={{ color: '#faf9f5', lineHeight: '1.6' }}>{tx.chatWaiterReply} 🌟</p>
                <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(201,100,66,0.15)', border: '1px solid rgba(201,100,66,0.3)', color: '#d97757' }}>
                  {tx.chatFeedback}
                </div>
              </div>
            </div>
            {/* Voice indicator */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl" style={{ background: '#30302e', border: '1px solid #3d3d3a' }}>
                <div className="flex items-center gap-1">
                  {[3,5,7,5,3,7,4].map((h, i) => (
                    <div key={i} className="w-1 rounded-full" style={{ height: `${h * 3}px`, background: '#c96442', opacity: 0.7 + i * 0.04 }}/>
                  ))}
                </div>
                <span className="text-xs" style={{ color: '#87867f' }}>{tx.chatListening}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
