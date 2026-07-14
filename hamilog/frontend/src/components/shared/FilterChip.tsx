// A pill-shaped toggle used for list filters. Active state is filled with a
// tone color; inactive is a quiet outline. The filled state signals "selected"
// (no checkmark needed). Tones let severity/status filters carry meaning.

type FilterTone = "blue" | "slate" | "emerald" | "orange" | "red";

type FilterChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: FilterTone;
};

const ACTIVE_TONE: Record<FilterTone, string> = {
  blue: "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300",
  slate: "border-slate-500 bg-slate-500/15 text-slate-700 dark:text-slate-300",
  emerald: "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  orange: "border-orange-500 bg-orange-500/15 text-orange-700 dark:text-orange-300",
  red: "border-red-500 bg-red-500/15 text-red-700 dark:text-red-300",
};

// Renders a single filter chip (pill toggle).
export default function FilterChip({
  label,
  active,
  onClick,
  tone = "blue",
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        active
          ? ACTIVE_TONE[tone]
          : "border-app bg-card-soft text-muted hover:border-blue-500/50 hover:text-main"
      }`}
    >
      {label}
    </button>
  );
}
