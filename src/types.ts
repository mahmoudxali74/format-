export type OutputLanguage = 'match' | 'ar' | 'en';

export type DomainType =
  | 'general'
  | 'ui_ux'
  | 'frontend'
  | 'backend'
  | 'research'
  | 'content'
  | 'media';

export type DepthType = 'short' | 'medium' | 'detailed' | 'ultra';

export interface GeminiModelInfo {
  id: string; // e.g. "gemini-2.5-flash"
  name: string; // e.g. "models/gemini-2.5-flash"
  displayName: string;
  description?: string;
  supportedGenerationMethods?: string[];
}

export interface SavedPromptItem {
  id: string;
  rawInput: string;
  exclusions?: string;
  domain: DomainType;
  depth: DepthType;
  model: string;
  output: string;
  timestamp: number;
}

export interface GenerationErrorDetails {
  statusCode?: number;
  statusText?: string;
  rawMessage: string;
  userGuidance?: string;
  isInvalidKey?: boolean;
  isRateLimitMinute?: boolean;
  isDailyQuotaExhausted?: boolean;
  finishReason?: string;
  retryAttempt?: number;
  retryCountdown?: number;
}
