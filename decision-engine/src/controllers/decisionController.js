const { adapt } = require("../services/adaptation");
const { replan } = require("../services/replanner");
const { analyzeGoal } = require("../services/goalAnalyzer");
const { generatePlan } = require("../services/planner");
const { diagnose } = require("../services/diagnosis");
const { researchSolutions } = require("../services/researchEngine");
const { analyzeReality } = require("../services/realityAnalyzer");
const analyzeGoalController = async (req, res) => {
  try {
    const {
      goal,
      deadline,
      budget,
      resources,
      successCriteria
    } = req.body;

    if (!goal) {
      return res.status(400).json({
        error: "Goal is required"
      });
    }

    const result = await analyzeGoal({
      goal,
      deadline,
      budget,
      resources,
      successCriteria
    });

    res.json(result);

  } catch (error) {
    console.error("GOAL ANALYSIS ERROR:", error);

    res.status(500).json({
      error: error.message
    });
  }
};
const createPlan = async (req, res) => {
  try {
    const result = await generatePlan(req.body);

    res.json(result);

  } catch (error) {
    console.error("PLAN GENERATION ERROR:", error);

    res.status(500).json({
      error: error.message
    });
  }
};
const analyzeRealityController = async (req, res) => {
  try {
    const result = await analyzeReality(req.body);

    res.json(result);

  } catch (error) {
    console.error("REALITY ANALYSIS ERROR:", error);

    res.status(500).json({
      error: error.message
    });
  }
};
const diagnoseController = async (req, res) => {
  try {
    const result = await diagnose(req.body);

    res.json(result);

  } catch (error) {
    console.error("DIAGNOSIS ERROR:", error);

    res.status(500).json({
      error: error.message
    });
  }
};
const replanController = async (req, res) => {
  try {
    const result = await replan(req.body);

    res.json(result);

  } catch (error) {
    console.error("REPLAN ERROR:", error);

    res.status(500).json({
      error: error.message
    });
  }
};
const adaptController = async (req, res) => {
  try {
    const result = await adapt(req.body);

    res.json(result);

  } catch (error) {
    console.error("ADAPTATION ERROR:", error);

    res.status(500).json({
      error: error.message
    });
  }
};
async function researchController(req, res) {
  try {
    const result = await researchSolutions(req.body);

    res.json(result);
  } catch (error) {
    console.error("Research error:", error);

    res.status(500).json({
      error: "Research failed",
      message: error.message
    });
  }
}
module.exports = {
  analyzeGoal: analyzeGoalController,
  createPlan,
  analyzeReality: analyzeRealityController,
  diagnose: diagnoseController,
  replan: replanController,
  adapt: adaptController,
  research: researchController
};