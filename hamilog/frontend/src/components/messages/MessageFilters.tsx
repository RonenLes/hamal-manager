import FilterChip from "@/components/shared/FilterChip";
import type { ParticipantTab, PresenceFilter } from "./types";

const tabs: { id: ParticipantTab; label: string }[] = [
  { id: "drivers", label: "Drivers" },
  { id: "dispatchers", label: "Dispatchers" },
];

const filters: { id: PresenceFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "online", label: "Online" },
  { id: "offline", label: "Offline" },
  { id: "on_mission", label: "On mission" },
];

type MessageFiltersProps = {
  activeTab: ParticipantTab;
  activeFilter: PresenceFilter;
  onTabChange: (tab: ParticipantTab) => void;
  onFilterChange: (filter: PresenceFilter) => void;
};

// Renders the message filters component.
export default function MessageFilters({
  activeTab,
  activeFilter,
  onTabChange,
  onFilterChange,
}: MessageFiltersProps) {
  return (
    <section className="rounded-xl border border-app bg-card p-4 shadow-sm sm:p-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-soft">People</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <FilterChip
                key={tab.id}
                label={tab.label}
                active={activeTab === tab.id}
                onClick={() => onTabChange(tab.id)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-soft">Status</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <FilterChip
                key={filter.id}
                label={filter.label}
                active={activeFilter === filter.id}
                onClick={() => onFilterChange(filter.id)}
                tone="emerald"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
