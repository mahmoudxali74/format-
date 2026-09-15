import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showBadge = true,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8 sm:w-9 sm:h-9',
    lg: 'w-11 h-11',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon: Futuristic Isometric Neural Forge / Prism with energy core */}
      <div
        className={`relative ${iconSizes[size]} flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/25 group transition-transform duration-200 hover:scale-105`}
      >
        <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center relative overflow-hidden">
          {/* Subtle radiant background glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/30 via-purple-600/20 to-cyan-400/30 opacity-90" />

          {/* Precision Architectural Vector Mark */}
          <svg
            className="w-5 h-5 text-white relative z-10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Hexagonal Isometric Prism Frame */}
            <path
              d="M12 2L20.5 7V17L12 22L3.5 17V7L12 2Z"
              stroke="url(#forgeGrad)"
              strokeWidth="1.8"
              fill="url(#forgeFill)"
              fillOpacity="0.2"
            />
            {/* Inner Precision Prompt Chevrons */}
            <path
              d="M9 9.5L12.5 12L9 14.5"
              stroke="#FFFFFF"
              strokeWidth="2.2"
            />
            {/* Forge Energy Core Line */}
            <path
              d="M14 14.5H16"
              stroke="#22D3EE"
              strokeWidth="2.2"
            />
            <defs>
              <linearGradient
                id="forgeGrad"
                x1="3.5"
                y1="2"
                x2="20.5"
                y2="22"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#818CF8" />
                <stop offset="0.5" stopColor="#A855F7" />
                <stop offset="1" stopColor="#22D3EE" />
              </linearGradient>
              <linearGradient
                id="forgeFill"
                x1="3.5"
                y1="2"
                x2="20.5"
                y2="22"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#6366F1" />
                <stop offset="1" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Brand Wordmark: PromptForge */}
      <div className="flex items-center gap-1.5 font-sans tracking-tight">
        <span className={`font-extrabold tracking-tight text-zinc-900 dark:text-white ${textSizes[size]}`}>
          Prompt<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400">Forge</span>
        </span>
        {showBadge && (
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            AI
          </span>
        )}
      </div>
    </div>
  );
};
