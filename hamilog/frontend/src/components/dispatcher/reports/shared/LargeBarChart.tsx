import type { BarRow } from "./types";

type LargeBarChartProps = {
  title: string;
  description: string;
  rows: BarRow[];
  yLabel: string;
  maxValue?: number;
  valueSuffix?: string;
};

const GRIDLINES = [100, 75, 50, 25, 0];

// Renders the large bar chart component.
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
    <div className="rounded-xl border border-app bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-main sm:text-xl">{title}</h2>
        <p className="text-sm text-muted">{description}</p>
      </div>

      <div className="mt-5 overflow-x-auto sm:mt-6">
        <div className="flex min-w-[560px] gap-2 sm:min-w-[680px]">
          <div className="flex items-center justify-center pb-7">
            <span className="-rotate-90 whitespace-nowrap text-xs font-medium text-soft">
              {yLabel}
            </span>
          </div>

          <div className="flex-1">
            {rows.length === 0 ? (
              <div className="flex h-72 items-center justify-center text-sm text-muted">
                No data for this selected range.
              </div>
            ) : (
              <>
                {/* Plot area with recessive gridlines behind the bars */}
                <div className="relative h-72">
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
                    {rows.map((row) => {
                      const pct = Math.max((row.value / max) * 100, row.value ? 2 : 0);
                      return (
                        <div
                          key={row.label}
                          className="flex h-full flex-1 items-end justify-center"
                        >
                          <div
                            className="relative w-full max-w-12 rounded-t-md bg-blue-500 transition-colors hover:bg-blue-400"
                            style={{ height: `${pct}%` }}
                            title={`${row.label}: ${row.value}${valueSuffix}`}
                          >
                            <span className="absolute inset-x-0 -top-5 text-center text-xs font-semibold tabular-nums text-main">
                              {row.value}
                              {valueSuffix}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* X axis labels, aligned under the bars */}
                <div className="mt-2 flex gap-3 pl-10 sm:gap-4">
                  {rows.map((row) => (
                    <p
                      key={row.label}
                      className="flex-1 text-center text-xs text-muted"
                    >
                      {row.label}
                    </p>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
