import FilterChip from "@/components/shared/FilterChip";
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
  { key: "activeDrivers", label: "Active drivers" },
  { key: "activeDeliveryLocations", label: "Active delivery locations" },
  { key: "nonActiveDeliveryLocations", label: "Non-active delivery locations" },
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
    <div className="mb-3 rounded-xl border border-app bg-card-soft px-3 py-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <h2 className="shrink-0 text-sm font-semibold text-main">Map filters</h2>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <FilterChip
              key={option.key}
              label={option.label}
              active={filters[option.key]}
              onClick={() => toggleFilter(option.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
