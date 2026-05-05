"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, CheckCircle2, Clipboard, Clock3, Copy, Flag, MessageSquare, ShieldCheck } from "lucide-react"
import { AffiliationLogoChip } from "@/components/interviews/AffiliationLogoChip"
import { useAppTheme } from "@/components/theme/ThemeProvider"
import { DEMO_CANDIDATES, type DemoCandidate } from "@/data/demoCandidates"

type Duration = 15 | 30 | 60

function getPackTheme(isDark: boolean) {
  return {
    page: isDark ? "bg-[#050505] text-white" : "bg-[#F7F2EA] text-[#2A2520]",
    grid: isDark
      ? "bg-[linear-gradient(to_right,#1A1A1A_1px,transparent_1px),linear-gradient(to_bottom,#1A1A1A_1px,transparent_1px)] opacity-55"
      : "bg-[linear-gradient(to_right,#DED4C733_1px,transparent_1px),linear-gradient(to_bottom,#DED4C733_1px,transparent_1px)] opacity-35",
    card: isDark
      ? "border-[#242424] bg-[#101010] shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
      : "border-[#DED4C7] bg-[#FBF7EF] shadow-[0_18px_50px_rgba(42,37,32,0.06)]",
    inner: isDark
      ? "border-[#242424] bg-[#171717]"
      : "border-[#DED4C7] bg-[#FFFDF8]",
    mutedBox: isDark ? "bg-[#1C1C1C]" : "bg-[#EEE8DF]/70",
    text: isDark ? "text-white" : "text-[#2A2520]",
    muted: isDark ? "text-[#A0A0A0]" : "text-[#7A7168]",
    faint: isDark ? "text-[#777]" : "text-[#8A8177]",
    border: isDark ? "border-[#242424]" : "border-[#DED4C7]",
    buttonSecondary: isDark
      ? "border-[#242424] bg-[#171717] text-[#A0A0A0] hover:bg-[#222]"
      : "border-[#DED4C7] bg-[#FBF7EF] text-[#7A7168] hover:bg-[#EEE8DF]",
    selectedButton: isDark
      ? "border-[#FF6A00] bg-[#3A1E0E] text-[#FF8C33]"
      : "border-[#FF6A00] bg-[#FFE1C7] text-[#FF6A00]",
  }
}

type PackTheme = ReturnType<typeof getPackTheme>

const durationPlans: Record<Duration, Array<{ title: string; minutes: string; focus: string; questions: string[] }>> = {
  15: [
    {
      title: "Proof calibration",
      minutes: "0-5",
      focus: "Confirm the strongest evidence and role context.",
      questions: ["Which project best represents your current backend judgment?", "What part of that work would you rebuild differently now?"],
    },
    {
      title: "Risk probe",
      minutes: "5-12",
      focus: "Probe one concern from Sherlock's profile.",
      questions: ["Where is the evidence weakest for this role?", "Tell me about a time you had to debug under unclear ownership."],
    },
    {
      title: "Close",
      minutes: "12-15",
      focus: "Confirm motivation and next step.",
      questions: ["What would you want to learn in the first 30 days here?"],
    },
  ],
  30: [
    {
      title: "Opening calibration",
      minutes: "0-5",
      focus: "Set role context and let the candidate anchor on proof.",
      questions: ["Walk me through the proof source you are most confident in.", "What does that project prove about your readiness for this role?"],
    },
    {
      title: "Technical deep dive",
      minutes: "5-18",
      focus: "Evaluate architecture, tradeoffs, and debugging maturity.",
      questions: ["What were the failure modes you designed around?", "How did you choose between simplicity and scale?", "What metrics would tell you this system is unhealthy?"],
    },
    {
      title: "Collaboration and risk",
      minutes: "18-25",
      focus: "Validate team habits and missing evidence.",
      questions: ["Where did you need feedback or review?", "What evidence is missing from your profile that we should not over-assume?"],
    },
    {
      title: "Candidate close",
      minutes: "25-30",
      focus: "Motivation, availability, and next step.",
      questions: ["What type of team would get your best work?", "What questions do you have about the role or bar?"],
    },
  ],
  60: [
    {
      title: "Role framing",
      minutes: "0-8",
      focus: "Align on the target role and candidate's proof narrative.",
      questions: ["Which proof source should we treat as your strongest signal?", "What role would you not want us to infer from this evidence?"],
    },
    {
      title: "Evidence walkthrough",
      minutes: "8-22",
      focus: "Walk through projects, ownership, and technical decisions.",
      questions: ["Draw the architecture at a high level.", "What did you personally own?", "What changed after feedback or production use?"],
    },
    {
      title: "Scenario simulation",
      minutes: "22-42",
      focus: "Run a realistic role scenario tied to the candidate's evidence.",
      questions: ["A queue is backing up and retries are amplifying load. How do you triage?", "What do you log, measure, and change first?", "How would you explain the tradeoff to a product lead?"],
    },
    {
      title: "Risk and reference check",
      minutes: "42-52",
      focus: "Probe red flags and collaboration evidence.",
      questions: ["Where have you had the least exposure?", "Tell me about a project where another engineer disagreed with your approach."],
    },
    {
      title: "Close and sell",
      minutes: "52-60",
      focus: "Answer candidate questions and confirm mutual fit.",
      questions: ["What would make this role a strong fit for you?", "What evidence would you want from us before accepting an offer?"],
    },
  ],
}

export default function InterviewPackPage() {
  const router = useRouter()
  const params = useParams<{ candidateId: string }>()
  const { theme } = useAppTheme()
  const isDark = theme === "dark"
  const packTheme = getPackTheme(isDark)
  const [duration, setDuration] = useState<Duration>(30)
  const [copied, setCopied] = useState(false)
  const candidate = useMemo(
    () => DEMO_CANDIDATES.find((item) => item.id === params.candidateId) || DEMO_CANDIDATES.find((item) => item.name === "Alex Rivera")!,
    [params.candidateId]
  )
  const plan = durationPlans[duration]
  const affiliations = candidate.affiliations?.slice(0, 6) ?? []

  async function copyPlan() {
    const text = buildPlanText(candidate, duration, plan)
    await navigator.clipboard?.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <main className={`h-screen min-w-0 overflow-y-auto overflow-x-hidden px-10 py-9 font-mono ${packTheme.page}`}>
      <div className={`pointer-events-none fixed inset-0 bg-[size:32px_32px] ${packTheme.grid}`} />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative mx-auto max-w-[1180px] pb-20">
        <button
          onClick={() => router.back()}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] shadow-[0_12px_35px_rgba(42,37,32,0.08)] transition ${packTheme.buttonSecondary}`}
        >
          <ArrowLeft size={15} />
          Profile
        </button>

        <section className="mt-7 grid grid-cols-[1fr_340px] gap-8">
          <div>
            <p className={`text-[12px] font-black uppercase tracking-[0.34em] ${packTheme.faint}`}>Interview packet</p>
            <h1 className={`mt-3 text-[58px] font-black leading-[0.92] tracking-[-0.08em] ${packTheme.text}`}>{candidate.name}</h1>
            <p className={`mt-5 max-w-[780px] text-[15px] font-bold leading-7 tracking-[-0.035em] ${packTheme.muted}`}>
              Proof-led interview plan for {candidate.targetRole}. Use this to validate evidence, probe risks, and close with a clear next decision.
            </p>
            {affiliations.length ? (
              <div className="mt-6 flex max-w-[820px] flex-wrap gap-2.5">
                {affiliations.map((affiliation) => (
                  <AffiliationLogoChip key={affiliation.id} affiliation={affiliation} />
                ))}
              </div>
            ) : null}
          </div>

          <aside className={`rounded-[30px] border p-5 ${packTheme.card}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.28em] ${packTheme.faint}`}>Plan length</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[15, 30, 60].map((option) => (
                <button
                  key={option}
                  onClick={() => setDuration(option as Duration)}
                  className={[
                    "rounded-[16px] border px-3 py-3 text-[12px] font-black uppercase tracking-[0.14em] transition",
                    duration === option
                      ? packTheme.selectedButton
                      : packTheme.buttonSecondary,
                  ].join(" ")}
                >
                  {option}m
                </button>
              ))}
            </div>
            <button
              onClick={copyPlan}
              className={[
                "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[20px] border px-5 py-4 text-[11px] font-black uppercase tracking-[0.22em] transition hover:scale-[1.01]",
                isDark
                  ? "border-[#333] bg-[#F5F5F5] text-[#111]"
                  : "border-[#2A2520] bg-[#2A2520] text-[#FFFDF8] hover:border-[#FF6A00] hover:bg-[#FF6A00]",
              ].join(" ")}
            >
              {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy plan"}
            </button>
          </aside>
        </section>

        <section className="mt-8 grid grid-cols-[1fr_340px] gap-8">
          <div className="space-y-5">
            {plan.map((section) => (
              <article key={section.title} className={`rounded-[30px] border p-6 ${packTheme.card}`}>
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#FF6A00]">{section.minutes} min</p>
                    <h2 className={`mt-2 text-[28px] font-black tracking-[-0.08em] ${packTheme.text}`}>{section.title}</h2>
                    <p className={`mt-3 text-[13px] font-bold leading-6 tracking-[-0.03em] ${packTheme.muted}`}>{section.focus}</p>
                  </div>
                  <Clock3 className={`mt-1 ${packTheme.faint}`} size={22} />
                </div>
                <div className="mt-5 space-y-3">
                  {section.questions.map((question) => (
                    <div key={question} className={`rounded-[22px] border px-4 py-3 text-[13px] font-bold leading-6 tracking-[-0.03em] ${packTheme.inner} ${packTheme.text}`}>
                      {question}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <aside className="space-y-5">
            <PacketPanel icon={ShieldCheck} title="Evidence context" packTheme={packTheme} isDark={isDark}>
              {candidate.proofProjects?.slice(0, 3).map((project) => (
                <p key={project.name}>{project.name}: {project.description}</p>
              )) || candidate.projects.slice(0, 3).map((project) => <p key={project.name}>{project.name}: {project.description}</p>)}
            </PacketPanel>

            <PacketPanel icon={Flag} title="Red flags" packTheme={packTheme} isDark={isDark} tone="red">
              {candidate.risks.map((risk) => (
                <p key={risk}>{risk}</p>
              ))}
            </PacketPanel>

            <PacketPanel icon={MessageSquare} title="Closing questions" packTheme={packTheme} isDark={isDark}>
              <p>What would make this role clearly worth pursuing?</p>
              <p>What evidence should we verify before a final round?</p>
              <p>What kind of team environment helps you do your best work?</p>
            </PacketPanel>

            <PacketPanel icon={Clipboard} title="Interviewer notes" packTheme={packTheme} isDark={isDark}>
              <p>Score proof depth, communication clarity, ownership, and risk resolution. End with a clear hire/no-hire recommendation.</p>
            </PacketPanel>
          </aside>
        </section>
      </motion.div>
    </main>
  )
}

function PacketPanel({
  icon: Icon,
  title,
  children,
  packTheme,
  isDark,
  tone = "default",
}: {
  icon: typeof ShieldCheck
  title: string
  children: React.ReactNode
  packTheme: PackTheme
  isDark: boolean
  tone?: "default" | "red"
}) {
  const panelClass =
    tone === "red"
      ? isDark
        ? "border-[#4A1F1C] bg-[#150908] shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
        : "border-[#FFC7C3] bg-[#FFF7F6] shadow-[0_14px_40px_rgba(42,37,32,0.06)]"
      : packTheme.card
  const iconClass = isDark ? "bg-[#3A1E0E] text-[#FF8C33]" : "bg-[#FFE1C7] text-[#FF6A00]"
  const bodyClass =
    tone === "red"
      ? isDark
        ? "text-[#FF8A80] [&>p]:border-[#4A1F1C] [&>p]:bg-[#1C0D0B] [&>p]:text-[#FF8A80]"
        : "text-[#7A4B47] [&>p]:border-[#FFC7C3] [&>p]:bg-[#FFFDF8] [&>p]:text-[#7A4B47]"
      : packTheme.muted

  return (
    <section className={`rounded-[28px] border p-5 ${panelClass}`}>
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-2xl ${iconClass}`}>
          <Icon size={18} />
        </div>
        <p className={`text-[11px] font-black uppercase tracking-[0.24em] ${packTheme.faint}`}>{title}</p>
      </div>
      <div
        className={[
          "mt-4 space-y-3 text-[12px] font-bold leading-6 tracking-[-0.03em]",
          tone === "red" ? "[&>p]:rounded-[18px] [&>p]:border [&>p]:px-4 [&>p]:py-3" : "",
          bodyClass,
        ].join(" ")}
      >
        {children}
      </div>
    </section>
  )
}

function buildPlanText(candidate: DemoCandidate, duration: Duration, plan: Array<{ title: string; minutes: string; focus: string; questions: string[] }>) {
  return [
    `Interview Pack: ${candidate.name}`,
    `Role: ${candidate.targetRole}`,
    `Duration: ${duration} minutes`,
    "",
    ...plan.flatMap((section) => [
      `${section.minutes} min - ${section.title}`,
      section.focus,
      ...section.questions.map((question) => `- ${question}`),
      "",
    ]),
    "Red flags:",
    ...candidate.risks.map((risk) => `- ${risk}`),
  ].join("\n")
}
