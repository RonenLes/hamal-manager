import type { DriverScorePoint } from "@/lib/driver-metrics";

type DriverScoreGraphProps = {
  points: DriverScorePoint[];
};

function buildPath(points: DriverScorePoint[]) {
  if (points.length === 0) return "";

  return points
    .map((point, index) => {
      const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
      const y = 100 - point.score;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function getPointPosition(
  point: DriverScorePoint,
  index: number,
  points: DriverScorePoint[]
) {
  return {
    x: points.length === 1 ? 50 : (index / (points.length - 1)) * 100,
    y: 100 - point.score,
  };
}

export default function DriverScoreGraph({ points }: DriverScoreGraphProps) {
  const path = buildPath(points);
  const latestScore = points[points.length - 1]?.score ?? 0;

  return (
    <section className="border-t border-app bg-card-soft px-5 py-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-main">Driver Score Trend</h3>
          <p className="mt-1 text-sm text-muted">
            Score movement across recent assigned deliveries.
          </p>
        </div>

        <div className="rounded-xl border border-app bg-card px-4 py-2 text-right">
          <p className="text-xs uppercase tracking-wider text-soft">Latest</p>
          <p className="text-2xl font-black text-emerald-300">
            {latestScore}%
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-app bg-card p-4">
        <div className="relative h-64">
          <div className="absolute inset-y-0 left-0 flex flex-col justify-between pr-3 text-xs font-bold text-soft">
            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
            <span>0</span>
          </div>

          <div className="absolute inset-y-0 left-10 right-0">
            {[0, 25, 50, 75, 100].map((line) => (
              <div
                key={line}
                className="absolute left-0 right-0 border-t border-[var(--border-app)]"
                style={{ top: `${line}%` }}
              />
            ))}

            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
              role="img"
              aria-label="Driver score line graph"
            >
              <path
                d={path}
                fill="none"
                stroke="rgb(59 130 246)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
              />
              {points.map((point, index) => {
                const position = getPointPosition(point, index, points);

                return (
                  <circle
                    key={`${point.label}-${index}`}
                    cx={position.x}
                    cy={position.y}
                    r="2"
                    fill="rgb(16 185 129)"
                    stroke="rgb(15 23 42)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        <div className="ml-10 mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
          {points.map((point, index) => (
            <div key={`${point.label}-${index}`} className="min-w-0 text-center">
              <p className="truncate text-xs font-bold text-main">
                {point.label}
              </p>
              <p className="text-xs text-muted">{point.score}%</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
