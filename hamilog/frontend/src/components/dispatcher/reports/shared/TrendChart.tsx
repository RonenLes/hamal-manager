type TrendPoint = {
  label: string;
  created: number;
  delivered: number;
};

type TrendChartProps = {
  title: string;
  points: TrendPoint[];
};

const GRIDLINES = [100, 66, 33, 0];

// Renders the trend chart component.
export default function TrendChart({ title, points }: TrendChartProps) {
  const max = Math.max(
    ...points.flatMap((point) => [point.created, point.delivered]),
    1,
  );

  return (
    <div className="rounded-xl border border-app bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h2 className="text-lg font-semibold text-main">{title}</h2>
          <p className="mt-1 text-sm text-muted">Created versus delivered missions.</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
            Created
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            Delivered
          </span>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto sm:mt-6">
        <div className="min-w-[560px]">
          <div className="relative h-44 sm:h-52">
            {GRIDLINES.map((line) => (
              <div
                key={line}
                className="absolute inset-x-0 flex items-center gap-2"
                style={{ top: `${100 - line}%` }}
              >
                <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-soft">
                  {Math.round((line / 100) * max)}
                </span>
                <span className="h-px flex-1 bg-[var(--border-app)]" />
              </div>
            ))}

            <div className="absolute inset-0 left-10 flex items-end gap-3 sm:gap-4">
              {points.map((point) => (
                <div
                  key={point.label}
                  className="flex h-full flex-1 items-end justify-center gap-1.5"
                >
                  <div
                    className="w-4 rounded-t-md bg-blue-500 transition-opacity hover:opacity-80 sm:w-5"
                    style={{ height: `${Math.max((point.created / max) * 100, point.created ? 2 : 0)}%` }}
                    title={`${point.label} · ${point.created} created`}
                  />
                  <div
                    className="w-4 rounded-t-md bg-emerald-500 transition-opacity hover:opacity-80 sm:w-5"
                    style={{ height: `${Math.max((point.delivered / max) * 100, point.delivered ? 2 : 0)}%` }}
                    title={`${point.label} · ${point.delivered} delivered`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 flex gap-3 pl-10 sm:gap-4">
            {points.map((point) => (
              <div key={point.label} className="min-w-0 flex-1 text-center">
                <p className="truncate text-xs text-main">{point.label}</p>
                <p className="text-xs tabular-nums text-soft">
                  {point.created}/{point.delivered}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
