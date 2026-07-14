import type { GroupedBarGroup, GroupedBarSeries } from "./types";

type GroupedBarChartProps = {
  title: string;
  description: string;
  groups: GroupedBarGroup[];
  series: GroupedBarSeries[];
};

const GRIDLINES = [100, 75, 50, 25, 0];

// Renders the grouped bar chart component.
export default function GroupedBarChart({
  title,
  description,
  groups,
  series,
}: GroupedBarChartProps) {
  const max = Math.max(
    ...groups.flatMap((group) => series.map((item) => group.values[item.key] ?? 0)),
    1,
  );

  return (
    <div className="rounded-xl border border-app bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-main sm:text-xl">{title}</h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted">
          {series.map((item) => (
            <span key={item.key} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto sm:mt-6">
        {groups.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted">
            No data for this selected range.
          </div>
        ) : (
          <div className="min-w-[560px] sm:min-w-[720px]">
            {/* Plot area with recessive gridlines behind the grouped bars */}
            <div className="relative h-64">
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

              <div className="absolute inset-0 left-10 flex items-end gap-3 sm:gap-5">
                {groups.map((group) => (
                  <div
                    key={group.label}
                    className="flex h-full flex-1 items-end justify-center gap-1.5"
                  >
                    {series.map((item) => {
                      const value = group.values[item.key] ?? 0;
                      const pct = Math.max((value / max) * 100, value ? 2 : 0);
                      return (
                        <div
                          key={item.key}
                          className={`w-4 rounded-t-md ${item.color} transition-opacity hover:opacity-80 sm:w-5`}
                          style={{ height: `${pct}%` }}
                          title={`${group.label} · ${item.label}: ${value}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* X axis labels */}
            <div className="mt-2 flex gap-3 pl-10 sm:gap-5">
              {groups.map((group) => (
                <p
                  key={group.label}
                  className="flex-1 text-center text-xs text-muted"
                >
                  {group.label}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
