import type React from "react"
import type { Metadata } from "next"
import { Comfortaa, Inter, Outfit, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AristotleProvider } from "@/app/pm/aristotle-context"
import GlobalWorkspaceShell from "@/components/global-workspace-shell"
import "./globals.css"

const comfortaa = Comfortaa({
  subsets: ["latin"],
  variable: "--font-comfortaa",
  weight: ["300", "400", "500", "600", "700"],
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
})

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "FORGE — Proof-first hiring",
  description: "Rank candidates with auditable evidence in under 60 seconds.",
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${comfortaa.variable} ${inter.variable} ${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AristotleProvider>
            <GlobalWorkspaceShell>
              {children}
            </GlobalWorkspaceShell>
            <Analytics />
          </AristotleProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
