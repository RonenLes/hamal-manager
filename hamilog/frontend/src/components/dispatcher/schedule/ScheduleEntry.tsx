import type { Mission } from "@/lib/api-client";
import { formatTime24FromValue } from "@/lib/date-format";
import { formatIdealDeliveryTime, getMissionDeliveredAt } from "@/lib/mission-time";

import DetailTile from "../shared/DetailTile";
import PriorityBadge from "../shared/PriorityBadge";
import CollapseDetailsButton from "@/components/shared/CollapseDetailsButton";

export type DeliveryState =
  | "active"
  | "assigned"
  | "unassigned"
  | "delivered"
  | "cancelled";

type ScheduleEntryProps = {
  mission: Mission;
  state: DeliveryState;
  driverName: string;
  isExpanded: boolean;
  onToggle: () => void;
};

// Returns the delivery state label.
function getDeliveryStateLabel(state: DeliveryState) {
  switch (state) {
    case "active":
      return "In Action";
    case "assigned":
      return "Assigned";
    case "unassigned":
      return "Not Assigned";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
  }
}

// Returns the state badge classes.
function getStateBadgeClasses(state: DeliveryState) {
  switch (state) {
    case "active":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "assigned":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "unassigned":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
    case "delivered":
      return "border-slate-500/30 bg-slate-500/10 text-muted";
    case "cancelled":
      return "border-red-500/30 bg-red-500/10 text-red-300";
  }
}

// Returns the state dot classes.
function getStateDotClasses(state: DeliveryState) {
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
  }
}

// Formats the time for display.
function formatTime(dateValue?: string) {
  return formatTime24FromValue(dateValue, "Not started");
}

// Renders the schedule entry component.
export default function ScheduleEntry({
  mission,
  state,
  driverName,
  isExpanded,
  onToggle,
}: ScheduleEntryProps) {
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
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-card-soft sm:items-center sm:px-5 sm:py-4"
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
              {state === "active" && (
                <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-black text-main">
                  On
                </span>
              )}
              <PriorityBadge priority={mission.priority} />
            </div>

            <p className="mt-1 truncate text-sm text-muted">
              {mission.pickup?.address || "Pickup TBD"} -&gt;{" "}
              {mission.dropoff?.address || "Dropoff TBD"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${getStateBadgeClasses(
              state
            )}`}
          >
            {getDeliveryStateLabel(state)}
          </span>
          <span className="text-xl text-muted">{isExpanded ? "^" : "v"}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-blue-500/40 bg-app/60 px-3 py-3 sm:px-5 sm:py-5">
          <CollapseDetailsButton onCollapse={onToggle} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            <DetailTile label="Delivery Status">
              <p
                className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold ${getStateBadgeClasses(
                  state
                )}`}
              >
                {getDeliveryStateLabel(state)}
              </p>
            </DetailTile>

            <DetailTile label="Urgency">
              <PriorityBadge priority={mission.priority} />
            </DetailTile>

            <DetailTile label="Driver">
              <p className="break-words text-sm font-semibold text-main sm:text-base">{driverName}</p>
            </DetailTile>

            <DetailTile label="Product / Cargo">
              <p className="break-words text-sm font-semibold text-main sm:text-base">
                {mission.description || "No product description"}
              </p>
              <p className="mt-1 text-xs text-muted sm:text-sm">
                {mission.cargo?.weight_kg ?? "?"} kg -{" "}
                {mission.cargo?.volume_liters ?? "?"} L
                {mission.cargo?.requires_cooling
                  ? " - Cooling required"
                  : ""}
              </p>
            </DetailTile>

            <DetailTile label="Pickup">
              <p className="break-words text-sm font-semibold text-main sm:text-base">
                {mission.pickup?.address || "Pickup location TBD"}
              </p>
            </DetailTile>

            <DetailTile label="Dropoff">
              <p className="break-words text-sm font-semibold text-main sm:text-base">
                {mission.dropoff?.address || "Dropoff location TBD"}
              </p>
            </DetailTile>

            <DetailTile label="Delivery Start Time">
              <p className="break-words text-sm font-semibold text-main sm:text-base">
                {state === "unassigned"
                  ? "Not started"
                  : formatTime(mission.created_at)}
              </p>
            </DetailTile>

            <DetailTile label="Ideal Delivery Time">
              <p className="break-words text-sm font-semibold text-main sm:text-base">
                {formatIdealDeliveryTime(mission.ideal_delivery_time)}
              </p>
            </DetailTile>

            <DetailTile label="Delivered At">
              <p className="break-words text-sm font-semibold text-main sm:text-base">
                {deliveredAt ? formatTime(deliveredAt) : "Not delivered"}
              </p>
            </DetailTile>

            <DetailTile label="Mission ID">
              <p className="break-all font-mono text-xs text-muted sm:text-sm">{mission.id}</p>
            </DetailTile>
          </div>
        </div>
      )}
    </article>
  );
}
