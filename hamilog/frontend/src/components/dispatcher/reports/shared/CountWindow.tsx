import Link from "next/link";

import type { CountRow } from "./types";

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
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-3 text-3xl font-black text-main">{value}</p>
      <p className="mt-2 text-sm text-muted">{note}</p>
    </>
  );

  if (!href) {
    return (
      <div className={`rounded-2xl border p-5 ${colorClasses[color]}`}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`block rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:opacity-90 ${colorClasses[color]}`}
    >
      {content}
    </Link>
  );
}

type CountWindowProps = {
  title: string;
  rows: CountRow[];
};

export default function CountWindow({ title, rows }: CountWindowProps) {
  return (
    <section className="rounded-2xl border border-app bg-card p-5 shadow-xl">
      <h2 className="text-lg font-black text-main">{title}</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {rows.map((row) => (
          <CountLinkCard key={row.title} {...row} />
        ))}
      </div>
    </section>
  );
}
