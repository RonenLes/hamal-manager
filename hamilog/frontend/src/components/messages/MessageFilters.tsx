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

export default function MessageFilters({
  activeTab,
  activeFilter,
  onTabChange,
  onFilterChange,
}: MessageFiltersProps) {
  return (
    <section className="rounded-2xl border border-app bg-card p-5 shadow-xl">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div>
        <p className="text-xs font-bold uppercase tracking-wider text-soft">
          People
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "border border-app bg-card-soft text-main hover:bg-[var(--bg-card-soft)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

        <div>
        <p className="text-xs font-bold uppercase tracking-wider text-soft">
          Status
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => onFilterChange(filter.id)}
              className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                activeFilter === filter.id
                  ? "bg-emerald-600 text-white"
                  : "border border-app bg-card-soft text-main hover:bg-[var(--bg-card-soft)]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}
