import type { Mission } from "@/lib/api-client";
import DetailTile from "@/components/dispatcher/shared/DetailTile";
import PriorityBadge from "@/components/dispatcher/shared/PriorityBadge";

import StatusProgress from "../shared/StatusProgress";

type ActiveMissionCardProps = {
  mission: Mission;
  onMarkDelivered: (id: string) => void;
  onUpdateStatus: (id: string, status: "in_transit") => void;
};

export default function ActiveMissionCard({
  mission,
  onMarkDelivered,
  onUpdateStatus,
}: ActiveMissionCardProps) {
  return (
    <article className="rounded-2xl border border-app bg-card p-5 shadow-xl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-main">{mission.title}</h2>
          <p className="mt-1 text-sm text-muted">{mission.description}</p>
        </div>
        <PriorityBadge priority={mission.priority} />
      </div>

      <div className="mb-5">
        <StatusProgress status={mission.status} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
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

        <DetailTile label="Cargo" className="md:col-span-2">
          <p className="font-semibold text-main">
            {mission.cargo?.weight_kg ?? "?"} kg -{" "}
            {mission.cargo?.volume_liters ?? "?"} L
            {mission.cargo?.requires_cooling ? " - Cooling required" : ""}
          </p>
        </DetailTile>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={`https://waze.com/ul?ll=${mission.dropoff?.lat || 32.08},${
            mission.dropoff?.lng || 34.78
          }&navigate=yes`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-app bg-card-soft px-5 py-2.5 text-center text-sm font-bold text-main transition hover:bg-card-soft"
        >
          Open in Waze
        </a>

        {mission.status === "assigned" && (
          <button
            type="button"
            onClick={() => onUpdateStatus(mission.id, "in_transit")}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            Start Delivery
          </button>
        )}

        {mission.status === "in_transit" && (
          <button
            type="button"
            onClick={() => onMarkDelivered(mission.id)}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500"
          >
            Mark Delivered
          </button>
        )}
      </div>
    </article>
  );
}
