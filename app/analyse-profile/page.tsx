"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { CandidateProofProfile } from "@/components/CandidateProofProfile"
import { SherlockChatPanel, type ChatAction, type ChatMessage, type FlowState, type SearchContext } from "@/components/SherlockChatPanel"
import { DEMO_CANDIDATES, type DemoCandidate } from "@/data/demoCandidates"

type MainView = "loading" | "profile"
const SHERLOCK_WORD = "Sherlock"
const SHERLOCK_REVEAL_DELAY = 0.12
const SHERLOCK_REVEAL_DURATION = 0.88
const SHERLOCK_REVEAL_EASE = [0.22, 1, 0.36, 1] as const

const initialMessage: ChatMessage = {
  id: "m0",
  sender: "sherlock",
  text: "Start with a candidate name. I’ll ask for role, GitHub, resume, and proof links.",
  actions: [
    { label: "Alex Rivera", value: "Alex Rivera", kind: "candidate" },
    { label: "Priya Mehta", value: "Priya Mehta", kind: "candidate" },
    { label: "Senior Rust Engineer", value: "Senior Rust Engineer", kind: "role" },
    { label: "Upload resume", value: "upload", kind: "upload" },
    { label: "Paste GitHub", value: "github", kind: "github" },
  ],
}

function findCandidateByName(value: string) {
  const clean = value.trim().toLowerCase()
  if (!clean) return undefined

  return DEMO_CANDIDATES.find((candidate) => {
    const name = candidate.name.toLowerCase()
    const firstName = name.split(" ")[0]
    return clean === name || clean === firstName || name.includes(clean) || clean.includes(name) || clean === candidate.githubUsername.toLowerCase()
  })
}

function buildProofProfile(candidate: DemoCandidate, context: SearchContext): DemoCandidate {
  return {
    ...candidate,
    targetRole: context.role || candidate.targetRole,
    githubUsername: context.github?.replace(/^https?:\/\//, "").replace(/^github\.com\//, "") || candidate.githubUsername,
    evidence: context.uploadedFile
      ? [
          {
            id: `${candidate.id}-upload`,
            title: "Uploaded resume evidence",
            source: "Resume",
            date: "2026-05-05",
            description: `${context.uploadedFile.name} was attached to the Sherlock context before analysis.`,
          },
          ...candidate.evidence,
        ]
      : candidate.evidence,
  }
}

export default function AnalyseProfilePage() {
  const [mainView, setMainView] = useState<MainView>("loading")
  const [activeProfile, setActiveProfile] = useState<DemoCandidate | null>(null)
  const [flowState, setFlowState] = useState<FlowState>("idle")
  const [query, setQuery] = useState("")
  const [context, setContext] = useState<SearchContext>({})
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage])
  const [sherlockCycle, setSherlockCycle] = useState(0)

  useEffect(() => {
    const onGlobalSearch = (event: Event) => {
      const detail = (event as CustomEvent<{ query?: string }>).detail
      if (detail?.query) handleCandidateInput(detail.query)
    }

    window.addEventListener("forge-global-search", onGlobalSearch)
    return () => window.removeEventListener("forge-global-search", onGlobalSearch)
  }, [])

  useEffect(() => {
    if (mainView !== "loading") return

    setSherlockCycle(0)
    const id = window.setInterval(() => {
      setSherlockCycle((currentCycle) => currentCycle + 1)
    }, 3500)

    return () => window.clearInterval(id)
  }, [mainView])

  function pushMessage(message: Omit<ChatMessage, "id">) {
    setMessages((previous) => [...previous, { ...message, id: crypto.randomUUID() }])
  }

  function consumeActions(messageId: string) {
    setMessages((previous) => previous.map((message) => (message.id === messageId ? { ...message, actions: [] } : message)))
  }

  function consumeAllVisibleActions() {
    setMessages((previous) => previous.map((message) => (message.actions?.length ? { ...message, actions: [] } : message)))
  }

  function handleCandidateInput(raw: string) {
    const value = raw.trim()
    if (!value) return

    setQuery("")
    consumeAllVisibleActions()
    pushMessage({ sender: "user", text: value })

    const candidate = findCandidateByName(value)
    const roleLike = /engineer|developer|analyst|designer|manager|rust|backend|frontend|data|ml/i.test(value)

    if (!candidate && roleLike) {
      setContext((previous) => ({ ...previous, role: value }))
      setFlowState("chatting")
      setTimeout(() => {
        pushMessage({
          sender: "sherlock",
          text: `I can search for ${value}. Which candidate should I start with?`,
          actions: [
            { label: "Alex Rivera", value: "Alex Rivera", kind: "candidate" },
            { label: "Priya Mehta", value: "Priya Mehta", kind: "candidate" },
          ],
        })
      }, 350)
      return
    }

    const resolvedName = candidate?.name || value
    setContext((previous) => ({ ...previous, candidateName: resolvedName }))
    setFlowState("role_requested")
    setTimeout(() => {
      pushMessage({
        sender: "sherlock",
        text: candidate
          ? `Found ${candidate.name}. What role are we evaluating him for?`
          : `I can start with ${resolvedName}. What role are we evaluating them for?`,
        actions: [
          { label: "Backend Engineer", value: "Backend Engineer", kind: "role" },
          { label: "Senior Rust Engineer", value: "Senior Rust Engineer", kind: "role" },
          { label: "Data Analyst", value: "Data Analyst", kind: "role" },
          { label: "ML Engineer", value: "ML Engineer", kind: "role" },
        ],
      })
    }, 350)
  }

  function handleRoleSelect(role: string) {
    pushMessage({ sender: "user", text: role })
    const nextContext = { ...context, role }
    setContext(nextContext)
    setFlowState("links_requested")

    setTimeout(() => {
      const candidate = findCandidateByName(nextContext.candidateName || "") || DEMO_CANDIDATES.find((item) => item.name === "Alex Rivera")
      pushMessage({
        sender: "sherlock",
        text: "Want me to check GitHub or portfolio evidence against this role?",
        actions: [
          { label: `Use GitHub: ${candidate?.githubUsername || "alexrivera"}`, value: candidate?.githubUsername || "alexrivera", kind: "github" },
          { label: "Add GitHub", value: "add-github", kind: "github" },
          { label: "Add portfolio", value: "add-portfolio", kind: "link" },
          { label: "Skip links", value: "skip-links", kind: "skip" },
        ],
      })
    }, 350)
  }

  function handleGithubSubmit(github: string) {
    if (github === "github" || github === "add-github") {
      pushMessage({ sender: "sherlock", text: "Paste the GitHub URL or username into the input." })
      return
    }

    pushMessage({
      sender: "user",
      text: github,
      attachment: { type: "github", label: "GitHub attached", value: github },
    })
    setContext((previous) => ({ ...previous, github }))
    askForEvidence()
  }

  function handleSkipLinks() {
    pushMessage({ sender: "user", text: "Skip links" })
    askForEvidence()
  }

  function askForEvidence() {
    setFlowState("evidence_requested")
    setTimeout(() => {
      pushMessage({
        sender: "sherlock",
        text: "Upload or paste resume/evidence?",
        actions: [
          { label: "Upload resume", value: "upload", kind: "upload" },
          { label: "Paste evidence", value: "paste", kind: "upload" },
          { label: "Skip evidence", value: "skip-evidence", kind: "skip" },
        ],
      })
    }, 350)
  }

  async function handleUpload(file: File) {
    let preview = ""
    if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".json")) {
      preview = (await file.text()).slice(0, 180)
    }

    setContext((previous) => ({
      ...previous,
      uploadedFile: { name: file.name, size: file.size, type: file.type || "unknown", preview },
      pastedEvidence: preview,
    }))
    pushMessage({
      sender: "user",
      text: "Uploaded resume",
      attachment: {
        type: "resume",
        label: "Resume attached",
        value: `${file.name} · ${Math.round(file.size / 1024)}KB`,
      },
    })
    setReadyToAnalyse()
  }

  function handleSkipResume() {
    pushMessage({ sender: "user", text: "Skip evidence" })
    setReadyToAnalyse()
  }

  function setReadyToAnalyse() {
    setFlowState("ready_to_analyse")
    setTimeout(() => {
      const name = context.candidateName || "Alex Rivera"
      pushMessage({ sender: "sherlock", text: `I have enough context. Ready to build ${name}’s proof profile.` })
    }, 350)
  }

  async function handleAnalyse() {
    setFlowState("analysing")
    setMainView("loading")
    pushMessage({ sender: "sherlock", text: "Stitching proof signals across projects, skills, GitHub, and role fit..." })
    await new Promise((resolve) => setTimeout(resolve, 1200))

    const candidate = findCandidateByName(context.candidateName || "") || DEMO_CANDIDATES.find((item) => item.name === "Alex Rivera")!
    setActiveProfile(buildProofProfile(candidate, context))
    setMainView("profile")
    setFlowState("profile_ready")
    pushMessage({ sender: "sherlock", text: "Profile built. Ask me anything about Alex’s evidence, risks, or interview plan." })
  }

  function handleChatAction(action: ChatAction, messageId: string) {
    consumeActions(messageId)

    if (action.kind === "candidate") {
      handleCandidateInput(action.value)
      return
    }
    if (action.kind === "role") {
      handleRoleSelect(action.value)
      return
    }
    if (action.kind === "github") {
      handleGithubSubmit(action.value)
      return
    }
    if (action.kind === "link") {
      pushMessage({ sender: "user", text: action.label })
      setContext((previous) => ({ ...previous, portfolio: action.value }))
      askForEvidence()
      return
    }
    if (action.kind === "upload") {
      if (action.value === "paste") {
        pushMessage({ sender: "sherlock", text: "Paste the evidence into the input." })
        return
      }
      document.getElementById("resume-upload")?.click()
      return
    }
    if (action.kind === "skip") {
      if (action.value === "skip-links") handleSkipLinks()
      if (action.value === "skip-evidence" || action.value === "skip-resume") handleSkipResume()
    }
  }

  return (
    <main className="grid h-screen min-w-0 grid-cols-[420px_minmax(0,1fr)] overflow-hidden bg-[#F4EFE7] font-mono text-[#2A2520] dark:bg-[#050505] dark:text-white">
      <input
        id="resume-upload"
        type="file"
        accept=".pdf,.txt,.md,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleUpload(file)
          event.currentTarget.value = ""
        }}
      />

      <SherlockChatPanel
        messages={messages}
        flowState={flowState}
        context={context}
        query={query}
        setQuery={setQuery}
        onSubmitQuery={() => handleCandidateInput(query)}
        onAction={handleChatAction}
        onAnalyse={handleAnalyse}
      />
      <SherlockMainCanvas view={mainView} activeProfile={activeProfile} sherlockCycle={sherlockCycle} />
    </main>
  )
}

function SherlockMainCanvas({
  view,
  activeProfile,
  sherlockCycle,
}: {
  view: MainView
  activeProfile: DemoCandidate | null
  sherlockCycle: number
}) {
  return (
    <section className="relative h-screen overflow-hidden bg-[#F7F2EA] dark:bg-[#0A0A0A]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#DED4C733_1px,transparent_1px),linear-gradient(to_bottom,#DED4C733_1px,transparent_1px)] bg-[size:32px_32px] opacity-45 dark:opacity-10" />
      {view === "loading" && <SherlockLoading cycle={sherlockCycle} />}
      {view === "profile" && activeProfile && <CandidateProofProfile candidate={activeProfile} />}
    </section>
  )
}

function SherlockLoading({ cycle }: { cycle: number }) {
  return (
    <div className="relative flex h-full items-center justify-center">
      <div className="text-center">
        <p className="mb-8 text-[13px] font-black uppercase tracking-[0.5em] text-[#B0A79E] dark:text-white/30">LOADING</p>
        <div className="flex flex-col items-center gap-3">
          <motion.div
            key={`sherlock-word-${cycle}`}
            aria-label={`Loading ${SHERLOCK_WORD}`}
            aria-live="polite"
            className="flex min-w-[18ch] items-center justify-center gap-[0.12em] text-[58px] font-normal tracking-[0.42em] text-[#4E4944] dark:text-white/70"
            animate={{
              textShadow: [
                "0 0 0 rgba(255,255,255,0)",
                "0 0 22px rgba(255,255,255,0.16)",
                "0 0 0 rgba(255,255,255,0)",
              ],
            }}
            transition={{
              delay: SHERLOCK_WORD.length * SHERLOCK_REVEAL_DELAY + 0.48,
              duration: 1.2,
              ease: SHERLOCK_REVEAL_EASE,
            }}
          >
            {SHERLOCK_WORD.split("").map((letter, index) => (
              <motion.span
                key={`${letter}-${index}`}
                aria-hidden="true"
                initial={{ opacity: 0, y: 12, filter: "blur(7px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  delay: index * SHERLOCK_REVEAL_DELAY,
                  duration: SHERLOCK_REVEAL_DURATION,
                  ease: SHERLOCK_REVEAL_EASE,
                }}
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>
          <motion.div
            key={`sherlock-underline-${cycle}`}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{
              delay: 0.08,
              duration: SHERLOCK_WORD.length * SHERLOCK_REVEAL_DELAY + 0.32,
              ease: SHERLOCK_REVEAL_EASE,
            }}
            className="h-px w-40 origin-left bg-[#FF6A00]/70 shadow-[0_0_20px_rgba(255,106,0,0.28)]"
          />
        </div>
      </div>
    </div>
  )
}
