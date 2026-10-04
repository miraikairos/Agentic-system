const FALLBACK_CANDIDATES = [
  {
    name: "AASIST",
    type: "Model",
    description:
      "Anti-spoofing model suitable for speech deepfake detection.",
    advantages: [
      "Strong anti-spoofing research basis",
      "Open-source implementation"
    ],
    limitations: [
      "GPU/resources may be required",
      "Setup can be complex"
    ],
    requirements: [
      "Python environment",
      "ASVspoof dataset"
    ],
    evidence: [
      "ICASSP 2022 / ASVspoof research"
    ],
    fitReason:
      "Useful when detection accuracy is more important than lightweight execution."
  },

  {
    name: "RawNet2",
    type: "Model",
    description:
      "Raw waveform anti-spoofing approach.",
    advantages: [
      "End-to-end waveform processing",
      "Research-backed approach"
    ],
    limitations: [
      "May require significant compute",
      "Model setup required"
    ],
    requirements: [
      "Python",
      "PyTorch",
      "Audio dataset/checkpoint"
    ],
    evidence: [
      "ICASSP anti-spoofing research"
    ],
    fitReason:
      "Alternative to AASIST when a different architecture is desired."
  },

  {
    name: "LFCC-GMM",
    type: "Model",
    description:
      "Lightweight classical audio anti-spoofing baseline.",
    advantages: [
      "CPU friendly",
      "Simple to implement",
      "Fast experimentation"
    ],
    limitations: [
      "May have lower performance than modern deep models"
    ],
    requirements: [
      "Python",
      "Audio preprocessing",
      "Scikit-learn"
    ],
    evidence: [
      "Classical ASVspoof baseline approach"
    ],
    fitReason:
      "Strong fallback when GPU resources are unavailable."
  },

  {
    name: "Hosted Detection API",
    type: "API",
    description:
      "Cloud-hosted detection service.",
    advantages: [
      "Minimal local hardware",
      "Fast integration"
    ],
    limitations: [
      "API limits",
      "Potential cost",
      "Internet dependency"
    ],
    requirements: [
      "API access",
      "Internet connection"
    ],
    evidence: [],
    fitReason:
      "Useful when local compute is insufficient."
  }
];

async function researchSolutions(data) {
  const url =
    process.env.RESEARCH_ENGINE_URL ||
    "http://localhost:4002";

  try {
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
      throw new Error(
        `Research Engine returned ${response.status}`
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

  } catch (error) {
    console.warn(
      "Research Engine unavailable:",
      error.message
    );

    // IMPORTANT:
    // Do not let Member 2 failure kill Member 1.
    return {
      candidates: FALLBACK_CANDIDATES,
      shortlist: FALLBACK_CANDIDATES.slice(0, 3),
      sources: [],
      weights: null,

      meta: {
        usedFallback: true,
        warnings: [
          `Research Engine unavailable: ${error.message}`,
          "Decision Engine used local fallback candidates."
        ]
      }
    };
  }
}

module.exports = {
  researchSolutions
};
