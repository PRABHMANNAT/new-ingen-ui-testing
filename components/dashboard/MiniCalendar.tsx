"use client"

import React, { useMemo, useState } from "react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { INTERVIEWS_MOCK } from "@/data/interviews"
import { cn } from "@/lib/utils"

type MiniCalendarProps = {
  selectedDate: Date | null
  onSelectDate: (date: Date) => void
  className?: string
}

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

export function MiniCalendar({ selectedDate, onSelectDate, className }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))

  const interviewDates = useMemo(() => INTERVIEWS_MOCK.map((interview) => parseISO(interview.date)), [])
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)

    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    })
  }, [currentMonth])

  return (
    <section className={cn("flex min-h-[300px] flex-col overflow-hidden rounded-[1.75rem] border border-[var(--pm-border)] bg-[var(--pm-card)] p-5 shadow-[0_18px_60px_rgba(36,31,24,0.08)] backdrop-blur-xl dark:shadow-none", className)}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--pm-subtle)]">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentMonth((month) => subMonths(month, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--pm-subtle)] transition-colors hover:text-[var(--pm-accent)]"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth((month) => addMonths(month, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--pm-subtle)] transition-colors hover:text-[var(--pm-accent)]"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="pb-2 text-center font-mono text-[10px] font-medium text-[var(--pm-subtle)]">
            {day}
          </div>
        ))}

        {calendarDays.map((day) => {
          const hasInterview = interviewDates.some((date) => isSameDay(date, day))
          const selected = selectedDate ? isSameDay(selectedDate, day) : false
          const current = isToday(day)
          const inMonth = isSameMonth(day, currentMonth)

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                "relative flex h-8 w-8 items-center justify-center justify-self-center rounded-[8px] text-sm font-medium transition-colors",
                inMonth ? "text-[var(--pm-text)]" : "text-[var(--pm-subtle)]/55",
                current && "bg-[var(--pm-text)] text-[var(--pm-bg)] dark:bg-white dark:text-black",
                selected && !current && "outline outline-[1.5px] outline-[var(--pm-text)]",
                selected && current && "ring-[1.5px] ring-[var(--pm-text)] ring-offset-2 ring-offset-[var(--pm-card)]"
              )}
              aria-pressed={selected}
            >
              <span>{format(day, "d")}</span>
              {hasInterview && (
                <span
                  className={cn(
                    "absolute bottom-1 h-1 w-1 rounded-full bg-[var(--pm-accent)]",
                    current && "bg-white"
                  )}
                  aria-hidden="true"
                />
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
