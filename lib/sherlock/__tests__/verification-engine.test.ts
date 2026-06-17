import { describe, expect, it } from "vitest"
import { assertSherlockEvidenceOnlyOutput } from "../guardrails"
import { verifySherlockClaims } from "../verification-engine"
import type { SherlockClaim, SherlockEvidence } from "../types"

function claim(input: Partial<SherlockClaim> & Pick<SherlockClaim, "id" | "type" | "text">): SherlockClaim {
  return {
    subject: input.subject,
    source: input.source ?? "Resume",
    sourceSnippet: input.sourceSnippet ?? input.text,
    ...input,
  }
}

function evidence(input: Partial<SherlockEvidence> & Pick<SherlockEvidence, "id" | "summary">): SherlockEvidence {
  return {
    sourceType: "primary_artifact",
    sourceName: "Test artifact",
    retrievedAt: "2026-06-17T00:00:00.000Z",
    details: [],
    reliability: "primary_artifact",
    ...input,
  }
}

describe("verifySherlockClaims", () => {
  it("verifies stack claims when primary artifacts mention the claimed stack", () => {
    const result = verifySherlockClaims({
      claims: [
        claim({
          id: "claim-typescript",
          type: "stack",
          text: "Candidate claims production TypeScript API work.",
          subject: "TypeScript",
        }),
      ],
      evidence: [
        evidence({
          id: "ev-typescript",
          summary: "Owned repositories show TypeScript API services and authored commits.",
          normalizedJson: { languages: ["TypeScript"], repository: "api-service" },
        }),
      ],
    })

    expect(result.verifications[0].state).toBe("verified")
    expect(result.verifications[0].supportingEvidenceIds).toEqual(["ev-typescript"])
  })

  it("contradicts senior stack depth when only weak lab or tutorial evidence exists", () => {
    const result = verifySherlockClaims({
      claims: [
        claim({
          id: "claim-rust",
          type: "stack",
          text: "Candidate claims senior Rust backend production experience.",
          subject: "Rust",
        }),
      ],
      evidence: [
        evidence({
          id: "ev-rust-lab",
          summary: "Rust appears only in a small lab repository with limited commit history and no production artifact.",
          details: ["Small repository", "No production deployment artifact attached"],
        }),
      ],
    })

    expect(result.verifications[0].state).toBe("contradicted")
    expect(result.contradictionCards).toHaveLength(1)
    expect(result.interviewPack[0].question).toContain("Rust")
  })

  it("leaves title claims unverified when there is no direct contradiction", () => {
    const result = verifySherlockClaims({
      claims: [
        claim({
          id: "claim-title",
          type: "title",
          text: "Candidate claims Staff Engineer at a private company.",
          subject: "Staff Engineer",
        }),
      ],
      evidence: [],
    })

    expect(result.verifications[0].state).toBe("unverified")
    expect(result.verifications[0].summary).toContain("title authority")
  })

  it("detects tenure contradictions when senior tenure predates timeline evidence", () => {
    const result = verifySherlockClaims({
      claims: [
        claim({
          id: "claim-tenure",
          type: "tenure",
          text: "Senior Engineer at Acme, Jan 2021 - Dec 2023.",
          subject: "Senior Engineer tenure",
        }),
      ],
      evidence: [
        evidence({
          id: "ev-graduation",
          sourceName: "Education record",
          summary: "BSc conferred Nov 2022.",
          details: ["Graduation date conflicts with the claimed senior tenure start."],
          artifactDate: "2022-11-01T00:00:00.000Z",
          normalizedJson: { graduationDate: "2022-11-01T00:00:00.000Z" },
        }),
      ],
    })

    expect(result.verifications[0].state).toBe("contradicted")
    expect(result.verifications[0].contradictingEvidenceIds).toEqual(["ev-graduation"])
  })

  it("routes scope claims to alternative proof when public artifacts do not corroborate scope", () => {
    const result = verifySherlockClaims({
      claims: [
        claim({
          id: "claim-scope",
          type: "scope",
          text: "Candidate claims they architected payments platform and led six engineers.",
          subject: "Payments architecture",
        }),
      ],
      evidence: [],
    })

    expect(result.verifications[0].state).toBe("needs_alternative_proof")
    expect(result.proofRoutes[0].requestedArtifacts).toContain("Architecture walkthrough")
  })

  it("routes private-repo stack claims to alternative proof instead of penalizing missing public evidence", () => {
    const result = verifySherlockClaims({
      claims: [
        claim({
          id: "claim-private-go",
          type: "stack",
          text: "Candidate claims senior Go work in private company repositories.",
          subject: "Go",
        }),
      ],
      evidence: [],
    })

    expect(result.verifications[0].state).toBe("needs_alternative_proof")
    expect(result.verifications[0].proofRoute).toContain("private repository walkthrough")
  })

  it("keeps verification output inside evidence-only guardrails", () => {
    const result = verifySherlockClaims({
      claims: [
        claim({
          id: "claim-scope",
          type: "scope",
          text: "Candidate claims ownership of platform architecture.",
          subject: "Platform ownership",
        }),
      ],
      evidence: [],
    })

    expect(assertSherlockEvidenceOnlyOutput(result)).toEqual({ ok: true })
  })
})
