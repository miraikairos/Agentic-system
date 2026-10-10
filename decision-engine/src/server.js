require("dotenv").config();

const express = require("express");
const cors = require("cors");

const decisionRoutes = require("./routes/decision");
const { getApiKeys, getModels } = require("./services/geminiConfig");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Decision Engine is running"
  });
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/", decisionRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Decision Engine running on http://localhost:${PORT}`);
  // Never prints key values, only how many were found.
  const n = getApiKeys().length;
  console.log(`Gemini API keys found: ${n}; models: ${getModels().join(", ")}`);
  if (!n) console.error("NO GEMINI API KEY FOUND: set GEMINI_API_KEY (or GEMINI_API_KEYS) in this Render service's Environment.");
});
