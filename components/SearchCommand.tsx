"use client"

import { ArrowUp, RotateCcw } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const EXAMPLES = [
  "Alex Rivera",
  "Senior Rust Engineer",
  "Find backend candidates with Kubernetes",
  "github.com/alexrivera",
  "Data analyst with SQL dashboards",
]

export function SearchCommand({
  query,
  setQuery,
  onSearch,
  onReset,
  loading,
  compact = false,
}: {
  query: string
  setQuery: (query: string) => void
  onSearch: (query: string) => void
  onReset: () => void
  loading: boolean
  compact?: boolean
}) {
  return (
    <motion.div
      layout
      className={cn(
        "mx-auto w-full max-w-3xl rounded-[1.75rem] border border-[var(--pm-border)] bg-[var(--pm-card)] p-4 shadow-[0_18px_60px_rgba(36,31,24,0.08)]",
        compact && "max-w-none",
      )}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSearch(query)
        }}
        className="relative"
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ex: Alex Rivera, github.com/alexrivera, Senior Rust Engineer"
          className="h-14 w-full rounded-2xl border border-[var(--pm-border)] bg-[var(--pm-input)] px-5 pr-28 text-sm text-[var(--pm-text)] outline-none transition placeholder:text-[var(--pm-placeholder)] focus:border-[var(--pm-focus)] focus:ring-4 focus:ring-[var(--pm-focus)]/20"
        />
        <div className="absolute right-2 top-2 flex gap-2">
          {compact && (
            <button
              type="button"
              onClick={onReset}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pm-chip)] text-[var(--pm-muted)] transition hover:text-[var(--pm-text)]"
              aria-label="New search"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition",
              query.trim() && !loading
                ? "bg-[var(--pm-accent)] text-white shadow-[0_0_28px_var(--pm-accent-glow)] hover:bg-[var(--pm-accent-hover)]"
                : "bg-[var(--pm-chip)] text-[var(--pm-placeholder)]",
            )}
            aria-label="Run candidate search"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </form>

      {!compact && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setQuery(example)
                onSearch(example)
              }}
              className="rounded-full bg-[var(--pm-chip)] px-3 py-1.5 text-[11px] text-[var(--pm-muted)] transition hover:bg-[var(--pm-chip-hover)] hover:text-[var(--pm-text)]"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
