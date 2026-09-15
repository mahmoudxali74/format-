import {
  DomainType,
  DepthType,
  GeminiModelInfo,
  GenerationErrorDetails,
} from '../types';
import {
  DOMAINS,
  DEPTHS,
  EXACT_SYSTEM_INSTRUCTION,
} from '../constants';

export class GeminiApiError extends Error {
  details: GenerationErrorDetails;

  constructor(details: GenerationErrorDetails) {
    super(details.rawMessage);
    this.name = 'GeminiApiError';
    this.details = details;
  }
}

/**
 * Builds the effective system instruction:
 * Base instruction (or user-customized from settings)
 * + exactly one line for domain
 * + exactly one line for depth
 * + optional exclusions appended under rules
 */
export function buildSystemInstruction(params: {
  baseInstruction: string;
  domain: DomainType;
  depth: DepthType;
  exclusions?: string;
}): string {
  const { baseInstruction, domain, depth, exclusions } = params;

  const domainOption = DOMAINS.find((d) => d.id === domain) || DOMAINS[0];
  const depthOption = DEPTHS.find((d) => d.id === depth) || DEPTHS[1];

  let instruction = baseInstruction.trim();

  // Append one line for domain and one line for depth
  instruction += `\n\n${domainOption.instructionLine}\n${depthOption.instructionLine}`;

  if (exclusions && exclusions.trim()) {
    instruction += `\nUser explicitly specified the following exclusions (append as negative lines under # OUTPUT RULES):\n${exclusions.trim()}`;
  }

  return instruction;
}

/**
 * Strips markdown code fences (e.g. ```markdown ... ``` or ``` ...) from the model's reply
 */
export function stripMarkdownFences(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();

  // If wrapped in ```...``` or ```markdown ... ```
  if (cleaned.startsWith('```')) {
    // Remove opening fence and optional language tag (e.g., ```markdown or ```text)
    cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\s*\n?/, '');
    // Remove closing fence
    cleaned = cleaned.replace(/\n?```\s*$/, '');
  }

  return cleaned.trim();
}

/**
 * Parses Google Gemini error payloads.
 * Crucial: Shows the actual error message and HTTP status code returned by Google.
 * On 429: Identifies whether it was a per-minute rate limit or daily quota.
 */
export function parseGeminiError(statusCode: number, errorData: any): GenerationErrorDetails {
  const errObj = errorData?.error || {};
  const rawMessage =
    errObj.message ||
    errorData?.message ||
    (typeof errorData === 'string' ? errorData : `HTTP ${statusCode}: Error from Google API`);
  const statusStr = (errObj.status || '').toString().toLowerCase();
  const detailsStr = JSON.stringify(errObj.details || '').toLowerCase();
  const combined = `${rawMessage.toLowerCase()} ${statusStr} ${detailsStr}`;

  let isRateLimitMinute = false;
  let isDailyQuotaExhausted = false;
  let isInvalidKey = false;
  let userGuidance: string | undefined = undefined;

  if (statusCode === 400) {
    if (
      combined.includes('api key not valid') ||
      combined.includes('invalid argument') ||
      combined.includes('api_key_invalid') ||
      combined.includes('key not valid')
    ) {
      isInvalidKey = true;
      userGuidance =
        'مفتاح Gemini API غير صالح (صيغة خاطئة). تأكد من نسخ المفتاح كاملاً من Google AI Studio.';
    }
  } else if (statusCode === 401 || statusCode === 403) {
    isInvalidKey = true;
    userGuidance =
      'المفتاح غير مصرح به أو تم إلغاؤه (Unauthorized / Forbidden). يرجى التأكد من صلاحية المفتاح.';
  } else if (statusCode === 429 || statusStr.includes('resource_exhausted')) {
    if (
      combined.includes('day') ||
      combined.includes('daily') ||
      combined.includes('per_day') ||
      combined.includes('per-day') ||
      combined.includes('quota') ||
      combined.includes('free tier')
    ) {
      isDailyQuotaExhausted = true;
      userGuidance =
        'تم استنفاد الحصة اليومية المتاحة لهذا المفتاح (Daily Quota Exhausted). يرجى استخدام مفتاح آخر أو الانتظار لليوم التالي.';
    } else {
      isRateLimitMinute = true;
      userGuidance =
        'تم تجاوز معدل الطلبات المسموح به في الدقيقة (Per-Minute Rate Limit). جاري إعادة المحاولة تلقائياً بعد مهلة تصاعدية.';
    }
  }

  return {
    statusCode,
    statusText: errObj.status || `HTTP ${statusCode}`,
    rawMessage,
    userGuidance,
    isInvalidKey,
    isRateLimitMinute,
    isDailyQuotaExhausted,
  };
}

/**
 * Fetches models dynamically.
 * First queries /api/models which uses either the user's custom key (x-api-key)
 * or the server's configured GEMINI_API_KEY.
 * Never hardcodes model names.
 */
export async function fetchGeminiModels(apiKey?: string): Promise<GeminiModelInfo[]> {
  const cleanKey = (apiKey || '').trim();

  // 1. Try server endpoint first (works both with custom key or server key)
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(cleanKey ? { 'x-api-key': cleanKey } : {}),
    };

    const res = await fetch('/api/models', { method: 'GET', headers });
    const data = await res.json().catch(() => null);

    if (res.ok && data?.models && Array.isArray(data.models) && data.models.length > 0) {
      return data.models;
    }

    // If server returned an explicit error and we had no custom key, parse it
    if (!res.ok && data?.error) {
      const parsed = parseGeminiError(res.status, data);
      throw new GeminiApiError(parsed);
    }
  } catch (err: any) {
    if (err instanceof GeminiApiError) throw err;
    // Otherwise fallback if cleanKey is present
  }

  // 2. Direct Google fallback if a clean user key was provided
  if (cleanKey) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
      cleanKey
    )}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-goog-api-key': cleanKey,
      ...(cleanKey.startsWith('AQ.') ? { Authorization: `Bearer ${cleanKey}` } : {}),
    };

    let res: Response;
    try {
      res = await fetch(endpoint, { method: 'GET', headers });
    } catch (networkErr: any) {
      throw new GeminiApiError({
        statusCode: 0,
        rawMessage: `فشل الاتصال بالشبكة: ${networkErr?.message || 'تعذر الوصول إلى سيرفر Google'}`,
      });
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const parsed = parseGeminiError(res.status, data);
      throw new GeminiApiError(parsed);
    }

    if (!data?.models || !Array.isArray(data.models)) {
      throw new GeminiApiError({
        statusCode: res.status,
        rawMessage: `HTTP ${res.status}: لم يتم العثور على قائمة نماذج في استجابة Google.`,
      });
    }

    const eligibleModels: GeminiModelInfo[] = data.models
      .filter((m: any) => {
        const methods: string[] = m.supportedGenerationMethods || [];
        return methods.includes('generateContent');
      })
      .map((m: any) => {
        const rawName: string = m.name || '';
        const cleanId = rawName.replace(/^models\//, '');
        return {
          id: cleanId,
          name: rawName,
          displayName: m.displayName || cleanId,
          description: m.description,
          supportedGenerationMethods: m.supportedGenerationMethods,
        };
      });

    if (eligibleModels.length > 0) {
      return eligibleModels;
    }
  }

  throw new GeminiApiError({
    statusCode: 400,
    rawMessage: 'تعذر جلب النماذج. تأكد من اتصال الإنترنت أو مفتاح API.',
  });
}

/**
 * Calls Gemini generateContent with user text and system instruction strictly separated.
 * Routes through the server /api/generate endpoint (supporting both server GEMINI_API_KEY
 * and optional user x-api-key).
 * 1) SEPARATE THE TWO PARTS:
 *    system_instruction and user contents are strictly segregated.
 * 2) Temperature fixed at 0.3
 * 3) On 429: Retries with backoff at 1s, 2s, 4s, showing whether per-minute or daily quota
 * 4) Strips markdown fences before returning
 */
export async function generateStructuredPrompt(params: {
  apiKey?: string;
  model: string;
  rawText: string;
  domain: DomainType;
  depth: DepthType;
  exclusions?: string;
  baseSystemInstruction?: string;
  onRetry?: (attempt: number, delaySeconds: number, isPerMinute: boolean) => void;
}): Promise<string> {
  const {
    apiKey,
    model,
    rawText,
    domain,
    depth,
    exclusions,
    baseSystemInstruction = EXACT_SYSTEM_INSTRUCTION,
    onRetry,
  } = params;

  if (!rawText || !rawText.trim()) {
    throw new GeminiApiError({
      statusCode: 400,
      rawMessage: 'HTTP 400: يرجى كتابة فكرتك أو طلبك في مربع الإدخال.',
    });
  }

  const cleanKey = (apiKey || '').trim();
  const effectiveSystemInstruction = buildSystemInstruction({
    baseInstruction: baseSystemInstruction,
    domain,
    depth,
    exclusions,
  });

  const targetModel = model || 'gemini-3.6-flash';

  const backoffDelays = [1000, 2000, 4000]; // 1s, 2s, 4s

  for (let attempt = 0; attempt <= backoffDelays.length; attempt++) {
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cleanKey ? { 'x-api-key': cleanKey } : {}),
        },
        body: JSON.stringify({
          rawText: rawText.trim(),
          exclusions: exclusions?.trim() || undefined,
          domain,
          depth,
          model: targetModel,
          systemInstruction: effectiveSystemInstruction,
        }),
      });

      const responseData = await res.json().catch(() => null);

      if (!res.ok) {
        const parsed = parseGeminiError(res.status, responseData);

        // On 429, retry with backoff at 1s, 2s, 4s
        if (res.status === 429 && attempt < backoffDelays.length) {
          const delayMs = backoffDelays[attempt];
          if (onRetry) {
            onRetry(
              attempt + 1,
              delayMs / 1000,
              parsed.isRateLimitMinute || !parsed.isDailyQuotaExhausted
            );
          }
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue; // retry
        }

        throw new GeminiApiError(parsed);
      }

      const generatedText = (responseData?.result || '').trim();
      if (!generatedText) {
        const finishReason = responseData?.finishReason || 'EMPTY_RESPONSE';
        let rawMessage = `استجابة فارغة من النموذج دون نص مخرجات (سبب الإنهاء: ${finishReason}).`;
        let userGuidance = 'يرجى كتابة فكرة أو وصف مشروع واضح ومفصل لتتمكن خوارزمية التوليد من تحويله إلى هيكل برومبت متكامل.';

        if (finishReason === 'SAFETY') {
          rawMessage = 'تم حجب المخرجات بواسطة فلاتر الأمان التابعة لـ Gemini (Safety Filter).';
          userGuidance = 'يرجى تعديل الصياغة وتجنب استخدام أي كلمات قد تصنف كحساسة أو غير ملائمة.';
        } else if (finishReason === 'MAX_TOKENS') {
          rawMessage = 'تم استهلاك الحد الأقصى المسموح للرموز (Max Tokens).';
          userGuidance = 'يرجى تقصير المدخلات أو اختيار درجة عمق أقل.';
        } else if (finishReason === 'RECITATION') {
          rawMessage = 'تم إيقاف المخرجات لتجنب تكرار نصوص محمية بحقوق الطبع والنشر.';
        }

        throw new GeminiApiError({
          statusCode: res.status,
          rawMessage,
          userGuidance,
          finishReason,
        });
      }

      // Strip any markdown code fences before returning
      return stripMarkdownFences(generatedText);
    } catch (err: any) {
      if (err instanceof GeminiApiError) {
        if (err.details.statusCode !== 429 || attempt >= backoffDelays.length) {
          throw err;
        }
      } else {
        throw new GeminiApiError({
          statusCode: 0,
          rawMessage: `خطأ اتصال: ${err?.message || 'تعذر الاتصال بالخادم'}`,
        });
      }
    }
  }

  throw new GeminiApiError({
    statusCode: 429,
    rawMessage: 'HTTP 429: فشل الطلب بعد استنفاد محاولات إعادة المحاولة (1s, 2s, 4s).',
    isRateLimitMinute: true,
  });
}

/**
 * Sends current raw input to Gemini to refine phrasing and improve accuracy & clarity
 * before final structured prompt transformation.
 */
export async function refinePromptText(params: {
  rawText: string;
  domain?: DomainType;
  model?: string;
  apiKey?: string;
}): Promise<string> {
  const { rawText, domain, model, apiKey } = params;
  const cleanKey = (apiKey || '').trim();

  try {
    const res = await fetch('/api/refine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cleanKey ? { 'x-api-key': cleanKey } : {}),
      },
      body: JSON.stringify({
        rawText: rawText.trim(),
        domain,
        model: model || 'gemini-3.6-flash',
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const parsed = parseGeminiError(res.status, data);
      throw new GeminiApiError(parsed);
    }

    const result = data?.result || '';
    if (!result.trim()) {
      throw new GeminiApiError({
        statusCode: 500,
        rawMessage: 'لم يتم استلام نص محسن من النموذج.',
      });
    }

    return result.trim();
  } catch (err: any) {
    if (err instanceof GeminiApiError) throw err;
    throw new GeminiApiError({
      statusCode: 0,
      rawMessage: `فشل تحسين البرومبت: ${err?.message || 'تعذر الاتصال بالخادم'}`,
    });
  }
}
