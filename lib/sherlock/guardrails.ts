const PROHIBITED_KEY_PATTERN =
  /(score|rank|ranking|recommendation|auto_?reject|reject_?recommendation|hire_?recommendation|(?:^|_)(?:pass|fail)(?:$|_))/i
const PROHIBITED_TEXT_PATTERN =
  /\b(score|rank|ranked|ranking|auto-reject|reject recommendation|hire recommendation|strong hire|no hire|hire|reject|pass|fail)\b/i

export type SherlockGuardrailResult = { ok: true } | { ok: false; violations: string[] }

export function assertSherlockEvidenceOnlyOutput(value: unknown): SherlockGuardrailResult {
  const violations: string[] = []
  scan(value, [], violations)

  return violations.length ? { ok: false, violations } : { ok: true }
}

function scan(value: unknown, path: string[], violations: string[]) {
  if (path[0] === "prohibitedOutputsAbsent") return

  if (typeof value === "string") {
    if (PROHIBITED_TEXT_PATTERN.test(value)) {
      violations.push(`${formatPath(path)} contains prohibited decision language`)
    }
    return
  }

  if (!value || typeof value !== "object") return

  if (Array.isArray(value)) {
    value.forEach((entry, index) => scan(entry, [...path, String(index)], violations))
    return
  }

  Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
    if (path[0] !== "prohibitedOutputsAbsent" && PROHIBITED_KEY_PATTERN.test(key)) {
      violations.push(`${formatPath([...path, key])} is a prohibited output field`)
    }
    scan(entry, [...path, key], violations)
  })
}

function formatPath(path: string[]) {
  return path.length ? path.join(".") : "$"
}
