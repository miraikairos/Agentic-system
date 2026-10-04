const { analyzeReality } = require("./realityAnalyzer");
const { diagnose } = require("./diagnosis");
const { replan } = require("./replanner");
const {
  isHardwareBlocker,
  getFailedStrategyName,
  selectAlternativeSolution
} = require("./strategy");

const RESEARCH_URL = process.env.RESEARCH_ENGINE_URL || "http://localhost:4002/research";

/*
  Ask Member 2 for alternatives after the current strategy failed, then pick one.
  Never throws: if Member 2 is unreachable the adaptation continues without it.
*/
async function reResearch(data, reality, diagnosis) {
  const plan = data.plan || {};
  const goalInput = data.goal;
  const goalObj = goalInput && typeof goalInput === "object" ? goalInput : {};
  const constraints = data.constraints || goalObj.constraints || {};

  const goal =
    typeof goalInput === "string"
      ? goalInput
      : goalObj.objective || goalObj.goal || goalObj.title || plan.goal || "";

  const resources = [].concat(data.resources ?? goalObj.resources ?? constraints.resources ?? [])
    .map((r) => (typeof r === "string" ? r : r?.name || JSON.stringify(r)));

  const blockers = reality.blockers?.length ? reality.blockers : [];
  const failureReason = [diagnosis.rootCause, blockers.length ? `Observed: ${blockers.join("; ")}` : ""]
    .filter(Boolean)
    .join(". ")
    .slice(0, 600);

  const request = {
    goal,
    deadline: data.deadline ?? constraints.deadline ?? goalObj.deadline,
    budget: data.budget ?? constraints.budget ?? goalObj.budget,
    resources,
    successCriteria: data.successCriteria ?? goalObj.successCriteria ?? [],
    failedStrategy: getFailedStrategyName(plan) || "current strategy",
    failureReason: failureReason || diagnosis.explanation || "current strategy failed",
    deadlineRemaining: data.deadlineRemaining,
    priority: isHardwareBlocker(reality) ? "hardware" : undefined
  };

  try {
    if (!goal) throw new Error("goal is required for re-research");

    const response = await fetch(RESEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(90000)
    });
    if (!response.ok) throw new Error(`Research Engine returned ${response.status}`);

    const research = await response.json();
    const choice = selectAlternativeSolution(research, { plan, reality });

    console.log(
      `Re-research: Member 2 returned ${research.candidates?.length || 0} candidates, selected: ${choice?.selected?.name || "none"}`
    );

    return {
      selectedSolution: choice?.selected || null,
      research: {
        triggered: true,
        request: {
          failedStrategy: request.failedStrategy,
          failureReason: request.failureReason,
          priority: request.priority || null
        },
        candidateCount: research.candidates?.length || 0,
        shortlist: research.shortlist || [],
        otherAlternatives: choice?.alternatives || [],
        meta: research.meta || {}
      }
    };
  } catch (err) {
    console.error("RE-RESEARCH ERROR:", err.message);
    return {
      selectedSolution: null,
      research: {
        triggered: true,
        error: err.message,
        request: { failedStrategy: request.failedStrategy, failureReason: request.failureReason }
      }
    };
  }
}

async function adapt(data) {
  /*
    Expected input:

    {
      "goal": {},
      "plan": {},
      "actual": {}
    }
  */

  // 1. Compare the plan with reality
  const reality = await analyzeReality({
    expected: data.plan,
    actual: data.actual
  });

  // 2. If everything is on track, no diagnosis/replanning is needed
  if (reality.status === "on_track") {
    return {
      stage: "monitor",
      reality,
      diagnosis: null,
      adaptation: {
        decision: "continue",
        reason: "Execution is currently on track.",
        newStrategy: data.plan.strategy || "",
        changes: [],
        newPhases: [],
        expectedImpact: "No changes required.",
        confidence: 1
      }
    };
  }

  // 3. Diagnose the deviation
  const diagnosis = await diagnose({
    plan: data.plan,
    reality
  });

  // 4. Decide how the system should adapt.
  //    If the strategy itself is affected, re-research alternatives (Member 2) BEFORE replanning.
  let research = null;
  let selectedSolution = null;
  let adaptation;

  if (diagnosis.strategyAffected === true) {
    ({ research, selectedSolution } = await reResearch(data, reality, diagnosis));
    adaptation = await replan({ goal: data.goal, plan: data.plan, reality, diagnosis, selectedSolution });
  } else {
    adaptation = await replan({ goal: data.goal, plan: data.plan, reality, diagnosis });

    // The replanner may still decide the strategy must change.
    if (adaptation.decision === "switch_strategy") {
      ({ research, selectedSolution } = await reResearch(data, reality, diagnosis));
      adaptation = await replan({ goal: data.goal, plan: data.plan, reality, diagnosis, selectedSolution });
    }
  }

  const result = {
    stage: "adapt",
    reality,
    diagnosis,
    adaptation
  };

  if (research) {
    result.research = research;
    result.selectedSolution = selectedSolution;
  }

  return result;
}

module.exports = {
  adapt
};
