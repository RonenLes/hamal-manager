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

// Renders the filter checkbox component.
function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center justify-between rounded-xl border border-app bg-app px-3 py-2.5 text-left text-xs transition hover:bg-card-soft sm:px-4 sm:py-3 sm:text-sm"
    >
      <span className="text-muted">{label}</span>

      <span
        className={`flex h-6 w-6 items-center justify-center rounded-md border text-sm font-black ${
          checked
            ? "border-emerald-500 bg-emerald-500 text-main"
            : "border-app bg-card-soft text-transparent"
        }`}
      >
        x
      </span>
    </button>
  );
}

// Renders the mission filters component.
export default function MissionFilters({
  filters,
  onToggle,
  onReset,
}: MissionFiltersProps) {
  return (
    <div className="border-b border-app p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-main sm:text-xl">Filters</h2>
        <p className="mt-1 text-sm text-muted">
          Tick filters with x to control the mission list.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <FilterCheckbox
          label="Unassigned"
          checked={filters.unassigned}
          onChange={() => onToggle("unassigned")}
        />
        <FilterCheckbox
          label="Assigned"
          checked={filters.assigned}
          onChange={() => onToggle("assigned")}
        />
        <FilterCheckbox
          label="Active"
          checked={filters.active}
          onChange={() => onToggle("active")}
        />
        <FilterCheckbox
          label="Cooling"
          checked={filters.cooling}
          onChange={() => onToggle("cooling")}
        />
        <FilterCheckbox
          label="Order by delivery date"
          checked={filters.orderByDeliveryDate}
          onChange={() => onToggle("orderByDeliveryDate")}
        />

        <div className="col-span-2 sm:col-span-3 lg:col-span-5">
          <p className="mb-2 text-sm font-bold text-muted">Urgency</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <FilterCheckbox
              label="Urgency: Low"
              checked={filters.urgencyLow}
              onChange={() => onToggle("urgencyLow")}
            />
            <FilterCheckbox
              label="Urgency: Medium"
              checked={filters.urgencyMedium}
              onChange={() => onToggle("urgencyMedium")}
            />
            <FilterCheckbox
              label="Urgency: High"
              checked={filters.urgencyHigh}
              onChange={() => onToggle("urgencyHigh")}
            />
            <FilterCheckbox
              label="Urgency: Critical"
              checked={filters.urgencyCritical}
              onChange={() => onToggle("urgencyCritical")}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-xl border border-app bg-card-soft px-3 py-2.5 text-xs font-bold text-main transition hover:bg-card-soft sm:px-4 sm:py-3 sm:text-sm"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
