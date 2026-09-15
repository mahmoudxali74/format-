import React from 'react';
import { History, Sun, Moon, Languages, Settings } from 'lucide-react';
import { Theme, AppLang, UI_STRINGS } from '../utils/i18n';

interface HeaderProps {
  activeModel?: string;
  savedCount?: number;
  theme: Theme;
  onToggleTheme: () => void;
  lang: AppLang;
  onToggleLang: () => void;
  onOpenLibrary: () => void;
  onOpenSettings: () => void;
  onScrollToBuilder?: () => void;
  onBookCall?: () => void;
}

const iconButtonClassName =
  'relative p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md hover:bg-white/90 dark:hover:bg-zinc-800/80 border border-white/80 dark:border-white/10 shadow-2xs transition-all duration-150 cursor-pointer';

export const Header: React.FC<HeaderProps> = ({
  savedCount = 0,
  theme,
  onToggleTheme,
  lang,
  onToggleLang,
  onOpenLibrary,
  onOpenSettings,
  onScrollToBuilder,
}) => {
  const t = UI_STRINGS[lang];
  const isAr = lang === 'ar';

  return (
    <header className="sticky top-0 z-40 bg-[#FAFAFC]/85 dark:bg-[#070709]/85 backdrop-blur-md text-zinc-900 dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Logo & Name of Website */}
        <button
          type="button"
          onClick={onScrollToBuilder}
          className="flex items-center gap-2.5 group cursor-pointer focus:outline-hidden"
          title="XTRACT"
        >
          {/* Logo Vector Icon */}
          <div className="w-7 h-7 rounded-md bg-zinc-950 dark:bg-white flex items-center justify-center p-1 transition-transform duration-200 group-hover:scale-105 shadow-xs">
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full text-white dark:text-black fill-none stroke-current"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Arrow pointing down-right with head */}
              <path d="M7 7L17 17" />
              <path d="M17 9V17H9" />
            </svg>
          </div>

          {/* Name of website */}
          <span
            className="text-xl sm:text-2xl font-extrabold tracking-wider text-zinc-950 dark:text-white select-none"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            XTRACT
          </span>
        </button>

        {/* Right Controls: Settings, History, Language, Appearance */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Settings Icon: view and edit the system instruction */}
          <button
            type="button"
            onClick={onOpenSettings}
            className={iconButtonClassName}
            title={t.settings}
            aria-label={t.settings}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* History Icon */}
          <button
            type="button"
            onClick={onOpenLibrary}
            className={iconButtonClassName}
            title={t.library || 'History'}
            aria-label={t.library || 'History'}
          >
            <History className="w-4 h-4" />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-mono font-bold bg-[#7C3AED] text-white flex items-center justify-center shadow-xs">
                {savedCount}
              </span>
            )}
          </button>

          {/* Language Icon */}
          <button
            type="button"
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md hover:bg-white/90 dark:hover:bg-zinc-800/80 border border-white/80 dark:border-white/10 shadow-2xs transition-all duration-150 cursor-pointer text-xs font-bold font-mono"
            title={isAr ? 'Switch to English' : 'التحويل للعربية'}
            aria-label="Language"
          >
            <Languages className="w-4 h-4" />
            <span className="uppercase">{isAr ? 'AR' : 'EN'}</span>
          </button>

          {/* Appearance Icon */}
          <button
            type="button"
            onClick={onToggleTheme}
            className={iconButtonClassName}
            title={theme === 'dark' ? t.themeLight || 'Light Mode' : t.themeDark || 'Dark Mode'}
            aria-label="Appearance"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
