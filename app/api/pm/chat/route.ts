import { NextRequest } from "next/server"
import { generate, type LLMMessage } from "@/lib/llm/providers"
import { buildRepairPrompt } from "@/lib/llm/systemPrompt"
import { createFallbackEnvelope, safeParseEnvelope, type ArtifactEnvelope } from "@/lib/llm/schema"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ChatRequest = { messages?: LLMMessage[]; prompt?: string }

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

async function produceEnvelope(messages: LLMMessage[], signal?: AbortSignal): Promise<{ envelope: ArtifactEnvelope; provider: string; fallback?: boolean }> {
  const latestUser = [...messages].reverse().find((m) => m.role === "user")?.content || "Dashboard request"

  try {
    const first = await generate(messages, { signal })
    let envelope = safeParseEnvelope(first.text)
    let provider = first.provider

    if (!envelope) {
      const repaired = await generate([...messages, { role: "assistant", content: first.text }, { role: "user", content: buildRepairPrompt(first.text) }], { signal })
      envelope = safeParseEnvelope(repaired.text)
      provider = repaired.provider
    }

    if (envelope) return { envelope, provider }
  } catch (error) {
    console.warn(`[pm-chat] all_providers_failed fallback=true message=${error instanceof Error ? error.message : "unknown"}`)
  }

  return { envelope: createFallbackEnvelope(latestUser), provider: "Local artifact", fallback: true }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as ChatRequest))
  const messages = Array.isArray(body.messages) && body.messages.length > 0 ? body.messages : [{ role: "user", content: body.prompt || "Create a hiring command-center snapshot" } as LLMMessage]

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(sse(event, data)))

      try {
        send("status", { state: "thinking" })
        const result = await produceEnvelope(messages, req.signal)
        send("provider", { name: result.provider, fallback: !!result.fallback })
        send("envelope", result.envelope)
        send("done", { ok: true })
      } catch (error) {
        send("error", { message: error instanceof Error ? error.message : "Unknown PM chat error" })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  })
}
