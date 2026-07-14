"use client";

import FilterPanel from "@/components/shared/FilterPanel";
import FilterChip from "@/components/shared/FilterChip";

export type MissionStatusFilter = {
  unassigned: boolean;
  assigned: boolean;
  active: boolean;
  cooling: boolean;
  urgencyLow: boolean;
  urgencyMedium: boolean;
  urgencyHigh: boolean;
  urgencyCritical: boolean;
  orderByDeliveryDate: boolean;
};

type MissionFiltersProps = {
  filters: MissionStatusFilter;
  onToggle: (key: keyof MissionStatusFilter) => void;
  onReset: () => void;
};

const STATUS_FILTERS: { key: keyof MissionStatusFilter; label: string }[] = [
  { key: "unassigned", label: "Unassigned" },
  { key: "assigned", label: "Assigned" },
  { key: "active", label: "Active" },
  { key: "cooling", label: "Cooling" },
];

const URGENCY_FILTERS: {
  key: keyof MissionStatusFilter;
  label: string;
  tone: "slate" | "blue" | "orange" | "red";
}[] = [
  { key: "urgencyLow", label: "Low", tone: "slate" },
  { key: "urgencyMedium", label: "Medium", tone: "blue" },
  { key: "urgencyHigh", label: "High", tone: "orange" },
  { key: "urgencyCritical", label: "Critical", tone: "red" },
];

// Renders the mission filters component.
export default function MissionFilters({
  filters,
  onToggle,
  onReset,
}: MissionFiltersProps) {
  const activeFilters = [...STATUS_FILTERS, ...URGENCY_FILTERS].filter(
    (filter) => filters[filter.key]
  );
  const summary = activeFilters.map((filter) => filter.label).join(", ");

  return (
    <FilterPanel
      title="Filters"
      activeCount={activeFilters.length}
      summary={summary}
      onClear={onReset}
    >
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold text-soft">Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <FilterChip
                key={filter.key}
                label={filter.label}
                active={filters[filter.key]}
                onClick={() => onToggle(filter.key)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-soft">Urgency</p>
          <div className="flex flex-wrap gap-2">
            {URGENCY_FILTERS.map((filter) => (
              <FilterChip
                key={filter.key}
                label={filter.label}
                active={filters[filter.key]}
                onClick={() => onToggle(filter.key)}
                tone={filter.tone}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-app pt-3">
          <p className="mb-2 text-xs font-semibold text-soft">Sort</p>
          <FilterChip
            label="Order by delivery date"
            active={filters.orderByDeliveryDate}
            onClick={() => onToggle("orderByDeliveryDate")}
            tone="emerald"
          />
        </div>
      </div>
    </FilterPanel>
  );
}
