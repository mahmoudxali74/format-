import React, { useRef, useEffect } from 'react';
import { DomainType, DepthType, GeminiModelInfo } from '../types';
import { DomainSelector } from './DomainSelector';
import { ControlsBar } from './ControlsBar';
import { AppLang, UI_STRINGS } from '../utils/i18n';
import { Sparkles, Trash2, ArrowUpLeft, ArrowUpRight, Loader2, Wand2, Undo2 } from 'lucide-react';

interface InputPanelProps {
  rawText: string;
  onChangeText: (text: string) => void;
  exclusions: string;
  onChangeExclusions: (exclusions: string) => void;
  selectedDomain: DomainType;
  onSelectDomain: (domain: DomainType) => void;
  depth: DepthType;
  onChangeDepth: (depth: DepthType) => void;
  selectedModel: string;
  onChangeModel: (model: string) => void;
  models: GeminiModelInfo[];
  isLoadingModels: boolean;
  onRefreshModels: () => void;
  onSubmit: () => void;
  onClear: () => void;
  onEnhancePrompt: () => void;
  isEnhancing: boolean;
  canUndoEnhance?: boolean;
  onUndoEnhance?: () => void;
  isLoading: boolean;
  lang: AppLang;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  rawText,
  onChangeText,
  exclusions,
  onChangeExclusions,
  selectedDomain,
  onSelectDomain,
  depth,
  onChangeDepth,
  selectedModel,
  onChangeModel,
  models,
  isLoadingModels,
  onRefreshModels,
  onSubmit,
  onClear,
  onEnhancePrompt,
  isEnhancing,
  canUndoEnhance,
  onUndoEnhance,
  isLoading,
  lang,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = UI_STRINGS[lang];

  // Auto resize main textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(170, textareaRef.current.scrollHeight)}px`;
    }
  }, [rawText]);

  // Handle Ctrl+Enter / Cmd+Enter shortcut
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && !isEnhancing && rawText.trim()) {
        onSubmit();
      }
    }
  };

  const charCount = rawText.length;
  const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* 1. Domain Selector */}
      <DomainSelector
        selectedDomain={selectedDomain}
        onSelectDomain={onSelectDomain}
        disabled={isLoading || isEnhancing}
        lang={lang}
      />

      {/* 2. Controls Bar (Depth & Model) */}
      <ControlsBar
        depth={depth}
        onChangeDepth={onChangeDepth}
        selectedModel={selectedModel}
        onChangeModel={onChangeModel}
        models={models}
        isLoadingModels={isLoadingModels}
        onRefreshModels={onRefreshModels}
        disabled={isLoading || isEnhancing}
        lang={lang}
      />

      {/* 3. Textarea Container - With "تحسين البرومبت" Button beside text box */}
      <div className="relative flex-1 flex flex-col rounded-2xl bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/80 dark:border-white/10 focus-within:border-indigo-500/70 focus-within:ring-1 focus-within:ring-indigo-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all">
        {/* Header toolbar directly attached above/beside text area */}
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-white/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-950/40 backdrop-blur-md rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {lang === 'ar' ? 'فكرة أو متطلبات البرومبت' : 'Raw Prompt / Idea'}
            </span>
            {canUndoEnhance && onUndoEnhance && (
              <button
                type="button"
                onClick={onUndoEnhance}
                disabled={isLoading || isEnhancing}
                className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline cursor-pointer"
                title={t.undoEnhance}
              >
                <Undo2 className="w-3 h-3" />
                <span>{t.undoEnhance}</span>
              </button>
            )}
          </div>

          {/* Prompt Enhancement Button ("تحسين البرومبت") */}
          <button
            type="button"
            onClick={onEnhancePrompt}
            disabled={isLoading || isEnhancing || !rawText.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title={t.enhancePromptTooltip}
          >
            {isEnhancing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t.enhancingPrompt}</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                <span>{t.enhancePrompt}</span>
              </>
            )}
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={rawText}
          onChange={(e) => onChangeText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || isEnhancing}
          placeholder={t.inputPlaceholder}
          className="w-full flex-1 p-4 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 resize-none focus:outline-none min-h-[175px] leading-relaxed"
          dir="auto"
        />

        {/* Input Footer: Counts, Clear & Submit */}
        <div className="flex items-center justify-between gap-2 p-2.5 border-t border-white/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-950/40 backdrop-blur-md rounded-b-2xl text-xs">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
            <span>{charCount} {t.charCount}</span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span>{wordCount} {t.wordCount}</span>
          </div>

          <div className="flex items-center gap-2">
            {(rawText.length > 0 || exclusions.length > 0) && (
              <button
                type="button"
                onClick={onClear}
                disabled={isLoading || isEnhancing}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
                title={t.clear}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.clear}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onSubmit}
              disabled={isLoading || isEnhancing || !rawText.trim()}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Shortcut: Ctrl + Enter"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.generating}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.generate}</span>
                  {lang === 'ar' ? (
                    <ArrowUpLeft className="w-3.5 h-3.5 opacity-60" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
