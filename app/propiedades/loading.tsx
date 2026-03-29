export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-muted)" }}>
      {/* Banner skeleton */}
      <div className="relative pt-32 pb-10 overflow-hidden" style={{ background: "var(--color-primary)", minHeight: "220px" }}>
        <div className="section-container">
          <div className="h-3 w-28 bg-white/10 rounded mb-3 animate-pulse" />
          <div className="h-10 w-64 bg-white/15 rounded animate-pulse" />
          <div className="h-3 w-48 bg-white/10 rounded mt-3 animate-pulse" />
        </div>
      </div>

      <div className="section-container py-10">
        {/* Filter skeleton */}
        <div className="h-12 bg-white rounded-2xl card-shadow animate-pulse mb-8" />

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl card-shadow overflow-hidden">
              <div className="h-52 bg-gray-100 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-4/5 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-2/5 animate-pulse" />
                <div className="flex gap-3 pt-1">
                  <div className="h-3 bg-gray-100 rounded w-16 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded w-16 animate-pulse" />
                </div>
                <div className="pt-3 border-t border-[--color-border]">
                  <div className="h-6 bg-gray-100 rounded w-28 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
