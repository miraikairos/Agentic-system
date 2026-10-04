/*
  /research passthrough to the Research Engine.
  There is no local candidate list: candidates must be researched for the user's goal.
  If the Research Engine fails, this throws so the caller sees the real reason.
*/
async function researchSolutions(data) {
  const url =
    process.env.RESEARCH_ENGINE_URL ||
    "http://localhost:4002";

  const response = await fetch(
    `${url}/research`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        goal: data.goal,
        deadline:
          data.constraints?.deadline ||
          data.deadline,
        budget:
          data.constraints?.budget ||
          data.budget,
        resources:
          data.resources || [],
        successCriteria:
          data.successCriteria || []
      })
    }
  );

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = [
        body.detail || body.message || body.error,
        ...((body.meta && body.meta.warnings) || [])
      ]
        .filter(Boolean)
        .join("; ");
    } catch (e) {
      /* body was not JSON */
    }

    throw new Error(
      `Research Engine returned ${response.status}` +
        (detail ? `: ${detail}` : "")
    );
  }

  const result = await response.json();

  if (
    !result ||
    !Array.isArray(result.candidates) ||
    result.candidates.length === 0
  ) {
    throw new Error(
      "Research Engine returned no candidates"
    );
  }

  return result;
}

module.exports = {
  researchSolutions
};
