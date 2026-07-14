import type { ReactNode } from "react";
import type { Mission } from "@/lib/api-client";
import CollapseDetailsButton from "@/components/shared/CollapseDetailsButton";
import { formatIdealDeliveryTime, getMissionDeliveredAt } from "@/lib/mission-time";

type Props = { mission: Mission; isExpanded: boolean; onToggle: () => void };

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function HistoryDetail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-app bg-card-soft p-2.5 sm:p-3">
      <p className="text-[10px] font-bold uppercase text-muted sm:text-[11px]">{label}</p>
      <div className="mt-1 break-words text-xs font-semibold text-main sm:text-sm">{children}</div>
    </div>
  );
}

export default function DriverHistoryMissionCard({ mission, isExpanded, onToggle }: Props) {
  const deliveredAt = getMissionDeliveredAt(mission);

  return (
    <article className={`w-full overflow-hidden rounded-xl border border-app bg-card shadow-sm ${isExpanded ? "outline outline-2 outline-blue-500/70" : ""}`}>
      <button type="button" onClick={onToggle} aria-expanded={isExpanded} className="flex w-full flex-col gap-2.5 p-3 text-left transition hover:bg-card-soft sm:p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="break-words text-base font-semibold text-main sm:text-lg">{mission.title}</h2>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Delivered</span>
          </div>
          <p className="mt-1.5 break-words text-xs text-muted sm:text-sm">{mission.pickup?.address ?? "Unknown pickup"} → {mission.dropoff?.address ?? "Unknown dropoff"}</p>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 lg:justify-end">
          <p className="text-xs font-semibold text-muted sm:text-sm">Finished {formatDate(deliveredAt ?? mission.updated_at)}</p>
          <span className="text-xl text-muted">{isExpanded ? "^" : "v"}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-blue-500/40 p-3 sm:p-4">
          <CollapseDetailsButton onCollapse={onToggle} />
          <p className="mb-3 text-sm leading-6 text-muted">{mission.description || "No mission description provided."}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <HistoryDetail label="Pickup">{mission.pickup?.address ?? "Unknown"}</HistoryDetail>
            <HistoryDetail label="Dropoff">{mission.dropoff?.address ?? "Unknown"}</HistoryDetail>
            <HistoryDetail label="Cargo">{mission.cargo?.weight_kg ?? "?"} kg - {mission.cargo?.volume_liters ?? "?"} L</HistoryDetail>
            <HistoryDetail label="Priority"><span className="capitalize">{mission.priority}</span></HistoryDetail>
            <HistoryDetail label="Ideal Time">{formatIdealDeliveryTime(mission.ideal_delivery_time)}</HistoryDetail>
            <HistoryDetail label="Delivered At">{deliveredAt ? formatDate(deliveredAt) : "Not delivered"}</HistoryDetail>
          </div>
        </div>
      )}
    </article>
  );
}
