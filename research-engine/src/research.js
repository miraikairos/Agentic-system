import { askJSON } from "./gemini.js";
import { webSearch } from "./search.js";
import { buildWeights, scoreCandidates, buildShortlist } from "./scoring.js";
import { FALLBACK_CANDIDATES } from "./fallback.js";

function buildQueries(req) {
  const g = req.goal;
  const q = [`${g} pretrained model open source`, `${g} API free tier`, `${g} GitHub implementation`];
  if (req.failedStrategy) q.push(`${g} alternative faster setup ${req.failureReason || ""}`.trim());
  return q;
}

function buildPrompt(req, sources) {
  const sourceText = sources.length
    ? sources.map((s, i) => `[${i + 1}] ${s.title} - ${s.url}\n${s.snippet}`).join("\n\n")
    : "(no web sources available, rely on well-established knowledge and say when unsure)";

  const reResearch = req.failedStrategy
    ? `\nPREVIOUS STRATEGY FAILED: ${req.failedStrategy}\nREASON: ${req.failureReason || "unknown"}\nDEADLINE REMAINING: ${req.deadlineRemaining || "unknown"}\nFind alternatives that fix this specific problem.\n`
    : "";

  return `You are the research engine of a goal-planning system.

GOAL: ${req.goal}
DEADLINE: ${req.deadline || "not given"}
BUDGET: ${req.budget ?? 0}
RESOURCES: ${(req.resources || []).join(", ") || "not given"}
SUCCESS CRITERIA: ${(req.successCriteria || []).join(", ") || "not given"}
${reResearch}
WEB SOURCES:
${sourceText}

Return ONLY JSON in this exact shape:
{"candidates":[{
  "name": string,
  "type": "Model" | "API" | "Dataset" | "Library" | "Tool",
  "solvesGoalDirectly": true or false,
  "source": string,
  "license": string,
  "setupNotes": string,
  "scores": {"performance": 0-100 or null, "complexity": 0-100, "cost": 0-100, "hardware": 0-100, "time": 0-100, "compatibility": 0-100},
  "evidence": [{"type": "published_benchmark" | "provider_claim" | "github_info", "text": string, "url": string or null}]
}]}

RULES:
- Give 6 to 10 candidates. At least 5 must be complete approaches (a pretrained model, a GitHub implementation or a hosted API) that directly solve the goal. Libraries and datasets may be included only as supporting items.
- Use type Library for software packages, Dataset for datasets or benchmark challenges, and Model only for trained detection models.
- solvesGoalDirectly is true ONLY for a complete approach (a trained model, a ready implementation or a hosted API) that could do the job by itself. It is false for libraries, datasets, evaluation toolkits, metrics and other supporting items.
- Evidence must be specific to the goal. Popular or widely used is not evidence. Say what the repo, paper or provider actually offers, for example includes pretrained checkpoints or evaluated on ASVspoof 2019.
- All scores are integers 0-100 where HIGHER IS BETTER for this user: complexity 100 = very simple, cost 100 = free, hardware 100 = runs on a laptop, time 100 = very fast to set up.
- NEVER invent benchmark numbers. Only quote a number if it appears in the web sources above. Otherwise describe evidence in words.
- If you cannot justify the performance score, set it to null.
- Use a url from the web sources when the evidence comes from one, otherwise null.
- Every evidence item must be labelled with the correct type (published_benchmark, provider_claim or github_info).`;
}

function dedupeByUrl(list) {
  const seen = new Set();
  return list.filter((s) => (seen.has(s.url) ? false : seen.add(s.url)));
}

function finalize(req, candidates, sources, warnings, usedFallback) {
  const weights = buildWeights(req);
  // A candidate is "verified" only if one of its evidence URLs came from a real web search result.
  const sourceUrls = new Set(sources.map((s) => s.url));
  const scored = scoreCandidates(candidates, weights).map((c) => ({
    ...c,
    verified: (c.evidence || []).some((e) => e.url && sourceUrls.has(e.url)),
  }));
  // Only complete solutions can be Option A/B/C. Libraries and datasets stay in candidates.
  const direct = scored.filter((c) => c.solvesGoalDirectly !== false && ["Model", "API"].includes(c.type));
  // Prefer verified candidates when there are enough of them (needs a Tavily key).
  const verifiedDirect = direct.filter((c) => c.verified);
  const pool = verifiedDirect.length >= 3 ? verifiedDirect : direct.length ? direct : scored;
  return {
    candidates: scored,
    shortlist: buildShortlist(pool),
    sources,
    weights,
    meta: { usedFallback, warnings, note: "Scores are estimates unless backed by evidence items. verified = evidence URL came from a real web search result." },
  };
}

export async function research(req) {
  if (process.env.MOCK === "true") {
    return finalize(req, FALLBACK_CANDIDATES, [], ["MOCK mode"], true);
  }
  const warnings = [];
  const results = await Promise.all(buildQueries(req).map((q) => webSearch(q)));
  const sources = dedupeByUrl(results.flat());
  if (sources.length === 0) warnings.push("No web sources found; results rely on model knowledge.");

  const prompt = buildPrompt(req, sources);
  let list = null;
  let lastError = "unknown";

  // Try up to 2 times: Gemini occasionally returns an odd shape or an empty list.
  for (let attempt = 1; attempt <= 2 && !list; attempt++) {
    try {
      const out = await askJSON(prompt);
      // Accept {"candidates":[...]}, a bare array, or any array-valued field.
      const arr = Array.isArray(out) ? out : out?.candidates ?? Object.values(out || {}).find(Array.isArray);
      const cleaned = (Array.isArray(arr) ? arr : []).filter((c) => c && c.name);
      if (cleaned.length > 0) {
        list = cleaned;
      } else {
        lastError = "empty candidates";
        console.warn(`Attempt ${attempt}: no usable candidates. Raw reply:`, JSON.stringify(out).slice(0, 400));
      }
    } catch (e) {
      lastError = e.message;
      console.warn(`Attempt ${attempt} failed:`, e.message);
    }
  }

  if (list) return finalize(req, list, sources, warnings, false);

  warnings.push(`Gemini failed (${lastError}); using fallback data.`);
  return finalize(req, FALLBACK_CANDIDATES, sources, warnings, true);
}

// Re-score existing candidates with new requirements (no new search needed).
export function compare(req) {
  return finalize(req, req.candidates, req.sources || [], [], false);
}