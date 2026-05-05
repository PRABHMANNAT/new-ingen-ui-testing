"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface IngenLogoProps {
    className?: string
    size?: number
}

export function IngenLogo({ className, size = 40 }: IngenLogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn(className)}
        >
            <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="9" strokeLinecap="butt" />
            <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="9" strokeLinecap="butt" />
            <line x1="22" y1="22" x2="78" y2="78" stroke="currentColor" strokeWidth="9" strokeLinecap="butt" />
            <line x1="78" y1="22" x2="22" y2="78" stroke="currentColor" strokeWidth="9" strokeLinecap="butt" />
        </svg>
    )
}
