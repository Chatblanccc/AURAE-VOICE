'use client';

import Link from 'next/link';
import { useLanguageStore } from '@/store/useLanguageStore';
import { t } from '@/lib/landing-i18n';
import { AuraeLogoIcon } from '@/components/AuraeLogo';

const productHrefs = ['#features', '#how-it-works', '#pricing', '#faq'];
const companyHrefs = ['#', '#', '#', 'mailto:hello@aurae.ai'];
const legalHrefs = ['#', '#', '#'];

export function LandingFooter() {
  const { lang } = useLanguageStore();
  const tx = t[lang].footer;
  const year = new Date().getFullYear();

  const columns = [
    { heading: tx.columns.product, labels: tx.links.product, hrefs: productHrefs },
    { heading: tx.columns.company, labels: tx.links.company, hrefs: companyHrefs },
    { heading: tx.columns.legal, labels: tx.links.legal, hrefs: legalHrefs },
  ];

  return (
    <footer style={{ background: '#141413', borderTop: '1px solid #30302e' }}>
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <AuraeLogoIcon size={30} color="#C96442" />
              <span className="text-base font-semibold tracking-tight" style={{ color: '#faf9f5' }}>AURAE VOICE</span>
            </Link>
            <p className="text-sm mb-5" style={{ color: '#5e5d59', lineHeight: '1.60' }}>{tx.tagline}</p>
            <div className="flex items-center gap-3">
              {[
                {
                  label: 'Twitter / X',
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="#87867f" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.892-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
                },
                {
                  label: 'LinkedIn',
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="#87867f" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 cursor-pointer"
                  style={{ background: '#30302e', border: '1px solid #3d3d3a' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#3d3d3a')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#30302e')}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#4d4c48', letterSpacing: '0.1em' }}>
                {col.heading}
              </p>
              <ul className="flex flex-col gap-3">
                {col.labels.map((label, j) => (
                  <li key={label}>
                    <a
                      href={col.hrefs[j]}
                      className="text-sm transition-colors duration-200 cursor-pointer"
                      style={{ color: '#5e5d59' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#b0aea5')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#5e5d59')}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8" style={{ borderTop: '1px solid #30302e' }}>
          <p className="text-xs" style={{ color: '#3d3d3a' }}>
            © {year} AURAE VOICE. {tx.copyright}
          </p>
          <p className="text-xs" style={{ color: '#3d3d3a' }}>{tx.madeWith}</p>
        </div>
      </div>
    </footer>
  );
}
