export default function CandidateLoading() {
  return (
    <main className="h-full min-w-0 flex-1 overflow-hidden bg-[#F7F3EC] px-6 py-10 dark:bg-[#050505] lg:px-10">
      <div className="mx-auto max-w-[1040px] animate-pulse">
        <div className="h-4 w-36 rounded-full bg-[#E4D9CB] dark:bg-white/10" />
        <div className="mt-8 border-y border-[#DCCFBE] py-8 dark:border-white/10">
          <div className="flex gap-6">
            <div className="h-24 w-24 rounded-[28px] bg-[#E4D9CB] dark:bg-white/10" />
            <div className="flex-1 space-y-3">
              <div className="h-3 w-28 rounded-full bg-[#E4D9CB] dark:bg-white/10" />
              <div className="h-8 w-72 max-w-full rounded-full bg-[#E4D9CB] dark:bg-white/10" />
              <div className="h-4 w-96 max-w-full rounded-full bg-[#E4D9CB] dark:bg-white/10" />
            </div>
          </div>
        </div>
        {[1, 2, 3].map((item) => (
          <div key={item} className="grid gap-6 border-b border-[#DCCFBE] py-8 dark:border-white/10 md:grid-cols-[180px_1fr]">
            <div className="h-3 w-24 rounded-full bg-[#E4D9CB] dark:bg-white/10" />
            <div className="space-y-3">
              <div className="h-4 w-48 rounded-full bg-[#E4D9CB] dark:bg-white/10" />
              <div className="h-3 w-full rounded-full bg-[#E4D9CB] dark:bg-white/10" />
              <div className="h-3 w-4/5 rounded-full bg-[#E4D9CB] dark:bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
