"use client"

import { ArrowUp } from "lucide-react"
import { motion } from "framer-motion"
import { SherlockOrb } from "@/components/SherlockOrb"

export function CenterStage({
  status,
  query,
  setQuery,
  onSubmit,
}: {
  status: "idle" | "collecting" | "analysing" | "profile"
  query: string
  setQuery: (value: string) => void
  onSubmit: () => void
}) {
  return (
    <section className="relative h-screen border-x border-[#DED4C7]/70 bg-[#F7F2EA]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#DED4C733_1px,transparent_1px),linear-gradient(to_bottom,#DED4C733_1px,transparent_1px)] bg-[size:32px_32px] opacity-45" />

      <div className="relative flex h-full flex-col items-center justify-center px-10">
        <SherlockOrb status={status} />

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 max-w-[720px] text-center text-[30px] leading-tight tracking-[-0.04em] text-[#2A2520]"
        >
          Who&apos;s the one you&apos;re searching for?
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 0.9, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-4 max-w-[520px] text-center text-[13px] font-bold leading-6 tracking-[-0.03em] text-[#8A8177]"
        >
          Start with a name. Sherlock will collect the role, GitHub, resume, and proof links in the chat panel.
        </motion.p>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
          className="mt-10 w-full max-w-[720px]"
        >
          <div className="group relative rounded-[28px] border border-[#DED4C7] bg-[#FBF7EF]/90 p-3 shadow-[0_28px_80px_rgba(42,37,32,0.10)] backdrop-blur-xl">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex: Alex Rivera"
              className="h-14 w-full rounded-[20px] border border-[#DED4C7]/80 bg-[#FFFDF8] px-6 pr-16 text-[14px] font-bold tracking-[-0.04em] text-[#2A2520] outline-none placeholder:text-[#B8AFA5] focus:border-[#FF6A00]/50"
            />
            <button
              type="submit"
              className="absolute right-6 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#F4EFE7] text-[#8A8177] transition hover:bg-[#FF6A00] hover:text-white"
              aria-label="Start Sherlock search"
            >
              <ArrowUp size={17} />
            </button>
          </div>
        </form>

        {status === "analysing" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-full border border-[#DED4C7] bg-[#FBF7EF] px-5 py-3 text-[12px] font-bold uppercase tracking-[0.28em] text-[#8A8177]"
          >
            Sherlock is stitching proof signals...
          </motion.div>
        )}
      </div>
    </section>
  )
}
