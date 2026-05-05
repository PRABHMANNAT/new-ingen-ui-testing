"use client"

import { ThemeProvider as AppThemeProvider } from "@/components/theme/ThemeProvider"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <AppThemeProvider>{children}</AppThemeProvider>
}
