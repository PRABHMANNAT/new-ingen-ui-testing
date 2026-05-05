import type { CandidateAffiliation } from "@/components/interviews/AffiliationLogoChip"

export type ProofItem = {
  id: string
  title: string
  source: "GitHub" | "Portfolio" | "Resume" | "Interview" | "Reference"
  date: string
  description: string
}

export type CandidateProject = {
  name: string
  description: string
  skills: string[]
  url?: string
  source?: string
  relevance?: string
}

export type CandidateInterview = {
  stage: string
  date: string
  outcome: string
  notes: string
}

export type DemoCandidate = {
  id: string
  name: string
  avatarUrl?: string
  avatarStyle?: "photo" | "illustration" | "generated"
  headline: string
  location: string
  targetRole: string
  currentCompany: string
  experienceYears: number
  skills: string[]
  githubUsername: string
  portfolioUrl: string
  linkedinUrl: string
  email: string
  proofScore: number
  roleMatchScore: number
  simulationScore: number
  availability: string
  salaryExpectation: string
  workPreference: string
  summary: string
  strengths: string[]
  risks: string[]
  evidence: ProofItem[]
  projects: CandidateProject[]
  interviews: CandidateInterview[]
  notes: {
    whyThisCandidate: string
    bestInterviewAngle: string
    potentialConcerns: string
    suggestedNextStep: string
  }
  education?: {
    university: string
    degree: string
    graduationYear: string
    score: string
  }
  courseworkDistribution?: Array<{ label: string; value: number }>
  skillScores?: Array<{ skill: string; score: number }>
  signalCounts?: {
    internships: number
    research: number
    certifications: number
    hackathons: number
    publications: number
    endorsements: number
  }
  introVideoCaption?: string
  proofProjects?: CandidateProject[]
  endorsements?: Array<{ name: string; role: string; quote: string }>
  insights?: Array<{ title: string; body: string }>
  verifiedBy?: string
  affiliations?: CandidateAffiliation[]
}

const names = [
  "Alex Rivera",
  "Priya Mehta",
  "Liam Torres",
  "Anika Sharma",
  "James Wu",
  "Maya Chen",
  "Owen Brooks",
  "Sara Okafor",
  "Noah Bennett",
  "Isha Rao",
  "Ethan Chen",
  "Nina Patel",
  "Mateo Garcia",
  "Zara Khan",
  "Daniel Kim",
  "Leah Morgan",
  "Arjun Nair",
  "Chloe Martin",
  "Hiro Tanaka",
  "Amara Johnson",
  "Lucas Silva",
  "Elena Petrova",
  "Samir Haddad",
  "Grace Liu",
  "Theo Anderson",
  "Mina Park",
  "Ravi Singh",
  "Isabel Santos",
  "Jonas Weber",
  "Aaliyah Brown",
  "Victor Rossi",
  "Mei Lin",
  "Caleb Turner",
  "Sofia Alvarez",
  "Hamza Malik",
  "Ella Thompson",
  "Kenji Sato",
  "Rhea Kapoor",
  "Oscar Nielsen",
  "Ava Wilson",
  "Yusuf Demir",
  "Clara Dubois",
  "Ben Hughes",
  "Nora Ibrahim",
  "Leo Schmidt",
  "Tara Novak",
  "Miles Cooper",
  "Saanvi Gupta",
  "Adrian Popescu",
  "Ruby Edwards",
  "Omar Farouk",
  "Hannah Lee",
  "Ivan Horvat",
  "Pia Muller",
  "Dylan Scott",
  "Lina Haddad",
  "Kieran Walsh",
  "Amina Yusuf",
  "Felix Meyer",
  "Priya Desai",
]

const roles = [
  "Senior Backend Engineer",
  "Data Analyst",
  "Frontend Engineer",
  "Platform Engineer",
  "ML Engineer",
  "Product Designer",
  "Security Engineer",
  "DevOps Engineer",
  "Full Stack Engineer",
  "Product Manager",
]

const skillSets = [
  ["Rust", "Go", "PostgreSQL", "distributed systems", "Docker", "Kubernetes", "Redis"],
  ["SQL", "Python", "dashboards", "dbt", "Looker", "experimentation", "stakeholder reporting"],
  ["React", "TypeScript", "Next.js", "accessibility", "design systems", "GraphQL", "Tailwind"],
  ["Kubernetes", "Terraform", "AWS", "observability", "CI/CD", "SRE", "incident response"],
  ["PyTorch", "retrieval", "model evaluation", "vector search", "MLOps", "Python", "LangChain"],
]

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function githubFor(name: string) {
  return slug(name).replaceAll("-", "")
}

function makeCandidate(name: string, index: number): DemoCandidate {
  const role = roles[index % roles.length]
  const skills = skillSets[index % skillSets.length]
  const id = `candidate-${String(index + 1).padStart(2, "0")}`
  const handle = githubFor(name)
  const company = ["Northstar Labs", "Acme", "Stark", "Vial", "Initech", "Merge", "CoinTracker", "Speechify"][index % 8]
  const proofScore = 78 + (index % 18)
  const simulationScore = 74 + ((index * 7) % 20)
  const roleMatchScore = 76 + ((index * 5) % 19)

  return {
    id,
    name,
    avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}`,
    avatarStyle: "illustration",
    headline: `${role} at ${company}`,
    location: ["San Francisco", "New York", "Toronto", "Bengaluru", "London", "Sydney"][index % 6],
    targetRole: role,
    currentCompany: company,
    experienceYears: 4 + (index % 9),
    skills,
    githubUsername: handle,
    portfolioUrl: `https://${handle}.dev`,
    linkedinUrl: `https://linkedin.com/in/${slug(name)}`,
    email: `${slug(name).replaceAll("-", ".")}@example.com`,
    proofScore,
    roleMatchScore,
    simulationScore,
    availability: ["Now", "2 weeks", "30 days", "Open to intro"][index % 4],
    salaryExpectation: ["$150k-$175k", "$170k-$200k", "$120k-$145k", "$180k-$220k"][index % 4],
    workPreference: ["Remote", "Hybrid", "Remote US", "Onsite flexible"][index % 4],
    summary: `${name} shows credible ${role.toLowerCase()} evidence through public work, project artifacts, and interview notes. Strongest signals are ${skills.slice(0, 3).join(", ")}.`,
    strengths: [
      `Hands-on evidence in ${skills[0]} and ${skills[1]}.`,
      "Clear ownership signal across project artifacts.",
      "Communicates tradeoffs with practical detail.",
    ],
    risks: index % 5 === 0 ? ["Limited frontend/product evidence.", "Confirm scope of most recent ownership claim."] : ["Validate depth in final systems interview."],
    evidence: [
      {
        id: `${id}-e1`,
        title: `${skills[0]} production artifact`,
        source: "GitHub",
        date: "2026-02-12",
        description: `Repository history shows sustained work around ${skills[0]} and ${skills[1]}.`,
      },
      {
        id: `${id}-e2`,
        title: "Portfolio project notes",
        source: "Portfolio",
        date: "2026-01-18",
        description: `Project writeup explains tradeoffs around ${skills[2]} and operational constraints.`,
      },
      {
        id: `${id}-e3`,
        title: "Recruiter screen",
        source: "Interview",
        date: "2026-03-04",
        description: "Candidate gave specific examples with measurable product or infra outcomes.",
      },
    ],
    projects: [
      { name: `${skills[0]} reliability service`, description: `Production-grade service focused on ${skills[1]} and ${skills[2]}.`, skills: skills.slice(0, 4), url: `https://github.com/${handle}/reliability-service` },
      { name: "Hiring signal explorer", description: "A lightweight demo project with searchable evidence trails.", skills: skills.slice(2, 6), url: `https://github.com/${handle}/signal-explorer` },
      { name: "Internal platform toolkit", description: "Reusable tooling that reduced review and debugging time.", skills: skills.slice(1, 5) },
    ],
    interviews: [
      { stage: "Recruiter screen", date: "2026-03-04", outcome: "Strong", notes: "Clear motivation and scope ownership." },
      { stage: "Technical review", date: "2026-03-12", outcome: "Proceed", notes: `Good depth in ${skills[0]} implementation details.` },
    ],
    notes: {
      whyThisCandidate: `Strong proof density for ${role}; public work supports the main claims.`,
      bestInterviewAngle: `Probe ${skills[1]} decisions, failure modes, and how they measured success.`,
      potentialConcerns: index % 5 === 0 ? "Limited frontend/product evidence. Ask for cross-functional examples." : "No major concern; verify recent project scope.",
      suggestedNextStep: "Shortlist for a focused technical intro.",
    },
  }
}

const generated = names.map(makeCandidate)

generated[0] = {
  ...generated[0],
  id: "alex-rivera",
  name: "Alex Rivera",
  avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Alex%20Rivera",
  avatarStyle: "illustration",
  email: "alex.rivera@email.com",
  headline: "Backend systems builder focused on Rust, infra, and distributed services.",
  location: "Sydney, NSW",
  targetRole: "Senior Rust Engineer",
  currentCompany: "Independent Builder",
  experienceYears: 3,
  skills: ["Rust", "Go", "PostgreSQL", "Distributed Systems", "Docker", "Kubernetes", "Redis"],
  githubUsername: "alexrivera",
  portfolioUrl: "https://alexrivera.dev",
  linkedinUrl: "https://linkedin.com/in/alex-rivera",
  proofScore: 94,
  roleMatchScore: 92,
  simulationScore: 89,
  availability: "Available now",
  salaryExpectation: "$120k - $145k",
  workPreference: "Hybrid / Remote",
  summary: "Backend systems builder with strong Rust and distributed systems evidence. Strong GitHub activity around queues, auth, and infra. Best suited for early-stage backend/platform roles.",
  strengths: [
    "Strong backend systems signal",
    "Evidence of shipping infra-heavy projects",
    "Good Rust ownership and concurrency fundamentals",
  ],
  risks: ["Limited frontend evidence", "Few large-team collaboration signals"],
  evidence: [
    {
      id: "alex-e1",
      title: "Built a low-latency Rust job queue",
      source: "GitHub",
      date: "2026-02-20",
      description: "Owned queue scheduler, retry policy, metrics, and worker backpressure design.",
    },
    {
      id: "alex-e2",
      title: "Maintains PostgreSQL-backed auth service",
      source: "GitHub",
      date: "2026-01-30",
      description: "Schema migrations, session storage, audit logging, and API hardening show mature backend depth.",
    },
    {
      id: "alex-e3",
      title: "Distributed cache design review",
      source: "Interview",
      date: "2026-03-11",
      description: "Explained cache invalidation, consistency tradeoffs, and incident response clearly.",
    },
  ],
  projects: [
    {
      name: "low-latency job queue",
      description: "Rust queue with priority scheduling, dead-letter handling, and Prometheus metrics.",
      skills: ["Rust", "Redis", "PostgreSQL", "Docker"],
      url: "https://github.com/alexrivera/rust-job-queue",
    },
    {
      name: "auth service",
      description: "Go/PostgreSQL authentication service with audit trails and role-based access.",
      skills: ["Go", "PostgreSQL", "Kubernetes"],
      url: "https://github.com/alexrivera/auth-service",
    },
    {
      name: "distributed cache",
      description: "Redis-backed cache layer with consistency and fallback strategies.",
      skills: ["distributed systems", "Redis", "Kubernetes"],
      url: "https://github.com/alexrivera/distributed-cache",
    },
  ],
  notes: {
    whyThisCandidate: "Alex is the strongest Rust/backend match because the proof is specific, recent, and tied to owned systems.",
    bestInterviewAngle: "Ask Alex to walk through queue backpressure, failure recovery, and data consistency tradeoffs.",
    potentialConcerns: "Limited frontend/product evidence. Keep the interview focused on backend ownership and production scale.",
    suggestedNextStep: "Shortlist and schedule a 30-minute systems design intro.",
  },
  education: {
    university: "University of Sydney",
    degree: "B.S. Computer Science",
    graduationYear: "2026",
    score: "78",
  },
  courseworkDistribution: [
    { label: "Systems", value: 35 },
    { label: "Backend", value: 30 },
    { label: "Data", value: 20 },
    { label: "AI", value: 15 },
  ],
  skillScores: [
    { skill: "Rust", score: 92 },
    { skill: "Go", score: 84 },
    { skill: "PostgreSQL", score: 81 },
    { skill: "Distributed Systems", score: 88 },
    { skill: "Docker/Kubernetes", score: 76 },
    { skill: "Frontend", score: 42 },
  ],
  signalCounts: {
    internships: 1,
    research: 1,
    certifications: 2,
    hackathons: 3,
    publications: 0,
    endorsements: 4,
  },
  introVideoCaption: "I build backend systems that actually ship.",
  proofProjects: [
    {
      name: "Low-latency Rust Job Queue",
      description: "Built a queue worker with retries, priority scheduling, metrics, and Redis-backed coordination.",
      skills: ["Rust", "Redis", "Concurrency", "Systems"],
      source: "GitHub",
      relevance: "Very high",
    },
    {
      name: "PostgreSQL Auth Service",
      description: "Designed a secure auth service with sessions, access control, audit logs, and typed database access.",
      skills: ["PostgreSQL", "Go", "Auth", "APIs"],
      source: "Portfolio",
      relevance: "High",
    },
    {
      name: "Distributed Cache Prototype",
      description: "Implemented cache invalidation experiments and node-level replication for a systems design project.",
      skills: ["Distributed Systems", "Rust", "Networking"],
      source: "Resume",
      relevance: "High",
    },
    {
      name: "Kubernetes Deploy Pipeline",
      description: "Containerised backend services and deployed staged environments with health checks and rollback notes.",
      skills: ["Docker", "Kubernetes", "DevOps"],
      source: "GitHub",
      relevance: "Medium",
    },
  ],
  endorsements: [
    {
      name: "Maya Chen",
      role: "Hackathon teammate",
      quote: "Alex is reliable on backend infra and debugging under pressure.",
    },
    {
      name: "Jordan Lee",
      role: "Project collaborator",
      quote: "Strong ownership signal across systems projects.",
    },
  ],
  insights: [
    {
      title: "Best interview angle",
      body: "Ask Alex to walk through queue failure modes, Rust ownership tradeoffs, and scaling the auth service.",
    },
    {
      title: "Risk / concern",
      body: "Frontend evidence is thin, so avoid full-stack positioning unless the role is backend-heavy.",
    },
    {
      title: "Suggested next step",
      body: "Move to a 30-minute systems screen with a senior backend engineer.",
    },
  ],
}

generated[5] = {
  ...generated[5],
  name: "Maya Chen",
  targetRole: "Senior Rust Engineer",
  headline: "Rust Systems Engineer at Merge",
  skills: ["Rust", "C++", "Linux", "distributed systems", "PostgreSQL", "Kubernetes", "observability"],
  proofScore: 91,
  roleMatchScore: 93,
  simulationScore: 88,
  summary: "Maya has strong systems evidence with Rust-heavy infrastructure projects and thoughtful debugging notes.",
}

generated[6] = {
  ...generated[6],
  name: "Owen Brooks",
  targetRole: "Backend Platform Engineer",
  headline: "Backend Platform Engineer at Acme",
  skills: ["Rust", "Go", "Kafka", "PostgreSQL", "Docker", "Kubernetes", "SRE"],
  proofScore: 88,
  roleMatchScore: 90,
  simulationScore: 86,
  summary: "Owen is a credible backend platform candidate with Rust and Kubernetes evidence across service reliability work.",
}

generated[1] = {
  ...generated[1],
  name: "Priya Mehta",
  targetRole: "Senior Backend Engineer",
  headline: "Senior Backend Engineer at Stark",
  skills: ["Go", "Rust", "PostgreSQL", "Kafka", "Docker", "Kubernetes", "API design"],
  proofScore: 87,
  roleMatchScore: 86,
  simulationScore: 84,
  summary: "Priya has strong backend proof with Go-first systems work and enough Rust signal to be a viable shortlist candidate.",
}

export const DEMO_CANDIDATES: DemoCandidate[] = generated
