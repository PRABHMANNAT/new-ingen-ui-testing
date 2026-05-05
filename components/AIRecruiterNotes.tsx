import type { DemoCandidate } from "@/data/demoCandidates"

export type RecruiterNotes = {
  recruiterSummary: string
  fitReasoning: string
  interviewQuestions: string[]
  riskNotes: string
  nextStep: string
  source: "openai" | "mock"
}

export function AIRecruiterNotes({ candidate, notes }: { candidate: DemoCandidate; notes: RecruiterNotes | null }) {
  const active = notes ?? {
    recruiterSummary: candidate.notes.whyThisCandidate,
    fitReasoning: candidate.summary,
    interviewQuestions: [
      candidate.notes.bestInterviewAngle,
      "Which project best represents your current level of ownership?",
      "Where is the evidence weakest, and how would you verify it?",
    ],
    riskNotes: candidate.notes.potentialConcerns,
    nextStep: candidate.notes.suggestedNextStep,
    source: "mock" as const,
  }

  return (
    <div className="rounded-[1.75rem] border border-[var(--pm-border)] bg-[var(--pm-card)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--pm-subtle)]">AI Recruiter Notes</div>
        <span className="rounded-full bg-[var(--pm-chip)] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--pm-muted)]">
          {active.source}
        </span>
      </div>

      <div className="space-y-4">
        <NoteBlock title="Why this candidate" body={active.recruiterSummary} />
        <NoteBlock title="Fit reasoning" body={active.fitReasoning} />
        <NoteBlock title="Potential concerns" body={active.riskNotes} />
        <NoteBlock title="Suggested next step" body={active.nextStep} />
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--pm-subtle)]">Interview questions</div>
          <div className="mt-2 space-y-2">
            {active.interviewQuestions.slice(0, 3).map((question) => (
              <div key={question} className="rounded-xl bg-[var(--pm-chip)] p-3 text-xs leading-5 text-[var(--pm-muted)]">
                {question}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function NoteBlock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--pm-subtle)]">{title}</div>
      <p className="mt-1 text-xs leading-5 text-[var(--pm-muted)]">{body}</p>
    </div>
  )
}
