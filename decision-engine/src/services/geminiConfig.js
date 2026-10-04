/*
  One place for the Gemini model name. Every Gemini call in the Decision Engine uses GEMINI_MODEL,
  so there are no scattered hardcoded model names. Use the same value as the Research Engine.
*/
// Default for new projects per Google's deprecations page (2.5 models are restricted to existing users).
const DEFAULT_MODEL = "gemini-3.8-flash";

function getModel() {
  return (process.env.GEMINI_MODEL || "").trim() || DEFAULT_MODEL;
}

module.exports = { getModel, DEFAULT_MODEL };
