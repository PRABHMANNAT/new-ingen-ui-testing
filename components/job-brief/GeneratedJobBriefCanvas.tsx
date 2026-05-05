"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"
import { BrandOrbLoader } from "@/components/BrandOrbLoader"
import type { GeneratedJobBrief } from "@/lib/buildGeneratedJobBrief"
import { formatFullJobDescription } from "@/lib/buildGeneratedJobBrief"

// ─── Generating state ─────────────────────────────────────────────────────────

export function JobBriefGeneratingState() {
  return (
    <div className="relative flex h-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center"
      >
        <div className="flex justify-center">
          <motion.div
            animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <BrandOrbLoader />
          </motion.div>
        </div>
        <p className="mt-8 text-[12px] font-black uppercase tracking-[0.42em] text-[#B0A79E]">
          Generating
        </p>
        <h1 className="mt-4 text-[58px] font-normal tracking-[0.32em] text-[#4E4944]">
          Job Brief
        </h1>
        <div className="mx-auto mt-5 h-px w-[220px] bg-[#FF6A00]" />
        <p className="mx-auto mt-6 max-w-[460px] text-[13px] font-bold leading-6 tracking-[-0.03em] text-[#8A8177]">
          Aristotle is turning your intake into a polished job description, LinkedIn-ready post, and candidate search query.
        </p>
      </motion.div>
    </div>
  )
}

// ─── Generated brief canvas ───────────────────────────────────────────────────

export function GeneratedJobBriefCanvas({
  brief,
  onUseToFindCandidates,
  onEditIntake,
}: {
  brief: GeneratedJobBrief
  onUseToFindCandidates: () => void
  onEditIntake: () => void
}) {
  const [linkedinCopied, setLinkedinCopied] = useState(false)
  const [jdCopied, setJdCopied] = useState(false)

  function copyLinkedin() {
    navigator.clipboard.writeText(brief.linkedinPost).then(() => {
      setLinkedinCopied(true)
      setTimeout(() => setLinkedinCopied(false), 2000)
    })
  }

  function copyFullJD() {
    navigator.clipboard.writeText(formatFullJobDescription(brief)).then(() => {
      setJdCopied(true)
      setTimeout(() => setJdCopied(false), 2000)
    })
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative h-full overflow-y-auto overflow-x-hidden bg-[#F7F2EA] px-8 py-8"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#DED4C733_1px,transparent_1px),linear-gradient(to_bottom,#DED4C733_1px,transparent_1px)] bg-[size:32px_32px] opacity-35 pointer-events-none" />

      <div className="relative mx-auto max-w-[1120px] pb-24">
        {/* Top header */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.32em] text-[#8A8177]">
              Generated Job Brief
            </p>
            <h1 className="mt-3 max-w-[780px] text-[clamp(36px,4.5vw,68px)] font-black leading-[0.95] tracking-[-0.07em] text-[#2A2520]">
              {brief.fullJobDescription.roleTitle}
            </h1>
            <p className="mt-5 max-w-[700px] text-[15px] font-bold leading-7 tracking-[-0.035em] text-[#6F675F]">
              {brief.companyContext}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <CopyButton label="Copy LinkedIn" copiedLabel="Copied" copied={linkedinCopied} onClick={copyLinkedin} variant="ghost" />
            <CopyButton label="Copy Full JD" copiedLabel="Copied" copied={jdCopied} onClick={copyFullJD} variant="ghost" />
            <button
              onClick={onUseToFindCandidates}
              className="rounded-[20px] bg-[#FF6A00] px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-white shadow-[0_14px_34px_rgba(255,106,0,0.22)] transition hover:scale-[1.02] hover:bg-[#E05E00]"
            >
              Use to Find Candidates
            </button>
          </div>
        </div>

        {/* Two-column grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <LinkedInPostCard brief={brief} onCopy={copyLinkedin} copied={linkedinCopied} />
          <FullJobDescriptionCard brief={brief} />
        </div>

        <SearchQueryCard brief={brief} onUseToFindCandidates={onUseToFindCandidates} />

        <button
          onClick={onEditIntake}
          className="mt-6 rounded-full border border-[#DED4C7] bg-[#EEE8DF]/70 px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#6F675F] transition hover:bg-[#2A2520] hover:text-white"
        >
          Edit Intake
        </button>
      </div>
    </motion.section>
  )
}

// ─── LinkedIn post card ───────────────────────────────────────────────────────

function LinkedInPostCard({
  brief,
  onCopy,
  copied,
}: {
  brief: GeneratedJobBrief
  onCopy: () => void
  copied: boolean
}) {
  return (
    <div className="rounded-[34px] border border-[#DED4C7] bg-[#FBF7EF] p-6 shadow-[0_18px_50px_rgba(42,37,32,0.06)]">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-black uppercase tracking-[0.28em] text-[#4077EE]">
          LinkedIn-ready post
        </p>
        <CopyButton label="Copy" copiedLabel="Copied" copied={copied} onClick={onCopy} variant="small" />
      </div>
      <div className="mt-5 whitespace-pre-wrap rounded-[24px] border border-[#DED4C7] bg-[#FFFDF8] p-5 text-[13px] font-bold leading-7 tracking-[-0.03em] text-[#4E4944]">
        {brief.linkedinPost}
      </div>
    </div>
  )
}

// ─── Full JD card ─────────────────────────────────────────────────────────────

function FullJobDescriptionCard({ brief }: { brief: GeneratedJobBrief }) {
  const jd = brief.fullJobDescription
  return (
    <div className="rounded-[34px] border border-[#DED4C7] bg-[#FBF7EF] p-6 shadow-[0_18px_50px_rgba(42,37,32,0.06)]">
      <p className="text-[12px] font-black uppercase tracking-[0.28em] text-[#8A8177]">
        Full Job Description
      </p>
      <h2 className="mt-4 text-[28px] font-black tracking-[-0.07em] text-[#2A2520]">
        {jd.roleTitle}
      </h2>
      <p className="mt-4 text-[13px] font-bold leading-7 tracking-[-0.03em] text-[#6F675F]">
        {jd.intro}
      </p>
      <BriefSection title="Responsibilities" items={jd.responsibilities} />
      <BriefSection title="Must-have skills" items={jd.mustHave} accent="#18A86B" />
      <BriefSection title="Nice-to-have skills" items={jd.niceToHave} />
      <BriefSection title="First 30 days" items={jd.first30Days} />
      <BriefSection title="Interview signals" items={jd.interviewSignals} />
      <div className="mt-5 grid grid-cols-2 gap-3">
        <InfoTile label="Compensation" value={jd.compensation} />
        <InfoTile label="Work style" value={jd.workStyle} />
      </div>
      <p className="mt-5 rounded-[22px] border border-[#DED4C7] bg-[#FFFDF8] p-4 text-[13px] font-bold leading-6 tracking-[-0.03em] text-[#6F675F]">
        {jd.applicationCTA}
      </p>
    </div>
  )
}

function BriefSection({ title, items, accent }: { title: string; items: string[]; accent?: string }) {
  return (
    <div className="mt-5">
      <p
        className="text-[11px] font-black uppercase tracking-[0.24em]"
        style={{ color: accent ?? "#8A8177" }}
      >
        {title}
      </p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <p
            key={item}
            className="rounded-[18px] bg-[#FFFDF8] px-4 py-3 text-[12px] font-bold leading-6 tracking-[-0.03em] text-[#6F675F]"
          >
            • {item}
          </p>
        ))}
      </div>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-[#EEE8DF]/70 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8A8177]">{label}</p>
      <p className="mt-2 text-[13px] font-black text-[#2A2520]">{value}</p>
    </div>
  )
}

// ─── Search query card ────────────────────────────────────────────────────────

function SearchQueryCard({
  brief,
  onUseToFindCandidates,
}: {
  brief: GeneratedJobBrief
  onUseToFindCandidates: () => void
}) {
  return (
    <section className="mt-6 rounded-[34px] border border-[#DED4C7] bg-[#FBF7EF] p-6 shadow-[0_18px_50px_rgba(42,37,32,0.06)]">
      <p className="text-[12px] font-black uppercase tracking-[0.28em] text-[#FF6A00]">
        Candidate Search Query
      </p>
      <p className="mt-4 rounded-[24px] border border-[#DED4C7] bg-[#FFFDF8] p-5 text-[15px] font-black leading-7 tracking-[-0.04em] text-[#2A2520]">
        {brief.candidateSearchQuery}
      </p>
      <button
        onClick={onUseToFindCandidates}
        className="mt-5 rounded-[20px] bg-[#2A2520] px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#FFFDF8] transition hover:scale-[1.02]"
      >
        Use this query to find candidates
      </button>
    </section>
  )
}

// ─── Shared copy button ───────────────────────────────────────────────────────

function CopyButton({
  label,
  copiedLabel,
  copied,
  onClick,
  variant,
}: {
  label: string
  copiedLabel: string
  copied: boolean
  onClick: () => void
  variant: "ghost" | "small"
}) {
  if (variant === "small") {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 rounded-full border border-[#DED4C7] bg-[#EEE8DF]/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#6F675F] transition hover:bg-[#DED4C7]"
      >
        {copied ? <Check size={11} /> : null}
        {copied ? copiedLabel : label}
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-[20px] border border-[#DED4C7] bg-[#FBF7EF] px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#6F675F] transition hover:bg-[#EEE8DF]"
    >
      {copied ? <Check size={12} /> : null}
      {copied ? copiedLabel : label}
    </button>
  )
}
