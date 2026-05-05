import { ArrowUpRight } from "lucide-react"
import type { RankedCandidate } from "@/lib/rankCandidates"

export function RankedResults({
  ranked,
  heading,
  onOpen,
}: {
  ranked: RankedCandidate[]
  heading: string
  onOpen: (candidateId: string) => void
}) {
  return (
    <div className="rounded-[1.75rem] border border-[var(--pm-border)] bg-[var(--pm-card)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--pm-subtle)]">{heading}</div>
        <span className="rounded-full bg-[var(--pm-accent)] px-2 py-1 text-[10px] text-white">+{ranked.length}</span>
      </div>
      <div className="space-y-3">
        {ranked.map((result, index) => (
          <button
            key={result.candidate.id}
            type="button"
            onClick={() => onOpen(result.candidate.id)}
            className="group w-full rounded-2xl border border-[var(--pm-border)] bg-[var(--pm-chip)] p-4 text-left transition hover:-translate-y-0.5 hover:bg-[var(--pm-chip-hover)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--pm-subtle)]">#{index + 1}</span>
                  <div className="truncate text-sm text-[var(--pm-text)]">{result.candidate.name}</div>
                </div>
                <div className="mt-1 truncate text-xs text-[var(--pm-muted)]">{result.candidate.headline}</div>
                <p className="mt-3 text-xs leading-5 text-[var(--pm-muted)]">{result.reason}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(result.matchedSkills.length ? result.matchedSkills : result.candidate.skills.slice(0, 3)).map((skill) => (
                    <span key={skill} className="rounded-full bg-[var(--pm-card)] px-2.5 py-1 text-[10px] text-[var(--pm-muted)]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-2xl font-light text-[var(--pm-accent)]">{result.score}%</div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--pm-subtle)]">match</div>
                <div className="mt-3 text-[11px] text-[var(--pm-muted)]">proof {result.candidate.proofScore}%</div>
                <ArrowUpRight className="ml-auto mt-3 h-4 w-4 text-[var(--pm-muted)] transition group-hover:text-[var(--pm-text)]" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
