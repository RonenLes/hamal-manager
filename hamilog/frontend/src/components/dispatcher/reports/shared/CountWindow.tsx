import Link from "next/link";

import type { CountRow } from "./types";

// Renders the count link card component.
function CountLinkCard({
  title,
  value,
  note,
  href,
  color = "blue",
}: CountRow) {
  const colorClasses = {
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    orange: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    red: "border-red-500/30 bg-red-500/10 text-red-300",
    slate: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  };

  const content = (
    <>
      <p className="text-xs font-bold leading-tight sm:text-sm">{title}</p>
      <p className="mt-2 text-2xl font-black leading-none text-main sm:mt-3 sm:text-3xl">{value}</p>
      <p className="mt-2 text-xs leading-snug text-muted sm:text-sm">{note}</p>
    </>
  );

  if (!href) {
    return (
      <div className={`min-h-24 rounded-xl border p-3 sm:min-h-28 sm:p-4 ${colorClasses[color]}`}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`block min-h-24 rounded-xl border p-3 transition sm:min-h-28 hover:-translate-y-0.5 hover:opacity-90 sm:p-5 ${colorClasses[color]}`}
    >
      {content}
    </Link>
  );
}

type CountWindowProps = {
  title: string;
  rows: CountRow[];
};

// Renders the count window component.
export default function CountWindow({ title, rows }: CountWindowProps) {
  return (
    <section className="rounded-2xl border border-app bg-card p-3 shadow-xl sm:p-4">
      <h2 className="text-base font-black text-main sm:text-lg">{title}</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
        {rows.map((row) => (
          <CountLinkCard key={row.title} {...row} />
        ))}
      </div>
    </section>
  );
}
