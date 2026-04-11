'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { t } from '@/lib/landing-i18n';
import type { UserPlan } from '@/types';

const PLAN_KEYS: Array<null | 'plus' | 'pro'> = [null, 'plus', 'pro'];

const SIGN_IN_RETURN = '/?from=pricing';

/** What to show on paid-plan buttons for logged-in users. */
function paidPlanButtonState(
  userPlan: UserPlan | null,
  planKey: 'plus' | 'pro',
): 'loading' | 'checkout' | 'current' | 'blocked' {
  if (userPlan === null) return 'loading';
  if (userPlan === 'free') return 'checkout';
  if (userPlan === 'pro') {
    if (planKey === 'pro') return 'current';
    return 'blocked';
  }
  if (userPlan === 'plus') {
    if (planKey === 'plus') return 'current';
    return 'checkout';
  }
  return 'checkout';
}

export function PricingSection() {
  const { lang } = useLanguageStore();
  const tx = t[lang].pricing;
  const recommended = [false, true, false];
  const { data: session, status } = useSession();
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);

  const isLoggedIn = status === 'authenticated' && !!session?.user;

  const fetchPlan = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user) {
      setUserPlan(null);
      return;
    }
    try {
      const res = await fetch('/api/usage', { cache: 'no-store' });
      if (!res.ok) {
        setUserPlan('free');
        return;
      }
      const data = (await res.json()) as { plan?: UserPlan };
      const p = data.plan;
      setUserPlan(p === 'plus' || p === 'pro' || p === 'free' ? p : 'free');
    } catch {
      setUserPlan('free');
    }
  }, [status, session?.user]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') === 'pricing') {
      requestAnimationFrame(() => {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  async function handlePaidPlanClick(planIndex: number) {
    const planKey = PLAN_KEYS[planIndex];
    if (!planKey) return;

    if (status === 'loading') return;

    if (!session?.user || status !== 'authenticated') {
      setShowLoginModal(true);
      return;
    }

    const btn = paidPlanButtonState(userPlan, planKey);
    if (btn === 'loading' || btn === 'current' || btn === 'blocked') return;

    setLoadingIndex(planIndex);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      });

      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        console.error('[checkout]', data.error ?? 'Unknown error');
        alert(data.error ?? 'Failed to start checkout. Please try again.');
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error('[checkout] network error', err);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setLoadingIndex(null);
    }
  }

  const signInForPricingHref = `/sign-in?callbackUrl=${encodeURIComponent(SIGN_IN_RETURN)}`;
  const signInForChatHref = `/sign-in?callbackUrl=${encodeURIComponent('/chat')}`;

  return (
    <section id="pricing" className="py-28 px-6" style={{ background: '#141413' }}>
      {showLoginModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,.65)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pricing-login-modal-title"
        >
          <div
            className="relative w-full max-w-md rounded-2xl p-8 shadow-2xl border"
            style={{ background: '#1e1e1c', borderColor: '#3d3d3a' }}
          >
            <button
              type="button"
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-lg leading-none cursor-pointer hover:opacity-80"
              style={{ color: '#87867f' }}
              aria-label={tx.loginModalClose}
            >
              ×
            </button>
            <h3 id="pricing-login-modal-title" className="lp-serif text-xl font-medium pr-8 mb-3" style={{ color: '#faf9f5' }}>
              {tx.loginModalTitle}
            </h3>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: '#b0aea5' }}>
              {tx.loginModalBody}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={signInForPricingHref}
                className="flex-1 flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                style={{ background: '#c96442', color: '#faf9f5' }}
              >
                {tx.loginModalCta}
              </Link>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="flex-1 px-5 py-3 rounded-xl text-sm font-medium cursor-pointer border"
                style={{ background: 'transparent', color: '#87867f', borderColor: '#4d4c48' }}
              >
                {tx.loginModalClose}
              </button>
            </div>
          </div>
        </div>
      )}

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {tx.plans.map((plan, i) => {
            const isRec = recommended[i];
            const isComingSoon = plan.comingSoon === true;
            const planKey = PLAN_KEYS[i];
            const isPaid = planKey !== null;
            const isLoading = loadingIndex === i;
            const sessionLoading = status === 'loading';
            const btnState =
              isPaid && planKey && isLoggedIn
                ? paidPlanButtonState(userPlan, planKey)
                : 'idle';
            const disabledPaid =
              isPaid &&
              (sessionLoading ||
                (isLoggedIn &&
                  (btnState === 'loading' ||
                    btnState === 'current' ||
                    btnState === 'blocked')));

            let paidLabel: string = plan.cta;
            if (isPaid && planKey && isLoggedIn) {
              if (btnState === 'current') paidLabel = tx.currentPlan;
              else if (btnState === 'blocked') paidLabel = tx.higherPlanActive;
            }

            return (
              <div
                key={i}
                className="relative rounded-2xl p-8 flex flex-col gap-6"
                style={{
                  background: isComingSoon ? '#1e1e1c' : isRec ? '#faf9f5' : '#30302e',
                  border: isComingSoon ? '1px solid #2d2d2b' : isRec ? '1px solid #f0eee6' : '1px solid #3d3d3a',
                  boxShadow: isRec ? '0 0 0 1px #c96442, rgba(201,100,66,0.20) 0px 20px 60px' : 'none',
                  opacity: isComingSoon ? 0.75 : 1,
                }}
              >
                {isRec && !isComingSoon && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold" style={{ background: '#c96442', color: '#faf9f5' }}>
                    {tx.mostPopular}
                  </div>
                )}
                {isComingSoon && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold" style={{ background: '#3d3d3a', color: '#87867f', border: '1px solid #4d4c48' }}>
                    {lang === 'zh' ? '即将推出' : 'Coming Soon'}
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: isComingSoon ? '#5e5d59' : isRec ? '#c96442' : '#d97757' }}>
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="lp-serif text-4xl font-medium" style={{ color: isComingSoon ? '#5e5d59' : isRec ? '#141413' : '#faf9f5' }}>
                      {plan.price}
                    </span>
                    <span className="text-sm" style={{ color: isComingSoon ? '#3d3d3a' : isRec ? '#87867f' : '#5e5d59' }}>
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: isComingSoon ? '#5e5d59' : isRec ? '#5e5d59' : '#87867f', lineHeight: '1.60' }}>
                    {plan.description}
                  </p>
                </div>

                <ul className="flex flex-col gap-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5" aria-hidden="true">
                        <circle cx="8" cy="8" r="7" fill={isComingSoon ? 'rgba(100,100,96,0.10)' : isRec ? 'rgba(201,100,66,0.10)' : 'rgba(201,100,66,0.15)'}/>
                        <path d="M5 8l2 2 4-4" stroke={isComingSoon ? '#5e5d59' : '#c96442'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-sm" style={{ color: isComingSoon ? '#5e5d59' : isRec ? '#4d4c48' : '#b0aea5', lineHeight: '1.50' }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {isComingSoon ? (
                  <div
                    className="mt-auto flex items-center justify-center px-5 py-3 rounded-xl text-sm font-medium cursor-not-allowed"
                    style={{ background: '#2d2d2b', color: '#5e5d59', border: '1px solid #3d3d3a' }}
                    aria-disabled="true"
                  >
                    {plan.cta}
                  </div>
                ) : isPaid ? (
                  <button
                    onClick={() => handlePaidPlanClick(i)}
                    disabled={disabledPaid || isLoading}
                    className="mt-auto flex items-center justify-center px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-center leading-snug min-h-[48px]"
                    style={isRec
                      ? { background: '#c96442', color: '#faf9f5', boxShadow: '0 0 0 1px #c96442' }
                      : { background: '#3d3d3a', color: '#faf9f5', border: '1px solid #4d4c48' }
                    }
                    onMouseEnter={e => {
                      if (disabledPaid || isLoading) return;
                      e.currentTarget.style.background = isRec ? '#b8573a' : '#4d4c48';
                    }}
                    onMouseLeave={e => {
                      if (disabledPaid || isLoading) return;
                      e.currentTarget.style.background = isRec ? '#c96442' : '#3d3d3a';
                    }}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" />
                        </svg>
                        {lang === 'zh' ? '跳转中…' : 'Redirecting…'}
                      </span>
                    ) : (
                      paidLabel
                    )}
                  </button>
                ) : (
                  <Link
                    href={isLoggedIn ? '/chat' : signInForChatHref}
                    className="mt-auto flex items-center justify-center px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
                    style={{ background: '#3d3d3a', color: '#faf9f5', border: '1px solid #4d4c48' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#4d4c48'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#3d3d3a'; }}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center mt-10 text-sm" style={{ color: '#5e5d59' }}>
          {tx.ctaNote}{' '}
          <a href="#faq" style={{ color: '#d97757', textDecoration: 'underline' }}>
            {tx.ctaNoteFaqLink}
          </a>
        </p>
      </div>
    </section>
  );
}
