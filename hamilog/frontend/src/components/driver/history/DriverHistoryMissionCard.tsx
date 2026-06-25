import type { Mission } from "@/lib/api-client";
import {
  formatIdealDeliveryTime,
  getMissionDeliveredAt,
} from "@/lib/mission-time";

type DriverHistoryMissionCardProps = {
  mission: Mission;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function DriverHistoryMissionCard({
  mission,
}: DriverHistoryMissionCardProps) {
  const deliveredAt = getMissionDeliveredAt(mission);

  return (
    <article className="rounded-2xl border border-app bg-card p-5 shadow-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-black text-main">{mission.title}</h2>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
              Delivered
            </span>
          </div>

          <p className="mt-2 max-w-3xl text-sm text-muted">
            {mission.description}
          </p>
        </div>

        <p className="text-sm font-semibold text-muted">
          Finished {formatDate(deliveredAt ?? mission.updated_at)}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-app bg-card-soft p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Pickup
          </p>
          <p className="mt-1 text-sm font-semibold text-main">
            {mission.pickup?.address ?? "Unknown"}
          </p>
        </div>

        <div className="rounded-xl border border-app bg-card-soft p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Dropoff
          </p>
          <p className="mt-1 text-sm font-semibold text-main">
            {mission.dropoff?.address ?? "Unknown"}
          </p>
        </div>

        <div className="rounded-xl border border-app bg-card-soft p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Cargo
          </p>
          <p className="mt-1 text-sm font-semibold text-main">
            {mission.cargo?.weight_kg ?? "?"} kg -{" "}
            {mission.cargo?.volume_liters ?? "?"} L
          </p>
        </div>

        <div className="rounded-xl border border-app bg-card-soft p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Priority
          </p>
          <p className="mt-1 text-sm font-semibold capitalize text-main">
            {mission.priority}
          </p>
        </div>

        <div className="rounded-xl border border-app bg-card-soft p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Ideal Time
          </p>
          <p className="mt-1 text-sm font-semibold text-main">
            {formatIdealDeliveryTime(mission.ideal_delivery_time)}
          </p>
        </div>

        <div className="rounded-xl border border-app bg-card-soft p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Delivered At
          </p>
          <p className="mt-1 text-sm font-semibold text-main">
            {deliveredAt ? formatDate(deliveredAt) : "Not delivered"}
          </p>
        </div>
      </div>
    </article>
  );
}
