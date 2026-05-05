export type GeneratedJobBrief = {
  title: string
  companyContext: string
  linkedinPost: string
  fullJobDescription: {
    roleTitle: string
    intro: string
    responsibilities: string[]
    mustHave: string[]
    niceToHave: string[]
    first30Days: string[]
    interviewSignals: string[]
    compensation: string
    workStyle: string
    applicationCTA: string
  }
  candidateSearchQuery: string
}

export type JobBriefContext = {
  role?: string
  stage?: string
  budget?: string
  urgency?: string
  mustHave?: string
  niceToHave?: string
  workStyle?: string
  firstThirtyDays?: string
}

function normalizeList(value?: string): string[] {
  if (!value) return []
  return value
    .split(/,|\n/)
    .map((x) => x.trim())
    .filter(Boolean)
}

export function buildGeneratedJobBrief(context: JobBriefContext): GeneratedJobBrief {
  const role = context.role || "Software Engineer"
  const stage = context.stage || "early-stage startup"
  const budget = context.budget || "Competitive, based on experience"
  const urgency = context.urgency || "next 4–8 weeks"
  const workStyle = context.workStyle || "Hybrid / Remote"
  const mustHave = normalizeList(context.mustHave).length
    ? normalizeList(context.mustHave)
    : ["JavaScript/TypeScript", "React", "backend fundamentals"]
  const niceToHave = normalizeList(context.niceToHave).length
    ? normalizeList(context.niceToHave)
    : ["startup experience", "AI tooling", "cloud deployment"]
  const first30 =
    context.firstThirtyDays ||
    "Ship meaningful product features, improve core workflows, and help the team move faster."

  return {
    title: `${role} — ${stage} team`,
    companyContext: `We are hiring for a ${stage} team moving fast toward launch. This role is designed for someone who can operate with ownership, communicate clearly, and turn ambiguous product goals into shipped work.`,
    linkedinPost:
      `We're hiring a ${role}.\n\n` +
      `Stage: ${stage}\n` +
      `Budget: ${budget}\n` +
      `Work style: ${workStyle}\n` +
      `Timeline: ${urgency}\n\n` +
      `You'll work closely with the founding/product team to ship core product features, make technical decisions, and help turn the current roadmap into a reliable launch-ready product.\n\n` +
      `Must-have signal:\n` +
      mustHave.map((s) => `• ${s}`).join("\n") +
      `\n\nNice-to-have:\n` +
      niceToHave.map((s) => `• ${s}`).join("\n") +
      `\n\nFirst 30 days:\n${first30}\n\n` +
      `If this sounds like you, send proof of work — GitHub, portfolio, shipped projects, or a short note on what you've built.`,
    fullJobDescription: {
      roleTitle: role,
      intro: `We are looking for a ${role} to join a ${stage} team and help ship product quickly without sacrificing quality. This is a hands-on role for someone who enjoys ownership, fast feedback loops, and practical execution.`,
      responsibilities: [
        "Build and ship production-ready product features across the core roadmap.",
        "Work closely with founders/design/product to turn ambiguous requirements into clear implementation plans.",
        "Make pragmatic technical decisions around speed, reliability, and maintainability.",
        "Debug issues, improve developer workflows, and reduce launch risk.",
        "Communicate tradeoffs clearly and document key implementation decisions.",
      ],
      mustHave,
      niceToHave,
      first30Days: [
        "Understand the product, users, codebase, and launch constraints.",
        "Ship at least one meaningful feature or workflow improvement.",
        "Identify technical risks that could slow launch and propose fixes.",
        "Set up a clear rhythm for progress updates and handoffs.",
      ],
      interviewSignals: [
        "Can explain past projects clearly and honestly.",
        "Can discuss tradeoffs, not just tools.",
        "Has evidence of shipping real work.",
        "Can operate with uncertainty and limited structure.",
        "Communicates blockers early and clearly.",
      ],
      compensation: budget,
      workStyle,
      applicationCTA:
        "Apply with a resume plus proof of work: GitHub, portfolio, shipped projects, demos, or writing that shows how you think.",
    },
    candidateSearchQuery: `${role} ${mustHave.join(" ")} ${workStyle} startup ${stage} proof of work GitHub portfolio`,
  }
}

export function formatFullJobDescription(brief: GeneratedJobBrief): string {
  const jd = brief.fullJobDescription
  const section = (title: string, items: string[]) =>
    `\n${title.toUpperCase()}\n${items.map((i) => `• ${i}`).join("\n")}`

  return [
    jd.roleTitle,
    "",
    jd.intro,
    section("Responsibilities", jd.responsibilities),
    section("Must-have skills", jd.mustHave),
    section("Nice-to-have skills", jd.niceToHave),
    section("First 30 days", jd.first30Days),
    section("Interview signals", jd.interviewSignals),
    "",
    `Compensation: ${jd.compensation}`,
    `Work style: ${jd.workStyle}`,
    "",
    jd.applicationCTA,
  ].join("\n")
}
