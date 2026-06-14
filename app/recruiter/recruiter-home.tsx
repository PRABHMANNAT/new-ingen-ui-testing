"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Command,
  LogOut,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react"
import { getProfileCompleteness, getProofRollup } from "@/lib/profile/metrics"
import type { FullProfile, ProfileRow } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"
import { recruiterSignOutAction } from "./actions"

type StatusFilter = "all" | "verified" | "building"

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  )
}
export default function RecruiterHome({
  recruiter,
  candidates,
  setupRequired = false,
}: {
  recruiter: ProfileRow | null
  candidates: FullProfile[]
  setupRequired?: boolean
}) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [pending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return candidates.filter((candidate) => {
      const rollup = getProofRollup(candidate)
      const matchesQuery =
        !normalized ||
        [candidate.full_name, candidate.headline, candidate.target_role, candidate.tags.join(" ")].some((value) =>
          value.toLowerCase().includes(normalized),
        )
      const matchesStatus =
        status === "all" ||
        (status === "verified" && rollup.verified > 0) ||
        (status === "building" && rollup.verified === 0)
      return matchesQuery && matchesStatus
    })
  }, [candidates, query, status])

  const totalProofs = candidates.reduce((sum, candidate) => sum + getProofRollup(candidate).claimed, 0)
  const verifiedProofs = candidates.reduce((sum, candidate) => sum + getProofRollup(candidate).verified, 0)
  const readyCandidates = candidates.filter((candidate) => getProofRollup(candidate).verified > 0).length

  return (
    <main className="h-full min-w-0 flex-1 overflow-y-auto bg-[#F7F3EC] text-[#241F18] dark:bg-[#050505] dark:text-white">
      <div className="mx-auto w-full max-w-[1220px] px-6 py-8 lg:px-10 lg:py-10">
        <header className="flex flex-col gap-6 border-b border-[#DCCFBE] pb-8 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#DF5F12]">
              <Sparkles size={13} />
              Recruiter workspace
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] lg:text-4xl">
              Candidate proof, ready to inspect.
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#74695E] dark:text-white/48">
              Search student profiles, compare verified evidence, and open the full record without relying on resume claims alone.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/pm"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#DCCFBE] bg-[#FFFCF7] px-4 text-xs font-black text-[#5E554D] transition hover:-translate-y-0.5 hover:border-[#DF5F12]/45 hover:text-[#C9500D] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60"
            >
              <Command size={14} />
              Command center
            </Link>
            {!setupRequired && (
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => void recruiterSignOutAction())}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-[#DCCFBE] px-4 text-xs font-black text-[#74695E] transition hover:border-red-300 hover:text-red-600 disabled:opacity-50 dark:border-white/10 dark:text-white/50"
              >
                <LogOut size={14} />
                Sign out
              </button>
            )}
          </div>
        </header>

        {setupRequired ? (
          <SetupState />
        ) : (
          <>
            <section className="grid border-b border-[#DCCFBE] dark:border-white/10 sm:grid-cols-3">
              <Metric label="Student profiles" value={candidates.length} detail={`${readyCandidates} with verified proof`} icon={Users} />
              <Metric label="Evidence claimed" value={totalProofs} detail="Across all profile items" icon={CircleDashed} />
              <Metric label="Verified artifacts" value={verifiedProofs} detail="Ownership or authorship matched" icon={ShieldCheck} />
            </section>

            <section className="pt-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-[-0.03em]">Student portfolio</h2>
                  <p className="mt-1 text-xs font-semibold text-[#81766C] dark:text-white/42">
                    {recruiter?.full_name ? `Signed in as ${recruiter.full_name}. ` : ""}
                    Profiles are ordered by most recently updated.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="relative block min-w-0 sm:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A8F84] dark:text-white/30" size={15} />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Name, role, or skill"
                      className="h-11 w-full rounded-full border border-[#DCCFBE] bg-[#FFFCF7] pl-10 pr-4 text-sm font-bold outline-none transition placeholder:text-[#A89D91] focus:border-[#DF5F12]/55 focus:ring-4 focus:ring-[#DF5F12]/10 dark:border-white/10 dark:bg-white/[0.04] dark:placeholder:text-white/25"
                    />
                  </label>
                  <div className="flex items-center gap-1 rounded-full border border-[#DCCFBE] bg-[#FFFCF7] p-1 dark:border-white/10 dark:bg-white/[0.04]">
                    <SlidersHorizontal size={14} className="ml-2 text-[#8A7E73] dark:text-white/35" />
                    {(["all", "verified", "building"] as StatusFilter[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setStatus(option)}
                        className={cn(
                          "rounded-full px-3 py-2 text-[10px] font-black capitalize transition",
                          status === option
                            ? "bg-[#241F18] text-white shadow-sm dark:bg-white dark:text-black"
                            : "text-[#81766C] hover:text-[#241F18] dark:text-white/42 dark:hover:text-white",
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {filtered.length > 0 ? (
                <div className="mt-6 divide-y divide-[#E4D9CB] border-y border-[#DCCFBE] dark:divide-white/[0.07] dark:border-white/10">
                  {filtered.map((candidate) => (
                    <CandidateRow key={candidate.id} candidate={candidate} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  hasCandidates={candidates.length > 0}
                  onClear={() => {
                    setQuery("")
                    setStatus("all")
                  }}
                />
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: number
  detail: string
  icon: typeof Users
}) {
  return (
    <div className="flex items-center gap-4 border-[#DCCFBE] py-6 dark:border-white/10 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2E8DC] text-[#C9500D] dark:bg-[#DF5F12]/12 dark:text-[#FF8A43]">
        <Icon size={17} />
      </div>
      <div>
        <p className="text-2xl font-black tracking-[-0.04em]">{value}</p>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#74695E] dark:text-white/45">{label}</p>
        <p className="mt-0.5 text-[10px] font-semibold text-[#9A8F84] dark:text-white/28">{detail}</p>
      </div>
    </div>
  )
}

function CandidateRow({ candidate }: { candidate: FullProfile }) {
  const rollup = getProofRollup(candidate)
  const completeness = getProfileCompleteness(candidate)

  return (
    <Link
      href={`/recruiter/candidates/${candidate.id}`}
      className="group grid gap-4 py-5 transition hover:bg-[#FFF9F0] dark:hover:bg-white/[0.025] md:grid-cols-[minmax(0,1.5fr)_minmax(180px,0.8fr)_160px_24px] md:items-center md:px-3"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#241F18] text-sm font-black text-white dark:bg-white dark:text-black">
          {candidate.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={candidate.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(candidate.full_name)
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black">{candidate.full_name || "Unnamed student"}</h3>
          <p className="mt-1 truncate text-xs font-semibold text-[#74695E] dark:text-white/45">
            {candidate.headline || candidate.target_role || "Profile in progress"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {candidate.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded-full bg-[#EEE6DB] px-2 py-0.5 text-[9px] font-black text-[#74695E] dark:bg-white/[0.06] dark:text-white/45">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em]">
          <CheckCircle2 size={13} className={rollup.verified > 0 ? "text-emerald-600" : "text-[#A89D91]"} />
          {rollup.verified} verified
          {rollup.partial > 0 && <span className="text-amber-600">+ {rollup.partial} partial</span>}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E6DDD1] dark:bg-white/[0.08]">
          <div className="h-full rounded-full bg-emerald-600 transition-all duration-500" style={{ width: `${rollup.score}%` }} />
        </div>
        <p className="mt-1.5 text-[9px] font-bold text-[#9A8F84] dark:text-white/30">
          {rollup.claimed ? `${rollup.score}% proof confidence` : "No proof claimed yet"}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.12em] text-[#81766C] dark:text-white/38">
          <span>Profile</span>
          <span>{completeness}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E6DDD1] dark:bg-white/[0.08]">
          <div className="h-full rounded-full bg-[#DF5F12] transition-all duration-500" style={{ width: `${completeness}%` }} />
        </div>
      </div>

      <ArrowRight size={17} className="text-[#A89D91] transition group-hover:translate-x-1 group-hover:text-[#DF5F12] dark:text-white/25" />
    </Link>
  )
}

function EmptyState({ hasCandidates, onClear }: { hasCandidates: boolean; onClear: () => void }) {
  return (
    <div className="mt-6 flex min-h-64 flex-col items-center justify-center border-y border-dashed border-[#DCCFBE] px-6 text-center dark:border-white/10">
      <Search size={24} className="text-[#A89D91] dark:text-white/25" />
      <h3 className="mt-4 text-base font-black">{hasCandidates ? "No profiles match this view" : "No student profiles yet"}</h3>
      <p className="mt-1 max-w-md text-xs font-semibold leading-5 text-[#81766C] dark:text-white/40">
        {hasCandidates
          ? "Clear the search or show every proof status to return to the full portfolio."
          : "Student accounts will appear here after they create a profile."}
      </p>
      {hasCandidates && (
        <button type="button" onClick={onClear} className="mt-4 rounded-full bg-[#241F18] px-4 py-2 text-xs font-black text-white dark:bg-white dark:text-black">
          Clear filters
        </button>
      )}
    </div>
  )
}

function SetupState() {
  return (
    <section className="mt-8 border-y border-dashed border-[#DCCFBE] py-16 text-center dark:border-white/10">
      <CircleDashed size={26} className="mx-auto text-[#DF5F12]" />
      <h2 className="mt-4 text-xl font-black">Connect Supabase to load recruiter data</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-[#81766C] dark:text-white/42">
        Add the Supabase URL and anonymous key to <code className="font-mono text-xs">.env.local</code>, then restart the development server.
      </p>
    </section>
  )
}
