// Gemini is imported lazily so MOCK mode works even before dependencies are installed.
let ai;

// Tries GEMINI_MODEL from .env first, then these backups in order.
const MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.8-flash",
  "gemini-3-flash-preview",
  "gemini-flash-latest",
];

export async function askJSON(prompt) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing");
  if (!ai) {
    const { GoogleGenAI } = await import("@google/genai");
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  let lastError;
  for (const model of [...new Set(MODELS.filter(Boolean))]) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json", temperature: 0.2 },
      });
      const text = (res.text || "").replace(/```json|```/g, "").trim();
      console.log(`Gemini model used: ${model}`);
      return JSON.parse(text);
    } catch (e) {
      lastError = e;
      console.warn(`Model ${model} failed: ${String(e.message).slice(0, 150)}`);
    }
  }
  throw lastError;
}