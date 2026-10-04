// Domain-neutral fallback.
//
// This file must NEVER contain solutions for a specific domain (no model names, libraries, APIs or products).
// If Gemini research fails, an unrelated candidate list is worse than no list: it makes the planner build a
// strategy for the wrong problem. So the default behaviour on research failure is an explicit
// "research unavailable" error (HTTP 503, see research.js / server.js).
//
// Optionally (ALLOW_GENERIC_FALLBACK=true, or MOCK=true for local testing) the engine can return the three
// generic strategy archetypes below. They apply to any goal, carry no scores and no evidence, and are flagged
// with generic:true / meta.genericFallback so nothing downstream mistakes them for researched candidates.

export const GENERIC_APPROACHES = [
  {
    name: "Use a hosted or managed service",
    type: "Approach",
    solvesGoalDirectly: true,
    generic: true,
    source: "generic strategy archetype (not researched)",
    license: "n/a",
    setupNotes:
      "Generic approach: rely on an existing hosted service or API for the core of the goal. Usually the fastest route; the specific provider still has to be researched and its limits checked.",
    scores: {},
    evidence: [],
  },
  {
    name: "Adapt an existing open-source project or pretrained component",
    type: "Approach",
    solvesGoalDirectly: true,
    generic: true,
    source: "generic strategy archetype (not researched)",
    license: "n/a",
    setupNotes:
      "Generic approach: start from an existing open-source project, template or pretrained component and customise it. The specific project still has to be researched and its licence checked.",
    scores: {},
    evidence: [],
  },
  {
    name: "Build a custom solution from scratch",
    type: "Approach",
    solvesGoalDirectly: true,
    generic: true,
    source: "generic strategy archetype (not researched)",
    license: "n/a",
    setupNotes:
      "Generic approach: design and implement the core yourself. Most flexible, usually the slowest and riskiest under a tight deadline.",
    scores: {},
    evidence: [],
  },
];

export function genericFallbackAllowed() {
  return process.env.ALLOW_GENERIC_FALLBACK === "true" || process.env.MOCK === "true";
}
