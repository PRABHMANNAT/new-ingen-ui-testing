import type { FullProfile, ProofRow } from "@/lib/supabase/types"

export type ProofRollup = {
  claimed: number
  verified: number
  partial: number
  unverified: number
  score: number
}

export function getProfileProofs(profile: FullProfile): ProofRow[] {
  return profile.sections.flatMap((section) => section.items.flatMap((item) => item.proofs))
}

export function getProofRollup(profile: FullProfile): ProofRollup {
  const proofs = getProfileProofs(profile)
  const verified = proofs.filter((proof) => proof.status === "verified").length
  const partial = proofs.filter((proof) => proof.status === "partial").length
  const unverified = proofs.length - verified - partial
  const score = proofs.length === 0 ? 0 : Math.round(((verified + partial * 0.5) / proofs.length) * 100)

  return {
    claimed: proofs.length,
    verified,
    partial,
    unverified,
    score,
  }
}

export function getProfileCompleteness(profile: FullProfile): number {
  const checks = [
    Boolean(profile.full_name.trim()),
    Boolean(profile.headline.trim()),
    Boolean(profile.about.trim()),
    Boolean(profile.target_role.trim()),
    profile.tags.length > 0,
    profile.sections.some((section) => section.items.length > 0),
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}
