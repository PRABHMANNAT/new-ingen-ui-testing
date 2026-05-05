import { DEMO_CANDIDATES, type DemoCandidate } from "@/data/demoCandidates"
import { rankCandidates, type RankedCandidate, tokenizeQuery } from "@/lib/rankCandidates"

export type CandidateSearchResult =
  | { type: "empty"; query: ""; ranked: RankedCandidate[] }
  | { type: "profile"; query: string; candidate: DemoCandidate; ranked: RankedCandidate[] }
  | { type: "ranked"; query: string; ranked: RankedCandidate[]; exactCandidate?: DemoCandidate }
  | { type: "no-exact"; query: string; ranked: RankedCandidate[] }

function candidateHaystack(candidate: DemoCandidate) {
  return [
    candidate.name,
    candidate.headline,
    candidate.targetRole,
    candidate.currentCompany,
    candidate.githubUsername,
    candidate.portfolioUrl,
    candidate.linkedinUrl,
    candidate.email,
    candidate.summary,
    ...candidate.skills,
    ...candidate.projects.map((project) => `${project.name} ${project.description} ${project.skills.join(" ")}`),
  ].join(" ").toLowerCase()
}

export function findExactCandidate(query: string, candidates = DEMO_CANDIDATES): DemoCandidate | undefined {
  const normalizedQuery = query.toLowerCase().trim()
  if (!normalizedQuery) return undefined

  const githubMatch = normalizedQuery.match(/github\.com\/([a-z0-9-]+)/i)
  const githubUsername = githubMatch?.[1] ?? normalizedQuery.replace(/^@/, "")

  return candidates.find((candidate) => {
    const name = candidate.name.toLowerCase()
    return (
      normalizedQuery === name ||
      normalizedQuery.includes(name) ||
      candidate.githubUsername.toLowerCase() === githubUsername ||
      normalizedQuery.includes(`github.com/${candidate.githubUsername.toLowerCase()}`) ||
      normalizedQuery === candidate.email.toLowerCase()
    )
  })
}

export function searchCandidates(query: string, candidates = DEMO_CANDIDATES): CandidateSearchResult {
  const cleanQuery = query.trim()
  const ranked = rankCandidates(candidates, cleanQuery).slice(0, 8)

  if (!cleanQuery) {
    return { type: "empty", query: "", ranked }
  }

  const exactCandidate = findExactCandidate(cleanQuery, candidates)
  if (exactCandidate) {
    return { type: "profile", query: cleanQuery, candidate: exactCandidate, ranked }
  }

  const tokens = tokenizeQuery(cleanQuery)
  const topScore = ranked[0]?.score ?? 0
  const anyContentMatch = candidates.some((candidate) => {
    const haystack = candidateHaystack(candidate)
    return tokens.some((token) => haystack.includes(token))
  })

  if (anyContentMatch || topScore >= 42) {
    return { type: "ranked", query: cleanQuery, ranked }
  }

  return { type: "no-exact", query: cleanQuery, ranked }
}
