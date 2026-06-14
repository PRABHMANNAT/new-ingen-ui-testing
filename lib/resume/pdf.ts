import "server-only"
import { PDFDocument, StandardFonts, rgb, type PDFImage, type PDFFont, type PDFPage } from "pdf-lib"
import type { FullProfile, ProofRow, SectionWithItems } from "@/lib/supabase/types"
import { RESUME_DEFINITIONS, type ResumeDocument, type ResumeFormat } from "./types"

const COLORS = {
  ink: rgb(0.12, 0.1, 0.08),
  muted: rgb(0.38, 0.34, 0.3),
  line: rgb(0.82, 0.79, 0.74),
  accent: rgb(0.36, 0.24, 0.78),
  green: rgb(0.08, 0.5, 0.31),
  soft: rgb(0.96, 0.95, 0.92),
}

function pdfText(value: string): string {
  return value
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/•/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?")
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "student"
}

function verifiedLabel(proofs: ProofRow[]) {
  const verified = proofs.filter((proof) => proof.status === "verified").length
  const partial = proofs.filter((proof) => proof.status === "partial").length
  if (verified) return `${verified} verified proof${verified === 1 ? "" : "s"}`
  if (partial) return `${partial} partially verified proof${partial === 1 ? "" : "s"}`
  return ""
}

function orderedSections(profile: FullProfile, format: ResumeFormat): SectionWithItems[] {
  const sections = profile.sections.filter((section) => section.items.length > 0)
  if (format !== "skills") return sections
  return sections.slice().sort((a, b) => {
    if (a.type === "skills") return -1
    if (b.type === "skills") return 1
    const aVerified = a.items.flatMap((item) => item.proofs).filter((proof) => proof.status === "verified").length
    const bVerified = b.items.flatMap((item) => item.proofs).filter((proof) => proof.status === "verified").length
    return bVerified - aVerified
  })
}

async function loadPhoto(url: string | null): Promise<{ bytes: Uint8Array; type: "png" | "jpg" } | null> {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:") return null
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 7000)
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    if (!response.ok) return null
    const contentType = response.headers.get("content-type") ?? ""
    if (!contentType.includes("png") && !contentType.includes("jpeg") && !contentType.includes("jpg")) return null
    const bytes = new Uint8Array(await response.arrayBuffer())
    if (bytes.byteLength > 5_000_000) return null
    return { bytes, type: contentType.includes("png") ? "png" : "jpg" }
  } catch {
    return null
  }
}

class PdfWriter {
  readonly doc: PDFDocument
  readonly regular: PDFFont
  readonly bold: PDFFont
  readonly pageSize: [number, number]
  page: PDFPage
  y: number
  readonly margin = 44

  constructor(doc: PDFDocument, regular: PDFFont, bold: PDFFont, pageSize: [number, number]) {
    this.doc = doc
    this.regular = regular
    this.bold = bold
    this.pageSize = pageSize
    this.page = doc.addPage(pageSize)
    this.y = pageSize[1] - this.margin
  }

  newPage() {
    this.page = this.doc.addPage(this.pageSize)
    this.y = this.pageSize[1] - this.margin
  }

  ensure(height: number) {
    if (this.y - height < this.margin) this.newPage()
  }

  line(y = this.y, color = COLORS.line) {
    this.page.drawLine({
      start: { x: this.margin, y },
      end: { x: this.pageSize[0] - this.margin, y },
      thickness: 0.8,
      color,
    })
  }

  text(
    value: string,
    options: {
      x?: number
      size?: number
      bold?: boolean
      color?: ReturnType<typeof rgb>
      maxWidth?: number
      lineHeight?: number
      after?: number
    } = {},
  ) {
    const size = options.size ?? 10
    const font = options.bold ? this.bold : this.regular
    const x = options.x ?? this.margin
    const maxWidth = options.maxWidth ?? this.pageSize[0] - x - this.margin
    const lineHeight = options.lineHeight ?? size * 1.35
    const lines = wrap(pdfText(value), font, size, maxWidth)
    this.ensure(lines.length * lineHeight + (options.after ?? 0))
    for (const line of lines) {
      this.page.drawText(line, { x, y: this.y, size, font, color: options.color ?? COLORS.ink })
      this.y -= lineHeight
    }
    this.y -= options.after ?? 0
  }

  heading(value: string) {
    this.ensure(30)
    this.y -= 4
    this.text(value.toUpperCase(), { size: 10, bold: true, color: COLORS.accent, after: 4 })
    this.line()
    this.y -= 10
  }

  item(title: string, body: string, proofText = "") {
    this.ensure(46)
    this.text(title || "Untitled", { size: 10.5, bold: true, after: 1 })
    if (body) this.text(body, { size: 9.3, color: COLORS.muted, after: 2 })
    if (proofText) this.text(proofText, { size: 7.8, bold: true, color: COLORS.green, after: 5 })
    else this.y -= 5
  }
}

function wrap(value: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const paragraphs = value.split(/\r?\n/)
  const lines: string[] = []
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    if (!words.length) {
      lines.push("")
      continue
    }
    let line = ""
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) line = candidate
      else {
        lines.push(line)
        line = word
      }
    }
    if (line) lines.push(line)
  }
  return lines
}

function contactLine(profile: FullProfile) {
  return [profile.email, profile.target_role].filter(Boolean).join("  |  ")
}

function drawPhoto(writer: PdfWriter, image: PDFImage | null, label = "PHOTO") {
  const width = 82
  const height = 100
  const x = writer.pageSize[0] - writer.margin - width
  const y = writer.pageSize[1] - writer.margin - height
  writer.page.drawRectangle({ x, y, width, height, borderColor: COLORS.line, borderWidth: 1, color: COLORS.soft })
  if (image) {
    const scale = Math.min(width / image.width, height / image.height)
    const drawWidth = image.width * scale
    const drawHeight = image.height * scale
    writer.page.drawImage(image, {
      x: x + (width - drawWidth) / 2,
      y: y + (height - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    })
  } else {
    writer.page.drawText(label, { x: x + 24, y: y + 46, size: 9, font: writer.bold, color: COLORS.muted })
  }
}

function drawStandardHeader(writer: PdfWriter, profile: FullProfile, photo: PDFImage | null, includePhoto: boolean) {
  if (includePhoto) drawPhoto(writer, photo)
  const maxWidth = includePhoto ? writer.pageSize[0] - writer.margin * 2 - 100 : undefined
  writer.text(profile.full_name || "Student", { size: 22, bold: true, maxWidth, after: 3 })
  writer.text(profile.headline || profile.target_role || "Candidate profile", {
    size: 11,
    color: COLORS.accent,
    bold: true,
    maxWidth,
    after: 3,
  })
  writer.text(contactLine(profile), { size: 8.5, color: COLORS.muted, maxWidth, after: 8 })
  if (includePhoto) writer.y = Math.min(writer.y, writer.pageSize[1] - writer.margin - 112)
  writer.line()
  writer.y -= 14
}

function renderUs(writer: PdfWriter, profile: FullProfile) {
  drawStandardHeader(writer, profile, null, false)
  if (profile.about) {
    writer.heading("Professional summary")
    writer.text(profile.about, { size: 9.5, after: 6 })
  }
  for (const section of orderedSections(profile, "us")) {
    writer.heading(section.title)
    for (const item of section.items.slice(0, 3)) {
      writer.item(item.title, item.body, verifiedLabel(item.proofs))
    }
  }
}

function renderDetailed(writer: PdfWriter, profile: FullProfile, photo: PDFImage | null, format: "indian" | "australian") {
  drawStandardHeader(writer, profile, photo, format === "indian")
  if (profile.tags.length) {
    writer.heading("Core capabilities")
    writer.text(profile.tags.join("  |  "), { size: 9.5, bold: true, after: 6 })
  }
  if (profile.about) {
    writer.heading("Profile")
    writer.text(profile.about, { size: 9.5, after: 6 })
  }
  for (const section of orderedSections(profile, format)) {
    writer.heading(section.title)
    for (const item of section.items) writer.item(item.title, item.body, verifiedLabel(item.proofs))
  }
  if (format === "australian") {
    writer.heading("Referees")
    writer.text("Available upon request.", { size: 9.5 })
  }
}

function renderSkills(writer: PdfWriter, profile: FullProfile) {
  drawStandardHeader(writer, profile, null, false)
  writer.heading("Skills profile")
  writer.text(profile.tags.join("  |  ") || "Add skills to your profile", { size: 10, bold: true, after: 8 })
  if (profile.about) writer.text(profile.about, { size: 9.5, after: 8 })
  for (const section of orderedSections(profile, "skills")) {
    writer.heading(section.type === "skills" ? "Core skills" : `${section.title} evidence`)
    for (const item of section.items) writer.item(item.title, item.body, verifiedLabel(item.proofs))
  }
}

function renderJapanese(writer: PdfWriter, profile: FullProfile, photo: PDFImage | null, generatedAt: Date) {
  drawPhoto(writer, photo, "PHOTO")
  writer.text("RIREKISHO", { size: 22, bold: true, maxWidth: writer.pageSize[0] - writer.margin * 2 - 100, after: 2 })
  writer.text("Personal History and Resume", { size: 9.5, color: COLORS.muted, after: 4 })
  writer.text(`Prepared: ${generatedAt.toISOString().slice(0, 10)}`, { size: 8.5, color: COLORS.muted, after: 12 })
  writer.y = Math.min(writer.y, writer.pageSize[1] - writer.margin - 112)
  writer.line()
  writer.y -= 14
  writer.heading("Personal details")
  writer.text(`Name: ${profile.full_name || ""}`, { size: 10, bold: true, after: 3 })
  writer.text(`Email: ${profile.email || ""}`, { size: 9, after: 3 })
  writer.text(`Desired position: ${profile.target_role || profile.headline || ""}`, { size: 9, after: 8 })
  for (const section of orderedSections(profile, "japanese")) {
    writer.heading(section.title)
    for (const item of section.items) writer.item(item.title, item.body, verifiedLabel(item.proofs))
  }
  writer.heading("Personal statement")
  writer.text(profile.about || "Please add a personal statement to your profile.", { size: 9.5 })
}

export async function generateResumePdf(document: ResumeDocument) {
  const definition = RESUME_DEFINITIONS.find((entry) => entry.id === document.format) ?? RESUME_DEFINITIONS[0]
  const pdf = await PDFDocument.create()
  pdf.setTitle(`${definition.label} - ${document.profile.full_name}`)
  pdf.setAuthor(document.profile.full_name || "iNGEN Student")
  pdf.setCreator("iNGEN")
  pdf.setProducer("iNGEN Resume Export")

  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const pageSize: [number, number] = definition.pageSize === "letter" ? [612, 792] : [595.28, 841.89]
  const writer = new PdfWriter(pdf, regular, bold, pageSize)

  const photoData = definition.includePhoto ? await loadPhoto(document.profile.avatar_url) : null
  let photo: PDFImage | null = null
  if (photoData) {
    try {
      photo = photoData.type === "png" ? await pdf.embedPng(photoData.bytes) : await pdf.embedJpg(photoData.bytes)
    } catch {
      photo = null
    }
  }

  if (document.format === "us") renderUs(writer, document.profile)
  else if (document.format === "indian") renderDetailed(writer, document.profile, photo, "indian")
  else if (document.format === "australian") renderDetailed(writer, document.profile, null, "australian")
  else if (document.format === "skills") renderSkills(writer, document.profile)
  else renderJapanese(writer, document.profile, photo, document.generatedAt)

  const bytes = await pdf.save()
  return {
    bytes,
    filename: `${slug(document.profile.full_name)}-${document.format}-resume.pdf`,
  }
}
