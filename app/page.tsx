import { redirect } from "next/navigation"
import { getRole, getSessionUser } from "@/lib/auth"
import { getRecruiterCandidates, getRecruiterProfile } from "@/lib/profile/recruiter"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import RecruiterHome from "@/app/recruiter/recruiter-home"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  if (!isSupabaseConfigured()) {
    return <RecruiterHome recruiter={null} candidates={[]} setupRequired />
  }

  const user = await getSessionUser()
  if (!user) redirect("/student/login?next=/")
  if (getRole(user) !== "recruiter") redirect("/student")

  const [recruiter, candidates] = await Promise.all([getRecruiterProfile(), getRecruiterCandidates()])
  return <RecruiterHome recruiter={recruiter} candidates={candidates} />
}
