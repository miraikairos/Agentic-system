// All scores are 0-100 and HIGHER IS BETTER for the user:
// performance = how well it achieves the goal (quality of result), complexity = 100 means very simple,
// cost = 100 means free, hardware = 100 means runs on the user's own machine,
// time = 100 means very fast to set up, compatibility = fits user's resources.
export const KEYS = ["performance", "complexity", "cost", "hardware", "time", "compatibility"];

// A "direct" candidate is a complete way to reach the goal (not just a supporting library or dataset).
// Gemini's solvesGoalDirectly flag wins; otherwise the type decides. Works for any domain
// (models/APIs for ML goals, frameworks/platforms for web goals, ...).
const DIRECT_TYPES = ["Model", "API", "Framework", "Platform", "Service", "Tool", "Approach"];
export function isDirectSolution(c) {
  if (c?.solvesGoalDirectly === false) return false;
  if (c?.solvesGoalDirectly === true) return true;
  return DIRECT_TYPES.includes(c?.type);
}

export function parseHours(d) {
  if (typeof d === "number") return d;
  const m = String(d || "").match(/(\d+(\.\d+)?)\s*(hour|hr|h|day|d|week|w)/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const u = m[3].toLowerCase();
  if (u.startsWith("d")) return n * 24;
  if (u.startsWith("w")) return n * 168;
  return n;
}

// The same candidate gets a different suitability score depending on the user's requirements.
export function buildWeights(req = {}) {
  const w = { performance: 0.25, complexity: 0.15, cost: 0.15, hardware: 0.15, time: 0.15, compatibility: 0.15 };

  const hours = parseHours(req.deadlineRemaining ?? req.deadline);
  if (hours !== null && hours <= 12) { w.time += 0.15; w.complexity += 0.1; }
  else if (hours !== null && hours <= 72) { w.time += 0.05; w.complexity += 0.05; }

  if (!req.budget || Number(req.budget) === 0) w.cost += 0.1;

  const resources = (req.resources || []).join(" ").toLowerCase();
  if (!/gpu|colab|cuda/.test(resources)) w.hardware += 0.05;

  const criteria = (req.successCriteria || []).join(" ").toLowerCase();
  if (/accura|perform|quality/.test(criteria)) w.performance += 0.15;

  // Optional explicit override from the frontend, e.g. { "priority": "time" }
  if (KEYS.includes(req.priority)) w[req.priority] += 0.2;

  const total = Object.values(w).reduce((a, b) => a + b, 0);
  for (const k of KEYS) w[k] = Number((w[k] / total).toFixed(3));
  return w;
}

export function scoreCandidates(candidates, weights) {
  return candidates
    .map((c) => {
      const scores = c.scores || {};
      const suitability = Math.round(
        KEYS.reduce((sum, k) => sum + weights[k] * (typeof scores[k] === "number" ? scores[k] : 50), 0)
      );
      const unverified = KEYS.filter((k) => typeof scores[k] !== "number");
      return { ...c, scores, evidence: c.evidence || [], suitability, unverifiedScores: unverified };
    })
    .sort((a, b) => b.suitability - a.suitability);
}

// Option A = best overall, B = fastest, C = best accuracy. No candidate is repeated if avoidable.
export function buildShortlist(scored) {
  const used = new Set();
  const picks = [
    { option: "A", label: "Best overall", get: (c) => c.suitability },
    { option: "B", label: "Fastest", get: (c) => c.scores.time ?? 0 },
    { option: "C", label: "Best accuracy", get: (c) => c.scores.performance ?? 0 },
  ];
  const out = [];
  for (const p of picks) {
    const ranked = [...scored].sort((a, b) => p.get(b) - p.get(a));
    const chosen = ranked.find((c) => !used.has(c.name)) || ranked[0];
    if (!chosen) continue;
    used.add(chosen.name);
    out.push({ option: p.option, label: p.label, name: chosen.name, suitability: chosen.suitability });
  }
  return out;
}
