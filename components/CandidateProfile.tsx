import { CalendarDays, CheckCircle2, MapPin } from "lucide-react"
import type { DemoCandidate } from "@/data/demoCandidates"
import { ScoreBadge } from "@/components/ScoreBadge"

export function CandidateProfile({ candidate }: { candidate: DemoCandidate }) {
  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-[var(--pm-border)] bg-[var(--pm-card)] p-6 shadow-[0_18px_60px_rgba(36,31,24,0.08)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--pm-subtle)]">Candidate profile</div>
            <h1 className="mt-2 text-3xl font-light tracking-tight text-[var(--pm-text)]">{candidate.name}</h1>
            <p className="mt-2 text-sm text-[var(--pm-muted)]">{candidate.headline}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-[var(--pm-muted)]">
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--pm-chip)] px-3 py-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {candidate.location}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--pm-chip)] px-3 py-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {candidate.availability}
              </span>
              <span className="rounded-full bg-[var(--pm-chip)] px-3 py-1.5">{candidate.workPreference}</span>
              <span className="rounded-full bg-[var(--pm-chip)] px-3 py-1.5">{candidate.salaryExpectation}</span>
            </div>
          </div>
          <div className="grid min-w-[300px] grid-cols-3 gap-3">
            <ScoreBadge label="Proof" value={candidate.proofScore} />
            <ScoreBadge label="Role match" value={candidate.roleMatchScore} />
            <ScoreBadge label="Simulation" value={candidate.simulationScore} />
          </div>
        </div>

        <p className="mt-6 max-w-4xl text-sm leading-6 text-[var(--pm-muted)]">{candidate.summary}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {candidate.skills.map((skill) => (
            <span key={skill} className="rounded-full bg-[var(--pm-chip)] px-3 py-1.5 text-xs text-[var(--pm-muted)]">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ProfileSection title="Strengths" items={candidate.strengths} positive />
        <ProfileSection title="Risks" items={candidate.risks} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[1.75rem] border border-[var(--pm-border)] bg-[var(--pm-card)] p-5">
          <div className="mb-4 text-[10px] uppercase tracking-[0.22em] text-[var(--pm-subtle)]">Evidence timeline</div>
          <div className="space-y-3">
            {candidate.evidence.map((item) => (
              <div key={item.id} className="rounded-2xl bg-[var(--pm-chip)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-[var(--pm-text)]">{item.title}</div>
                  <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--pm-subtle)]">{item.source}</div>
                </div>
                <div className="mt-1 text-[11px] text-[var(--pm-subtle)]">{item.date}</div>
                <p className="mt-2 text-xs leading-5 text-[var(--pm-muted)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-[var(--pm-border)] bg-[var(--pm-card)] p-5">
          <div className="mb-4 text-[10px] uppercase tracking-[0.22em] text-[var(--pm-subtle)]">Projects</div>
          <div className="space-y-3">
            {candidate.projects.map((project) => (
              <div key={project.name} className="rounded-2xl bg-[var(--pm-chip)] p-4">
                <div className="text-sm text-[var(--pm-text)]">{project.name}</div>
                <p className="mt-2 text-xs leading-5 text-[var(--pm-muted)]">{project.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.skills.slice(0, 4).map((skill) => (
                    <span key={skill} className="rounded-full bg-[var(--pm-card)] px-2.5 py-1 text-[10px] text-[var(--pm-muted)]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-[var(--pm-border)] bg-[var(--pm-card)] p-5">
        <div className="mb-4 text-[10px] uppercase tracking-[0.22em] text-[var(--pm-subtle)]">Interview history</div>
        <div className="grid gap-3 md:grid-cols-2">
          {candidate.interviews.map((interview) => (
            <div key={`${interview.stage}-${interview.date}`} className="rounded-2xl bg-[var(--pm-chip)] p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-[var(--pm-text)]">{interview.stage}</div>
                <div className="text-[10px] uppercase tracking-[0.12em] text-emerald-600">{interview.outcome}</div>
              </div>
              <div className="mt-1 text-[11px] text-[var(--pm-subtle)]">{interview.date}</div>
              <p className="mt-2 text-xs leading-5 text-[var(--pm-muted)]">{interview.notes}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProfileSection({ title, items, positive = false }: { title: string; items: string[]; positive?: boolean }) {
  return (
    <div className="rounded-[1.75rem] border border-[var(--pm-border)] bg-[var(--pm-card)] p-5">
      <div className="mb-4 text-[10px] uppercase tracking-[0.22em] text-[var(--pm-subtle)]">{title}</div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item} className="flex gap-3 rounded-2xl bg-[var(--pm-chip)] p-4 text-xs leading-5 text-[var(--pm-muted)]">
            <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${positive ? "text-emerald-600" : "text-[var(--pm-accent)]"}`} />
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
