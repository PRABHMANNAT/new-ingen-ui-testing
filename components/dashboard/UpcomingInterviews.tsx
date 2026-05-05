"use client"

import React, { useMemo } from "react"
import { format, isSameDay, parseISO } from "date-fns"
import { INTERVIEWS_MOCK, type Interview, type InterviewStage, type InterviewStatus } from "@/data/interviews"
import { cn } from "@/lib/utils"
import { useAppTheme } from "@/components/theme/ThemeProvider"

type UpcomingInterviewsProps = {
  selectedDate: Date | null
  className?: string
}

const STATUS_CLASSES: Record<InterviewStatus, string> = {
  confirmed: "bg-[#00b4a0]",
  pending: "bg-[#f59340]",
  rescheduled: "bg-[#e05555]",
}

function sortByDateTime(a: Interview, b: Interview) {
  return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
}

export function UpcomingInterviews({ selectedDate, className }: UpcomingInterviewsProps) {
  const { theme } = useAppTheme()
  const isDark = theme === "dark"
  const cardClass = isDark
    ? "border-[#242424] bg-[#101010] shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
    : "border-[#DED4C7] bg-[#FBF7EF] shadow-[0_18px_50px_rgba(42,37,32,0.06)]"
  const rowClass = isDark
    ? "border-[#242424] bg-[#171717] hover:bg-[#1C1C1C]"
    : "border-[#DED4C7] bg-[#FFFDF8] hover:bg-[#EEE8DF]/70"
  const titleClass = isDark ? "text-white" : "text-[#2A2520]"
  const mutedClass = isDark ? "text-[#A0A0A0]" : "text-[#7A7168]"
  const faintClass = isDark ? "text-[#777]" : "text-[#8A8177]"
  const stageClasses: Record<InterviewStage, string> = {
    Technical: "bg-[#00b4a0]/[0.12] text-[#00b4a0]",
    "Culture Fit": "bg-[#8b7fd4]/[0.12] text-[#8b7fd4]",
    "Final Round": "bg-[#f59340]/[0.12] text-[#f59340]",
    "Intro Call": isDark ? "bg-white/[0.08] text-white/70" : "bg-[#0a0a0a]/[0.08] text-[#2A2520]",
  }

  const interviews = useMemo(() => {
    const sorted = [...INTERVIEWS_MOCK].sort(sortByDateTime)
    if (!selectedDate) return sorted

    return sorted.filter((interview) => isSameDay(parseISO(interview.date), selectedDate))
  }, [selectedDate])

  return (
    <section className={cn("flex min-h-[300px] flex-col overflow-hidden rounded-[1.75rem] border p-5 backdrop-blur-xl", cardClass, className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className={cn("font-mono text-[11px] font-medium uppercase tracking-[0.22em]", faintClass)}>
          Upcoming Interviews
        </h2>
        <span className="rounded-full bg-[var(--pm-accent)] px-2 py-0.5 font-mono text-[10px] font-medium text-white">
          +{interviews.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 [scrollbar-color:var(--pm-border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--pm-border)] [&::-webkit-scrollbar-track]:bg-transparent">
        {interviews.length === 0 ? (
          <div className={cn("flex min-h-[180px] items-center justify-center rounded-[8px] font-mono text-[11px]", faintClass)}>
            No interviews scheduled
          </div>
        ) : (
          <div className="space-y-2">
            {interviews.slice(0, 5).map((interview) => (
              <article
                key={interview.id}
                className={cn("grid grid-cols-[110px_1fr_80px] items-center gap-3 rounded-[14px] border px-3 py-2.5 transition-colors duration-150", rowClass)}
              >
                <div>
                  <span className={cn("inline-flex rounded-[4px] px-2 py-1 font-mono text-[10px] font-medium", stageClasses[interview.stage])}>
                    {interview.stage}
                  </span>
                </div>

                <div className="min-w-0">
                  <h3 className={cn("truncate text-sm font-semibold", titleClass)}>{interview.candidate}</h3>
                  <p className={cn("mt-0.5 truncate text-xs", mutedClass)}>{interview.role}</p>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <div className={cn("text-right font-mono text-[11px]", faintClass)}>
                    <div>{format(parseISO(interview.date), "MMM d")}</div>
                    <div>{interview.time}</div>
                  </div>
                  <span className={cn("h-2 w-2 rounded-full", STATUS_CLASSES[interview.status])} aria-label={interview.status} />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
