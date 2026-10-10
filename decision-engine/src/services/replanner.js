const { GoogleGenAI } = require("@google/genai");
const { getModel, generateContent } = require("./geminiConfig");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanJson(text) {
  return String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function fallbackReplan(data) {
  const diagnosis = data.diagnosis || {};
  const plan = data.plan || {};
  const selectedSolution = data.selectedSolution || null;

  if (diagnosis.strategyAffected === true) {
    const newStrategy =
      selectedSolution?.name ||
      "Switch to a more suitable alternative strategy";

    return {
      decision: "switch_strategy",

      reason:
        diagnosis.explanation ||
        diagnosis.recommendation ||
        "The current strategy is no longer suitable for the observed conditions.",

      newStrategy,

      changes: [
        "Replace the failed strategy",
        "Rebuild the remaining work around the new strategy"
      ],

      newPhases: selectedSolution
        ? [
            {
              id: "adapted-phase-1",
              name: `Implement ${selectedSolution.name}`,
              description:
                selectedSolution.description ||
                "Implement the selected alternative solution.",
              expectedHours: 4,
              dependencies: [],
              successCondition:
                "The alternative solution is successfully implemented."
            }
          ]
        : [],

      expectedImpact:
        "Provides a more feasible path toward the original goal.",

      confidence: 0.7
    };
  }

  return {
    decision: "modify_plan",

    reason:
      diagnosis.explanation ||
      "The strategy is still viable but the execution plan needs adjustment.",

    newStrategy:
      plan.strategy ||
      "Continue with the current strategy using updated estimates.",

    changes: [
      "Update remaining time estimates",
      "Adjust the remaining task sequence"
    ],

    newPhases: [],

    expectedImpact:
      "Makes the remaining plan better aligned with actual execution.",

    confidence: 0.7
  };
}

async function replan(data) {
  const model = getModel();

  const prompt = `
You are the Replanning Engine of an adaptive goal-achievement system.

The system created an initial plan, observed actual execution,
and diagnosed the deviation.

GOAL:
${JSON.stringify(data.goal || {}, null, 2)}

INITIAL PLAN:
${JSON.stringify(data.plan || {}, null, 2)}

REALITY:
${JSON.stringify(data.reality || {}, null, 2)}

DIAGNOSIS:
${JSON.stringify(data.diagnosis || {}, null, 2)}

SELECTED ALTERNATIVE SOLUTION:
${JSON.stringify(data.selectedSolution || null, null, 2)}

Decide what the agent should do next.

Return ONLY valid JSON using exactly this structure:

{
  "decision": "continue",
  "reason": "",
  "newStrategy": "",
  "changes": [],
  "newPhases": [],
  "expectedImpact": "",
  "confidence": 0
}

Allowed decisions:

"continue"
"modify_plan"
"switch_strategy"

Rules:

1. If the current strategy is still valid and only timing or estimates
   are wrong, use "modify_plan".

2. If the current strategy is still working and no meaningful change
   is required, use "continue".

3. If the underlying strategy is no longer suitable, use
   "switch_strategy".

4. If diagnosis.strategyAffected is true, you MUST use
   "switch_strategy".

5. If an alternative solution is provided, use it when switching
   strategy.

6. Do not switch strategy unnecessarily.

7. Respect the original goal, deadline, budget and resources.

8. Do not invent resources.

9. If switching strategy, provide realistic newPhases for the
   remaining work.

10. confidence must be between 0 and 1.

Return raw JSON only.
Do NOT wrap the JSON in markdown.
`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await generateContent(ai, {
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });

      const cleaned = cleanJson(response.text);

      if (!cleaned) {
        throw new Error("Gemini returned an empty response");
      }

      const result = JSON.parse(cleaned);

      /*
       * Safety rule:
       * If diagnosis says the strategy itself is affected,
       * never allow the model to return continue/modify_plan.
       */
      if (
        data.diagnosis?.strategyAffected === true &&
        result.decision !== "switch_strategy"
      ) {
        result.decision = "switch_strategy";

        if (!result.reason) {
          result.reason =
            "The diagnosis shows that the underlying strategy is affected.";
        }
      }

      /*
       * If Gemini forgot to provide the new strategy,
       * use the researched alternative.
       */
      if (
        result.decision === "switch_strategy" &&
        !result.newStrategy &&
        data.selectedSolution?.name
      ) {
        result.newStrategy =
          data.selectedSolution.name;
      }

      /*
       * Make sure adapted phases exist when switching strategy.
       */
      if (
        result.decision === "switch_strategy" &&
        data.selectedSolution &&
        (!Array.isArray(result.newPhases) ||
          result.newPhases.length === 0)
      ) {
        result.newPhases = [
          {
            id: "adapted-phase-1",
            name:
              `Implement ${data.selectedSolution.name}`,
            description:
              data.selectedSolution.description ||
              "Implement and validate the selected alternative.",
            expectedHours: 4,
            dependencies: [],
            successCondition:
              "The alternative solution is working successfully."
          }
        ];
      }

      console.log(
        `Replanning succeeded using ${model}`
      );

      return result;

    } catch (error) {
      console.warn(
        `Replanning attempt ${attempt}/3 failed:`,
        error.message
      );

      const message =
        String(error.message || "").toLowerCase();

      const retryable =
        message.includes("503") ||
        message.includes("429") ||
        message.includes("500") ||
        message.includes("unavailable") ||
        message.includes("high demand") ||
        message.includes("overloaded") ||
        message.includes("timeout");

      if (!retryable || attempt === 3) {
        break;
      }

      await sleep(Math.min(3000 * 2 ** (attempt - 1), 12000));
    }
  }

  console.warn(
    "Gemini unavailable for replanning. Using fallback."
  );

  return fallbackReplan(data);
}

module.exports = {
  replan
};
