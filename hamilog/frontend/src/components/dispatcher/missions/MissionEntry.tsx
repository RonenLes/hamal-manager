import type { Mission } from "@/lib/api-client";

import DetailTile from "../shared/DetailTile";
import PriorityBadge from "../shared/PriorityBadge";

type MissionEntryProps = {
  mission: Mission;
  state: string;
  isExpanded: boolean;
  onToggle: () => void;
  getStateClasses: (state: string) => string;
};

function formatDateTime(dateValue?: string) {
  if (!dateValue) return "Unknown";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MissionEntry({
  mission,
  state,
  isExpanded,
  onToggle,
  getStateClasses,
}: MissionEntryProps) {
  return (
    <article className="bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-card-soft"
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

        <span className="text-xl text-muted">{isExpanded ? "^" : "v"}</span>
      </button>

      {isExpanded && (
        <div className="border-t border-app bg-app/60 px-5 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              <p className="font-semibold text-main">
                {formatDateTime(mission.created_at)}
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

            <DetailTile label="Assigned Driver">
              <p className="font-semibold text-main">
                {mission.assigned_driver_id || "No driver assigned"}
              </p>
            </DetailTile>

            <DetailTile label="Cargo" className="md:col-span-2">
              <p className="font-semibold text-main">
                {mission.description || "No cargo description"}
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
