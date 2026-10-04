const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function replan(data) {
  const alternative = data.selectedSolution;
  const alternativeSection = alternative
    ? `ALTERNATIVE SOLUTION (selected by the Research Engine after the previous strategy failed):
${JSON.stringify(alternative)}

`
    : "";

  const prompt = `
You are the Replanning Engine of an autonomous goal-achievement system.

The system created an initial plan, observed reality, and diagnosed the reason for deviation.

GOAL:
${JSON.stringify(data.goal || {})}

INITIAL PLAN:
${JSON.stringify(data.plan)}

REALITY:
${JSON.stringify(data.reality)}

DIAGNOSIS:
${JSON.stringify(data.diagnosis)}

${alternativeSection}Decide what the agent should do next.

Return ONLY valid JSON:

{
  "decision": "continue | modify_plan | switch_strategy",
  "reason": "",
  "newStrategy": "",
  "changes": [],
  "newPhases": [],
  "expectedImpact": "",
  "confidence": 0
}

Rules:
- If the current strategy is still valid and only timing/estimation is wrong, use "modify_plan".
- If the current strategy is working and no meaningful correction is required, use "continue".
- If the underlying strategy is no longer suitable, use "switch_strategy".
- If DIAGNOSIS.strategyAffected is true, the decision MUST be "switch_strategy".
- When an ALTERNATIVE SOLUTION is provided, newStrategy must be built on it and
  newPhases must use this shape: { "id": "", "name": "", "description": "",
  "expectedHours": 0, "dependencies": [], "successCondition": "" }.
- Do not switch strategy unnecessarily.
- Respect the original goal and constraints.
- Do not invent resources.
- confidence must be between 0 and 1.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: prompt
  });

  const result = JSON.parse(response.text);

  // Deterministic guard: a diagnosed strategy failure can never be answered with "modify_plan".
  if (data.diagnosis?.strategyAffected === true && result.decision !== "switch_strategy") {
    result.decision = "switch_strategy";
    result.reason =
      `${result.reason || ""} (Diagnosis: the underlying strategy is affected, so the strategy must change.)`.trim();
  }

  if (result.decision === "switch_strategy" && !result.newStrategy && alternative?.name) {
    result.newStrategy = alternative.name;
  }

  return result;
}

module.exports = {
  replan
};