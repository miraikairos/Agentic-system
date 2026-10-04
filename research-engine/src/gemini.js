let ai;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function askJSON(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  if (!ai) {
    const { GoogleGenAI } = await import("@google/genai");
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });
  }

  const model =
    process.env.GEMINI_MODEL || "gemini-3-flash-preview";

  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });

      const text = (res.text || "")
        .replace(/```json|```/g, "")
        .trim();

      if (!text) {
        throw new Error("Gemini returned empty response");
      }

      console.log(`Gemini success using ${model}`);
      return JSON.parse(text);

    } catch (e) {
      lastError = e;

      console.warn(
        `Gemini attempt ${attempt}/3 failed:`,
        e.message
      );

      // Retry temporary errors.
      const msg = String(e.message || "").toLowerCase();

      const retryable =
        msg.includes("503") ||
        msg.includes("429") ||
        msg.includes("500") ||
        msg.includes("unavailable") ||
        msg.includes("overloaded") ||
        msg.includes("high demand") ||
        msg.includes("timeout");

      if (!retryable || attempt === 3) {
        break;
      }

      await sleep(1500 * attempt);
    }
  }

  throw lastError;
}
