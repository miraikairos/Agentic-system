// Backup data for MOCK mode or when Gemini fails. Scores are rough ESTIMATES, not measured benchmarks.
// Evidence is qualitative on purpose: we do not invent performance numbers.
export const FALLBACK_CANDIDATES = [
  {
    name: "AASIST (official repo, local training)",
    type: "Model",
    source: "GitHub",
    license: "check repo",
    setupNotes: "Needs dataset download and training; GPU strongly recommended.",
    scores: { performance: 85, complexity: 45, cost: 100, hardware: 45, time: 30, compatibility: 80 },
    scoreBasis: "estimate",
    evidence: [
      { type: "published_benchmark", text: "Published at ICASSP 2022 and evaluated on the ASVspoof 2019 LA dataset.", url: null },
      { type: "github_info", text: "Official implementation with training and evaluation scripts on GitHub (clovaai/aasist).", url: "https://github.com/clovaai/aasist" },
    ],
  },
  {
    name: "Wav2Vec2 front-end + classifier (pretrained)",
    type: "Model",
    source: "Hugging Face / GitHub",
    license: "check model card",
    setupNotes: "Pretrained speech encoder with a light classifier head; can run in Colab.",
    scores: { performance: 82, complexity: 60, cost: 100, hardware: 60, time: 55, compatibility: 90 },
    scoreBasis: "estimate",
    evidence: [
      { type: "published_benchmark", text: "Tak et al. (2022) combined wav2vec 2.0 with data augmentation for spoofing and deepfake detection.", url: null },
    ],
  },
  {
    name: "RawNet2",
    type: "Model",
    source: "GitHub",
    license: "check repo",
    setupNotes: "Raw-waveform model, lighter than AASIST but still needs training or a checkpoint.",
    scores: { performance: 72, complexity: 60, cost: 100, hardware: 65, time: 50, compatibility: 80 },
    scoreBasis: "estimate",
    evidence: [
      { type: "published_benchmark", text: "Tak et al., ICASSP 2021, end-to-end anti-spoofing with RawNet2.", url: null },
    ],
  },
  {
    name: "Hosted voice-deepfake detection API (free tier)",
    type: "API",
    source: "Provider website",
    license: "provider terms",
    setupNotes: "Fastest to integrate, but free-tier limits and accuracy claims need to be verified with our own test.",
    scores: { performance: null, complexity: 90, cost: 70, hardware: 100, time: 90, compatibility: 85 },
    scoreBasis: "estimate",
    evidence: [
      { type: "provider_claim", text: "Providers advertise high accuracy; not independently verified. Run our own test before trusting it.", url: null },
    ],
  },
];