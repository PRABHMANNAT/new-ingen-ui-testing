import { describe, expect, it } from "vitest"
import { assertSherlockEvidenceOnlyOutput } from "../guardrails"
import { synthesizeSherlockReport, validateSynthesisReferences } from "../llm-synthesis"
import { mockSherlockArtifact } from "../mock-artifact"
import { sherlockSynthesisSchema } from "../schemas"

describe("synthesizeSherlockReport", () => {
  it("returns structured deterministic synthesis with supported evidence IDs only", async () => {
    const synthesis = await synthesizeSherlockReport({
      claims: mockSherlockArtifact.claims,
      evidence: mockSherlockArtifact.evidence,
      verifications: mockSherlockArtifact.verifications,
      interviewPack: mockSherlockArtifact.interviewPack,
      proofRoutes: mockSherlockArtifact.proofRoutes,
      candidateName: mockSherlockArtifact.candidate.displayName,
      targetRole: mockSherlockArtifact.targetRole,
      useOpenAI: false,
    })

    expect(sherlockSynthesisSchema.safeParse(synthesis).success).toBe(true)
    expect(assertSherlockEvidenceOnlyOutput(synthesis)).toEqual({ ok: true })
    expect(
      validateSynthesisReferences(synthesis, {
        claimIds: mockSherlockArtifact.claims.map((claim) => claim.id),
        evidenceIds: mockSherlockArtifact.evidence.map((evidence) => evidence.id),
      }),
    ).toEqual([])
  })

  it("rejects synthesis that cites unsupported evidence IDs", async () => {
    const synthesis = await synthesizeSherlockReport({
      claims: mockSherlockArtifact.claims,
      evidence: mockSherlockArtifact.evidence,
      verifications: mockSherlockArtifact.verifications,
      useOpenAI: false,
    })

    const invalid = {
      ...synthesis,
      ninetySecondReport: [
        {
          ...synthesis.ninetySecondReport[0],
          evidenceIds: ["ev-made-up"],
        },
      ],
    }

    const violations = validateSynthesisReferences(invalid, {
      claimIds: mockSherlockArtifact.claims.map((claim) => claim.id),
      evidenceIds: mockSherlockArtifact.evidence.map((evidence) => evidence.id),
    })

    expect(violations).toContain("ninetySecondReport.0.evidenceIds.0 cites unknown evidence ev-made-up")
  })

  it("fails guardrails on forbidden synthesis terms", () => {
    for (const term of ["score", "rank", "hire", "reject", "pass", "fail"]) {
      const result = assertSherlockEvidenceOnlyOutput({
        artifactType: "sherlock_synthesis",
        shareableReport: {
          sections: [{ title: "Invalid", body: `This output contains ${term}.` }],
        },
      })

      expect(result.ok, term).toBe(false)
    }
  })

  it("fails guardrails on forbidden output fields", () => {
    for (const key of ["candidateScore", "rank", "hireRecommendation", "rejectRecommendation", "pass", "fail"]) {
      const result = assertSherlockEvidenceOnlyOutput({
        artifactType: "sherlock_synthesis",
        [key]: true,
      })

      expect(result.ok, key).toBe(false)
    }
  })
})
