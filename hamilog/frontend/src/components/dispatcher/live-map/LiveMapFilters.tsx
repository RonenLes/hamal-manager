import type { LiveMapFilters } from "./types";

type LiveMapFilterKey = keyof LiveMapFilters;

type LiveMapFiltersProps = {
  filters: LiveMapFilters;
  onChange: (filters: LiveMapFilters) => void;
};

const filterOptions: {
  key: LiveMapFilterKey;
  label: string;
  description: string;
}[] = [
  {
    key: "activeDrivers",
    label: "Active drivers",
    description: "Show live driver markers for active deliveries.",
  },
  {
    key: "activeDeliveryLocations",
    label: "Active delivery locations",
    description: "Show locations for deliveries currently in transit.",
  },
  {
    key: "nonActiveDeliveryLocations",
    label: "Non-active delivery locations",
    description: "Show assigned, unassigned, delivered, and cancelled locations.",
  },
];

export const defaultLiveMapFilters: LiveMapFilters = {
  activeDrivers: true,
  activeDeliveryLocations: true,
  nonActiveDeliveryLocations: true,
};

export default function LiveMapFiltersPanel({
  filters,
  onChange,
}: LiveMapFiltersProps) {
  function toggleFilter(key: LiveMapFilterKey) {
    onChange({
      ...filters,
      [key]: !filters[key],
    });
  }

  return (
    <section className="mb-6 rounded-2xl border border-app bg-card p-5 shadow-xl">
      <div className="mb-4">
        <h2 className="text-lg font-black text-main">Map Filters</h2>
        <p className="mt-1 text-sm text-muted">
          Choose which live map markers are visible.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {filterOptions.map((option) => (
          <label
            key={option.key}
            className="flex min-h-24 cursor-pointer gap-3 rounded-xl border border-app bg-card-soft p-4 transition hover:bg-[var(--bg-card-soft)]"
          >
            <input
              type="checkbox"
              checked={filters[option.key]}
              onChange={() => toggleFilter(option.key)}
              className="mt-1 h-4 w-4 accent-blue-500"
            />

            <span>
              <span className="block font-bold text-main">{option.label}</span>
              <span className="mt-1 block text-sm leading-5 text-muted">
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
