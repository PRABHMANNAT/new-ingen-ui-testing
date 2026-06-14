import { NextResponse, type NextRequest } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { getCurrentProfile } from "@/lib/profile/queries"
import { generateResumePdf } from "@/lib/resume/pdf"
import { isResumeFormat } from "@/lib/resume/types"
import { getSupabaseEnv } from "@/lib/supabase/config"
import type { FullProfile, ProfileRow, SectionWithItems } from "@/lib/supabase/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format")
  if (!isResumeFormat(format)) {
    return NextResponse.json({ error: "Unsupported resume format" }, { status: 400 })
  }

  const profile = (await getBearerProfile(request)) ?? (await getCurrentProfile())
  if (!profile) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { bytes, filename } = await generateResumePdf({
    profile,
    format,
    generatedAt: new Date(),
  })

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  })
}

async function getBearerProfile(request: NextRequest): Promise<FullProfile | null> {
  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) return null
  const token = authorization.slice(7).trim()
  if (!token) return null

  const { url, anonKey } = getSupabaseEnv()
  const supabase = createSupabaseClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const {
    data: { user },
  } = await supabase.auth.getUser(token)
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>()
  if (!profile) return null

  const { data: sections } = await supabase
    .from("sections")
    .select("*, items(*, proofs(*))")
    .eq("profile_id", user.id)
    .order("position", { ascending: true })

  const hydrated: SectionWithItems[] = (sections ?? []).map((section) => ({
    ...section,
    items: ((section.items as SectionWithItems["items"]) ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((item) => ({ ...item, proofs: item.proofs ?? [] })),
  }))

  return { ...profile, sections: hydrated }
}
