/**
 * GATI AI Provider Layer
 * Priority: NVIDIA (kimi-k2.6) → NVIDIA (glm4.7) → Gemini → Error
 * All providers share the same interface.
 */

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ─── Retry helper ────────────────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 1500
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        console.warn(`[AI] Attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`);
        await new Promise(r => setTimeout(r, delayMs));
        delayMs *= 1.5; // exponential back-off
      }
    }
  }
  throw lastErr;
}

// ─── NVIDIA provider ─────────────────────────────────────────────────────────

async function callNvidia(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  timeoutMs = 30000
): Promise<string> {
  const response = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 1024,
      temperature: 0.7,
      top_p: 1.0,
      stream: false,
      // Enable thinking for supported models
      chat_template_kwargs: { thinking: false },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`NVIDIA API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from NVIDIA API');
  return text.trim();
}

// ─── Gemini provider ─────────────────────────────────────────────────────────

async function callGemini(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  timeoutMs = 30000
): Promise<string> {
  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${userMessage}` }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text.trim();
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export interface AIResponse {
  text: string;
  provider: string;
  model: string;
}

export async function callAI(
  systemPrompt: string,
  userMessage: string
): Promise<AIResponse> {
  const nvidiaKey1 = process.env.NVIDIA_API_KEY;   // kimi-k2.6
  const nvidiaKey2 = process.env.NVIDIA_API_KEY_2; // glm4.7
  const geminiKey  = process.env.GEMINI_API_KEY;

  const errors: string[] = [];

  // ── 1. NVIDIA kimi-k2.6 ────────────────────────────────────────────────────
  if (nvidiaKey1) {
    try {
      const text = await withRetry(
        () => callNvidia(nvidiaKey1, 'moonshotai/kimi-k2.6', systemPrompt, userMessage, 25000),
        2, 1500
      );
      return { text, provider: 'NVIDIA', model: 'kimi-k2.6' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`NVIDIA kimi-k2.6: ${msg}`);
      console.warn('[AI] kimi-k2.6 failed:', msg);
    }
  } else {
    errors.push('NVIDIA_API_KEY not configured');
  }

  // ── 2. NVIDIA glm4.7 ───────────────────────────────────────────────────────
  const glmKey = nvidiaKey2 || nvidiaKey1; // use key2 if available, else try key1
  if (glmKey) {
    try {
      const text = await withRetry(
        () => callNvidia(glmKey, 'z-ai/glm4.7', systemPrompt, userMessage, 25000),
        2, 1500
      );
      return { text, provider: 'NVIDIA', model: 'glm4.7' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`NVIDIA glm4.7: ${msg}`);
      console.warn('[AI] glm4.7 failed:', msg);
    }
  }

  // ── 3. Gemini fallback ─────────────────────────────────────────────────────
  if (geminiKey) {
    try {
      const text = await withRetry(
        () => callGemini(geminiKey, systemPrompt, userMessage, 35000),
        2, 2000
      );
      return { text, provider: 'Gemini', model: 'gemini-2.0-flash' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Gemini: ${msg}`);
      console.warn('[AI] Gemini failed:', msg);
    }
  } else {
    errors.push('GEMINI_API_KEY not configured');
  }

  // ── All providers failed ───────────────────────────────────────────────────
  throw new Error(`All AI providers failed:\n${errors.join('\n')}`);
}

/** Returns which providers are configured */
export function getProviderStatus() {
  return {
    nvidia: !!(process.env.NVIDIA_API_KEY || process.env.NVIDIA_API_KEY_2),
    gemini: !!process.env.GEMINI_API_KEY,
    primary: (process.env.NVIDIA_API_KEY || process.env.NVIDIA_API_KEY_2)
      ? 'NVIDIA (kimi-k2.6 → glm4.7)'
      : 'Gemini',
  };
}
