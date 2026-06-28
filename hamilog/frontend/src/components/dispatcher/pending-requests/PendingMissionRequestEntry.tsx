import Link from "next/link";

import type { Mission } from "@/lib/api-client";
import { formatDateTime24 } from "@/lib/date-format";
import { formatIdealDeliveryTime, getMissionDeliveredAt } from "@/lib/mission-time";

import DetailTile from "../shared/DetailTile";
import PriorityBadge from "../shared/PriorityBadge";
import type { DriverMissionRequest } from "./PendingRequestDriverEntry";

export type MissionRequestGroup = {
  mission: Mission;
  requests: DriverMissionRequest[];
};

type PendingMissionRequestEntryProps = {
  group: MissionRequestGroup;
  isExpanded: boolean;
  onToggleMission: () => void;
};

// Formats the date time for display.
function formatDateTime(dateValue?: string) {
  return formatDateTime24(dateValue);
}

// Returns the state classes.
function getStateClasses(state: string) {
  if (state === "available") return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  if (state === "assigned") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (state === "cancelled") return "border-red-500/30 bg-red-500/10 text-red-300";
  return "border-orange-500/30 bg-orange-500/10 text-orange-300";
}

// Renders the pending mission request entry component.
export default function PendingMissionRequestEntry({
  group,
  isExpanded,
  onToggleMission,
}: PendingMissionRequestEntryProps) {
  const { mission, requests } = group;
  const deliveredAt = getMissionDeliveredAt(mission);

  return (
    <article className="bg-card">
      <button
        type="button"
        onClick={onToggleMission}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-card-soft"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-bold text-main">{mission.title}</h3>
            <PriorityBadge priority={mission.priority} />
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStateClasses(
                mission.status
              )}`}
            >
              {mission.status.replace("_", " ")}
            </span>
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">
              {requests.length} driver{requests.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-muted">
            {mission.pickup?.address || "Pickup TBD"} -&gt;{" "}
            {mission.dropoff?.address || "Dropoff TBD"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-red-600 px-2 text-sm font-black text-white">
            {requests.length}
          </span>
          <span className="text-xl text-muted">{isExpanded ? "^" : "v"}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-app bg-app/60">
          <div className="px-5 py-5">
            <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              <DetailTile label="Mission Status">
                <p
                  className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold capitalize ${getStateClasses(
                    mission.status
                  )}`}
                >
                  {mission.status.replace("_", " ")}
                </p>
              </DetailTile>

              <DetailTile label="Urgency">
                <PriorityBadge priority={mission.priority} />
              </DetailTile>

              <DetailTile label="Published">
                <p className="font-semibold text-main">
                  {formatDateTime(mission.created_at)}
                </p>
              </DetailTile>

              <DetailTile label="Ideal Time">
                <p className="font-semibold text-main">
                  {formatIdealDeliveryTime(mission.ideal_delivery_time)}
                </p>
              </DetailTile>

              <DetailTile label="Delivered At">
                <p className="font-semibold text-main">
                  {deliveredAt ? formatDateTime(deliveredAt) : "Not delivered"}
                </p>
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

              <DetailTile label="Requesting Drivers">
                <p className="text-3xl font-black text-main">{requests.length}</p>
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

            <div className="mt-5 flex justify-end border-t border-app pt-5">
              <Link
                href={`/dispatcher/pending-requests/${mission.id}`}
                className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500"
              >
                View all {requests.length} request
                {requests.length === 1 ? "" : "s"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
