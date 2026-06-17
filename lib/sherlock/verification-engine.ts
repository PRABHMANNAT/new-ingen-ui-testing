import type {
  SherlockAlternativeProofRoute,
  SherlockClaim,
  SherlockContradictionCard,
  SherlockEvidence,
  SherlockInterviewQuestion,
  SherlockVerification,
  SherlockVerificationState,
} from "./types"

export type SherlockVerificationEngineResult = {
  verifications: SherlockVerification[]
  contradictionCards: SherlockContradictionCard[]
  interviewPack: SherlockInterviewQuestion[]
  proofRoutes: SherlockAlternativeProofRoute[]
  summary: {
    verified: number
    contradicted: number
    unverified: number
    needsAlternativeProof: number
    humanReviewRequired: true
  }
}

type RuleResult = Omit<SherlockVerification, "id" | "claimId" | "humanReviewRequired">

const PRIVATE_WORK_PHRASES = [
  "private",
  "proprietary",
  "internal",
  "company",
  "staff",
  "senior",
  "principal",
  "lead",
  "owned",
  "architected",
  "payments",
  "platform",
]

const WEAK_STACK_PHRASES = ["small", "lab", "tutorial", "fork", "forked", "limited", "readme-only", "no production", "does not prove"]

export function verifySherlockClaims(input: {
  claims: SherlockClaim[]
  evidence: SherlockEvidence[]
}): SherlockVerificationEngineResult {
  const verifications = input.claims.map((claim) => {
    const result = verifyClaim(claim, input.evidence)
    return {
      id: `ver-${claim.id}`,
      claimId: claim.id,
      humanReviewRequired: true as const,
      ...result,
    }
  })

  const contradictionCards = buildContradictionCards(input.claims, input.evidence, verifications)
  const interviewPack = buildInterviewPack(input.claims, input.evidence, verifications)
  const proofRoutes = buildProofRoutes(input.claims, verifications)

  return {
    verifications,
    contradictionCards,
    interviewPack,
    proofRoutes,
    summary: {
      verified: verifications.filter((entry) => entry.state === "verified").length,
      contradicted: verifications.filter((entry) => entry.state === "contradicted").length,
      unverified: verifications.filter((entry) => entry.state === "unverified").length,
      needsAlternativeProof: verifications.filter((entry) => entry.state === "needs_alternative_proof").length,
      humanReviewRequired: true,
    },
  }
}

function verifyClaim(claim: SherlockClaim, evidence: SherlockEvidence[]): RuleResult {
  if (claim.type === "stack") return verifyStackClaim(claim, evidence)
  if (claim.type === "tenure") return verifyTenureClaim(claim, evidence)
  if (claim.type === "title") return verifyTitleClaim(claim, evidence)
  if (claim.type === "scope") return verifyScopeClaim(claim, evidence)
  if (claim.type === "package") return verifyPackageClaim(claim, evidence)
  if (claim.type === "identity") return verifyIdentityClaim(claim, evidence)
  return verifyGenericClaim(claim, evidence)
}

function verifyStackClaim(claim: SherlockClaim, evidence: SherlockEvidence[]): RuleResult {
  const keyword = normalizeStackKeyword(claim.subject ?? claim.text)
  const relevant = keyword ? findEvidenceForKeyword(evidence, keyword) : []
  const usable = relevant.filter(isUsableEvidence)
  const weak = usable.filter((item) => hasAny(textOf(item), WEAK_STACK_PHRASES))
  const strong = usable.filter((item) => !weak.includes(item))

  if (strong.length) {
    return {
      state: "verified",
      summary: `Evidence artifacts mention ${keyword} in source material outside the self-reported claim set.`,
      supportingEvidenceIds: strong.map((item) => item.id),
      contradictingEvidenceIds: [],
    }
  }

  if (weak.length && /senior|staff|principal|lead|production|expert|\b\d+\s*(yrs?|years?)\b/i.test(claimText(claim))) {
    return {
      state: "contradicted",
      summary: `The available ${keyword} evidence is weak or lab-like while the claim describes senior or production depth.`,
      supportingEvidenceIds: [],
      contradictingEvidenceIds: weak.map((item) => item.id),
      proofRoute: `Ask for a ${keyword} production walkthrough, private work sample, or technical reference.`,
    }
  }

  if (isPrivateWorkClaim(claim)) {
    return {
      state: "needs_alternative_proof",
      summary: `${keyword ?? "Stack"} experience may exist in private work, but current public artifacts do not verify it.`,
      supportingEvidenceIds: [],
      contradictingEvidenceIds: [],
      proofRoute: "Route to work sample, live task, private repository walkthrough, or reference request.",
    }
  }

  return unverified("No non-self-reported artifact currently corroborates or contradicts this stack claim.")
}

function verifyTenureClaim(claim: SherlockClaim, evidence: SherlockEvidence[]): RuleResult {
  const claimStart = firstDateLike(claimText(claim))
  const contradictionEvidence = evidence.filter((item) => {
    if (!isUsableEvidence(item) || !claimStart) return false
    const dates = evidenceDates(item)
    const text = textOf(item)
    return dates.some((date) => date > claimStart && /graduat|conferred|first-ever|first public|first commit|created account/i.test(text))
  })

  if (contradictionEvidence.length && /senior|staff|principal|lead/i.test(claimText(claim))) {
    return {
      state: "contradicted",
      summary: "Timeline evidence conflicts with the claimed senior tenure start date.",
      supportingEvidenceIds: [],
      contradictingEvidenceIds: contradictionEvidence.map((item) => item.id),
      proofRoute: "Ask for employment verification, reference, or corrected role dates.",
    }
  }

  const support = evidence.filter((item) => isUsableEvidence(item) && datesOverlapClaim(item, claim))
  if (support.length) {
    return {
      state: "verified",
      summary: "Artifact dates bracket at least part of the claimed timeline.",
      supportingEvidenceIds: support.map((item) => item.id),
      contradictingEvidenceIds: [],
    }
  }

  return unverified("No artifact currently brackets or contradicts this timeline claim.")
}

function verifyTitleClaim(claim: SherlockClaim, evidence: SherlockEvidence[]): RuleResult {
  const titleText = claimText(claim)
  const contradictions = evidence.filter((item) => {
    if (!isUsableEvidence(item)) return false
    const text = textOf(item)
    return /intern|student|junior|new grad/i.test(text) && /staff|principal|senior|lead/i.test(titleText)
  })

  if (contradictions.length) {
    return {
      state: "contradicted",
      summary: "A public artifact uses a materially lower title than the submitted seniority claim.",
      supportingEvidenceIds: [],
      contradictingEvidenceIds: contradictions.map((item) => item.id),
      proofRoute: "Ask for reference verification or a corrected title timeline.",
    }
  }

  const exactTitle = evidence.filter((item) => isUsableEvidence(item) && hasTitleOverlap(titleText, textOf(item)))
  if (exactTitle.length) {
    return {
      state: "verified",
      summary: "A public artifact repeats the claimed title. Human review is still required for title authority.",
      supportingEvidenceIds: exactTitle.map((item) => item.id),
      contradictingEvidenceIds: [],
    }
  }

  return unverified("External sources rarely verify title authority; no contradiction was found.")
}

function verifyScopeClaim(claim: SherlockClaim, evidence: SherlockEvidence[]): RuleResult {
  const support = evidence.filter((item) => {
    if (!isUsableEvidence(item)) return false
    const text = textOf(item)
    return /architecture|architected|owner|owned|lead|led|case study|incident|design doc|payments|platform/i.test(text)
  })

  if (support.length) {
    return {
      state: "verified",
      summary: "Scope-related artifacts corroborate at least part of the claimed ownership or architecture work.",
      supportingEvidenceIds: support.map((item) => item.id),
      contradictingEvidenceIds: [],
    }
  }

  return {
    state: "needs_alternative_proof",
    summary: "Scope and impact claims are rarely fully public; no public artifact currently corroborates this scope claim.",
    supportingEvidenceIds: [],
    contradictingEvidenceIds: [],
    proofRoute: "Route to architecture walkthrough, reference request, design artifact, or work sample.",
  }
}

function verifyPackageClaim(claim: SherlockClaim, evidence: SherlockEvidence[]): RuleResult {
  const packageEvidence = evidence.filter((item) => isUsableEvidence(item) && /npm|pypi|crates\.io|package|registry/i.test(textOf(item)))
  const matching = packageEvidence.filter((item) => claimTerms(claim).some((term) => textOf(item).toLowerCase().includes(term)))

  if (matching.length) {
    return {
      state: "verified",
      summary: "Package registry metadata corroborates this package claim.",
      supportingEvidenceIds: matching.map((item) => item.id),
      contradictingEvidenceIds: [],
    }
  }

  return unverified("No package registry artifact currently matches this package claim.")
}

function verifyIdentityClaim(claim: SherlockClaim, evidence: SherlockEvidence[]): RuleResult {
  const support = evidence.filter((item) => isUsableEvidence(item) && /cross-link|github|portfolio|profile|handle/i.test(textOf(item)))
  if (support.length >= 2) {
    return {
      state: "verified",
      summary: "Multiple artifacts cross-link candidate profiles or handles.",
      supportingEvidenceIds: support.map((item) => item.id),
      contradictingEvidenceIds: [],
    }
  }

  return unverified("Identity continuity has no contradiction, but needs more than one approved artifact to verify.")
}

function verifyGenericClaim(claim: SherlockClaim, evidence: SherlockEvidence[]): RuleResult {
  const terms = claimTerms(claim)
  const support = evidence.filter((item) => isUsableEvidence(item) && terms.some((term) => textOf(item).toLowerCase().includes(term)))
  if (support.length) {
    return {
      state: "verified",
      summary: "At least one non-self-reported artifact overlaps with this claim.",
      supportingEvidenceIds: support.map((item) => item.id),
      contradictingEvidenceIds: [],
    }
  }
  return unverified("No artifact currently corroborates or contradicts this claim.")
}

function buildContradictionCards(
  claims: SherlockClaim[],
  evidence: SherlockEvidence[],
  verifications: SherlockVerification[],
): SherlockContradictionCard[] {
  return verifications
    .filter((verification) => verification.state === "contradicted")
    .map((verification) => {
      const claim = claims.find((entry) => entry.id === verification.claimId)
      return {
        id: `contradiction-${verification.claimId}`,
        claimId: verification.claimId,
        evidenceIds: verification.contradictingEvidenceIds,
        title: claim?.subject ? `${claim.subject} contradiction` : "Claim contradiction",
        summary: verification.summary,
        interviewPrompt: interviewQuestionFor(claim, evidence, verification),
      }
    })
}

function buildInterviewPack(
  claims: SherlockClaim[],
  evidence: SherlockEvidence[],
  verifications: SherlockVerification[],
): SherlockInterviewQuestion[] {
  return verifications
    .filter((verification) => verification.state === "contradicted" || verification.state === "needs_alternative_proof")
    .map((verification) => {
      const claim = claims.find((entry) => entry.id === verification.claimId)
      return {
        id: `q-${verification.claimId}`,
        question: interviewQuestionFor(claim, evidence, verification),
        reason: verification.summary,
        linkedClaimIds: [verification.claimId],
        linkedEvidenceIds: [...verification.supportingEvidenceIds, ...verification.contradictingEvidenceIds],
      }
    })
}

function buildProofRoutes(claims: SherlockClaim[], verifications: SherlockVerification[]): SherlockAlternativeProofRoute[] {
  return verifications
    .filter((verification) => verification.state === "needs_alternative_proof")
    .map((verification) => {
      const claim = claims.find((entry) => entry.id === verification.claimId)
      return {
        id: `route-${verification.claimId}`,
        label: routeLabelFor(claim),
        reason: verification.summary,
        requestedArtifacts: requestedArtifactsFor(claim),
      }
    })
}

function interviewQuestionFor(claim: SherlockClaim | undefined, evidence: SherlockEvidence[], verification: SherlockVerification) {
  if (claim?.type === "stack") {
    return `Walk through the strongest ${claim.subject ?? "stack"} work you personally authored, including a production issue or tradeoff.`
  }
  if (claim?.type === "tenure") return "Walk me through the exact role timeline and provide a reference or artifact for the disputed dates."
  if (claim?.type === "scope") return "Diagram the system or scope you owned and mark which parts you personally designed, reviewed, or operated."
  if (claim?.type === "title") return "Which artifact or reference can confirm this title and the dates it applied?"
  const evidenceSummary = verification.contradictingEvidenceIds.map((id) => evidence.find((entry) => entry.id === id)?.sourceName).filter(Boolean).join(", ")
  return evidenceSummary ? `Explain the mismatch between this claim and ${evidenceSummary}.` : "What artifact should a reviewer use to verify this claim?"
}

function routeLabelFor(claim: SherlockClaim | undefined) {
  if (claim?.type === "scope") return "Architecture proof path"
  if (claim?.type === "stack") return "Technical work sample"
  if (claim?.type === "title" || claim?.type === "tenure") return "Reference verification"
  return "Alternative proof path"
}

function requestedArtifactsFor(claim: SherlockClaim | undefined) {
  if (claim?.type === "scope") return ["Architecture walkthrough", "Design artifact", "Technical reference"]
  if (claim?.type === "stack") return ["Work sample", "Private repository walkthrough", "Live technical task"]
  if (claim?.type === "title" || claim?.type === "tenure") return ["Reference", "Employment verification", "Corrected timeline"]
  return ["Reference", "Work sample", "Approved source export"]
}

function unverified(summary: string): RuleResult {
  return {
    state: "unverified",
    summary,
    supportingEvidenceIds: [],
    contradictingEvidenceIds: [],
  }
}

function isUsableEvidence(evidence: SherlockEvidence) {
  return evidence.sourceType !== "self_reported" && evidence.sourceType !== "model_inferred" && evidence.sourceType !== "untrusted_search_hit"
}

function findEvidenceForKeyword(evidence: SherlockEvidence[], keyword: string) {
  const normalized = keyword.toLowerCase()
  return evidence.filter((item) => textOf(item).toLowerCase().includes(normalized))
}

function normalizeStackKeyword(value: string) {
  const lower = value.toLowerCase()
  if (lower.includes("typescript")) return "typescript"
  if (lower.includes("javascript")) return "javascript"
  if (lower.includes("python")) return "python"
  if (lower.includes("rust")) return "rust"
  if (/\bgo\b|golang/.test(lower)) return "go"
  if (lower.includes("react")) return "react"
  if (lower.includes("node")) return "node"
  if (lower.includes("postgres")) return "postgres"
  return value.split(/\s+/)[0]?.toLowerCase()
}

function textOf(evidence: SherlockEvidence) {
  return [
    evidence.sourceName,
    evidence.sourceUrl,
    evidence.summary,
    ...evidence.details,
    evidence.normalizedJson ? JSON.stringify(evidence.normalizedJson) : "",
  ]
    .filter(Boolean)
    .join(" ")
}

function claimText(claim: SherlockClaim) {
  return `${claim.text} ${claim.subject ?? ""} ${claim.sourceSnippet}`
}

function claimTerms(claim: SherlockClaim) {
  return claimText(claim)
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .split(/[^a-z0-9@._/-]+/)
    .filter((term) => term.length >= 3)
    .slice(0, 12)
}

function hasAny(value: string, terms: string[]) {
  const lower = value.toLowerCase()
  return terms.some((term) => lower.includes(term))
}

function isPrivateWorkClaim(claim: SherlockClaim) {
  return hasAny(claimText(claim), PRIVATE_WORK_PHRASES)
}

function firstDateLike(value: string): Date | null {
  const monthYear = value.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(20\d{2})\b/i)
  if (monthYear) return new Date(`${monthYear[1]} 1, ${monthYear[2]}`)
  const year = value.match(/\b(20\d{2})\b/)
  return year ? new Date(`${year[1]}-01-01T00:00:00.000Z`) : null
}

function evidenceDates(evidence: SherlockEvidence) {
  const candidates = [
    evidence.artifactDate,
    evidence.normalizedJson?.firstPublicCodeDate,
    evidence.normalizedJson?.firstCommitDate,
    evidence.normalizedJson?.graduationDate,
    evidence.normalizedJson?.createdAt,
    evidence.normalizedJson?.updatedAt,
  ].filter((value): value is string => typeof value === "string")
  return candidates.map((value) => new Date(value)).filter((date) => !Number.isNaN(date.getTime()))
}

function datesOverlapClaim(evidence: SherlockEvidence, claim: SherlockClaim) {
  const claimDate = firstDateLike(claimText(claim))
  if (!claimDate) return false
  return evidenceDates(evidence).some((date) => Math.abs(date.getTime() - claimDate.getTime()) < 1000 * 60 * 60 * 24 * 365 * 3)
}

function hasTitleOverlap(claim: string, evidence: string) {
  const lowerClaim = claim.toLowerCase()
  const lowerEvidence = evidence.toLowerCase()
  return ["staff engineer", "senior engineer", "principal engineer", "lead engineer", "software engineer"].some(
    (title) => lowerClaim.includes(title) && lowerEvidence.includes(title),
  )
}
