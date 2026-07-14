"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type FilterPanelProps = {
  title?: string;
  // Number of active filters — shown as a badge and gates the Clear button.
  activeCount?: number;
  // Short text shown in the collapsed bar (e.g. the active filter labels).
  summary?: string;
  onClear?: () => void;
  // Sticks the bar under the top nav so it stays reachable on long pages.
  sticky?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
};

// Renders a collapsible filter bar that expands as a dropdown overlay, so
// toggling filters never reflows the list beneath it.
export default function FilterPanel({
  title = "Filters",
  activeCount = 0,
  summary,
  onClear,
  sticky = true,
  defaultOpen = false,
  children,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  return (
    <div
      ref={rootRef}
      className={`relative mb-4 ${sticky ? "sticky top-16 z-20" : ""}`}
    >
      <div className="flex items-center justify-between gap-3 rounded-xl border border-app bg-card px-3 py-2.5 shadow-sm sm:px-4">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 fill-none stroke-current text-muted transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          <span className="shrink-0 text-sm font-semibold text-main">{title}</span>
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white">
              {activeCount}
            </span>
          )}
          {!isOpen && summary && (
            <span className="truncate text-sm text-muted">· {summary}</span>
          )}
        </button>

        {onClear && activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-muted transition hover:bg-card-soft hover:text-main"
          >
            Clear
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-xl border border-app bg-card p-3 shadow-lg sm:p-4">
          {children}
        </div>
      )}
    </div>
  );
}
