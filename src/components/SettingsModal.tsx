import React, { useState } from 'react';
import { GeminiModelInfo, GenerationErrorDetails } from '../types';
import { EXACT_SYSTEM_INSTRUCTION } from '../constants';
import { AppLang, UI_STRINGS } from '../utils/i18n';
import {
  X,
  Cpu,
  RefreshCw,
  Key,
  Code,
  RotateCcw,
  Check,
  Sparkles,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  models: GeminiModelInfo[];
  isLoadingModels: boolean;
  modelsError: GenerationErrorDetails | string | null;
  onFetchModels: (keyToUse?: string) => void;
  systemInstruction: string;
  onSaveSystemInstruction: (instruction: string) => void;
  lang: AppLang;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  selectedModel,
  onSelectModel,
  models,
  isLoadingModels,
  modelsError,
  onFetchModels,
  systemInstruction,
  onSaveSystemInstruction,
  lang,
}) => {
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [tempInstruction, setTempInstruction] = useState(systemInstruction);
  const [activeTab, setActiveTab] = useState<'api' | 'instruction'>('api');
  const [saveConfirmed, setSaveConfirmed] = useState(false);

  // Sync state when opened
  React.useEffect(() => {
    if (isOpen) {
      setTempApiKey(apiKey);
      setTempInstruction(systemInstruction);
      setSaveConfirmed(false);
    }
  }, [isOpen, apiKey, systemInstruction]);

  if (!isOpen) return null;

  const t = UI_STRINGS[lang];

  const handleSaveAll = () => {
    onSaveApiKey(tempApiKey.trim());
    onSaveSystemInstruction(tempInstruction.trim() || EXACT_SYSTEM_INSTRUCTION);
    setSaveConfirmed(true);
    setTimeout(() => {
      setSaveConfirmed(false);
      onClose();
    }, 400);
  };

  const handleResetInstruction = () => {
    setTempInstruction(EXACT_SYSTEM_INSTRUCTION);
  };

  const handleFetchModelsClick = () => {
    onSaveApiKey(tempApiKey.trim());
    onFetchModels(tempApiKey.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/40">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>{t.settingsTitle}</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {t.settingsDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-5 pt-2 bg-zinc-50/40 dark:bg-zinc-950/20 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'api'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'المفتاح والنماذج' : 'API Key & Models'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('instruction')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'instruction'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تعليمات النظام (System Instruction)' : 'System Instruction'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'api' ? (
            <div className="space-y-4">
              {/* API Key Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-500" />
                    {t.apiKeyLabel}
                  </span>
                  <span className="text-[11px] font-normal text-zinc-400 dark:text-zinc-500">
                    Google AI Studio
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder={t.apiKeyPlaceholder}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {tempApiKey.trim()
                      ? (lang === 'ar' ? 'مفتاح مخصص قيد الاستخدام' : 'Custom key in use')
                      : (lang === 'ar' ? 'مفتاح النظام متصل وجاهز للعمل' : 'System key connected & active')}
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {t.apiKeyHelp}
                  </p>
                </div>
              </div>

              {/* Fetch Models Button */}
              <div>
                <button
                  type="button"
                  onClick={handleFetchModelsClick}
                  disabled={isLoadingModels}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? 'animate-spin' : ''}`} />
                  <span>{isLoadingModels ? t.fetchingModels : t.fetchModelsBtn}</span>
                </button>
              </div>

              {/* Error displaying for models */}
              {modelsError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
                  {typeof modelsError === 'string' ? modelsError : modelsError.rawMessage}
                </div>
              )}

              {/* Model Picker */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{t.defaultAiModel}</span>
                  </label>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {models.length} {lang === 'ar' ? 'نموذج متاح' : 'models found'}
                  </span>
                </div>

                {models.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
                    {t.noModelsFound}
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {models.map((model) => {
                      const isSelected = selectedModel === model.id;
                      return (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => onSelectModel(model.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 text-zinc-900 dark:text-zinc-100 font-medium'
                              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/30 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-zinc-800 dark:text-zinc-200 font-mono truncate">
                              {model.displayName || model.id}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono truncate">
                              {model.id}
                            </div>
                          </div>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 ml-2"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Fixed Temperature notice */}
                <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/50 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800/60">
                  {t.temperatureFixed}
                </p>
              </div>
            </div>
          ) : (
            /* System Instruction Viewer & Editor */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{t.systemInstructionLabel}</span>
                </label>
                <button
                  type="button"
                  onClick={handleResetInstruction}
                  className="text-[11px] text-zinc-500 hover:text-indigo-500 flex items-center gap-1 cursor-pointer"
                  title={t.resetDefaultInstruction}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.resetDefaultInstruction}</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {t.systemInstructionHelp}
              </p>
              <textarea
                value={tempInstruction}
                onChange={(e) => setTempInstruction(e.target.value)}
                rows={12}
                dir="ltr"
                className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed select-text"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/40 flex items-center justify-between">
          <div className="text-[11px] text-zinc-400">
            {saveConfirmed ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully'}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
            >
              {t.close}
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-colors shadow-xs"
            >
              {t.saveAndClose}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
