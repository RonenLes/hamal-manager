import type { GroupedBarGroup, GroupedBarSeries } from "./types";

type GroupedBarChartProps = {
  title: string;
  description: string;
  groups: GroupedBarGroup[];
  series: GroupedBarSeries[];
};

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
    <div className="rounded-2xl border border-app bg-card p-4 shadow-xl sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-main">{title}</h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted">
          {series.map((item) => (
            <span key={item.key} className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${item.color}`} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto sm:mt-6">
        <div className="flex min-h-72 min-w-[620px] items-end gap-3 rounded-xl bg-card-soft px-4 pb-4 pt-6 sm:min-h-80 sm:min-w-[780px] sm:px-5 sm:pb-5 sm:pt-8">
          {groups.length === 0 && (
            <div className="flex flex-1 items-center justify-center self-stretch text-sm text-muted">
              No data for this selected range.
            </div>
          )}

          {groups.map((group) => (
            <div key={group.label} className="flex min-w-24 flex-1 flex-col items-center gap-3">
              <div className="flex h-48 w-full items-end justify-center gap-1 rounded-xl border border-app bg-app/40 px-2 py-3 sm:h-56">
                {series.map((item) => {
                  const value = group.values[item.key] ?? 0;
                  return (
                    <div
                      key={item.key}
                      className={`flex w-4 items-start justify-center rounded-t ${item.color} pt-1 text-[10px] font-black text-white`}
                      style={{
                        height: `${Math.max((value / max) * 100, value ? 6 : 0)}%`,
                      }}
                      title={`${group.label} ${item.label}: ${value}`}
                    >
                      {value || ""}
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-xs font-bold text-main">{group.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
