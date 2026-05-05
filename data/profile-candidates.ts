export type ProfileSource = {
  kind: "Resume" | "GitHub" | "LinkedIn" | "Email" | "Portfolio"
  value: string
  status: "ready" | "linked" | "pending" | "verified"
}

export type ProfileCandidate = {
  id: string
  name: string
  role: string
  location: string
  github: string
  linkedin: string
  email: string
  portfolio: string
  skills: string[]
  identityMatch: number
  proofDensity: number
  riskFlags: number
  proofPoints: string[]
  interviewAngle: string
  watchItem: string
  sources: ProfileSource[]
}

const roles = [
  "Senior Backend Engineer",
  "Product Designer",
  "Data Analyst",
  "Frontend Engineer",
  "ML Engineer",
  "Rust Systems Engineer",
  "Platform Engineer",
  "Security Engineer",
  "DevOps Engineer",
  "Staff Full Stack Engineer",
]

const names = [
  "Alex Rivera",
  "Priya Mehta",
  "Liam Torres",
  "Anika Sharma",
  "James Wu",
  "Sara Okafor",
  "Maya Chen",
  "Noah Bennett",
  "Isha Rao",
  "Owen Carter",
  "Fatima Al-Sayed",
  "Ethan Brooks",
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
]

const skillSets = [
  ["Rust", "distributed systems", "Postgres", "Kafka", "incident response"],
  ["React", "Next.js", "accessibility", "design systems", "TypeScript"],
  ["Python", "feature engineering", "SQL", "dashboards", "experimentation"],
  ["Kubernetes", "Terraform", "CI/CD", "observability", "SRE"],
  ["PyTorch", "retrieval", "model evaluation", "vector search", "MLOps"],
]

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function makeCandidate(name: string, index: number): ProfileCandidate {
  const role = roles[index % roles.length]
  const slug = slugify(name)
  const github = index === 0 ? "alexrivera-dev" : slug.replace("-", "")
  const skills = skillSets[index % skillSets.length]
  const riskFlags = index % 9 === 0 ? 2 : index % 5 === 0 ? 1 : 0

  return {
    id: `profile-${String(index + 1).padStart(2, "0")}`,
    name,
    role,
    location: ["San Francisco", "New York", "London", "Bengaluru", "Sydney", "Toronto"][index % 6],
    github,
    linkedin: `linkedin.com/in/${slug}`,
    email: `${slug.replaceAll("-", ".")}@example.com`,
    portfolio: `https://${slug}.dev`,
    skills,
    identityMatch: Math.min(98, 86 + (index % 13)),
    proofDensity: 14 + (index % 18),
    riskFlags,
    proofPoints: [
      `${skills[0]} ownership appears in repo commits, review threads, and project docs.`,
      `${role} claims line up with shipped artifacts and public collaboration history.`,
      `Recent activity shows ${skills[1]} depth across multiple independent sources.`,
    ],
    interviewAngle: `Probe ${skills[1]} tradeoffs, ownership boundaries, and what changed after production feedback.`,
    watchItem: riskFlags > 0 ? "One timeline or title claim needs confirmation against resume dates." : "No material mismatch found in the demo evidence set.",
    sources: [
      { kind: "Resume", value: `${name} resume.pdf`, status: "ready" },
      { kind: "GitHub", value: `github.com/${github}`, status: "linked" },
      { kind: "LinkedIn", value: `linkedin.com/in/${slug}`, status: index % 4 === 0 ? "pending" : "verified" },
      { kind: "Email", value: `${slug.replaceAll("-", ".")}@example.com`, status: "verified" },
      { kind: "Portfolio", value: `https://${slug}.dev`, status: index % 3 === 0 ? "linked" : "ready" },
    ],
  }
}

export const PROFILE_CANDIDATES: ProfileCandidate[] = names.map(makeCandidate)

export function searchProfileCandidates(query: string): ProfileCandidate | null {
  const terms = query.toLowerCase().split(/[^a-z0-9@._-]+/).filter(Boolean)
  if (terms.length === 0) return PROFILE_CANDIDATES[0]

  const scored = PROFILE_CANDIDATES.map((candidate) => {
    const haystack = [
      candidate.name,
      candidate.role,
      candidate.location,
      candidate.github,
      candidate.linkedin,
      candidate.email,
      candidate.portfolio,
      ...candidate.skills,
      ...candidate.proofPoints,
    ].join(" ").toLowerCase()

    const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0)
    return { candidate, score }
  }).sort((a, b) => b.score - a.score)

  return scored[0]?.score ? scored[0].candidate : PROFILE_CANDIDATES[0]
}
