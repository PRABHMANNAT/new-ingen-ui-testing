import { describe, expect, it } from "vitest"
import { collectSearch } from "../collectors/search"
import { planSherlockSources } from "../source-planner"
import type { SherlockClaim } from "../types"

const claims: SherlockClaim[] = [
  {
    id: "claim-package",
    type: "package",
    text: "Candidate claims npm package @scope/tool and PyPI package fast-api-kit.",
    subject: "@scope/tool",
    source: "Resume",
    sourceSnippet: "Maintainer of npm package @scope/tool and PyPI fast-api-kit.",
  },
  {
    id: "claim-portfolio",
    type: "project",
    text: "Candidate provided portfolio URL https://example.com",
    subject: "Portfolio",
    source: "Resume",
    sourceSnippet: "Portfolio: https://example.com",
  },
  {
    id: "claim-linkedin",
    type: "identity",
    text: "Candidate provided LinkedIn URL https://www.linkedin.com/in/example",
    subject: "LinkedIn",
    source: "Resume",
    sourceSnippet: "LinkedIn: https://www.linkedin.com/in/example",
  },
]

describe("planSherlockSources", () => {
  it("maps package and portfolio claims to allowed collectors", () => {
    const plan = planSherlockSources({ claims, enableSearch: false })

    expect(plan.items.some((item) => item.collector === "npm" && item.packageName === "@scope/tool")).toBe(true)
    expect(plan.items.some((item) => item.collector === "wayback" && item.url === "https://example.com/")).toBe(true)
    expect(plan.items.some((item) => item.collector === "portfolio" && item.url === "https://example.com/")).toBe(true)
  })

  it("does not plan LinkedIn scraping", () => {
    const plan = planSherlockSources({ claims, enableSearch: false })
    const linkedInItem = plan.items.find((item) => item.collector === "linkedin_user_provided_only")

    expect(linkedInItem?.status).toBe("skipped")
    expect(linkedInItem?.reason).toContain("LinkedIn scraping is not allowed")
    expect(plan.warnings[0]).toContain("LinkedIn URLs were not scraped")
  })

  it("records search as skipped when search is disabled", () => {
    const plan = planSherlockSources({
      claims: [{ ...claims[0], type: "stack", subject: "Rust", text: "Candidate claims Rust systems work." }],
      enableSearch: false,
    })

    expect(plan.items.some((item) => item.collector === "search" && item.status === "skipped")).toBe(true)
  })
})

describe("collectSearch", () => {
  it("returns disabled evidence when no approved search key is configured", async () => {
    const previous = process.env.BRAVE_SEARCH_API_KEY
    delete process.env.BRAVE_SEARCH_API_KEY

    const evidence = await collectSearch("Rust systems candidate")

    if (previous === undefined) delete process.env.BRAVE_SEARCH_API_KEY
    else process.env.BRAVE_SEARCH_API_KEY = previous

    expect(evidence[0].sourceType).toBe("untrusted_search_hit")
    expect(evidence[0].normalizedJson?.disabled).toBe(true)
  })
})
