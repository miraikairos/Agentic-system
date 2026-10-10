import { askJSON, getModel } from "./gemini.js";
import { webSearch } from "./search.js";
import {
  KEYS,
  buildWeights,
  scoreCandidates,
  buildShortlist,
  isDirectSolution
} from "./scoring.js";
import { GENERIC_APPROACHES, genericFallbackAllowed } from "./fallback.js";

const RESEARCH_ATTEMPTS = 2; // full research attempts (each askJSON call also retries transient errors itself)

// Thrown when research genuinely failed and no relevant candidates exist.
// server.js turns it into HTTP 503 so the Decision Engine never plans from unrelated candidates.
export class ResearchUnavailableError extends Error {
  constructor(message, warnings = []) {
    super(message);
    this.name = "ResearchUnavailableError";
    this.code = "RESEARCH_UNAVAILABLE";
    this.warnings = warnings;
  }
}

function goalText(req) {
  const g = req.goal;
  if (typeof g === "string") return g.trim();
  if (g && typeof g === "object") {
    return String(g.objective || g.goal || g.title || JSON.stringify(g)).trim();
  }
  return "";
}

// Search queries are domain-neutral: they are built only from the user's goal.
function buildQueries(req) {
  const g = goalText(req);

  const q = [
    `${g} best tools and approaches`,
    `${g} open source implementation GitHub`,
    `${g} free tier hosted service`,
    `how to build ${g}`
  ];

  if (req.failedStrategy) {
    q.push(
      `${g} alternative to ${req.failedStrategy} ${req.failureReason || ""}`.trim()
    );
  }

  return q;
}

function buildPrompt(req, sources, attempt) {
  const goal = goalText(req);

  const sourceText = sources.length
    ? sources
        .map(
          (s, i) =>
            `[${i + 1}] ${s.title} - ${s.url}\n${s.snippet}`
        )
        .join("\n\n")
    : "(no web sources available)";

  const reResearch = req.failedStrategy
    ? `
PREVIOUS STRATEGY FAILED:
${req.failedStrategy}

REASON:
${req.failureReason || "unknown"}

DEADLINE REMAINING:
${req.deadlineRemaining || "unknown"}

Find alternatives that specifically solve this failure. Do not return the failed strategy again.
`
    : "";

  const retryNote =
    attempt > 1
      ? "\nIMPORTANT: your previous answer was unusable. Return ONLY the JSON object described below, with at least 4 candidates.\n"
      : "";

  return `
You are the research engine of a goal-planning system.
${retryNote}
GOAL (research THIS goal and nothing else):
${goal}

DEADLINE:
${req.deadline || "not given"}

BUDGET:
${req.budget ?? 0}

RESOURCES:
${(req.resources || []).join(", ") || "not given"}

SUCCESS CRITERIA:
${(req.successCriteria || []).join(", ") || "not given"}

${reResearch}

WEB SOURCES:
${sourceText}

Return ONLY JSON:

{
  "goalSummary": "one sentence restating the goal in your own words",
  "candidates": [
    {
      "name": "",
      "type": "Model | API | Framework | Platform | Service | Library | Tool | Dataset",
      "solvesGoalDirectly": true,
      "source": "",
      "license": "",
      "setupNotes": "",
      "scores": {
        "performance": 0,
        "complexity": 0,
        "cost": 0,
        "hardware": 0,
        "time": 0,
        "compatibility": 0
      },
      "evidence": [
        {
          "type": "published_benchmark | provider_claim | github_info",
          "text": "",
          "url": null
        }
      ]
    }
  ]
}

RULES:
- Every candidate must be a real, existing way to accomplish the GOAL above, in the goal's own domain.
  Never return candidates from an unrelated domain.
- Give 6 to 10 candidates.
- Include genuinely different approaches.
- solvesGoalDirectly = true only for complete solutions; false for supporting libraries, datasets or toolkits.
- Prefer solutions compatible with the user's resources, deadline and budget.
- Do not invent benchmark numbers.
- Do not invent URLs.
- If evidence is unavailable, say so.
- Higher score is better.
- performance = how well it achieves the goal.
- complexity 100 = easiest.
- cost 100 = cheapest/free.
- hardware 100 = easiest on available hardware.
- time 100 = fastest setup.
- Scores must separate the candidates. Use the full 0-100 range: on each dimension the best candidate should
  score at least 25 points higher than the weakest one. Do NOT give every candidate 85 or more.
- Score candidates relative to each other and against the user's deadline, budget and resources.
- Do not name a specific AI model version (for example "Gemini 1.5") unless a WEB SOURCE above mentions it.
  Models get retired quickly: refer to the provider and model family (for example "Google Gemini API") and
  prefer current offerings.
- Each candidate must be a complete alternative to the others. Do not list a component and the framework or
  template that wraps it as separate competing options.
`;
}

function dedupeByUrl(list) {
  const seen = new Set();

  return list.filter(item => {
    if (!item?.url) return true;
    if (seen.has(item.url)) return false;

    seen.add(item.url);
    return true;
  });
}

const num = v =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.max(0, Math.min(100, Math.round(v)))
    : null; // null = unverified, never silently invented

const normName = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// True when a candidate is (or contains) the strategy that just failed. Used on re-research so the
// failed strategy can never come back as a candidate, whatever Gemini returns.
function isFailedStrategy(candidateName, failedStrategy) {
  const failed = normName(failedStrategy);
  if (!failed) return false;
  const cand = normName(String(candidateName || "").replace(/\(.*?\)/g, ""));
  if (cand.length < 4) return false;
  return cand === failed || failed.includes(cand) || (failed.length >= 4 && cand.includes(failed));
}

function sanitize(c) {
  if (!c || typeof c.name !== "string" || !c.name.trim()) return null;

  const s = c.scores && typeof c.scores === "object" ? c.scores : {};

  return {
    ...c,
    name: c.name.trim(),
    type: typeof c.type === "string" && c.type ? c.type : "Tool",
    solvesGoalDirectly: c.solvesGoalDirectly !== false,
    scores: Object.fromEntries(KEYS.map(k => [k, num(s[k])])),
    evidence: Array.isArray(c.evidence)
      ? c.evidence
          .filter(e => e && typeof e === "object")
          .map(e => ({
            type: String(e.type || "provider_claim"),
            text: String(e.text || ""),
            url:
              typeof e.url === "string" && /^https?:\/\//.test(e.url)
                ? e.url
                : null
          }))
      : []
  };
}

function finalize(req, candidates, sources, warnings, meta = {}) {
  const weights = buildWeights(req);

  const sourceUrls = new Set(
    sources.map(s => s.url).filter(Boolean)
  );

  const scored = scoreCandidates(
    candidates,
    weights
  ).map(c => ({
    ...c,
    verified: (c.evidence || []).some(
      e => e.url && sourceUrls.has(e.url)
    )
  }));

  const direct = scored.filter(isDirectSolution);

  // Pick by score among all complete solutions. Evidence is shown as a "verified" flag on each candidate,
  // but an unverified candidate with a clearly higher score is no longer hidden from the shortlist
  // (before, the shortlist was limited to verified candidates, so a lower-scored pick could beat a higher-scored one).
  const pool = direct.length ? direct : scored;

  const usedFallback = meta.usedFallback === true;

  return {
    candidates: scored,
    shortlist: buildShortlist(pool),
    sources,
    weights,

    meta: {
      usedFallback,
      genericFallback: meta.genericFallback === true,
      researchFailed: false,
      model: getModel(),
      goalSummary: meta.goalSummary || null,
      warnings,
      note: usedFallback
        ? "Generic strategy archetypes only: nothing was researched for this goal. Research the specific options before committing."
        : "Scores are estimates unless backed by evidence and should be validated before real deployment."
    }
  };
}

// Generic, domain-neutral archetypes. Only used when explicitly allowed.
function genericResult(req, sources, warnings) {
  return finalize(
    req,
    GENERIC_APPROACHES.map(c => ({ ...c })),
    sources,
    warnings,
    { usedFallback: true, genericFallback: true }
  );
}

export async function research(req) {
  const goal = goalText(req);
  if (!goal) throw new Error("goal is required");

  // MOCK mode (local testing): instant generic archetypes, no keys needed.
  // It deliberately does not return any domain-specific data.
  if (process.env.MOCK === "true") {
    return genericResult(req, [], ["MOCK mode enabled: generic archetypes only, no research was done"]);
  }

  const warnings = [];

  // Web search must never kill the whole research request.
  let sources = [];

  try {
    const results = await Promise.all(
      buildQueries(req).map(async q => {
        try {
          return await webSearch(q);
        } catch (e) {
          console.warn("Web search failed:", e.message);
          return [];
        }
      })
    );

    sources = dedupeByUrl(results.flat());
  } catch (e) {
    warnings.push(`Web search failed: ${e.message}`);
  }

  if (sources.length === 0) {
    warnings.push(
      "No web sources found; candidates come from Gemini's own knowledge and are unverified."
    );
  }

  // Retry Gemini before giving up.
  for (let attempt = 1; attempt <= RESEARCH_ATTEMPTS; attempt++) {
    try {
      const out = await askJSON(buildPrompt(req, sources, attempt));

      const arr = Array.isArray(out)
        ? out
        : out?.candidates ||
          Object.values(out || {}).find(Array.isArray);

      const cleaned = Array.isArray(arr)
        ? arr
            .map(sanitize)
            .filter(Boolean)
            .filter(c => !isFailedStrategy(c.name, req.failedStrategy))
            .slice(0, 10)
        : [];

      if (cleaned.length > 0) {
        return finalize(req, cleaned, sources, warnings, {
          goalSummary:
            typeof out?.goalSummary === "string" ? out.goalSummary : null
        });
      }

      warnings.push(
        `Gemini returned no usable candidates (attempt ${attempt}/${RESEARCH_ATTEMPTS}).`
      );
    } catch (e) {
      console.warn(`Gemini research failed (attempt ${attempt}/${RESEARCH_ATTEMPTS}):`, e.message);
      warnings.push(`Gemini unavailable: ${e.message}`);
      // askJSON already retried transient errors; a permanent error (bad key / unknown model) will not improve.
      if (/api_key|API key|not found|404|403|401|PERMISSION|missing/i.test(e.message)) break;
    }
  }

  // Research genuinely failed.
  if (genericFallbackAllowed()) {
    warnings.push("Using generic, domain-neutral strategy archetypes (ALLOW_GENERIC_FALLBACK).");
    return genericResult(req, sources, warnings);
  }

  // Default: say so clearly. Never return candidates that were not researched for THIS goal.
  throw new ResearchUnavailableError(
    "Research failed for this goal; no relevant candidates are available.",
    warnings
  );
}

export function compare(req) {
  if (!Array.isArray(req.candidates) || req.candidates.length === 0) {
    throw new Error("candidates[] is required");
  }

  return finalize(
    req,
    req.candidates,
    req.sources || [],
    [],
    { usedFallback: false }
  );
}
