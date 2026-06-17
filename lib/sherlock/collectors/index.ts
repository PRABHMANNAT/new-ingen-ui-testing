import type { SherlockClaim, SherlockEvidence } from "../types"
import { planSherlockSources, type SherlockSourcePlan, type SherlockSourcePlanItem } from "../source-planner"
import { collectCrate, collectNpmPackage, collectPyPiPackage } from "./packages"
import { collectPortfolio } from "./portfolio"
import { collectSearch, isSearchConfigured } from "./search"
import { collectWayback } from "./wayback"

export type SherlockCollectionStatus = {
  planItemId: string
  collector: SherlockSourcePlanItem["collector"]
  status: "completed" | "skipped" | "failed"
  reason?: string
  evidenceIds: string[]
}

export type SherlockCollectionResult = {
  plan: SherlockSourcePlan
  evidence: SherlockEvidence[]
  statuses: SherlockCollectionStatus[]
  warnings: string[]
}

const MAX_PLANNED_COLLECTORS = 12

export async function collectSherlockSources(input: {
  claims: SherlockClaim[]
  urls?: string[]
  enableSearch?: boolean
}): Promise<SherlockCollectionResult> {
  const plan = planSherlockSources({
    claims: input.claims,
    urls: input.urls,
    enableSearch: input.enableSearch ?? isSearchConfigured(),
  })
  const evidence: SherlockEvidence[] = []
  const statuses: SherlockCollectionStatus[] = []
  const warnings = [...plan.warnings]

  for (const item of plan.items.slice(0, MAX_PLANNED_COLLECTORS)) {
    if (item.status === "skipped") {
      statuses.push({
        planItemId: item.id,
        collector: item.collector,
        status: "skipped",
        reason: item.reason,
        evidenceIds: [],
      })
      continue
    }

    try {
      const collected = await runCollector(item)
      evidence.push(...collected)
      statuses.push({
        planItemId: item.id,
        collector: item.collector,
        status: "completed",
        reason: item.reason,
        evidenceIds: collected.map((entry) => entry.id),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown collector error"
      warnings.push(`${item.collector} failed: ${message}`)
      statuses.push({
        planItemId: item.id,
        collector: item.collector,
        status: "failed",
        reason: message,
        evidenceIds: [],
      })
    }
  }

  if (plan.items.length > MAX_PLANNED_COLLECTORS) {
    warnings.push(`Collector plan capped at ${MAX_PLANNED_COLLECTORS} of ${plan.items.length} planned items.`)
  }

  return { plan, evidence: dedupeEvidence(evidence), statuses, warnings }
}

async function runCollector(item: SherlockSourcePlanItem): Promise<SherlockEvidence[]> {
  if (item.collector === "npm" && item.packageName) return collectNpmPackage(item.packageName)
  if (item.collector === "pypi" && item.packageName) return collectPyPiPackage(item.packageName)
  if (item.collector === "crates" && item.packageName) return collectCrate(item.packageName)
  if (item.collector === "wayback" && item.url) return collectWayback(item.url)
  if (item.collector === "portfolio" && item.url) return collectPortfolio(item.url)
  if (item.collector === "search" && item.query) return collectSearch(item.query)
  return []
}

function dedupeEvidence(evidence: SherlockEvidence[]) {
  const seen = new Set<string>()
  return evidence.filter((entry) => {
    const key = `${entry.id}:${entry.sourceUrl ?? ""}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
