// Skeleton placeholders that mirror real layouts while data loads.
// Uses the shared `.skeleton` shimmer class defined in globals.css.

type SkeletonProps = {
  className?: string;
};

// Renders a single shimmering placeholder block.
export default function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

// A card-shaped panel skeleton: a title row plus a few content lines.
function PanelSkeleton() {
  return (
    <div className="rounded-xl border border-app bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-10" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Full dashboard loading state: header, stat row, and a grid of panels.
export function DashboardSkeleton({ panels = 6 }: { panels?: number }) {
  return (
    <main className="min-h-screen bg-app px-3 py-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 space-y-2 sm:mb-6">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-3 w-40" />
      </div>

      {/* Stat row */}
      <div className="mb-4 flex gap-3 sm:mb-6">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-40 rounded-xl sm:h-28 sm:flex-1" />
        ))}
      </div>

      {/* Panel grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 xl:gap-5">
        {Array.from({ length: panels }).map((_, index) => (
          <PanelSkeleton key={index} />
        ))}
      </div>
    </main>
  );
}
