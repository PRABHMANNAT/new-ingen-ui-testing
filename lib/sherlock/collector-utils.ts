import { createHash } from "node:crypto"

export type CollectorFetchResult<T> =
  | { ok: true; data: T; retrievedAt: string; rawSnapshotRef: string; sourceUrl: string }
  | { ok: false; error: string; retrievedAt: string; sourceUrl: string; status?: number; rateLimited?: boolean }

const DEFAULT_TIMEOUT_MS = 4500
const WINDOW_MS = 60_000
const bucket = new Map<string, { count: number; resetAt: number }>()

export function checkCollectorRateLimit(key: string, limit = 12): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now()
  const current = bucket.get(key)
  if (!current || current.resetAt <= now) {
    bucket.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true }
  }
  if (current.count >= limit) {
    return { ok: false, retryAfterMs: current.resetAt - now }
  }
  current.count += 1
  return { ok: true }
}

export async function fetchJsonWithTimeout<T>(
  url: string,
  options: {
    timeoutMs?: number
    headers?: HeadersInit
    rateLimitKey?: string
    rateLimit?: number
  } = {},
): Promise<CollectorFetchResult<T>> {
  const retrievedAt = new Date().toISOString()
  const rateLimitKey = options.rateLimitKey ?? new URL(url).hostname
  const allowed = checkCollectorRateLimit(rateLimitKey, options.rateLimit ?? 12)
  if (!allowed.ok) {
    return {
      ok: false,
      error: `Rate limited. Retry after ${Math.ceil(allowed.retryAfterMs / 1000)}s.`,
      retrievedAt,
      sourceUrl: url,
      rateLimited: true,
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Sherlock-Evidence-Collector/1.0",
        ...options.headers,
      },
    })
    const text = await response.text()
    clearTimeout(timeout)

    if (!response.ok) {
      return {
        ok: false,
        error: `HTTP ${response.status}`,
        retrievedAt,
        sourceUrl: response.url || url,
        status: response.status,
        rateLimited: response.status === 429,
      }
    }

    const data = JSON.parse(text) as T
    return {
      ok: true,
      data,
      retrievedAt,
      sourceUrl: response.url || url,
      rawSnapshotRef: snapshotRef(text),
    }
  } catch (error) {
    clearTimeout(timeout)
    return {
      ok: false,
      error: error instanceof Error ? (error.name === "AbortError" ? "Request timeout" : error.message) : "Unknown fetch error",
      retrievedAt,
      sourceUrl: url,
    }
  }
}

export function snapshotRef(value: unknown) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value)
  return `sha256:${createHash("sha256").update(serialized).digest("hex")}`
}

export function normalizeUrl(value: string): string | null {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`)
    if (!["http:", "https:"].includes(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}

export function isLinkedInUrl(value: string) {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`)
    return url.hostname.toLowerCase().includes("linkedin.com")
  } catch {
    return value.toLowerCase().includes("linkedin.com")
  }
}
