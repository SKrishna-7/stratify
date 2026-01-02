export function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      {/* Brand Skeleton */}
      <div className="h-8 w-32 bg-zinc-900 rounded-lg mb-4" />
      
      {/* Navigation Nodes */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-5 h-5 bg-zinc-900 rounded-md" />
            <div className="h-4 flex-1 bg-zinc-900 rounded-full" />
          </div>
        ))}
      </div>

      {/* Profile Section Skeleton */}
      <div className="mt-auto p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-900" />
        <div className="space-y-2">
          <div className="h-3 w-20 bg-zinc-900 rounded-full" />
          <div className="h-2 w-12 bg-zinc-900 rounded-full" />
        </div>
      </div>
    </div>
  );
}