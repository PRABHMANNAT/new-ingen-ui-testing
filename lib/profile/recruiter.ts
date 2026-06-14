import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { FullProfile, ProfileRow, SectionWithItems } from "@/lib/supabase/types"

function hydrateProfile(profile: ProfileRow, sections: SectionWithItems[] | null | undefined): FullProfile {
  const hydrated = (sections ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((section) => ({
      ...section,
      items: (section.items ?? [])
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((item) => ({ ...item, proofs: item.proofs ?? [] })),
    }))

  return { ...profile, sections: hydrated }
}

export async function getRecruiterProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<ProfileRow>()
  if (error) throw new Error(`Could not load recruiter profile: ${error.message}`)
  return data
}

export async function getRecruiterCandidates(): Promise<FullProfile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*, sections(*, items(*, proofs(*)))")
    .eq("role", "student")
    .order("updated_at", { ascending: false })

  if (error) throw new Error(`Could not load candidates: ${error.message}`)

  return (data ?? []).map((row) => {
    const profile = row as ProfileRow & { sections?: SectionWithItems[] }
    return hydrateProfile(profile, profile.sections)
  })
}

export async function getCandidateProfile(profileId: string): Promise<FullProfile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*, sections(*, items(*, proofs(*)))")
    .eq("id", profileId)
    .eq("role", "student")
    .maybeSingle()

  if (error) throw new Error(`Could not load candidate: ${error.message}`)
  if (!data) return null

  const profile = data as ProfileRow & { sections?: SectionWithItems[] }
  return hydrateProfile(profile, profile.sections)
}
