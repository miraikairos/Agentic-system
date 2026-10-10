const { GoogleGenAI } = require("@google/genai");
const { getModel, generateContent } = require("./geminiConfig");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

/*
  Render free instances go to sleep after ~15 min idle and need up to ~1 min to start. While that happens,
  Render's proxy answers 502. The frontend only wakes the Decision Engine, so before asking the Research Engine
  for anything we poll its /health until it answers OK (or give up after maxMs), then send the real request.
*/
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wakeResearchEngine(url, maxMs = 90000) {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    try {
      const r = await fetch(`${url}/health`, { signal: AbortSignal.timeout(15000) });
      if (r.ok) return true;
      console.warn(`Research Engine warm-up: /health returned ${r.status}, waiting...`);
    } catch (e) {
      console.warn("Research Engine warm-up:", e.message);
    }
    await sleep(4000);
  }
  return false;
}

async function fetchResearch(url, options) {
  let response;
  for (let i = 0; i < 2; i++) {
    await wakeResearchEngine(url);
    response = await fetch(url + "/research", options);
    if (response.status !== 502 && response.status !== 504) return response;
    console.warn(`Research Engine returned ${response.status} (still starting?), attempt ${i + 1}/2`);
  }
  return response;
}

async function getResearchFromMember2(data) {
  const url =
    process.env.RESEARCH_ENGINE_URL ||
    "http://localhost:4002";

  const response = await fetchResearch(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        goal: data.goal || {},
        deadline:
          data.constraints?.deadline ||
          data.deadline,
        budget:
          data.constraints?.budget ||
          data.budget,
        resources:
          data.resources || [],
        successCriteria:
          data.successCriteria || []
      })
    }
  );

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = [
        body.detail || body.message || body.error,
        ...((body.meta && body.meta.warnings) || [])
      ]
        .filter(Boolean)
        .join("; ");
    } catch (e) {
      /* body was not JSON */
    }

    throw new Error(
      `Research Engine returned ${response.status}` +
        (detail ? `: ${detail}` : "")
    );
  }

  return await response.json();
}

/*
  Research must be about THIS goal. If the Research Engine failed, returned nothing, or returned
  its own fallback data (anything it flagged usedFallback that is not an explicit generic archetype list),
  planning is refused: a strategy built from unrelated candidates is worse than an error.
*/
function assertUsableResearch(research) {
  const meta = research?.meta || {};

  if (meta.researchFailed === true) {
    throw new Error(
      "Research unavailable: " + ((meta.warnings || []).join("; ") || "research failed for this goal")
    );
  }

  if (!research || !Array.isArray(research.candidates) || research.candidates.length === 0) {
    throw new Error("Research Engine returned no candidates for this goal");
  }

  if (meta.usedFallback === true && meta.genericFallback !== true) {
    throw new Error(
      "Research Engine returned built-in fallback candidates instead of research for this goal: " +
        ((meta.warnings || []).join("; ") || "no details")
    );
  }
}

const sameName = (a, b) =>
  String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

// shortlist entries are summaries ({option,label,name,suitability}); resolve the full candidate.
function pickSelected(data, research) {
  if (data.selectedSolution) return data.selectedSolution;
  if (research.selectedSolution) return research.selectedSolution;

  const top = research.shortlist && research.shortlist[0];
  const full = top && research.candidates.find((c) => sameName(c.name, top.name));

  // candidates are already sorted by suitability
  return full || research.candidates[0];
}

async function generateWithGemini(prompt) {
  const model = getModel();

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response =
        await generateContent(ai, {
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2
          }
        });

      const text = (response.text || "")
        .replace(/```json|```/g, "")
        .trim();

      return JSON.parse(text);

    } catch (error) {
      console.warn(
        `Planner Gemini attempt ${attempt} failed:`,
        error.message
      );

      if (attempt === 4 || error.permanent) {
        throw error;
      }

      await new Promise(resolve =>
        setTimeout(resolve, Math.min(3000 * 2 ** (attempt - 1), 12000))
      );
    }
  }
}

function buildFallbackPlan(data, research) {
  const candidates = research?.candidates || [];

  const selected =
    research?.selectedSolution ||
    candidates.find((c) => sameName(c.name, research?.shortlist?.[0]?.name)) ||
    candidates[0];

  const name =
    selected?.name || "Practical implementation";

  return {
    strategy:
      `Use ${name} as the primary implementation approach, validate it with a small prototype, then iterate based on execution results.`,

    selectedSolution: {
      name,
      type: selected?.type || "Tool",
      reason:
        selected?.fitReason ||
        "Selected as the most practical available option."
    },

    reasoning:
      "A fallback plan was generated because the planning model was temporarily unavailable. The plan is intentionally conservative and can be adapted after execution.",

    phases: [
      {
        id: "phase-1",
        name: "Setup",
        description:
          "Prepare the environment, dependencies and required resources.",
        expectedHours: 2,
        dependencies: [],
        successCondition:
          "Required environment is working."
      },
      {
        id: "phase-2",
        name: "Prototype",
        description:
          "Build a minimal working implementation.",
        expectedHours: 5,
        dependencies: ["phase-1"],
        successCondition:
          "Minimal prototype produces expected output."
      },
      {
        id: "phase-3",
        name: "Test and Validate",
        description:
          "Run representative tests and identify failures.",
        expectedHours: 4,
        dependencies: ["phase-2"],
        successCondition:
          "Major failure cases are identified."
      },
      {
        id: "phase-4",
        name: "Improve",
        description:
          "Fix the most important issues and validate again.",
        expectedHours: 4,
        dependencies: ["phase-3"],
        successCondition:
          "Prototype satisfies the main success criteria."
      }
    ],

    totalExpectedHours: 15,

    criticalRisks: [
      "Technical blockers",
      "Resource limitations",
      "Time overruns"
    ],

    checkpoints: [
      "Environment ready",
      "Prototype working",
      "Validation completed",
      "Success criteria verified"
    ]
  };
}

async function generatePlan(data) {
  let research = data.research || {};

  /*
   * Research comes from the Research Engine (Member 2), for THIS goal.
   * There is no local candidate list: if research fails, planning fails with a clear error.
   */
  if (
    !research ||
    !Array.isArray(research.candidates) ||
    research.candidates.length === 0
  ) {
    console.log("No research supplied. Calling Member 2...");

    research = await getResearchFromMember2(data);

    console.log(
      `Member 2 returned ${research.candidates?.length || 0} candidates`
    );
  }

  assertUsableResearch(research);

  const selectedSolution = pickSelected(data, research);

  const prompt = `
You are the Planning Engine of an autonomous goal-achievement system.

Create an initial execution plan using the user's goal, constraints,
resources, success criteria and research.

GOAL:
${JSON.stringify(data.goal || {})}

RESEARCH:
${JSON.stringify(research)}

SELECTED SOLUTION:
${JSON.stringify(selectedSolution)}

CONSTRAINTS:
${JSON.stringify(data.constraints || {})}

RESOURCES:
${JSON.stringify(data.resources || [])}

SUCCESS CRITERIA:
${JSON.stringify(data.successCriteria || [])}

Return ONLY valid JSON:

{
  "strategy": "",
  "selectedSolution": {
    "name": "",
    "type": "",
    "reason": ""
  },
  "reasoning": "",
  "phases": [
    {
      "id": "",
      "name": "",
      "description": "",
      "expectedHours": 0,
      "dependencies": [],
      "successCondition": ""
    }
  ],
  "totalExpectedHours": 0,
  "criticalRisks": [],
  "checkpoints": []
}

Rules:
- Use the selected solution.
- Respect deadline, budget and resources.
- Keep the plan practical.
- The plan may be changed later based on reality.
`;

  let plan;

  try {
    plan = await generateWithGemini(prompt);
  } catch (error) {
    console.warn(
      "Planner Gemini unavailable. Using fallback plan:",
      error.message
    );

    plan = buildFallbackPlan(
      data,
      research
    );
  }

  return {
    ...plan,

    researchUsed: {
      candidateCount:
        research.candidates?.length || 0,

      selectedSolution,

      alternatives:
        research.shortlist || [],

      candidates:
        research.candidates || [],

      weights:
        research.weights || null,

      meta:
        research.meta || null
    }
  };
}

module.exports = {
  generatePlan
};
