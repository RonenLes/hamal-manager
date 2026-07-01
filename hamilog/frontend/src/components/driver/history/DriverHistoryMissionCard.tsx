import type { Mission } from "@/lib/api-client";
import {
  formatIdealDeliveryTime,
  getMissionDeliveredAt,
} from "@/lib/mission-time";

type DriverHistoryMissionCardProps = {
  mission: Mission;
};

// Formats the date for display.
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

// Renders the driver history mission card component.
export default function DriverHistoryMissionCard({
  mission,
}: DriverHistoryMissionCardProps) {
  const deliveredAt = getMissionDeliveredAt(mission);

  return (
    <article className="w-full overflow-hidden rounded-xl border border-app bg-card p-3 shadow-lg sm:p-4">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 break-words text-base font-black text-main sm:text-lg">{mission.title}</h2>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
              Delivered
            </span>
          </div>

          <p className="mt-1.5 max-w-3xl text-xs text-muted sm:text-sm">
            {mission.description}
          </p>
        </div>

        <p className="shrink-0 text-xs font-semibold text-muted sm:text-sm">
          Finished {formatDate(deliveredAt ?? mission.updated_at)}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-lg border border-app bg-card-soft p-2.5 sm:p-3">
          <p className="text-[10px] font-bold uppercase text-muted sm:text-[11px]">
            Pickup
          </p>
          <p className="mt-1 break-words text-xs font-semibold text-main sm:text-sm">
            {mission.pickup?.address ?? "Unknown"}
          </p>
        </div>

        <div className="rounded-lg border border-app bg-card-soft p-2.5 sm:p-3">
          <p className="text-[10px] font-bold uppercase text-muted sm:text-[11px]">
            Dropoff
          </p>
          <p className="mt-1 break-words text-xs font-semibold text-main sm:text-sm">
            {mission.dropoff?.address ?? "Unknown"}
          </p>
        </div>

        <div className="rounded-lg border border-app bg-card-soft p-2.5 sm:p-3">
          <p className="text-[10px] font-bold uppercase text-muted sm:text-[11px]">
            Cargo
          </p>
          <p className="mt-1 text-xs font-semibold text-main sm:text-sm">
            {mission.cargo?.weight_kg ?? "?"} kg -{" "}
            {mission.cargo?.volume_liters ?? "?"} L
          </p>
        </div>

        <div className="rounded-lg border border-app bg-card-soft p-2.5 sm:p-3">
          <p className="text-[10px] font-bold uppercase text-muted sm:text-[11px]">
            Priority
          </p>
          <p className="mt-1 text-xs font-semibold capitalize text-main sm:text-sm">
            {mission.priority}
          </p>
        </div>

        <div className="rounded-lg border border-app bg-card-soft p-2.5 sm:p-3">
          <p className="text-[10px] font-bold uppercase text-muted sm:text-[11px]">
            Ideal Time
          </p>
          <p className="mt-1 text-xs font-semibold text-main sm:text-sm">
            {formatIdealDeliveryTime(mission.ideal_delivery_time)}
          </p>
        </div>

        <div className="rounded-lg border border-app bg-card-soft p-2.5 sm:p-3">
          <p className="text-[10px] font-bold uppercase text-muted sm:text-[11px]">
            Delivered At
          </p>
          <p className="mt-1 text-xs font-semibold text-main sm:text-sm">
            {deliveredAt ? formatDate(deliveredAt) : "Not delivered"}
          </p>
        </div>
      </div>
    </article>
  );
}
