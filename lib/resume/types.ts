import type { FullProfile } from "@/lib/supabase/types"

export const RESUME_FORMATS = ["us", "indian", "japanese", "australian", "skills"] as const

export type ResumeFormat = (typeof RESUME_FORMATS)[number]

export type ResumeDefinition = {
  id: ResumeFormat
  label: string
  description: string
  pageSize: "letter" | "a4"
  includePhoto: boolean
}

export const RESUME_DEFINITIONS: ResumeDefinition[] = [
  {
    id: "us",
    label: "US Resume",
    description: "Concise one-page resume without a photo.",
    pageSize: "letter",
    includePhoto: false,
  },
  {
    id: "indian",
    label: "Indian Resume",
    description: "Detailed profile with photo, education, projects, and credentials.",
    pageSize: "a4",
    includePhoto: true,
  },
  {
    id: "japanese",
    label: "Japanese Rirekisho",
    description: "Formal A4 personal-history layout with photo and dated entries.",
    pageSize: "a4",
    includePhoto: true,
  },
  {
    id: "australian",
    label: "Australian CV",
    description: "Detailed achievement-focused CV with referee availability.",
    pageSize: "a4",
    includePhoto: false,
  },
  {
    id: "skills",
    label: "Skills-based",
    description: "Capability-first resume organised around skills and verified proof.",
    pageSize: "a4",
    includePhoto: false,
  },
]

export type ResumeDocument = {
  profile: FullProfile
  generatedAt: Date
  format: ResumeFormat
}

export function isResumeFormat(value: string | null): value is ResumeFormat {
  return RESUME_FORMATS.includes(value as ResumeFormat)
}
