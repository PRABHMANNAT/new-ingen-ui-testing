"use client"

import { motion } from "framer-motion"

export function SherlockOrb({ status }: { status: string }) {
  const dots = Array.from({ length: 14 })

  return (
    <div className="relative grid h-24 w-24 place-items-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: status === "analysing" ? 1.1 : 5, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
      >
        {dots.map((_, index) => {
          const angle = (index / dots.length) * Math.PI * 2
          const x = Number((Math.cos(angle) * 38).toFixed(3))
          const y = Number((Math.sin(angle) * 38).toFixed(3))

          return (
            <span
              key={index}
              className="absolute left-1/2 top-1/2"
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <motion.span
                className="block h-3.5 w-3.5 rounded-full bg-[#1F2A38]"
                animate={{
                  scale: status === "analysing" ? [0.8, 1.25, 0.8] : [0.88, 1, 0.88],
                  opacity: status === "analysing" ? [0.45, 1, 0.45] : [0.65, 1, 0.65],
                }}
                transition={{ duration: 1.2, repeat: Infinity, delay: index * 0.05 }}
              />
            </span>
          )
        })}
      </motion.div>

      <motion.div
        animate={{ scale: status === "analysing" ? [1, 1.08, 1] : 1 }}
        transition={{ duration: 1.2, repeat: Infinity }}
        className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FBF7EF] text-[#1F2A38] shadow-[0_16px_48px_rgba(31,42,56,0.12)]"
      >
        <span className="text-[20px] font-black tracking-[-0.08em]">Ⅱ</span>
      </motion.div>
    </div>
  )
}
