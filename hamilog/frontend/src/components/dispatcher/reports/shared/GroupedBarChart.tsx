import type { GroupedBarGroup, GroupedBarSeries } from "./types";

type GroupedBarChartProps = {
  title: string;
  description: string;
  groups: GroupedBarGroup[];
  series: GroupedBarSeries[];
};

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
    <div className="rounded-2xl border border-app bg-card p-5 shadow-xl">
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

      <div className="mt-6 overflow-x-auto">
        <div className="flex min-h-80 min-w-[780px] items-end gap-3 rounded-xl bg-card-soft px-5 pb-5 pt-8">
          {groups.length === 0 && (
            <div className="flex flex-1 items-center justify-center self-stretch text-sm text-muted">
              No data for this selected range.
            </div>
          )}

          {groups.map((group) => (
            <div key={group.label} className="flex min-w-24 flex-1 flex-col items-center gap-3">
              <div className="flex h-56 w-full items-end justify-center gap-1 rounded-xl border border-app bg-app/40 px-2 py-3">
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
