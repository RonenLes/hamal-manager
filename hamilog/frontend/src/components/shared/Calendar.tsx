"use client";

type CalendarMarker = {
  date: string;
  label: string;
  tone?: "blue" | "emerald" | "orange" | "red" | "slate";
};

type CalendarProps = {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  markers?: CalendarMarker[];
  selectedDates?: string[];
  removalDates?: string[];
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Converts the value to a date input value.
function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Handles the from date input value logic.
function fromDateInputValue(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

// Handles the add months logic.
function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

// Returns the month days.
function getMonthDays(viewDate: Date) {
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0,
  ).getDate();
  const leadingBlanks = firstDay.getDay();

  return [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      return new Date(viewDate.getFullYear(), viewDate.getMonth(), index + 1);
    }),
  ];
}

// Returns the marker classes.
function getMarkerClasses(tone: CalendarMarker["tone"] = "blue") {
  if (tone === "emerald") return "bg-emerald-500/15 text-emerald-300";
  if (tone === "orange") return "bg-orange-500/15 text-orange-300";
  if (tone === "red") return "bg-red-500/15 text-red-300";
  if (tone === "slate") return "bg-slate-500/15 text-muted";
  return "bg-blue-500/15 text-blue-300";
}

// Renders the calendar component.
export default function Calendar({
  selectedDate,
  onSelectDate,
  markers = [],
  selectedDates = [],
  removalDates = [],
}: CalendarProps) {
  const selected = fromDateInputValue(selectedDate);
  const monthDays = getMonthDays(selected);
  const markersByDate = markers.reduce<Record<string, CalendarMarker[]>>(
    (groups, marker) => {
      groups[marker.date] = [...(groups[marker.date] ?? []), marker];
      return groups;
    },
    {},
  );
  const monthLabel = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(selected);

  return (
    <section className="rounded-2xl border border-app bg-card p-5 shadow-xl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectDate(toDateInputValue(addMonths(selected, -1)))}
            className="rounded-xl border border-app bg-card-soft px-3 py-2 text-sm font-black text-main transition hover:bg-card-soft"
            aria-label="Previous month"
          >
            {"<"}
          </button>
          <h2 className="min-w-44 text-center text-xl font-black text-main">
            {monthLabel}
          </h2>
          <button
            type="button"
            onClick={() => onSelectDate(toDateInputValue(addMonths(selected, 1)))}
            className="rounded-xl border border-app bg-card-soft px-3 py-2 text-sm font-black text-main transition hover:bg-card-soft"
            aria-label="Next month"
          >
            {">"}
          </button>
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(event) => onSelectDate(event.target.value)}
          className="rounded-xl border border-app bg-input px-4 py-2 text-sm text-main outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-muted">
        {weekdayLabels.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {monthDays.map((date, index) => {
          if (!date) {
            return <div key={`blank-${index}`} className="min-h-24" />;
          }

          const value = toDateInputValue(date);
          const isSelected = value === selectedDate;
          const isMultiSelected = selectedDates.includes(value);
          const isRemovalSelected = removalDates.includes(value);
          const dayMarkers = markersByDate[value] ?? [];

          return (
            <button
              key={value}
              type="button"
              onClick={() => onSelectDate(value)}
              className={`min-h-24 rounded-xl border p-2 text-left transition ${
                isRemovalSelected
                  ? "border-red-500 bg-red-500/10"
                  : isMultiSelected
                  ? "border-emerald-500 bg-emerald-500/10"
                  : isSelected
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-app bg-card-soft hover:border-blue-500/60"
              }`}
            >
              <span className="text-sm font-black text-main">
                {date.getDate()}
              </span>
              <div className="mt-2 space-y-1">
                {dayMarkers.slice(0, 2).map((marker, markerIndex) => (
                  <p
                    key={`${marker.label}-${markerIndex}`}
                    className={`truncate rounded-md px-1.5 py-0.5 text-[10px] font-bold ${getMarkerClasses(
                      marker.tone,
                    )}`}
                  >
                    {marker.label}
                  </p>
                ))}
                {dayMarkers.length > 2 && (
                  <p className="text-[10px] font-bold text-muted">
                    +{dayMarkers.length - 2} more
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export { toDateInputValue };
