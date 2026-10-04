require("dotenv").config();

const express = require("express");
const cors = require("cors");

const decisionRoutes = require("./routes/decision");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Decision Engine is running"
  });
});

app.use("/", decisionRoutes);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Decision Engine running on http://localhost:${PORT}`);
});