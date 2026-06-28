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
  return (
    <aside className="h-fit rounded-2xl border border-app bg-card p-5 shadow-xl xl:min-h-[520px]">
      <h2 className="text-lg font-black">Filters</h2>
      <p className="mt-1 text-sm text-muted">Change the reporting period.</p>

      <div className="mt-5 space-y-5">
        <label className="flex items-center justify-between gap-4 rounded-xl border border-app bg-card-soft px-4 py-3">
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

        <label className="block">
          <span className="text-sm font-semibold text-main">Period</span>
          <select
            value={datePreset}
            disabled={manualDates}
            onChange={(event) => onDatePresetChange(event.target.value as DatePreset)}
            className="mt-2 w-full rounded-xl border border-app bg-input px-3 py-3 text-sm text-main outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <option value="last30">Past 30 days</option>
            <option value="thisMonth">This month</option>
            <option value="lastMonth">Last month</option>
          </select>
        </label>

        <div className="grid grid-cols-1 gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-main">From: date</span>
            <input
              type="date"
              value={fromDate}
              disabled={!manualDates}
              onChange={(event) => onFromDateChange(event.target.value)}
              className="mt-2 w-full rounded-xl border border-app bg-input px-3 py-3 text-sm text-main outline-none disabled:cursor-not-allowed disabled:opacity-40"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-main">To: date</span>
            <input
              type="date"
              value={toDate}
              disabled={!manualDates}
              onChange={(event) => onToDateChange(event.target.value)}
              className="mt-2 w-full rounded-xl border border-app bg-input px-3 py-3 text-sm text-main outline-none disabled:cursor-not-allowed disabled:opacity-40"
            />
          </label>
        </div>

        <label className="flex items-center justify-between gap-4 rounded-xl border border-app bg-card-soft px-4 py-3">
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

        <div className="rounded-xl border border-app bg-card-soft p-4 text-sm text-muted">
          <p className="font-semibold text-main">Current range</p>
          <p className="mt-1">{rangeLabel}</p>
        </div>
      </div>
    </aside>
  );
}
