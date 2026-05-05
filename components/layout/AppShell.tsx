"use client"

import PMSidebar from "@/app/pm/components/PMSidebar"
import { themeClasses } from "@/lib/theme"
import { useAppTheme } from "@/components/theme/ThemeProvider"

export function AppShell({
  children,
  withSidebar = true,
}: {
  children: React.ReactNode
  withSidebar?: boolean
}) {
  const { theme } = useAppTheme()
  const t = themeClasses[theme]

  return (
    <div className={`min-h-screen overflow-hidden font-mono ${t.app}`}>
      {withSidebar && <PMSidebar />}
      <main className={withSidebar ? "ml-[92px] h-screen overflow-hidden" : "h-screen overflow-hidden"}>{children}</main>
    </div>
  )
}
