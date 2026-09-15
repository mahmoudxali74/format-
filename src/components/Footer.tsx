import React from 'react';
import { AppLang } from '../utils/i18n';

interface FooterProps {
  lang: AppLang;
  onOpenLibrary: () => void;
  savedCount: number;
}

export const Footer: React.FC<FooterProps> = ({
  lang,
  onOpenLibrary,
  savedCount,
}) => {
  const isAr = lang === 'ar';

  return (
    <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand: New XTRACT Vector Logo & Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-zinc-950 dark:bg-white flex items-center justify-center p-1 shadow-xs">
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full text-white dark:text-black fill-none stroke-current"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 7L17 17" />
              <path d="M17 9V17H9" />
            </svg>
          </div>
          <span
            className="text-sm font-extrabold tracking-wider text-zinc-950 dark:text-white select-none"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            XTRACT
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {isAr
              ? '• استوديو هندسة وصياغة البرومبتات الذكية'
              : '• Precision AI Prompt Engineering Studio'}
          </span>
        </div>

        {/* Status & Quick Links */}
        <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
          <button
            type="button"
            onClick={onOpenLibrary}
            className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
          >
            {isAr ? `المكتبة (${savedCount})` : `Library (${savedCount})`}
          </button>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] text-zinc-500">Gemini Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
