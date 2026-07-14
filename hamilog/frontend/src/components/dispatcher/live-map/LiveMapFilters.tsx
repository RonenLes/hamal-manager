import type { LiveMapFilters } from "./types";

type LiveMapFilterKey = keyof LiveMapFilters;

type LiveMapFiltersProps = {
  filters: LiveMapFilters;
  onChange: (filters: LiveMapFilters) => void;
};

const filterOptions: {
  key: LiveMapFilterKey;
  label: string;
}[] = [
  {
    key: "activeDrivers",
    label: "Active drivers",
  },
  {
    key: "activeDeliveryLocations",
    label: "Active delivery locations",
  },
  {
    key: "nonActiveDeliveryLocations",
    label: "Non-active delivery locations",
  },
];

export const defaultLiveMapFilters: LiveMapFilters = {
  activeDrivers: true,
  activeDeliveryLocations: true,
  nonActiveDeliveryLocations: true,
};

// Renders the live map filters panel component.
export default function LiveMapFiltersPanel({
  filters,
  onChange,
}: LiveMapFiltersProps) {
  // Toggles the filter.
  function toggleFilter(key: LiveMapFilterKey) {
    onChange({
      ...filters,
      [key]: !filters[key],
    });
  }

  return (
    <div className="mb-3 rounded-xl border border-app bg-card-soft px-3 py-2">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <h2 className="shrink-0 text-sm font-semibold text-main">Map Filters</h2>

        <div className="flex min-w-0 flex-wrap gap-2 lg:flex-1 lg:flex-nowrap">
          {filterOptions.map((option) => (
            <label
              key={option.key}
              className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-app bg-card px-2.5 py-2 text-xs font-bold text-main transition hover:bg-[var(--bg-card-soft)] lg:flex-1"
            >
              <input
                type="checkbox"
                checked={filters[option.key]}
                onChange={() => toggleFilter(option.key)}
                className="h-3.5 w-3.5 shrink-0 accent-blue-500"
              />

              <span className="truncate">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
