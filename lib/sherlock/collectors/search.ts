import type { SherlockEvidence } from "../types"
import { fetchJsonWithTimeout } from "../collector-utils"

type BraveSearchResponse = {
  web?: {
    results?: Array<{
      title?: string
      url?: string
      description?: string
      age?: string
      profile?: { name?: string }
    }>
  }
}

export function isSearchConfigured() {
  return Boolean(process.env.BRAVE_SEARCH_API_KEY)
}

export async function collectSearch(query: string): Promise<SherlockEvidence[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY
  if (!apiKey) {
    return [
      {
        id: `ev-search-disabled-${slug(query)}`,
        sourceType: "untrusted_search_hit",
        sourceName: "Search API",
        retrievedAt: new Date().toISOString(),
        summary: "Search collection skipped because no approved search API key is configured.",
        details: ["Set BRAVE_SEARCH_API_KEY to enable this collector."],
        reliability: "untrusted_search_hit",
        normalizedJson: { query, disabled: true },
      },
    ]
  }

  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`
  const result = await fetchJsonWithTimeout<BraveSearchResponse>(url, {
    rateLimitKey: "brave-search",
    rateLimit: 10,
    headers: { "X-Subscription-Token": apiKey },
  })

  if (!result.ok) {
    return [
      {
        id: `ev-search-unavailable-${slug(query)}`,
        sourceType: "untrusted_search_hit",
        sourceName: "Search API",
        sourceUrl: url,
        retrievedAt: result.retrievedAt,
        summary: "Search API collection failed.",
        details: [result.error],
        reliability: "untrusted_search_hit",
        normalizedJson: { query, error: result.error },
      },
    ]
  }

  const results = result.data.web?.results ?? []
  return [
    {
      id: `ev-search-${slug(query)}`,
      sourceType: "untrusted_search_hit",
      sourceName: "Search API",
      sourceUrl: result.sourceUrl,
      retrievedAt: result.retrievedAt,
      rawSnapshotRef: result.rawSnapshotRef,
      summary: `Search returned ${results.length} result${results.length === 1 ? "" : "s"}. Fetch and normalize a result before treating it as evidence.`,
      details: results.map((entry) => `${entry.title ?? "Untitled"} - ${entry.url ?? "no url"}`),
      reliability: "untrusted_search_hit",
      normalizedJson: {
        query,
        results: results.map((entry) => ({
          title: entry.title,
          url: entry.url,
          description: entry.description,
          age: entry.age,
          sourceName: entry.profile?.name,
        })),
      },
    },
  ]
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "query"
}
