import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { EXACT_SYSTEM_INSTRUCTION, DOMAINS, DEPTHS } from './src/constants';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasServerKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Endpoint: Fetch available models
app.get('/api/models', async (req, res) => {
  try {
    const userApiKey = (req.headers['x-api-key'] as string) || '';
    const activeKey = userApiKey.trim() || process.env.GEMINI_API_KEY;

    if (!activeKey) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'No API key provided and no server key configured.',
        },
      });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
      activeKey
    )}`;

    const googleRes = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': activeKey,
      },
    });

    const data = await googleRes.json().catch(() => null);

    if (!googleRes.ok) {
      return res.status(googleRes.status).json(data);
    }

    const eligibleModels = (data.models || [])
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

    return res.json({ models: eligibleModels });
  } catch (err: any) {
    return res.status(500).json({
      error: {
        code: 500,
        message: err?.message || 'Failed to fetch models from Gemini server.',
      },
    });
  }
});

// Endpoint: Generate Structured Prompt via Server-side Gemini API
app.post('/api/generate', async (req, res) => {
  try {
    const { rawText, exclusions, domain, depth, model, systemInstruction } = req.body;
    const userApiKey = (req.headers['x-api-key'] as string) || '';
    const activeKey = userApiKey.trim() || process.env.GEMINI_API_KEY;

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({
        error: { code: 400, message: 'Text input is required.' },
      });
    }

    if (!activeKey) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'No API key provided and no server GEMINI_API_KEY available.',
        },
      });
    }

    const domainObj = DOMAINS.find((d) => d.id === domain) || DOMAINS[0];
    const depthObj = DEPTHS.find((d) => d.id === depth) || DEPTHS[1];
    const baseInstruction = (systemInstruction || EXACT_SYSTEM_INSTRUCTION).trim();

    let fullSystemInstruction = `${baseInstruction}\n\n${domainObj.instructionLine}\n${depthObj.instructionLine}`;

    if (exclusions && exclusions.trim()) {
      fullSystemInstruction += `\nUser explicitly specified the following exclusions (append as negative lines under # OUTPUT RULES):\n${exclusions.trim()}`;
    }

    const client = new GoogleGenAI({ apiKey: activeKey });
    const targetModel = model || 'gemini-3.6-flash';

    // Strictly separate systemInstruction and contents
    const response = await client.models.generateContent({
      model: targetModel,
      contents: [{ role: 'user', parts: [{ text: rawText.trim() }] }],
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: 0.3,
      },
    });

    let generatedText = (response.text || '').trim();

    // Fallback: If response.text is empty, inspect candidate parts
    if (!generatedText && response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text && !part.thought) {
          generatedText += part.text;
        }
      }
      generatedText = generatedText.trim();
    }

    if (!generatedText) {
      const candidate = response.candidates?.[0];
      const finishReason = candidate?.finishReason || 'EMPTY_RESPONSE';
      let message = `Empty response returned from Gemini model. Finish reason: ${finishReason}`;
      
      if (finishReason === 'SAFETY') {
        message = 'تم حجب المخرجات بواسطة فلاتر الأمان التابعة لـ Gemini (Safety Filter). يرجى مراجعة صياغة الفكرة وتجنب أي كلمات قد تصنف كحساسة.';
      } else if (finishReason === 'MAX_TOKENS') {
        message = 'تم الوصول للحد الأقصى المسموح من الرموز (Max Tokens). يرجى تقليل طول المدخلات أو تجربة درجة عمق أقل.';
      } else if (finishReason === 'RECITATION') {
        message = 'تم حجب الاستجابة لتجنب تكرار نصوص محمية بحقوق الطبع والنشر (Recitation).';
      } else if (finishReason === 'EMPTY_RESPONSE' || finishReason === 'STOP') {
        message = 'أرجع النموذج رداً فارغاً. غالباً ما يحدث ذلك إذا كان النص المدخل مقتضباً للغاية (مثل كلمة واحدة أو تحية)، أو بسبب تذبذب مؤقت في الاتصال. يرجى توضيح الفكرة بجملة مفصلة والمحاولة مجدداً.';
      }

      return res.status(422).json({
        error: {
          code: 422,
          message,
          finishReason,
        },
      });
    }

    return res.json({ result: generatedText });
  } catch (err: any) {
    const statusCode = err?.status || err?.statusCode || 500;
    return res.status(statusCode).json({
      error: {
        code: statusCode,
        message: err?.message || 'Failed to generate structured prompt.',
        details: err?.error || err,
      },
    });
  }
});

// Endpoint: Refine & enhance prompt text with extra clarification instructions before final structuring
app.post('/api/refine', async (req, res) => {
  try {
    const { rawText, model, domain } = req.body;
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({
        error: { code: 400, message: 'Raw text is required to refine.' },
      });
    }

    const headerApiKey = req.headers['x-api-key'] as string | undefined;
    const activeKey = headerApiKey || process.env.GEMINI_API_KEY;

    if (!activeKey) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'No API key provided and no server GEMINI_API_KEY available.',
        },
      });
    }

    const domainHint = domain ? `المجال المستهدف المختار هو: (${domain}).` : '';

    const refineSystemInstruction = `أنت خبير صياغة وهندسة برومبتات ومحرر تقني رفيع المستوى.
مهمتك: إعادة صياغة وضبط النص المدخل من المستخدم لجعله أكثر دقة، وضوحاً، تفصيلاً، واحترافية قبل تحويله إلى الهيكل النهائي.

تعليمات الصياغة الدقيقة:
1. حافظ تماماً على نفس لغة المستخدم الأصلية (إذا كان باللغة العربية أجب بالعربية الفصحى الواضحة، وإذا كان بالإنجليزية أجب بالإنجليزية).
2. ${domainHint}
3. قم بتوضيح المصطلحات العامة، وحدد المعايير، المتطلبات الأساسية، وحالات الاستخدام المتوقعة بدقة تامة وبدون غموض.
4. تخلص من الحشو اللغوي والتكرار أو التردد، واجعل التعبير مباشراً، متماسكاً، وقوياً.
5. أخرج فقط النص المُعاد صياغته والمحسّن مباشرة دون أي مقدمات (مثل: "إليك النص المحسن:" أو "Sure")، ودون علامات اقتباس، ودون أي خاتمة أو عروض مساعدة.
6. لا تقم بتحويله إلى هيكل البرومبت النهائي الآن (لا تستخدم # ROLE أو # CONTEXT حالياً)، بل اجعله نص متطلبات واضح وشامل ليراجعه المستخدم أولاً.`;

    const client = new GoogleGenAI({ apiKey: activeKey });
    const targetModel = model || 'gemini-3.6-flash';

    const response = await client.models.generateContent({
      model: targetModel,
      contents: [{ role: 'user', parts: [{ text: rawText.trim() }] }],
      config: {
        systemInstruction: refineSystemInstruction,
        temperature: 0.35,
      },
    });

    const refinedText = (response.text || '').trim();
    if (!refinedText) {
      return res.status(500).json({
        error: {
          code: 500,
          message: 'Empty response returned from Gemini model during prompt refinement.',
        },
      });
    }

    return res.json({ result: refinedText });
  } catch (err: any) {
    const statusCode = err?.status || err?.statusCode || 500;
    return res.status(statusCode).json({
      error: {
        code: statusCode,
        message: err?.message || 'Failed to refine prompt.',
        details: err?.error || err,
      },
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
