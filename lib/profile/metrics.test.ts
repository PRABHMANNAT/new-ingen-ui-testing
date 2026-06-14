import { describe, expect, it } from "vitest"
import { getProfileCompleteness, getProofRollup } from "./metrics"
import type { FullProfile } from "@/lib/supabase/types"

function profile(overrides: Partial<FullProfile> = {}): FullProfile {
  return {
    id: "profile-1",
    role: "student",
    full_name: "A Student",
    email: "student@example.com",
    headline: "Backend Engineer",
    about: "Builds reliable systems.",
    tags: ["TypeScript"],
    avatar_url: null,
    target_role: "Backend Engineer",
    created_at: "2026-06-15T00:00:00.000Z",
    updated_at: "2026-06-15T00:00:00.000Z",
    sections: [],
    ...overrides,
  }
}

describe("profile metrics", () => {
  it("weights partial proof at half confidence", () => {
    const candidate = profile({
      sections: [
        {
          id: "section-1",
          profile_id: "profile-1",
          type: "projects",
          title: "Projects",
          position: 0,
          created_at: "2026-06-15T00:00:00.000Z",
          items: [
            {
              id: "item-1",
              section_id: "section-1",
              title: "Project",
              body: "",
              meta: {},
              position: 0,
              created_at: "2026-06-15T00:00:00.000Z",
              proofs: [
                {
                  id: "proof-1",
                  item_id: "item-1",
                  kind: "github",
                  url: "https://github.com/example/project",
                  file_path: null,
                  status: "verified",
                  confidence: 1,
                  extracted: {},
                  created_at: "2026-06-15T00:00:00.000Z",
                },
                {
                  id: "proof-2",
                  item_id: "item-1",
                  kind: "link",
                  url: "https://example.com/project",
                  file_path: null,
                  status: "partial",
                  confidence: 0.5,
                  extracted: {},
                  created_at: "2026-06-15T00:00:00.000Z",
                },
              ],
            },
          ],
        },
      ],
    })

    expect(getProofRollup(candidate)).toEqual({
      claimed: 2,
      verified: 1,
      partial: 1,
      unverified: 0,
      score: 75,
    })
    expect(getProfileCompleteness(candidate)).toBe(100)
  })

  it("reports an empty profile without dividing by zero", () => {
    const candidate = profile({
      full_name: "",
      headline: "",
      about: "",
      tags: [],
      target_role: "",
    })

    expect(getProofRollup(candidate).score).toBe(0)
    expect(getProfileCompleteness(candidate)).toBe(0)
  })
})
