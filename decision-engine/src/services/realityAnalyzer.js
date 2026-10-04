const { GoogleGenAI } = require("@google/genai");
const { collectObservations } = require("./strategy");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

/*
  The plan has no top-level "expectedHours"; it has phases[].expectedHours and
  totalExpectedHours. Resolve the expected time from whichever is available.
*/
function resolveExpected(expected, actual) {
  const phases = Array.isArray(expected.phases) ? expected.phases : [];
  const ref = String(actual.phaseId ?? actual.phase ?? actual.task ?? expected.task ?? "")
    .trim()
    .toLowerCase();

  const matchedPhase = ref
    ? phases.find(
        (p) =>
          String(p.id || "").toLowerCase() === ref ||
          String(p.name || "").toLowerCase() === ref
      )
    : undefined;

  const phaseSum = phases.reduce((sum, p) => sum + (Number(p.expectedHours) || 0), 0);

  const hours = [
    matchedPhase?.expectedHours,
    expected.expectedHours,
    expected.totalExpectedHours,
    phaseSum
  ]
    .map(Number)
    .find((n) => Number.isFinite(n) && n > 0);

  return {
    expectedHours: hours ?? null,
    task: matchedPhase?.name || expected.task || actual.task || expected.strategy || "Unknown task"
  };
}

async function analyzeReality(data) {
  const expected = data.expected || {};
  const actual = data.actual || {};

  const { expectedHours, task } = resolveExpected(expected, actual);
  const parsedActual = Number(actual.actualHours);
  const actualHours =
    actual.actualHours !== undefined && actual.actualHours !== null && Number.isFinite(parsedActual)
      ? parsedActual
      : null;

  let driftPercentage = 0;

  if (expectedHours !== null && actualHours !== null) {
    driftPercentage =
      Math.round(
        Math.abs(actualHours - expectedHours) / expectedHours * 100
      );
  }

  const isBlocked =
    String(actual.status || "").toLowerCase() === "blocked" || actual.blocked === true;

  let status = "on_track";
  let severity = "low";

  if (isBlocked) {
    status = "blocked";
    severity = "high";
  } else if (driftPercentage > 50) {
    status = "drift";
    severity = "high";
  } else if (driftPercentage > 20) {
    status = "drift";
    severity = "medium";
  } else if (driftPercentage > 0) {
    status = "drift";
    severity = "low";
  }

  // Preserve what was actually observed so Diagnosis can see the real cause.
  const reported = collectObservations(actual);

  const timeObservations = [];
  if (expectedHours !== null) timeObservations.push(`Expected execution time: ${expectedHours} hours`);
  if (actualHours !== null) timeObservations.push(`Actual execution time: ${actualHours} hours`);
  if (expectedHours !== null && actualHours !== null) {
    timeObservations.push(`Execution drift: ${driftPercentage}%`);
  }

  return {
    status,
    driftPercentage,
    severity,
    expectedHours,
    actualHours,
    affectedAreas: [task],
    blockers: isBlocked ? reported : [],
    observations: [...timeObservations, ...reported],
    needsDiagnosis: status !== "on_track"
  };
}

module.exports = {
  analyzeReality
};
