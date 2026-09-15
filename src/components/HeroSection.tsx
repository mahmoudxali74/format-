import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppLang } from '../utils/i18n';

interface HeroSectionProps {
  lang?: AppLang;
  onScrollToBuilder?: () => void;
  onOpenContact?: () => void;
  children?: React.ReactNode;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  baseAlpha: number;
  phase: number;
}

const LOOPING_WORDS_EN = [
  'AI Agents & LLMs.',
  'Production Workflows.',
  'Complex Reasoning.',
  'Autonomous Systems.',
  'Next-Gen Products.',
  'Visionary Builders.',
];

const LOOPING_WORDS_AR = [
  'نماذج الذكاء الاصطناعي.',
  'الوكلاء المستقلين.',
  'تدفقات العمل المعقدة.',
  'الأنظمة والمنتجات الذكية.',
  'رواد وصنّاع المستقبل.',
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  lang = 'en',
  children,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [wordIndex, setWordIndex] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  const isAr = lang === 'ar';
  const words = isAr ? LOOPING_WORDS_AR : LOOPING_WORDS_EN;

  // Cycle looping word every 2.4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [words.length]);

  // High-performance Particle Canvas Animation Loop (Adaptive for Light & Dark mode)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    const initParticles = () => {
      const count = Math.min(100, Math.max(50, Math.floor((width * height) / 12000)));
      const particles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          radius: Math.random() * 1.5 + 0.6,
          alpha: Math.random() * 0.45 + 0.25,
          baseAlpha: Math.random() * 0.45 + 0.25,
          phase: Math.random() * Math.PI * 2,
        });
      }
      particlesRef.current = particles;
    };

    const resize = () => {
      if (!canvas || !container) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
      initParticles();
    };

    resize();

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(container);

    let time = 0;
    const render = () => {
      if (!isPlaying) return;

      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains('dark');
      const particles = particlesRef.current;
      const len = particles.length;

      // Draw particle connections (subtle proximity web)
      for (let i = 0; i < len; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Wrap edges smoothly
        if (p1.x < -10) p1.x = width + 10;
        else if (p1.x > width + 10) p1.x = -10;
        if (p1.y < -10) p1.y = height + 10;
        else if (p1.y > height + 10) p1.y = -10;

        // Alpha breathing
        p1.alpha = p1.baseAlpha + Math.sin(time + p1.phase) * 0.16;

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(192, 160, 255, ${Math.max(0.1, Math.min(1, p1.alpha))})`
          : `rgba(124, 58, 237, ${Math.max(0.12, Math.min(0.7, p1.alpha * 0.85))})`;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.35)';
        ctx.shadowBlur = p1.radius > 1.2 ? 5 : 0;
        ctx.fill();

        // Connect adjacent particles
        for (let j = i + 1; j < len; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 85) {
            const lineAlpha = (1 - dist / 85) * (isDark ? 0.14 : 0.12) * p1.alpha;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = isDark
              ? `rgba(168, 85, 247, ${lineAlpha})`
              : `rgba(147, 51, 234, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.shadowBlur = 0;
            ctx.stroke();
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    if (isPlaying) {
      animationFrameId.current = requestAnimationFrame(render);
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      resizeObserver.disconnect();
    };
  }, [isPlaying]);

  return (
    <section
      ref={containerRef}
      className="hero is-animating relative w-full overflow-hidden flex flex-col justify-center items-center text-center px-4 sm:px-6 pt-10 sm:pt-14 pb-16 sm:pb-24 bg-[#FAFAFC] dark:bg-[#070709] text-zinc-950 dark:text-white transition-colors duration-200"
      aria-labelledby="hero-title"
      data-hero=""
      data-motion={isPlaying ? 'playing' : 'paused'}
      data-inview="true"
    >
      {/* Light subtle grid background pattern */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40 dark:opacity-15 overflow-hidden">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="hero-light-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-zinc-200/90 dark:text-zinc-800/40"
              />
              <circle cx="0" cy="0" r="1" className="fill-purple-400/25 dark:fill-purple-400/20" />
            </pattern>
            <radialGradient id="hero-grid-vignette" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="0.9" />
              <stop offset="65%" stopColor="white" stopOpacity="0.25" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="hero-grid-mask">
              <rect width="100%" height="100%" fill="url(#hero-grid-vignette)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-light-grid-pattern)" mask="url(#hero-grid-mask)" />
        </svg>
      </div>

      {/* Dynamic Background Media: Interactive Particle Canvas & Glowing Concentric Orbs */}
      <div className="hero__media absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="hero-particles absolute inset-0" data-hero-reveal="">
          <canvas
            ref={canvasRef}
            className="hero-particles__canvas w-full h-full"
            data-hero-particles=""
          />
        </div>

        {/* Concentric Rotating Gradient Orbs */}
        <div className="hero-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] sm:w-[780px] h-[340px] sm:h-[420px] flex items-center justify-center">
          <div
            className="hero-orb__disc hero-orb__disc--outer absolute w-full h-full rounded-full filter blur-[85px] sm:blur-[115px]"
            style={{
              background:
                'radial-gradient(circle, rgba(168, 85, 247, 0.16) 0%, rgba(139, 92, 246, 0.08) 45%, transparent 70%)',
            }}
          />
          <div
            className="hero-orb__disc hero-orb__disc--inner absolute w-[300px] sm:w-[420px] h-[300px] sm:h-[420px] rounded-full filter blur-[60px] sm:blur-[85px]"
            style={{
              background:
                'radial-gradient(circle, rgba(147, 51, 234, 0.22) 0%, rgba(168, 85, 247, 0.10) 50%, transparent 70%)',
            }}
          />
        </div>
      </div>

      {/* Main Content Area: Single Clean Title with Fixed Phrase and Looping Word */}
      <div className="hero__content relative z-10 max-w-4xl mx-auto flex flex-col items-center justify-center">
        <h1
          id="hero-title"
          className="hero__title text-2xl sm:text-4xl md:text-5xl lg:text-[52px] font-semibold tracking-tight text-zinc-950 dark:text-white leading-[1.2] text-center flex items-center justify-center flex-wrap gap-x-2.5 gap-y-1.5"
          style={{ fontFamily: "'Figtree', 'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          <span>{isAr ? 'هندسة برومبتات فائقة الدقة لـ' : 'Craft Precision Prompts for'}</span>
          <span className="inline-block relative min-h-[1.25em] align-top">
            <AnimatePresence mode="wait">
              <motion.span
                key={words[wordIndex % words.length]}
                initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12, filter: 'blur(3px)' }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#6D28D9] dark:from-[#C084FC] dark:via-[#A855F7] dark:to-[#9333EA] bg-clip-text text-transparent font-bold drop-shadow-xs"
              >
                {words[wordIndex % words.length]}
              </motion.span>
            </AnimatePresence>
          </span>
        </h1>
      </div>

      {/* Embedded Children (Prompt Workspace Inside Hero Canvas) */}
      {children && (
        <div className="relative z-10 w-full max-w-7xl mx-auto mt-7 sm:mt-10">
          {children}
        </div>
      )}

      {/* Pause/Resume Motion Toggle (WCAG 2.2.2 Compliance) */}
      <button
        className="hero__motion-toggle absolute bottom-2 right-3 sm:bottom-3 sm:right-4 z-20 w-7 h-7 rounded-full bg-zinc-200/60 hover:bg-zinc-300/80 dark:bg-white/10 dark:hover:bg-white/20 border border-zinc-300/70 dark:border-white/15 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        type="button"
        aria-pressed={!isPlaying}
        onClick={() => setIsPlaying((prev) => !prev)}
        title={isPlaying ? 'Pause background animation' : 'Play background animation'}
        data-hero-motion-toggle=""
      >
        {isPlaying ? (
          <svg
            className="w-3 h-3"
            viewBox="0 0 14 14"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <rect x="3" y="2" width="3" height="10" rx="1" />
            <rect x="8" y="2" width="3" height="10" rx="1" />
          </svg>
        ) : (
          <svg
            className="w-3 h-3"
            viewBox="0 0 14 14"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M4 2.6v8.8a.6.6 0 0 0 .92.5l6.9-4.4a.6.6 0 0 0 0-1L4.92 2.1A.6.6 0 0 0 4 2.6Z" />
          </svg>
        )}
        <span className="sr-only">
          {isPlaying ? 'Pause background animation' : 'Play background animation'}
        </span>
      </button>
    </section>
  );
};
