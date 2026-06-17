import { describe, expect, it } from "vitest"
import { assertSherlockEvidenceOnlyOutput } from "../guardrails"
import { mockSherlockArtifact } from "../mock-artifact"
import { sherlockArtifactEnvelopeSchema } from "../schemas"

describe("Sherlock artifact schema", () => {
  it("accepts the Phase 1 mock artifact envelope", () => {
    const result = sherlockArtifactEnvelopeSchema.safeParse(mockSherlockArtifact)

    expect(result.success).toBe(true)
  })

  it("requires evidence-only verification states", () => {
    const invalid = {
      ...mockSherlockArtifact,
      verifications: [
        {
          ...mockSherlockArtifact.verifications[0],
          state: "recommended",
        },
      ],
    }

    const result = sherlockArtifactEnvelopeSchema.safeParse(invalid)

    expect(result.success).toBe(false)
  })

  it("requires explicit no-score/no-ranking/no-auto-reject guardrail flags", () => {
    const invalid = {
      ...mockSherlockArtifact,
      prohibitedOutputsAbsent: {
        noScore: true,
        noRanking: true,
        noAutoReject: false,
      },
    }

    const result = sherlockArtifactEnvelopeSchema.safeParse(invalid)

    expect(result.success).toBe(false)
  })
})

describe("Sherlock evidence-only guardrails", () => {
  it("allows the mock artifact because it has no score, rank, or decision output", () => {
    expect(assertSherlockEvidenceOnlyOutput(mockSherlockArtifact)).toEqual({ ok: true })
  })

  it("rejects score-like output fields", () => {
    const result = assertSherlockEvidenceOnlyOutput({
      ...mockSherlockArtifact,
      candidateScore: 92,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.violations[0]).toContain("candidateScore")
  })

  it("rejects ranking or hire recommendation language in report text", () => {
    const result = assertSherlockEvidenceOnlyOutput({
      ...mockSherlockArtifact,
      contradictionCards: [
        {
          ...mockSherlockArtifact.contradictionCards[0],
          summary: "This is a strong hire recommendation.",
        },
      ],
    })

    expect(result.ok).toBe(false)
  })
})
