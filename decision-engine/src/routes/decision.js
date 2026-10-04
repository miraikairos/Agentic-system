const express = require("express");

const {
  analyzeGoal,
  createPlan,
  analyzeReality,
  diagnose,
  replan,
  adapt,
  research
} = require("../controllers/decisionController");
const router = express.Router();
router.post("/diagnose", diagnose);
router.post("/analyze", analyzeGoal);
router.post("/plan", createPlan);
router.post("/reality", analyzeReality);
router.post("/replan", replan);
router.post("/adapt", adapt);
router.post("/research", research);
module.exports = router;