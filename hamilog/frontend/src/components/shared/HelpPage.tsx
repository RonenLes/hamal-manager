"use client";

import { useState } from "react";

import BackToMenuButton from "@/components/shared/BackToMenuButton";
import SupportTicketPanel from "@/components/shared/SupportTicketPanel";

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

function HelpPageCard({ title, href, description, features }: HelpPageItem) {
  return (
    <article className="rounded-2xl border border-app bg-card p-5 shadow-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-main">{title}</h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>

        <span className="shrink-0 rounded-full border border-app bg-card-soft px-3 py-1 text-xs font-bold text-soft">
          {href}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2 text-sm text-muted">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

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

          <h1 className="mt-1 text-3xl font-black">Help</h1>

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
          <section className="mt-8 rounded-2xl border border-app bg-card p-5 shadow-xl">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
              <div>
                <h2 className="text-xl font-black text-main">
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
