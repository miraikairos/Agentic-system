import { askJSON } from "./gemini.js";
import { webSearch } from "./search.js";
import {
  buildWeights,
  scoreCandidates,
  buildShortlist
} from "./scoring.js";
import { FALLBACK_CANDIDATES } from "./fallback.js";

function buildQueries(req) {
  const g =
    typeof req.goal === "string"
      ? req.goal
      : JSON.stringify(req.goal || {});

  const q = [
    `${g} pretrained model open source`,
    `${g} API free tier`,
    `${g} GitHub implementation`
  ];

  if (req.failedStrategy) {
    q.push(
      `${g} alternative faster setup ${req.failureReason || ""}`.trim()
    );
  }

  return q;
}

function buildPrompt(req, sources) {
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

Find alternatives that specifically solve this failure.
`
    : "";

  return `
You are the research engine of a goal-planning system.

GOAL:
${typeof req.goal === "string"
  ? req.goal
  : JSON.stringify(req.goal || {})}

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
  "candidates": [
    {
      "name": "",
      "type": "Model | API | Dataset | Library | Tool",
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
- Give 6 to 10 candidates.
- Include genuinely different approaches.
- Prefer solutions compatible with the user's resources.
- Do not invent benchmark numbers.
- Do not invent URLs.
- If evidence is unavailable, say so.
- Higher score is better.
- complexity 100 = easiest.
- cost 100 = cheapest/free.
- hardware 100 = easiest on available hardware.
- time 100 = fastest setup.
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

function finalize(
  req,
  candidates,
  sources,
  warnings,
  usedFallback
) {
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

  const direct = scored.filter(
    c =>
      c.solvesGoalDirectly !== false &&
      ["Model", "API"].includes(c.type)
  );

  const verifiedDirect = direct.filter(c => c.verified);

  const pool =
    verifiedDirect.length >= 3
      ? verifiedDirect
      : direct.length
      ? direct
      : scored;

  return {
    candidates: scored,
    shortlist: buildShortlist(pool),
    sources,
    weights,

    meta: {
      usedFallback,
      warnings,
      note:
        "Fallback candidates are estimates and should be validated before real deployment."
    }
  };
}

export async function research(req) {
  // MOCK mode
  if (process.env.MOCK === "true") {
    return finalize(
      req,
      FALLBACK_CANDIDATES,
      [],
      ["MOCK mode enabled"],
      true
    );
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
          console.warn(
            "Web search failed:",
            e.message
          );
          return [];
        }
      })
    );

    sources = dedupeByUrl(results.flat());
  } catch (e) {
    warnings.push(
      `Web search failed: ${e.message}`
    );
  }

  if (sources.length === 0) {
    warnings.push(
      "No web sources found; fallback/model knowledge may be used."
    );
  }

  const prompt = buildPrompt(req, sources);

  try {
    const out = await askJSON(prompt);

    const arr = Array.isArray(out)
      ? out
      : out?.candidates ||
        Object.values(out || {}).find(
          Array.isArray
        );

    const cleaned = Array.isArray(arr)
      ? arr.filter(c => c && c.name)
      : [];

    if (cleaned.length > 0) {
      return finalize(
        req,
        cleaned,
        sources,
        warnings,
        false
      );
    }

    warnings.push(
      "Gemini returned no usable candidates."
    );
  } catch (e) {
    console.warn(
      "Gemini research failed:",
      e.message
    );

    warnings.push(
      `Gemini unavailable: ${e.message}`
    );
  }

  // CRITICAL:
  // Never throw a 502 merely because Gemini failed.
  return finalize(
    req,
    FALLBACK_CANDIDATES,
    sources,
    warnings,
    true
  );
}

export function compare(req) {
  return finalize(
    req,
    req.candidates || FALLBACK_CANDIDATES,
    req.sources || [],
    [],
    false
  );
}
