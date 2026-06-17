"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { SherlockChatPanel, type ChatAction, type ChatMessage, type FlowState, type SearchContext } from "@/components/SherlockChatPanel"
import { SherlockEvidenceCanvas, type SherlockSourceStatus } from "@/components/sherlock/SherlockEvidenceCanvas"
import { DEMO_CANDIDATES, type DemoCandidate } from "@/data/demoCandidates"
import { mockSherlockArtifact } from "@/lib/sherlock/mock-artifact"
import type { SherlockArtifactEnvelope, SherlockClaim, SherlockEvidence, SherlockSynthesis } from "@/lib/sherlock/types"

type MainView = "loading" | "report"
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

function buildMockArtifact(candidate: DemoCandidate, context: SearchContext, extractedClaims: SherlockClaim[]): SherlockArtifactEnvelope {
  const githubValue = context.github?.replace(/^https?:\/\//, "").replace(/^github\.com\//, "") || candidate.githubUsername
  const claims = extractedClaims.length ? extractedClaims : mockSherlockArtifact.claims
  const extractedClaimVerifications = extractedClaims.map((claim) => ({
    id: `ver-${claim.id}`,
    claimId: claim.id,
    state: "unverified" as const,
    summary: "Self-reported claim extracted from user-provided text. Evidence collection has not run yet.",
    supportingEvidenceIds: [],
    contradictingEvidenceIds: [],
    proofRoute: "Run source collection or request alternative proof.",
    humanReviewRequired: true as const,
  }))

  return {
    ...mockSherlockArtifact,
    sessionId: `mock-session-${candidate.id}`,
    generatedAt: new Date().toISOString(),
    candidate: {
      displayName: candidate.name,
      handles: [
        {
          source: "GitHub",
          value: githubValue,
          url: `https://github.com/${githubValue}`,
          confidence: "high",
        },
        {
          source: "Portfolio",
          value: candidate.portfolioUrl || "not provided",
          url: candidate.portfolioUrl?.startsWith("http") ? candidate.portfolioUrl : undefined,
          confidence: candidate.portfolioUrl ? "medium" : "low",
        },
      ],
    },
    targetRole: context.role || candidate.targetRole,
    githubDepth: {
      ...mockSherlockArtifact.githubDepth,
      username: githubValue,
    },
    evidence: context.uploadedFile
      ? [
          {
            id: "ev-uploaded-resume",
            sourceType: "self_reported",
            sourceName: context.uploadedFile.name,
            retrievedAt: new Date().toISOString(),
            summary: "Uploaded resume is included as a zero-trust claim source. It does not verify itself.",
            details: [
              `${Math.round(context.uploadedFile.size / 1024)}KB uploaded`,
              context.uploadedFile.type || "File type unavailable",
              "Use extraction in a later phase to turn this into structured claims",
            ],
            reliability: "self_reported",
          },
          ...mockSherlockArtifact.evidence,
        ]
      : mockSherlockArtifact.evidence,
    claims,
    verifications: extractedClaims.length ? extractedClaimVerifications : mockSherlockArtifact.verifications,
    contradictionCards: extractedClaims.length ? [] : mockSherlockArtifact.contradictionCards,
    interviewPack: extractedClaims.length ? [] : mockSherlockArtifact.interviewPack,
    proofRoutes: extractedClaims.length
      ? [
          {
            id: "route-evidence-collection",
            label: "Run evidence collection",
            reason: "Extracted claims are self-reported and need source collection before they can be verified or contradicted.",
            requestedArtifacts: ["GitHub URL", "Portfolio URL", "Approved LinkedIn export", "Work sample"],
          },
        ]
      : mockSherlockArtifact.proofRoutes,
    summary: extractedClaims.length
      ? {
          verified: 0,
          contradicted: 0,
          unverified: extractedClaims.length,
          needsAlternativeProof: 0,
          humanReviewRequired: true,
        }
      : mockSherlockArtifact.summary,
  }
}

function inferPastedSourceKind(value: string): "resume" | "linkedin_paste" | "application" | "free_text" | "github" | "portfolio" | "other" {
  const lower = value.toLowerCase()
  if (lower.includes("linkedin.com") || lower.includes("linkedin")) return "linkedin_paste"
  if (lower.includes("github.com")) return "github"
  if (lower.includes("resume") || lower.includes("curriculum vitae")) return "resume"
  if (lower.includes("portfolio")) return "portfolio"
  return "free_text"
}

function uuidForApi(value: string | undefined) {
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : undefined
}

export default function AnalyseProfilePage() {
  const [mainView, setMainView] = useState<MainView>("loading")
  const [activeArtifact, setActiveArtifact] = useState<SherlockArtifactEnvelope | null>(null)
  const [flowState, setFlowState] = useState<FlowState>("idle")
  const [query, setQuery] = useState("")
  const [context, setContext] = useState<SearchContext>({})
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage])
  const [sherlockCycle, setSherlockCycle] = useState(0)
  const [extractedClaims, setExtractedClaims] = useState<SherlockClaim[]>([])
  const [sourceStatuses, setSourceStatuses] = useState<SherlockSourceStatus[]>([])
  const [isCollectingSources, setIsCollectingSources] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSynthesizing, setIsSynthesizing] = useState(false)

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

    if (flowState === "evidence_requested" && value.length > 24) {
      setQuery("")
      consumeAllVisibleActions()
      void handlePastedEvidence(value)
      return
    }

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
      preview = await file.text()
    } else if (file.name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/resume/extract-text", { method: "POST", body: formData })
      const result = (await response.json()) as { success?: boolean; text?: string; error?: string }
      if (result.success && result.text) {
        preview = result.text
      } else {
        pushMessage({
          sender: "sherlock",
          text: result.error || "I could not extract text from that document. Paste the resume text into the input.",
        })
      }
    } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      pushMessage({
        sender: "sherlock",
        text: "PDF extraction is not available in this phase. Paste the resume text into the input so I can extract claims.",
      })
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
    if (preview) {
      await extractClaimsFromText(preview, file.name, "resume")
    }
    setReadyToAnalyse()
  }

  async function handlePastedEvidence(value: string) {
    pushMessage({
      sender: "user",
      text: "Pasted evidence text",
      attachment: { type: "resume", label: "Evidence pasted", value: `${value.length} characters` },
    })
    setContext((previous) => ({ ...previous, pastedEvidence: value }))
    await extractClaimsFromText(value, "Pasted evidence", inferPastedSourceKind(value))
    setReadyToAnalyse()
  }

  async function extractClaimsFromText(
    text: string,
    sourceName: string,
    sourceKind: "resume" | "linkedin_paste" | "application" | "free_text" | "github" | "portfolio" | "other",
  ) {
    if (!text.trim()) return
    setFlowState("analysing")
    pushMessage({ sender: "sherlock", text: "Extracting self-reported claims. These stay unverified until evidence collection runs." })

    try {
      const response = await fetch("/api/sherlock/extract-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sourceName, sourceKind, useOpenAI: true }),
      })
      const result = (await response.json()) as {
        ok?: boolean
        extraction?: { claims?: SherlockClaim[]; warnings?: string[] }
        error?: string
      }

      if (!response.ok || !result.ok) {
        pushMessage({ sender: "sherlock", text: result.error || "Claim extraction failed. You can still continue with manual context." })
        return
      }

      const claims = result.extraction?.claims ?? []
      setExtractedClaims(claims)
      const candidate = findCandidateByName(context.candidateName || "") || DEMO_CANDIDATES.find((item) => item.name === "Alex Rivera")!
      setActiveArtifact(buildMockArtifact(candidate, { ...context, pastedEvidence: text }, claims))
      setMainView("report")
      setFlowState("evidence_requested")
      pushMessage({
        sender: "sherlock",
        text: `Extracted ${claims.length} self-reported claim${claims.length === 1 ? "" : "s"} as unverified. ${result.extraction?.warnings?.[0] ?? "Evidence collection has not run yet."}`,
      })
    } catch {
      pushMessage({ sender: "sherlock", text: "Claim extraction route is unavailable. Paste shorter text or try again." })
    }
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
    setActiveArtifact(buildMockArtifact(candidate, context, extractedClaims))
    setMainView("report")
    setFlowState("profile_ready")
    pushMessage({ sender: "sherlock", text: "Evidence report built. Ask about claims, contradictions, proof routes, or the interview pack." })
  }

  async function handleRunSourceCollection() {
    if (!activeArtifact || isCollectingSources) return
    setIsCollectingSources(true)
    pushMessage({ sender: "sherlock", text: "Running allowed source collectors. LinkedIn scraping is skipped; only user-provided or approved API data is allowed." })

    try {
      const urls = activeArtifact.candidate.handles.map((handle) => handle.url).filter((url): url is string => Boolean(url))
      const response = await fetch("/api/sherlock/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: uuidForApi(activeArtifact.sessionId),
          claims: activeArtifact.claims,
          urls,
        }),
      })
      const result = (await response.json()) as {
        ok?: boolean
        evidence?: SherlockEvidence[]
        statuses?: SherlockSourceStatus[]
        warnings?: string[]
        error?: string
      }

      if (!response.ok || !result.ok) {
        pushMessage({ sender: "sherlock", text: result.error || "Source collection failed." })
        return
      }

      const collectedEvidence = result.evidence ?? []
      const statuses = result.statuses ?? []
      setSourceStatuses(statuses)
      setActiveArtifact((previous) => {
        if (!previous) return previous
        const existing = new Set(previous.evidence.map((entry) => entry.id))
        const merged = [...previous.evidence, ...collectedEvidence.filter((entry) => !existing.has(entry.id))]
        return {
          ...previous,
          evidence: merged,
          auditRefs: [...previous.auditRefs, `source-collection-${new Date().toISOString()}`],
        }
      })
      pushMessage({
        sender: "sherlock",
        text: `Source collection finished: ${collectedEvidence.length} evidence artifact${collectedEvidence.length === 1 ? "" : "s"} added. Claims remain unverified until the verification engine runs.`,
      })
      if (result.warnings?.length) {
        pushMessage({ sender: "sherlock", text: result.warnings[0] })
      }
    } catch {
      pushMessage({ sender: "sherlock", text: "Source collection route is unavailable." })
    } finally {
      setIsCollectingSources(false)
    }
  }

  async function handleRunVerification() {
    if (!activeArtifact || isVerifying) return
    setIsVerifying(true)
    pushMessage({ sender: "sherlock", text: "Running deterministic verification with evidence-only states and human review required." })

    try {
      const response = await fetch("/api/sherlock/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: uuidForApi(activeArtifact.sessionId),
          claims: activeArtifact.claims,
          evidence: activeArtifact.evidence,
        }),
      })
      const result = (await response.json()) as {
        ok?: boolean
        verifications?: SherlockArtifactEnvelope["verifications"]
        contradictionCards?: SherlockArtifactEnvelope["contradictionCards"]
        interviewPack?: SherlockArtifactEnvelope["interviewPack"]
        proofRoutes?: SherlockArtifactEnvelope["proofRoutes"]
        summary?: SherlockArtifactEnvelope["summary"]
        error?: string
      }

      if (!response.ok || !result.ok || !result.verifications || !result.summary) {
        pushMessage({ sender: "sherlock", text: result.error || "Verification failed." })
        return
      }

      setActiveArtifact((previous) => {
        if (!previous) return previous
        return {
          ...previous,
          verifications: result.verifications ?? previous.verifications,
          contradictionCards: result.contradictionCards ?? [],
          interviewPack: result.interviewPack ?? [],
          proofRoutes: result.proofRoutes ?? [],
          summary: result.summary ?? previous.summary,
          auditRefs: [...previous.auditRefs, `verification-${new Date().toISOString()}`],
        }
      })
      pushMessage({
        sender: "sherlock",
        text: `Verification complete: ${result.summary.verified} verified, ${result.summary.contradicted} contradicted, ${result.summary.unverified} unverified, ${result.summary.needsAlternativeProof} proof routes.`,
      })
    } catch {
      pushMessage({ sender: "sherlock", text: "Verification route is unavailable." })
    } finally {
      setIsVerifying(false)
    }
  }

  async function handleRunSynthesis() {
    if (!activeArtifact || isSynthesizing) return
    setIsSynthesizing(true)
    pushMessage({ sender: "sherlock", text: "Creating evidence-only synthesis from normalized claims, artifacts, and verification states." })

    try {
      const response = await fetch("/api/sherlock/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: uuidForApi(activeArtifact.sessionId),
          claims: activeArtifact.claims,
          evidence: activeArtifact.evidence,
          verifications: activeArtifact.verifications,
          interviewPack: activeArtifact.interviewPack,
          proofRoutes: activeArtifact.proofRoutes,
          candidateName: activeArtifact.candidate.displayName,
          targetRole: activeArtifact.targetRole,
          useOpenAI: true,
        }),
      })
      const result = (await response.json()) as {
        ok?: boolean
        synthesis?: SherlockSynthesis
        error?: string
      }

      if (!response.ok || !result.ok || !result.synthesis) {
        pushMessage({ sender: "sherlock", text: result.error || "Synthesis route is unavailable." })
        return
      }

      setActiveArtifact((previous) => {
        if (!previous) return previous
        return {
          ...previous,
          synthesis: result.synthesis,
          interviewPack: result.synthesis?.interviewPack ?? previous.interviewPack,
          auditRefs: [...previous.auditRefs, `synthesis-${new Date().toISOString()}`],
        }
      })
      pushMessage({
        sender: "sherlock",
        text:
          result.synthesis.method === "openai_structured"
            ? "Evidence-only synthesis complete. The share report tab is ready."
            : "Evidence-only synthesis complete using the deterministic fallback. Add OPENAI_API_KEY to enable model-written summaries.",
      })
    } catch {
      pushMessage({ sender: "sherlock", text: "Synthesis route is unavailable." })
    } finally {
      setIsSynthesizing(false)
    }
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
        accept=".pdf,.docx,.txt,.md,.json"
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
      <SherlockMainCanvas
        view={mainView}
        activeArtifact={activeArtifact}
        sherlockCycle={sherlockCycle}
        onRunSourceCollection={handleRunSourceCollection}
        onRunVerification={handleRunVerification}
        onRunSynthesis={handleRunSynthesis}
        isCollectingSources={isCollectingSources}
        isVerifying={isVerifying}
        isSynthesizing={isSynthesizing}
        sourceStatuses={sourceStatuses}
      />
    </main>
  )
}

function SherlockMainCanvas({
  view,
  activeArtifact,
  sherlockCycle,
  onRunSourceCollection,
  onRunVerification,
  onRunSynthesis,
  isCollectingSources,
  isVerifying,
  isSynthesizing,
  sourceStatuses,
}: {
  view: MainView
  activeArtifact: SherlockArtifactEnvelope | null
  sherlockCycle: number
  onRunSourceCollection: () => void
  onRunVerification: () => void
  onRunSynthesis: () => void
  isCollectingSources: boolean
  isVerifying: boolean
  isSynthesizing: boolean
  sourceStatuses: SherlockSourceStatus[]
}) {
  return (
    <section className="relative h-screen overflow-hidden bg-[#F7F2EA] dark:bg-[#0A0A0A]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#DED4C733_1px,transparent_1px),linear-gradient(to_bottom,#DED4C733_1px,transparent_1px)] bg-[size:32px_32px] opacity-45 dark:opacity-10" />
      {view === "loading" && <SherlockLoading cycle={sherlockCycle} />}
      {view === "report" && activeArtifact && (
        <SherlockEvidenceCanvas
          artifact={activeArtifact}
          onRunSourceCollection={onRunSourceCollection}
          onRunVerification={onRunVerification}
          onRunSynthesis={onRunSynthesis}
          isCollectingSources={isCollectingSources}
          isVerifying={isVerifying}
          isSynthesizing={isSynthesizing}
          sourceStatuses={sourceStatuses}
        />
      )}
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
