import { useState } from "react";

import type { DriverScorePoint } from "@/lib/driver-metrics";

type DriverScoreGraphProps = {
  datePoints: DriverScorePoint[];
  missionPoints: DriverScorePoint[];
};

// Builds the path.
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

// Builds a closed area path (line dropped to the baseline) for the fill.
function buildAreaPath(points: DriverScorePoint[]) {
  if (points.length === 0) return "";

  const line = points
    .map((point, index) => {
      const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
      const y = 100 - point.score;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const lastX = points.length === 1 ? 50 : 100;
  const firstX = points.length === 1 ? 50 : 0;

  return `${line} L ${lastX} 100 L ${firstX} 100 Z`;
}

// Returns the point position.
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

// Renders the driver score graph component.
export default function DriverScoreGraph({
  datePoints,
  missionPoints,
}: DriverScoreGraphProps) {
  const [mode, setMode] = useState<"date" | "mission">("date");
  const points = mode === "date" ? datePoints : missionPoints;
  const path = buildPath(points);
  const areaPath = buildAreaPath(points);
  const latestScore = points[points.length - 1]?.score ?? 0;

  return (
    <section className="relative z-10 rounded-xl border border-app bg-card px-5 py-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-main">Driver Score Trend</h3>
          <p className="mt-1 text-sm text-muted">
            Score movement from stored driver history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-xl border border-app bg-card-soft p-1">
            {(["date", "mission"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${
                  mode === item
                    ? "bg-blue-600 text-white"
                    : "text-muted hover:text-main"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-app bg-card-soft px-4 py-2 text-right">
            <p className="text-xs text-soft">Latest</p>
            <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
              {latestScore}%
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-app bg-card-soft p-4">
        <div className="relative h-64">
          <div className="absolute inset-y-0 left-0 flex flex-col justify-between pr-3 text-xs font-medium text-soft">
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
              <path d={areaPath} fill="rgb(59 130 246)" fillOpacity="0.12" stroke="none" />
              <path
                d={path}
                fill="none"
                stroke="rgb(59 130 246)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
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
