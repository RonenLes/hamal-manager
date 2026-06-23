import Link from "next/link";

import type { Driver, Mission } from "@/lib/api-client";
import { CAR_SPECS } from "@/lib/car-specs";
import { formatDateTime24 } from "@/lib/date-format";
import type { DriverScorePoint } from "@/lib/driver-metrics";

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
  scorePoints: DriverScorePoint[];
  isExpanded: boolean;
  isGraphExpanded: boolean;
  copiedDriverId: string | null;
  onToggle: () => void;
  onToggleGraph: () => void;
  onCopyPhone: (driverId: string, phone: string) => void;
};

function formatDateTime(dateValue?: string) {
  return formatDateTime24(dateValue);
}

function getScoreClasses(score: number) {
  if (score >= 85) return "text-emerald-300";
  if (score >= 65) return "text-orange-300";
  return "text-red-300";
}

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

function getStatusDotClasses(isActive: boolean, status: string) {
  if (isActive) return "bg-emerald-400";
  if (status === "available") return "bg-blue-400";
  if (status === "offline") return "bg-slate-500";
  return "bg-orange-400";
}

export default function DriverEntry({
  driver,
  activeMission,
  deliveriesMade,
  score,
  scorePoints,
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
      <div className="flex w-full items-center justify-between gap-4 px-5 py-4 transition hover:bg-[var(--bg-card-soft)]">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-4 text-left"
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

        <div className="flex shrink-0 items-center gap-3">
          <span className={`text-sm font-black ${getScoreClasses(score)}`}>
            {score}%
          </span>

          <Link
            href={`/dispatcher/drivers/${driver.id}/history`}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-500"
          >
            History
          </Link>

          <button
            type="button"
            onClick={onToggleGraph}
            className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-200 transition hover:bg-blue-500/20"
          >
            {isGraphExpanded ? "Hide graph" : "Score graph"}
          </button>

          <button type="button" onClick={onToggle} className="text-xl text-muted">
            {isExpanded ? "^" : "v"}
          </button>
        </div>
      </div>

      {isGraphExpanded && <DriverScoreGraph points={scorePoints} />}

      {isExpanded && (
        <div className="border-t border-app bg-card-soft px-5 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <DetailTile label="Full Name">
              <p className="font-semibold text-main">{driver.name}</p>
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
              <p className="font-semibold text-main">{address}</p>
            </DetailTile>

            <DetailTile label="Deliveries Made">
              <p className="text-3xl font-black text-main">{deliveriesMade}</p>
            </DetailTile>

            <DetailTile label="Vehicle">
              <p className="font-semibold text-main">
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
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <DetailTile label="Delivery Status">
                  <p className="font-semibold capitalize text-main">
                    {activeMission.status.replace("_", " ")}
                  </p>
                </DetailTile>

                <DetailTile label="Urgency">
                  <PriorityBadge priority={activeMission.priority} />
                </DetailTile>

                <DetailTile label="Start Time">
                  <p className="font-semibold text-main">
                    {formatDateTime(activeMission.created_at)}
                  </p>
                </DetailTile>

                <DetailTile label="From">
                  <p className="font-semibold text-main">
                    {activeMission.pickup?.address || "Pickup location TBD"}
                  </p>
                </DetailTile>

                <DetailTile label="To">
                  <p className="font-semibold text-main">
                    {activeMission.dropoff?.address || "Dropoff location TBD"}
                  </p>
                </DetailTile>

                <DetailTile label="Cargo">
                  <p className="font-semibold text-main">
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
            <div className="mt-5 rounded-2xl border border-app bg-card p-5 text-muted">
              This driver is not currently assigned to an active delivery.
            </div>
          )}
        </div>
      )}
    </article>
  );
}
