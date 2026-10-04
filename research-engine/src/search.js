// Tavily web search. Returns [] if no key or on any error, so the pipeline never crashes.
export async function webSearch(query, max = 5) {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];
  try {
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ query, max_results: max, search_depth: "basic" }),
    });
    if (!r.ok) throw new Error(`Tavily responded ${r.status}`);
    const data = await r.json();
    return (data.results || []).map((x) => ({
      title: x.title,
      url: x.url,
      snippet: (x.content || "").slice(0, 600),
    }));
  } catch (e) {
    console.warn("search failed:", e.message);
    return [];
  }
}