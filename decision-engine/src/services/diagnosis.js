const { GoogleGenAI } = require("@google/genai");
const { getModel, generateContent } = require("./geminiConfig");

const { isHardBlocker } = require("./strategy");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function diagnose(data) {
  const prompt = `
You are the Diagnosis Engine of an autonomous goal-achievement system.

The system created a plan and then observed real execution.
Your job is to determine WHY the execution deviated from the plan and
whether the current strategy can still continue.

PLAN:
${JSON.stringify(data.plan)}

REALITY:
${JSON.stringify(data.reality)}

Return ONLY valid JSON with this exact structure:

{
  "rootCause": "",
  "causeType": "",
  "strategyAffected": false,
  "explanation": "",
  "recommendation": "",
  "confidence": 0
}

Possible causeType values:
- estimation_failure
- resource_constraint
- technical_blocker
- dependency_failure
- requirement_change
- execution_failure
- strategy_failure
- external_factor
- unknown

Rules:

1. FIRST inspect the actual execution result and determine whether the
   current approach can continue.

2. If reality.status is "blocked", prioritize the BLOCKER over time drift.

3. If reality contains explicit evidence that the current approach cannot
   continue, classify it as a genuine blocker.

4. Examples of genuine blockers:
   - insufficient GPU/CPU/RAM
   - model cannot fit in available memory
   - required API unavailable
   - incompatible library/model
   - missing required resource
   - dependency failure
   - deadline makes the current approach infeasible

5. If an explicit blocker prevents the current strategy from continuing:
   - choose the most appropriate blocker causeType
   - set "strategyAffected": true
   - recommend changing the underlying strategy

6. A task taking longer than expected is NOT an estimation_failure if the
   task is blocked or cannot continue.

7. Use "estimation_failure" only when the task can still be completed with
   the same underlying strategy and the main problem is inaccurate timing.

8. strategyAffected = true means the underlying approach needs to change,
   not merely that its schedule needs adjustment.

9. recommendation must explain the next appropriate action.

10. confidence must be between 0 and 1.

11. Do not invent facts that are not present in the input.
`;

  const hardBlocker = isHardBlocker(data.reality);

  let result = {};
  try {
    // Retry temporary Gemini failures (503 overload etc.); generateContent also tries fallback models.
    let response;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        response = await generateContent(ai, {
          model: getModel(),
          contents: prompt,
          config: { responseMimeType: "application/json", temperature: 0.2 }
        });
        break;
      } catch (e) {
        if (attempt === 4 || e.permanent) throw e;
        console.warn(`Diagnosis Gemini attempt ${attempt} failed:`, e.message);
        await new Promise(r => setTimeout(r, Math.min(3000 * 2 ** (attempt - 1), 12000)));
      }
    }
    result = JSON.parse(String(response.text || "").replace(/```json|```/gi, "").trim());
  } catch (err) {
    // Never let a busy AI service crash /adapt: fall back to rules instead of throwing.
    console.warn("Diagnosis LLM failed, using fallback rules:", err.message);
    if (!hardBlocker) {
      result = {
        rootCause: "AI diagnosis was unavailable (service busy), so a conservative estimate was used.",
        causeType: "estimation_failure",
        strategyAffected: false,
        explanation:
          "The AI diagnosis could not run. No explicit blocker was detected, so the current strategy is kept and only the timing is adjusted.",
        recommendation:
          "Adjust the schedule and continue with the current strategy. Retry the adaptation shortly for a full diagnosis.",
        confidence: 0.3,
        degraded: true
      };
    }
  }

  /*
    Deterministic guard: an explicit blocker (e.g. insufficient GPU memory) means
    the underlying strategy cannot continue, whatever the LLM answered.
  */
  if (hardBlocker) {
    const blockers = data.reality.blockers?.length
      ? data.reality.blockers
      : data.reality.observations || [];
    const keepType = ["dependency_failure", "strategy_failure"].includes(result.causeType);

    result = {
      ...result,
      rootCause: result.rootCause || blockers.join("; "),
      causeType: keepType ? result.causeType : "technical_blocker",
      strategyAffected: true,
      explanation:
        result.explanation ||
        "Execution is blocked by an explicit blocker, so the current approach cannot continue.",
      recommendation:
        result.recommendation ||
        "Switch to an alternative approach that works within the available resources.",
      confidence: typeof result.confidence === "number" ? result.confidence : 0.9
    };
  }

  return result;
}

module.exports = {
  diagnose
};
