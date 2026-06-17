import { NextResponse } from "next/server"
import { z } from "zod"
import { getSherlockPersistenceContext, writeSherlockAudit } from "@/lib/sherlock/server-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const sessionRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().trim().min(1).optional(),
  sender: z.enum(["user", "sherlock", "system"]).default("user"),
  attachments: z.array(z.unknown()).default([]),
  candidateDisplayName: z.string().trim().optional(),
  targetRole: z.string().trim().optional(),
  status: z.enum(["draft", "collecting", "analyzing", "ready", "failed"]).default("draft"),
})

export async function POST(request: Request) {
  const parsed = sessionRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid Sherlock session payload" }, { status: 400 })
  }

  const persistence = await getSherlockPersistenceContext()
  const sessionId = parsed.data.sessionId ?? crypto.randomUUID()

  if (!persistence.available) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      fallback: "localStorage",
      reason: persistence.reason,
      sessionId,
      assistantMessage: "Session will stay local until Supabase is configured and you are signed in.",
      nextActions: [],
    })
  }

  const { supabase, userId } = persistence

  const { error: sessionError } = await supabase.from("sherlock_sessions").upsert({
    id: sessionId,
    owner_user_id: userId,
    candidate_display_name: parsed.data.candidateDisplayName ?? null,
    target_role: parsed.data.targetRole ?? null,
    status: parsed.data.status,
  })

  if (sessionError) {
    return NextResponse.json({ ok: false, error: sessionError.message }, { status: 500 })
  }

  if (parsed.data.message) {
    const { error: messageError } = await supabase.from("sherlock_messages").insert({
      session_id: sessionId,
      sender: parsed.data.sender,
      content: parsed.data.message,
      attachment_json: parsed.data.attachments,
    })

    if (messageError) {
      return NextResponse.json({ ok: false, error: messageError.message }, { status: 500 })
    }
  }

  await writeSherlockAudit(supabase, {
    sessionId,
    actorType: parsed.data.sender === "user" ? "user" : "system",
    eventType: parsed.data.message ? "message_appended" : "session_upserted",
    eventJson: {
      sender: parsed.data.sender,
      hasMessage: Boolean(parsed.data.message),
      attachmentCount: parsed.data.attachments.length,
    },
  })

  return NextResponse.json({
    ok: true,
    persisted: true,
    sessionId,
    assistantMessage: parsed.data.message ? "Message saved to Sherlock session." : "Sherlock session ready.",
    nextActions: [],
  })
}
