export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-4 w-64 bg-slate-200/70 dark:bg-zinc-800/60 rounded-lg" />
        </div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-3 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-20 bg-slate-200 dark:bg-zinc-800 rounded" />
              <div className="w-7 h-7 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
            </div>
            <div className="h-6 w-28 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Content List Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-3.5 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-zinc-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-zinc-800 rounded" />
                <div className="h-3 w-1/2 bg-slate-200/70 dark:bg-zinc-800/60 rounded" />
              </div>
            </div>
            <div className="h-3 w-full bg-slate-200/50 dark:bg-zinc-800/40 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
