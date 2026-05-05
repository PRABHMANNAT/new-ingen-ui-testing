"use client"

import React, { createContext, useContext } from "react"
import { useConversation } from "@/app/pm/useConversation"

type AristotleConversation = ReturnType<typeof useConversation>

const AristotleContext = createContext<AristotleConversation | null>(null)

export function AristotleProvider({ children }: { children: React.ReactNode }) {
  const conversation = useConversation()

  return <AristotleContext.Provider value={conversation}>{children}</AristotleContext.Provider>
}

export function useAristotleConversation() {
  const conversation = useContext(AristotleContext)
  if (!conversation) {
    throw new Error("useAristotleConversation must be used inside AristotleProvider")
  }
  return conversation
}
