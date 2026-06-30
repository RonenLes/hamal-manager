import Link from "next/link";

import type { Mission } from "@/lib/api-client";
import { formatDateTime24 } from "@/lib/date-format";
import { formatIdealDeliveryTime, getMissionDeliveredAt } from "@/lib/mission-time";

import DetailTile from "../shared/DetailTile";
import PriorityBadge from "../shared/PriorityBadge";

type MissionEntryProps = {
  mission: Mission;
  state: string;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (mission: Mission) => void;
  onCancel: (mission: Mission) => void;
  assignedDriverName?: string;
  getStateClasses: (state: string) => string;
};

// Formats the date time for display.
function formatDateTime(dateValue?: string) {
  return formatDateTime24(dateValue);
}

// Renders the mission entry component.
export default function MissionEntry({
  mission,
  state,
  isExpanded,
  onToggle,
  onEdit,
  onCancel,
  assignedDriverName,
  getStateClasses,
}: MissionEntryProps) {
  const deliveredAt = getMissionDeliveredAt(mission);
  const canEdit =
    mission.status !== "cancelled" && mission.status !== "delivered";
  const canSuggest = mission.status === "available" && !mission.assigned_driver_id;
  const canCancel =
    mission.status === "available" ||
    mission.status === "assigned" ||
    mission.status === "in_transit";

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
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-bold text-main">{mission.title}</h3>

            <PriorityBadge priority={mission.priority} />

            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStateClasses(
                state
              )}`}
            >
              {state.replace("_", " ")}
            </span>

            {mission.cargo?.requires_cooling && (
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
                Cooling
              </span>
            )}
          </div>

          <p className="mt-1 truncate text-sm text-muted">
            {mission.pickup?.address || "Pickup TBD"} -&gt;{" "}
            {mission.dropoff?.address || "Dropoff TBD"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {canEdit && onEdit && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onEdit(mission);
              }}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-500"
            >
              Edit
            </button>
          )}

          {canSuggest && (
            <Link
              href={`/dispatcher/missions/${mission.id}/suggestions`}
              onClick={(event) => event.stopPropagation()}
              className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-500"
            >
              Suggest to
            </Link>
          )}

          {canCancel && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onCancel(mission);
              }}
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-500"
            >
              Cancel
            </button>
          )}

          <span className="text-xl text-muted">{isExpanded ? "^" : "v"}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-blue-500/40 bg-app/60 px-3 py-3 sm:px-5 sm:py-5">
          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            <DetailTile label="Status">
              <p
                className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold capitalize ${getStateClasses(
                  state
                )}`}
              >
                {state.replace("_", " ")}
              </p>
            </DetailTile>

            <DetailTile label="Urgency">
              <PriorityBadge priority={mission.priority} />
            </DetailTile>

            <DetailTile label="Published">
              <p className="break-words text-sm font-semibold text-main sm:text-base">
                {formatDateTime(mission.created_at)}
              </p>
            </DetailTile>

            <DetailTile label="Ideal Time">
              <p className="break-words text-sm font-semibold text-main sm:text-base">
                {formatIdealDeliveryTime(mission.ideal_delivery_time)}
              </p>
            </DetailTile>

            <DetailTile label="Delivered At">
              <p className="break-words text-sm font-semibold text-main sm:text-base">
                {deliveredAt ? formatDateTime(deliveredAt) : "Not delivered"}
              </p>
            </DetailTile>

            <DetailTile label="From">
              <p className="break-words text-sm font-semibold text-main sm:text-base">
                {mission.pickup?.address || "Pickup location TBD"}
              </p>
            </DetailTile>

            <DetailTile label="To">
              <p className="break-words text-sm font-semibold text-main sm:text-base">
                {mission.dropoff?.address || "Dropoff location TBD"}
              </p>
            </DetailTile>

            <DetailTile label="Assigned Driver">
              <p className="break-words text-sm font-semibold text-main sm:text-base">
                {assignedDriverName ||
                  mission.assigned_driver_id ||
                  "No driver assigned"}
              </p>
              {assignedDriverName && mission.assigned_driver_id && (
                <p className="mt-1 break-all font-mono text-xs text-muted">
                  {mission.assigned_driver_id}
                </p>
              )}
            </DetailTile>

            <DetailTile label="Cargo" className="md:col-span-2">
              <p className="break-words text-sm font-semibold text-main sm:text-base">
                {mission.description || "No cargo description"}
              </p>
              <p className="mt-1 text-xs text-muted sm:text-sm">
                {mission.cargo?.weight_kg ?? "?"} kg -{" "}
                {mission.cargo?.volume_liters ?? "?"} L
                {mission.cargo?.requires_cooling
                  ? " - Cooling required"
                  : ""}
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
