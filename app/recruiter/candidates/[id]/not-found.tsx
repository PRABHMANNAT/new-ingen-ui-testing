import Link from "next/link"
import { ArrowLeft, UserRoundX } from "lucide-react"

export default function CandidateNotFound() {
  return (
    <main className="flex h-full min-w-0 flex-1 items-center justify-center bg-[#F7F3EC] px-6 text-center text-[#241F18] dark:bg-[#050505] dark:text-white">
      <div>
        <UserRoundX size={30} className="mx-auto text-[#A0958A] dark:text-white/25" />
        <h1 className="mt-4 text-xl font-black">Candidate profile not found</h1>
        <p className="mt-2 text-sm font-semibold text-[#81766C] dark:text-white/40">
          The profile may have been removed or is not a student account.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#241F18] px-4 py-2.5 text-xs font-black text-white dark:bg-white dark:text-black"
        >
          <ArrowLeft size={14} />
          Back to candidates
        </Link>
      </div>
    </main>
  )
}
