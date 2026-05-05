"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AlertTriangle, Building2, CheckCircle2, Circle, Code2, Cpu, Eye, Github, GraduationCap, Link2, Play } from "lucide-react"
import type { CSSProperties, ReactNode } from "react"
import { type CandidateAffiliation } from "@/components/interviews/AffiliationLogoChip"
import { ExperienceTimeline } from "@/components/interviews/ExperienceTimeline"
import type { CandidateProject, DemoCandidate } from "@/data/demoCandidates"

const accents = {
  orange: "#FF6A00",
  softOrange: "#FFE1C7",
  blue: "#4077EE",
  softBlue: "#E7EEFF",
  green: "#18A86B",
  softGreen: "#DDF8EB",
  purple: "#8B5CF6",
  softPurple: "#EEE7FF",
  red: "#E24740",
  softRed: "#FFE5E3",
  beige: "#EEE8DF",
  card: "#FBF7EF",
  border: "#DED4C7",
  text: "#2A2520",
  muted: "#7A7168",
}

export function CandidateProofProfile({ candidate }: { candidate: DemoCandidate }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative h-screen overflow-y-auto bg-[#F7F2EA] px-12 py-10 text-[#2A2520] dark:bg-[#0A0A0A] dark:text-white"
    >
      <div className="mx-auto max-w-[1180px] pb-24">
        <ProfileHero candidate={candidate} />
        <ExperienceTimeline candidate={{ affiliations: getCandidateAffiliations(candidate) }} />
        <CourseworkDistribution candidate={candidate} />
        <AboutBlock candidate={candidate} />
        <EducationCard candidate={candidate} />
        <MetricsStrip candidate={candidate} />
        <SkillsChart candidate={candidate} />
        <SignalsGrid candidate={candidate} />
        <ProofVideoCard candidate={candidate} />
        <ProofCarousel candidate={candidate} />
        <InsightsGrid candidate={candidate} />
        <Endorsements candidate={candidate} />
      </div>
    </motion.section>
  )
}

function ProfileHero({ candidate }: { candidate: DemoCandidate }) {
  const router = useRouter()
  const [isGeneratingPack, setIsGeneratingPack] = useState(false)

  function handleSelectInterview() {
    if (isGeneratingPack) return
    setIsGeneratingPack(true)
    window.setTimeout(() => {
      router.push(`/interview-pack/${candidate.id}`)
    }, 1200)
  }

  function handleReject() {
    return undefined
  }

  return (
    <div className="grid grid-cols-[1fr_380px] gap-10">
      <div className="flex items-start gap-7">
        <CandidateAvatar candidate={candidate} />
        <div className="min-w-0">
          <h1 className="text-[58px] font-black leading-[0.92] tracking-[-0.08em] text-[#2A2520] dark:text-white">{candidate.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-5 text-[15px] font-black tracking-[-0.05em] text-[#7A7168] dark:text-white/50">
            <span>{candidate.email}</span>
            <span>{candidate.location}</span>
            <span>{candidate.availability || "Available now"}</span>
          </div>
          <p className="mt-7 max-w-[720px] text-[15px] font-bold leading-7 tracking-[-0.035em] text-[#6F675F] dark:text-white/60">{candidate.summary}</p>
        </div>
      </div>

      <div className="shrink-0 pt-2">
        <button className="w-[360px] rounded-[22px] border border-[#DED4C7] bg-[#EEE8DF]/70 px-6 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-[#2A2520] transition hover:bg-[#FF6A00] hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-[#FF6A00] dark:hover:text-white">
          Auto-contact
        </button>
        <SherlockRecommendationCard
          candidate={candidate}
          onSelectInterview={handleSelectInterview}
          onReject={handleReject}
          isGeneratingPack={isGeneratingPack}
        />
      </div>
    </div>
  )
}

function SherlockRecommendationCard({
  candidate,
  onSelectInterview,
  onReject,
  isGeneratingPack,
}: {
  candidate: DemoCandidate
  onSelectInterview: () => void
  onReject: () => void
  isGeneratingPack: boolean
}) {
  return (
    <div className="mt-4 w-[360px] rounded-[28px] border border-[#DED4C7] bg-[#FBF7EF] p-5 shadow-[0_18px_50px_rgba(42,37,32,0.08)] dark:border-white/10 dark:bg-[#101010] dark:shadow-none">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#18A86B]">Sherlock recommends</p>
          <h3 className="mt-2 text-[30px] font-black leading-none tracking-[-0.08em] text-[#2A2520] dark:text-white">Select for interview</h3>
        </div>

        <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-[22px] bg-[#DDF8EB] text-center">
          <div>
            <p className="text-[24px] font-black leading-none tracking-[-0.08em] text-[#18A86B]">{candidate.roleMatchScore}%</p>
            <p className="mt-1 text-[7px] font-black uppercase tracking-[0.16em] text-[#406B58]">confidence</p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-[13px] font-bold leading-5 tracking-[-0.03em] text-[#6F675F] dark:text-white/55">
        Strong backend evidence. Best next step is a focused technical screen.
      </p>

      <div className="mt-5 grid grid-cols-[1fr_0.7fr] gap-3">
        <button
          onClick={onSelectInterview}
          disabled={isGeneratingPack}
          className="rounded-[18px] bg-[#18A86B] px-4 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[0_14px_28px_rgba(24,168,107,0.18)] transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-wait disabled:opacity-75"
        >
          {isGeneratingPack ? "Generating interview pack" : "Interview"}
        </button>

        <button
          onClick={onReject}
          className="rounded-[18px] border border-[#FFC7C3] bg-[#FFF7F6] px-4 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#E24740] transition hover:bg-[#FFE5E3] active:scale-[0.99] dark:border-red-500/20 dark:bg-red-500/10 dark:hover:bg-red-500/15"
        >
          Reject
        </button>
      </div>
    </div>
  )
}

function getCandidateAffiliations(candidate: DemoCandidate): CandidateAffiliation[] {
  if (candidate.affiliations?.length) return candidate.affiliations

  return [
    {
      id: `${candidate.id}-company`,
      name: candidate.currentCompany || "Independent Builder",
      type: "Company",
      role: candidate.targetRole,
      date: "Current",
      description: "Declared work and role context used as part of the proof profile.",
      logoText: (candidate.currentCompany || "IB").slice(0, 3).toUpperCase(),
      accent: "blue",
      verified: false,
    },
    {
      id: `${candidate.id}-university`,
      name: candidate.education?.university || "University of Sydney",
      type: "University",
      role: candidate.education?.degree || "Computer Science",
      date: candidate.education?.graduationYear,
      description: "Education signal connected to coursework and project evidence.",
      logoText: "UNI",
      accent: "purple",
      verified: true,
    },
    {
      id: `${candidate.id}-github`,
      name: "GitHub",
      type: "Open Source",
      role: candidate.githubUsername,
      date: "Active",
      description: "Evidence from public repositories, project history, and technical artifacts.",
      logoText: "GH",
      accent: "neutral",
      verified: true,
    },
  ]
}

function CandidateAvatar({ candidate }: { candidate: DemoCandidate }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      className="relative h-[132px] w-[132px] shrink-0 overflow-hidden rounded-[30px] border border-[#DED4C7] bg-[#EEE8DF] shadow-[0_22px_60px_rgba(42,37,32,0.14)] dark:border-white/10 dark:bg-[#1C1C1C] dark:shadow-none"
    >
      {candidate.avatarUrl ? (
        <img src={candidate.avatarUrl} alt={candidate.name} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center text-[34px] font-black text-[#8A8177] dark:text-white/40">
          {candidate.name.split(" ").map((part) => part[0]).join("")}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/40" />
    </motion.div>
  )
}

function CourseworkDistribution({ candidate }: { candidate: DemoCandidate }) {
  const items = candidate.courseworkDistribution ?? [
    { label: "Systems", value: 35 },
    { label: "Backend", value: 30 },
    { label: "Data", value: 20 },
    { label: "AI", value: 15 },
  ]
  const colors = ["bg-[#FF6A00]", "bg-[#4077EE]", "bg-[#18A86B]", "bg-[#8B5CF6]"]

  return (
    <section className="mt-14">
      <SectionLabel>Coursework / Signal Mix</SectionLabel>
      <div className="mt-5 h-4 overflow-hidden rounded-full border border-[#DED4C7] bg-[#EEE8DF] shadow-inner dark:border-white/10 dark:bg-white/10">
        <div className="flex h-full">
          {items.map((item, index) => (
            <div key={item.label} style={{ width: `${item.value}%` }} className={colors[index] ?? "bg-[#DED4C7]"} />
          ))}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-5">
        {items.map((item, index) => (
          <div key={item.label} className="flex items-center gap-3 rounded-full bg-[#FBF7EF] px-4 py-2 text-[15px] font-black tracking-[-0.05em] text-[#7A7168] dark:bg-[#141414] dark:text-white/55">
            <span className={`h-3.5 w-3.5 rounded-full ${colors[index] ?? "bg-[#DED4C7]"}`} />
            {item.label} {item.value}%
          </div>
        ))}
      </div>
    </section>
  )
}

function AboutBlock({ candidate }: { candidate: DemoCandidate }) {
  return (
    <section className="mt-14 rounded-[28px] border border-[#DED4C7] bg-[#FBF7EF] p-8 dark:border-white/10 dark:bg-[#101010]">
      <SectionLabel>About</SectionLabel>
      <p className="mt-5 text-[19px] font-black leading-9 tracking-[-0.055em] text-[#6F675F] dark:text-white/60">{candidate.summary}</p>
      <div className="mt-7 grid grid-cols-2 gap-5">
        <MiniList title="Strengths" items={candidate.strengths} tone="green" />
        <MiniList title="Risks" items={candidate.risks} tone="red" />
      </div>
    </section>
  )
}

function EducationCard({ candidate }: { candidate: DemoCandidate }) {
  return (
    <section className="mt-14">
      <SectionLabel>University</SectionLabel>
      <div className="mt-5 rounded-[18px] border border-[#DED4C7] bg-[#EEE8DF]/80 p-9 shadow-[0_18px_50px_rgba(42,37,32,0.06)] dark:border-white/10 dark:bg-[#101010] dark:shadow-none">
        <div className="flex items-start gap-5">
          <UniversitySeal name={candidate.education?.university || "University of Sydney"} />
          <div className="flex-1">
            <h3 className="text-[30px] font-black tracking-[-0.06em] text-[#2A2520] dark:text-white">{candidate.education?.university || "University of Sydney"}</h3>
            <p className="mt-2 text-[18px] font-black uppercase tracking-[0.08em] text-[#8A8177] dark:text-white/40">{candidate.education?.degree || "B.S. Computer Science"}</p>
            <div className="mt-8 grid grid-cols-2 gap-10">
              <MetricLarge label="Expected Graduation" value={candidate.education?.graduationYear || "2026"} />
              <MetricLarge label="GPA / WAM" value={candidate.education?.score || "78"} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function MetricsStrip({ candidate }: { candidate: DemoCandidate }) {
  const metrics = [
    { label: "Proof Score", value: candidate.proofScore, icon: Cpu, color: accents.orange, bg: accents.softOrange },
    { label: "Projects", value: candidate.projects?.length ?? 8, icon: Code2, color: accents.blue, bg: accents.softBlue },
    { label: "Hackathons", value: candidate.signalCounts?.hackathons ?? 2, icon: Circle, color: accents.green, bg: accents.softGreen },
    { label: "Publications", value: candidate.signalCounts?.publications ?? 0, icon: Eye, color: accents.purple, bg: accents.softPurple },
  ]

  return (
    <section className="mt-14 rounded-[28px] border border-[#DED4C7] bg-[#FBF7EF] p-8 dark:border-white/10 dark:bg-[#101010]">
      <SectionLabel>Student Profile</SectionLabel>
      <div className="mt-8 grid grid-cols-4 gap-10">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.label} className="rounded-[24px] border border-[#DED4C7] bg-[#FFFDF8]/70 p-5 dark:border-white/10 dark:bg-[#141414]">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl" style={{ color: metric.color, backgroundColor: metric.bg }}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-[42px] leading-none tracking-[-0.08em] text-[#2A2520] dark:text-white">{metric.value}</p>
                <p className="mt-2 text-[14px] font-black uppercase tracking-[0.18em] text-[#8A8177] dark:text-white/40">{metric.label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function SkillsChart({ candidate }: { candidate: DemoCandidate }) {
  const skills = candidate.skillScores ?? candidate.skills.slice(0, 6).map((skill, index) => ({ skill, score: 86 - index * 6 }))

  return (
    <section className="mt-14">
      <SectionLabel>Skills Chart</SectionLabel>
      <div className="mt-7 space-y-7">
        {skills.map((item) => (
          <div key={item.skill} className="grid grid-cols-[1fr_260px_60px] items-center gap-8 rounded-[22px] border border-[#DED4C7] bg-[#FBF7EF] px-5 py-4 dark:border-white/10 dark:bg-[#101010]">
            <p className="text-[24px] font-black tracking-[-0.06em] text-[#6F675F] dark:text-white/65">{item.skill}</p>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#DED4C7] dark:bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${item.score}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: skillColor(item.score) }}
              />
            </div>
            <p className="text-right text-[24px] font-black tracking-[-0.06em] text-[#7A7168] dark:text-white/50">{item.score}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function SignalsGrid({ candidate }: { candidate: DemoCandidate }) {
  const signals = [
    { label: "GitHub", value: candidate.githubUsername || "missing", icon: Github, color: accents.text, bg: accents.beige },
    { label: "Portfolio", value: candidate.portfolioUrl || "missing", icon: Link2, color: accents.blue, bg: accents.softBlue },
    { label: "Availability", value: candidate.availability || "unknown", icon: CheckCircle2, color: accents.green, bg: accents.softGreen },
    { label: "Work preference", value: candidate.workPreference || "unknown", icon: Building2, color: accents.purple, bg: accents.softPurple },
  ]

  return (
    <section className="mt-14">
      <SectionLabel>Proof Signals</SectionLabel>
      <div className="mt-5 grid grid-cols-4 gap-5">
        {signals.map((signal) => {
          const Icon = signal.icon
          return (
            <div key={signal.label} className="rounded-[28px] border border-[#DED4C7] bg-[#FBF7EF] p-5 shadow-[0_12px_35px_rgba(42,37,32,0.05)] dark:border-white/10 dark:bg-[#101010] dark:shadow-none">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-2xl" style={{ color: signal.color, backgroundColor: signal.bg }}>
                <Icon size={18} />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8A8177] dark:text-white/40">{signal.label}</p>
              <p className="mt-3 break-words text-[16px] font-black tracking-[-0.05em] text-[#2A2520] dark:text-white">{signal.value}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ProofVideoCard({ candidate }: { candidate: DemoCandidate }) {
  return (
    <section className="mt-14">
      <SectionLabel>Proof Intro</SectionLabel>
      <div className="mt-5 rounded-[34px] border border-[#DED4C7] bg-[#EEE8DF]/80 p-6 dark:border-white/10 dark:bg-[#101010]">
        <div className="relative grid h-[280px] place-items-center overflow-hidden rounded-[28px] border border-[#DED4C7] bg-[#FBF7EF] dark:border-white/10 dark:bg-[#141414]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,106,0,0.13),transparent_34%)]" />
          <button className="relative grid h-20 w-20 place-items-center rounded-full bg-[#2A2520] text-white shadow-[0_24px_70px_rgba(42,37,32,0.25)] dark:bg-white dark:text-[#0A0A0A] dark:shadow-none">
            <Play size={30} fill="white" />
          </button>
          <p className="absolute bottom-8 text-[28px] font-black tracking-[-0.07em] text-[#2A2520] dark:text-white">Meet {candidate.name.split(" ")[0]}</p>
        </div>
        <p className="mt-5 text-center text-[17px] font-bold italic tracking-[-0.04em] text-[#6F675F] dark:text-white/60">
          "{candidate.introVideoCaption || "I build backend systems that actually ship."}"
        </p>
      </div>
    </section>
  )
}

function ProofCarousel({ candidate }: { candidate: DemoCandidate }) {
  const projects = candidate.proofProjects ?? candidate.projects ?? []

  return (
    <section className="mt-14">
      <div className="flex items-center justify-between">
        <SectionLabel>Verified Proof</SectionLabel>
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8A8177] dark:text-white/40">Drag sideways</p>
      </div>
      <div className="mt-5 flex gap-5 overflow-x-auto pb-4">
        {projects.map((project) => (
          <ProofProjectCard key={project.name} project={project} />
        ))}
      </div>
    </section>
  )
}

function ProofProjectCard({ project }: { project: CandidateProject }) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="min-w-[330px] rounded-[28px] border border-[#DED4C7] bg-[#FBF7EF] p-6 shadow-[0_18px_50px_rgba(42,37,32,0.07)] dark:border-white/10 dark:bg-[#101010] dark:shadow-none"
    >
      <div className="mb-5 flex items-center justify-between">
        <span className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]" style={sourceStyle(project.source)}>
          {project.source || "GitHub"}
        </span>
        <span className="text-[12px] font-black text-[#8A8177] dark:text-white/40">{project.relevance || "High relevance"}</span>
      </div>
      <h3 className="text-[24px] font-black tracking-[-0.07em] text-[#2A2520] dark:text-white">{project.name}</h3>
      <p className="mt-4 text-[13px] font-bold leading-6 tracking-[-0.03em] text-[#6F675F] dark:text-white/55">{project.description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {(project.skills || []).slice(0, 4).map((skill) => (
          <span key={skill} className="rounded-full bg-[#EEE8DF] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#7A7168] dark:bg-white/5 dark:text-white/50">
            {skill}
          </span>
        ))}
      </div>
    </motion.article>
  )
}

function InsightsGrid({ candidate }: { candidate: DemoCandidate }) {
  const insights = candidate.insights ?? [
    { title: "Best interview angle", body: candidate.notes.bestInterviewAngle },
    { title: "Risk / concern", body: candidate.notes.potentialConcerns },
    { title: "Suggested next step", body: candidate.notes.suggestedNextStep },
  ]

  return (
    <section className="mt-14">
      <SectionLabel>Sherlock Insights</SectionLabel>
      <div className="mt-5 grid grid-cols-3 gap-5">
        {insights.map((item, index) => (
          <div key={item.title} className="rounded-[28px] border border-[#DED4C7] bg-[#FBF7EF] p-6 shadow-[0_12px_35px_rgba(42,37,32,0.05)] dark:border-white/10 dark:bg-[#101010] dark:shadow-none">
            <div className="mb-4 h-1.5 w-16 rounded-full" style={{ backgroundColor: insightColor(index) }} />
            <p className="text-[12px] font-black uppercase tracking-[0.2em]" style={{ color: insightColor(index) }}>{item.title}</p>
            <p className="mt-4 text-[14px] font-bold leading-6 tracking-[-0.03em] text-[#6F675F] dark:text-white/55">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Endorsements({ candidate }: { candidate: DemoCandidate }) {
  const endorsements = candidate.endorsements ?? [
    { name: "Hiring manager", role: "Reference", quote: candidate.notes.whyThisCandidate },
    { name: "Technical reviewer", role: "Interview", quote: candidate.notes.bestInterviewAngle },
  ]

  return (
    <section className="mt-14">
      <SectionLabel>Endorsements</SectionLabel>
      <div className="mt-5 grid grid-cols-2 gap-5">
        {endorsements.map((endorsement) => (
          <div key={`${endorsement.name}-${endorsement.role}`} className="rounded-[28px] border border-[#DED4C7] bg-[#FBF7EF] p-6 dark:border-white/10 dark:bg-[#101010]">
            <p className="text-[18px] font-black tracking-[-0.05em] text-[#2A2520] dark:text-white">{endorsement.name}</p>
            <p className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#8A8177] dark:text-white/40">{endorsement.role}</p>
            <p className="mt-4 text-[14px] font-bold leading-6 tracking-[-0.03em] text-[#6F675F] dark:text-white/55">"{endorsement.quote}"</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function MiniList({ title, items, tone }: { title: string; items: string[]; tone: "green" | "red" }) {
  const positive = tone === "green"
  return (
    <div className="rounded-[22px] border border-[#DED4C7] bg-[#EEE8DF]/70 p-5 dark:border-white/10 dark:bg-[#141414]">
      <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: positive ? accents.green : accents.red }}>{title}</p>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex gap-3 text-[13px] font-bold leading-5 tracking-[-0.03em] text-[#6F675F] dark:text-white/55">
            {positive ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#18A86B]" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#E24740]" />}
            <p>{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricLarge({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[13px] font-black uppercase tracking-[0.16em] text-[#8A8177] dark:text-white/40">{label}</p>
      <p className="mt-3 text-[42px] tracking-[-0.08em] text-[#2A2520] dark:text-white">{value}</p>
    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[15px] font-black uppercase tracking-[0.28em] text-[#8A8177] dark:text-white/40">{children}</p>
}

function UniversitySeal({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter((part) => part.length > 2)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return (
    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] border border-[#DED4C7] bg-[#EEE7FF] text-[#8B5CF6] shadow-[0_12px_35px_rgba(42,37,32,0.08)] dark:border-white/10 dark:bg-purple-500/10 dark:shadow-none">
      <div className="text-center">
        <GraduationCap className="mx-auto h-5 w-5" />
        <p className="mt-1 text-[10px] font-black tracking-[0.12em]">{initials || "UNI"}</p>
      </div>
    </div>
  )
}

function skillColor(score: number) {
  if (score >= 88) return accents.green
  if (score >= 80) return accents.blue
  if (score >= 65) return accents.orange
  return accents.red
}

function sourceStyle(source?: string): CSSProperties {
  if (source === "GitHub") return { backgroundColor: accents.softBlue, color: accents.blue }
  if (source === "Portfolio") return { backgroundColor: accents.softGreen, color: accents.green }
  if (source === "Resume") return { backgroundColor: accents.softPurple, color: accents.purple }
  return { backgroundColor: accents.softOrange, color: accents.orange }
}

function insightColor(index: number) {
  return [accents.blue, accents.red, accents.green][index] ?? accents.orange
}
