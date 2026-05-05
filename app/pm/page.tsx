"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { MiniCalendar } from "@/components/dashboard/MiniCalendar"
import { UpcomingInterviews } from "@/components/dashboard/UpcomingInterviews"
import { BrandOrbLoader } from "@/components/BrandOrbLoader"
import { ThemedCanvas } from "@/components/layout/ThemedCanvas"
import { useAppTheme } from "@/components/theme/ThemeProvider"

function useDashboardTheme() {
  const { theme } = useAppTheme()
  const isDark = theme === "dark"

  return {
    isDark,
    pageBg: isDark ? "bg-[#050505] text-white" : "bg-[#F7F2EA] text-[#2A2520]",
    grid: isDark
      ? "bg-[linear-gradient(to_right,#1A1A1A_1px,transparent_1px),linear-gradient(to_bottom,#1A1A1A_1px,transparent_1px)] opacity-55"
      : "bg-[linear-gradient(to_right,#DED4C733_1px,transparent_1px),linear-gradient(to_bottom,#DED4C733_1px,transparent_1px)] opacity-35",
    card: isDark
      ? "border-[#242424] bg-[#101010] shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
      : "border-[#DED4C7] bg-[#FBF7EF] shadow-[0_18px_50px_rgba(42,37,32,0.06)]",
    row: isDark ? "bg-[#1C1C1C]" : "bg-[#FFFDF8]",
    mutedBox: isDark ? "bg-[#1C1C1C]" : "bg-[#EEE8DF]/70",
    text: isDark ? "text-white" : "text-[#2A2520]",
    muted: isDark ? "text-[#A0A0A0]" : "text-[#7A7168]",
    faint: isDark ? "text-[#777]" : "text-[#8A8177]",
    border: isDark ? "border-[#242424]" : "border-[#DED4C7]",
    vars: isDark
      ? {
          "--pm-bg": "#050505",
          "--pm-card": "#101010",
          "--pm-row": "#1C1C1C",
          "--pm-text": "#ffffff",
          "--pm-muted": "#A0A0A0",
          "--pm-subtle": "#777777",
          "--pm-border": "#242424",
          "--pm-chip": "#1C1C1C",
          "--pm-accent": "#FF6A00",
        }
      : {
          "--pm-bg": "#F7F2EA",
          "--pm-card": "#FBF7EF",
          "--pm-row": "#FFFDF8",
          "--pm-text": "#2A2520",
          "--pm-muted": "#7A7168",
          "--pm-subtle": "#8A8177",
          "--pm-border": "#DED4C7",
          "--pm-chip": "#EEE8DF",
          "--pm-accent": "#FF6A00",
        },
  }
}

export default function DashboardPage() {
  return (
    <ThemedCanvas>
      <DashboardCanvas />
    </ThemedCanvas>
  )
}

function DashboardCanvas() {
  const [selectedInterviewDate, setSelectedInterviewDate] = useState<Date | null>(null)
  const t = useDashboardTheme()

  return (
    <div className="relative mx-auto max-w-[1360px] pb-12" style={t.vars as React.CSSProperties}>
      <DashboardHeader />
      <div className="mt-5 grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-5">
          <CalendarCard selectedDate={selectedInterviewDate} onSelectDate={setSelectedInterviewDate} />
        </div>
        <div className="col-span-12 xl:col-span-7">
          <UpcomingInterviewsCard selectedDate={selectedInterviewDate} />
        </div>
        <div className="col-span-12 md:col-span-4">
          <TeamCard />
        </div>
        <div className="col-span-12 md:col-span-4">
          <HiringBudgetCard />
        </div>
        <div className="col-span-12 md:col-span-4">
          <SpendBreakdownCard />
        </div>
        <div className="col-span-12 xl:col-span-5">
          <HiringActionsCard />
        </div>
        <div className="col-span-12 md:col-span-5 xl:col-span-3">
          <PipelineCard />
        </div>
        <div className="col-span-12 md:col-span-7 xl:col-span-4">
          <AristotleInsightCard />
        </div>
      </div>
    </div>
  )
}

function DashboardHeader() {
  const t = useDashboardTheme()

  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        <p className={`text-[11px] font-black uppercase tracking-[0.32em] ${t.faint}`}>Startup Hiring</p>
        <h1 className={`mt-1 text-[42px] font-black leading-none tracking-[-0.08em] ${t.text}`}>Dashboard</h1>
        <p className={`mt-2 text-[12px] font-bold tracking-[-0.03em] ${t.muted}`}>
          Interviews, budget, team capacity, and recruiting actions.
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${t.border} ${t.row} ${t.muted}`}>
          May 2026
        </button>
        <button className="rounded-full bg-[#FF6A00] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white">
          New Search
        </button>
      </div>
    </div>
  )
}

function CalendarCard({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: Date | null
  onSelectDate: (date: Date) => void
}) {
  const t = useDashboardTheme()

  return (
    <MiniCalendar
      selectedDate={selectedDate}
      onSelectDate={onSelectDate}
      className={`min-h-[300px] rounded-[26px] ${t.card}`}
    />
  )
}

function UpcomingInterviewsCard({ selectedDate }: { selectedDate: Date | null }) {
  const t = useDashboardTheme()

  return <UpcomingInterviews selectedDate={selectedDate} className={`min-h-[300px] rounded-[26px] ${t.card}`} />
}

function TeamCard() {
  const t = useDashboardTheme()
  const team = [
    { name: "Adi", role: "Founder", seed: "Adi" },
    { name: "Maya", role: "Product", seed: "Maya" },
    { name: "Karthik", role: "Engineering", seed: "Karthik" },
    { name: "Mannan", role: "Ops", seed: "Mannan" },
    { name: "Priya", role: "Design", seed: "Priya" },
    { name: "Alex", role: "Candidate", seed: "Alex" },
  ]

  return (
    <Card>
      <Label>Team</Label>
      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="flex items-center">
          {team.map((member) => (
            <div key={member.name} className="group relative -ml-3 first:ml-0" title={`${member.name} · ${member.role}`}>
              <img
                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(member.seed)}`}
                alt={member.name}
                className={`h-10 w-10 rounded-full border-[3px] object-cover shadow-[0_8px_22px_rgba(0,0,0,0.18)] transition group-hover:-translate-y-1 ${t.border} ${t.mutedBox}`}
              />
            </div>
          ))}
          <div className={`-ml-2 grid h-10 w-10 place-items-center rounded-full border-2 border-dashed text-lg font-light ${t.border} ${t.row} ${t.faint}`}>
            +
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-[40px] font-black leading-none tracking-[-0.08em] ${t.text}`}>6</p>
          <p className={`mt-1 text-[11px] font-black uppercase tracking-[0.24em] ${t.faint}`}>Members</p>
        </div>
      </div>
      <p className={`mt-5 text-[12px] font-bold leading-5 ${t.faint}`}>
        Current team capacity: 2 engineering, 1 product, 1 design, 2 ops/advisory.
      </p>
    </Card>
  )
}

function HiringBudgetCard() {
  const t = useDashboardTheme()
  const total = 24000
  const spent = 7600
  const remaining = total - spent
  const percentSpent = Math.round((spent / total) * 100)

  return (
    <Card>
      <Label>Hiring Budget</Label>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className={`text-[38px] font-black leading-none tracking-[-0.08em] ${t.text}`}>${remaining.toLocaleString()}</p>
          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.22em] text-[#18A86B]">Remaining</p>
        </div>
        <div className="text-right">
          <p className={`text-[15px] font-black tracking-[-0.05em] ${t.muted}`}>${spent.toLocaleString()} spent</p>
          <p className={`mt-1 text-[10px] font-bold ${t.faint}`}>of ${total.toLocaleString()} budget</p>
        </div>
      </div>
      <div className={`mt-4 h-2.5 overflow-hidden rounded-full ${t.mutedBox}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentSpent}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="h-full rounded-full bg-[#FF6A00]"
        />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <BudgetMini label="Avg screen" value="$280" tone="blue" />
        <BudgetMini label="Projected hire" value="$9.8k" tone="purple" />
        <BudgetMini label="Runway" value="6 wks" tone="green" />
      </div>
    </Card>
  )
}

function BudgetMini({ label, value, tone }: { label: string; value: string; tone: "blue" | "purple" | "green" }) {
  const t = useDashboardTheme()
  const cls = {
    blue: "text-[#4077EE]",
    purple: "text-[#8B5CF6]",
    green: "text-[#18A86B]",
  }[tone]

  return (
    <div className={`min-w-0 rounded-[16px] px-3 py-3 ${t.mutedBox}`}>
      <p className={`truncate text-[15px] font-black tracking-[-0.06em] ${cls}`}>{value}</p>
      <p className={`mt-1 truncate text-[8px] font-black uppercase tracking-[0.14em] ${t.faint}`}>{label}</p>
    </div>
  )
}

function SpendBreakdownCard() {
  const t = useDashboardTheme()
  const items = [
    { label: "Sourcing", value: 3200, color: "#FF6A00" },
    { label: "Screening", value: 1800, color: "#4077EE" },
    { label: "Interviews", value: 2100, color: "#18A86B" },
    { label: "Tools", value: 500, color: "#8B5CF6" },
  ]
  const max = Math.max(...items.map((i) => i.value))

  return (
    <Card>
      <Label>Spend Breakdown</Label>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between">
              <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${t.muted}`}>{item.label}</p>
              <p className={`text-[12px] font-black ${t.text}`}>${item.value.toLocaleString()}</p>
            </div>
            <div className={`h-2 overflow-hidden rounded-full ${t.mutedBox}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / max) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function HiringActionsCard() {
  const t = useDashboardTheme()
  const actions = [
    { label: "Review 3 selected candidates", meta: "Before today 5 PM", status: "Now" },
    { label: "Generate Alex interview pack", meta: "Technical screen ready", status: "Next" },
    { label: "Send Priya scheduling email", meta: "Waiting on recruiter", status: "Next" },
    { label: "Approve $2.4k sourcing spend", meta: "Budget checkpoint", status: "Then" },
  ]

  return (
    <Card>
      <Label>Hiring Actions</Label>
      <div className="mt-4 space-y-2">
        {actions.map((action) => (
          <div key={action.label} className="grid grid-cols-[46px_1fr] gap-3">
            <p className={`pt-2.5 text-[10px] font-black uppercase tracking-[0.22em] ${t.faint}`}>{action.status}</p>
            <div className={`rounded-[16px] px-3 py-2.5 ${t.mutedBox}`}>
              <p className={`text-[12px] font-black tracking-[-0.04em] ${t.text}`}>{action.label}</p>
              <p className={`mt-1 text-[10px] font-bold tracking-[-0.03em] ${t.faint}`}>{action.meta}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function PipelineCard() {
  const t = useDashboardTheme()
  const stages = [
    { label: "Shortlisted", value: 12 },
    { label: "Selected", value: 5 },
    { label: "Scheduled", value: 3 },
    { label: "Offer-ready", value: 1 },
  ]

  return (
    <Card>
      <Label>Pipeline</Label>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {stages.map((stage) => (
          <div key={stage.label} className={`rounded-[16px] p-4 ${t.mutedBox}`}>
            <p className={`text-[28px] font-black leading-none tracking-[-0.08em] ${t.text}`}>{stage.value}</p>
            <p className={`mt-2 text-[9px] font-black uppercase tracking-[0.18em] ${t.faint}`}>{stage.label}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function AristotleInsightCard() {
  const t = useDashboardTheme()

  return (
    <Card>
      <div className="flex items-start gap-5">
        <div className="shrink-0 scale-[0.55] origin-top-left">
          <BrandOrbLoader />
        </div>
        <div>
          <Label>Aristotle</Label>
          <p className={`mt-4 text-[15px] font-bold leading-6 tracking-[-0.04em] ${t.text}`}>
            Your fastest hiring win is to finish interview packets before adding more candidates.
          </p>
          <p className={`mt-3 text-[12px] font-bold leading-5 tracking-[-0.03em] ${t.faint}`}>
            Current pipeline has enough shortlisted talent for two screens. Spend time on decision quality, not more sourcing.
          </p>
        </div>
      </div>
    </Card>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  const t = useDashboardTheme()
  return <section className={`h-full rounded-[26px] border p-5 ${t.card}`}>{children}</section>
}

function Label({ children }: { children: React.ReactNode }) {
  const t = useDashboardTheme()
  return <p className={`text-[11px] font-black uppercase tracking-[0.28em] ${t.muted}`}>{children}</p>
}
