import "server-only"
import type { ProofKind, ProofStatus } from "@/lib/supabase/types"

// Proof verification engine. Deterministic checks (GitHub API, link reachability,
// Crossref DOI lookup) do the hard verification; GPT-vision reads certificate /
// award images. Each returns a status + confidence (0-1) + extracted metadata.

export type VerifyResult = {
  status: ProofStatus
  confidence: number
  extracted: Record<string, unknown>
}

export type VerifyContext = {
  profileName?: string
  itemTitle?: string
  itemBody?: string
}

const FETCH_TIMEOUT_MS = 9000
const BLOCKED_HOSTS = new Set(["localhost", "0.0.0.0", "127.0.0.1", "::1"])

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  return headers
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = FETCH_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

function normalizeUrl(input: string): string {
  const value = input.trim()
  if (/^10\.\d{4,9}\//i.test(value)) return `https://doi.org/${value}`
  if (/^(?:www\.)?github\.com\//i.test(value)) return `https://${value.replace(/^www\./i, "")}`
  if (/^doi\.org\//i.test(value)) return `https://${value}`
  if (/^[a-z0-9.-]+\.[a-z]{2,}(?:\/|$)/i.test(value)) return `https://${value}`
  return value
}

function isSafePublicUrl(input: string): boolean {
  try {
    const url = new URL(input)
    if (!["http:", "https:"].includes(url.protocol)) return false
    const host = url.hostname.toLowerCase()
    if (BLOCKED_HOSTS.has(host) || host.endsWith(".local")) return false
    if (/^(10|127|169\.254|192\.168)\./.test(host)) return false
    const private172 = host.match(/^172\.(\d+)\./)
    if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) return false
    return true
  } catch {
    return false
  }
}

function normalizeName(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((part) => part.length > 1)
}

function namesOverlap(left?: string, right?: string): boolean {
  if (!left || !right) return false
  const a = normalizeName(left)
  const b = new Set(normalizeName(right))
  if (!a.length || !b.size) return false
  const overlap = a.filter((part) => b.has(part)).length
  return overlap >= Math.min(2, a.length)
}

// --- GitHub -----------------------------------------------------------------
function parseGitHub(url: string): { owner?: string; repo?: string } {
  try {
    const u = new URL(url)
    if (!u.hostname.includes("github.com")) return {}
    const parts = u.pathname.split("/").filter(Boolean)
    return { owner: parts[0], repo: parts[1] }
  } catch {
    return {}
  }
}

async function verifyGitHub(url: string, context: VerifyContext): Promise<VerifyResult> {
  const { owner, repo } = parseGitHub(url)
  if (!owner) return { status: "unverified", confidence: 0, extracted: { reason: "Not a GitHub URL" } }

  try {
    if (repo) {
      const [res, ownerRes] = await Promise.all([
        fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}`, { headers: githubHeaders() }),
        fetchWithTimeout(`https://api.github.com/users/${owner}`, { headers: githubHeaders() }),
      ])
      if (res.ok) {
        const d = await res.json()
        const ownerData = ownerRes.ok ? await ownerRes.json() : {}
        const ownerName = typeof ownerData.name === "string" ? ownerData.name : ""
        const ownershipMatch = namesOverlap(context.profileName, ownerName)
        return {
          status: ownershipMatch ? "verified" : "partial",
          confidence: ownershipMatch ? 0.94 : 0.72,
          extracted: {
            type: "repository",
            full_name: d.full_name,
            description: d.description,
            language: d.language,
            stars: d.stargazers_count,
            forks: d.forks_count,
            pushed_at: d.pushed_at,
            html_url: d.html_url,
            owner_login: ownerData.login ?? owner,
            owner_name: ownerName,
            ownership_match: ownershipMatch,
            reason: ownershipMatch
              ? "Repository exists and the GitHub owner name matches the profile"
              : "Repository exists, but ownership could not be matched to the profile name",
          },
        }
      }
      if (res.status === 404) {
        // Repo not found — does the owner at least exist?
        const ures = await fetchWithTimeout(`https://api.github.com/users/${owner}`, { headers: githubHeaders() })
        if (ures.ok) return { status: "partial", confidence: 0.45, extracted: { reason: "Owner exists but repo not found", owner } }
      }
      return { status: "unverified", confidence: 0, extracted: { reason: `GitHub returned ${res.status}` } }
    }

    // Owner-only URL (profile)
    const res = await fetchWithTimeout(`https://api.github.com/users/${owner}`, { headers: githubHeaders() })
    if (res.ok) {
      const d = await res.json()
      return {
        status: "partial",
        confidence: 0.55,
        extracted: { type: "profile", login: d.login, name: d.name, public_repos: d.public_repos, followers: d.followers },
      }
    }
    return { status: "unverified", confidence: 0, extracted: { reason: `GitHub returned ${res.status}` } }
  } catch (e) {
    return { status: "unverified", confidence: 0, extracted: { reason: e instanceof Error ? e.message : "GitHub check failed" } }
  }
}

// --- DOI / research ---------------------------------------------------------
function extractDoi(url: string): string | null {
  const m = url.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i)
  return m ? m[0].replace(/[).]+$/, "") : null
}

async function verifyDoi(url: string, context: VerifyContext): Promise<VerifyResult> {
  const doi = extractDoi(url)
  if (doi) {
    try {
      const res = await fetchWithTimeout(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
        headers: { Accept: "application/json" },
      })
      if (res.ok) {
        const json = await res.json()
        const w = json.message ?? {}
        const authors = Array.isArray(w.author)
          ? w.author.map((a: { given?: string; family?: string }) => [a.given, a.family].filter(Boolean).join(" ")).filter(Boolean)
          : []
        const authorMatch = authors.some((author: string) => namesOverlap(context.profileName, author))
        return {
          status: authorMatch ? "verified" : "partial",
          confidence: authorMatch ? 0.96 : 0.7,
          extracted: {
            type: "publication",
            doi,
            title: Array.isArray(w.title) ? w.title[0] : w.title,
            authors,
            container: Array.isArray(w["container-title"]) ? w["container-title"][0] : w["container-title"],
            published: w.published?.["date-parts"]?.[0]?.join("-"),
            publisher: w.publisher,
            author_match: authorMatch,
            reason: authorMatch
              ? "DOI metadata resolved and an author matches the profile"
              : "DOI metadata resolved, but no author matched the profile name",
          },
        }
      }
    } catch {
      /* fall through to reachability */
    }
  }
  // No resolvable DOI — fall back to plain reachability + title.
  const link = await verifyLinkReachable(url)
  return link.status === "partial"
    ? { ...link, confidence: 0.5, extracted: { ...link.extracted, note: "Reachable but DOI metadata not resolved" } }
    : link
}

// --- Generic link / file ----------------------------------------------------
function extractTag(html: string, re: RegExp): string | undefined {
  const m = html.match(re)
  return m?.[1]?.trim().slice(0, 240)
}

async function verifyLinkReachable(url: string): Promise<VerifyResult> {
  if (!isSafePublicUrl(url)) return { status: "unverified", confidence: 0, extracted: { reason: "Invalid or private URL" } }
  try {
    const res = await fetchWithTimeout(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; iNGEN-ProofVerifier/1.0)", Accept: "text/html,*/*" },
      redirect: "follow",
    })
    if (!res.ok) return { status: "unverified", confidence: 0, extracted: { reason: `HTTP ${res.status}`, statusCode: res.status } }

    const contentType = res.headers.get("content-type") ?? ""
    let title: string | undefined
    let description: string | undefined
    if (contentType.includes("text/html")) {
      const html = (await res.text()).slice(0, 60000)
      title =
        extractTag(html, /<title[^>]*>([^<]+)<\/title>/i) ||
        extractTag(html, /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
      description = extractTag(html, /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    }
    return {
      status: "partial",
      confidence: 0.55,
      extracted: { statusCode: res.status, title, description, type: "link", reason: "Link is reachable; claim details require review" },
    }
  } catch (e) {
    return {
      status: "unverified",
      confidence: 0,
      extracted: { reason: e instanceof Error && e.name === "AbortError" ? "Timed out" : "Unreachable" },
    }
  }
}

// --- Image (certificate / award) via GPT-vision -----------------------------
async function verifyImage(url: string): Promise<VerifyResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { status: "unverified", confidence: 0, extracted: { reason: "OPENAI_API_KEY not configured" } }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"
  const system =
    "You verify whether an image is a credible credential (certificate, award, diploma, hackathon prize, recommendation letter, or official document). " +
    "Return ONLY JSON: { is_credential: boolean, document_type: string, issuer: string, event: string, recipient: string, date: string, placement: string, confidence: number (0-1), reason: string }. " +
    "Use empty strings for unknown fields. Be skeptical: a random photo, meme, or selfie is not a credential."

  try {
    const res = await fetchWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          max_tokens: 500,
          temperature: 0,
          messages: [
            { role: "system", content: system },
            {
              role: "user",
              content: [
                { type: "text", text: "Is this a credible credential? Extract its details." },
                { type: "image_url", image_url: { url } },
              ],
            },
          ],
        }),
      },
      45000,
    )
    if (!res.ok) return { status: "unverified", confidence: 0, extracted: { reason: `Vision error ${res.status}` } }
    const data = await res.json()
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}")
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0))
    const isCred = Boolean(parsed.is_credential)
    const status: ProofStatus = isCred && confidence >= 0.6 ? "verified" : isCred || confidence >= 0.4 ? "partial" : "unverified"
    return { status, confidence, extracted: { type: "image", ...parsed } }
  } catch (e) {
    return { status: "unverified", confidence: 0, extracted: { reason: e instanceof Error ? e.message : "Vision check failed" } }
  }
}

// --- Dispatch ---------------------------------------------------------------
export async function verifyProof(kind: ProofKind, url: string | null): Promise<VerifyResult> {
  if (!url) return { status: "unverified", confidence: 0, extracted: { reason: "No URL to verify" } }
  const normalizedUrl = normalizeUrl(url)
  if (!isSafePublicUrl(normalizedUrl)) {
    return { status: "unverified", confidence: 0, extracted: { reason: "Invalid or private URL" } }
  }
  return verifyNormalizedProof(kind, normalizedUrl)
}

export async function verifyProofWithContext(
  kind: ProofKind,
  url: string | null,
  context: VerifyContext,
): Promise<VerifyResult> {
  if (!url) return { status: "unverified", confidence: 0, extracted: { reason: "No URL to verify" } }
  const normalizedUrl = normalizeUrl(url)
  if (!isSafePublicUrl(normalizedUrl)) {
    return { status: "unverified", confidence: 0, extracted: { reason: "Invalid or private URL" } }
  }
  return verifyNormalizedProof(kind, normalizedUrl, context)
}

async function verifyNormalizedProof(
  kind: ProofKind,
  url: string,
  context: VerifyContext = {},
): Promise<VerifyResult> {
  switch (kind) {
    case "github":
      return verifyGitHub(url, context)
    case "doi":
      return verifyDoi(url, context)
    case "image":
      return verifyImage(url)
    case "link":
    case "file":
    default:
      return verifyLinkReachable(url)
  }
}
