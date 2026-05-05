import type { DemoCandidate } from "@/data/demoCandidates"

export type RankedCandidate = {
  candidate: DemoCandidate
  score: number
  matchedSkills: string[]
  reason: string
}

const STOP_WORDS = new Set(["find", "with", "and", "or", "the", "a", "an", "for", "in", "of", "to", "candidate", "candidates", "profile"])

export function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/https?:\/\//g, " ")
    .replace(/github\.com\//g, " ")
    .split(/[^a-z0-9+#.]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
}

function normalized(value: string) {
  return value.toLowerCase()
}

function includesToken(value: string, token: string) {
  return normalized(value).includes(token)
}

export function rankCandidates(candidates: DemoCandidate[], query: string): RankedCandidate[] {
  const tokens = tokenizeQuery(query)
  if (tokens.length === 0) {
    return candidates
      .slice()
      .sort((a, b) => b.proofScore + b.simulationScore - (a.proofScore + a.simulationScore))
      .slice(0, 8)
      .map((candidate) => ({
        candidate,
        score: Math.round((candidate.proofScore * 0.58) + (candidate.simulationScore * 0.24) + (candidate.roleMatchScore * 0.18)),
        matchedSkills: candidate.skills.slice(0, 3),
        reason: "High proof density and strong simulation signal.",
      }))
  }

  return candidates
    .map((candidate) => {
      const fields = [
        candidate.name,
        candidate.headline,
        candidate.targetRole,
        candidate.currentCompany,
        candidate.githubUsername,
        candidate.summary,
        ...candidate.projects.map((project) => `${project.name} ${project.description}`),
      ]

      const matchedSkills = candidate.skills.filter((skill) => tokens.some((token) => includesToken(skill, token) || includesToken(token, skill.toLowerCase())))
      const fieldMatches = tokens.filter((token) => fields.some((field) => includesToken(field, token))).length
      const roleMatches = tokens.filter((token) => includesToken(candidate.targetRole, token) || includesToken(candidate.headline, token)).length
      const projectMatches = tokens.filter((token) => candidate.projects.some((project) => includesToken(project.name, token) || includesToken(project.description, token))).length

      const rawScore =
        matchedSkills.length * 16 +
        fieldMatches * 8 +
        roleMatches * 10 +
        projectMatches * 9 +
        candidate.proofScore * 0.34 +
        candidate.simulationScore * 0.18 +
        candidate.roleMatchScore * 0.14

      const score = Math.min(99, Math.round(rawScore))
      const reason =
        matchedSkills.length > 0
          ? `Matches ${matchedSkills.slice(0, 3).join(", ")} with ${candidate.proofScore}% proof score.`
          : `Closest evidence match based on ${candidate.targetRole.toLowerCase()} proof and project history.`

      return { candidate, score, matchedSkills: matchedSkills.slice(0, 4), reason }
    })
    .sort((a, b) => b.score - a.score)
}
