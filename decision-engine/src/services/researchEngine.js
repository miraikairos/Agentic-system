const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function researchSolutions(data) {
  const prompt = `
You are the Research Engine of an autonomous goal-achievement system.

Your job is to identify viable solutions for the user's goal before a plan is created.

GOAL:
${JSON.stringify(data.goal || {})}

CONSTRAINTS:
${JSON.stringify(data.constraints || {})}

RESOURCES:
${JSON.stringify(data.resources || [])}

SUCCESS CRITERIA:
${JSON.stringify(data.successCriteria || [])}

Return ONLY valid JSON with this structure:

{
  "query": "",
  "candidates": [
    {
      "name": "",
      "type": "",
      "description": "",
      "advantages": [],
      "limitations": [],
      "requirements": [],
      "evidence": [],
      "fitReason": ""
    }
  ]
}

Rules:
- Find 3 to 5 genuinely different solution approaches.
- Consider pretrained models, APIs, libraries, cloud services, datasets,
  templates or other existing capabilities where relevant.
- Prefer solutions that respect the user's constraints.
- Do not invent benchmark numbers, URLs, research papers, or claims.
- If evidence is not available from the provided information, say so.
- Do not select the final solution yet.
- The purpose of this stage is to create candidates for later comparison.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: prompt
  });

  return JSON.parse(response.text);
}

module.exports = {
  researchSolutions
};