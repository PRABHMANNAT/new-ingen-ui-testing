"use client"

import React, { useMemo, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Copy,
  Download,
  Grid3X3,
  Info,
  Maximize2,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ArtifactBlock, ArtifactEnvelope } from "@/lib/llm/schema"

export type ArtifactVersion = {
  id: string
  title: string
  createdAt: string
  envelope: ArtifactEnvelope
}

type InfographicArtifactProps = {
  envelope?: ArtifactEnvelope | null
  versions?: ArtifactVersion[]
  activeVersionId?: string | null
  onVersionSelect?: (id: string) => void
  onDrill?: (blockId: string) => void
  className?: string
  children?: React.ReactNode
}

const CHART_COLORS = ["#df5f12", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444"]
const ARISTOTLE = "Aristotle"

async function copyText(text: string) {
  await navigator.clipboard?.writeText(text)
}

async function elementToPngBlob(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const clone = element.cloneNode(true) as HTMLElement
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml")
  clone.style.width = `${Math.max(rect.width, 320)}px`
  clone.style.minHeight = `${Math.max(rect.height, 180)}px`
  clone.style.background = "#fffaf2"

  const serialized = new XMLSerializer().serializeToString(clone)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}"><foreignObject width="100%" height="100%">${serialized}</foreignObject></svg>`
  const img = new Image()
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }))

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = url
    })

    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.ceil(rect.width * window.devicePixelRatio))
    canvas.height = Math.max(1, Math.ceil(rect.height * window.devicePixelRatio))
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas unavailable")
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    ctx.drawImage(img, 0, 0)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG export failed")), "image/png")
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function downloadElementPng(element: HTMLElement | null, filename: string) {
  if (!element) return
  try {
    const blob = await elementToPngBlob(element)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    await copyText(element.innerText)
  }
}

async function copyElementPng(element: HTMLElement | null) {
  if (!element) return
  try {
    const blob = await elementToPngBlob(element)
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
  } catch {
    await copyText(element.innerText)
  }
}

function valueNumber(value: string | number) {
  if (typeof value === "number") return value
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""))
  return Number.isFinite(numeric) ? numeric : 0
}

function EmptyArtifact() {
  return (
    <div className="flex h-full min-h-[560px] flex-col items-center justify-center gap-5 text-center">
      <div className="text-[10px] uppercase tracking-[0.35em] text-[var(--pm-subtle)]">Awaiting prompt</div>
      <motion.div
        className="flex min-w-[18ch] justify-center gap-[0.12em] text-4xl font-light tracking-[0.32em] text-[var(--pm-text-soft)] lg:text-5xl"
        aria-label={ARISTOTLE}
      >
        {ARISTOTLE.split("").map((letter, i) => (
          <motion.span
            key={`${letter}-${i}`}
            initial={{ opacity: 0, y: 12, filter: "blur(7px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {letter}
          </motion.span>
        ))}
      </motion.div>
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="h-px w-40 origin-left bg-[var(--pm-accent)]/70 shadow-[0_0_20px_var(--pm-accent-glow)]"
      />
      <p className="max-w-sm text-sm leading-6 text-[var(--pm-muted)]">
        Ask a Dashboard question and Aristotle will build an interactive infographic artifact here.
      </p>
    </div>
  )
}

function BlockShell({ block, children, onDrill }: { block: ArtifactBlock; children: React.ReactNode; onDrill?: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const id = block.id || block.kind

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-[1.75rem] border border-[var(--pm-border)] bg-[var(--pm-card)] p-5 shadow-[0_18px_60px_rgba(36,31,24,0.08)] backdrop-blur-xl transition-colors dark:shadow-none"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--pm-accent)]/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="absolute right-4 top-4 z-20 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={() => copyElementPng(ref.current)} className="rounded-full bg-[var(--pm-chip)] p-1.5 text-[var(--pm-muted)] hover:text-[var(--pm-text)]" aria-label="Copy block as PNG">
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => downloadElementPng(ref.current, `${id}.png`)} className="rounded-full bg-[var(--pm-chip)] p-1.5 text-[var(--pm-muted)] hover:text-[var(--pm-text)]" aria-label="Download block PNG">
          <Download className="h-3.5 w-3.5" />
        </button>
        {onDrill && (
          <button onClick={() => onDrill(id)} className="rounded-full bg-[var(--pm-accent)]/10 p-1.5 text-[var(--pm-accent)] hover:bg-[var(--pm-accent)]/20" aria-label="Drill into block">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {children}
    </motion.div>
  )
}

function KpiBlock({ block }: { block: Extract<ArtifactBlock, { kind: "kpi" }> }) {
  return (
    <div className="min-h-[150px]">
      <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--pm-subtle)]">{block.label}</div>
      <div className="mt-6 flex items-end gap-3">
        <div className="text-5xl font-light tracking-tight text-[var(--pm-text)]">{block.value}</div>
        {block.delta && <div className="mb-2 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">{block.delta}</div>}
      </div>
      {block.caption && <p className="mt-4 text-sm leading-6 text-[var(--pm-muted)]">{block.caption}</p>}
    </div>
  )
}

function BarChartBlock({ block }: { block: Extract<ArtifactBlock, { kind: "bar-chart" }> }) {
  const data = block.data.map((d) => ({ ...d, value: valueNumber(d.value) }))
  return (
    <div className="h-[260px]">
      <h3 className="mb-5 text-sm font-medium text-[var(--pm-text)]">{block.title}</h3>
      <ResponsiveContainer width="100%" height="82%">
        <BarChart data={data}>
          <XAxis dataKey="label" tick={{ fill: "var(--pm-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip contentStyle={{ background: "var(--pm-tooltip-bg)", border: "1px solid var(--pm-border)", borderRadius: 14, color: "var(--pm-text)" }} />
          <Bar dataKey="value" radius={[10, 10, 2, 2]}>
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function DonutBlock({ block }: { block: Extract<ArtifactBlock, { kind: "donut" }> }) {
  const data = block.data.map((d) => ({ ...d, value: valueNumber(d.value) }))
  return (
    <div className="h-[280px]">
      <h3 className="mb-3 text-sm font-medium text-[var(--pm-text)]">{block.title}</h3>
      <div className="grid h-[220px] grid-cols-[1fr_140px] items-center gap-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={54} outerRadius={86} paddingAngle={4} dataKey="value">
              {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "var(--pm-tooltip-bg)", border: "1px solid var(--pm-border)", borderRadius: 14, color: "var(--pm-text)" }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2">
          {data.map((item, i) => (
            <div key={item.label} className="flex items-center gap-2 text-xs text-[var(--pm-muted)]">
              <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LineBlock({ block }: { block: Extract<ArtifactBlock, { kind: "line-chart" }> }) {
  const data = block.data.map((d) => ({ ...d, value: valueNumber(d.value) }))
  return (
    <div className="h-[260px]">
      <h3 className="mb-5 text-sm font-medium text-[var(--pm-text)]">{block.title}</h3>
      <ResponsiveContainer width="100%" height="82%">
        <LineChart data={data}>
          <XAxis dataKey="label" tick={{ fill: "var(--pm-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip contentStyle={{ background: "var(--pm-tooltip-bg)", border: "1px solid var(--pm-border)", borderRadius: 14, color: "var(--pm-text)" }} />
          <Line type="monotone" dataKey="value" stroke="#df5f12" strokeWidth={3} dot={{ r: 4, fill: "#df5f12" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function TimelineBlock({ block }: { block: Extract<ArtifactBlock, { kind: "timeline" }> }) {
  return (
    <div>
      {block.title && <h3 className="mb-5 text-sm font-medium text-[var(--pm-text)]">{block.title}</h3>}
      <div className="space-y-4">
        {block.data.map((item, i) => (
          <button key={`${item.label}-${i}`} className="grid w-full grid-cols-[72px_1fr] gap-4 text-left">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--pm-subtle)]">{item.label}</div>
            <div className="relative border-l border-[var(--pm-border)] pl-5 text-sm leading-6 text-[var(--pm-muted)] before:absolute before:-left-1.5 before:top-1 before:h-3 before:w-3 before:rounded-full before:bg-[var(--pm-accent)]">
              {item.value}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function FlowBlock({ block }: { block: Extract<ArtifactBlock, { kind: "flow" }> }) {
  const layout = useMemo(() => block.nodes.map((node, i) => ({ ...node, x: 70 + (i % 3) * 180, y: 55 + Math.floor(i / 3) * 110 })), [block.nodes])
  const find = (id: string) => layout.find((node) => node.id === id)
  return (
    <div>
      {block.title && <h3 className="mb-4 text-sm font-medium text-[var(--pm-text)]">{block.title}</h3>}
      <svg viewBox="0 0 560 280" className="h-[280px] w-full rounded-2xl bg-[var(--pm-chip)]">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#df5f12" /></marker>
        </defs>
        {block.edges.map((edge, i) => {
          const source = find(edge.source)
          const target = find(edge.target)
          if (!source || !target) return null
          return <path key={i} d={`M${source.x + 58},${source.y + 24} C${source.x + 110},${source.y + 24} ${target.x - 50},${target.y + 24} ${target.x},${target.y + 24}`} fill="none" stroke="#df5f12" strokeWidth="2" markerEnd="url(#arrow)" opacity="0.8" />
        })}
        {layout.map((node) => (
          <g key={node.id} className="cursor-pointer">
            <rect x={node.x} y={node.y} width="120" height="48" rx="14" fill="#fffaf2" stroke="#ded2c2" />
            <text x={node.x + 60} y={node.y + 29} textAnchor="middle" fontSize="11" fill="#241f18" fontFamily="monospace">{node.label}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function CalloutBlock({ block }: { block: Extract<ArtifactBlock, { kind: "callout" }> }) {
  const icon = block.tone === "warning" ? Info : Sparkles
  const Icon = icon
  return (
    <div className="flex min-h-[160px] gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--pm-accent)]/10 text-[var(--pm-accent)]"><Icon className="h-5 w-5" /></div>
      <p className="text-lg font-light leading-8 text-[var(--pm-text-soft)]">{block.text}</p>
    </div>
  )
}

function TableBlock({ block }: { block: Extract<ArtifactBlock, { kind: "table" }> }) {
  return (
    <div>
      {block.title && <h3 className="mb-4 text-sm font-medium text-[var(--pm-text)]">{block.title}</h3>}
      <div className="overflow-hidden rounded-2xl border border-[var(--pm-border)]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--pm-chip)] font-mono uppercase tracking-[0.16em] text-[var(--pm-subtle)]">
            <tr>{block.columns.map((col) => <th key={col} className="px-4 py-3 font-medium">{col}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[var(--pm-border)] text-[var(--pm-muted)]">
            {block.rows.map((row, i) => <tr key={i}>{block.columns.map((_, j) => <td key={j} className="px-4 py-3">{row[j] ?? "-"}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function IconGridBlock({ block }: { block: Extract<ArtifactBlock, { kind: "icon-grid" }> }) {
  return (
    <div>
      {block.title && <h3 className="mb-4 text-sm font-medium text-[var(--pm-text)]">{block.title}</h3>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {block.items.map((item, i) => (
          <button key={`${item.label}-${i}`} className="rounded-2xl border border-[var(--pm-border)] bg-[var(--pm-chip)] p-4 text-left transition hover:border-[var(--pm-accent)]/50">
            <Grid3X3 className="mb-3 h-4 w-4 text-[var(--pm-accent)]" />
            <div className="text-xs font-medium text-[var(--pm-text)]">{item.label}</div>
            {item.value && <div className="mt-1 text-[11px] text-[var(--pm-muted)]">{item.value}</div>}
          </button>
        ))}
      </div>
    </div>
  )
}

function RenderBlock({ block, onDrill }: { block: ArtifactBlock; onDrill?: (id: string) => void }) {
  return (
    <BlockShell block={block} onDrill={onDrill}>
      {block.kind === "kpi" && <KpiBlock block={block} />}
      {block.kind === "bar-chart" && <BarChartBlock block={block} />}
      {block.kind === "donut" && <DonutBlock block={block} />}
      {block.kind === "line-chart" && <LineBlock block={block} />}
      {block.kind === "timeline" && <TimelineBlock block={block} />}
      {block.kind === "flow" && <FlowBlock block={block} />}
      {block.kind === "callout" && <CalloutBlock block={block} />}
      {block.kind === "table" && <TableBlock block={block} />}
      {block.kind === "icon-grid" && <IconGridBlock block={block} />}
    </BlockShell>
  )
}

export function InfographicArtifact({ envelope, onDrill, className, children }: InfographicArtifactProps) {
  if (!envelope) {
    return (
      <div className={cn("h-full", className)}>
        <div className="h-full overflow-y-auto p-5 lg:p-7">
          <div className="mb-5 min-h-[360px]">
            <EmptyArtifact />
          </div>
          {children && (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
              {children}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex-1 overflow-y-auto p-5 lg:p-7">
        <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }} className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
          <AnimatePresence>
            {envelope.artifact.blocks.map((block, index) => (
              <RenderBlock key={`${block.id || block.kind}-${index}`} block={block} onDrill={onDrill} />
            ))}
            {children}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
