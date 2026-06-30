import type { Mission } from "@/lib/api-client";
import { formatDateTime24 } from "@/lib/date-format";
import { formatIdealDeliveryTime, getMissionDeliveredAt } from "@/lib/mission-time";

import DetailTile from "../shared/DetailTile";
import PriorityBadge from "../shared/PriorityBadge";

export type DriverHistoryState =
  | "active"
  | "assigned"
  | "unassigned"
  | "delivered"
  | "cancelled"
  | "other";

type DriverHistoryEntryProps = {
  mission: Mission;
  state: DriverHistoryState;
  driverName: string;
  isExpanded: boolean;
  onToggle: () => void;
};

// Returns the state label.
function getStateLabel(state: DriverHistoryState) {
  switch (state) {
    case "active":
      return "Active";
    case "assigned":
      return "Assigned";
    case "unassigned":
      return "Unassigned";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    case "other":
      return "Other";
  }
}

// Returns the state classes.
function getStateClasses(state: DriverHistoryState) {
  switch (state) {
    case "active":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "assigned":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "unassigned":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
    case "delivered":
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
    case "cancelled":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    case "other":
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
  }
}

// Returns the state dot classes.
function getStateDotClasses(state: DriverHistoryState) {
  switch (state) {
    case "active":
      return "bg-emerald-400";
    case "assigned":
      return "bg-blue-400";
    case "unassigned":
      return "bg-orange-400";
    case "delivered":
      return "bg-slate-400";
    case "cancelled":
      return "bg-red-400";
    case "other":
      return "bg-slate-400";
  }
}

// Formats the date time for display.
function formatDateTime(dateValue?: string) {
  return formatDateTime24(dateValue);
}

// Renders the driver history entry component.
export default function DriverHistoryEntry({
  mission,
  state,
  driverName,
  isExpanded,
  onToggle,
}: DriverHistoryEntryProps) {
  const deliveredAt = getMissionDeliveredAt(mission);

  return (
    <article
      className={`bg-card ${
        isExpanded
          ? "relative z-10 rounded-xl outline outline-2 outline-blue-500/70 shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
          : ""
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[var(--bg-card-soft)]"
      >
        <div className="flex min-w-0 items-center gap-4">
          <span
            className={`h-3 w-3 shrink-0 rounded-full ${getStateDotClasses(
              state
            )}`}
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-bold text-main">{mission.title}</h3>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${getStateClasses(
                  state
                )}`}
              >
                {getStateLabel(state)}
              </span>
              <PriorityBadge priority={mission.priority} />
            </div>

            <p className="mt-1 truncate text-sm text-muted">
              {mission.pickup?.address || "Pickup TBD"} -&gt;{" "}
              {mission.dropoff?.address || "Dropoff TBD"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-soft">
            {formatDateTime(mission.created_at)}
          </span>
          <span className="text-xl text-muted">{isExpanded ? "^" : "v"}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-blue-500/40 bg-card-soft px-5 py-5">
          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            <DetailTile label="Delivery Status">
              <p
                className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold ${getStateClasses(
                  state
                )}`}
              >
                {getStateLabel(state)}
              </p>
            </DetailTile>

            <DetailTile label="Urgency">
              <PriorityBadge priority={mission.priority} />
            </DetailTile>

            <DetailTile label="Driver">
              <p className="font-semibold text-main">{driverName}</p>
            </DetailTile>

            <DetailTile label="From">
              <p className="font-semibold text-main">
                {mission.pickup?.address || "Pickup location TBD"}
              </p>
            </DetailTile>

            <DetailTile label="To">
              <p className="font-semibold text-main">
                {mission.dropoff?.address || "Dropoff location TBD"}
              </p>
            </DetailTile>

            <DetailTile label="Published / Start Time">
              <p className="font-semibold text-main">
                {formatDateTime(mission.created_at)}
              </p>
            </DetailTile>

            <DetailTile label="Ideal Delivery Time">
              <p className="font-semibold text-main">
                {formatIdealDeliveryTime(mission.ideal_delivery_time)}
              </p>
            </DetailTile>

            <DetailTile label="Delivered At">
              <p className="font-semibold text-main">
                {deliveredAt ? formatDateTime(deliveredAt) : "Not delivered"}
              </p>
            </DetailTile>

            <DetailTile label="Cargo / Product" className="md:col-span-2">
              <p className="font-semibold text-main">
                {mission.description || "No product description"}
              </p>
              <p className="mt-1 text-sm text-muted">
                {mission.cargo?.weight_kg ?? "?"} kg -{" "}
                {mission.cargo?.volume_liters ?? "?"} L
                {mission.cargo?.requires_cooling
                  ? " - Cooling required"
                  : ""}
              </p>
            </DetailTile>

            <DetailTile label="Mission ID">
              <p className="font-mono text-sm text-muted">{mission.id}</p>
            </DetailTile>
          </div>
        </div>
      )}
    </article>
  );
}
