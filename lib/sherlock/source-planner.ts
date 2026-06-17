import type { SherlockClaim } from "./types"
import { isLinkedInUrl, normalizeUrl } from "./collector-utils"

export type SherlockCollectorKind = "npm" | "pypi" | "crates" | "wayback" | "search" | "portfolio" | "linkedin_user_provided_only"

export type SherlockSourcePlanItem = {
  id: string
  collector: SherlockCollectorKind
  status: "planned" | "skipped"
  reason: string
  claimIds: string[]
  query?: string
  url?: string
  packageName?: string
}

export type SherlockSourcePlan = {
  items: SherlockSourcePlanItem[]
  warnings: string[]
}

const URL_PATTERN = /\bhttps?:\/\/[^\s)"']+/gi
const NPM_PATTERNS = [/npmjs\.com\/package\/(@?[^/\s)"']+)/i, /npm\s+package\s+(@?[a-z0-9._/-]+)\b/i, /package\s+(@[a-z0-9._/-]+)\b/i]
const PYPI_PATTERNS = [/pypi\.org\/project\/([^/\s)"']+)/i, /pypi\s+(?:package\s+)?([a-z0-9._-]+)\b/i, /python package\s+([a-z0-9._-]+)\b/i]
const CRATES_PATTERNS = [/crates\.io\/crates\/([^/\s)"']+)/i, /(?:rust\s+)?crate\s+([a-z0-9._-]+)\b/i]

export function planSherlockSources(input: {
  claims: SherlockClaim[]
  urls?: string[]
  enableSearch?: boolean
}): SherlockSourcePlan {
  const items: SherlockSourcePlanItem[] = []
  const warnings: string[] = []
  const explicitUrls = new Set<string>()

  for (const url of input.urls ?? []) {
    const normalized = normalizeUrl(url)
    if (normalized) explicitUrls.add(normalized)
  }

  for (const claim of input.claims) {
    for (const url of extractUrls(`${claim.text}\n${claim.sourceSnippet}\n${claim.subject ?? ""}`)) {
      explicitUrls.add(url)
    }

    collectPackagePlan(items, claim, "npm", NPM_PATTERNS)
    collectPackagePlan(items, claim, "pypi", PYPI_PATTERNS)
    collectPackagePlan(items, claim, "crates", CRATES_PATTERNS)

    if (claim.type === "stack" || claim.type === "publication" || claim.type === "package") {
      if (input.enableSearch) {
        items.push({
          id: `plan-search-${claim.id}`,
          collector: "search",
          status: "planned",
          reason: "Search can discover public artifacts for this self-reported claim.",
          claimIds: [claim.id],
          query: `${claim.subject ?? claim.text} ${claim.sourceSnippet}`.slice(0, 220),
        })
      } else {
        items.push({
          id: `plan-search-disabled-${claim.id}`,
          collector: "search",
          status: "skipped",
          reason: "Search API is disabled because no approved search API key is configured.",
          claimIds: [claim.id],
        })
      }
    }
  }

  explicitUrls.forEach((url) => {
    if (isLinkedInUrl(url)) {
      items.push({
        id: `plan-linkedin-${items.length + 1}`,
        collector: "linkedin_user_provided_only",
        status: "skipped",
        reason: "LinkedIn scraping is not allowed. Use user-provided LinkedIn text/export or an approved API connector.",
        claimIds: claimIdsForUrl(input.claims, url),
        url,
      })
      return
    }

    items.push({
      id: `plan-wayback-${items.length + 1}`,
      collector: "wayback",
      status: "planned",
      reason: "Wayback can corroborate that this public artifact existed historically.",
      claimIds: claimIdsForUrl(input.claims, url),
      url,
    })

    if (looksLikePortfolioUrl(url)) {
      items.push({
        id: `plan-portfolio-${items.length + 1}`,
        collector: "portfolio",
        status: "planned",
        reason: "Portfolio URL can be fetched with SSRF protections and normalized as artifact evidence.",
        claimIds: claimIdsForUrl(input.claims, url),
        url,
      })
    }
  })

  if (items.some((item) => item.collector === "linkedin_user_provided_only")) {
    warnings.push("LinkedIn URLs were not scraped. Paste/export LinkedIn content or configure an approved API integration.")
  }

  return { items: dedupePlan(items), warnings }
}

function collectPackagePlan(
  items: SherlockSourcePlanItem[],
  claim: SherlockClaim,
  collector: "npm" | "pypi" | "crates",
  patterns: RegExp[],
) {
  const text = `${claim.text}\n${claim.sourceSnippet}\n${claim.subject ?? ""}`
  for (const pattern of patterns) {
    const match = text.match(pattern)
    const packageName = sanitizePackageName(match?.[1])
    if (!packageName) continue
    items.push({
      id: `plan-${collector}-${claim.id}-${packageName}`,
      collector,
      status: "planned",
      reason: `${collector} package metadata can corroborate package ownership or release claims.`,
      claimIds: [claim.id],
      packageName,
    })
  }
}

function extractUrls(text: string) {
  return Array.from(text.matchAll(URL_PATTERN))
    .map((match) => normalizeUrl(match[0]))
    .filter((url): url is string => Boolean(url))
}

function claimIdsForUrl(claims: SherlockClaim[], url: string) {
  return claims
    .filter((claim) => `${claim.text}\n${claim.sourceSnippet}\n${claim.subject ?? ""}`.includes(url))
    .map((claim) => claim.id)
}

function looksLikePortfolioUrl(url: string) {
  const hostname = new URL(url).hostname.toLowerCase()
  return !hostname.includes("github.com") && !hostname.includes("npmjs.com") && !hostname.includes("pypi.org") && !hostname.includes("crates.io") && !hostname.includes("web.archive.org")
}

function sanitizePackageName(value?: string) {
  if (!value) return null
  const trimmed = value.trim().replace(/[),.;]+$/, "")
  if (!/^[a-z0-9@._/-]+$/i.test(trimmed)) return null
  return trimmed
}

function dedupePlan(items: SherlockSourcePlanItem[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.collector}:${item.status}:${item.url ?? ""}:${item.packageName ?? ""}:${item.query ?? ""}:${item.claimIds.join(",")}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
