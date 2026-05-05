"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ArtifactEnvelope } from "@/lib/llm/schema"
import type { LLMMessage } from "@/lib/llm/providers"

export type PMConversationMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
  artifact?: ArtifactEnvelope
  provider?: string
}

const STORAGE_KEY = "forge-pm-artifact-conversation-v1"

type ProviderState = {
  name: string
  fallback?: boolean
  state: "idle" | "thinking" | "ready" | "error"
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function loadMessages(): PMConversationMessage[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function toLLMMessages(messages: PMConversationMessage[], nextPrompt: string): LLMMessage[] {
  const history = messages.slice(-8).map((message): LLMMessage => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content,
  }))
  return [...history, { role: "user", content: nextPrompt }]
}

export function useConversation() {
  const [messages, setMessages] = useState<PMConversationMessage[]>(() => loadMessages())
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [provider, setProvider] = useState<ProviderState>({ name: "Aristotle", state: "idle" })
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(() => {
    const loaded = loadMessages().filter((message) => message.artifact)
    return loaded.at(-1)?.id || null
  })
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  const artifactMessages = useMemo(() => messages.filter((message) => message.role === "assistant" && message.artifact), [messages])
  const activeArtifact = useMemo(() => artifactMessages.find((message) => message.id === activeArtifactId)?.artifact || artifactMessages.at(-1)?.artifact || null, [activeArtifactId, artifactMessages])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setInput("")
    setIsThinking(false)
    setProvider({ name: "Aristotle", state: "idle" })
    setActiveArtifactId(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const sendPrompt = useCallback(async (rawPrompt?: string) => {
    const prompt = (rawPrompt ?? input).trim()
    if (!prompt || isThinking) return

    const userMessage: PMConversationMessage = { id: uid("user"), role: "user", content: prompt, createdAt: new Date().toISOString() }
    const baseMessages = [...messages, userMessage]
    setMessages(baseMessages)
    setInput("")
    setIsThinking(true)
    setProvider({ name: "Aristotle", state: "thinking" })

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch("/api/pm/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: toLLMMessages(messages, prompt) }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) throw new Error(`PM chat failed: ${response.status}`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let currentProvider = "Aristotle"
      let currentFallback = false

      const handleEvent = (chunk: string) => {
        const lines = chunk.split("\n")
        const event = lines.find((line) => line.startsWith("event:"))?.slice(6).trim()
        const dataLine = lines.find((line) => line.startsWith("data:"))?.slice(5).trim()
        if (!event || !dataLine) return
        const data = JSON.parse(dataLine)

        if (event === "status") {
          setProvider({ name: currentProvider, state: data.state === "thinking" ? "thinking" : "ready", fallback: currentFallback })
        }
        if (event === "provider") {
          currentProvider = data.name || "Aristotle"
          currentFallback = !!data.fallback
          setProvider({ name: currentProvider, state: "thinking", fallback: currentFallback })
        }
        if (event === "envelope") {
          const assistantMessage: PMConversationMessage = {
            id: uid("assistant"),
            role: "assistant",
            content: data.narration,
            createdAt: new Date().toISOString(),
            artifact: data,
            provider: currentProvider,
          }
          setMessages((prev) => [...prev, assistantMessage])
          setActiveArtifactId(assistantMessage.id)
        }
        if (event === "error") {
          throw new Error(data.message || "PM chat stream error")
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split("\n\n")
        buffer = events.pop() || ""
        events.forEach(handleEvent)
      }
      if (buffer.trim()) handleEvent(buffer)
      setProvider({ name: currentProvider, state: "ready", fallback: currentFallback })
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setProvider({ name: "Aristotle", state: "error" })
        setMessages((prev) => [...prev, { id: uid("assistant"), role: "assistant", content: "I could not reach the Dashboard model layer. Check the server environment keys and try again.", createdAt: new Date().toISOString() }])
      }
    } finally {
      setIsThinking(false)
      abortRef.current = null
    }
  }, [input, isThinking, messages])

  const submit = useCallback(() => sendPrompt(), [sendPrompt])

  const drill = useCallback((blockId: string) => {
    sendPrompt(`Expand block ${blockId} with deeper evidence and a more detailed visual breakdown.`)
  }, [sendPrompt])

  return {
    messages,
    input,
    setInput,
    isThinking,
    provider,
    activeArtifact,
    activeArtifactId,
    artifactMessages,
    setActiveArtifactId,
    submit,
    sendPrompt,
    drill,
    reset,
  }
}
