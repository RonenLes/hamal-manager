import type { Mission } from "@/lib/api-client";
import { formatTime24FromValue } from "@/lib/date-format";

import DetailTile from "../shared/DetailTile";
import PriorityBadge from "../shared/PriorityBadge";

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

function formatTime(dateValue?: string) {
  return formatTime24FromValue(dateValue, "Not started");
}

export default function ScheduleEntry({
  mission,
  state,
  driverName,
  isExpanded,
  onToggle,
}: ScheduleEntryProps) {
  return (
    <article className="bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-card-soft"
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
        <div className="border-t border-app bg-app/60 px-5 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              <p className="font-semibold text-main">{driverName}</p>
            </DetailTile>

            <DetailTile label="Product / Cargo">
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

            <DetailTile label="Pickup">
              <p className="font-semibold text-main">
                {mission.pickup?.address || "Pickup location TBD"}
              </p>
            </DetailTile>

            <DetailTile label="Dropoff">
              <p className="font-semibold text-main">
                {mission.dropoff?.address || "Dropoff location TBD"}
              </p>
            </DetailTile>

            <DetailTile label="Delivery Start Time">
              <p className="font-semibold text-main">
                {state === "unassigned"
                  ? "Not started"
                  : formatTime(mission.created_at)}
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
