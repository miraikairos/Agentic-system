/*
  One place for Gemini model selection in the Decision Engine. Use the same values as the Research Engine.
    GEMINI_MODEL            primary model
    GEMINI_FALLBACK_MODELS  optional comma-separated list tried when the primary is out of quota / unavailable.
                            Free-tier quota is counted PER MODEL, so a second model gives extra daily capacity.
    GEMINI_API_KEYS         optional comma-separated list of keys. When a key is out of quota the next key is used.
                            Quota is counted per Google Cloud PROJECT, so keys only help if they come from
                            different projects. If unset, GEMINI_API_KEY is used alone.
*/
// Default for new projects per Google's deprecations page (2.5 models are restricted to existing users).
const DEFAULT_MODEL = "gemini-3.8-flash";

function getModel() {
  return (process.env.GEMINI_MODEL || "").trim() || DEFAULT_MODEL;
}

function getModels(first) {
  const extra = (process.env.GEMINI_FALLBACK_MODELS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([first || getModel(), ...extra])];
}

const { GoogleGenAI } = require("@google/genai");

// Keys may be pasted with stray spaces or quotes; strip them.
const cleanKey = (k) => String(k || "").trim().replace(/^["']+|["']+$/g, "").trim();

function getApiKeys() {
  const list = (process.env.GEMINI_API_KEYS || "").split(",").map(cleanKey).filter(Boolean);
  const single = cleanKey(process.env.GEMINI_API_KEY);
  return [...new Set([...list, ...(single ? [single] : [])])];
}

// Other Decision Engine files create their own client from GEMINI_API_KEY. If only GEMINI_API_KEYS is set
// (or GEMINI_API_KEY is empty), copy the first key into it now, before those files build their clients.
if (!cleanKey(process.env.GEMINI_API_KEY)) {
  const first = getApiKeys()[0];
  if (first) process.env.GEMINI_API_KEY = first;
}

const clientCache = new Map();
function clientFor(key) {
  if (!clientCache.has(key)) clientCache.set(key, new GoogleGenAI({ apiKey: key }));
  return clientCache.get(key);
}

// Remember which key last worked for each model so exhausted keys are not tried first every time.
const preferredKey = new Map();

function retryDelaySec(msg) {
  const m = String(msg).match(/retry in ([0-9hms.]+)/i);
  if (!m) return null;
  const t = m[1];
  const h = /(\d+)h/.exec(t), mi = /(\d+)m(?!s)/.exec(t), s = /([\d.]+)s/.exec(t);
  return (h ? h[1] * 3600 : 0) + (mi ? mi[1] * 60 : 0) + (s ? parseFloat(s[1]) : 0);
}

// daily / long quota exhausted, or model not available for this key: another model may still work.
function isModelProblem(msg) {
  const m = String(msg || "").toLowerCase();
  const delay = retryDelaySec(msg);
  const quota =
    /resource_exhausted|quota|429/.test(m) && (/perday|per day/.test(m) || (delay != null && delay > 60));
  return quota || /not found|not supported|no longer available|404|permission_denied|permission denied|\b403\b/.test(m);
}

// Google says the model is overloaded right now ("high demand" 503). Another model may still answer.
function isOverload(msg) {
  return /unavailable|overloaded|high demand|\b503\b/i.test(String(msg || ""));
}

/*
  Drop-in replacement for ai.models.generateContent(request): tries the requested model, then each
  GEMINI_FALLBACK_MODELS entry when a model is out of quota or unavailable. Other errors (overload,
  timeouts, ...) are thrown unchanged so each caller's existing retry loop still works.
  When every model is out of quota the error message is short and contains no retryable keywords,
  so callers do not keep retrying and burning requests (it also avoids the words their retry checks look for).
*/
async function generateContent(ai, request) {
  const models = getModels(request.model);
  const keys = getApiKeys();
  // Always build clients from the configured keys. The caller's `ai` client is created from GEMINI_API_KEY only,
  // so it has no key (and fails with "Could not load the default credentials") when only GEMINI_API_KEYS is set.
  if (!keys.length) {
    const e = new Error("No Gemini API key configured: set GEMINI_API_KEY (or GEMINI_API_KEYS) on this service.");
    e.permanent = true;
    throw e;
  }
  const clients = keys.map(clientFor);
  const problems = [];

  for (const model of models) {
    const start = preferredKey.get(model) || 0;
    let modelProblem = false;
    let overloadedMoveOn = false;

    for (let k = 0; k < clients.length; k++) {
      const idx = (start + k) % clients.length;
      try {
        const res = await clients[idx].models.generateContent({ ...request, model });
        preferredKey.set(model, idx);
        return res;
      } catch (err) {
        // Overloaded model: another key will not help. Move to the next configured model; on the last model
        // rethrow unchanged so each caller's own retry loop still runs.
        if (isOverload(err.message) && !isModelProblem(err.message)) {
          if (model !== models[models.length - 1]) {
            console.warn(`Gemini model ${model} overloaded, trying next model:`, String(err.message).slice(0, 120));
            overloadedMoveOn = true;
            break;
          }
          throw err;
        }
        if (!isModelProblem(err.message)) throw err;
        console.warn(
          `Gemini model ${model} unavailable or out of quota` +
            (clients.length > 1 ? ` (key ${idx + 1}/${clients.length})` : "") + ":",
          String(err.message).slice(0, 160)
        );
        modelProblem = true; // try the next key, then the next model
      }
    }
    if (overloadedMoveOn) continue;
    if (modelProblem) problems.push(model);
  }

  const e = new Error(
    `Gemini quota exhausted or model not usable for: ${problems.join(", ")}` +
      (keys.length > 1 ? ` (tried ${keys.length} API keys)` : "") + ". " +
      "Set GEMINI_MODEL / GEMINI_FALLBACK_MODELS / GEMINI_API_KEYS, enable billing, or wait for the daily quota to reset."
  );
  e.permanent = true;
  throw e;
}

module.exports = { getModel, getModels, getApiKeys, generateContent, DEFAULT_MODEL };
