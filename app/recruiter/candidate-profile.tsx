import Link from "next/link"
import { ArrowLeft, CheckCircle2, ExternalLink, Mail, ShieldCheck, Target } from "lucide-react"
import { getProfileCompleteness, getProofRollup } from "@/lib/profile/metrics"
import type { FullProfile, ProofRow } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

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
export default function RecruiterCandidateProfile({ profile }: { profile: FullProfile }) {
  const rollup = getProofRollup(profile)
  const completeness = getProfileCompleteness(profile)
  const populatedSections = profile.sections.filter((section) => section.items.length > 0)

  return (
    <main className="h-full min-w-0 flex-1 overflow-y-auto bg-[#F7F3EC] text-[#241F18] dark:bg-[#050505] dark:text-white">
      <div className="mx-auto w-full max-w-[1040px] px-6 py-8 lg:px-10 lg:py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-black text-[#74695E] transition hover:text-[#DF5F12] dark:text-white/48"
        >
          <ArrowLeft size={14} />
          Candidate portfolio
        </Link>

        <header className="mt-6 border-y border-[#DCCFBE] py-8 dark:border-white/10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[28px] bg-[#241F18] text-2xl font-black text-white dark:bg-white dark:text-black">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(profile.full_name)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#DF5F12]">Proof-backed profile</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.05em]">{profile.full_name || "Unnamed student"}</h1>
              <p className="mt-2 text-sm font-bold text-[#74695E] dark:text-white/48">
                {profile.headline || profile.target_role || "Profile in progress"}
              </p>
              {profile.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-[#DCCFBE] px-2.5 py-1 text-[10px] font-black text-[#74695E] dark:border-white/10 dark:text-white/48">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#241F18] px-4 text-xs font-black text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-black"
              >
                <Mail size={14} />
                Contact
              </a>
            )}
          </div>

          <div className="mt-8 grid gap-px overflow-hidden rounded-2xl bg-[#DCCFBE] dark:bg-white/10 sm:grid-cols-3">
            <ProfileStat label="Verified proof" value={`${rollup.verified}/${rollup.claimed}`} detail={`${rollup.score}% weighted confidence`} />
            <ProfileStat label="Profile complete" value={`${completeness}%`} detail={`${populatedSections.length} populated sections`} />
            <ProfileStat label="Target role" value={profile.target_role || "Open"} detail="Student preference" />
          </div>
        </header>

        {profile.about && (
          <section className="grid gap-4 border-b border-[#DCCFBE] py-8 dark:border-white/10 md:grid-cols-[180px_1fr]">
            <div className="flex items-center gap-2 self-start text-[10px] font-black uppercase tracking-[0.18em] text-[#81766C] dark:text-white/42">
              <Target size={14} className="text-[#DF5F12]" />
              Profile summary
            </div>
            <p className="max-w-3xl text-sm font-semibold leading-7 text-[#5E554D] dark:text-white/58">{profile.about}</p>
          </section>
        )}

        {populatedSections.length > 0 ? (
          <div>
            {populatedSections.map((section) => (
              <section key={section.id} className="grid gap-5 border-b border-[#DCCFBE] py-8 dark:border-white/10 md:grid-cols-[180px_1fr]">
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-[#81766C] dark:text-white/42">{section.title}</h2>
                  <p className="mt-1 text-[10px] font-semibold text-[#A0958A] dark:text-white/25">{section.items.length} entries</p>
                </div>
                <div className="divide-y divide-[#E4D9CB] dark:divide-white/[0.07]">
                  {section.items.map((item) => (
                    <article key={item.id} className="py-5 first:pt-0 last:pb-0">
                      <h3 className="text-sm font-black">{item.title || "Untitled entry"}</h3>
                      {item.body && (
                        <p className="mt-2 whitespace-pre-line text-xs font-semibold leading-6 text-[#74695E] dark:text-white/46">
                          {item.body}
                        </p>
                      )}
                      {item.proofs.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.proofs.map((proof) => (
                            <ProofChip key={proof.id} proof={proof} />
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section className="flex min-h-64 flex-col items-center justify-center border-b border-dashed border-[#DCCFBE] text-center dark:border-white/10">
            <ShieldCheck size={24} className="text-[#A0958A] dark:text-white/25" />
            <h2 className="mt-4 text-base font-black">This profile is still being built</h2>
            <p className="mt-1 max-w-md text-xs font-semibold leading-5 text-[#81766C] dark:text-white/40">
              The student has not added any profile entries yet. Header details remain available for contact and role matching.
            </p>
          </section>
        )}
      </div>
    </main>
  )
}

function ProfileStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="bg-[#FFF9F0] px-5 py-4 dark:bg-[#0D0D0D]">
      <p className="truncate text-lg font-black tracking-[-0.03em]">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#81766C] dark:text-white/40">{label}</p>
      <p className="mt-0.5 text-[9px] font-semibold text-[#A0958A] dark:text-white/25">{detail}</p>
    </div>
  )
}

function ProofChip({ proof }: { proof: ProofRow }) {
  const content = (
    <>
      {proof.status === "verified" ? <CheckCircle2 size={12} /> : <ShieldCheck size={12} />}
      <span>{proof.kind}</span>
      <span className="opacity-65">{proof.status}</span>
      {proof.url && <ExternalLink size={10} />}
    </>
  )

  const className = cn(
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em]",
    proof.status === "verified"
      ? "border-emerald-600/25 bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
      : proof.status === "partial"
        ? "border-amber-600/25 bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
        : "border-[#DCCFBE] text-[#81766C] dark:border-white/10 dark:text-white/38",
  )

  return proof.url ? (
    <a href={proof.url} target="_blank" rel="noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <span className={className}>{content}</span>
  )
}
