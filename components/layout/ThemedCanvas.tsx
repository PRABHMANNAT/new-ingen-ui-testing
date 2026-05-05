"use client"

import { themeClasses } from "@/lib/theme"
import { useAppTheme } from "@/components/theme/ThemeProvider"

export function ThemedCanvas({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  const { theme } = useAppTheme()
  const t = themeClasses[theme]

  return (
    <section className={`relative h-screen overflow-y-auto overflow-x-hidden px-6 py-5 ${t.canvas} ${className}`}>
      <div className={`pointer-events-none absolute inset-0 ${t.grid} bg-[size:32px_32px] ${t.gridOpacity}`} />
      <div className="relative">{children}</div>
    </section>
  )
}
