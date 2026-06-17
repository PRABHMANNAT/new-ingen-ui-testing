import { NextResponse } from "next/server"
import { z } from "zod"
import { assertSherlockEvidenceOnlyOutput } from "@/lib/sherlock/guardrails"
import { synthesizeSherlockReport, validateSynthesisReferences } from "@/lib/sherlock/llm-synthesis"
import {
  sherlockAlternativeProofRouteSchema,
  sherlockClaimSchema,
  sherlockEvidenceSchema,
  sherlockInterviewQuestionSchema,
  sherlockSynthesisSchema,
  sherlockVerificationSchema,
} from "@/lib/sherlock/schemas"
import { getSherlockPersistenceContext, writeSherlockAudit } from "@/lib/sherlock/server-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const synthesizeRequestSchema = z.object({
  sessionId: z.string().min(1).optional(),
  claims: z.array(sherlockClaimSchema).default([]),
  evidence: z.array(sherlockEvidenceSchema).default([]),
  verifications: z.array(sherlockVerificationSchema).default([]),
  interviewPack: z.array(sherlockInterviewQuestionSchema).default([]),
  proofRoutes: z.array(sherlockAlternativeProofRouteSchema).default([]),
  candidateName: z.string().trim().optional(),
  targetRole: z.string().trim().optional(),
  useOpenAI: z.boolean().optional(),
})

export async function POST(request: Request) {
  const parsed = synthesizeRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid Sherlock synthesis payload" }, { status: 400 })
  }

  let synthesis
  try {
    synthesis = await synthesizeSherlockReport(parsed.data)
  } catch {
    return NextResponse.json({ ok: false, error: "Synthesis could not be produced from the submitted evidence." }, { status: 422 })
  }

  const schemaResult = sherlockSynthesisSchema.safeParse(synthesis)
  if (!schemaResult.success) {
    return NextResponse.json({ ok: false, error: "Synthesis output did not match the structured schema." }, { status: 422 })
  }

  const referenceViolations = validateSynthesisReferences(schemaResult.data, {
    claimIds: parsed.data.claims.map((claim) => claim.id),
    evidenceIds: parsed.data.evidence.map((evidence) => evidence.id),
  })
  if (referenceViolations.length) {
    return NextResponse.json(
      { ok: false, error: "Synthesis cited unknown claim or evidence IDs.", violations: referenceViolations },
      { status: 422 },
    )
  }

  const guardrail = assertSherlockEvidenceOnlyOutput(schemaResult.data)
  if (!guardrail.ok) {
    return NextResponse.json({ ok: false, error: "Synthesis output violated evidence-only guardrails.", violations: guardrail.violations }, { status: 422 })
  }

  const persistence = await getSherlockPersistenceContext()
  const canAudit = persistence.available && Boolean(parsed.data.sessionId) && isUuid(parsed.data.sessionId)
  if (canAudit && persistence.available) {
    await writeSherlockAudit(persistence.supabase, {
      sessionId: parsed.data.sessionId!,
      actorType: schemaResult.data.method === "openai_structured" ? "model" : "system",
      eventType: "synthesis_completed",
      eventJson: {
        claimCount: parsed.data.claims.length,
        evidenceCount: parsed.data.evidence.length,
        verificationCount: parsed.data.verifications.length,
        method: schemaResult.data.method,
      },
    })
  }

  return NextResponse.json({
    ok: true,
    synthesis: schemaResult.data,
    persistedAudit: canAudit,
    fallback: persistence.available ? null : "localOnly",
  })
}

function isUuid(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
}
