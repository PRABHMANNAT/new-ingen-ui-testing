import { NextResponse } from "next/server"
import { z } from "zod"
import { assertSherlockEvidenceOnlyOutput } from "@/lib/sherlock/guardrails"
import { sherlockArtifactEnvelopeSchema } from "@/lib/sherlock/schemas"
import {
  getSherlockPersistenceContext,
  toSavedReportLocalStorageItem,
  writeSherlockAudit,
} from "@/lib/sherlock/server-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const saveRequestSchema = z.object({
  artifact: sherlockArtifactEnvelopeSchema,
  title: z.string().trim().optional(),
  summary: z.string().trim().optional(),
  tags: z.array(z.string().trim().min(1)).max(8).optional(),
})

export async function POST(request: Request) {
  const parsed = saveRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid Sherlock report payload" }, { status: 400 })
  }

  const guardrail = assertSherlockEvidenceOnlyOutput(parsed.data.artifact)
  if (!guardrail.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Sherlock report contains prohibited scoring, ranking, or decision fields.",
        violations: guardrail.violations,
      },
      { status: 422 },
    )
  }

  const artifact = parsed.data.artifact
  const localStorageItem = toSavedReportLocalStorageItem(artifact)
  const persistence = await getSherlockPersistenceContext()

  if (!persistence.available || !isUuid(artifact.sessionId)) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      fallback: "localStorage",
      reason: persistence.available ? "non_uuid_session" : persistence.reason,
      localStorageKey: "sherlock-saved-reports-v1",
      localStorageItem,
    })
  }

  const { supabase, userId } = persistence
  const title = parsed.data.title || localStorageItem.title
  const summary = parsed.data.summary || localStorageItem.summary
  const tags = parsed.data.tags ?? localStorageItem.tags

  const { error: sessionError } = await supabase.from("sherlock_sessions").upsert({
    id: artifact.sessionId,
    owner_user_id: userId,
    candidate_display_name: artifact.candidate.displayName ?? null,
    target_role: artifact.targetRole ?? null,
    status: "ready",
  })

  if (sessionError) {
    return NextResponse.json({ ok: false, error: sessionError.message }, { status: 500 })
  }

  const { data: report, error: reportError } = await supabase
    .from("sherlock_reports")
    .insert({
      session_id: artifact.sessionId,
      title,
      artifact_envelope: artifact,
    })
    .select("id")
    .single()

  if (reportError || !report) {
    return NextResponse.json({ ok: false, error: reportError?.message ?? "Report save failed" }, { status: 500 })
  }

  const { data: savedReport, error: savedError } = await supabase
    .from("sherlock_saved_reports")
    .insert({
      owner_user_id: userId,
      report_id: report.id,
      title,
      summary,
      tags,
    })
    .select("id")
    .single()

  if (savedError || !savedReport) {
    return NextResponse.json({ ok: false, error: savedError?.message ?? "Saved report insert failed" }, { status: 500 })
  }

  await writeSherlockAudit(supabase, {
    sessionId: artifact.sessionId,
    actorType: "user",
    eventType: "report_saved",
    eventJson: {
      reportId: report.id,
      savedReportId: savedReport.id,
      title,
      tags,
    },
  })

  return NextResponse.json({
    ok: true,
    persisted: true,
    reportId: report.id,
    savedReportId: savedReport.id,
    localStorageKey: "sherlock-saved-reports-v1",
    localStorageItem: toSavedReportLocalStorageItem(artifact, savedReport.id),
  })
}

function isUuid(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
}
