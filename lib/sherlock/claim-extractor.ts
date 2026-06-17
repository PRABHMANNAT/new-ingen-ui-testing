import { callOpenAIJson, hasOpenAIKey } from "../openai"
import type { SherlockClaim, SherlockClaimType } from "./types"
import { sherlockExtractedClaimsSchema, type SherlockExtractedClaims } from "./schemas"

export type ClaimSourceKind = "resume" | "linkedin_paste" | "application" | "free_text" | "github" | "portfolio" | "other"

export type ExtractClaimsInput = {
  text: string
  sourceName?: string
  sourceKind?: ClaimSourceKind
  useOpenAI?: boolean
}

type OpenAIClaimExtraction = {
  claims: Array<{
    type: SherlockClaimType
    text: string
    subject?: string
    sourceSnippet: string
  }>
  warnings?: string[]
}

const CLAIM_PATTERNS: Array<{
  type: SherlockClaimType
  subject: string
  pattern: RegExp
}> = [
  { type: "stack", subject: "Go", pattern: /\b(golang|go)\b/i },
  { type: "stack", subject: "Rust", pattern: /\brust\b/i },
  { type: "stack", subject: "Python", pattern: /\bpython\b/i },
  { type: "stack", subject: "TypeScript", pattern: /\btypescript\b/i },
  { type: "stack", subject: "React", pattern: /\breact(?:\.js|js)?\b/i },
  { type: "stack", subject: "Node.js", pattern: /\bnode(?:\.js)?\b/i },
  { type: "stack", subject: "PostgreSQL", pattern: /\bpostgres(?:ql)?\b/i },
  { type: "stack", subject: "AWS", pattern: /\baws|amazon web services\b/i },
  { type: "title", subject: "Senior role", pattern: /\b(senior|staff|principal|lead)\s+([a-z+#.]+\s+){0,3}(engineer|developer|architect)\b/i },
  { type: "scope", subject: "Architecture ownership", pattern: /\b(architected|owned|led|designed)\b.*\b(platform|system|architecture|service|team)\b/i },
  { type: "scope", subject: "Scale claim", pattern: /\b(\d+(\.\d+)?\s?(m|million|k|thousand)|high[-\s]?volume|scale(d)? to)\b/i },
  { type: "project", subject: "Project work", pattern: /\b(project|built|launched|implemented|developed)\b/i },
  { type: "education", subject: "Education", pattern: /\b(bachelor|master|bsc|msc|phd|university|college|degree|gpa)\b/i },
  { type: "publication", subject: "Publication", pattern: /\b(publication|paper|arxiv|doi|conference|talk)\b/i },
]

const TENURE_PATTERN = /\b((jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+)?(20\d{2})\s*(-|to|–|—)\s*(((jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+)?(20\d{2})|present|current|now)\b/i
const URL_PATTERN = /\bhttps?:\/\/[^\s)]+/gi

export async function extractSherlockClaims(input: ExtractClaimsInput): Promise<SherlockExtractedClaims> {
  const text = normalizeText(input.text)
  const sourceName = input.sourceName?.trim() || "User-provided text"
  const sourceKind = input.sourceKind ?? inferSourceKind(sourceName, text)

  if (!text) {
    return {
      claims: [],
      sourceName,
      sourceKind,
      extractionMethod: "deterministic",
      warnings: ["No text was available for claim extraction."],
    }
  }

  const deterministic = deterministicExtractClaims(text, sourceName)

  if (input.useOpenAI !== false && hasOpenAIKey()) {
    const modelResult = await extractWithOpenAI(text, sourceName)
    if (modelResult.ok) {
      const merged = mergeClaims(modelResult.data.claims, deterministic)
      const parsed = sherlockExtractedClaimsSchema.safeParse({
        claims: merged,
        sourceName,
        sourceKind,
        extractionMethod: "openai_structured",
        warnings: modelResult.data.warnings ?? [],
      })
      if (parsed.success) return parsed.data
    }

    return {
      claims: deterministic,
      sourceName,
      sourceKind,
      extractionMethod: "openai_structured_with_deterministic_fallback",
      warnings: [`OpenAI extraction was unavailable; deterministic extraction used. ${modelResult.error}`],
    }
  }

  return {
    claims: deterministic,
    sourceName,
    sourceKind,
    extractionMethod: "deterministic",
    warnings: hasOpenAIKey() ? [] : ["OPENAI_API_KEY not configured; deterministic extraction used."],
  }
}

function deterministicExtractClaims(text: string, sourceName: string): SherlockClaim[] {
  const sentences = splitIntoSentences(text)
  const claims: SherlockClaim[] = []

  sentences.forEach((sentence, index) => {
    const clean = sentence.trim()
    if (!clean || clean.length < 8) return

    CLAIM_PATTERNS.forEach((rule) => {
      if (!rule.pattern.test(clean)) return
      claims.push(createClaim(rule.type, clean, rule.subject, sourceName, index))
    })

    if (TENURE_PATTERN.test(clean)) {
      claims.push(createClaim("tenure", clean, "Timeline", sourceName, index))
    }
  })

  const urls = Array.from(text.matchAll(URL_PATTERN)).map((match) => match[0])
  urls.forEach((url, index) => {
    const type: SherlockClaimType = url.includes("github.com")
      ? "identity"
      : url.includes("linkedin.com")
        ? "identity"
        : "project"
    claims.push(createClaim(type, `Candidate provided profile or artifact URL: ${url}`, "Profile link", sourceName, index + sentences.length))
  })

  return dedupeClaims(claims).slice(0, 24)
}

async function extractWithOpenAI(text: string, sourceName: string) {
  const systemPrompt = [
    "You are Sherlock Claim Extractor.",
    "Extract self-reported candidate claims from user-provided text only.",
    "Treat resume, LinkedIn, and application text as zero-trust claims, not evidence.",
    "Do not verify anything.",
    "Do not infer protected attributes.",
    "Do not score or rank the candidate.",
    "Return only valid JSON with a claims array and optional warnings array.",
    "Each claim needs type, text, optional subject, and sourceSnippet.",
  ].join("\n")

  const userPrompt = JSON.stringify({
    sourceName,
    allowedTypes: [
      "identity",
      "stack",
      "tenure",
      "title",
      "scope",
      "education",
      "project",
      "package",
      "publication",
      "company_context",
      "other",
    ],
    text: text.slice(0, 12000),
  })

  const result = await callOpenAIJson<OpenAIClaimExtraction>(systemPrompt, userPrompt, process.env.OPENAI_MODEL ?? "gpt-4o-mini")
  if (!result.ok) return result

  const claims = result.data.claims
    .filter((claim) => claim.text?.trim() && claim.sourceSnippet?.trim())
    .map((claim, index) => ({
      id: `claim-openai-${index + 1}`,
      type: claim.type,
      text: claim.text.trim(),
      subject: claim.subject?.trim() || undefined,
      source: sourceName,
      sourceSnippet: claim.sourceSnippet.trim().slice(0, 280),
    }))

  return { ok: true as const, data: { claims, warnings: result.data.warnings ?? [] } }
}

function createClaim(type: SherlockClaimType, sentence: string, subject: string, sourceName: string, index: number): SherlockClaim {
  return {
    id: `claim-${type}-${index + 1}-${slugify(subject)}`,
    type,
    text: claimText(type, sentence, subject),
    subject,
    source: sourceName,
    sourceSnippet: sentence.slice(0, 280),
  }
}

function claimText(type: SherlockClaimType, sentence: string, subject: string) {
  if (type === "stack") return `Candidate claims experience with ${subject}.`
  if (type === "tenure") return "Candidate claims a dated role, education, or project timeline."
  if (type === "title") return `Candidate claims a ${subject.toLowerCase()}.`
  if (type === "scope") return `Candidate claims ${subject.toLowerCase()}.`
  if (type === "identity") return "Candidate provided a profile or artifact link for identity continuity."
  return sentence.length > 120 ? `${sentence.slice(0, 117)}...` : sentence
}

function mergeClaims(primary: SherlockClaim[], fallback: SherlockClaim[]) {
  return dedupeClaims([...primary, ...fallback]).slice(0, 32)
}

function dedupeClaims(claims: SherlockClaim[]) {
  const seen = new Set<string>()
  return claims.filter((claim) => {
    const key = `${claim.type}:${claim.subject ?? ""}:${claim.sourceSnippet.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function splitIntoSentences(text: string) {
  return text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((part) => part.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean)
}

function normalizeText(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
}

function inferSourceKind(sourceName: string, text: string): ClaimSourceKind {
  const lower = `${sourceName}\n${text.slice(0, 400)}`.toLowerCase()
  if (lower.includes("linkedin")) return "linkedin_paste"
  if (lower.includes("resume") || lower.includes("cv")) return "resume"
  if (lower.includes("github.com")) return "github"
  if (lower.includes("portfolio")) return "portfolio"
  return "free_text"
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "claim"
}
