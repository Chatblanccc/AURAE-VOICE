'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { MessageSquare, LogOut } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useThemeStore } from '@/store/useThemeStore';
import { t } from '@/lib/landing-i18n';
import { AuraeLogoIcon } from '@/components/AuraeLogo';
import { ThemeToggle } from '@/components/ThemeToggle';

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const { lang, toggleLang } = useLanguageStore();
  const mode = useThemeStore((s) => s.mode);
  const tx = t[lang].nav;
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated' && !!session?.user;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const navLinks = [
    { label: tx.features, href: '#features' },
    { label: tx.howItWorks, href: '#how-it-works' },
    { label: tx.pricing, href: '#pricing' },
    { label: tx.faq, href: '#faq' },
  ];

  const userName = session?.user?.name?.trim() || session?.user?.email?.trim() || '';
  const userImage = session?.user?.image;
  const userInitial = userName ? userName.slice(0, 1).toUpperCase() : '?';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'var(--lp-bg-nav-scrolled)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--lp-border)' : '1px solid transparent',
      }}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 flex-shrink-0"
        >
          <AuraeLogoIcon size={30} color="#C96442" />
          <span className="text-lg font-semibold tracking-tight" style={{ color: '#ffffff', textShadow: '0 2px 12px rgba(0,0,0,0.35)' }}>
            AURAE VOICE
          </span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap"
                style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 2px 10px rgba(0,0,0,0.30)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.95)';
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right side: lang toggle + auth */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer select-none"
            style={{
              background: 'var(--lp-border)',
              color: 'var(--lp-text-muted)',
              border: '1px solid var(--lp-border-warm)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--lp-border-warm)';
              e.currentTarget.style.color = 'var(--lp-text)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--lp-border)';
              e.currentTarget.style.color = 'var(--lp-text-muted)';
            }}
            aria-label="Toggle language"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8 1.5C8 1.5 5.5 4 5.5 8s2.5 6.5 2.5 6.5M8 1.5C8 1.5 10.5 4 10.5 8S8 14.5 8 14.5M1.5 8h13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            {lang === 'en' ? '中文' : 'EN'}
          </button>

          {status === 'loading' ? (
            <span className="text-xs px-2" style={{ color: 'var(--lp-text-subtle)' }} aria-hidden>…</span>
          ) : isLoggedIn ? (
            <div className="relative pl-1" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer"
                style={{
                  background: userMenuOpen ? 'var(--lp-border)' : 'transparent',
                  border: `1px solid ${userMenuOpen ? 'var(--lp-border-warm)' : 'transparent'}`,
                }}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-label="Open account menu"
              >
                {userImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={userImage}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border flex-shrink-0"
                    style={{ borderColor: 'rgba(201,100,66,.35)' }}
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: 'rgba(201,100,66,.2)', color: '#c96442' }}
                  >
                    {userInitial}
                  </div>
                )}
                <span className="text-xs font-medium max-w-[92px] truncate hidden sm:inline" style={{ color: 'var(--lp-text)' }} title={userName}>
                  {userName}
                </span>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] w-44 rounded-xl p-1.5 shadow-xl"
                  style={{
                    background: 'var(--lp-bg-nav-scrolled)',
                    border: '1px solid var(--lp-border)',
                    backdropFilter: 'blur(12px)',
                  }}
                  role="menu"
                >
                  <Link
                    href="/chat"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer"
                    style={{ color: 'var(--lp-text)' }}
                    onClick={() => setUserMenuOpen(false)}
                    role="menuitem"
                  >
                    <MessageSquare size={14} />
                    {tx.goToChat}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      signOut({ callbackUrl: '/' });
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer"
                    style={{ color: 'var(--lp-text-muted)' }}
                    role="menuitem"
                  >
                    <LogOut size={14} />
                    {tx.signOut}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-medium transition-colors duration-200 cursor-pointer"
                style={{ color: 'var(--lp-text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--lp-text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--lp-text-muted)')}
              >
                {tx.signIn}
              </Link>
              <Link
                href="/sign-in?callbackUrl=%2Fchat"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
                style={{ background: '#c96442', color: '#faf9f5', boxShadow: '0 0 0 1px #c96442' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#b8573a';
                  e.currentTarget.style.boxShadow = '0 0 0 1px #b8573a';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#c96442';
                  e.currentTarget.style.boxShadow = '0 0 0 1px #c96442';
                }}
              >
                {tx.startFree}
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="block w-5 h-0.5 transition-all duration-200" style={{ background: 'var(--lp-text)', transform: menuOpen ? 'rotate(45deg) translate(3px, 3px)' : 'none' }}/>
          <span className="block w-5 h-0.5 transition-all duration-200" style={{ background: 'var(--lp-text)', opacity: menuOpen ? 0 : 1 }}/>
          <span className="block w-5 h-0.5 transition-all duration-200" style={{ background: 'var(--lp-text)', transform: menuOpen ? 'rotate(-45deg) translate(3px, -3px)' : 'none' }}/>
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden px-6 pb-6 flex flex-col gap-4"
          style={{ background: 'var(--lp-bg-nav-scrolled)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--lp-border)' }}
        >
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-sm py-1 cursor-pointer" style={{ color: 'var(--lp-text-muted)' }} onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
          <button
            onClick={toggleLang}
            className="flex items-center gap-2 py-1 text-sm font-medium cursor-pointer w-fit"
            style={{ color: 'var(--lp-text-muted)' }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8 1.5C8 1.5 5.5 4 5.5 8s2.5 6.5 2.5 6.5M8 1.5C8 1.5 10.5 4 10.5 8S8 14.5 8 14.5M1.5 8h13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            {lang === 'en' ? '切换到中文' : 'Switch to English'}
          </button>

          <div className="flex items-center gap-2 py-2">
            <ThemeToggle />
            <span className="text-xs" style={{ color: 'var(--lp-text-subtle)' }}>{mode === 'dark' ? (lang === 'zh' ? '深色' : 'Dark') : (lang === 'zh' ? '浅色' : 'Light')}</span>
          </div>

          {isLoggedIn ? (
            <div className="flex flex-col gap-3 pt-2 border-t" style={{ borderColor: 'var(--lp-border-warm)' }}>
              <div className="flex items-center gap-3">
                {userImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userImage} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover border" style={{ borderColor: 'rgba(201,100,66,.35)' }} />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(201,100,66,.2)', color: '#c96442' }}>
                    {userInitial}
                  </div>
                )}
                <span className="text-sm font-medium truncate flex-1" style={{ color: 'var(--lp-text)' }}>{userName}</span>
              </div>
              <Link href="/chat" className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: '#c96442', color: '#faf9f5' }} onClick={() => setMenuOpen(false)}>
                {tx.goToChat}
              </Link>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                className="text-sm py-2 text-center cursor-pointer"
                style={{ color: 'var(--lp-text-muted)' }}
              >
                {tx.signOut}
              </button>
            </div>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm py-1 cursor-pointer" style={{ color: 'var(--lp-text-muted)' }} onClick={() => setMenuOpen(false)}>
                {tx.signIn}
              </Link>
              <Link href="/sign-in?callbackUrl=%2Fchat" className="mt-2 flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: '#c96442', color: '#faf9f5' }} onClick={() => setMenuOpen(false)}>
                {tx.startFree}
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
