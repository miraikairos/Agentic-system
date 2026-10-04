import "dotenv/config";
import express from "express";
import cors from "cors";
import { research, compare } from "./src/research.js";
import { getModel } from "./src/gemini.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) =>
  res.json({
    ok: true,
    mock: process.env.MOCK === "true",
    model: getModel(),
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    genericFallback: process.env.ALLOW_GENERIC_FALLBACK === "true"
  })
);

app.post("/research", async (req, res) => {
  try {
    if (!req.body?.goal) return res.status(400).json({ error: "goal is required" });
    res.json(await research(req.body));
  } catch (e) {
    if (e.code === "RESEARCH_UNAVAILABLE") {
      console.warn("research unavailable:", e.warnings);
      // 503 = temporary: the caller must not build a strategy from this response.
      return res.status(503).json({
        error: "research_unavailable",
        detail: e.message,
        meta: { usedFallback: true, researchFailed: true, warnings: e.warnings }
      });
    }
    console.error(e);
    res.status(500).json({ error: "research failed", detail: e.message });
  }
});

app.post("/compare", (req, res) => {
  try {
    if (!Array.isArray(req.body?.candidates) || req.body.candidates.length === 0)
      return res.status(400).json({ error: "candidates[] is required" });
    res.json(compare(req.body));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "compare failed", detail: e.message });
  }
});

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => console.log(`Research engine running on http://localhost:${PORT} (model: ${getModel()})`));
