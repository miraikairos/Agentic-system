const { GoogleGenAI } = require("@google/genai");
const { getModel } = require("./geminiConfig");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fallbackAnalysis(data) {
  const goal = data.goal || "";

  return {
    objective: goal,

    constraints: [
      data.deadline
        ? `Complete within ${data.deadline}`
        : "Deadline not specified",

      data.budget !== undefined &&
      data.budget !== null
        ? `Budget limit: ${data.budget}`
        : "Budget not specified",

      ...(data.resources || []).map(
        r => `Available resource: ${r}`
      )
    ],

    priorities: [
      "Complete the goal within the deadline",
      "Minimize technical risk",
      "Use available resources efficiently"
    ],

    risks: [
      "Technical blockers",
      "Time overruns",
      "Resource limitations"
    ],

    successCriteria:
      data.successCriteria &&
      data.successCriteria.length
        ? data.successCriteria
        : [
            "Working implementation",
            "Meets the stated requirements",
            "Completed within the deadline"
          ]
  };
}

async function analyzeGoal(data) {
  const prompt = `
You are the Goal Analysis Engine of an autonomous planning system.

Analyze the following goal:

Goal: ${data.goal}
Deadline: ${data.deadline || "Not specified"}
Budget: ${data.budget ?? "Not specified"}
Resources: ${JSON.stringify(data.resources || [])}
Success Criteria: ${JSON.stringify(data.successCriteria || [])}

Return ONLY valid JSON with this structure:

{
  "objective": "",
  "constraints": [],
  "priorities": [],
  "risks": [],
  "successCriteria": []
}

Identify the user's actual priorities from the goal and constraints.
Do not invent information that is not supported by the input.
`;

  const model = getModel();

  // Retry temporary Gemini failures.
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

      if (!text) {
        throw new Error(
          "Gemini returned an empty response"
        );
      }

      const result = JSON.parse(text);

      console.log(
        `Goal analysis succeeded using ${model}`
      );

      return result;

    } catch (error) {
      console.warn(
        `Goal analysis attempt ${attempt}/3 failed:`,
        error.message
      );

      const msg =
        String(error.message || "").toLowerCase();

      const retryable =
        msg.includes("503") ||
        msg.includes("429") ||
        msg.includes("500") ||
        msg.includes("unavailable") ||
        msg.includes("high demand") ||
        msg.includes("overloaded") ||
        msg.includes("timeout");

      if (!retryable || attempt === 3) {
        break;
      }

      await sleep(1500 * attempt);
    }
  }

  // Gemini still unavailable.
  // DO NOT throw a 500.
  console.warn(
    "Gemini unavailable for goal analysis. Using local fallback."
  );

  return fallbackAnalysis(data);
}

module.exports = {
  analyzeGoal
};
