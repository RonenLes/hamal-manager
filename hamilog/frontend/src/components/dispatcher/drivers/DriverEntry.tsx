import Link from "next/link";

import type { Driver, Mission } from "@/lib/api-client";
import { CAR_SPECS } from "@/lib/car-specs";
import { formatDateTime24 } from "@/lib/date-format";
import type { DriverScorePoint } from "@/lib/driver-metrics";
import { formatIdealDeliveryTime } from "@/lib/mission-time";

import DetailTile from "../shared/DetailTile";
import PriorityBadge from "../shared/PriorityBadge";
import DriverScoreGraph from "./DriverScoreGraph";

export type ExtendedDriver = Driver & {
  phone?: string;
  address?: string;
  score?: number;
};

type DriverEntryProps = {
  driver: ExtendedDriver;
  activeMission?: Mission;
  deliveriesMade: number;
  score: number;
  dateScorePoints: DriverScorePoint[];
  missionScorePoints: DriverScorePoint[];
  isExpanded: boolean;
  isGraphExpanded: boolean;
  copiedDriverId: string | null;
  onToggle: () => void;
  onToggleGraph: () => void;
  onCopyPhone: (driverId: string, phone: string) => void;
};

// Formats the date time for display.
function formatDateTime(dateValue?: string) {
  return formatDateTime24(dateValue);
}

// Returns the score classes.
function getScoreClasses(score: number) {
  if (score >= 85) return "text-emerald-300";
  if (score >= 65) return "text-orange-300";
  return "text-red-300";
}

// Returns the status classes.
function getStatusClasses(isActive: boolean, status: string) {
  if (isActive) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "available") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  }

  if (status === "offline") {
    return "border-slate-500/30 bg-slate-500/10 text-muted";
  }

  return "border-orange-500/30 bg-orange-500/10 text-orange-300";
}

// Returns the status dot classes.
function getStatusDotClasses(isActive: boolean, status: string) {
  if (isActive) return "bg-emerald-400";
  if (status === "available") return "bg-blue-400";
  if (status === "offline") return "bg-slate-500";
  return "bg-orange-400";
}

// Renders the driver entry component.
export default function DriverEntry({
  driver,
  activeMission,
  deliveriesMade,
  score,
  dateScorePoints,
  missionScorePoints,
  isExpanded,
  isGraphExpanded,
  copiedDriverId,
  onToggle,
  onToggleGraph,
  onCopyPhone,
}: DriverEntryProps) {
  const isActive = Boolean(activeMission);
  const spec = CAR_SPECS[driver.car_type];
  const phone = driver.phone || "No phone number yet";
  const address = driver.address || "No address yet";

  return (
    <article className="bg-card">
      <div className="flex w-full flex-col gap-3 px-4 py-3 transition hover:bg-[var(--bg-card-soft)] sm:px-5 sm:py-4 lg:flex-row lg:items-center lg:justify-between">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4"
        >
          <span
            className={`h-3 w-3 shrink-0 rounded-full ${getStatusDotClasses(
              isActive,
              driver.status
            )}`}
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-bold text-main">{driver.name}</h3>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusClasses(
                  isActive,
                  driver.status
                )}`}
              >
                {isActive ? "Active" : driver.status.replace("_", " ")}
              </span>
            </div>

            <p className="mt-1 truncate text-sm text-muted">
              {spec?.label || driver.car_type} - {deliveriesMade} deliveries
              made
            </p>
          </div>
        </button>

        <div className="flex w-full min-w-0 items-center gap-1.5 overflow-x-auto pb-1 sm:w-auto sm:shrink-0 sm:gap-2 sm:overflow-visible sm:pb-0">
          <span className={`shrink-0 px-1 text-center text-sm font-black ${getScoreClasses(score)}`}>
            {score}%
          </span>

          <Link
            href={`/dispatcher/messages/driver/${driver.id}`}
            className="shrink-0 rounded-lg border border-blue-500/40 bg-blue-500/10 px-2 py-1.5 text-center text-[11px] font-bold text-blue-200 transition hover:bg-blue-500/20 sm:px-3 sm:py-2 sm:text-xs"
          >
            Msg
          </Link>

          <Link
            href={`/dispatcher/drivers/${driver.id}/history`}
            className="shrink-0 rounded-lg bg-blue-600 px-2 py-1.5 text-center text-[11px] font-bold text-white transition hover:bg-blue-500 sm:px-3 sm:py-2 sm:text-xs"
          >
            History
          </Link>

          <button
            type="button"
            onClick={onToggleGraph}
            className="shrink-0 rounded-lg border border-blue-500/40 bg-blue-500/10 px-2 py-1.5 text-center text-[11px] font-bold text-blue-200 transition hover:bg-blue-500/20 sm:px-3 sm:py-2 sm:text-xs"
          >
            {isGraphExpanded ? "Hide" : "Graph"}
          </button>

          <button type="button" onClick={onToggle} className="shrink-0 rounded-lg border border-app bg-card-soft px-2 py-1.5 text-base text-muted sm:border-0 sm:bg-transparent sm:p-0 sm:text-xl">
            {isExpanded ? "^" : "v"}
          </button>
        </div>
      </div>

      {isGraphExpanded && (
        <DriverScoreGraph
          datePoints={dateScorePoints}
          missionPoints={missionScorePoints}
        />
      )}

      {isExpanded && (
        <div className="border-t border-app bg-card-soft px-3 py-3 sm:px-5 sm:py-5">
          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            <DetailTile label="Full Name">
              <p className="break-words text-sm font-semibold text-main sm:text-base">{driver.name}</p>
            </DetailTile>

            <DetailTile label="Driver Score">
              <p className={`text-3xl font-black ${getScoreClasses(score)}`}>
                {score}%
              </p>
            </DetailTile>

            <DetailTile label="Status">
              <p
                className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold capitalize ${getStatusClasses(
                  isActive,
                  driver.status
                )}`}
              >
                {isActive ? "Active" : driver.status.replace("_", " ")}
              </p>
            </DetailTile>

            <DetailTile label="Phone Number">
              <div className="flex items-center gap-2">
                <p className="flex-1 font-semibold text-main">{phone}</p>

                <button
                  type="button"
                  onClick={() => onCopyPhone(driver.id, phone)}
                  disabled={!driver.phone}
                  className="rounded-lg border border-app bg-card-soft px-3 py-1.5 text-xs font-bold text-main transition hover:bg-[var(--bg-card-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {copiedDriverId === driver.id ? "Copied" : "Copy"}
                </button>
              </div>
            </DetailTile>

            <DetailTile label="Address" className="md:col-span-2">
              <p className="break-words text-sm font-semibold text-main sm:text-base">{address}</p>
            </DetailTile>

            <DetailTile label="Deliveries Made">
              <p className="text-2xl font-black sm:text-3xl text-main">{deliveriesMade}</p>
            </DetailTile>

            <DetailTile label="Vehicle">
              <p className="break-words text-sm font-semibold text-main sm:text-base">
                {spec?.icon || "Car"} {spec?.label || driver.car_type}
              </p>
              <p className="mt-1 text-sm text-muted">
                {spec?.max_weight ?? "?"} kg - {spec?.max_volume ?? "?"} L
                {spec?.cooling ? " - Cooling" : ""}
              </p>
            </DetailTile>

            <DetailTile label="Driver ID">
              <p className="font-mono text-sm text-muted">{driver.id}</p>
            </DetailTile>
          </div>

          {isActive && activeMission && (
            <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 sm:mt-5 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">
                    Active Delivery
                  </p>
                  <h3 className="mt-1 text-xl font-black text-main">
                    {activeMission.title}
                  </h3>
                </div>

                <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-white">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                <DetailTile label="Delivery Status">
                  <p className="font-semibold capitalize text-main">
                    {activeMission.status.replace("_", " ")}
                  </p>
                </DetailTile>

                <DetailTile label="Urgency">
                  <PriorityBadge priority={activeMission.priority} />
                </DetailTile>

                <DetailTile label="Start Time">
                  <p className="break-words text-sm font-semibold text-main sm:text-base">
                    {formatDateTime(activeMission.created_at)}
                  </p>
                </DetailTile>

                <DetailTile label="Ideal Delivery Time">
                  <p className="break-words text-sm font-semibold text-main sm:text-base">
                    {formatIdealDeliveryTime(activeMission.ideal_delivery_time)}
                  </p>
                </DetailTile>

                <DetailTile label="From">
                  <p className="break-words text-sm font-semibold text-main sm:text-base">
                    {activeMission.pickup?.address || "Pickup location TBD"}
                  </p>
                </DetailTile>

                <DetailTile label="To">
                  <p className="break-words text-sm font-semibold text-main sm:text-base">
                    {activeMission.dropoff?.address || "Dropoff location TBD"}
                  </p>
                </DetailTile>

                <DetailTile label="Cargo">
                  <p className="break-words text-sm font-semibold text-main sm:text-base">
                    {activeMission.description || "No product description"}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {activeMission.cargo?.weight_kg ?? "?"} kg -{" "}
                    {activeMission.cargo?.volume_liters ?? "?"} L
                    {activeMission.cargo?.requires_cooling
                      ? " - Cooling required"
                      : ""}
                  </p>
                </DetailTile>
              </div>
            </div>
          )}

          {!isActive && (
            <div className="mt-4 rounded-2xl border border-app bg-card p-3 text-sm text-muted sm:mt-5 sm:p-5">
              This driver is not currently assigned to an active delivery.
            </div>
          )}
        </div>
      )}
    </article>
  );
}
