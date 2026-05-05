"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowUp, SlidersHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { OmniLogo } from "@/components/omni-logo"
import { DEMO_CANDIDATES } from "@/data/demoCandidates"
import { rankCandidates } from "@/lib/rankCandidates"
import { CandidateProfile } from "@/components/candidate-profile"

// ─── Types ───────────────────────────────────────────────────────────────────

type DiscoveryStep =
  | "idle"
  | "startup_context_requested"
  | "constraints_requested"
  | "ready_to_search"
  | "searching"
  | "results"

type StartupHiringContext = {
  jobDescription?: string
  roleTitle?: string
  budget?: string
  timeToLaunch?: string
  teamSize?: string
  priority?: string
  mustHaveSkills?: string[]
}

type MessageAttachment = {
  title: string
  rows: [string, string][]
}

type ChatAction = {
  label: string
  value: string
}

type ChatMessage = {
  id: string
  sender: "aristotle" | "user"
  text: string
  actions?: ChatAction[]
  attachment?: MessageAttachment
}

// ─── Constants ───────────────────────────────────────────────────────────────

const WORD = "Aristotle"
const REVEAL_DELAY = 0.09
const REVEAL_DURATION = 0.88
const REVEAL_EASE = [0.22, 1, 0.36, 1] as const

const LABEL_MAP: Record<string, string> = {
  "budget-lean": "Budget: lean",
  "budget-standard": "Budget: standard",
  "launch-4": "Launch: 4 weeks",
  "launch-8": "Launch: 8 weeks",
  "team-3": "Team size: 3",
  "team-8": "Team size: 8",
  "priority-ship-fast": "Ship fast",
  "priority-github": "Strong GitHub proof",
  "priority-low-risk": "Low risk",
  "priority-generalist": "Startup generalist",
  "priority-senior": "Senior signal",
  "skill-react": "React",
  "skill-nextjs": "Next.js",
  "skill-rust": "Rust",
  "skill-python": "Python",
  "skill-sql": "SQL",
  "skill-kubernetes": "Kubernetes",
  "skill-skip": "Skip",
}

const FILTER_CHIPS = [
  { id: "fit85", label: "Fit 85+" },
  { id: "proof80", label: "Proof 80+" },
  { id: "available", label: "Available now" },
  { id: "remote", label: "Remote" },
  { id: "lowrisk", label: "Low risk" },
]

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function labelFor(value: string) {
  return LABEL_MAP[value] ?? value
}

function inferRoleTitle(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes("backend")) return "Backend Engineer"
  if (lower.includes("frontend") || lower.includes("front-end")) return "Frontend Engineer"
  if (lower.includes("full-stack") || lower.includes("fullstack")) return "Full-Stack Engineer"
  if (lower.includes("data analyst")) return "Data Analyst"
  if (lower.includes("product designer") || lower.includes("designer")) return "Product Designer"
  if (lower.includes("devops") || lower.includes("kubernetes")) return "DevOps Engineer"
  if (lower.includes("data scientist")) return "Data Scientist"
  if (lower.includes("ml") || lower.includes("machine learning")) return "ML Engineer"
  if (lower.includes("rust")) return "Rust Engineer"
  return "Software Engineer"
}

function applyFilters(list: typeof DEMO_CANDIDATES, filters: Set<string>) {
  return list.filter((c) => {
    if (filters.has("fit85") && c.roleMatchScore < 85) return false
    if (filters.has("proof80") && c.proofScore < 80) return false
    if (
      filters.has("available") &&
      !c.availability.toLowerCase().includes("now") &&
      !c.availability.toLowerCase().includes("available")
    )
      return false
    if (filters.has("remote") && !c.workPreference.toLowerCase().includes("remote")) return false
    if (filters.has("lowrisk") && c.risks.length > 1) return false
    return true
  })
}

const INITIAL_MESSAGE: ChatMessage = {
  id: "init",
  sender: "aristotle",
  text: "Tell me what role you're hiring for. Paste a draft job description or just describe it roughly.",
  actions: [
    { label: "Backend engineer for MVP", value: "Backend engineer for MVP" },
    { label: "Data analyst for launch", value: "Data analyst for launch" },
    { label: "Founding full-stack engineer", value: "Founding full-stack engineer" },
    { label: "Product designer for v1", value: "Product designer for v1" },
  ],
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const router = useRouter()
  const [discoveryStep, setDiscoveryStep] = useState<DiscoveryStep>("idle")
  const [startupContext, setStartupContext] = useState<StartupHiringContext>({})
  const [results, setResults] = useState<typeof DEMO_CANDIDATES>([])
  const [mainView, setMainView] = useState<"animation" | "results">("animation")
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
  const [inputValue, setInputValue] = useState("")
  const [profileCandidate, setProfileCandidate] = useState<(typeof DEMO_CANDIDATES)[0] | null>(null)
  const [aristotleCycle, setAristotleCycle] = useState(0)
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set())
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())
  const [savedBrief, setSavedBrief] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check for saved job brief on mount
  useEffect(() => {
    const brief = localStorage.getItem("forge:jobBrief")
    if (brief) {
      setSavedBrief(brief)
      setMessages([
        {
          id: "brief-found",
          sender: "aristotle",
          text: "I found a saved job brief. Would you like to use it to search for candidates, edit it, or start fresh?",
          actions: [
            { label: "Use this brief", value: "use-brief" },
            { label: "Edit brief", value: "edit-brief" },
            { label: "Start fresh", value: "start-fresh" },
          ],
        },
      ])
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (mainView !== "animation") return
    const id = window.setInterval(() => setAristotleCycle((c) => c + 1), 3500)
    return () => window.clearInterval(id)
  }, [mainView])

  function push(msg: Omit<ChatMessage, "id">) {
    setMessages((prev) => [...prev, { ...msg, id: uid() }])
  }

  function toggleCandidateSelection(id: string) {
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleFilter(filterId: string) {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(filterId)) next.delete(filterId)
      else next.add(filterId)
      return next
    })
  }

  function handleMoveSelectedToInterviews() {
    const selected = results.filter((c) => selectedCandidateIds.has(c.id))
    localStorage.setItem("forge:selectedInterviewCandidates", JSON.stringify(selected))
    router.push("/interviews")
  }

  // ── Step handlers ─────────────────────────────────────────────────────────

  function handleJobDescriptionSubmit(text: string) {
    push({ sender: "user", text })
    setStartupContext({ jobDescription: text, roleTitle: inferRoleTitle(text) })
    setDiscoveryStep("startup_context_requested")
    push({
      sender: "aristotle",
      text: "Got it. I'll pull mocked startup context before searching. What startup context should I optimize for?",
      actions: [
        { label: "Budget: lean", value: "budget-lean" },
        { label: "Budget: standard", value: "budget-standard" },
        { label: "Launch: 4 weeks", value: "launch-4" },
        { label: "Launch: 8 weeks", value: "launch-8" },
        { label: "Team size: 3", value: "team-3" },
        { label: "Team size: 8", value: "team-8" },
      ],
    })
  }

  function handleStartupContextAction(value: string) {
    const updates: Partial<StartupHiringContext> = {}
    if (value === "budget-lean") updates.budget = "lean ($4k–$6k/mo)"
    else if (value === "budget-standard") updates.budget = "standard ($6k–$10k/mo)"
    else if (value === "launch-4") updates.timeToLaunch = "4 weeks"
    else if (value === "launch-8") updates.timeToLaunch = "8 weeks"
    else if (value === "team-3") updates.teamSize = "3-person team"
    else if (value === "team-8") updates.teamSize = "8-person team"

    setStartupContext((prev) => ({ ...prev, ...updates }))
    push({ sender: "user", text: labelFor(value) })
    setDiscoveryStep("constraints_requested")
    push({
      sender: "aristotle",
      text: "Startup context loaded. What matters most for this hire?",
      attachment: {
        title: "Mocked startup context",
        rows: [
          ["Startup", "Forge"],
          ["Budget", updates.budget ?? startupContext.budget ?? "Lean"],
          ["Launch", updates.timeToLaunch ?? startupContext.timeToLaunch ?? "6 weeks"],
          ["Team", updates.teamSize ?? startupContext.teamSize ?? "4-person team"],
          ["Urgency", "High"],
        ],
      },
      actions: [
        { label: "Ship fast", value: "priority-ship-fast" },
        { label: "Strong GitHub proof", value: "priority-github" },
        { label: "Low risk", value: "priority-low-risk" },
        { label: "Startup generalist", value: "priority-generalist" },
        { label: "Senior signal", value: "priority-senior" },
      ],
    })
  }

  function handlePrioritySelected(value: string) {
    setStartupContext((prev) => ({ ...prev, priority: value }))
    push({ sender: "user", text: labelFor(value) })
    push({
      sender: "aristotle",
      text: "Any must-have skills?",
      actions: [
        { label: "React", value: "skill-react" },
        { label: "Next.js", value: "skill-nextjs" },
        { label: "Rust", value: "skill-rust" },
        { label: "Python", value: "skill-python" },
        { label: "SQL", value: "skill-sql" },
        { label: "Kubernetes", value: "skill-kubernetes" },
        { label: "Skip", value: "skill-skip" },
      ],
    })
  }

  function handleSkillSelected(value: string) {
    if (value !== "skill-skip") {
      const skill = labelFor(value)
      setStartupContext((prev) => ({
        ...prev,
        mustHaveSkills: [...(prev.mustHaveSkills ?? []), skill],
      }))
      push({ sender: "user", text: skill })
    } else {
      push({ sender: "user", text: "Skip" })
    }
    setDiscoveryStep("ready_to_search")
    push({
      sender: "aristotle",
      text: "Context ready. I can now search the demo talent pool.",
      actions: [{ label: "Find Candidates", value: "find-candidates" }],
    })
  }

  function handleFilterCommand(text: string) {
    push({ sender: "user", text })
    const lower = text.toLowerCase()

    const filterMappings: { keywords: string[]; filterId: string }[] = [
      { keywords: ["fit 85", "fit85", "high fit", "strong fit"], filterId: "fit85" },
      { keywords: ["proof 80", "proof80", "high proof", "github", "strong proof"], filterId: "proof80" },
      { keywords: ["available", "available now", "immediate"], filterId: "available" },
      { keywords: ["remote"], filterId: "remote" },
      { keywords: ["low risk", "lowrisk", "safe"], filterId: "lowrisk" },
    ]

    const toApply: string[] = []
    const newFilters = new Set(activeFilters)
    for (const { keywords, filterId } of filterMappings) {
      if (keywords.some((k) => lower.includes(k)) && !newFilters.has(filterId)) {
        newFilters.add(filterId)
        toApply.push(FILTER_CHIPS.find((c) => c.id === filterId)?.label ?? filterId)
      }
    }

    if (toApply.length > 0) {
      setActiveFilters(newFilters)
      const count = applyFilters(results, newFilters).length
      push({
        sender: "aristotle",
        text: `Applied: ${toApply.join(", ")}. Showing ${count} candidate${count !== 1 ? "s" : ""}.`,
      })
    } else {
      push({
        sender: "aristotle",
        text: "I can filter by: Fit 85+, Proof 80+, Available now, Remote, Low risk. Try 'show remote only' or 'filter by proof'.",
      })
    }
  }

  async function handleFindCandidates() {
    setDiscoveryStep("searching")
    setMainView("animation")
    push({ sender: "user", text: "Find Candidates" })
    push({
      sender: "aristotle",
      text: "Searching across demo profiles, GitHub proof, startup fit, and evidence density...",
    })

    await new Promise<void>((resolve) => setTimeout(resolve, 1400))

    const query = [
      startupContext.roleTitle ?? "",
      ...(startupContext.mustHaveSkills ?? []),
      startupContext.priority === "priority-github" ? "github" : "",
    ]
      .filter(Boolean)
      .join(" ")

    const ranked = rankCandidates(DEMO_CANDIDATES, query)
    const list = ranked.map((r) => r.candidate)

    setResults(list)
    setSelectedCandidateIds(new Set())
    setActiveFilters(new Set())
    setMainView("results")
    setDiscoveryStep("results")
    push({
      sender: "aristotle",
      text: `Found ${list.length} candidates. Ranked by role fit, proof quality, budget fit, and launch urgency. You can also ask me to filter — e.g. "show only remote" or "proof 80+".`,
    })
  }

  function handleAction(value: string) {
    if (value === "find-candidates") {
      void handleFindCandidates()
    } else if (value === "use-brief") {
      try {
        const parsed = JSON.parse(savedBrief ?? "{}")
        setStartupContext({
          roleTitle: parsed.role ?? parsed.roleTitle ?? "",
          jobDescription: parsed.description ?? "",
          mustHaveSkills: parsed.mustHaveSkills ?? [],
        })
        push({ sender: "user", text: "Use this brief" })
        localStorage.removeItem("forge:jobBrief")
        setDiscoveryStep("ready_to_search")
        push({
          sender: "aristotle",
          text: `Brief loaded for "${parsed.role ?? "the role"}". Ready to search.`,
          actions: [{ label: "Find Candidates", value: "find-candidates" }],
        })
      } catch {
        push({ sender: "user", text: "Use this brief" })
        push({ sender: "aristotle", text: "Couldn't parse the saved brief. Let's start fresh.", actions: INITIAL_MESSAGE.actions })
      }
    } else if (value === "edit-brief") {
      router.push("/job-brief")
    } else if (value === "start-fresh") {
      push({ sender: "user", text: "Start fresh" })
      localStorage.removeItem("forge:jobBrief")
      setSavedBrief(null)
      setMessages([INITIAL_MESSAGE])
      setDiscoveryStep("idle")
    } else if (value.startsWith("budget-") || value.startsWith("launch-") || value.startsWith("team-")) {
      handleStartupContextAction(value)
    } else if (value.startsWith("priority-")) {
      handlePrioritySelected(value)
    } else if (value.startsWith("skill-")) {
      handleSkillSelected(value)
    } else if (discoveryStep === "idle") {
      handleJobDescriptionSubmit(value)
    }
  }

  function handleInputSubmit() {
    const text = inputValue.trim()
    if (!text) return
    setInputValue("")
    if (discoveryStep === "results") {
      handleFilterCommand(text)
    } else if (discoveryStep === "idle") {
      handleJobDescriptionSubmit(text)
    }
  }

  const displayedResults = applyFilters(results, activeFilters)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="flex h-full min-w-0 flex-1 overflow-hidden">
      {/* Candidate profile slide-in */}
      <AnimatePresence>
        {profileCandidate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileCandidate(null)}
              className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed right-0 top-0 z-[91] h-full w-full max-w-[560px] overflow-y-auto"
            >
              <CandidateProfile
                candidate={profileCandidate}
                onClose={() => setProfileCandidate(null)}
                onAutoContact={() => {
                  toggleCandidateSelection(profileCandidate.id)
                  setProfileCandidate(null)
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Left: Aristotle chat panel */}
      <AristotleChatPanel
        messages={messages}
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSubmit={handleInputSubmit}
        onAction={handleAction}
        messagesEndRef={messagesEndRef}
      />

      {/* Right: Main canvas */}
      <DiscoveryMainCanvas
        mainView={mainView}
        results={displayedResults}
        allResultsCount={results.length}
        aristotleCycle={aristotleCycle}
        selectedCandidateIds={selectedCandidateIds}
        activeFilters={activeFilters}
        onToggleCandidate={toggleCandidateSelection}
        onToggleFilter={toggleFilter}
        onOpenCandidate={setProfileCandidate}
        onMoveToInterviews={handleMoveSelectedToInterviews}
      />
    </main>
  )
}

// ─── Aristotle Chat Panel ─────────────────────────────────────────────────────

function AristotleChatPanel({
  messages,
  inputValue,
  setInputValue,
  onSubmit,
  onAction,
  messagesEndRef,
}: {
  messages: ChatMessage[]
  inputValue: string
  setInputValue: (v: string) => void
  onSubmit: () => void
  onAction: (value: string) => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <aside className="relative flex h-full w-[380px] shrink-0 flex-col border-r border-[#DED4C7]/60 bg-[#F7F2EA] dark:border-white/[0.06] dark:bg-[#0A0A0A]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#DED4C733_1px,transparent_1px),linear-gradient(to_bottom,#DED4C733_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 dark:opacity-10" />

      {/* Header */}
      <div className="relative flex items-center gap-3 border-b border-[#DED4C7]/60 px-5 py-4 dark:border-white/[0.06]">
        <AristotleOrb />
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#8A8177] dark:text-white/40">
            ARISTOTLE
          </p>
          <p className="text-[12px] font-bold tracking-[-0.03em] text-[#4E4944] dark:text-white/70">
            candidate intake
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="relative flex-1 overflow-y-auto px-4 py-5">
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} onAction={onAction} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="relative border-t border-[#DED4C7]/60 p-4 dark:border-white/[0.06]">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
          className="relative"
        >
          <div className="relative rounded-[18px] bg-[#FFFDF8]/95 shadow-[0_8px_28px_rgba(42,37,32,0.12)] dark:bg-[#141414] dark:shadow-none">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Paste job description or filter results..."
              className="h-[52px] w-full rounded-[18px] bg-transparent px-5 pr-14 text-[14px] tracking-[-0.03em] text-[#2A2520] outline-none placeholder:text-[#BDB6AE] dark:text-white dark:placeholder:text-white/30"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-[#F7F2EA] text-[#BDB6AE] transition hover:bg-[#FF6A00] hover:text-white disabled:pointer-events-none dark:bg-white/10 dark:hover:bg-[#FF6A00]"
              aria-label="Send"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </form>
      </div>
    </aside>
  )
}

function AristotleOrb() {
  return (
    <OmniLogo size={18} className="text-[#1F2A38] dark:text-white shrink-0" />
  )
}

function ChatBubble({
  message,
  onAction,
}: {
  message: ChatMessage
  onAction: (value: string) => void
}) {
  const isUser = message.sender === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={isUser ? "flex justify-end" : "flex justify-start"}
    >
      <div className="max-w-[90%]">
        <div
          className={
            isUser
              ? "rounded-[20px] rounded-tr-md bg-[#2A2520] px-4 py-3 text-[12px] font-bold leading-5 tracking-[-0.03em] text-[#FFFDF8] dark:bg-white dark:text-[#2A2520]"
              : "rounded-[20px] rounded-tl-md border border-[#DED4C7] bg-[#FFFDF8]/95 px-4 py-3 text-[12px] font-bold leading-5 tracking-[-0.03em] text-[#6F675F] shadow-[0_4px_16px_rgba(42,37,32,0.07)] dark:border-white/10 dark:bg-[#141414] dark:text-white/70"
          }
        >
          {message.text}
        </div>

        {message.attachment && (
          <div className="mt-2 rounded-[16px] border border-[#DED4C7] bg-[#EEE8DF]/80 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="mb-2 text-[9px] font-black uppercase tracking-[0.26em] text-[#FF6A00]">
              {message.attachment.title}
            </p>
            <div className="space-y-1">
              {message.attachment.rows.map(([key, val]) => (
                <div key={key} className="flex items-baseline gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#8A8177] dark:text-white/40">
                    {key}
                  </span>
                  <span className="text-[11px] font-bold text-[#2A2520] dark:text-white/80">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {message.actions && message.actions.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {message.actions.map((action) => (
              <button
                key={action.value}
                onClick={() => onAction(action.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11px] font-black tracking-[-0.02em] transition",
                  action.value === "find-candidates"
                    ? "border-[#FF6A00]/60 bg-[#FF6A00] text-white shadow-[0_8px_24px_rgba(255,106,0,0.28)] hover:bg-[#E05E00]"
                    : "border-[#DED4C7] bg-[#EEE8DF] text-[#6F675F] hover:border-[#FF6A00]/40 hover:bg-[#FFE1C7] hover:text-[#FF6A00] dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10 dark:hover:text-orange-300"
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Canvas ──────────────────────────────────────────────────────────────

function DiscoveryMainCanvas({
  mainView,
  results,
  allResultsCount,
  aristotleCycle,
  selectedCandidateIds,
  activeFilters,
  onToggleCandidate,
  onToggleFilter,
  onOpenCandidate,
  onMoveToInterviews,
}: {
  mainView: "animation" | "results"
  results: typeof DEMO_CANDIDATES
  allResultsCount: number
  aristotleCycle: number
  selectedCandidateIds: Set<string>
  activeFilters: Set<string>
  onToggleCandidate: (id: string) => void
  onToggleFilter: (id: string) => void
  onOpenCandidate: (c: (typeof DEMO_CANDIDATES)[0]) => void
  onMoveToInterviews: () => void
}) {
  return (
    <section className="relative flex h-full flex-1 flex-col overflow-hidden bg-[#F7F2EA] dark:bg-[#050505]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(36,31,24,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(36,31,24,0.035)_1px,transparent_1px)] bg-[size:40px_40px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />

      <AnimatePresence mode="wait">
        {mainView === "animation" && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative flex h-full flex-col items-center justify-center gap-6"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="text-[10px] uppercase tracking-[0.38em] text-[#8A8177] dark:text-white/30">
                Waiting
              </div>
              <motion.div
                key={`word-${aristotleCycle}`}
                aria-label={WORD}
                className="flex items-center gap-[0.1em] text-4xl font-light tracking-[0.28em] text-[#4E4944] dark:text-white/60 xl:text-5xl"
              >
                {WORD.split("").map((letter, i) => (
                  <motion.span
                    key={`${letter}-${i}`}
                    aria-hidden="true"
                    initial={{ opacity: 0, y: 10, filter: "blur(7px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                      delay: i * REVEAL_DELAY,
                      duration: REVEAL_DURATION,
                      ease: REVEAL_EASE,
                    }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </motion.div>
              <motion.div
                key={`line-${aristotleCycle}`}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{
                  delay: 0.08,
                  duration: WORD.length * REVEAL_DELAY + 0.3,
                  ease: REVEAL_EASE,
                }}
                className="h-px w-36 origin-left bg-[#df5f12]/70 shadow-[0_0_20px_rgba(223,95,18,0.28)] dark:bg-[#ff6b00]/70"
              />
            </div>

            <p className="mt-2 max-w-[28ch] text-center text-[12px] text-[#8A8177] dark:text-white/30">
              Complete the intake flow on the left to discover candidates.
            </p>
          </motion.div>
        )}

        {mainView === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative flex h-full flex-col"
          >
            {/* Results header */}
            <header className="flex shrink-0 flex-col gap-3 border-b border-[#DED4C7]/60 bg-[#F7F2EA]/90 px-8 py-4 backdrop-blur-md dark:border-white/[0.04] dark:bg-[#050505]/80">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-[#241f18] dark:text-white">
                    Candidate results
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-[#241f18]/60 dark:text-white/50">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    {results.length === allResultsCount
                      ? `${allResultsCount} matched candidates`
                      : `${results.length} of ${allResultsCount} candidates`}
                  </div>
                </div>

                {selectedCandidateIds.size > 0 ? (
                  <Button
                    size="sm"
                    onClick={onMoveToInterviews}
                    className="h-8 rounded-full bg-[#FF6A00] px-4 text-xs font-semibold text-white hover:bg-[#E05E00] shadow-[0_4px_16px_rgba(255,106,0,0.28)]"
                  >
                    Move {selectedCandidateIds.size} to Interviews
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled
                    className="h-8 rounded-full bg-[#241f18]/5 px-4 text-xs font-medium text-[#241f18]/40 dark:bg-white/5 dark:text-white/30"
                  >
                    Select for Interview
                  </Button>
                )}
              </div>

              {/* Filter chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <SlidersHorizontal size={13} className="shrink-0 text-[#241f18]/40 dark:text-white/30" />
                {FILTER_CHIPS.map((chip) => {
                  const active = activeFilters.has(chip.id)
                  return (
                    <button
                      key={chip.id}
                      onClick={() => onToggleFilter(chip.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all",
                        active
                          ? "border-[#FF6A00]/50 bg-[#FF6A00]/10 text-[#FF6A00] dark:border-[#FF6A00]/40 dark:bg-[#FF6A00]/10 dark:text-[#FF9A50]"
                          : "border-[#DED4C7] bg-transparent text-[#241f18]/50 hover:border-[#241f18]/30 hover:text-[#241f18] dark:border-white/10 dark:text-white/35 dark:hover:border-white/25 dark:hover:text-white/60"
                      )}
                    >
                      {chip.label}
                      {active && <X size={10} />}
                    </button>
                  )
                })}
              </div>
            </header>

            {/* Results list */}
            <div className="flex-1 overflow-y-auto">
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                  <p className="text-sm text-[#241f18]/50 dark:text-white/30">No candidates match the current filters.</p>
                  <button
                    onClick={() => onToggleFilter("")}
                    className="text-xs text-[#FF6A00] underline underline-offset-2"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#DED4C7]/50 dark:divide-white/[0.04]">
                  {results.map((candidate, i) => (
                    <CandidateResultRow
                      key={candidate.id}
                      candidate={candidate}
                      rank={i + 1}
                      isSelected={selectedCandidateIds.has(candidate.id)}
                      onToggle={() => onToggleCandidate(candidate.id)}
                      onOpen={() => onOpenCandidate(candidate)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function CandidateResultRow({
  candidate,
  rank,
  isSelected,
  onToggle,
  onOpen,
}: {
  candidate: (typeof DEMO_CANDIDATES)[0]
  rank: number
  isSelected: boolean
  onToggle: () => void
  onOpen: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.025, duration: 0.22 }}
      className={cn(
        "group flex w-full items-center gap-4 px-6 py-3.5 transition-colors",
        isSelected
          ? "bg-[#FFF3E8] dark:bg-[#FF6A00]/10"
          : "hover:bg-[#EEE8DF]/50 dark:hover:bg-white/[0.02]"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle() }}
        aria-label={isSelected ? "Deselect" : "Select"}
        className={cn(
          "h-4 w-4 shrink-0 rounded border transition-all",
          isSelected
            ? "border-[#FF6A00] bg-[#FF6A00]"
            : "border-[#DED4C7] bg-transparent hover:border-[#FF6A00]/60 dark:border-white/20"
        )}
      >
        {isSelected && (
          <svg viewBox="0 0 10 8" className="h-full w-full p-[2px]" fill="none">
            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Rank */}
      <span className="w-5 shrink-0 text-center text-[11px] text-[#241f18]/25 dark:text-white/20 tabular-nums">
        {rank}
      </span>

      {/* Avatar */}
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#DED4C7] bg-[#E9DFD0] dark:border-white/10 dark:bg-white/10">
        {candidate.avatarUrl ? (
          <img
            src={candidate.avatarUrl}
            alt={candidate.name}
            className="h-full w-full object-cover grayscale transition group-hover:grayscale-0"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs font-bold text-[#8A8177] dark:text-white/40">
            {candidate.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
          </span>
        )}
      </div>

      {/* Name + headline */}
      <button
        onClick={onOpen}
        className="min-w-0 flex-1 text-left"
      >
        <div className="truncate text-sm font-semibold text-[#241f18] transition group-hover:text-[#DF5F12] dark:text-white dark:group-hover:text-[#FF9A50]">
          {candidate.name}
        </div>
        <div className="truncate text-[11px] text-[#241f18]/50 dark:text-white/35">
          {candidate.headline}
        </div>
      </button>

      {/* Skills */}
      <div className="hidden shrink-0 items-center gap-1 xl:flex">
        {candidate.skills.slice(0, 3).map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-[#DED4C7] bg-[#EEE8DF] px-2 py-0.5 text-[10px] text-[#241f18]/55 dark:border-white/10 dark:bg-white/5 dark:text-white/40"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Dual scores: Fit + Proof */}
      <div className="flex shrink-0 items-center gap-3">
        <div className="text-center">
          <div className="text-sm font-semibold tabular-nums" style={{ color: "#18A86B" }}>
            {candidate.roleMatchScore}
          </div>
          <div className="text-[9px] uppercase tracking-wider text-[#241f18]/35 dark:text-white/25">Fit</div>
        </div>
        <div className="h-6 w-px bg-[#DED4C7] dark:bg-white/10" />
        <div className="text-center">
          <div className="text-sm font-semibold tabular-nums" style={{ color: "#4077EE" }}>
            {candidate.proofScore}
          </div>
          <div className="text-[9px] uppercase tracking-wider text-[#241f18]/35 dark:text-white/25">Proof</div>
        </div>
      </div>
    </motion.div>
  )
}
