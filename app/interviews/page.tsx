"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowUp, ArrowUpRight } from "lucide-react"
import { BrandOrbLoader } from "@/components/BrandOrbLoader"
import { CandidateProofProfile } from "@/components/CandidateProofProfile"
import { AffiliationLogoChip, type CandidateAffiliation } from "@/components/interviews/AffiliationLogoChip"
import { DEMO_CANDIDATES, type DemoCandidate } from "@/data/demoCandidates"

type InterviewView = "list" | "profile"

type ChatAction = {
  label: string
  value: string
  kind: "candidate" | "filter" | "message"
}

type ChatMessage = {
  id: string
  sender: "sherlock" | "user"
  text: string
  actions?: ChatAction[]
}

type SelectedInterviewCandidate = {
  id: string
  name: string
  email: string
  avatarUrl: string
  role: string
  confidence: number
  evidenceCount: number
  interviewType: string
  riskLevel: "Low" | "Medium" | "High"
  status: "Packet Ready" | "Selected" | "Review"
  priority: "high" | "medium" | "watch"
  brief: string
  affiliations: CandidateAffiliation[]
  profile: DemoCandidate
}

const selectedSpecs = [
  {
    name: "Alex Rivera",
    status: "Packet Ready",
    interviewType: "Technical",
    riskLevel: "Low",
    priority: "high",
    brief: "Probe Rust queue design, auth service tradeoffs, and Kubernetes deployment maturity.",
  },
  {
    name: "Maya Chen",
    status: "Packet Ready",
    interviewType: "Systems",
    riskLevel: "Low",
    priority: "high",
    brief: "Validate Rust systems depth, debugging notes, and production readiness.",
  },
  {
    name: "Owen Brooks",
    status: "Selected",
    interviewType: "Backend",
    riskLevel: "Medium",
    priority: "high",
    brief: "Test platform reliability judgment and Kubernetes tradeoff awareness.",
  },
  {
    name: "Priya Mehta",
    status: "Packet Ready",
    interviewType: "Backend",
    riskLevel: "Medium",
    priority: "high",
    brief: "Strong API and platform signals. Validate distributed ownership and incident response.",
  },
  {
    name: "Liam Torres",
    status: "Selected",
    interviewType: "Portfolio",
    riskLevel: "Medium",
    priority: "medium",
    brief: "Review product systems thinking, handoff quality, and design-to-engineering collaboration.",
  },
  {
    name: "Anika Sharma",
    status: "Selected",
    interviewType: "Analytics",
    riskLevel: "Low",
    priority: "medium",
    brief: "Assess dashboard judgment, SQL depth, and ability to explain business impact.",
  },
  {
    name: "James Wu",
    status: "Review",
    interviewType: "Pairing",
    riskLevel: "Medium",
    priority: "watch",
    brief: "Validate UI craft, accessibility habits, and component-state discipline.",
  },
  {
    name: "Sara Okafor",
    status: "Selected",
    interviewType: "ML Screen",
    riskLevel: "Medium",
    priority: "medium",
    brief: "Check applied ML judgment, model evaluation habits, and product deployment tradeoffs.",
  },
  {
    name: "Sofia Alvarez",
    status: "Selected",
    interviewType: "Product",
    riskLevel: "Low",
    priority: "medium",
    brief: "Validate marketplace/product judgment and cross-functional execution evidence.",
  },
  {
    name: "Daniel Kim",
    status: "Review",
    interviewType: "Technical",
    riskLevel: "Medium",
    priority: "watch",
    brief: "Confirm systems fundamentals and whether hackathon velocity maps to production depth.",
  },
  {
    name: "Ethan Chen",
    status: "Selected",
    interviewType: "Full-stack",
    riskLevel: "Medium",
    priority: "medium",
    brief: "Probe frontend/backend boundaries and whether systems evidence matches startup pace.",
  },
] satisfies Array<{
  name: string
  status: "Packet Ready" | "Selected" | "Review"
  interviewType: string
  riskLevel: "Low" | "Medium" | "High"
  priority: "high" | "medium" | "watch"
  brief: string
}>

const affiliationSets: Record<string, CandidateAffiliation[]> = {
  "Alex Rivera": [
    { id: "alex-usyd", name: "University of Sydney", type: "University", role: "Computer Science", date: "2023-2026", description: "Systems, backend engineering, and distributed systems coursework.", logoText: "USYD", accent: "red", verified: true },
    { id: "alex-microsoft", name: "Microsoft", type: "Internship", role: "Software Engineering Intern", date: "Summer 2025", description: "Worked on backend service reliability and internal tooling.", logoText: "MS", accent: "blue", verified: true },
    { id: "alex-amazon", name: "Amazon", type: "Company", role: "Backend Systems Project", date: "2024", description: "Mock fulfilment and queue architecture project mapped to Amazon-style systems problems.", logoText: "amz", accent: "orange", verified: false },
    { id: "alex-github", name: "GitHub", type: "Open Source", role: "Rust backend repos", date: "Active", description: "Evidence from public repositories and commit history.", logoText: "GH", accent: "neutral", verified: true },
    { id: "alex-enactus", name: "Enactus", type: "Club", role: "Technical contributor", date: "2024", description: "Student entrepreneurship and impact project collaboration.", logoText: "EN", accent: "green", verified: true },
  ],
  "Priya Mehta": [
    { id: "priya-canva", name: "Canva", type: "Company", role: "Backend systems project", date: "2025", description: "Design-platform API and reliability work used as backend evidence.", logoText: "CV", accent: "purple", verified: true },
    { id: "priya-usyd", name: "University of Sydney", type: "University", role: "Software Engineering", date: "2022-2025", description: "Distributed systems and database coursework.", logoText: "USYD", accent: "red", verified: true },
    { id: "priya-wie", name: "Women in Engineering", type: "Society", role: "Mentor", date: "2024", description: "Peer mentoring and technical community signal.", logoText: "WIE", accent: "green", verified: true },
    { id: "priya-github", name: "GitHub", type: "Open Source", role: "Go and Rust repos", date: "Active", description: "Public API and service reliability projects.", logoText: "GH", accent: "neutral", verified: true },
    { id: "priya-atlassian", name: "Atlassian", type: "Internship", role: "Platform intern", date: "2024", description: "Declared platform tooling internship signal.", logoText: "ATL", accent: "blue", verified: false },
  ],
  "Maya Chen": [
    { id: "maya-merge", name: "Merge", type: "Company", role: "Rust Systems Engineer", date: "Current", description: "Infrastructure and integrations signal from production systems work.", logoText: "MRG", accent: "blue", verified: true },
    { id: "maya-unsw", name: "UNSW", type: "University", role: "Computer Science", date: "2021-2024", description: "Systems coursework and research-oriented engineering foundations.", logoText: "UNSW", accent: "purple", verified: true },
    { id: "maya-gdsc", name: "Google Developer Student Club", type: "Club", role: "Infrastructure lead", date: "2023", description: "Student engineering leadership and workshop evidence.", logoText: "GDSC", accent: "green", verified: true },
    { id: "maya-kaggle", name: "Kaggle", type: "Portfolio", role: "Data systems notebooks", date: "Active", description: "Supplementary experimentation and analytics evidence.", logoText: "KG", accent: "orange", verified: false },
    { id: "maya-github", name: "GitHub", type: "Open Source", role: "Rust infra repos", date: "Active", description: "Public systems repositories and debugging notes.", logoText: "GH", accent: "neutral", verified: true },
  ],
  "Anika Sharma": [
    { id: "anika-bcg", name: "BCG", type: "Internship", role: "Analytics intern", date: "2025", description: "Case analytics and business-facing data storytelling signal.", logoText: "BCG", accent: "green", verified: true },
    { id: "anika-usyd", name: "University of Sydney", type: "University", role: "Data Science", date: "2022-2025", description: "Statistics, SQL, and dashboard coursework.", logoText: "USYD", accent: "red", verified: true },
    { id: "anika-datasoc", name: "DataSoc", type: "Society", role: "Dashboard lead", date: "2024", description: "Student analytics society project leadership.", logoText: "DS", accent: "blue", verified: true },
    { id: "anika-tableau", name: "Tableau Public", type: "Portfolio", role: "BI dashboard portfolio", date: "Active", description: "Public dashboards and business insight examples.", logoText: "TB", accent: "purple", verified: true },
    { id: "anika-kaggle", name: "Kaggle", type: "Portfolio", role: "SQL notebooks", date: "Active", description: "Analytics notebooks and model exploration.", logoText: "KG", accent: "orange", verified: false },
  ],
  "James Wu": [
    { id: "james-figma", name: "Figma", type: "Portfolio", role: "Design systems", date: "Active", description: "Component libraries and interaction prototypes.", logoText: "FG", accent: "purple", verified: true },
    { id: "james-umelb", name: "University of Melbourne", type: "University", role: "Interaction Design", date: "2021-2024", description: "Design systems, accessibility, and frontend coursework.", logoText: "UM", accent: "red", verified: true },
    { id: "james-ph", name: "Product Hunt", type: "Portfolio", role: "Launch projects", date: "2024", description: "Product shipping and public launch signal.", logoText: "PH", accent: "orange", verified: false },
    { id: "james-dribbble", name: "Dribbble", type: "Portfolio", role: "UI explorations", date: "Active", description: "Visual design and product craft portfolio.", logoText: "DB", accent: "red", verified: false },
    { id: "james-github", name: "GitHub", type: "Open Source", role: "Frontend repos", date: "Active", description: "React component and accessibility code evidence.", logoText: "GH", accent: "neutral", verified: true },
  ],
  "Liam Torres": [
    { id: "liam-canva", name: "Canva", type: "Company", role: "Product design project", date: "2025", description: "Design-system and collaboration signal.", logoText: "CV", accent: "purple", verified: true },
    { id: "liam-uts", name: "UTS", type: "University", role: "Product Design", date: "2021-2024", description: "Human-centred design and prototyping coursework.", logoText: "UTS", accent: "blue", verified: true },
    { id: "liam-designsoc", name: "Design Society", type: "Society", role: "Workshop lead", date: "2024", description: "Community critique and design facilitation evidence.", logoText: "DS", accent: "green", verified: true },
    { id: "liam-behance", name: "Behance", type: "Portfolio", role: "Case studies", date: "Active", description: "Public product case studies and visual systems.", logoText: "BE", accent: "blue", verified: false },
    { id: "liam-figma", name: "Figma Community", type: "Portfolio", role: "Published templates", date: "Active", description: "Reusable design assets and interaction kits.", logoText: "FG", accent: "purple", verified: true },
  ],
  "Owen Brooks": [
    { id: "owen-aws", name: "AWS", type: "Internship", role: "Cloud platform intern", date: "2025", description: "Reliability, infrastructure, and cloud operations signal.", logoText: "AWS", accent: "orange", verified: true },
    { id: "owen-usyd", name: "University of Sydney", type: "University", role: "Computer Science", date: "2022-2025", description: "Distributed systems and networking coursework.", logoText: "USYD", accent: "red", verified: true },
    { id: "owen-k8s", name: "Kubernetes Community", type: "Open Source", role: "Docs contributor", date: "Active", description: "Cloud-native contribution and operational fluency.", logoText: "K8S", accent: "blue", verified: true },
    { id: "owen-github", name: "GitHub", type: "Open Source", role: "Platform repos", date: "Active", description: "Service reliability projects and deployment tooling.", logoText: "GH", accent: "neutral", verified: true },
    { id: "owen-hashi", name: "HashiCorp", type: "Portfolio", role: "Terraform modules", date: "2024", description: "Infrastructure-as-code project evidence.", logoText: "HC", accent: "purple", verified: false },
  ],
  "Sofia Alvarez": [
    { id: "sofia-atlassian", name: "Atlassian", type: "Company", role: "Product ops project", date: "2025", description: "Marketplace workflow and collaboration evidence.", logoText: "ATL", accent: "blue", verified: true },
    { id: "sofia-unsw", name: "UNSW", type: "University", role: "Information Systems", date: "2022-2025", description: "Product analytics and systems coursework.", logoText: "UNSW", accent: "purple", verified: true },
    { id: "sofia-startmate", name: "Startmate", type: "Accelerator", role: "Student fellow", date: "2024", description: "Startup network and product discovery signal.", logoText: "SM", accent: "orange", verified: true },
    { id: "sofia-github", name: "GitHub", type: "Open Source", role: "Internal tools", date: "Active", description: "Lightweight product tooling repositories.", logoText: "GH", accent: "neutral", verified: false },
    { id: "sofia-ph", name: "Product Hunt", type: "Portfolio", role: "Launch analysis", date: "2024", description: "Product launch and market research artifacts.", logoText: "PH", accent: "orange", verified: false },
  ],
  "Daniel Kim": [
    { id: "daniel-ms", name: "Microsoft", type: "Internship", role: "Software engineering intern", date: "2025", description: "Backend tooling and service design internship signal.", logoText: "MS", accent: "blue", verified: true },
    { id: "daniel-usyd", name: "University of Sydney", type: "University", role: "Software Engineering", date: "2022-2025", description: "Systems programming and cloud coursework.", logoText: "USYD", accent: "red", verified: true },
    { id: "daniel-gdsc", name: "Google Developer Student Club", type: "Club", role: "Backend mentor", date: "2024", description: "Student developer leadership evidence.", logoText: "GDSC", accent: "green", verified: true },
    { id: "daniel-github", name: "GitHub", type: "Open Source", role: "TypeScript and Go repos", date: "Active", description: "Public project and review history.", logoText: "GH", accent: "neutral", verified: true },
    { id: "daniel-hack", name: "Hackathon Winner", type: "Hackathon", role: "Backend lead", date: "2024", description: "Fast build and team execution signal.", logoText: "WIN", accent: "orange", verified: true },
  ],
  "Sara Okafor": [
    { id: "sara-deloitte", name: "Deloitte", type: "Internship", role: "Data engineering intern", date: "2025", description: "Analytics pipeline and client-facing data signal.", logoText: "DL", accent: "green", verified: true },
    { id: "sara-monash", name: "Monash University", type: "University", role: "Machine Learning", date: "2022-2025", description: "ML, statistics, and data engineering coursework.", logoText: "MON", accent: "red", verified: true },
    { id: "sara-data", name: "Data Engineering Club", type: "Club", role: "Project lead", date: "2024", description: "Pipeline and warehouse project collaboration.", logoText: "DE", accent: "blue", verified: true },
    { id: "sara-snowflake", name: "Snowflake", type: "Portfolio", role: "Warehouse demos", date: "2024", description: "Warehouse modelling and SQL proof artifacts.", logoText: "SF", accent: "blue", verified: false },
    { id: "sara-github", name: "GitHub", type: "Open Source", role: "ML and data repos", date: "Active", description: "Public notebooks and pipeline repositories.", logoText: "GH", accent: "neutral", verified: true },
  ],
  "Ethan Chen": [
    { id: "ethan-aws", name: "AWS", type: "Company", role: "Cloud systems project", date: "2025", description: "Serverless and deployment pipeline evidence.", logoText: "AWS", accent: "orange", verified: true },
    { id: "ethan-mq", name: "Macquarie University", type: "University", role: "Computer Science", date: "2022-2025", description: "Cloud, Linux, and distributed application coursework.", logoText: "MQ", accent: "red", verified: true },
    { id: "ethan-docker", name: "Docker Community", type: "Open Source", role: "Container demos", date: "Active", description: "Containerisation and local development tooling proof.", logoText: "DK", accent: "blue", verified: true },
    { id: "ethan-github", name: "GitHub", type: "Open Source", role: "Full-stack repos", date: "Active", description: "Public application and deployment repositories.", logoText: "GH", accent: "neutral", verified: true },
    { id: "ethan-linux", name: "Linux Foundation", type: "Portfolio", role: "Certification prep", date: "2024", description: "Linux operations and systems fundamentals signal.", logoText: "LF", accent: "green", verified: false },
  ],
}

const initialMessages: ChatMessage[] = [
  {
    id: "m0",
    sender: "sherlock",
    text: "These candidates are already selected for interview. I can help you prep, filter, or open a candidate profile.",
    actions: [
      { label: "Show priority interviews", value: "priority", kind: "filter" },
      { label: "Open Alex Rivera", value: "Alex Rivera", kind: "candidate" },
      { label: "Prep technical screens", value: "technical", kind: "filter" },
    ],
  },
]

export default function InterviewsPage() {
  const selectedCandidates = useMemo(
    () =>
      selectedSpecs
        .map((spec) => {
          const profile = DEMO_CANDIDATES.find((candidate) => candidate.name === spec.name)
          if (!profile) return null

          return {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            avatarUrl: profile.avatarUrl || `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(profile.name)}`,
            role: profile.targetRole,
            confidence: profile.roleMatchScore,
            evidenceCount: profile.evidence.length + profile.projects.length,
            interviewType: spec.interviewType,
            riskLevel: spec.riskLevel,
            status: spec.status,
            priority: spec.priority,
            brief: spec.brief,
            affiliations: affiliationSets[profile.name] ?? [],
            profile,
          }
        })
        .filter(Boolean) as SelectedInterviewCandidate[],
    []
  )
  const [view, setView] = useState<InterviewView>("list")
  const [activeCandidate, setActiveCandidate] = useState<DemoCandidate | null>(null)
  const [query, setQuery] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [filter, setFilter] = useState<"all" | "priority" | "technical">("all")

  const visibleCandidates = selectedCandidates.filter((candidate) => {
    if (filter === "priority") return candidate.priority === "high"
    if (filter === "technical") return /technical|backend|frontend|systems|platform|pairing/i.test(`${candidate.interviewType} ${candidate.role}`)
    return true
  })

  function pushMessage(message: Omit<ChatMessage, "id">) {
    setMessages((previous) => [...previous, { ...message, id: crypto.randomUUID() }])
  }

  function consumeActions(messageId: string) {
    setMessages((previous) => previous.map((message) => (message.id === messageId ? { ...message, actions: [] } : message)))
  }

  function openCandidate(candidate: SelectedInterviewCandidate) {
    setActiveCandidate({ ...candidate.profile, affiliations: candidate.affiliations })
    setView("profile")
    pushMessage({ sender: "user", text: `Open ${candidate.name}` })
    pushMessage({
      sender: "sherlock",
      text: `${candidate.name}'s interview profile is open. Best prep angle: ${candidate.brief}`,
      actions: [
        { label: "Back to list", value: "list", kind: "message" },
        { label: "Draft prep note", value: "prep", kind: "message" },
      ],
    })
  }

  function handleSubmitQuery() {
    const value = query.trim()
    if (!value) return
    setQuery("")
    pushMessage({ sender: "user", text: value })

    const candidate = selectedCandidates.find((item) => {
      const haystack = [item.name, item.role, item.email, item.profile.currentCompany, item.profile.skills.join(" "), item.interviewType].join(" ").toLowerCase()
      return haystack.includes(value.toLowerCase())
    })

    if (candidate) {
      setTimeout(() => openCandidate(candidate), 250)
      return
    }

    setFilter(value.toLowerCase().includes("technical") ? "technical" : "all")
    setView("list")
    pushMessage({
      sender: "sherlock",
      text: "I checked the selected interview pool. The list is updated with the closest matching interview candidates.",
    })
  }

  function handleAction(action: ChatAction, messageId: string) {
    consumeActions(messageId)
    if (action.kind === "candidate") {
      const candidate = selectedCandidates.find((item) => item.name === action.value)
      if (candidate) openCandidate(candidate)
      return
    }
    if (action.kind === "filter") {
      setFilter(action.value === "priority" ? "priority" : "technical")
      setView("list")
      pushMessage({ sender: "user", text: action.label })
      pushMessage({
        sender: "sherlock",
        text: action.value === "priority" ? "Showing high-priority interview selections." : "Showing interviews that need technical prep.",
      })
      return
    }
    if (action.value === "list") {
      setView("list")
      pushMessage({ sender: "user", text: "Back to list" })
      return
    }
    pushMessage({ sender: "user", text: action.label })
    pushMessage({ sender: "sherlock", text: "Prep note: lead with proof, validate one risk, and end with a concrete next-step recommendation." })
  }

  return (
    <main className="grid h-screen min-w-0 grid-cols-[420px_minmax(0,1fr)] overflow-hidden bg-[#F4EFE7] font-mono text-[#2A2520] dark:bg-[#050505] dark:text-white">
      <InterviewSherlockChat messages={messages} query={query} setQuery={setQuery} onSubmitQuery={handleSubmitQuery} onAction={handleAction} />
      <InterviewMainCanvas
        view={view}
        candidates={visibleCandidates}
        activeCandidate={activeCandidate}
        onOpenCandidate={openCandidate}
        onBackToList={() => setView("list")}
        filter={filter}
      />
    </main>
  )
}

function InterviewSherlockChat({
  messages,
  query,
  setQuery,
  onSubmitQuery,
  onAction,
}: {
  messages: ChatMessage[]
  query: string
  setQuery: (value: string) => void
  onSubmitQuery: () => void
  onAction: (action: ChatAction, messageId: string) => void
}) {
  return (
    <section className="relative h-screen border-r border-[#DED4C7]/70 bg-[#F7F2EA] dark:border-white/[0.06] dark:bg-[#0A0A0A]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#DED4C733_1px,transparent_1px),linear-gradient(to_bottom,#DED4C733_1px,transparent_1px)] bg-[size:32px_32px] opacity-25 dark:opacity-10" />
      <div className="relative flex h-full flex-col px-6 pb-28 pt-8">
        <div className="mb-6 flex items-center gap-4">
          <BrandOrbLoader />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#8A8177] dark:text-white/40">Sherlock</p>
            <p className="mt-1 text-[12px] font-bold tracking-[-0.03em] text-[#4E4944] dark:text-white/70">interview command live</p>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.map((message) => (
            <InterviewChatBubble key={message.id} message={message} onAction={onAction} />
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmitQuery()
          }}
          className="absolute bottom-9 left-7 right-7"
        >
          <div className="relative rounded-[22px] bg-[#FFFDF8]/95 p-2 shadow-[0_18px_45px_rgba(42,37,32,0.14)] backdrop-blur-xl dark:bg-[#141414] dark:shadow-none">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ask about interview prep"
              className="h-[54px] w-full rounded-[17px] bg-transparent px-5 pr-14 text-[18px] tracking-[-0.06em] text-[#2A2520] outline-none placeholder:text-[#BDB6AE] dark:text-white dark:placeholder:text-white/30"
            />
            <button
              type="submit"
              className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-[#F7F2EA] text-[#BDB6AE] transition hover:bg-[#FF6A00] hover:text-white dark:bg-white/10 dark:hover:bg-[#FF6A00]"
              aria-label="Send interview message"
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

function InterviewChatBubble({ message, onAction }: { message: ChatMessage; onAction: (action: ChatAction, messageId: string) => void }) {
  const isUser = message.sender === "user"
  return (
    <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div className={isUser ? "max-w-[86%]" : "max-w-[92%]"}>
        <div
          className={
            isUser
              ? "ml-auto max-w-full rounded-[24px] rounded-tr-md bg-[#2A2520] px-4 py-3 text-[12px] font-bold leading-5 tracking-[-0.03em] text-[#FFFDF8] dark:bg-white dark:text-[#2A2520]"
              : "max-w-full rounded-[24px] rounded-tl-md border border-[#DED4C7] bg-[#FFFDF8]/95 px-4 py-3 text-[12px] font-bold leading-5 tracking-[-0.03em] text-[#6F675F] shadow-[0_8px_20px_rgba(42,37,32,0.08)] dark:border-white/10 dark:bg-[#141414] dark:text-white/70 dark:shadow-none"
          }
        >
          {message.text}
        </div>
        {message.actions?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.actions.map((action) => (
              <button
                key={`${message.id}-${action.label}`}
                onClick={() => onAction(action, message.id)}
                className="rounded-full border border-[#DED4C7] bg-[#EEE8DF] px-3.5 py-2 text-[11px] font-black tracking-[-0.03em] text-[#6F675F] transition hover:border-[#FF6A00]/50 hover:bg-[#FFE1C7] hover:text-[#FF6A00] dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10 dark:hover:text-orange-300"
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}

function InterviewMainCanvas({
  view,
  candidates,
  activeCandidate,
  onOpenCandidate,
  onBackToList,
  filter,
}: {
  view: InterviewView
  candidates: SelectedInterviewCandidate[]
  activeCandidate: DemoCandidate | null
  onOpenCandidate: (candidate: SelectedInterviewCandidate) => void
  onBackToList: () => void
  filter: "all" | "priority" | "technical"
}) {
  return (
    <section className="relative h-screen min-w-0 overflow-y-auto overflow-x-hidden bg-[#F7F2EA] px-8 py-9 dark:bg-[#0A0A0A]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#DED4C733_1px,transparent_1px),linear-gradient(to_bottom,#DED4C733_1px,transparent_1px)] bg-[size:32px_32px] opacity-45 dark:opacity-10" />
      {view === "list" && <SelectedInterviewList candidates={candidates} onOpenCandidate={onOpenCandidate} />}
      {view === "profile" && activeCandidate && (
        <div className="relative h-full min-w-0">
          <button
            onClick={onBackToList}
            className="absolute left-8 top-7 z-10 inline-flex items-center gap-2 rounded-full border border-[#DED4C7] bg-[#FBF7EF]/90 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#6F675F] shadow-[0_12px_35px_rgba(42,37,32,0.08)] transition hover:bg-[#FFE1C7] hover:text-[#FF6A00] dark:border-white/10 dark:bg-[#141414]/90 dark:text-white/60 dark:shadow-none dark:hover:bg-orange-500/10 dark:hover:text-orange-300"
          >
            <ArrowLeft size={15} />
            List
          </button>
          <CandidateProofProfile candidate={activeCandidate} />
        </div>
      )}
    </section>
  )
}

function SelectedInterviewList({
  candidates,
  onOpenCandidate,
}: {
  candidates: SelectedInterviewCandidate[]
  onOpenCandidate: (candidate: SelectedInterviewCandidate) => void
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative min-h-full min-w-0">
      <div className="mx-auto min-w-0 max-w-[1180px]">
        <div className="min-w-0">
          <div className="min-w-0">
            <p className="text-[12px] font-black uppercase tracking-[0.34em] text-[#8A8177] dark:text-white/40">Interview selected</p>
            <h1 className="mt-3 max-w-[760px] text-[clamp(38px,4vw,54px)] font-black leading-none tracking-[-0.08em] text-[#2A2520] dark:text-white">Candidates ready for screen</h1>
          </div>
        </div>

        <TopProofSources candidates={candidates} />

        <div className="mt-8 overflow-x-auto">
          <div className="min-w-[1040px]">
            <SelectedCandidatesListHeader />
            <SelectedCandidatesList candidates={candidates} onOpenCandidate={onOpenCandidate} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function SelectedCandidatesListHeader() {
  return (
    <div className="grid grid-cols-[minmax(280px,1.6fr)_minmax(140px,0.8fr)_120px_100px_150px_100px_44px] border-y border-[#DED4C7] bg-[#EEE8DF]/35 px-7 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-[#8A8177] dark:border-white/10 dark:bg-white/[0.03] dark:text-white/40">
      <div>Candidate</div>
      <div className="text-center">Role</div>
      <div className="text-center">Confidence</div>
      <div className="text-center">Proofs</div>
      <div className="text-center">Interview</div>
      <div className="text-center">Risk</div>
      <div />
    </div>
  )
}

function SelectedCandidatesList({
  candidates,
  onOpenCandidate,
}: {
  candidates: SelectedInterviewCandidate[]
  onOpenCandidate: (candidate: SelectedInterviewCandidate) => void
}) {
  return (
    <div className="overflow-hidden border-b border-[#DED4C7] bg-[#F7F2EA]/40 dark:border-white/10 dark:bg-transparent">
      {candidates.map((candidate) => (
        <button
          key={candidate.id}
          onClick={() => onOpenCandidate(candidate)}
          className="group grid w-full grid-cols-[minmax(280px,1.6fr)_minmax(140px,0.8fr)_120px_100px_150px_100px_44px] items-center border-b border-[#DED4C7] px-7 py-5 text-left transition hover:bg-[#FBF7EF] dark:border-white/10 dark:hover:bg-white/[0.04]"
        >
          <div className="flex min-w-0 items-center gap-4">
            <img
              src={candidate.avatarUrl}
              alt={candidate.name}
              className="h-14 w-14 shrink-0 rounded-full border border-[#DED4C7] bg-[#EEE8DF] object-cover dark:border-white/10 dark:bg-[#1C1C1C]"
            />
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-3">
                <p className="truncate text-[18px] font-black tracking-[-0.04em] text-[#2A2520] group-hover:text-[#00876A] dark:text-white dark:group-hover:text-emerald-300">{candidate.name}</p>
                <CandidateListBadge candidate={candidate} />
              </div>
              <p className="mt-1 truncate text-[13px] font-bold tracking-[-0.03em] text-[#8A8177] dark:text-white/40">{candidate.email}</p>
              <RowLogoStack candidate={candidate} />
            </div>
          </div>
          <div className="text-center">
            <p className="truncate text-[15px] font-black tracking-[-0.04em] text-[#6F675F] dark:text-white/60">{candidate.role}</p>
          </div>
          <MetricBlock value={`${candidate.confidence}%`} label="Confidence" tone="green" />
          <MetricBlock value={String(candidate.evidenceCount)} label="Proofs" tone="blue" />
          <div className="text-center">
            <p className="truncate text-[14px] font-black tracking-[-0.04em] text-[#6F675F] dark:text-white/60">{candidate.interviewType}</p>
            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#8A8177] dark:text-white/40">Interview</p>
          </div>
          <RiskListBadge level={candidate.riskLevel} />
          <div className="flex justify-end">
            <ArrowUpRight
              size={20}
              className="text-[#8A8177] transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[#FF6A00] dark:text-white/40 dark:group-hover:text-orange-300"
            />
          </div>
        </button>
      ))}
    </div>
  )
}

function TopProofSources({ candidates }: { candidates: SelectedInterviewCandidate[] }) {
  const sources = Array.from(
    new Map(candidates.flatMap((candidate) => candidate.affiliations ?? []).map((affiliation) => [affiliation.name, affiliation])).values()
  ).slice(0, 14)

  if (!sources.length) return null

  return (
    <section className="mt-8 rounded-[30px] border border-[#DED4C7] bg-[#FBF7EF]/80 p-5 shadow-[0_18px_50px_rgba(42,37,32,0.06)] dark:border-white/10 dark:bg-[#101010]/90 dark:shadow-none">
      <div className="flex items-center justify-between gap-6">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#8A8177] dark:text-white/40">Top proof sources</p>
          <p className="mt-2 text-[13px] font-bold tracking-[-0.03em] text-[#6F675F] dark:text-white/55">
            Work, university, club, and open-source signals across selected candidates.
          </p>
        </div>
        <div className="flex max-w-[680px] flex-wrap justify-end gap-2">
          {sources.map((source) => (
            <AffiliationLogoChip key={source.id} affiliation={source} compact />
          ))}
        </div>
      </div>
    </section>
  )
}

function RowLogoStack({ candidate }: { candidate: SelectedInterviewCandidate }) {
  const items = candidate.affiliations?.slice(0, 3) ?? []
  if (!items.length) return null

  return (
    <div className="mt-2 flex items-center gap-1.5">
      {items.map((item) => (
        <div
          key={item.id}
          title={item.name}
          className="grid h-6 w-6 place-items-center rounded-full border border-[#DED4C7] bg-[#FBF7EF] text-[7px] font-black uppercase text-[#6F675F] dark:border-white/10 dark:bg-[#141414] dark:text-white/55"
        >
          {item.logoText}
        </div>
      ))}
    </div>
  )
}

function CandidateListBadge({ candidate }: { candidate: SelectedInterviewCandidate }) {
  const isVip = candidate.confidence >= 90
  const label = candidate.status === "Packet Ready" ? "READY" : isVip ? "VIP" : candidate.confidence >= 85 ? "HIGH FIT" : "REVIEW"
  const cls =
    label === "VIP"
      ? "border-[#74E7BD] bg-[#DDF8EB] text-[#00876A]"
      : label === "READY"
        ? "border-[#D8CAFF] bg-[#EEE7FF] text-[#8B5CF6]"
        : label === "HIGH FIT"
          ? "border-[#C9D8FF] bg-[#E7EEFF] text-[#4077EE]"
          : "border-[#FFC99D] bg-[#FFE1C7] text-[#FF6A00]"

  return (
    <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${cls}`}>{label}</span>
  )
}

function MetricBlock({
  value,
  label,
  tone,
}: {
  value: string
  label: string
  tone: "green" | "blue" | "purple" | "orange"
}) {
  const toneMap = {
    green: "text-[#18A86B]",
    blue: "text-[#4077EE]",
    purple: "text-[#8B5CF6]",
    orange: "text-[#FF6A00]",
  }

  return (
    <div className="text-center">
      <p className={`text-[19px] font-black leading-none tracking-[-0.05em] ${toneMap[tone]}`}>{value}</p>
      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8A8177] dark:text-white/40">{label}</p>
    </div>
  )
}

function RiskListBadge({ level }: { level: "Low" | "Medium" | "High" }) {
  const cls = level === "Low" ? "text-[#18A86B]" : level === "Medium" ? "text-[#FF6A00]" : "text-[#E24740]"

  return (
    <div className="text-center">
      <p className={`text-[15px] font-black uppercase tracking-[-0.03em] ${cls}`}>{level}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#8A8177] dark:text-white/40">Risk</p>
    </div>
  )
}
