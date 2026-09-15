import React, { useState, useEffect, useRef, useMemo } from 'react';
import { EMPTY_TEMPLATE_PREVIEW } from '../constants';
import { copyToClipboard } from '../utils/clipboard';
import { AppLang, UI_STRINGS } from '../utils/i18n';
import {
  Copy,
  Check,
  Download,
  FileText,
  Sparkles,
  Terminal,
  Bookmark,
  CheckCircle2,
  FastForward,
} from 'lucide-react';

interface OutputPanelProps {
  output: string;
  isLoading: boolean;
  modelUsed?: string;
  timestamp?: number;
  lang: AppLang;
  onSaveToLibrary?: () => void;
  isSaved?: boolean;
}

type ViewMode = 'formatted' | 'raw' | 'sections';

export const OutputPanel: React.FC<OutputPanelProps> = ({
  output,
  isLoading,
  modelUsed,
  timestamp,
  lang,
  onSaveToLibrary,
  isSaved = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('formatted');
  const [displayedText, setDisplayedText] = useState<string>(output || '');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const prevOutputRef = useRef<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const t = UI_STRINGS[lang];
  const isAr = lang === 'ar';
  const hasResult = Boolean(output && output.trim());

  // Handle typing effect when a newly generated prompt arrives
  useEffect(() => {
    if (!output || !output.trim()) {
      setDisplayedText('');
      setIsTyping(false);
      prevOutputRef.current = '';
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Only trigger typing effect if output is new
    if (output !== prevOutputRef.current) {
      prevOutputRef.current = output;

      if (timerRef.current) clearInterval(timerRef.current);

      setIsTyping(true);
      setDisplayedText('');
      let currentIndex = 0;

      // Adaptive typing speed:
      // Types smoothly character-by-character (or in small character clusters for longer text)
      // to complete nicely in 1.4 - 2.2 seconds without lagging
      const totalLength = output.length;
      const step = Math.max(1, Math.ceil(totalLength / 110));
      const intervalMs = 18;

      timerRef.current = setInterval(() => {
        currentIndex += step;
        if (currentIndex >= totalLength) {
          setDisplayedText(output);
          setIsTyping(false);
          if (timerRef.current) clearInterval(timerRef.current);
        } else {
          setDisplayedText(output.slice(0, currentIndex));
        }
      }, intervalMs);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [output]);

  // Autoscroll to follow typewriter cursor as text streams
  useEffect(() => {
    if (isTyping && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [displayedText, isTyping]);

  const handleSkipTyping = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setDisplayedText(output);
    setIsTyping(false);
  };

  const handleCopy = async () => {
    if (!hasResult) return;
    handleSkipTyping();
    const success = await copyToClipboard(output);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!hasResult) return;
    handleSkipTyping();
    const blob = new Blob([output], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `promptforge-${dateStr}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const wordCount = hasResult ? output.trim().split(/\s+/).length : 0;
  const charCount = hasResult ? output.length : 0;

  // Split into structural sections if in 'sections' view
  const currentActiveText = isTyping ? displayedText : output;
  const parsedSections = useMemo(() => {
    if (!currentActiveText || !currentActiveText.trim()) return [];
    const lines = currentActiveText.split('\n');
    const sections: Array<{ title: string; content: string[] }> = [];
    let currentTitle = 'OVERVIEW';
    let currentContent: string[] = [];

    for (const line of lines) {
      if (line.startsWith('# ')) {
        if (currentContent.length > 0 || currentTitle !== 'OVERVIEW') {
          sections.push({ title: currentTitle, content: currentContent });
        }
        currentTitle = line.replace('# ', '').trim();
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }
    if (currentContent.length > 0 || currentTitle !== 'OVERVIEW') {
      sections.push({ title: currentTitle, content: currentContent });
    }
    return sections;
  }, [currentActiveText]);

  return (
    <div className="flex flex-col h-full rounded-2xl bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/80 dark:border-white/10 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all">
      {/* Output Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-white/50 dark:bg-zinc-950/40 backdrop-blur-md border-b border-white/60 dark:border-zinc-800/60">
        <div className="flex items-center gap-2 text-xs">
          <Terminal className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-zinc-900 dark:text-zinc-200">
            {isAr ? 'البرومبت المهيكل النهائي' : 'Structured Prompt Console'}
          </span>

          {copied ? (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium inline-flex items-center gap-1 animate-in fade-in duration-150">
              <Check className="w-3 h-3" />
              {t.copied}
            </span>
          ) : isTyping ? (
            <div className="flex items-center gap-1">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono inline-flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3 h-3 text-purple-500 animate-spin" />
                <span>{isAr ? 'جاري الكتابة...' : 'Streaming...'}</span>
              </span>
              <button
                type="button"
                onClick={handleSkipTyping}
                className="text-[10px] px-1.5 py-0.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer inline-flex items-center gap-1"
                title={isAr ? 'إظهار فوراً' : 'Skip typing effect'}
              >
                <FastForward className="w-2.5 h-2.5" />
                <span>{isAr ? 'تخطي' : 'Skip'}</span>
              </button>
            </div>
          ) : hasResult ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 font-mono inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              {isAr ? 'جاهز للاستخدام' : 'Production Ready'}
            </span>
          ) : null}
        </div>

        {/* View Mode Switcher */}
        {hasResult && (
          <div className="flex items-center p-0.5 rounded-lg bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-300/40 dark:border-zinc-700/40 text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode('formatted')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'formatted'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {isAr ? 'منسق' : 'Preview'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('raw')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'raw'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {isAr ? 'كود نقي' : 'Raw'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('sections')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'sections'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {isAr ? 'الأقسام' : 'Blocks'}
            </button>
          </div>
        )}

        {/* Action Buttons: Copy, Save, Download */}
        <div className="flex items-center gap-1.5">
          {onSaveToLibrary && (
            <button
              type="button"
              onClick={() => {
                handleSkipTyping();
                onSaveToLibrary();
              }}
              disabled={!hasResult || isLoading}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                hasResult && !isLoading
                  ? isSaved
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20'
                    : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 cursor-pointer shadow-2xs'
                  : 'bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-400 dark:text-zinc-600 cursor-not-allowed border border-zinc-200/60 dark:border-zinc-800/40 opacity-60'
              }`}
              title={isAr ? 'حفظ في المكتبة' : 'Save to Library'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">
                {isSaved ? (isAr ? 'محفوظ' : 'Saved') : (isAr ? 'حفظ' : 'Save')}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            disabled={!hasResult || isLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              hasResult && !isLoading
                ? copied
                  ? 'bg-emerald-600 text-white font-semibold cursor-pointer'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-2xs font-semibold'
                : 'bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-400 dark:text-zinc-600 cursor-not-allowed border border-zinc-200/60 dark:border-zinc-800/40 opacity-60'
            }`}
            title={t.copy}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{t.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t.copy}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!hasResult || isLoading}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              hasResult && !isLoading
                ? 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 cursor-pointer shadow-2xs'
                : 'bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-400 dark:text-zinc-600 cursor-not-allowed border border-zinc-200/60 dark:border-zinc-800/40 opacity-60'
            }`}
            title={t.downloadMd}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.downloadMd}</span>
          </button>
        </div>
      </div>

      {/* Main Output Content Area */}
      <div
        ref={scrollContainerRef}
        className="relative flex-1 p-4 bg-zinc-50/40 dark:bg-zinc-950/70 overflow-auto min-h-[380px] text-xs sm:text-sm font-mono leading-relaxed select-text flex flex-col"
      >
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xs z-10 text-zinc-500 dark:text-zinc-400">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <Sparkles className="w-4 h-4 text-indigo-500 absolute inset-0 m-auto animate-pulse" />
            </div>
            <p className="text-xs font-sans text-zinc-700 dark:text-zinc-300 font-medium">
              {isAr ? 'جاري تطبيق هندسة البرومبت وهيكلة الأقسام...' : t.generating}
            </p>
          </div>
        ) : null}

        {hasResult ? (
          viewMode === 'sections' ? (
            /* Sections block breakdown view */
            <div dir="ltr" className="space-y-3">
              {parsedSections.map((sec, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 p-3.5"
                >
                  <div className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400 mb-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span># {sec.title}</span>
                  </div>
                  <div className="text-xs font-mono text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {sec.content.join('\n').trim()}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-1 text-xs text-indigo-500 font-mono">
                  <span className="inline-block w-2 h-3.5 bg-indigo-600 dark:bg-indigo-400 animate-pulse rounded-xs" />
                </div>
              )}
            </div>
          ) : (
            /* Standard formatted or raw view with character typewriter & terminal cursor */
            <div
              dir="ltr"
              className={`flex-1 text-left whitespace-pre-wrap break-words font-mono text-xs sm:text-sm leading-relaxed select-all selection:bg-indigo-500/20 dark:selection:bg-indigo-500/40 ${
                viewMode === 'raw'
                  ? 'text-zinc-700 dark:text-zinc-300 font-mono'
                  : 'text-zinc-900 dark:text-zinc-100 font-mono'
              }`}
            >
              {isTyping ? displayedText : output}
              {isTyping && (
                <span
                  className="inline-block w-2 h-4 ml-0.5 bg-indigo-600 dark:bg-indigo-400 animate-pulse align-middle rounded-xs"
                  aria-hidden="true"
                />
              )}
            </div>
          )
        ) : (
          /* Empty Template Guide */
          <div
            dir="ltr"
            className="flex-1 text-left whitespace-pre-wrap break-words text-zinc-400 dark:text-zinc-600 font-mono text-xs sm:text-sm leading-relaxed select-none opacity-60"
          >
            {EMPTY_TEMPLATE_PREVIEW}
          </div>
        )}
      </div>

      {/* Output Footer / Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-white/50 dark:bg-zinc-950/40 backdrop-blur-md border-t border-white/60 dark:border-zinc-800/60 text-[11px] font-mono text-zinc-500">
        <div className="flex items-center gap-2 flex-wrap">
          {hasResult ? (
            <>
              <span>{charCount} {t.charCount}</span>
              <span>•</span>
              <span>{wordCount} {t.wordCount}</span>
              {modelUsed && (
                <>
                  <span>•</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{modelUsed}</span>
                </>
              )}
            </>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-500 font-sans">
              {t.emptyTemplateNotice}
            </span>
          )}
        </div>

        {hasResult && timestamp && (
          <div className="flex items-center gap-1.5 text-zinc-500 font-sans">
            <FileText className="w-3 h-3" />
            <span>{new Date(timestamp).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
