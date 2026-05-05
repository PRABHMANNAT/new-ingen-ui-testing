export type CandidateAffiliation = {
  id: string
  name: string
  type:
    | "Company"
    | "Internship"
    | "University"
    | "Club"
    | "Society"
    | "Accelerator"
    | "Hackathon"
    | "Research"
    | "Open Source"
    | "Portfolio"
  role?: string
  date?: string
  duration?: string
  description?: string
  logoText: string
  logoUrl?: string
  accent: "orange" | "blue" | "green" | "purple" | "red" | "neutral"
  verified?: boolean
}

export function AffiliationLogoChip({
  affiliation,
  compact = false,
}: {
  affiliation: CandidateAffiliation
  compact?: boolean
}) {
  const toneMap = {
    orange: "bg-[#FFE1C7] text-[#FF6A00] border-[#FFC99D]",
    blue: "bg-[#E7EEFF] text-[#4077EE] border-[#C9D8FF]",
    green: "bg-[#DDF8EB] text-[#18A86B] border-[#BFEBD2]",
    purple: "bg-[#EEE7FF] text-[#8B5CF6] border-[#D8CAFF]",
    red: "bg-[#FFE5E3] text-[#E24740] border-[#FFC7C3]",
    neutral: "bg-[#EEE8DF] text-[#2A2520] border-[#DED4C7] dark:bg-[#242424] dark:text-white dark:border-white/10",
  }

  return (
    <div
      className={[
        "group flex items-center gap-3 rounded-full border bg-[#FBF7EF]/90 shadow-[0_8px_24px_rgba(42,37,32,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(42,37,32,0.09)] dark:border-white/10 dark:bg-[#141414]/90 dark:shadow-none",
        compact ? "px-2.5 py-2" : "px-3 py-2.5",
      ].join(" ")}
      title={`${affiliation.name}${affiliation.role ? ` · ${affiliation.role}` : ""}`}
    >
      <div
        className={[
          "grid shrink-0 place-items-center rounded-full border text-[9px] font-black uppercase tracking-[-0.04em]",
          compact ? "h-8 w-8" : "h-10 w-10",
          toneMap[affiliation.accent],
        ].join(" ")}
      >
        {affiliation.logoUrl ? (
          <img
            src={affiliation.logoUrl}
            alt={affiliation.name}
            className="h-full w-full rounded-full object-contain p-1.5"
          />
        ) : (
          affiliation.logoText
        )}
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="max-w-[130px] truncate text-[12px] font-black tracking-[-0.04em] text-[#2A2520] dark:text-white">
            {affiliation.name}
          </p>
          <p className="mt-0.5 max-w-[130px] truncate text-[9px] font-black uppercase tracking-[0.16em] text-[#8A8177] dark:text-white/40">
            {affiliation.type}
          </p>
        </div>
      )}
      {affiliation.verified && !compact && <span className="ml-1 h-2 w-2 rounded-full bg-[#18A86B]" />}
    </div>
  )
}
