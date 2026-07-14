"use client";

import { useState } from "react";

import BackToMenuButton from "@/components/shared/BackToMenuButton";
import SupportTicketPanel from "@/components/shared/SupportTicketPanel";
import CollapseDetailsButton from "@/components/shared/CollapseDetailsButton";

export type HelpPageItem = {
  title: string;
  href: string;
  description: string;
  features: string[];
};

type HelpPageProps = {
  guideLabel: string;
  intro: string;
  backHref: string;
  pages: HelpPageItem[];
};

// Renders the help page card component.
function HelpPageCard({ title, href, description, features }: HelpPageItem) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <article
      className={`rounded-xl border border-app bg-card p-5 shadow-sm ${
        isExpanded
          ? "relative z-10 outline outline-2 outline-blue-500/70 shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
          : ""
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-main">{title}</h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-app bg-card-soft px-3 py-1 text-xs font-bold text-soft">
            {href}
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${title}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-app bg-card-soft text-sm font-semibold text-main transition hover:bg-app"
          >
            {isExpanded ? "^" : "v"}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 border-t border-blue-500/40 pt-4">
          <CollapseDetailsButton onCollapse={() => setIsExpanded(false)} />
          <ul className="space-y-2">
            {features.map((feature) => (
              <li key={feature} className="flex gap-2 text-sm text-muted">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

// Renders the help page component.
export default function HelpPage({
  guideLabel,
  intro,
  backHref,
  pages,
}: HelpPageProps) {
  const [isTicketOpen, setIsTicketOpen] = useState(false);

  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <div className="mb-4">
            <BackToMenuButton href={backHref} />
          </div>

          <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-blue-400">
            {guideLabel}
          </p>

          <h1 className="mt-1 text-3xl font-semibold">Help</h1>

          <p className="mt-2 max-w-3xl text-muted">{intro}</p>
        </header>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {pages.map((page) => (
            <HelpPageCard key={page.href} {...page} />
          ))}
        </section>

        {isTicketOpen ? (
          <SupportTicketPanel
            className="mt-8"
            onClose={() => setIsTicketOpen(false)}
          />
        ) : (
          <section className="mt-8 rounded-xl border border-app bg-card p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
              <div>
                <h2 className="text-xl font-semibold text-main">
                  Contact Support
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Open a ticket for technical problems, account issues,
                  mission questions, driver status problems, or anything else
                  that needs support.
                </p>
              </div>

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setIsTicketOpen(true)}
                  className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  Open Support Ticket
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
