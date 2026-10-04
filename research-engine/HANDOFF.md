# Research Engine (Member 2) - Handoff to Member 1

Run it as a separate small service. Member 1's Decision Engine calls it over HTTP.

## Start
    npm install
    cp .env.example .env      # add GEMINI_API_KEY (TAVILY_API_KEY optional)
    npm start                 # http://localhost:4002
Set MOCK=true in .env to get instant fixed data while building/testing (no keys needed).

## 1) POST /research   (initial research AND re-research)
Request:
    {
      "goal": "Build a voice spoof detection system",
      "deadline": "4 days",
      "budget": 0,
      "resources": ["Laptop", "Google Colab"],
      "successCriteria": ["Good accuracy", "Working demo"],

      "failedStrategy": "AASIST + local training",   // only for re-research
      "failureReason": "setup time too high",        // only for re-research
      "deadlineRemaining": "18 hours",               // only for re-research
      "priority": "time"                             // optional: performance|complexity|cost|hardware|time|compatibility
    }

Response:
    {
            "candidates": [ { "name", "type", "solvesGoalDirectly", "source", "license", "setupNotes",
                        "scores": { "performance","complexity","cost","hardware","time","compatibility" },
                        "evidence": [ { "type": "published_benchmark|provider_claim|github_info|own_test", "text", "url" } ],
                        "suitability": 78, "unverifiedScores": [], "verified": true } ],
      "shortlist":  [ { "option": "A", "label": "Best overall", "name": "...", "suitability": 78 },
                      { "option": "B", "label": "Fastest", ... },
                      { "option": "C", "label": "Best accuracy", ... } ],
      "sources":    [ { "title", "url", "snippet" } ],
      "weights":    { ... },
      "meta":       { "usedFallback": false, "warnings": [] }
    }

Scores are 0-100, HIGHER IS BETTER (cost 100 = free, complexity 100 = very simple).
solvesGoalDirectly: false means a library, dataset or toolkit (supporting item only). Option A/B/C in the shortlist only contain complete solutions (true).
verified: true means at least one evidence URL came from a real web search result (needs TAVILY_API_KEY). false means no source link was found, not that the item is fake. Open the link yourself before trusting it.
Scores are estimates unless backed by an evidence item. null = unverified.

## 2) POST /compare   (re-score existing candidates, no new search)
Request:  same fields as above + "candidates": [ ...from /research... ]
Response: same shape as /research

## Errors
400 { "error": "goal is required" }  |  500 { "error": "research failed", "detail": "..." }
If Gemini fails, /research still returns 200 with meta.usedFallback = true.

## Example call from Member 1's Node.js code
    const r = await fetch("http://localhost:4002/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal, deadline, budget, resources, successCriteria })
    });
    const { candidates, shortlist } = await r.json();

## Re-research (Member 1 calls this inside /replan)
    body: JSON.stringify({ goal, deadline, budget, resources, successCriteria,
      failedStrategy: "AASIST + local training",
      failureReason: "setup time too high",
      deadlineRemaining: "18 hours" })
 Tip: after a failure, always send failedStrategy, failureReason and deadlineRemaining. Without them it behaves like a normal first research.     