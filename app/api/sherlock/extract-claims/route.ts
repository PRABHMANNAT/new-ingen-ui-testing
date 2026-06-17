import { NextResponse } from "next/server"
import { z } from "zod"
import { extractSherlockClaims } from "@/lib/sherlock/claim-extractor"
import { getSherlockPersistenceContext, writeSherlockAudit } from "@/lib/sherlock/server-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const extractRequestSchema = z.object({
  text: z.string().default(""),
  sourceName: z.string().trim().optional(),
  sourceKind: z.enum(["resume", "linkedin_paste", "application", "free_text", "github", "portfolio", "other"]).optional(),
  sessionId: z.string().uuid().optional(),
  useOpenAI: z.boolean().optional(),
})

export async function POST(request: Request) {
  const parsed = extractRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid claim extraction payload" }, { status: 400 })
  }

  const extraction = await extractSherlockClaims(parsed.data)
  const persistence = await getSherlockPersistenceContext()

  if (persistence.available && parsed.data.sessionId) {
    await writeSherlockAudit(persistence.supabase, {
      sessionId: parsed.data.sessionId,
      actorType: "system",
      eventType: "claims_extracted",
      eventJson: {
        sourceName: extraction.sourceName,
        sourceKind: extraction.sourceKind,
        claimCount: extraction.claims.length,
        extractionMethod: extraction.extractionMethod,
      },
    })
  }

  return NextResponse.json({
    ok: true,
    extraction,
    persistedAudit: persistence.available && Boolean(parsed.data.sessionId),
    fallback: persistence.available ? null : "localOnly",
  })
}
