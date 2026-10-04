const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function getResearchFromMember2(data) {
  const response = await fetch(`${process.env.RESEARCH_ENGINE_URL}/research`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      goal: data.goal || {},
      deadline: data.constraints?.deadline || data.deadline,
      budget: data.constraints?.budget || data.budget,
      resources: data.resources || [],
      successCriteria: data.successCriteria || []
    })
  });

  if (!response.ok) {
    throw new Error(`Research Engine returned ${response.status}`);
  }

  return await response.json();
}

async function generatePlan(data) {
  let research = data.research || {};

  /*
    If research was not supplied, ask Member 2 to research it.
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

  const selectedSolution =
    data.selectedSolution ||
    research.selectedSolution ||
    research.shortlist?.[0] ||
    {};

  const prompt = `
You are the Planning Engine of an autonomous goal-achievement system.

Create an initial execution plan using the user's goal, constraints,
resources, success criteria and research from the Research Engine.

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
- Use the selected solution when one is provided.
- Prefer solutions supported by the Research Engine.
- Respect the user's deadline, budget, resources and constraints.
- Do not invent research evidence or benchmark numbers.
- Keep the plan practical and achievable.
- This is an INITIAL plan and may be changed after observing reality.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: prompt
  });

  const plan = JSON.parse(response.text);

  return {
    ...plan,
    researchUsed: {
      candidateCount: research.candidates?.length || 0,
      selectedSolution,
      alternatives: research.shortlist || []
    }
  };
}

module.exports = {
  generatePlan
};