import { NextResponse } from "next/server"
import { z } from "zod"
import { assertSherlockEvidenceOnlyOutput } from "@/lib/sherlock/guardrails"
import { sherlockClaimSchema, sherlockEvidenceSchema } from "@/lib/sherlock/schemas"
import { getSherlockPersistenceContext, writeSherlockAudit } from "@/lib/sherlock/server-store"
import { verifySherlockClaims } from "@/lib/sherlock/verification-engine"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const verifyRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  claims: z.array(sherlockClaimSchema).default([]),
  evidence: z.array(sherlockEvidenceSchema).default([]),
})

export async function POST(request: Request) {
  const parsed = verifyRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid Sherlock verification payload" }, { status: 400 })
  }

  const result = verifySherlockClaims(parsed.data)
  const guardrail = assertSherlockEvidenceOnlyOutput(result)
  if (!guardrail.ok) {
    return NextResponse.json({ ok: false, error: "Verification output violated evidence-only guardrails.", violations: guardrail.violations }, { status: 422 })
  }

  const persistence = await getSherlockPersistenceContext()
  if (persistence.available && parsed.data.sessionId) {
    await writeSherlockAudit(persistence.supabase, {
      sessionId: parsed.data.sessionId,
      actorType: "system",
      eventType: "verification_completed",
      eventJson: {
        claimCount: parsed.data.claims.length,
        evidenceCount: parsed.data.evidence.length,
        summary: result.summary,
      },
    })
  }

  return NextResponse.json({
    ok: true,
    ...result,
    persistedAudit: persistence.available && Boolean(parsed.data.sessionId),
    fallback: persistence.available ? null : "localOnly",
  })
}
