export type SherlockVerificationState = "verified" | "contradicted" | "unverified" | "needs_alternative_proof"

export type SherlockClaimType =
  | "identity"
  | "stack"
  | "tenure"
  | "title"
  | "scope"
  | "education"
  | "project"
  | "package"
  | "publication"
  | "company_context"
  | "other"

export type SherlockEvidenceReliability =
  | "primary_artifact"
  | "self_reported"
  | "third_party_context"
  | "model_inferred"
  | "untrusted_search_hit"

export type SherlockClaim = {
  id: string
  type: SherlockClaimType
  text: string
  subject?: string
  source: string
  sourceSnippet: string
}

export type SherlockEvidence = {
  id: string
  sourceType: SherlockEvidenceReliability
  sourceName: string
  sourceUrl?: string
  retrievedAt: string
  artifactDate?: string
  rawSnapshotRef?: string
  summary: string
  details: string[]
  reliability: SherlockEvidenceReliability
  normalizedJson?: Record<string, unknown>
}

export type SherlockVerification = {
  id: string
  claimId: string
  state: SherlockVerificationState
  summary: string
  supportingEvidenceIds: string[]
  contradictingEvidenceIds: string[]
  proofRoute?: string
  humanReviewRequired: true
}

export type SherlockContradictionCard = {
  id: string
  title: string
  claimId: string
  evidenceIds: string[]
  summary: string
  interviewPrompt: string
}

export type SherlockInterviewQuestion = {
  id: string
  question: string
  reason: string
  linkedClaimIds: string[]
  linkedEvidenceIds: string[]
}

export type SherlockAlternativeProofRoute = {
  id: string
  label: string
  reason: string
  requestedArtifacts: string[]
}

export type SherlockReportSection = {
  id: string
  title: string
  body: string
  claimIds: string[]
  evidenceIds: string[]
}

export type SherlockShareableEvidenceReport = {
  title: string
  generatedAt: string
  candidateName?: string
  targetRole?: string
  sections: SherlockReportSection[]
  evidenceIds: string[]
  humanDecisionRequired: true
}

export type SherlockSynthesis = {
  artifactType: "sherlock_synthesis"
  version: "1.0"
  generatedAt: string
  method: "deterministic" | "openai_structured" | "openai_structured_with_deterministic_fallback"
  ninetySecondReport: SherlockReportSection[]
  interviewPack: SherlockInterviewQuestion[]
  shareableReport: SherlockShareableEvidenceReport
  warnings: string[]
}

export type SherlockTimelineEvent = {
  id: string
  date: string
  label: string
  source: string
  state: SherlockVerificationState
}

export type SherlockGitHubDepth = {
  username: string
  ownedRepos: number
  forkedRepos: number
  authoredCommits: number
  cadenceSummary: string
  languageSignals: Array<{
    language: string
    basis: "authored_commits" | "repo_level_context"
    summary: string
  }>
  noiseSignals: string[]
}

export type SherlockArtifactEnvelope = {
  artifactType: "sherlock_evidence_report"
  version: "1.0"
  sessionId: string
  generatedAt: string
  candidate: {
    displayName?: string
    handles: Array<{
      source: string
      value: string
      url?: string
      confidence: "high" | "medium" | "low"
    }>
  }
  targetRole?: string
  summary: {
    verified: number
    contradicted: number
    unverified: number
    needsAlternativeProof: number
    humanReviewRequired: true
  }
  githubDepth: SherlockGitHubDepth
  timeline: SherlockTimelineEvent[]
  claims: SherlockClaim[]
  evidence: SherlockEvidence[]
  verifications: SherlockVerification[]
  contradictionCards: SherlockContradictionCard[]
  interviewPack: SherlockInterviewQuestion[]
  proofRoutes: SherlockAlternativeProofRoute[]
  synthesis?: SherlockSynthesis
  auditRefs: string[]
  prohibitedOutputsAbsent: {
    noScore: true
    noRanking: true
    noAutoReject: true
  }
}

export type SherlockSavedReport = {
  id: string
  kind: "sherlock_report"
  title: string
  savedAt: string
  summary: string
  description: string
  tags: string[]
  href: string
  artifact: SherlockArtifactEnvelope
}
