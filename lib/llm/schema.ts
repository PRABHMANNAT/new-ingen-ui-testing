import { z } from "zod"

const datumSchema = z.object({
  label: z.string().max(48),
  value: z.union([z.number(), z.string()]),
  delta: z.string().optional(),
  tone: z.string().optional(),
  color: z.string().optional(),
})

export const artifactBlockSchema = z.discriminatedUnion("kind", [
  z.object({ id: z.string().optional(), kind: z.literal("kpi"), label: z.string().max(24), value: z.union([z.string(), z.number()]), delta: z.string().optional(), caption: z.string().optional() }),
  z.object({ id: z.string().optional(), kind: z.literal("bar-chart"), title: z.string().max(48), data: z.array(datumSchema).min(1).max(12) }),
  z.object({ id: z.string().optional(), kind: z.literal("donut"), title: z.string().max(48), data: z.array(datumSchema).min(2).max(8) }),
  z.object({ id: z.string().optional(), kind: z.literal("line-chart"), title: z.string().max(48), data: z.array(datumSchema).min(2).max(16) }),
  z.object({ id: z.string().optional(), kind: z.literal("timeline"), title: z.string().max(48).optional(), data: z.array(z.object({ label: z.string().max(32), value: z.string().max(80), tone: z.string().optional() })).min(2).max(8) }),
  z.object({ id: z.string().optional(), kind: z.literal("flow"), title: z.string().max(48).optional(), nodes: z.array(z.object({ id: z.string(), label: z.string().max(28), tone: z.string().optional() })).min(2).max(8), edges: z.array(z.object({ source: z.string(), target: z.string(), label: z.string().max(24).optional() })).min(1).max(12) }),
  z.object({ id: z.string().optional(), kind: z.literal("callout"), tone: z.enum(["insight", "warning", "success", "neutral"]).default("insight"), text: z.string().max(240) }),
  z.object({ id: z.string().optional(), kind: z.literal("table"), title: z.string().max(48).optional(), columns: z.array(z.string().max(24)).min(2).max(6), rows: z.array(z.array(z.union([z.string(), z.number()]))).min(1).max(10) }),
  z.object({ id: z.string().optional(), kind: z.literal("icon-grid"), title: z.string().max(48).optional(), items: z.array(z.object({ label: z.string().max(24), value: z.string().max(48).optional(), tone: z.string().optional() })).min(2).max(12) }),
])

export const artifactEnvelopeSchema = z.object({
  narration: z.string().min(20).max(900),
  artifact: z.object({
    type: z.literal("infographic"),
    title: z.string().min(3).max(80),
    theme: z.enum(["light", "dark"]).default("light"),
    blocks: z.array(artifactBlockSchema).min(3).max(8),
  }),
})

export type ArtifactBlock = z.infer<typeof artifactBlockSchema>
export type ArtifactEnvelope = z.infer<typeof artifactEnvelopeSchema>

export const ARTIFACT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["narration", "artifact"],
  properties: {
    narration: { type: "string", minLength: 20, maxLength: 900 },
    artifact: {
      type: "object",
      additionalProperties: false,
      required: ["type", "title", "theme", "blocks"],
      properties: {
        type: { const: "infographic" },
        title: { type: "string", minLength: 3, maxLength: 80 },
        theme: { enum: ["light", "dark"] },
        blocks: {
          type: "array",
          minItems: 3,
          maxItems: 8,
          items: {
            type: "object",
            required: ["kind"],
            additionalProperties: true,
            properties: {
              id: { type: "string" },
              kind: { enum: ["kpi", "bar-chart", "donut", "line-chart", "timeline", "flow", "callout", "table", "icon-grid"] },
              label: { type: "string", maxLength: 24 },
              value: {},
              delta: { type: "string" },
              caption: { type: "string" },
              title: { type: "string", maxLength: 48 },
              tone: { type: "string" },
              text: { type: "string", maxLength: 240 },
              data: { type: "array" },
              nodes: { type: "array" },
              edges: { type: "array" },
              columns: { type: "array" },
              rows: { type: "array" },
              items: { type: "array" }
            }
          }
        }
      }
    }
  }
} as const

export function normalizeEnvelope(envelope: ArtifactEnvelope): ArtifactEnvelope {
  return {
    ...envelope,
    artifact: {
      ...envelope.artifact,
      blocks: envelope.artifact.blocks.map((block, index) => ({
        ...block,
        id: block.id || `${block.kind}-${index + 1}`,
      } as ArtifactBlock)),
    },
  }
}

export function extractJson(raw: string) {
  const trimmed = raw.trim()
  if (trimmed.startsWith("{")) return trimmed
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match?.[1]) return match[1].trim()
  const first = trimmed.indexOf("{")
  const last = trimmed.lastIndexOf("}")
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1)
  return trimmed
}

export function safeParseEnvelope(raw: string): ArtifactEnvelope | null {
  try {
    const parsed = JSON.parse(extractJson(raw))
    const result = artifactEnvelopeSchema.safeParse(parsed)
    return result.success ? normalizeEnvelope(result.data) : null
  } catch {
    return null
  }
}

export function createFallbackEnvelope(prompt: string): ArtifactEnvelope {
  const topic = prompt.trim().slice(0, 54) || "Dashboard request"
  return normalizeEnvelope({
    narration: `I mapped "${topic}" into an operational view. The artifact highlights the fastest decisions, likely constraints, and next actions so you can continue from any block.`,
    artifact: {
      type: "infographic",
      title: `Aristotle snapshot: ${topic}`,
      theme: "light",
      blocks: [
        { kind: "kpi", label: "Confidence", value: "82%", delta: "+8%", caption: "Initial synthesis" },
        { kind: "kpi", label: "Signals", value: 14, delta: "+4", caption: "Relevant inputs" },
        { kind: "bar-chart", title: "Decision weight", data: [{ label: "Role fit", value: 84 }, { label: "Market", value: 71 }, { label: "Risk", value: 42 }, { label: "Timing", value: 63 }] },
        { kind: "donut", title: "Signal mix", data: [{ label: "Talent", value: 35 }, { label: "Market", value: 25 }, { label: "Process", value: 22 }, { label: "Risk", value: 18 }] },
        { kind: "timeline", title: "Next moves", data: [{ label: "Now", value: "Clarify the target role and success bar" }, { label: "Next", value: "Compare candidate evidence against role DNA" }, { label: "Then", value: "Prepare outreach and interview proof points" }] },
        { kind: "callout", tone: "insight", text: "Use drill-down on the weakest block first; it usually exposes the fastest path to a better hiring decision." },
      ],
    },
  })
}
