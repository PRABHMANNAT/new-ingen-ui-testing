import { z } from "zod"

export const sherlockVerificationStateSchema = z.enum([
  "verified",
  "contradicted",
  "unverified",
  "needs_alternative_proof",
])

export const sherlockClaimTypeSchema = z.enum([
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
])

export const sherlockEvidenceReliabilitySchema = z.enum([
  "primary_artifact",
  "self_reported",
  "third_party_context",
  "model_inferred",
  "untrusted_search_hit",
])

export const sherlockClaimSchema = z.object({
  id: z.string().min(1),
  type: sherlockClaimTypeSchema,
  text: z.string().min(1),
  subject: z.string().optional(),
  source: z.string().min(1),
  sourceSnippet: z.string().min(1),
})

export const sherlockEvidenceSchema = z.object({
  id: z.string().min(1),
  sourceType: sherlockEvidenceReliabilitySchema,
  sourceName: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  retrievedAt: z.string().min(1),
  artifactDate: z.string().optional(),
  rawSnapshotRef: z.string().optional(),
  summary: z.string().min(1),
  details: z.array(z.string().min(1)),
  reliability: sherlockEvidenceReliabilitySchema,
  normalizedJson: z.record(z.string(), z.unknown()).optional(),
})

export const sherlockVerificationSchema = z.object({
  id: z.string().min(1),
  claimId: z.string().min(1),
  state: sherlockVerificationStateSchema,
  summary: z.string().min(1),
  supportingEvidenceIds: z.array(z.string().min(1)),
  contradictingEvidenceIds: z.array(z.string().min(1)),
  proofRoute: z.string().optional(),
  humanReviewRequired: z.literal(true),
})

export const sherlockContradictionCardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  claimId: z.string().min(1),
  evidenceIds: z.array(z.string().min(1)),
  summary: z.string().min(1),
  interviewPrompt: z.string().min(1),
})

export const sherlockInterviewQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  reason: z.string().min(1),
  linkedClaimIds: z.array(z.string().min(1)),
  linkedEvidenceIds: z.array(z.string().min(1)),
})

export const sherlockAlternativeProofRouteSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  reason: z.string().min(1),
  requestedArtifacts: z.array(z.string().min(1)),
})

export const sherlockReportSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  claimIds: z.array(z.string().min(1)),
  evidenceIds: z.array(z.string().min(1)),
})

export const sherlockShareableEvidenceReportSchema = z.object({
  title: z.string().min(1),
  generatedAt: z.string().min(1),
  candidateName: z.string().optional(),
  targetRole: z.string().optional(),
  sections: z.array(sherlockReportSectionSchema),
  evidenceIds: z.array(z.string().min(1)),
  humanDecisionRequired: z.literal(true),
})

export const sherlockSynthesisSchema = z.object({
  artifactType: z.literal("sherlock_synthesis"),
  version: z.literal("1.0"),
  generatedAt: z.string().min(1),
  method: z.enum(["deterministic", "openai_structured", "openai_structured_with_deterministic_fallback"]),
  ninetySecondReport: z.array(sherlockReportSectionSchema),
  interviewPack: z.array(sherlockInterviewQuestionSchema),
  shareableReport: sherlockShareableEvidenceReportSchema,
  warnings: z.array(z.string()),
})

export const sherlockTimelineEventSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  label: z.string().min(1),
  source: z.string().min(1),
  state: sherlockVerificationStateSchema,
})

export const sherlockGitHubDepthSchema = z.object({
  username: z.string().min(1),
  ownedRepos: z.number().int().nonnegative(),
  forkedRepos: z.number().int().nonnegative(),
  authoredCommits: z.number().int().nonnegative(),
  cadenceSummary: z.string().min(1),
  languageSignals: z.array(
    z.object({
      language: z.string().min(1),
      basis: z.enum(["authored_commits", "repo_level_context"]),
      summary: z.string().min(1),
    }),
  ),
  noiseSignals: z.array(z.string().min(1)),
})

export const sherlockArtifactEnvelopeSchema = z.object({
  artifactType: z.literal("sherlock_evidence_report"),
  version: z.literal("1.0"),
  sessionId: z.string().min(1),
  generatedAt: z.string().min(1),
  candidate: z.object({
    displayName: z.string().optional(),
    handles: z.array(
      z.object({
        source: z.string().min(1),
        value: z.string().min(1),
        url: z.string().url().optional(),
        confidence: z.enum(["high", "medium", "low"]),
      }),
    ),
  }),
  targetRole: z.string().optional(),
  summary: z.object({
    verified: z.number().int().nonnegative(),
    contradicted: z.number().int().nonnegative(),
    unverified: z.number().int().nonnegative(),
    needsAlternativeProof: z.number().int().nonnegative(),
    humanReviewRequired: z.literal(true),
  }),
  githubDepth: sherlockGitHubDepthSchema,
  timeline: z.array(sherlockTimelineEventSchema),
  claims: z.array(sherlockClaimSchema),
  evidence: z.array(sherlockEvidenceSchema),
  verifications: z.array(sherlockVerificationSchema),
  contradictionCards: z.array(sherlockContradictionCardSchema),
  interviewPack: z.array(sherlockInterviewQuestionSchema),
  proofRoutes: z.array(sherlockAlternativeProofRouteSchema),
  synthesis: sherlockSynthesisSchema.optional(),
  auditRefs: z.array(z.string().min(1)),
  prohibitedOutputsAbsent: z.object({
    noScore: z.literal(true),
    noRanking: z.literal(true),
    noAutoReject: z.literal(true),
  }),
})

export type SherlockArtifactEnvelopeInput = z.infer<typeof sherlockArtifactEnvelopeSchema>
export type SherlockSynthesisInput = z.infer<typeof sherlockSynthesisSchema>

export const sherlockExtractedClaimsSchema = z.object({
  claims: z.array(sherlockClaimSchema),
  sourceName: z.string().min(1),
  sourceKind: z.enum(["resume", "linkedin_paste", "application", "free_text", "github", "portfolio", "other"]),
  extractionMethod: z.enum(["deterministic", "openai_structured", "openai_structured_with_deterministic_fallback"]),
  warnings: z.array(z.string()).default([]),
})

export type SherlockExtractedClaims = z.infer<typeof sherlockExtractedClaimsSchema>
