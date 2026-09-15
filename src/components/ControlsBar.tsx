import React from 'react';
import { DepthType, GeminiModelInfo } from '../types';
import { DEPTHS } from '../constants';
import { AppLang, UI_STRINGS } from '../utils/i18n';
import { Gauge, Cpu, RefreshCw } from 'lucide-react';

interface ControlsBarProps {
  depth: DepthType;
  onChangeDepth: (depth: DepthType) => void;
  selectedModel: string;
  onChangeModel: (model: string) => void;
  models: GeminiModelInfo[];
  isLoadingModels: boolean;
  onRefreshModels: () => void;
  disabled?: boolean;
  lang: AppLang;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  depth,
  onChangeDepth,
  selectedModel,
  onChangeModel,
  models,
  isLoadingModels,
  onRefreshModels,
  disabled,
  lang,
}) => {
  const t = UI_STRINGS[lang];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-2xl bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md border border-white/70 dark:border-white/10 shadow-xs transition-colors">
      {/* 1. Depth Control (Segmented) */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <Gauge className="w-3.5 h-3.5 text-indigo-500" />
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{t.depthLabel}</span>
        </div>
        <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-100/80 dark:bg-zinc-950/70 backdrop-blur-xs rounded-xl border border-zinc-200/70 dark:border-zinc-800/80">
          {DEPTHS.map((d) => {
            const isSelected = depth === d.id;
            return (
              <button
                key={d.id}
                type="button"
                disabled={disabled}
                onClick={() => onChangeDepth(d.id)}
                className={`py-1 px-1 rounded-lg text-[11px] font-medium text-center transition-all cursor-pointer truncate disabled:opacity-50 ${
                  isSelected
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-900'
                }`}
                title={lang === 'ar' ? d.labelAr : d.labelEn}
              >
                {lang === 'ar' ? d.labelAr.split(' ')[0] : d.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Model Picker */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{t.modelLabel}</span>
          </div>
          <button
            type="button"
            onClick={onRefreshModels}
            disabled={disabled || isLoadingModels}
            className="text-[11px] text-zinc-500 hover:text-indigo-500 flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
            title={t.refresh}
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingModels ? 'animate-spin' : ''}`} />
            <span>{isLoadingModels ? t.refreshing : t.refresh}</span>
          </button>
        </div>

        <select
          value={selectedModel}
          onChange={(e) => onChangeModel(e.target.value)}
          disabled={disabled || models.length === 0}
          className="w-full bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xs text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50 transition-colors truncate"
        >
          {models.length === 0 ? (
            <option value="">{t.modelLabel}...</option>
          ) : (
            models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName || m.id}
              </option>
            ))
          )}
        </select>
      </div>
    </div>
  );
};
