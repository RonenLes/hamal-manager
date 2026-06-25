import type { BarRow } from "./types";

type LargeBarChartProps = {
  title: string;
  description: string;
  rows: BarRow[];
  yLabel: string;
  maxValue?: number;
  valueSuffix?: string;
};

export default function LargeBarChart({
  title,
  description,
  rows,
  yLabel,
  maxValue,
  valueSuffix = "",
}: LargeBarChartProps) {
  const max = maxValue ?? Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className="rounded-2xl border border-app bg-card p-5 shadow-xl">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-black text-main">{title}</h2>
        <p className="text-sm text-muted">{description}</p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="flex min-h-96 min-w-[720px] items-end gap-4 rounded-xl bg-card-soft px-5 pb-5 pt-8">
          <div className="mb-16 flex h-72 w-8 items-center justify-center">
            <span className="-rotate-90 whitespace-nowrap text-xs font-bold uppercase tracking-wider text-muted">
              {yLabel}
            </span>
          </div>

          {rows.length === 0 && (
            <div className="flex flex-1 items-center justify-center self-stretch text-sm text-muted">
              No data for this selected range.
            </div>
          )}

          {rows.map((row) => (
            <div key={row.label} className="flex min-w-24 flex-1 flex-col items-center gap-3">
              <div className="flex h-72 w-full items-end justify-center rounded-xl border border-app bg-app/40 px-3 py-3">
                <div
                  className="flex w-full max-w-14 items-start justify-center rounded-t-lg bg-blue-500 pt-2 text-xs font-black text-white"
                  style={{
                    height: `${Math.max((row.value / max) * 100, row.value ? 8 : 0)}%`,
                  }}
                  title={`${row.label}: ${row.value}${valueSuffix}`}
                >
                  {row.value}
                  {valueSuffix}
                </div>
              </div>
              <p className="max-w-28 text-center text-xs font-bold text-main">
                {row.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
