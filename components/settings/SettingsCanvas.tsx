"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Bell, Bot, CalendarDays, CreditCard, Database, Github, Lock, Mail, Palette, Settings2, Shield, Slack, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useAppTheme } from "@/components/theme/ThemeProvider"

type SettingsTab =
  | "workspace"
  | "assistants"
  | "hiring"
  | "interviews"
  | "integrations"
  | "appearance"
  | "billing"
  | "privacy"

const tabs: { id: SettingsTab; label: string }[] = [
  { id: "workspace", label: "Workspace" },
  { id: "assistants", label: "Assistants" },
  { id: "hiring", label: "Hiring Defaults" },
  { id: "interviews", label: "Interview Flow" },
  { id: "integrations", label: "Integrations" },
  { id: "appearance", label: "Appearance" },
  { id: "billing", label: "Billing" },
  { id: "privacy", label: "Privacy" },
]

const inputClass =
  "rounded-full border border-[#DED4C7] bg-[#EEE8DF] px-4 py-2 text-[12px] font-black tracking-[-0.03em] text-[#2A2520] outline-none transition focus:border-[#FF6A00]/60 dark:border-white/10 dark:bg-white/5 dark:text-white"

export function SettingsCanvas() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("workspace")

  return (
    <section className="relative h-screen overflow-y-auto overflow-x-hidden bg-[#F7F2EA] px-8 py-8 text-[#2A2520] dark:bg-[#0A0A0A] dark:text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#DED4C733_1px,transparent_1px),linear-gradient(to_bottom,#DED4C733_1px,transparent_1px)] bg-[size:32px_32px] opacity-35 dark:opacity-10" />
      <div className="relative mx-auto max-w-[1180px] pb-24">
        <SettingsHeader />
        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[280px_1fr]">
          <SettingsNav activeTab={activeTab} setActiveTab={setActiveTab} />
          <SettingsPanels activeTab={activeTab} />
        </div>
      </div>
    </section>
  )
}

function SettingsHeader() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <p className="text-[12px] font-black uppercase tracking-[0.32em] text-[#8A8177] dark:text-white/40">Workspace Settings</p>
        <h1 className="mt-3 text-[56px] font-black leading-none tracking-[-0.09em] text-[#2A2520] dark:text-white">Settings</h1>
        <p className="mt-4 max-w-[680px] text-[14px] font-bold leading-6 tracking-[-0.03em] text-[#6F675F] dark:text-white/55">
          Configure your hiring workspace, AI assistants, interview defaults, integrations, and appearance.
        </p>
      </div>
      <button className="rounded-[22px] bg-[#2A2520] px-6 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-[#FFFDF8] shadow-[0_16px_34px_rgba(42,37,32,0.16)] transition hover:scale-[1.01] dark:bg-white dark:text-[#0A0A0A] dark:shadow-none">
        Save Changes
      </button>
    </div>
  )
}

function SettingsNav({
  activeTab,
  setActiveTab,
}: {
  activeTab: SettingsTab
  setActiveTab: (tab: SettingsTab) => void
}) {
  return (
    <aside className="h-fit rounded-[32px] border border-[#DED4C7] bg-[#FBF7EF]/88 p-3 shadow-[0_18px_50px_rgba(42,37,32,0.06)] dark:border-white/10 dark:bg-[#101010]/90 dark:shadow-none">
      {tabs.map((tab) => {
        const active = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "mb-1 flex w-full items-center justify-between rounded-[22px] px-4 py-3 text-left text-[12px] font-black uppercase tracking-[0.16em] transition last:mb-0",
              active
                ? "bg-[#2A2520] text-[#FFFDF8] dark:bg-white dark:text-[#0A0A0A]"
                : "text-[#7A7168] hover:bg-[#EEE8DF] dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white",
            ].join(" ")}
          >
            {tab.label}
            {active && <span className="h-2 w-2 rounded-full bg-[#FF6A00]" />}
          </button>
        )
      })}
    </aside>
  )
}

function SettingsPanels({ activeTab }: { activeTab: SettingsTab }) {
  return (
    <motion.div
      key={activeTab}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="min-w-0"
    >
      {activeTab === "workspace" && <WorkspaceSettings />}
      {activeTab === "assistants" && <AssistantsSettings />}
      {activeTab === "hiring" && <HiringDefaultsSettings />}
      {activeTab === "interviews" && <InterviewFlowSettings />}
      {activeTab === "integrations" && <IntegrationsSettings />}
      {activeTab === "appearance" && <AppearanceSettings />}
      {activeTab === "billing" && <BillingSettings />}
      {activeTab === "privacy" && <PrivacySettings />}
    </motion.div>
  )
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[34px] border border-[#DED4C7] bg-[#FBF7EF]/90 p-7 shadow-[0_18px_50px_rgba(42,37,32,0.06)] dark:border-white/10 dark:bg-[#101010]/90 dark:shadow-none">
      <div className="mb-7">
        <p className="text-[12px] font-black uppercase tracking-[0.3em] text-[#8A8177] dark:text-white/40">{title}</p>
        <p className="mt-3 max-w-[720px] text-[14px] font-bold leading-6 tracking-[-0.03em] text-[#6F675F] dark:text-white/55">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-5 rounded-[24px] border border-[#DED4C7] bg-[#FFFDF8] px-5 py-4 dark:border-white/10 dark:bg-[#141414]">
      <div className="min-w-0">
        <p className="text-[15px] font-black tracking-[-0.04em] text-[#2A2520] dark:text-white">{label}</p>
        {description && (
          <p className="mt-1 max-w-[520px] text-[12px] font-bold leading-5 tracking-[-0.03em] text-[#8A8177] dark:text-white/45">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ enabled, setEnabled }: { enabled: boolean; setEnabled: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => setEnabled(!enabled)}
      className={["relative h-8 w-14 rounded-full transition", enabled ? "bg-[#18A86B]" : "bg-[#DED4C7] dark:bg-white/15"].join(" ")}
      aria-pressed={enabled}
    >
      <span className={["absolute top-1 h-6 w-6 rounded-full bg-white shadow transition", enabled ? "left-7" : "left-1"].join(" ")} />
    </button>
  )
}

function SelectPill({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  )
}

function TextInput({ defaultValue, className = "" }: { defaultValue: string; className?: string }) {
  return <input className={`${inputClass} ${className}`} defaultValue={defaultValue} />
}

function WorkspaceSettings() {
  const [stage, setStage] = useState("Pre-seed")
  const [currency, setCurrency] = useState("AUD")
  const [timezone, setTimezone] = useState("Australia/Sydney")

  return (
    <SettingsSection title="Workspace" description="Basic settings for your hiring workspace and startup context.">
      <SettingRow label="Workspace name" description="Shown across dashboards and generated hiring briefs.">
        <TextInput defaultValue="Forge" />
      </SettingRow>
      <SettingRow label="Company stage" description="Used by Aristotle to tune job briefs and candidate ranking.">
        <SelectPill value={stage} options={["Idea", "Pre-seed", "Seed", "Series A"]} onChange={setStage} />
      </SettingRow>
      <SettingRow label="Current team size">
        <TextInput className="w-[120px]" defaultValue="6" />
      </SettingRow>
      <SettingRow label="Hiring budget">
        <TextInput className="w-[180px]" defaultValue="$24,000" />
      </SettingRow>
      <SettingRow label="Default currency">
        <SelectPill value={currency} options={["AUD", "USD", "GBP", "EUR"]} onChange={setCurrency} />
      </SettingRow>
      <SettingRow label="Default timezone">
        <SelectPill value={timezone} options={["Australia/Sydney", "America/Los_Angeles", "Europe/London", "Asia/Singapore"]} onChange={setTimezone} />
      </SettingRow>
    </SettingsSection>
  )
}

function AssistantsSettings() {
  return (
    <SettingsSection title="Assistants" description="Configure Aristotle and Sherlock. No other assistant identities should appear in the product.">
      <AssistantCard
        name="Aristotle"
        description="Job briefs, candidate discovery, interview workflow, and hiring dashboard intelligence."
        badge="Workflow AI"
        controls={<AristotleControls />}
      />
      <AssistantCard
        name="Sherlock"
        description="Candidate proof analysis, profile investigation, GitHub evidence, and risk reasoning."
        badge="Proof AI"
        controls={<SherlockControls />}
      />
    </SettingsSection>
  )
}

function AssistantCard({
  name,
  description,
  badge,
  controls,
}: {
  name: "Aristotle" | "Sherlock"
  description: string
  badge: string
  controls: React.ReactNode
}) {
  return (
    <div className="rounded-[28px] border border-[#DED4C7] bg-[#FFFDF8] p-5 dark:border-white/10 dark:bg-[#141414]">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex min-w-0 items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#FFE1C7] text-[#FF6A00] dark:bg-orange-500/10">
            <Bot size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-[24px] font-black tracking-[-0.07em] text-[#2A2520] dark:text-white">{name}</h3>
              <span className="rounded-full bg-[#EEE8DF] px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#6F675F] dark:bg-white/5 dark:text-white/50">
                {badge}
              </span>
            </div>
            <p className="mt-2 max-w-[560px] text-[13px] font-bold leading-6 tracking-[-0.03em] text-[#6F675F] dark:text-white/55">{description}</p>
          </div>
        </div>
        {controls}
      </div>
    </div>
  )
}

function AristotleControls() {
  const [enabled, setEnabled] = useState(true)
  const [briefs, setBriefs] = useState(true)
  const [tone, setTone] = useState("Concise")

  return (
    <div className="grid min-w-[220px] gap-3">
      <InlineControl label="Enabled"><Toggle enabled={enabled} setEnabled={setEnabled} /></InlineControl>
      <InlineControl label="Tone"><SelectPill value={tone} options={["Concise", "Detailed", "Aggressive"]} onChange={setTone} /></InlineControl>
      <InlineControl label="Auto-briefs"><Toggle enabled={briefs} setEnabled={setBriefs} /></InlineControl>
    </div>
  )
}

function SherlockControls() {
  const [enabled, setEnabled] = useState(true)
  const [github, setGithub] = useState(true)
  const [strictness, setStrictness] = useState("Balanced")

  return (
    <div className="grid min-w-[220px] gap-3">
      <InlineControl label="Enabled"><Toggle enabled={enabled} setEnabled={setEnabled} /></InlineControl>
      <InlineControl label="Strictness"><SelectPill value={strictness} options={["Balanced", "Strict", "Very strict"]} onChange={setStrictness} /></InlineControl>
      <InlineControl label="GitHub pull"><Toggle enabled={github} setEnabled={setGithub} /></InlineControl>
    </div>
  )
}

function InlineControl({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8177] dark:text-white/40">{label}</p>
      {children}
    </div>
  )
}

function HiringDefaultsSettings() {
  const [priority, setPriority] = useState("High")
  const [workStyle, setWorkStyle] = useState("Hybrid")
  const [batch, setBatch] = useState("5")
  const [proofRequired, setProofRequired] = useState(true)
  const [autoSelect, setAutoSelect] = useState(false)

  return (
    <SettingsSection title="Hiring Defaults" description="Default thresholds and sourcing preferences used when ranking candidates.">
      <SettingRow label="Default hiring priority"><SelectPill value={priority} options={["Critical", "High", "Medium", "Watch"]} onChange={setPriority} /></SettingRow>
      <SettingRow label="Minimum fit score"><TextInput className="w-[110px]" defaultValue="85" /></SettingRow>
      <SettingRow label="Minimum proof score"><TextInput className="w-[110px]" defaultValue="80" /></SettingRow>
      <SettingRow label="Salary range"><TextInput className="w-[190px]" defaultValue="$120k - $145k" /></SettingRow>
      <SettingRow label="Work style"><SelectPill value={workStyle} options={["Remote", "Hybrid", "On-site"]} onChange={setWorkStyle} /></SettingRow>
      <SettingRow label="Select candidates in batches"><SelectPill value={batch} options={["3", "5", "8", "10"]} onChange={setBatch} /></SettingRow>
      <SettingRow label="Require proof before interview"><Toggle enabled={proofRequired} setEnabled={setProofRequired} /></SettingRow>
      <SettingRow label="Auto-select high-fit candidates"><Toggle enabled={autoSelect} setEnabled={setAutoSelect} /></SettingRow>
    </SettingsSection>
  )
}

function InterviewFlowSettings() {
  const [duration, setDuration] = useState("30 min")
  const [calendar, setCalendar] = useState("Google Calendar")
  const [autoPacket, setAutoPacket] = useState(true)
  const [redFlags, setRedFlags] = useState(true)
  const [scorecard, setScorecard] = useState(true)
  const stages = ["Technical Screen", "Deep Dive", "Culture Fit", "Final Round"]

  return (
    <SettingsSection title="Interview Flow" description="Control interview packet generation, stage defaults, and scheduling preferences.">
      <SettingRow label="Default interview duration"><SelectPill value={duration} options={["15 min", "30 min", "60 min"]} onChange={setDuration} /></SettingRow>
      <SettingRow label="Default interview stages" description="Used when building interview packets.">
        <div className="flex flex-wrap justify-end gap-2">
          {stages.map((stage) => <Chip key={stage}>{stage}</Chip>)}
        </div>
      </SettingRow>
      <SettingRow label="Generate interview packet automatically after selection"><Toggle enabled={autoPacket} setEnabled={setAutoPacket} /></SettingRow>
      <SettingRow label="Include red flags section"><Toggle enabled={redFlags} setEnabled={setRedFlags} /></SettingRow>
      <SettingRow label="Include scorecard"><Toggle enabled={scorecard} setEnabled={setScorecard} /></SettingRow>
      <SettingRow label="Calendar provider"><SelectPill value={calendar} options={["Google Calendar", "Manual"]} onChange={setCalendar} /></SettingRow>
    </SettingsSection>
  )
}

function IntegrationsSettings() {
  const integrations = [
    { name: "GitHub", status: "Connected" as const, icon: Github },
    { name: "LinkedIn", status: "Not connected" as const, icon: Users },
    { name: "Google Calendar", status: "Connected" as const, icon: CalendarDays },
    { name: "Gmail", status: "Connected" as const, icon: Mail },
    { name: "Notion", status: "Not connected" as const, icon: Database },
    { name: "Slack", status: "Not connected" as const, icon: Slack },
  ]

  return (
    <SettingsSection title="Integrations" description="Connect demo hiring sources and workflow destinations.">
      {integrations.map((integration) => (
        <IntegrationRow key={integration.name} {...integration} />
      ))}
    </SettingsSection>
  )
}

function IntegrationRow({ name, status, icon: Icon }: { name: string; status: "Connected" | "Not connected"; icon: LucideIcon }) {
  const connected = status === "Connected"
  return (
    <div className="flex items-center justify-between gap-5 rounded-[24px] border border-[#DED4C7] bg-[#FFFDF8] px-5 py-4 dark:border-white/10 dark:bg-[#141414]">
      <div className="flex min-w-0 items-center gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#EEE8DF] text-[#2A2520] dark:bg-white/5 dark:text-white/70">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-black text-[#2A2520] dark:text-white">{name}</p>
          <p className={connected ? "text-[12px] font-black text-[#18A86B]" : "text-[12px] font-black text-[#8A8177] dark:text-white/40"}>{status}</p>
        </div>
      </div>
      <button className="rounded-full bg-[#2A2520] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white dark:bg-white dark:text-[#0A0A0A]">
        {connected ? "Manage" : "Connect"}
      </button>
    </div>
  )
}

function AppearanceSettings() {
  const { theme, setTheme } = useAppTheme()
  const [accent, setAccent] = useState("Orange")
  const [density, setDensity] = useState("Comfortable")
  const [animation, setAnimation] = useState("Full")
  const [grid, setGrid] = useState(true)

  return (
    <SettingsSection title="Appearance" description="Tune the workspace look and motion preferences for demos.">
      <SettingRow label="Theme"><SelectPill value={theme === "dark" ? "Dark" : "Light"} options={["Light", "Dark"]} onChange={(value) => setTheme(value === "Dark" ? "dark" : "light")} /></SettingRow>
      <SettingRow label="Accent color"><SelectPill value={accent} options={["Orange", "Green", "Blue", "Purple"]} onChange={setAccent} /></SettingRow>
      <SettingRow label="Density"><SelectPill value={density} options={["Comfortable", "Compact"]} onChange={setDensity} /></SettingRow>
      <SettingRow label="Animation"><SelectPill value={animation} options={["Full", "Reduced"]} onChange={setAnimation} /></SettingRow>
      <SettingRow label="Use grid background"><Toggle enabled={grid} setEnabled={setGrid} /></SettingRow>
    </SettingsSection>
  )
}

function BillingSettings() {
  return (
    <SettingsSection title="Billing" description="Demo usage and plan metadata. No payment integration is connected.">
      <div className="grid gap-4 md:grid-cols-3">
        <UsageCard icon={CreditCard} label="Current plan" value="Startup Demo" />
        <UsageCard icon={Users} label="Seats" value="6" />
        <UsageCard icon={Bell} label="Monthly budget" value="$24,000" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <UsageCard icon={Database} label="Candidate profiles" value="60" />
        <UsageCard icon={CalendarDays} label="Interview packets" value="11" />
        <UsageCard icon={Settings2} label="Job briefs" value="4" />
      </div>
    </SettingsSection>
  )
}

function PrivacySettings() {
  const [localUploads, setLocalUploads] = useState(true)
  const [deleteUploads, setDeleteUploads] = useState(true)
  const [hideSalary, setHideSalary] = useState(false)
  const [consent, setConsent] = useState(true)

  return (
    <SettingsSection title="Privacy" description="Demo-safe privacy controls for candidate evidence and outreach.">
      <SettingRow label="Store uploaded resumes locally"><Toggle enabled={localUploads} setEnabled={setLocalUploads} /></SettingRow>
      <SettingRow label="Auto-delete uploads after 30 days"><Toggle enabled={deleteUploads} setEnabled={setDeleteUploads} /></SettingRow>
      <SettingRow label="Hide candidate salary expectations"><Toggle enabled={hideSalary} setEnabled={setHideSalary} /></SettingRow>
      <SettingRow label="Require consent before outreach"><Toggle enabled={consent} setEnabled={setConsent} /></SettingRow>
      <div className="grid gap-3 sm:grid-cols-2">
        <DangerAwareButton icon={Shield}>Export workspace data</DangerAwareButton>
        <DangerAwareButton icon={Lock} danger>Clear demo data</DangerAwareButton>
      </div>
    </SettingsSection>
  )
}

function UsageCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[#DED4C7] bg-[#FFFDF8] p-5 dark:border-white/10 dark:bg-[#141414]">
      <div className="mb-5 grid h-10 w-10 place-items-center rounded-2xl bg-[#FFE1C7] text-[#FF6A00] dark:bg-orange-500/10">
        <Icon size={18} />
      </div>
      <p className="text-[24px] font-black tracking-[-0.07em] text-[#2A2520] dark:text-white">{value}</p>
      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8177] dark:text-white/40">{label}</p>
    </div>
  )
}

function DangerAwareButton({ icon: Icon, danger = false, children }: { icon: LucideIcon; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      className={[
        "flex items-center justify-center gap-3 rounded-[22px] border px-5 py-4 text-[11px] font-black uppercase tracking-[0.22em] transition hover:scale-[1.01]",
        danger
          ? "border-[#FFC7C3] bg-[#FFE5E3]/70 text-[#E24740] dark:border-red-500/20 dark:bg-red-500/10"
          : "border-[#DED4C7] bg-[#EEE8DF] text-[#2A2520] dark:border-white/10 dark:bg-white/5 dark:text-white/70",
      ].join(" ")}
    >
      <Icon size={15} />
      {children}
    </button>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[#EEE8DF] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#6F675F] dark:bg-white/5 dark:text-white/55">
      {children}
    </span>
  )
}
