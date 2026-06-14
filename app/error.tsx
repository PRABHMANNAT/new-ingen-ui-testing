"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex h-full min-w-0 flex-1 items-center justify-center bg-[#F7F3EC] px-6 text-center text-[#241F18] dark:bg-[#050505] dark:text-white">
      <div>
        <AlertTriangle size={30} className="mx-auto text-[#DF5F12]" />
        <h1 className="mt-4 text-xl font-black">This workspace could not be loaded</h1>
        <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-[#81766C] dark:text-white/40">
          The data service returned an error. Retry the request; your profile data has not been changed.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#241F18] px-4 py-2.5 text-xs font-black text-white dark:bg-white dark:text-black"
        >
          <RotateCcw size={14} />
          Try again
        </button>
      </div>
    </main>
  )
}
