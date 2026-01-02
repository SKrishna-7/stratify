import { cn } from "@lib/utils"; // Assuming you use shadcn/ui utils or a simple clsx/tailwind-merge

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-zinc-900/50 border border-zinc-800/50 shadow-inner",
        "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.03] before:to-transparent",
        className
      )}
    />
  );
}

export function DashboardLoader() {
  return (
    <div className="h-full w-full flex flex-col gap-10 p-4 bg-black max-w-7xl mx-auto">
      {/* HUD Header Skeleton */}
      <div className="w-full bg-[#090909] border border-zinc-900 rounded-[2.5rem] p-10 h-[220px] flex flex-col justify-between relative overflow-hidden">
        <div className="space-y-4">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="w-full md:w-72 space-y-4 self-end">
          <div className="flex justify-between items-end">
            <Skeleton className="h-2 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
        </div>
      </div>

      {/* Grid Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Section */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between px-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-[2rem]" />
            ))}
          </div>
        </div>

        {/* Sidebar Section */}
        <div className="lg:col-span-4 space-y-6">
          <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
        </div>
      </div>
    </div>
  );
}