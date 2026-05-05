"use client"

import { useRef } from "react"
import { FileText, Upload } from "lucide-react"

export type UploadedEvidence = {
  id: string
  name: string
  type: string
  size: number
  text: string
  preview: string
}

export function UploadEvidence({
  upload,
  onUpload,
  onAnalyse,
}: {
  upload: UploadedEvidence | null
  onUpload: (upload: UploadedEvidence) => void
  onAnalyse: () => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return

    const base = {
      id: `${file.name}-${file.lastModified}`,
      name: file.name,
      type: file.type || "unknown",
      size: file.size,
      text: "",
      preview: file.type === "application/pdf" ? "PDF uploaded. For demo, Sherlock will use file metadata unless extracted text is pasted." : "Extracting text...",
    }

    if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".json")) {
      const reader = new FileReader()
      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : ""
        onUpload({ ...base, text, preview: text.slice(0, 220) || "No text found." })
      }
      reader.readAsText(file)
    } else {
      onUpload(base)
    }
  }

  return (
    <div className="rounded-[1.75rem] border border-[var(--pm-border)] bg-[var(--pm-card)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--pm-subtle)]">Upload Evidence</div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-8 items-center gap-2 rounded-full bg-[var(--pm-chip)] px-3 text-[10px] uppercase tracking-[0.14em] text-[var(--pm-muted)] transition hover:bg-[var(--pm-chip-hover)] hover:text-[var(--pm-text)]"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </button>
      </div>

      {upload ? (
        <div className="rounded-2xl border border-[var(--pm-focus)] bg-[var(--pm-chip-hover)] p-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--pm-card)] text-[var(--pm-accent)]">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm text-[var(--pm-text)]">{upload.name}</div>
              <div className="mt-1 text-[11px] text-[var(--pm-muted)]">{upload.type || "file"} · {formatSize(upload.size)}</div>
              <p className="mt-3 line-clamp-3 text-xs leading-5 text-[var(--pm-muted)]">{upload.preview}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onAnalyse}
            className="mt-4 h-9 rounded-full bg-[var(--pm-accent)] px-4 text-[10px] uppercase tracking-[0.14em] text-white transition hover:bg-[var(--pm-accent-hover)]"
          >
            Analyse upload
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--pm-border)] bg-[var(--pm-chip)] p-5 text-xs leading-5 text-[var(--pm-muted)]">
          Drop in a resume, TXT, MD, JSON, or PDF. Text files are parsed locally; PDFs are staged as evidence metadata for the demo.
        </div>
      )}

      <input ref={inputRef} type="file" accept=".pdf,.txt,.json,.md" className="hidden" onChange={(event) => handleFiles(event.target.files)} />
    </div>
  )
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}
