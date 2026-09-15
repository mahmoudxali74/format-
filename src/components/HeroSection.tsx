import React, { useEffect, useRef, useState } from 'react';
import { AppLang, UI_STRINGS } from '../utils/i18n';
import { createParticleField, ParticleField } from '../utils/particles';
import '../styles/xtract-hero.css';

interface HeroSectionProps {
  lang?: AppLang;
  onScrollToBuilder?: () => void;
  onOpenLibrary?: () => void;
  children?: React.ReactNode;
}

// Reference: the badge switches from "Half" (tag only) to "Full" 1600 ms after mount.
const BADGE_EXPAND_DELAY_MS = 1600;

const reducedMotionQuery = () => window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Word spans for the staggered entrance. Once the animation has finished the
 * text is rendered plain again, so the DOM holds normal text for screen readers.
 */
const Words: React.FC<{
  text: string;
  settled: boolean;
  onLastWordDone?: () => void;
}> = ({ text, settled, onLastWordDone }) => {
  if (settled) return <>{text}</>;

  const parts = text.split(/(\s+)/);
  const wordCount = parts.filter((part) => part.trim()).length;
  let wordIndex = 0;

  return (
    <>
      {parts.map((part, i) => {
        if (!part.trim()) return part;
        const index = wordIndex++;
        return (
          <span
            key={i}
            className="xhero-word"
            style={{ '--xhero-word-index': index } as React.CSSProperties}
            onAnimationEnd={index === wordCount - 1 ? onLastWordDone : undefined}
          >
            {part}
          </span>
        );
      })}
    </>
  );
};

// Feather "arrow-up-right" and "arrow-right" (MIT)
const ArrowUpRightIcon = () => (
  <svg className="xhero-button__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="xhero-button__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export const HeroSection: React.FC<HeroSectionProps> = ({
  lang = 'en',
  onScrollToBuilder,
  onOpenLibrary,
  children,
}) => {
  const t = UI_STRINGS[lang];

  const sectionRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLParagraphElement>(null);
  const tagRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<ParticleField | null>(null);

  const [wordsSettled, setWordsSettled] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => reducedMotionQuery().matches);
  const [userChoice, setUserChoice] = useState<boolean | null>(null); // null → follow reduced motion
  const [inView, setInView] = useState(true);
  const isPlaying = userChoice ?? !prefersReducedMotion;

  // Follow changes to the reduced-motion setting.
  useEffect(() => {
    const query = reducedMotionQuery();
    const onChange = () => setPrefersReducedMotion(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  // Badge: show only the tag, then widen to reveal the label.
  useEffect(() => {
    const badge = badgeRef.current;
    const tag = tagRef.current;
    if (!badge || !tag || reducedMotionQuery().matches) return;

    let cancelled = false;
    const timers: number[] = [];

    // "Half" state: the tag plus the badge's 2px padding on both sides.
    // The label stays on one line while the width is animated.
    const collapse = () => {
      badge.classList.add('is-width-locked');
      badge.style.width = `${tag.getBoundingClientRect().width + 4}px`;
    };

    const finish = (event?: TransitionEvent) => {
      if (event && event.propertyName !== 'width') return;
      badge.removeEventListener('transitionend', finish);
      badge.classList.remove('is-expanding', 'is-width-locked');
      badge.style.width = ''; // back to auto so copy edits and zoom still fit
    };

    collapse();
    document.fonts?.ready.then(() => {
      if (!cancelled && badge.style.width && !badge.classList.contains('is-expanding')) collapse();
    });

    timers.push(
      window.setTimeout(() => {
        const from = badge.getBoundingClientRect().width;
        badge.style.width = '';
        const to = badge.getBoundingClientRect().width;
        badge.style.width = `${from}px`;
        void badge.offsetWidth; // commit the start width before transitioning

        badge.classList.add('is-expanding');
        badge.style.width = `${to}px`;
        badge.addEventListener('transitionend', finish);

        // Safety net for when no transition runs (equal widths, transitions disabled).
        const durationMs = parseFloat(getComputedStyle(badge).transitionDuration) * 1000 || 0;
        timers.push(window.setTimeout(() => finish(), durationMs + 50));
      }, BADGE_EXPAND_DELAY_MS)
    );

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
      finish();
    };
  }, []);

  // Particle field on the canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const field = createParticleField(canvas);
    if (!field) return;

    fieldRef.current = field;
    field.resize();

    let pending = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(field.resize);
    });
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(pending);
      field.pause();
      fieldRef.current = null;
    };
  }, []);

  // Pause the background while the hero is off-screen.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    if (isPlaying && inView) field.play();
    else field.pause();
  }, [isPlaying, inView]);

  const handlePrimaryClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onScrollToBuilder?.();
    document.getElementById('raw-prompt')?.focus({ preventScroll: true });
  };

  return (
    <>
      <section
        ref={sectionRef}
        className="xhero is-animating"
        aria-labelledby="hero-title"
        data-motion={isPlaying ? 'playing' : 'paused'}
        data-inview={String(inView)}
      >
        {/* Badge */}
        <p ref={badgeRef} className="xhero-badge">
          <span ref={tagRef} className="xhero-badge__tag">
            {t.appTitle}
            <span className="sr-only">:</span>
          </span>
          <span className="xhero-badge__label">{t.appSubtitle}</span>
        </p>

        <div className="xhero__content">
          <div className="xhero__heading">
            <h1 id="hero-title" className="xhero__title">
              <Words text={t.heroTitle} settled={wordsSettled} />
            </h1>
            <p className="xhero__lead">
              <Words text={t.heroLead} settled={wordsSettled} onLastWordDone={() => setWordsSettled(true)} />
            </p>
          </div>

          <div className="xhero__actions">
            {/* Primary: jump to the prompt builder */}
            <a className="xhero-button xhero-button--primary" href="#prompt-builder" onClick={handlePrimaryClick}>
              <span className="xhero-button__roll">
                <span className="xhero-button__face">
                  <span>{t.generate}</span>
                  <ArrowUpRightIcon />
                </span>
                <span className="xhero-button__face" aria-hidden="true">
                  <span>{t.generate}</span>
                  <ArrowRightIcon />
                </span>
              </span>
            </a>

            {/* Secondary: open the saved library */}
            <button type="button" className="xhero-button xhero-button--secondary" onClick={onOpenLibrary}>
              <span className="xhero-button__roll">
                <span className="xhero-button__face">
                  <span>{t.library}</span>
                </span>
                <span className="xhero-button__face" aria-hidden="true">
                  <span>{t.library}</span>
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* Decorative media: particle field + rotating orb */}
        <div className="xhero__media" aria-hidden="true">
          <div className="xhero-particles">
            <canvas ref={canvasRef} className="xhero-particles__canvas" />
            <div className="xhero-particles__void" />
          </div>
          <div className="xhero-orb">
            <div className="xhero-orb__disc xhero-orb__disc--outer" />
            <div className="xhero-orb__disc xhero-orb__disc--inner" />
          </div>
        </div>

        {/* Pause/resume control for the looping background (WCAG 2.2.2) */}
        <button
          type="button"
          className="xhero__motion-toggle"
          aria-pressed={!isPlaying}
          onClick={() => setUserChoice(!isPlaying)}
        >
          {isPlaying ? (
            <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false">
              <rect x="3" y="2" width="3" height="10" rx="1" fill="currentColor" />
              <rect x="8" y="2" width="3" height="10" rx="1" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false">
              <path d="M4 2.6v8.8a.6.6 0 0 0 .92.5l6.9-4.4a.6.6 0 0 0 0-1L4.92 2.1A.6.6 0 0 0 4 2.6Z" fill="currentColor" />
            </svg>
          )}
          <span className="sr-only">{t.pauseAnimation}</span>
        </button>
      </section>

      {/* Prompt builder below the hero */}
      {/* overflow-x-clip: the builder's glow layers must not widen the page on phones */}
      {children && (
        <div className="relative w-full overflow-x-clip">
          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">{children}</div>
        </div>
      )}
    </>
  );
};
