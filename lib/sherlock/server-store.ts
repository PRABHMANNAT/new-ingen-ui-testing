import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import type { SherlockArtifactEnvelope } from "@/lib/sherlock/types"

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export type SherlockPersistenceUnavailableReason = "supabase_not_configured" | "unauthenticated"

export type SherlockPersistenceContext =
  | {
      available: true
      supabase: SupabaseClient
      userId: string
    }
  | {
      available: false
      reason: SherlockPersistenceUnavailableReason
    }

export async function getSherlockPersistenceContext(): Promise<SherlockPersistenceContext> {
  if (!isSupabaseConfigured()) {
    return { available: false, reason: "supabase_not_configured" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { available: false, reason: "unauthenticated" }
  }

  return { available: true, supabase, userId: user.id }
}

export async function writeSherlockAudit(
  supabase: SupabaseClient,
  input: {
    sessionId: string
    actorType: "system" | "user" | "model" | "collector"
    eventType: string
    eventJson?: Record<string, unknown>
  },
) {
  await supabase.from("sherlock_audit_log").insert({
    session_id: input.sessionId,
    actor_type: input.actorType,
    event_type: input.eventType,
    event_json: input.eventJson ?? {},
  })
}

export function toSavedReportLocalStorageItem(artifact: SherlockArtifactEnvelope, reportId?: string) {
  const savedAt = new Date().toISOString()
  return {
    id: reportId ?? `sherlock-${artifact.sessionId}-${Date.now()}`,
    kind: "sherlock_report",
    title: `${artifact.candidate.displayName ?? "Candidate"} Evidence Report`,
    savedAt,
    summary: `${artifact.summary.verified} verified, ${artifact.summary.contradicted} contradicted, ${artifact.summary.needsAlternativeProof} proof route.`,
    description: `Evidence-only report for ${artifact.targetRole ?? "role-scoped verification"}. Human decision required.`,
    tags: ["Evidence", "Human review", artifact.targetRole ?? "Sherlock"].slice(0, 3),
    href: `/analyse-profile?reportId=${encodeURIComponent(artifact.sessionId)}`,
    artifact,
  }
}
