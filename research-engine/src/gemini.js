// One place for Gemini configuration. The model always comes from GEMINI_MODEL.
// Default for new projects per Google's deprecations page (2.5 models are restricted to existing users).
// Always override with GEMINI_MODEL if Google changes the lineup again.
export const DEFAULT_MODEL = "gemini-3.8-flash";

export function getModel() {
  return (process.env.GEMINI_MODEL || "").trim() || DEFAULT_MODEL;
}

let ai;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Gemini request timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Gemini sometimes wraps JSON in prose or code fences.
function parseJSON(raw) {
  const text = String(raw || "").replace(/```json|```/gi, "").trim();
  if (!text) throw new Error("Gemini returned empty response");
  try {
    return JSON.parse(text);
  } catch (e) {
    const a = text.search(/[{[]/);
    const b = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
    if (a >= 0 && b > a) return JSON.parse(text.slice(a, b + 1));
    throw new Error(`Gemini returned invalid JSON: ${e.message}`);
  }
}

// Temporary problems (overload, rate limit, network, truncated/invalid JSON) are retried.
// Permanent problems (bad key, unknown model) fail immediately with a clear message.
function isRetryable(msg) {
  msg = String(msg || "").toLowerCase();
  return [
    "503", "429", "500", "502", "504", "unavailable", "overloaded", "high demand",
    "timeout", "timed out", "fetch failed", "econnreset", "etimedout", "socket",
    "empty response", "invalid json", "unexpected token", "resource_exhausted",
  ].some((s) => msg.includes(s));
}

export async function askJSON(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  if (!ai) {
    const { GoogleGenAI } = await import("@google/genai");
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  const model = getModel();
  const attempts = Math.max(1, Number(process.env.GEMINI_RETRIES) || 3);
  const timeoutMs = Math.max(5000, Number(process.env.GEMINI_TIMEOUT_MS) || 45000);

  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await withTimeout(
        ai.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: "application/json", temperature: 0.2 },
        }),
        timeoutMs
      );

      const out = parseJSON(res.text);
      console.log(`Gemini success using ${model} (attempt ${attempt})`);
      return out;
    } catch (e) {
      lastError = e;
      console.warn(`Gemini attempt ${attempt}/${attempts} failed (model ${model}):`, e.message);

      if (!isRetryable(e.message) || attempt === attempts) break;
      await sleep(1500 * attempt);
    }
  }

  const msg = lastError?.message || "unknown Gemini error";
  const hint = /not found|not supported|404|no longer available|permission|403/i.test(msg)
    ? " (the model may be unavailable for this key: set GEMINI_MODEL to a current model from https://ai.google.dev/gemini-api/docs/models)"
    : "";
  throw new Error(`model ${model}: ${msg}${hint}`);
}
