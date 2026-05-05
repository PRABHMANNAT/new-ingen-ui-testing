import { AffiliationLogoChip, type CandidateAffiliation } from "@/components/interviews/AffiliationLogoChip"

export function ExperienceTimeline({ candidate }: { candidate: { affiliations?: CandidateAffiliation[] } }) {
  const affiliations = candidate.affiliations ?? []
  if (!affiliations.length) return null

  return (
    <section className="mt-6 rounded-[36px] border border-[#DED4C7] bg-[#FBF7EF] p-7 shadow-[0_18px_50px_rgba(42,37,32,0.06)] dark:border-white/10 dark:bg-[#101010] dark:shadow-none">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.28em] text-[#8A8177] dark:text-white/40">Experience map</p>
          <h2 className="mt-3 text-[34px] font-black tracking-[-0.08em] text-[#2A2520] dark:text-white">Where the signal comes from</h2>
        </div>
        <p className="max-w-[320px] text-right text-[12px] font-bold leading-5 tracking-[-0.03em] text-[#8A8177] dark:text-white/45">
          Logos represent verified and declared proof sources across work, education, clubs, code, and projects.
        </p>
      </div>
      <div className="mt-7 space-y-4">
        {affiliations.map((item, index) => (
          <div key={item.id} className="grid grid-cols-[46px_1fr] gap-4">
            <div className="relative flex justify-center">
              <div className="relative z-10">
                <AffiliationLogoChip affiliation={item} compact />
              </div>
              {index !== affiliations.length - 1 && <div className="absolute top-10 h-[calc(100%+16px)] w-px bg-[#DED4C7] dark:bg-white/10" />}
            </div>
            <div className="rounded-[24px] border border-[#DED4C7] bg-[#FFFDF8] p-5 dark:border-white/10 dark:bg-[#141414]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[18px] font-black tracking-[-0.05em] text-[#2A2520] dark:text-white">{item.name}</h3>
                    <span className="rounded-full bg-[#EEE8DF] px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#6F675F] dark:bg-white/5 dark:text-white/55">
                      {item.type}
                    </span>
                    {item.verified && (
                      <span className="rounded-full bg-[#DDF8EB] px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#18A86B]">
                        Verified
                      </span>
                    )}
                  </div>
                  {item.role && <p className="mt-2 text-[13px] font-black tracking-[-0.03em] text-[#6F675F] dark:text-white/60">{item.role}</p>}
                </div>
                {item.date && <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8A8177] dark:text-white/40">{item.date}</p>}
              </div>
              {item.description && (
                <p className="mt-4 text-[13px] font-bold leading-6 tracking-[-0.03em] text-[#6F675F] dark:text-white/55">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
