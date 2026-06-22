type TrendPoint = {
  label: string;
  created: number;
  delivered: number;
};

type TrendChartProps = {
  title: string;
  points: TrendPoint[];
};

export default function TrendChart({ title, points }: TrendChartProps) {
  const max = Math.max(
    ...points.flatMap((point) => [point.created, point.delivered]),
    1,
  );

  return (
    <div className="rounded-2xl border border-app bg-card p-5 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-main">{title}</h2>
          <p className="mt-1 text-sm text-muted">Created versus delivered missions.</p>
        </div>
        <div className="flex gap-3 text-xs text-muted">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Created
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Delivered
          </span>
        </div>
      </div>

      <div className="mt-6 grid min-h-64 grid-cols-1 gap-4 sm:grid-cols-6">
        {points.map((point) => (
          <div key={point.label} className="flex min-h-56 flex-col justify-end gap-3">
            <div className="flex h-44 items-end justify-center gap-2 rounded-xl bg-card-soft px-3 py-3">
              <div
                className="w-5 rounded-t-md bg-blue-500"
                style={{
                  height: `${Math.max((point.created / max) * 100, point.created ? 6 : 0)}%`,
                }}
                title={`${point.created} created`}
              />
              <div
                className="w-5 rounded-t-md bg-emerald-500"
                style={{
                  height: `${Math.max((point.delivered / max) * 100, point.delivered ? 6 : 0)}%`,
                }}
                title={`${point.delivered} delivered`}
              />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-main">{point.label}</p>
              <p className="text-xs text-muted">
                {point.created}/{point.delivered}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
