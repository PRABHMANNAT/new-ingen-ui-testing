"use client"

import { ArrowUp } from "lucide-react"
import { motion } from "framer-motion"
import { OmniLogo } from "@/components/omni-logo"

export type FlowState =
  | "idle"
  | "chatting"
  | "role_requested"
  | "links_requested"
  | "evidence_requested"
  | "ready_to_analyse"
  | "analysing"
  | "profile_ready"

export type SearchContext = {
  candidateName?: string
  role?: string
  github?: string
  portfolio?: string
  uploadedFile?: {
    name: string
    size: number
    type: string
    preview?: string
  }
  pastedEvidence?: string
}

export type ChatAction = {
  label: string
  value: string
  kind?: "candidate" | "role" | "github" | "upload" | "skip" | "analyse" | "link"
}

export type ChatMessage = {
  id: string
  sender: "sherlock" | "user" | "system"
  text: string
  actions?: ChatAction[]
  attachment?: {
    type: "github" | "resume" | "portfolio" | "link"
    label: string
    value: string
  }
}

type Props = {
  messages: ChatMessage[]
  flowState: FlowState
  context: SearchContext
  query: string
  setQuery: (value: string) => void
  onSubmitQuery: () => void
  onAction: (action: ChatAction, messageId: string) => void
  onAnalyse: () => void
}

export function SherlockChatPanel({
  messages,
  flowState,
  context,
  query,
  setQuery,
  onSubmitQuery,
  onAction,
  onAnalyse,
}: Props) {
  const hasConversation = messages.length > 1 || flowState !== "idle"

  return (
    <section className="relative h-screen border-r border-[#DED4C7]/70 bg-[#F7F2EA] dark:border-white/[0.06] dark:bg-[#0A0A0A]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#DED4C733_1px,transparent_1px),linear-gradient(to_bottom,#DED4C733_1px,transparent_1px)] bg-[size:32px_32px] opacity-25 dark:opacity-10" />

      {!hasConversation ? (
        <div className="relative flex h-full flex-col items-center justify-center px-8 pb-28">
          <OmniLogo size={36} className="text-[#1F2A38] dark:text-white" />
          <h2 className="mt-10 text-center text-[30px] font-normal leading-[1.25] tracking-[-0.07em] text-[#4E4944] dark:text-white/70">
            Who&apos;s the one
            <br />
            you&apos;re
            <br />
            searching for?
          </h2>
          <SherlockFloatingInput query={query} setQuery={setQuery} onSubmitQuery={onSubmitQuery} />
        </div>
      ) : (
        <div className="relative flex h-full flex-col px-6 pb-28 pt-8">
          <div className="mb-5 flex items-center gap-3">
            <OmniLogo size={18} className="text-[#1F2A38] dark:text-white shrink-0" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#8A8177] dark:text-white/40">SHERLOCK</p>
              <p className="text-[12px] font-bold tracking-[-0.03em] text-[#4E4944] dark:text-white/70">proof search live</p>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} onAction={onAction} />
            ))}
            {flowState === "ready_to_analyse" && <ContextReadyCard context={context} onAnalyse={onAnalyse} />}
            {flowState === "analysing" && (
              <div className="rounded-[24px] border border-[#DED4C7] bg-[#FFFDF8]/95 px-4 py-3 text-[12px] font-bold text-[#6F675F] shadow-[0_8px_20px_rgba(42,37,32,0.08)] dark:border-white/10 dark:bg-[#141414] dark:text-white/60">
                Sherlock is stitching proof signals...
              </div>
            )}
          </div>

          <SherlockFloatingInput query={query} setQuery={setQuery} onSubmitQuery={onSubmitQuery} />
        </div>
      )}
    </section>
  )
}

function SherlockFloatingInput({
  query,
  setQuery,
  onSubmitQuery,
}: {
  query: string
  setQuery: (value: string) => void
  onSubmitQuery: () => void
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmitQuery()
      }}
      className="absolute bottom-9 left-7 right-7"
    >
      <div className="relative rounded-[22px] bg-[#FFFDF8]/95 p-2 shadow-[0_18px_45px_rgba(42,37,32,0.14)] backdrop-blur-xl dark:bg-[#141414] dark:shadow-none">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ex: Alex Rivera, github"
          className="h-[54px] w-full rounded-[17px] bg-transparent px-5 pr-14 text-[19px] tracking-[-0.06em] text-[#2A2520] outline-none placeholder:text-[#BDB6AE] dark:text-white dark:placeholder:text-white/30"
        />
        <button
          type="submit"
          className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-[#F7F2EA] text-[#BDB6AE] transition hover:bg-[#FF6A00] hover:text-white dark:bg-white/10 dark:hover:bg-[#FF6A00]"
          aria-label="Send Sherlock message"
        >
          <ArrowUp size={18} />
        </button>
      </div>
    </form>
  )
}

function ChatMessageBubble({
  message,
  onAction,
}: {
  message: ChatMessage
  onAction: (action: ChatAction, messageId: string) => void
}) {
  const isUser = message.sender === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={isUser ? "flex justify-end" : "flex justify-start"}
    >
      <div className={isUser ? "max-w-[86%]" : "max-w-[92%]"}>
        <div
          className={
            isUser
              ? "ml-auto max-w-full rounded-[24px] rounded-tr-md bg-[#2A2520] px-4 py-3 text-[12px] font-bold leading-5 tracking-[-0.03em] text-[#FFFDF8] dark:bg-white dark:text-[#2A2520]"
              : "max-w-full rounded-[24px] rounded-tl-md border border-[#DED4C7] bg-[#FFFDF8]/95 px-4 py-3 text-[12px] font-bold leading-5 tracking-[-0.03em] text-[#6F675F] shadow-[0_8px_20px_rgba(42,37,32,0.08)] dark:border-white/10 dark:bg-[#141414] dark:text-white/70"
          }
        >
          {message.text}
        </div>

        {message.attachment && (
          <div className="mt-2 rounded-[18px] border border-[#DED4C7] bg-[#EEE8DF]/70 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF6A00]">{message.attachment.label}</p>
            <p className="mt-1 break-words text-[11px] font-bold text-[#2A2520] dark:text-white/80">{message.attachment.value}</p>
          </div>
        )}

        {message.actions?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.actions.map((action) => (
              <button
                key={`${message.id}-${action.label}`}
                onClick={() => onAction(action, message.id)}
                className="rounded-full border border-[#DED4C7] bg-[#EEE8DF] px-3.5 py-2 text-[11px] font-black tracking-[-0.03em] text-[#6F675F] transition hover:border-[#FF6A00]/50 hover:bg-[#FFE1C7] hover:text-[#FF6A00] dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10 dark:hover:text-orange-300"
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}

function ContextReadyCard({ context, onAnalyse }: { context: SearchContext; onAnalyse: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[26px] border border-[#DED4C7] bg-[#FFFDF8]/95 p-4 shadow-[0_8px_20px_rgba(42,37,32,0.08)] dark:border-white/10 dark:bg-[#141414]"
    >
      <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#8A8177] dark:text-white/40">Context ready</p>
      <div className="mt-3 space-y-2 text-[12px] font-bold text-[#2A2520] dark:text-white/80">
        <p>Candidate: {context.candidateName || "Role search"}</p>
        <p>Role: {context.role || "Not provided"}</p>
        <p>GitHub: {context.github || "Skipped"}</p>
        <p>Resume: {context.uploadedFile?.name || "Skipped"}</p>
      </div>
      <button
        onClick={onAnalyse}
        className="mt-4 w-full rounded-2xl bg-[#FF6A00] px-4 py-4 text-[12px] font-black uppercase tracking-[0.22em] text-white shadow-[0_18px_40px_rgba(255,106,0,0.24)] transition hover:scale-[1.01]"
      >
        Analyse Profile
      </button>
    </motion.div>
  )
}
