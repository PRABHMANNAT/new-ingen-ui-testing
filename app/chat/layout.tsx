import React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Ingen — Talent Search",
    description: "Search verified technical talent with Ingen.",
}

export default function ChatLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
