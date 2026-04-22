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
    let desktopHowStep = 0;
    let lastWheelAt = 0;

    const setDesktopHowStep = (step: number) => {
      if (!howSection) return;
      const nextStep = clamp(step, 0, 2);
      desktopHowStep = nextStep;
      howSection.dataset.activeStep = String(nextStep);
      howSection.style.setProperty('--lp-how-progress', (nextStep / 2).toFixed(4));
    };

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

    const isHowSectionPinnedZone = () => {
      if (!howSection) return false;
      const rect = howSection.getBoundingClientRect();
      const viewportHeight = Math.max(window.innerHeight, 1);
      return rect.top < viewportHeight * 0.24 && rect.bottom > viewportHeight * 0.68;
    };

    const onWindowWheel = (event: WheelEvent) => {
      if (!desktopQuery.matches || reducedMotionQuery.matches) return;
      if (!isHowSectionPinnedZone()) return;

      const delta = event.deltaY;
      if (Math.abs(delta) < 10) return;

      const now = performance.now();
      if (now - lastWheelAt < 380) {
        event.preventDefault();
        return;
      }

      const direction = delta > 0 ? 1 : -1;
      const nextStep = clamp(desktopHowStep + direction, 0, 2);
      if (nextStep === desktopHowStep) return;

      event.preventDefault();
      lastWheelAt = now;
      setDesktopHowStep(nextStep);
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

        if (!howSection.dataset.activeStep) {
          setDesktopHowStep(desktopHowStep);
        }
      }
    };

    const requestUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateProgress);
    };

    const syncAll = () => {
      page.dataset.lpMotion = reducedMotionQuery.matches ? 'reduced' : 'active';
      setupObserver();

      if (desktopQuery.matches && !reducedMotionQuery.matches) {
        setDesktopHowStep(desktopHowStep);
      }

      requestUpdate();
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    window.addEventListener('orientationchange', requestUpdate);
    window.addEventListener('wheel', onWindowWheel, { passive: false });

    const unbindDesktopChange = bindMediaChange(desktopQuery, syncAll);
    const unbindReducedMotionChange = bindMediaChange(reducedMotionQuery, syncAll);

    syncAll();

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      window.removeEventListener('orientationchange', requestUpdate);
      window.removeEventListener('wheel', onWindowWheel);
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
