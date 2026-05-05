"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import type { AppTheme } from "@/lib/theme"

type ThemeContextValue = {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyTheme(next: AppTheme) {
  document.documentElement.dataset.theme = next
  document.documentElement.classList.toggle("dark", next === "dark")
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("light")

  useEffect(() => {
    const saved = localStorage.getItem("forge:theme") as AppTheme | null
    const next = saved === "dark" || saved === "light" ? saved : "light"
    setThemeState(next)
    applyTheme(next)
  }, [])

  function setTheme(next: AppTheme) {
    setThemeState(next)
    localStorage.setItem("forge:theme", next)
    applyTheme(next)
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useAppTheme() {
  const value = useContext(ThemeContext)
  if (!value) {
    throw new Error("useAppTheme must be used inside ThemeProvider")
  }
  return value
}
