// One place for Gemini configuration. Models always come from the environment:
//   GEMINI_MODEL            primary model
//   GEMINI_FALLBACK_MODELS  optional comma-separated list tried when the primary is out of quota or unavailable.
//                           Free-tier quota is counted PER MODEL, so a second model gives extra daily capacity.
//   GEMINI_API_KEYS         optional comma-separated list of keys; when one is out of quota the next is used.
//                           Quota is counted per Google Cloud PROJECT, so keys only help if they come from
//                           different projects. If unset, GEMINI_API_KEY is used alone.
// Default for new projects per Google's deprecations page (2.5 models are restricted to existing users).
export const DEFAULT_MODEL = "gemini-3.8-flash";

export function getModel() {
  return (process.env.GEMINI_MODEL || "").trim() || DEFAULT_MODEL;
}

export function getModels() {
  const extra = (process.env.GEMINI_FALLBACK_MODELS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([getModel(), ...extra])];
}

export function getApiKeys() {
  const list = (process.env.GEMINI_API_KEYS || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const single = (process.env.GEMINI_API_KEY || "").trim();
  return [...new Set([...list, ...(single ? [single] : [])])];
}

let clients; // one client per key, created on first use
const preferredKey = new Map(); // model -> index of the key that last worked

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

function retryDelaySec(msg) {
  const m = String(msg).match(/retry in ([0-9hms.]+)/i) || String(msg).match(/"retryDelay":\s*"(\d+)s"/i);
  if (!m) return null;
  const t = m[1];
  if (/^\d+$/.test(t)) return Number(t);
  const h = /(\d+)h/.exec(t), mi = /(\d+)m(?!s)/.exec(t), s = /([\d.]+)s/.exec(t);
  return (h ? h[1] * 3600 : 0) + (mi ? mi[1] * 60 : 0) + (s ? parseFloat(s[1]) : 0);
}

// What kind of failure is this?
//  quota        daily/long quota exhausted: retrying the same model is pointless (and wastes requests)
//  model        model unknown / not available for this key: retrying is pointless
//  permission   key not allowed to use this model / API: try the next model, else report a key problem
//  transient    overload, short rate limit, network, bad JSON: worth retrying
//  fatal        bad key, permissions: stop immediately
function classify(msg) {
  const m = String(msg || "").toLowerCase();
  const delay = retryDelaySec(msg);
  if (/resource_exhausted|quota|429/.test(m)) {
    return /perday|per day/.test(m) || (delay != null && delay > 60) ? "quota" : "transient";
  }
  if (/not found|not supported|no longer available|404/.test(m)) return "model";
  // PERMISSION_DENIED can be specific to one model (e.g. a preview model), so another model may still work.
  if (/permission_denied|permission|403/.test(m)) return "permission";
  if (/invalid json|empty response|unexpected token/.test(m)) return "transient";
  if (/api key|api_key|401|unauthenticated|invalid/.test(m)) return "fatal";
  if (
    [
      "503", "500", "502", "504", "unavailable", "overloaded", "high demand",
      "timeout", "timed out", "fetch failed", "econnreset", "etimedout", "socket",
      "empty response", "invalid json", "unexpected token",
    ].some((s) => m.includes(s))
  ) return "transient";
  return "fatal";
}

// Short, readable summary instead of a raw JSON dump.
function summarize(model, msg, kind) {
  if (kind === "quota") {
    const d = retryDelaySec(msg);
    const hrs = d ? ` Retry in about ${d >= 3600 ? Math.round(d / 360) / 10 + "h" : Math.ceil(d / 60) + "min"}.` : "";
    return `Gemini quota exhausted for model ${model} (free tier allows only a small number of requests per day).${hrs}`;
  }
  const first = String(msg).replace(/\s+/g, " ").slice(0, 300);
  return `model ${model}: ${first}`;
}

export async function askJSON(prompt) {
  const keys = getApiKeys();
  if (!keys.length) {
    const e = new Error("GEMINI_API_KEY is missing");
    e.permanent = true;
    throw e;
  }

  if (!clients) {
    const { GoogleGenAI } = await import("@google/genai");
    clients = keys.map((apiKey) => new GoogleGenAI({ apiKey }));
  }

  const attempts = Math.max(1, Number(process.env.GEMINI_RETRIES) || 3);
  const timeoutMs = Math.max(5000, Number(process.env.GEMINI_TIMEOUT_MS) || 45000);
  const problems = [];
  let permanent = true;

  for (const model of getModels()) {
    const start = preferredKey.get(model) || 0;

    for (let k = 0; k < clients.length; k++) {
      const ki = (start + k) % clients.length;
      const client = clients[ki];
      const keyLabel = clients.length > 1 ? ` key ${ki + 1}/${clients.length}` : "";
      let nextKey = false; // quota / permission / bad key: this key is no use for this model, try another key
      let nextModel = false; // model unknown, or still failing after retries: other keys will not help

      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          const res = await withTimeout(
            client.models.generateContent({
              model,
              contents: prompt,
              config: { responseMimeType: "application/json", temperature: 0.2 },
            }),
            timeoutMs
          );

          const out = parseJSON(res.text);
          preferredKey.set(model, ki);
          console.log(`Gemini success using ${model}${keyLabel} (attempt ${attempt})`);
          return out;
        } catch (e) {
          const kind = classify(e.message);
          console.warn(`Gemini ${model}${keyLabel} attempt ${attempt}/${attempts} failed [${kind}]:`, String(e.message).slice(0, 200));

          if (kind === "fatal") {
            if (clients.length > 1 && k < clients.length - 1) {
              nextKey = true; // one bad key must not stop the others
              break;
            }
            const err = new Error(summarize(model, e.message, kind));
            err.permanent = true;
            throw err;
          }
          if (kind === "model") {
            problems.push(
              `model ${model} is not available for this key (set GEMINI_MODEL to a current model from https://ai.google.dev/gemini-api/docs/models)`
            );
            nextModel = true;
            break;
          }
          if (kind === "quota" || kind === "permission") {
            problems.push(
              kind === "permission"
                ? `Gemini permission denied for model ${model}${keyLabel}: this API key may be invalid or restricted, or the Generative Language API is not enabled for its Google project. Check GEMINI_API_KEY on this service`
                : summarize(model, e.message, kind) + (keyLabel ? ` (${keyLabel.trim()})` : "")
            );
            nextKey = true;
            break;
          }
          // transient
          if (attempt === attempts) {
            problems.push(summarize(model, e.message, kind));
            permanent = false;
            nextModel = true;
          } else {
            // Honour Google's "retry in Ns" hint on short rate limits (capped); otherwise back off a little longer.
            const hint = retryDelaySec(e.message);
            await sleep(hint != null ? Math.min(hint, 20) * 1000 + 500 : 3000 * attempt);
          }
        }
      }

      if (nextModel || !nextKey) break; // keep trying other keys only after quota/permission/bad-key failures
    }
  }

  const err = new Error(problems.join(" | ") || "unknown Gemini error");
  err.permanent = permanent;
  throw err;
}
