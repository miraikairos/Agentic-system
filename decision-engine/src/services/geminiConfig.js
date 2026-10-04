/*
  One place for Gemini model selection in the Decision Engine. Use the same values as the Research Engine.
    GEMINI_MODEL            primary model
    GEMINI_FALLBACK_MODELS  optional comma-separated list tried when the primary is out of quota / unavailable.
                            Free-tier quota is counted PER MODEL, so a second model gives extra daily capacity.
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

/*
  Drop-in replacement for ai.models.generateContent(request): tries the requested model, then each
  GEMINI_FALLBACK_MODELS entry when a model is out of quota or unavailable. Other errors (overload,
  timeouts, ...) are thrown unchanged so each caller's existing retry loop still works.
  When every model is out of quota the error message is short and contains no retryable keywords,
  so callers do not keep retrying and burning requests (it also avoids the words their retry checks look for).
*/
async function generateContent(ai, request) {
  const models = getModels(request.model);
  const problems = [];

  for (const model of models) {
    try {
      return await ai.models.generateContent({ ...request, model });
    } catch (err) {
      if (!isModelProblem(err.message)) throw err;
      console.warn(`Gemini model ${model} unavailable or out of quota:`, String(err.message).slice(0, 160));
      problems.push(model);
    }
  }

  const e = new Error(
    `Gemini quota exhausted or model not usable for: ${problems.join(", ")}. ` +
      "Set GEMINI_MODEL / GEMINI_FALLBACK_MODELS, enable billing, or wait for the daily quota to reset."
  );
  e.permanent = true;
  throw e;
}

module.exports = { getModel, getModels, generateContent, DEFAULT_MODEL };
