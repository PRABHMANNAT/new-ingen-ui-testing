import { Github } from "lucide-react"
import type { DemoCandidate } from "@/data/demoCandidates"

export type GitHubEvidence = {
  username: string
  name: string | null
  bio: string | null
  followers: number
  publicRepos: number
  topRepos: Array<{ name: string; description: string | null; language: string | null; stars: number; url: string }>
  languages: string[]
  githubEvidenceSummary: string
  source: "github" | "demo"
}

export function GitHubEvidencePanel({ candidate, evidence }: { candidate: DemoCandidate; evidence: GitHubEvidence | null }) {
  const demoEvidence: GitHubEvidence = {
    username: candidate.githubUsername,
    name: candidate.name,
    bio: candidate.summary,
    followers: 180 + candidate.experienceYears * 24,
    publicRepos: 24 + candidate.projects.length,
    topRepos: candidate.projects.map((project, index) => ({
      name: project.name,
      description: project.description,
      language: project.skills[0] ?? null,
      stars: 80 - index * 18,
      url: project.url ?? candidate.portfolioUrl,
    })),
    languages: candidate.skills.slice(0, 5),
    githubEvidenceSummary: `${candidate.githubUsername} has demo evidence across ${candidate.projects.map((project) => project.name).join(", ")}.`,
    source: "demo",
  }
  const active = evidence ?? demoEvidence

  return (
    <div className="rounded-[1.75rem] border border-[var(--pm-border)] bg-[var(--pm-card)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--pm-subtle)]">
          <Github className="h-4 w-4 text-[var(--pm-accent)]" />
          GitHub Evidence
        </div>
        <span className="rounded-full bg-[var(--pm-chip)] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--pm-muted)]">
          {active.source}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric label="Repos" value={String(active.publicRepos)} />
        <Metric label="Followers" value={String(active.followers)} />
      </div>

      <p className="mt-4 text-xs leading-5 text-[var(--pm-muted)]">{active.githubEvidenceSummary}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {active.languages.slice(0, 6).map((language) => (
          <span key={language} className="rounded-full bg-[var(--pm-chip)] px-3 py-1 text-[11px] text-[var(--pm-muted)]">
            {language}
          </span>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {active.topRepos.slice(0, 3).map((repo) => (
          <div key={repo.name} className="rounded-xl border border-[var(--pm-border)] bg-[var(--pm-chip)] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="truncate text-xs text-[var(--pm-text)]">{repo.name}</div>
              <div className="shrink-0 text-[11px] text-[var(--pm-muted)]">{repo.stars} stars</div>
            </div>
            <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-[var(--pm-muted)]">{repo.description ?? "No description available."}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--pm-chip)] p-3">
      <div className="text-xl font-light text-[var(--pm-text)]">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--pm-subtle)]">{label}</div>
    </div>
  )
}
