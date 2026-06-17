import { NextResponse } from "next/server"
import { z } from "zod"
import { collectSherlockSources } from "@/lib/sherlock/collectors"
import { sherlockClaimSchema } from "@/lib/sherlock/schemas"
import { getSherlockPersistenceContext, writeSherlockAudit } from "@/lib/sherlock/server-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const collectRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  claims: z.array(sherlockClaimSchema).default([]),
  urls: z.array(z.string()).default([]),
  enableSearch: z.boolean().optional(),
})

export async function POST(request: Request) {
  const parsed = collectRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid Sherlock collection payload" }, { status: 400 })
  }

  const result = await collectSherlockSources(parsed.data)
  const persistence = await getSherlockPersistenceContext()

  if (persistence.available && parsed.data.sessionId) {
    await writeSherlockAudit(persistence.supabase, {
      sessionId: parsed.data.sessionId,
      actorType: "collector",
      eventType: "source_collection_completed",
      eventJson: {
        planned: result.plan.items.length,
        evidenceCount: result.evidence.length,
        statuses: result.statuses,
        warnings: result.warnings,
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
