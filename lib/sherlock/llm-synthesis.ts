import { callOpenAIJson, hasOpenAIKey } from "../openai"
import { assertSherlockEvidenceOnlyOutput } from "./guardrails"
import { sherlockSynthesisSchema } from "./schemas"
import type {
  SherlockAlternativeProofRoute,
  SherlockClaim,
  SherlockEvidence,
  SherlockInterviewQuestion,
  SherlockReportSection,
  SherlockSynthesis,
  SherlockVerification,
  SherlockVerificationState,
} from "./types"

export type SherlockSynthesisInput = {
  claims: SherlockClaim[]
  evidence: SherlockEvidence[]
  verifications: SherlockVerification[]
  interviewPack?: SherlockInterviewQuestion[]
  proofRoutes?: SherlockAlternativeProofRoute[]
  candidateName?: string
  targetRole?: string
  useOpenAI?: boolean
}

type ReferenceValidationInput = {
  claimIds: Set<string>
  evidenceIds: Set<string>
}

const REPORT_STATE_ORDER: SherlockVerificationState[] = ["verified", "contradicted", "unverified", "needs_alternative_proof"]

export async function synthesizeSherlockReport(input: SherlockSynthesisInput): Promise<SherlockSynthesis> {
  const deterministic = buildDeterministicSynthesis(input, "deterministic", [])

  if (input.useOpenAI === false || !hasOpenAIKey()) {
    return deterministic
  }

  const generatedAt = new Date().toISOString()
  const modelResult = await synthesizeWithOpenAI(input, generatedAt)
  if (!modelResult.ok) {
    return buildDeterministicSynthesis(input, "openai_structured_with_deterministic_fallback", [
      "OpenAI synthesis was unavailable; deterministic synthesis used.",
    ])
  }

  return modelResult.data
}

export function validateSynthesisReferences(
  synthesis: SherlockSynthesis,
  allowed: { claimIds: Iterable<string>; evidenceIds: Iterable<string> },
) {
  const context: ReferenceValidationInput = {
    claimIds: new Set(allowed.claimIds),
    evidenceIds: new Set(allowed.evidenceIds),
  }
  const violations: string[] = []

  synthesis.ninetySecondReport.forEach((section, index) => {
    validateSectionReferences(section, `ninetySecondReport.${index}`, context, violations)
  })
  synthesis.shareableReport.sections.forEach((section, index) => {
    validateSectionReferences(section, `shareableReport.sections.${index}`, context, violations)
  })
  synthesis.shareableReport.evidenceIds.forEach((id, index) => {
    if (!context.evidenceIds.has(id)) violations.push(`shareableReport.evidenceIds.${index} cites unknown evidence ${id}`)
  })
  synthesis.interviewPack.forEach((question, index) => {
    question.linkedClaimIds.forEach((id, claimIndex) => {
      if (!context.claimIds.has(id)) violations.push(`interviewPack.${index}.linkedClaimIds.${claimIndex} cites unknown claim ${id}`)
    })
    question.linkedEvidenceIds.forEach((id, evidenceIndex) => {
      if (!context.evidenceIds.has(id)) violations.push(`interviewPack.${index}.linkedEvidenceIds.${evidenceIndex} cites unknown evidence ${id}`)
    })
  })

  return violations
}

function validateSectionReferences(section: SherlockReportSection, path: string, context: ReferenceValidationInput, violations: string[]) {
  section.claimIds.forEach((id, index) => {
    if (!context.claimIds.has(id)) violations.push(`${path}.claimIds.${index} cites unknown claim ${id}`)
  })
  section.evidenceIds.forEach((id, index) => {
    if (!context.evidenceIds.has(id)) violations.push(`${path}.evidenceIds.${index} cites unknown evidence ${id}`)
  })
}

async function synthesizeWithOpenAI(input: SherlockSynthesisInput, generatedAt: string) {
  const systemPrompt = [
    "You are Sherlock Evidence Synthesis.",
    "Summarize only the provided normalized claims, normalized evidence, and verification states.",
    "Do not create new evidence, sources, dates, URLs, people, companies, or IDs.",
    "Every cited evidenceId and claimId must already exist in the input.",
    "Use only evidence states: verified, contradicted, unverified, needs_alternative_proof.",
    "Do not use decision words: score, rank, hire, reject, pass, fail.",
    "Do not recommend employment decisions.",
    "Return JSON with ninetySecondReport, interviewPack, shareableReport, and warnings.",
  ].join("\n")

  const userPrompt = JSON.stringify({
    claims: input.claims.map((claim) => ({
      id: claim.id,
      type: claim.type,
      text: claim.text,
      subject: claim.subject,
      source: claim.source,
      sourceSnippet: claim.sourceSnippet,
    })),
    evidence: input.evidence.map((evidence) => ({
      id: evidence.id,
      sourceType: evidence.sourceType,
      sourceName: evidence.sourceName,
      sourceUrl: evidence.sourceUrl,
      retrievedAt: evidence.retrievedAt,
      artifactDate: evidence.artifactDate,
      rawSnapshotRef: evidence.rawSnapshotRef,
      summary: evidence.summary,
      details: evidence.details,
      reliability: evidence.reliability,
      normalizedJson: evidence.normalizedJson ?? {},
    })),
    verifications: input.verifications.map((verification) => ({
      id: verification.id,
      claimId: verification.claimId,
      state: verification.state,
      summary: verification.summary,
      supportingEvidenceIds: verification.supportingEvidenceIds,
      contradictingEvidenceIds: verification.contradictingEvidenceIds,
      proofRoute: verification.proofRoute,
      humanReviewRequired: verification.humanReviewRequired,
    })),
    outputShape: {
      ninetySecondReport: [
        { id: "section-id", title: "short title", body: "summary", claimIds: ["existing-claim-id"], evidenceIds: ["existing-evidence-id"] },
      ],
      interviewPack: [
        {
          id: "q-existing-claim-id",
          question: "question grounded in a contradiction, gap, or proof route",
          reason: "why this question is needed",
          linkedClaimIds: ["existing-claim-id"],
          linkedEvidenceIds: ["existing-evidence-id"],
        },
      ],
      shareableReport: {
        title: "Evidence report",
        sections: [
          { id: "section-id", title: "short title", body: "summary", claimIds: ["existing-claim-id"], evidenceIds: ["existing-evidence-id"] },
        ],
        evidenceIds: ["existing-evidence-id"],
        humanDecisionRequired: true,
      },
      warnings: [],
    },
  })

  const result = await callOpenAIJson<Partial<SherlockSynthesis>>(
    systemPrompt,
    userPrompt,
    process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  )
  if (!result.ok) return result

  const candidate = {
    ...result.data,
    artifactType: "sherlock_synthesis",
    version: "1.0",
    generatedAt,
    method: "openai_structured",
    shareableReport: {
      ...result.data.shareableReport,
      title: result.data.shareableReport?.title || `${input.candidateName ?? "Candidate"} Evidence Report`,
      generatedAt,
      candidateName: input.candidateName,
      targetRole: input.targetRole,
      humanDecisionRequired: true,
    },
    warnings: Array.isArray(result.data.warnings) ? result.data.warnings : [],
  }

  const parsed = sherlockSynthesisSchema.safeParse(candidate)
  if (!parsed.success) {
    return { ok: false as const, error: "OpenAI synthesis did not match the structured schema." }
  }

  const referenceViolations = validateSynthesisReferences(parsed.data, {
    claimIds: input.claims.map((claim) => claim.id),
    evidenceIds: input.evidence.map((evidence) => evidence.id),
  })
  if (referenceViolations.length) {
    return { ok: false as const, error: "OpenAI synthesis cited unknown claim or evidence IDs." }
  }

  const guardrail = assertSherlockEvidenceOnlyOutput(parsed.data)
  if (!guardrail.ok) {
    return { ok: false as const, error: "OpenAI synthesis used prohibited decision language." }
  }

  return { ok: true as const, data: parsed.data }
}

function buildDeterministicSynthesis(
  input: SherlockSynthesisInput,
  method: SherlockSynthesis["method"],
  warnings: string[],
): SherlockSynthesis {
  const generatedAt = new Date().toISOString()
  const sections = buildNinetySecondSections(input)
  const interviewPack = buildSynthesisInterviewPack(input)
  const evidenceIds = unique(sections.flatMap((section) => section.evidenceIds))

  const synthesis: SherlockSynthesis = {
    artifactType: "sherlock_synthesis",
    version: "1.0",
    generatedAt,
    method,
    ninetySecondReport: sections,
    interviewPack,
    shareableReport: {
      title: `${input.candidateName ?? "Candidate"} Evidence Report`,
      generatedAt,
      candidateName: input.candidateName,
      targetRole: input.targetRole,
      sections,
      evidenceIds,
      humanDecisionRequired: true,
    },
    warnings,
  }

  const parsed = sherlockSynthesisSchema.parse(synthesis)
  const referenceViolations = validateSynthesisReferences(parsed, {
    claimIds: input.claims.map((claim) => claim.id),
    evidenceIds: input.evidence.map((evidence) => evidence.id),
  })
  if (referenceViolations.length) {
    throw new Error(`Deterministic synthesis produced invalid references: ${referenceViolations.join("; ")}`)
  }

  const guardrail = assertSherlockEvidenceOnlyOutput(parsed)
  if (!guardrail.ok) {
    throw new Error(`Deterministic synthesis violated guardrails: ${guardrail.violations.join("; ")}`)
  }

  return parsed
}

function buildNinetySecondSections(input: SherlockSynthesisInput): SherlockReportSection[] {
  const byState = new Map(REPORT_STATE_ORDER.map((state) => [state, input.verifications.filter((entry) => entry.state === state)]))
  const verified = byState.get("verified") ?? []
  const contradicted = byState.get("contradicted") ?? []
  const unverified = byState.get("unverified") ?? []
  const proofNeeded = byState.get("needs_alternative_proof") ?? []

  return [
    {
      id: "report-verified",
      title: "Verified evidence",
      body: verified.length
        ? `${verified.length} claim${verified.length === 1 ? "" : "s"} have corroborating artifacts: ${summarizeClaims(input.claims, verified)}`
        : "No claims have corroborating artifacts yet.",
      claimIds: verified.map((entry) => entry.claimId),
      evidenceIds: idsFromVerifications(verified),
    },
    {
      id: "report-contradicted",
      title: "Contradictions",
      body: contradicted.length
        ? `${contradicted.length} claim${contradicted.length === 1 ? "" : "s"} conflict with available artifacts: ${summarizeClaims(input.claims, contradicted)}`
        : "No contradictions were found in the current evidence set.",
      claimIds: contradicted.map((entry) => entry.claimId),
      evidenceIds: idsFromVerifications(contradicted),
    },
    {
      id: "report-unverified",
      title: "Unverified claims",
      body: unverified.length
        ? `${unverified.length} claim${unverified.length === 1 ? "" : "s"} remain silent in the current evidence set: ${summarizeClaims(input.claims, unverified)}`
        : "No claims are in the unverified state.",
      claimIds: unverified.map((entry) => entry.claimId),
      evidenceIds: idsFromVerifications(unverified),
    },
    {
      id: "report-proof-routes",
      title: "Alternative proof routes",
      body: proofNeeded.length
        ? `${proofNeeded.length} private or hard-to-publicly-corroborate claim${proofNeeded.length === 1 ? "" : "s"} need another proof path: ${summarizeProofRoutes(input.proofRoutes ?? [])}`
        : "No alternative proof routes are currently required.",
      claimIds: proofNeeded.map((entry) => entry.claimId),
      evidenceIds: idsFromVerifications(proofNeeded),
    },
    {
      id: "report-human-review",
      title: "Human review handoff",
      body: "Sherlock supplies corroboration, contradiction, and proof-route context only. A reviewer must audit the cited artifacts and make any decision outside this report.",
      claimIds: [],
      evidenceIds: [],
    },
  ]
}

function buildSynthesisInterviewPack(input: SherlockSynthesisInput): SherlockInterviewQuestion[] {
  const existing = (input.interviewPack ?? []).filter((question) => {
    const claimIds = new Set(input.claims.map((claim) => claim.id))
    const evidenceIds = new Set(input.evidence.map((evidence) => evidence.id))
    return (
      question.linkedClaimIds.every((id) => claimIds.has(id)) &&
      question.linkedEvidenceIds.every((id) => evidenceIds.has(id)) &&
      assertSherlockEvidenceOnlyOutput(question).ok
    )
  })

  if (existing.length) return existing.slice(0, 8)

  return input.verifications
    .filter((verification) => verification.state === "contradicted" || verification.state === "needs_alternative_proof" || verification.state === "unverified")
    .slice(0, 8)
    .map((verification) => {
      const claim = input.claims.find((entry) => entry.id === verification.claimId)
      return {
        id: `synthesis-q-${verification.claimId}`,
        question: questionForState(verification.state, claim),
        reason: verification.summary,
        linkedClaimIds: [verification.claimId],
        linkedEvidenceIds: idsFromVerifications([verification]),
      }
    })
}

function questionForState(state: SherlockVerificationState, claim: SherlockClaim | undefined) {
  const subject = claim?.subject ?? claim?.type ?? "this claim"
  if (state === "contradicted") return `Walk through the mismatch for ${subject} and explain which artifact is incomplete or outdated.`
  if (state === "needs_alternative_proof") return `Which approved artifact, walkthrough, or reference can corroborate ${subject}?`
  return `What approved source should reviewers use to corroborate ${subject}?`
}

function summarizeClaims(claims: SherlockClaim[], verifications: SherlockVerification[]) {
  return verifications
    .slice(0, 3)
    .map((verification) => claims.find((claim) => claim.id === verification.claimId)?.subject ?? verification.claimId)
    .join(", ")
}

function summarizeProofRoutes(routes: SherlockAlternativeProofRoute[]) {
  if (!routes.length) return "request a work sample, reference, or approved source export."
  return routes
    .slice(0, 3)
    .map((route) => route.label)
    .join(", ")
}

function idsFromVerifications(verifications: SherlockVerification[]) {
  return unique(verifications.flatMap((verification) => [...verification.supportingEvidenceIds, ...verification.contradictingEvidenceIds]))
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}
