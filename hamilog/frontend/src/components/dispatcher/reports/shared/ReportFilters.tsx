"use client";

import { useState } from "react";
import type { DatePreset, ReportFilterProps } from "./types";

// Renders the report filters component.
export default function ReportFilters({
  datePreset,
  manualDates,
  fromDate,
  toDate,
  includeCancelled,
  rangeLabel,
  onDatePresetChange,
  onManualDatesChange,
  onFromDateChange,
  onToDateChange,
  onIncludeCancelledChange,
}: ReportFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-app bg-card-soft">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 p-3 text-left sm:p-4"
      >
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-main sm:text-lg">Filters</h2>
          <p className="mt-0.5 truncate text-sm text-muted">
            {isOpen ? "Change the reporting period." : rangeLabel}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-2 text-sm font-medium text-muted">
          <span className="hidden sm:inline">{isOpen ? "Hide" : "Edit"}</span>
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={`h-5 w-5 fill-none stroke-current transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-app p-3 sm:p-4">
          {/* Mode toggles */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-3 rounded-lg border border-app bg-app px-3 py-2.5">
              <span>
                <span className="block text-sm font-semibold text-main">Choose manually</span>
                <span className="block text-xs text-muted">Use exact calendar dates</span>
              </span>
              <input
                type="checkbox"
                checked={manualDates}
                onChange={(event) => onManualDatesChange(event.target.checked)}
                className="h-5 w-5 accent-blue-600"
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded-lg border border-app bg-app px-3 py-2.5">
              <span>
                <span className="block text-sm font-semibold text-main">Include cancelled</span>
                <span className="block text-xs text-muted">Add cancelled missions to reports</span>
              </span>
              <input
                type="checkbox"
                checked={includeCancelled}
                onChange={(event) => onIncludeCancelledChange(event.target.checked)}
                className="h-5 w-5 accent-blue-600"
              />
            </label>
          </div>

          {/* Period / date range */}
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block min-w-0">
              <span className="text-sm font-semibold text-main">Period</span>
              <select
                value={datePreset}
                disabled={manualDates}
                onChange={(event) => onDatePresetChange(event.target.value as DatePreset)}
                className="mt-2 w-full rounded-lg border border-app bg-input px-3 py-2.5 text-sm text-main outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <option value="last30">Past 30 days</option>
                <option value="thisMonth">This month</option>
                <option value="lastMonth">Last month</option>
              </select>
            </label>

            <label className="block min-w-0">
              <span className="text-sm font-semibold text-main">From date</span>
              <input
                type="date"
                value={fromDate}
                disabled={!manualDates}
                onChange={(event) => onFromDateChange(event.target.value)}
                className="mt-2 w-full min-w-0 rounded-lg border border-app bg-input px-3 py-2.5 text-sm text-main outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              />
            </label>

            <label className="block min-w-0">
              <span className="text-sm font-semibold text-main">To date</span>
              <input
                type="date"
                value={toDate}
                disabled={!manualDates}
                onChange={(event) => onToDateChange(event.target.value)}
                className="mt-2 w-full min-w-0 rounded-lg border border-app bg-input px-3 py-2.5 text-sm text-main outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
