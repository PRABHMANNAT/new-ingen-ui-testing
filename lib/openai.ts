// OpenAI Helper for Structured JSON Extraction
// ============================================

// Reasoning-class models (GPT-5.x, o-series) only accept the default
// temperature (1) and need more headroom than chat models: reasoning tokens
// count against max_completion_tokens and first-token latency is higher.
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS) || 45000

function isReasoningModel(model: string): boolean {
  return /^(gpt-5|o1|o3|o4)/i.test(model)
}

export function hasOpenAIKey(): boolean {
  return !!process.env.OPENAI_API_KEY
}

export type OpenAIResult<T> = { ok: true; data: T } | { ok: false; error: string }

export async function callOpenAIJson<T>(
  systemPrompt: string,
  userPrompt: string,
  model = "gpt-4o-mini",
): Promise<OpenAIResult<T>> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { ok: false, error: "OPENAI_API_KEY not configured" }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS)

    const reasoning = isReasoningModel(model)

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        // Reasoning models reject a custom temperature; only send it when supported.
        ...(reasoning ? {} : { temperature: 0.1 }),
        // These are structured-extraction tasks, not open-ended reasoning. Low
        // effort keeps latency under the request timeout and stops hidden
        // reasoning tokens from exhausting the completion budget.
        ...(reasoning ? { reasoning_effort: process.env.OPENAI_REASONING_EFFORT || "low" } : {}),
        // Reasoning models spend part of this budget on hidden reasoning tokens.
        max_completion_tokens: reasoning ? 8000 : 2000,
      }),
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text()
      return { ok: false, error: `OpenAI API error: ${response.status} - ${errorText}` }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return { ok: false, error: "No content in OpenAI response" }
    }

    try {
      const parsed = JSON.parse(content) as T
      return { ok: true, data: parsed }
    } catch {
      return { ok: false, error: "Failed to parse OpenAI JSON response" }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return { ok: false, error: "OpenAI request timeout" }
      }
      return { ok: false, error: error.message }
    }
    return { ok: false, error: "Unknown OpenAI error" }
  }
}
