const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const FALLBACK_CANDIDATES = [
  {
    name: "AASIST",
    type: "Model",
    description:
      "Modern neural anti-spoofing approach.",
    fitReason:
      "Good when compute resources are available.",
    scores: {
      performance: 85,
      complexity: 45,
      cost: 100,
      hardware: 45,
      time: 30,
      compatibility: 80
    }
  },

  {
    name: "RawNet2",
    type: "Model",
    description:
      "Raw waveform anti-spoofing approach.",
    fitReason:
      "Alternative deep-learning strategy.",
    scores: {
      performance: 72,
      complexity: 60,
      cost: 100,
      hardware: 65,
      time: 50,
      compatibility: 80
    }
  },

  {
    name: "LFCC-GMM",
    type: "Model",
    description:
      "Lightweight CPU-friendly classical baseline.",
    fitReason:
      "Useful when GPU resources are limited.",
    scores: {
      performance: 65,
      complexity: 85,
      cost: 100,
      hardware: 95,
      time: 90,
      compatibility: 90
    }
  },

  {
    name: "Hosted Detection API",
    type: "API",
    description:
      "Cloud-based detection service.",
    fitReason:
      "Avoids local GPU requirements.",
    scores: {
      performance: null,
      complexity: 90,
      cost: 70,
      hardware: 100,
      time: 90,
      compatibility: 85
    }
  }
];

async function getResearchFromMember2(data) {
  const url =
    process.env.RESEARCH_ENGINE_URL ||
    "http://localhost:4002";

  const response = await fetch(
    `${url}/research`,
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
    throw new Error(
      `Research Engine returned ${response.status}`
    );
  }

  return await response.json();
}

async function generateWithGemini(prompt) {
  const model =
    process.env.GEMINI_MODEL ||
    "gemini-3-flash-preview";

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response =
        await ai.models.generateContent({
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

      if (attempt === 3) {
        throw error;
      }

      await new Promise(resolve =>
        setTimeout(resolve, 1500 * attempt)
      );
    }
  }
}

function buildFallbackPlan(data, research) {
  const candidates =
    research?.candidates?.length
      ? research.candidates
      : FALLBACK_CANDIDATES;

  const selected =
    research?.shortlist?.[0] ||
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
   * First try Member 2.
   * If Member 2 is unavailable, use local candidates.
   */
  if (
    !research ||
    !Array.isArray(research.candidates) ||
    research.candidates.length === 0
  ) {
    console.log(
      "No research supplied. Calling Member 2..."
    );

    try {
      research =
        await getResearchFromMember2(data);

      console.log(
        `Member 2 returned ${
          research.candidates?.length || 0
        } candidates`
      );

    } catch (error) {
      console.warn(
        "Member 2 failed. Using local research fallback:",
        error.message
      );

      research = {
        candidates: FALLBACK_CANDIDATES,
        shortlist: FALLBACK_CANDIDATES.slice(0, 3),
        sources: [],
        weights: null,
        meta: {
          usedFallback: true,
          warnings: [
            `Member 2 unavailable: ${error.message}`
          ]
        }
      };
    }
  }

  const selectedSolution =
    data.selectedSolution ||
    research.selectedSolution ||
    research.shortlist?.[0] ||
    research.candidates?.[0] ||
    FALLBACK_CANDIDATES[0];

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
