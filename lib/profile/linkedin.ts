import "server-only"
import type { User } from "@supabase/supabase-js"
import type { createClient } from "@/lib/supabase/server"

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export type LinkedInIdentity = {
  connected: boolean
  name: string
  email: string
  avatarUrl: string | null
  connectedAt: string | null
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function linkedinIdentity(user: User) {
  return user.identities?.find((identity) => identity.provider === "linkedin_oidc")
}

export function getLinkedInIdentity(user: User): LinkedInIdentity {
  const identity = linkedinIdentity(user)
  const data = (identity?.identity_data ?? {}) as Record<string, unknown>
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>

  return {
    connected: Boolean(identity),
    name:
      text(data.full_name) ||
      text(data.name) ||
      text(metadata.full_name) ||
      text(metadata.name),
    email: text(data.email) || text(user.email),
    avatarUrl:
      text(data.avatar_url) ||
      text(data.picture) ||
      text(metadata.avatar_url) ||
      text(metadata.picture) ||
      null,
    connectedAt: identity?.created_at ?? null,
  }
}

export async function syncLinkedInProfile(
  supabase: SupabaseServerClient,
  user: User,
): Promise<LinkedInIdentity> {
  const identity = getLinkedInIdentity(user)
  if (!identity.connected) return identity

  const { data: existing } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url")
    .eq("id", user.id)
    .maybeSingle()

  const patch: Record<string, string> = {}
  if (identity.name && (!existing?.full_name || existing.full_name !== identity.name)) {
    patch.full_name = identity.name
  }
  if (identity.email && (!existing?.email || existing.email !== identity.email)) {
    patch.email = identity.email
  }
  if (identity.avatarUrl && (!existing?.avatar_url || existing.avatar_url !== identity.avatarUrl)) {
    patch.avatar_url = identity.avatarUrl
  }

  if (Object.keys(patch).length > 0) {
    await supabase.from("profiles").update(patch).eq("id", user.id)
  }

  return identity
}
