import { describe, expect, it } from "vitest"
import { extractSherlockClaims } from "../claim-extractor"
import { mockSherlockArtifact } from "../mock-artifact"
import { sherlockArtifactEnvelopeSchema } from "../schemas"

describe("extractSherlockClaims", () => {
  it("extracts self-reported stack, tenure, title, and scope claims without OpenAI", async () => {
    const result = await extractSherlockClaims({
      sourceName: "Resume paste",
      sourceKind: "resume",
      useOpenAI: false,
      text: [
        "Senior Go Engineer at Acme from Jan 2021 - Dec 2023.",
        "Architected the payments platform and scaled it to 10M users.",
        "Built React dashboards and Python ingestion services.",
      ].join("\n"),
    })

    expect(result.extractionMethod).toBe("deterministic")
    expect(result.claims.some((claim) => claim.type === "stack" && claim.subject === "Go")).toBe(true)
    expect(result.claims.some((claim) => claim.type === "tenure")).toBe(true)
    expect(result.claims.some((claim) => claim.type === "title")).toBe(true)
    expect(result.claims.some((claim) => claim.type === "scope")).toBe(true)
    expect(result.claims.every((claim) => claim.source === "Resume paste")).toBe(true)
  })

  it("treats LinkedIn pasted text as claim source, not evidence", async () => {
    const result = await extractSherlockClaims({
      sourceName: "LinkedIn paste",
      useOpenAI: false,
      text: "LinkedIn profile: Staff Engineer working with Rust and distributed systems since 2022.",
    })

    expect(result.sourceKind).toBe("linkedin_paste")
    expect(result.claims.length).toBeGreaterThan(0)
    expect(result.claims.every((claim) => claim.source === "LinkedIn paste")).toBe(true)
  })

  it("can form an extraction-only artifact where every extracted claim is unverified", async () => {
    const result = await extractSherlockClaims({
      sourceName: "Application",
      sourceKind: "application",
      useOpenAI: false,
      text: "Built TypeScript APIs and owned platform architecture.",
    })

    const artifact = {
      ...mockSherlockArtifact,
      summary: {
        verified: 0,
        contradicted: 0,
        unverified: result.claims.length,
        needsAlternativeProof: 0,
        humanReviewRequired: true,
      },
      claims: result.claims,
      verifications: result.claims.map((claim) => ({
        id: `ver-${claim.id}`,
        claimId: claim.id,
        state: "unverified",
        summary: "Self-reported claim extracted from user-provided text.",
        supportingEvidenceIds: [],
        contradictingEvidenceIds: [],
        humanReviewRequired: true,
      })),
      contradictionCards: [],
      interviewPack: [],
    }

    const parsed = sherlockArtifactEnvelopeSchema.safeParse(artifact)

    expect(parsed.success).toBe(true)
    expect(artifact.verifications.every((verification) => verification.state === "unverified")).toBe(true)
  })
})
