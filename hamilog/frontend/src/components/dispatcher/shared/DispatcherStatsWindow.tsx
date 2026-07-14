"use client";

import { useRef, type ReactNode } from "react";

type DispatcherStatsWindowProps = {
  children: ReactNode;
  className?: string;
};

export default function DispatcherStatsWindow({
  children,
  className = "",
}: DispatcherStatsWindowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  function scrollStats(direction: "left" | "right") {
    rowRef.current?.scrollBy({
      left: direction === "left" ? -180 : 180,
      behavior: "smooth",
    });
  }

  return (
    <section
      className={`mb-4 rounded-xl border border-app bg-card p-2 shadow-sm sm:mb-6 sm:p-3 ${className}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => scrollStats("left")}
          className="flex h-9 w-8 shrink-0 items-center justify-center rounded-xl border border-app bg-card-soft text-sm font-semibold text-muted transition hover:text-main sm:hidden"
          aria-label="Scroll stats left"
        >
          {"<"}
        </button>

        <div ref={rowRef} className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex min-w-max gap-2 sm:gap-3 lg:w-full lg:min-w-0">
            {children}
          </div>
        </div>

        <button
          type="button"
          onClick={() => scrollStats("right")}
          className="flex h-9 w-8 shrink-0 items-center justify-center rounded-xl border border-app bg-card-soft text-sm font-semibold text-muted transition hover:text-main sm:hidden"
          aria-label="Scroll stats right"
        >
          {">"}
        </button>
      </div>
    </section>
  );
}
