import { notFound, redirect } from "next/navigation"
import { getRole, getSessionUser } from "@/lib/auth"
import { getCandidateProfile } from "@/lib/profile/recruiter"
import RecruiterCandidateProfile from "@/app/recruiter/candidate-profile"

export const dynamic = "force-dynamic"

export default async function RecruiterCandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) redirect("/student/login")
  if (getRole(user) !== "recruiter") redirect("/student")

  const { id } = await params
  const profile = await getCandidateProfile(id)
  if (!profile) notFound()

  return <RecruiterCandidateProfile profile={profile} />
}
