const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

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

  const response = await ai.models.generateContent({
   model: "gemini-3.7-flash",
    contents: prompt
  });

  const text = response.text;

  return JSON.parse(text);
}

module.exports = { analyzeGoal };