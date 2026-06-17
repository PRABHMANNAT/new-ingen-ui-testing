import { extractPortfolio } from "@/lib/portfolio-extract"
import type { SherlockEvidence } from "../types"
import { snapshotRef } from "../collector-utils"

export async function collectPortfolio(url: string): Promise<SherlockEvidence[]> {
  const extraction = await extractPortfolio(url)
  return [
    {
      id: `ev-portfolio-${Buffer.from(url).toString("base64url").slice(0, 16).toLowerCase()}`,
      sourceType: "primary_artifact",
      sourceName: "Portfolio URL",
      sourceUrl: url,
      retrievedAt: extraction.fetchedAt,
      rawSnapshotRef: snapshotRef(extraction),
      summary: extraction.title ? `Portfolio fetched: ${extraction.title}.` : "Portfolio URL fetched and normalized.",
      details: [
        `${extraction.projectCount} project${extraction.projectCount === 1 ? "" : "s"} detected`,
        `${extraction.skills.length} skill mention${extraction.skills.length === 1 ? "" : "s"} detected`,
        `Quality: ${extraction.overallQuality}`,
        ...extraction.warnings.slice(0, 3),
      ],
      reliability: "primary_artifact",
      normalizedJson: {
        url,
        title: extraction.title,
        projects: extraction.projects.slice(0, 8),
        skills: extraction.skills.slice(0, 12),
        socialLinks: extraction.socialLinks,
        projectCount: extraction.projectCount,
        testimonialCount: extraction.testimonialCount,
        quality: extraction.overallQuality,
        warnings: extraction.warnings,
      },
    },
  ]
}
