/*
  Shared helpers for the adaptive loop (reality -> diagnosis -> replan -> re-research).
  Pure functions only: no Gemini calls, no network calls.
*/

// Phrases that mean "the current approach cannot continue".
// Only applied when reality.status === "blocked".
const HARD_BLOCKER_PATTERN =
  /((insufficient|not enough|out of|exceed\w*|run out of)[^.;]{0,30}(gpu|vram|memory|ram|cuda))|((gpu|vram|memory|ram)[^.;]{0,30}(insufficient|not enough|exceeded|exhausted|full|error|failure))|\boom\b|cannot (run|fit|load|support|work|continue|execute)|can'?t (run|fit|load|work|continue)|unable to (run|load|continue|execute)|does(n'?t| not) (fit|run|work|support)|incompatible|not supported|unsupported|((api|service|model|library|dataset)[^.;]{0,30}(unavailable|deprecated|discontinued|not available|shut ?down))|no (access|gpu)/i;

const HARDWARE_PATTERN = /gpu|vram|cuda|nvidia|\bram\b|\bcpu\b|memory|hardware|\boom\b/i;

const OBSERVATION_KEYS = [
  "observations", "observation", "blockers", "blocker", "issues", "issue",
  "notes", "note", "error", "errors", "reason", "message", "details",
  "description", "summary", "result", "findings"
];

function flattenStrings(value, out = []) {
  if (value == null) return out;
  if (typeof value === "string") {
    if (value.trim()) out.push(value.trim());
  } else if (Array.isArray(value)) {
    value.forEach((v) => flattenStrings(v, out));
  } else if (typeof value === "object") {
    Object.values(value).forEach((v) => flattenStrings(v, out));
  }
  return out;
}

// Collect every free-text observation / blocker the caller sent in `actual`.
function collectObservations(actual = {}) {
  const found = [];
  for (const key of OBSERVATION_KEYS) {
    if (actual[key] !== undefined) flattenStrings(actual[key], found);
  }
  return [...new Set(found)];
}

function blockerText(reality = {}) {
  return flattenStrings([reality.blockers, reality.observations]).join(" ; ");
}

// True when execution is blocked AND the evidence says the approach cannot continue.
function isHardBlocker(reality = {}) {
  return reality.status === "blocked" && HARD_BLOCKER_PATTERN.test(blockerText(reality));
}

function isHardwareBlocker(reality = {}) {
  return HARDWARE_PATTERN.test(blockerText(reality));
}

function getFailedStrategyName(plan = {}) {
  return (
    plan.selectedSolution?.name ||
    plan.researchUsed?.selectedSolution?.name ||
    plan.strategy ||
    ""
  );
}

// A complete way to reach the goal (any domain), not just a supporting library or dataset.
const DIRECT_TYPES = ["Model", "API", "Framework", "Platform", "Service", "Tool", "Approach"];
function isDirectSolution(c) {
  if (c && c.solvesGoalDirectly === false) return false;
  if (c && c.solvesGoalDirectly === true) return true;
  return DIRECT_TYPES.includes(c && c.type);
}

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const baseName = (s) => String(s || "").replace(/\(.*?\)/g, "");

function isSameAsFailed(candidateName, plan = {}) {
  const base = norm(baseName(candidateName));
  if (base.length < 4) return false;
  return norm(getFailedStrategyName(plan)).includes(base);
}

/*
  Pick the best alternative from a Member 2 research response.
  - never the failed solution
  - complete solutions (solvesGoalDirectly / Model, API, Framework, Platform, Service, Tool) first
  - for hardware blockers, only candidates that run on weak hardware (scores.hardware >= 60)
  - highest Member 2 suitability wins
*/
function selectAlternativeSolution(research = {}, { plan = {}, reality = {} } = {}) {
  const all = Array.isArray(research.candidates) ? research.candidates : [];
  let pool = all.filter((c) => c && c.name && !isSameAsFailed(c.name, plan));

  const direct = pool.filter(isDirectSolution);
  if (direct.length) pool = direct;

  if (isHardwareBlocker(reality)) {
    const light = pool.filter((c) => typeof c.scores?.hardware === "number" && c.scores.hardware >= 60);
    if (light.length) pool = light;
  }

  pool = [...pool].sort((a, b) => (b.suitability ?? 0) - (a.suitability ?? 0));
  if (!pool.length) return null;

  return {
    selected: pool[0],
    alternatives: pool.slice(1, 4).map((c) => ({ name: c.name, type: c.type, suitability: c.suitability }))
  };
}

module.exports = {
  collectObservations,
  isHardBlocker,
  isHardwareBlocker,
  getFailedStrategyName,
  selectAlternativeSolution
};
