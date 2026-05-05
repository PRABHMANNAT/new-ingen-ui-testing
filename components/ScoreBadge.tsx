import { cn } from "@/lib/utils"

export function ScoreBadge({ label, value, className }: { label: string; value: number; className?: string }) {
  const tone = value >= 90 ? "text-emerald-600" : value >= 82 ? "text-[var(--pm-accent)]" : "text-amber-600"

  return (
    <div className={cn("rounded-2xl border border-[var(--pm-border)] bg-[var(--pm-chip)] p-4", className)}>
      <div className={cn("text-3xl font-light tabular-nums", tone)}>{value}%</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--pm-subtle)]">{label}</div>
    </div>
  )
}
