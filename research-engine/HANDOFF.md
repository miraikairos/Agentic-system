# Research Engine (Member 2) - Handoff to Member 1

Run it as a separate small service. Member 1's Decision Engine calls it over HTTP.

## Start
    npm install
    cp .env.example .env      # add GEMINI_API_KEY (TAVILY_API_KEY optional)
    npm start                 # http://localhost:4002
Set MOCK=true in .env for instant GENERIC strategy archetypes while testing (no keys needed, no domain-specific data).

## 1) POST /research   (initial research AND re-research)
Request:
    {
      "goal": "Build an AI chatbot",
      "deadline": "4 days",
      "budget": 0,
      "resources": ["Laptop", "Google Colab"],
      "successCriteria": ["Good accuracy", "Working demo"],

      "failedStrategy": "<the strategy that failed>",   // only for re-research
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
      "meta":       { "usedFallback": false, "genericFallback": false, "researchFailed": false, "model": "...", "warnings": [] }
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
If Gemini research fails (after retries), /research returns 503 { "error": "research_unavailable", "detail", "meta": { "usedFallback": true, "researchFailed": true, "warnings": [...] } }.
It never returns candidates that were not researched for the given goal. With ALLOW_GENERIC_FALLBACK=true it returns 200 with three domain-neutral strategy archetypes instead, flagged meta.genericFallback = true (no scores, no evidence).
All Gemini calls use GEMINI_MODEL (default gemini-3.8-flash).

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
