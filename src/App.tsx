import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DomainType,
  DepthType,
  GeminiModelInfo,
  SavedPromptItem,
  GenerationErrorDetails,
} from './types';
import { safeStorage } from './utils/storage';
import { EXACT_SYSTEM_INSTRUCTION } from './constants';
import {
  fetchGeminiModels,
  generateStructuredPrompt,
  refinePromptText,
} from './services/gemini';
import { Theme, AppLang } from './utils/i18n';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { Footer } from './components/Footer';
import { LibraryDrawer } from './components/LibraryDrawer';
import { ErrorBanner } from './components/ErrorBanner';
import { Clock } from 'lucide-react';

const STORAGE_KEYS = {
  API_KEY: 'gemini_user_api_key',
  MODELS: 'gemini_available_models',
  SELECTED_MODEL: 'gemini_active_model',
  SYSTEM_INSTRUCTION: 'gemini_system_instruction',
  SAVED_PROMPTS: 'gemini_structured_prompts_library',
  THEME: 'theme_preference',
  LANG: 'app_language_preference',
};

export default function App() {
  const builderRef = useRef<HTMLDivElement>(null);

  // Theme state: dark or light (default to light mood as requested)
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.THEME) as Theme;
    return saved === 'light' || saved === 'dark' ? saved : 'light';
  });

  // App UI language: Arabic ('ar') or English ('en')
  const [lang, setLang] = useState<AppLang>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.LANG) as AppLang;
    return saved === 'ar' || saved === 'en' ? saved : 'ar';
  });

  // Apply theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    safeStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // Apply dir & lang to document root
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', lang);
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    safeStorage.setItem(STORAGE_KEYS.LANG, lang);
  }, [lang]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleLang = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const scrollToBuilder = () => {
    builderRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // State for API Key (empty string delegates to backend process.env.GEMINI_API_KEY)
  const [apiKey] = useState<string>(() => {
    return safeStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  });

  // Editable System Instruction
  const [systemInstruction] = useState<string>(() => {
    return safeStorage.getItem(STORAGE_KEYS.SYSTEM_INSTRUCTION) || EXACT_SYSTEM_INSTRUCTION;
  });

  // Models fetched dynamically via the backend
  const [models, setModels] = useState<GeminiModelInfo[]>(() => {
    return safeStorage.getJSON<GeminiModelInfo[]>(STORAGE_KEYS.MODELS, []);
  });

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.SELECTED_MODEL);
    if (!saved || saved.includes('2.5-flash')) {
      return 'gemini-3.6-flash';
    }
    return saved;
  });

  // Prompt configuration state
  const [domain, setDomain] = useState<DomainType>('general');
  const [depth, setDepth] = useState<DepthType>('medium');
  const [rawText, setRawText] = useState<string>('');
  const [previousRawText, setPreviousRawText] = useState<string | null>(null);
  const [exclusions, setExclusions] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [currentResultTimestamp, setCurrentResultTimestamp] = useState<number | undefined>(undefined);

  // Status & Error state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [modelsError, setModelsError] = useState<GenerationErrorDetails | string | null>(null);
  const [generationError, setGenerationError] = useState<GenerationErrorDetails | null>(null);
  const [retryNotice, setRetryNotice] = useState<string | null>(null);

  // Modals & Drawers state
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);

  // Saved library state
  const [savedItems, setSavedItems] = useState<SavedPromptItem[]>(() => {
    return safeStorage.getJSON<SavedPromptItem[]>(STORAGE_KEYS.SAVED_PROMPTS, []);
  });

  // Fetch available models
  const handleFetchModels = useCallback(async (keyToUse: string) => {
    setIsLoadingModels(true);
    setModelsError(null);
    try {
      const fetchedModels = await fetchGeminiModels(keyToUse);
      setModels(fetchedModels);
      safeStorage.setJSON(STORAGE_KEYS.MODELS, fetchedModels);

      // Verify active selection
      const exists = fetchedModels.some((m) => m.id === selectedModel);
      if (!exists && fetchedModels.length > 0) {
        const preferred =
          fetchedModels.find((m) => m.id === 'gemini-3.6-flash') ||
          fetchedModels.find((m) => m.id.includes('flash')) ||
          fetchedModels[0];
        setSelectedModel(preferred.id);
        safeStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, preferred.id);
      }
    } catch (err: any) {
      if (err?.details) {
        setModelsError(err.details);
      } else {
        setModelsError(err?.message || 'Failed to fetch models');
      }
    } finally {
      setIsLoadingModels(false);
    }
  }, [selectedModel]);

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    safeStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, modelId);
  };

  // Initial load: Fetch models
  useEffect(() => {
    handleFetchModels(apiKey);
  }, []);

  // Enhance prompt text phrasing using Gemini before final structuring
  const handleEnhancePrompt = async () => {
    if (!rawText.trim() || isEnhancing) return;

    setIsEnhancing(true);
    setGenerationError(null);

    let targetModel = selectedModel.trim();
    if (!targetModel && models.length > 0) {
      targetModel = models[0].id;
    }
    if (!targetModel) {
      targetModel = 'gemini-3.6-flash';
    }

    try {
      const refined = await refinePromptText({
        rawText,
        domain,
        model: targetModel,
        apiKey,
      });

      setPreviousRawText(rawText);
      setRawText(refined);
    } catch (err: any) {
      if (err?.details) {
        setGenerationError(err.details);
      } else {
        setGenerationError({
          statusCode: 500,
          rawMessage:
            err?.message ||
            (lang === 'ar' ? 'فشل تحسين صياغة البرومبت.' : 'Failed to refine prompt.'),
        });
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleUndoEnhance = () => {
    if (previousRawText !== null) {
      setRawText(previousRawText);
      setPreviousRawText(null);
    }
  };

  // Main Submit Handler
  const handleGenerate = async () => {
    if (!rawText.trim()) {
      setGenerationError({
        statusCode: 400,
        rawMessage:
          lang === 'ar'
            ? 'يرجى كتابة فكرة أو متطلبات البرومبت أولاً قبل التوليد.'
            : 'Please enter your prompt idea or requirements first.',
      });
      return;
    }

    let targetModel = selectedModel.trim();
    if (!targetModel && models.length > 0) {
      targetModel = models[0].id;
      handleSelectModel(targetModel);
    }
    if (!targetModel) {
      targetModel = 'gemini-3.6-flash';
      handleSelectModel(targetModel);
    }

    setIsLoading(true);
    setGenerationError(null);
    setRetryNotice(null);

    try {
      const generatedPrompt = await generateStructuredPrompt({
        apiKey,
        model: targetModel,
        rawText,
        exclusions,
        domain,
        depth,
        baseSystemInstruction: systemInstruction,
        onRetry: (attempt, delaySeconds, isPerMinute) => {
          setRetryNotice(
            lang === 'ar'
              ? `تم الوصول إلى حد الطلبات ${
                  isPerMinute ? 'للدقيقة (Per-Minute)' : 'اليومي (Daily Quota)'
                }. جاري إعادة المحاولة تلقائياً بعد ${delaySeconds} ثوانٍ (محاولة ${attempt} من 3)...`
              : `Rate limit hit (${
                  isPerMinute ? 'per-minute' : 'daily quota'
                }). Retrying with backoff in ${delaySeconds}s (attempt ${attempt} of 3)...`
          );
        },
      });

      const now = Date.now();
      setOutput(generatedPrompt);
      setCurrentResultTimestamp(now);
      setRetryNotice(null);

      // Auto save to local library
      const newItem: SavedPromptItem = {
        id: `prompt_${now}_${Math.random().toString(36).slice(2, 7)}`,
        rawInput: rawText.trim(),
        exclusions: exclusions.trim() || undefined,
        domain,
        depth,
        model: targetModel,
        output: generatedPrompt,
        timestamp: now,
      };

      const updatedLibrary = [newItem, ...savedItems.filter(i => i.output !== generatedPrompt)].slice(0, 100);
      setSavedItems(updatedLibrary);
      safeStorage.setJSON(STORAGE_KEYS.SAVED_PROMPTS, updatedLibrary);
    } catch (err: any) {
      if (err?.details) {
        setGenerationError(err.details);
      } else {
        setGenerationError({
          statusCode: 0,
          rawMessage:
            err?.message ||
            (lang === 'ar'
              ? 'حدث خطأ أثناء الاتصال بالخادم.'
              : 'An error occurred while connecting to the API.'),
        });
      }
    } finally {
      setIsLoading(false);
      setRetryNotice(null);
    }
  };

  // Manual save to library
  const handleManualSaveToLibrary = () => {
    if (!output.trim()) return;
    const now = Date.now();
    const newItem: SavedPromptItem = {
      id: `prompt_${now}_${Math.random().toString(36).slice(2, 7)}`,
      rawInput: rawText.trim() || 'Prompt Snippet',
      exclusions: exclusions.trim() || undefined,
      domain,
      depth,
      model: selectedModel,
      output: output.trim(),
      timestamp: now,
    };
    const updatedLibrary = [newItem, ...savedItems.filter(i => i.output !== output.trim())].slice(0, 100);
    setSavedItems(updatedLibrary);
    safeStorage.setJSON(STORAGE_KEYS.SAVED_PROMPTS, updatedLibrary);
  };

  // Check if current output is saved in library
  const isCurrentOutputSaved = Boolean(
    output.trim() && savedItems.some(i => i.output.trim() === output.trim())
  );

  // Clear Input
  const handleClear = () => {
    setRawText('');
    setExclusions('');
    setGenerationError(null);
  };

  // Local Library Actions
  const handleReopenSavedItem = (item: SavedPromptItem) => {
    setRawText(item.rawInput);
    if (item.exclusions) {
      setExclusions(item.exclusions);
    } else {
      setExclusions('');
    }
    setDomain(item.domain);
    setDepth(item.depth);
    setOutput(item.output);
    setCurrentResultTimestamp(item.timestamp);
    if (item.model) {
      handleSelectModel(item.model);
    }
    setGenerationError(null);
    setIsLibraryOpen(false);
    scrollToBuilder();
  };

  const handleDeleteSavedItem = (id: string) => {
    const updated = savedItems.filter((item) => item.id !== id);
    setSavedItems(updated);
    safeStorage.setJSON(STORAGE_KEYS.SAVED_PROMPTS, updated);
  };

  const handleClearAllSaved = () => {
    setSavedItems([]);
    safeStorage.removeItem(STORAGE_KEYS.SAVED_PROMPTS);
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-[#FAFAFC] dark:bg-[#070709] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Top Header - PromptForge brand header with navigation & logo */}
      <Header
        activeModel={selectedModel || 'gemini-3.6-flash'}
        savedCount={savedItems.length}
        theme={theme}
        onToggleTheme={toggleTheme}
        lang={lang}
        onToggleLang={toggleLang}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onScrollToBuilder={scrollToBuilder}
      />

      {/* Hero Section with Embedded Glassmorphic Prompt Builder */}
      <HeroSection
        lang={lang}
        onScrollToBuilder={scrollToBuilder}
      >
        <main
          ref={builderRef}
          id="prompt-builder"
          className="w-full text-left flex flex-col gap-6 relative z-20"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Ambient Glow Emitters for Glassmorphism Refraction */}
          <div className="absolute -top-12 -left-10 w-80 h-80 rounded-full bg-gradient-to-br from-purple-500/25 to-indigo-500/20 blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-1/2 -right-12 w-96 h-96 rounded-full bg-gradient-to-tl from-indigo-500/20 via-purple-500/20 to-pink-500/15 blur-3xl pointer-events-none -z-10" />

          {/* Retry countdown notice */}
          {retryNotice && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 backdrop-blur-md border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 animate-pulse">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{retryNotice}</span>
            </div>
          )}

          {/* Error Banner */}
          <ErrorBanner
            error={generationError}
            onDismiss={() => setGenerationError(null)}
            onRetry={handleGenerate}
          />

          {/* Translucent Glassmorphic Frame for the Prompt Workspace */}
          <div className="relative rounded-3xl p-4 sm:p-7 backdrop-blur-2xl bg-white/45 dark:bg-zinc-950/45 border border-white/60 dark:border-white/10 shadow-[0_28px_60px_-15px_rgba(124,58,237,0.18),0_10px_30px_-5px_rgba(0,0,0,0.06)] ring-1 ring-white/70 dark:ring-white/10 transition-all overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/90 dark:before:via-white/20 before:to-transparent">
            {/* Two-Column Cockpit Layout: Left: Input & Controls, Right: Output Console */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 items-stretch text-left" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              {/* Left Column: Input with Enhance Prompt button */}
              <div className="flex flex-col">
                <InputPanel
                  rawText={rawText}
                  onChangeText={setRawText}
                  exclusions={exclusions}
                  onChangeExclusions={setExclusions}
                  selectedDomain={domain}
                  onSelectDomain={setDomain}
                  depth={depth}
                  onChangeDepth={setDepth}
                  selectedModel={selectedModel}
                  onChangeModel={handleSelectModel}
                  models={models}
                  isLoadingModels={isLoadingModels}
                  onRefreshModels={() => handleFetchModels(apiKey)}
                  onSubmit={handleGenerate}
                  onClear={handleClear}
                  onEnhancePrompt={handleEnhancePrompt}
                  isEnhancing={isEnhancing}
                  canUndoEnhance={Boolean(previousRawText)}
                  onUndoEnhance={handleUndoEnhance}
                  isLoading={isLoading}
                  lang={lang}
                />
              </div>

              {/* Right Column: Output Console with Formatted / Raw / Blocks view modes */}
              <div className="flex flex-col">
                <OutputPanel
                  output={output}
                  isLoading={isLoading}
                  modelUsed={selectedModel}
                  timestamp={currentResultTimestamp}
                  lang={lang}
                  onSaveToLibrary={handleManualSaveToLibrary}
                  isSaved={isCurrentOutputSaved}
                />
              </div>
            </div>
          </div>
        </main>
      </HeroSection>

      {/* Bottom Footer */}
      <Footer
        lang={lang}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        savedCount={savedItems.length}
      />

      {/* Local Library Drawer */}
      <LibraryDrawer
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        savedItems={savedItems}
        onReopenItem={handleReopenSavedItem}
        onDeleteItem={handleDeleteSavedItem}
        onClearAll={handleClearAllSaved}
        lang={lang}
      />
    </div>
  );
}
