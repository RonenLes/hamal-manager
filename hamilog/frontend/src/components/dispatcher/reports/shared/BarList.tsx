import type { BarRow } from "./types";

type BarListProps = {
  title: string;
  rows: BarRow[];
  emptyText: string;
};

export default function BarList({ title, rows, emptyText }: BarListProps) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className="rounded-2xl border border-app bg-card p-5 shadow-xl">
      <h2 className="text-lg font-black text-main">{title}</h2>
      <div className="mt-5 space-y-4">
        {rows.length === 0 && <p className="text-sm text-muted">{emptyText}</p>}
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
              <span className="truncate text-muted">{row.label}</span>
              <span className="font-bold text-main">{row.value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-card-soft">
              <div
                className={`h-full rounded-full ${row.color ?? "bg-blue-500"}`}
                style={{
                  width: `${Math.max((row.value / max) * 100, row.value ? 8 : 0)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
