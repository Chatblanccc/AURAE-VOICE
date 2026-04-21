'use client';

import { useEffect } from 'react';

const DESKTOP_BREAKPOINT = '(min-width: 1024px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function bindMediaChange(media: MediaQueryList, handler: () => void) {
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }

  media.addListener(handler);
  return () => media.removeListener(handler);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getStickyProgress(section: HTMLElement, viewportHeight: number, offset = 0) {
  const rect = section.getBoundingClientRect();
  const travel = Math.max(section.offsetHeight - viewportHeight, 1);
  return clamp((-rect.top + offset) / travel, 0, 1);
}

function getMobileProgress(section: HTMLElement, viewportHeight: number) {
  const rect = section.getBoundingClientRect();
  const start = viewportHeight * 0.14;
  const end = viewportHeight * 1.08;
  return clamp((start - rect.top) / end, 0, 1);
}

export function LandingScrollEffects() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>('.landing-page');
    const main = document.querySelector<HTMLElement>('.landing-main');
    if (!page || !main) return;

    const heroSection = main.querySelector<HTMLElement>('[data-lp-hero-section]');
    const howSection = main.querySelector<HTMLElement>('[data-lp-how-section]');
    const revealNodes = Array.from(main.querySelectorAll<HTMLElement>('[data-lp-reveal]'));

    const desktopQuery = window.matchMedia(DESKTOP_BREAKPOINT);
    const reducedMotionQuery = window.matchMedia(REDUCED_MOTION_QUERY);

    let frameId = 0;
    let observer: IntersectionObserver | null = null;

    const resetShowroomState = () => {
      heroSection?.style.removeProperty('--lp-hero-progress');
      howSection?.style.removeProperty('--lp-how-progress');
      howSection?.removeAttribute('data-active-step');
    };

    const markAllVisible = () => {
      revealNodes.forEach((node) => {
        node.dataset.lpVisible = 'true';
      });
    };

    const disconnectObserver = () => {
      observer?.disconnect();
      observer = null;
    };

    const setupObserver = () => {
      disconnectObserver();

      if (reducedMotionQuery.matches || !('IntersectionObserver' in window)) {
        markAllVisible();
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const target = entry.target as HTMLElement;
            target.dataset.lpVisible = 'true';
            observer?.unobserve(target);
          });
        },
        {
          threshold: 0.16,
          rootMargin: '0px 0px -10% 0px',
        },
      );

      revealNodes.forEach((node) => {
        if (node.dataset.lpVisible === 'true') return;
        observer?.observe(node);
      });
    };

    const updateProgress = () => {
      frameId = 0;

      const viewportHeight = Math.max(window.innerHeight, 1);
      const desktopShowroom = desktopQuery.matches && !reducedMotionQuery.matches;

      if (heroSection) {
        const heroProgress = desktopShowroom
          ? getStickyProgress(heroSection, viewportHeight)
          : getMobileProgress(heroSection, viewportHeight);

        heroSection.style.setProperty('--lp-hero-progress', heroProgress.toFixed(4));
      }

      if (howSection) {
        if (!desktopShowroom) {
          howSection.style.removeProperty('--lp-how-progress');
          howSection.removeAttribute('data-active-step');
          return;
        }

        const howProgress = getStickyProgress(howSection, viewportHeight, viewportHeight * 0.12);
        const activeStep = howProgress < 0.34 ? '0' : howProgress < 0.67 ? '1' : '2';

        howSection.style.setProperty('--lp-how-progress', howProgress.toFixed(4));
        howSection.dataset.activeStep = activeStep;
      }
    };

    const requestUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateProgress);
    };

    const syncAll = () => {
      page.dataset.lpMotion = reducedMotionQuery.matches ? 'reduced' : 'active';
      setupObserver();
      requestUpdate();
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    window.addEventListener('orientationchange', requestUpdate);

    const unbindDesktopChange = bindMediaChange(desktopQuery, syncAll);
    const unbindReducedMotionChange = bindMediaChange(reducedMotionQuery, syncAll);

    syncAll();

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      window.removeEventListener('orientationchange', requestUpdate);
      unbindDesktopChange();
      unbindReducedMotionChange();
      disconnectObserver();
      if (frameId) window.cancelAnimationFrame(frameId);
      page.removeAttribute('data-lp-motion');
      resetShowroomState();
    };
  }, []);

  return null;
}
