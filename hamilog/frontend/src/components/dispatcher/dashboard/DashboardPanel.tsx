"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

type DashboardPanelProps = {
  title: string;
  count?: number;
  accent?: "blue" | "orange" | "red" | "green" | "purple";
  seeAllHref?: string;
  children: ReactNode;
};

const accentClasses = {
  blue: "from-blue-600 to-blue-700",
  orange: "from-orange-600 to-orange-700",
  red: "from-red-600 to-red-700",
  green: "from-emerald-600 to-teal-700",
  purple: "from-violet-600 to-indigo-700",
};

// Renders the dashboard panel component.
export default function DashboardPanel({
  title,
  count,
  accent = "blue",
  seeAllHref,
  children,
}: DashboardPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className="overflow-hidden rounded-xl border border-app bg-card shadow-sm">
      <header
        className={`flex items-center justify-between bg-gradient-to-r ${accentClasses[accent]} px-4 py-3 sm:px-5 sm:py-4`}
      >
        <h2 className="text-base font-bold text-white sm:text-lg">{title}</h2>

        <div className="flex items-center gap-2">
          {count !== undefined && (
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-900">
              {count}
            </span>
          )}

          {seeAllHref && (
            <Link
              href={seeAllHref}
              className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white transition hover:bg-white/25"
            >
              See all
            </Link>
          )}

          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-white/25"
            aria-expanded={!collapsed}
          >
            {collapsed ? "Open" : "Close"}
          </button>
        </div>
      </header>

      {!collapsed && (
        <div className="max-h-[340px] overflow-y-auto p-4 sm:p-5">
          {children}
        </div>
      )}
    </section>
  );
}
