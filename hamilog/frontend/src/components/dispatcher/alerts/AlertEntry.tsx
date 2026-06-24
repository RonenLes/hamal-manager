import type { Driver, Mission } from "@/lib/api-client";
import { CAR_SPECS } from "@/lib/car-specs";
import { formatDateTime24 } from "@/lib/date-format";
import {
  formatIdealDeliveryTime,
  getMissionDeliveredAt,
} from "@/lib/mission-time";

import DetailTile from "../shared/DetailTile";
import PriorityBadge from "../shared/PriorityBadge";

export type AlertLevel = "critical" | "warning" | "info" | "success";

export type DispatcherAlert = {
  id: string;
  level: AlertLevel;
  title: string;
  summary: string;
  createdAt: string;
  type: string;
  mission?: Mission;
  driver?: Driver;
};

type AlertEntryProps = {
  alert: DispatcherAlert;
  isExpanded: boolean;
  onToggle: () => void;
  onDismiss: (alertId: string) => void;
};

export function formatAlertDateTime(dateValue?: string) {
  return formatDateTime24(dateValue);
}

export function getWaitingTime(dateValue?: string) {
  if (!dateValue) return "Unknown";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

export function getAlertClasses(level: AlertLevel) {
  switch (level) {
    case "critical":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    case "warning":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
    case "info":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "success":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }
}

function getAlertDotClasses(level: AlertLevel) {
  switch (level) {
    case "critical":
      return "bg-red-400";
    case "warning":
      return "bg-orange-400";
    case "info":
      return "bg-blue-400";
    case "success":
      return "bg-emerald-400";
  }
}

function getAlertIcon(level: AlertLevel) {
  switch (level) {
    case "critical":
      return "!";
    case "warning":
      return "!";
    case "info":
      return "i";
    case "success":
      return "OK";
  }
}

export default function AlertEntry({
  alert,
  isExpanded,
  onToggle,
  onDismiss,
}: AlertEntryProps) {
  const mission = alert.mission;
  const driver = alert.driver;
  const deliveredAt = mission ? getMissionDeliveredAt(mission) : null;

  return (
    <article className="bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-card-soft"
      >
        <div className="flex min-w-0 items-center gap-4">
          <span
            className={`h-3 w-3 shrink-0 rounded-full ${getAlertDotClasses(
              alert.level
            )}`}
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg">{getAlertIcon(alert.level)}</span>
              <h3 className="truncate font-bold text-main">{alert.title}</h3>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getAlertClasses(
                  alert.level
                )}`}
              >
                {alert.level}
              </span>
            </div>

            <p className="mt-1 truncate text-sm text-muted">{alert.summary}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-soft">{alert.type}</span>
          <span className="text-xl text-muted">{isExpanded ? "^" : "v"}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-app bg-app/60 px-5 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <DetailTile label="Alert Type">
              <p className="font-semibold text-main">{alert.type}</p>
            </DetailTile>

            <DetailTile label="Alert Level">
              <p
                className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold capitalize ${getAlertClasses(
                  alert.level
                )}`}
              >
                {alert.level}
              </p>
            </DetailTile>

            <DetailTile label="Created">
              <p className="font-semibold text-main">
                {formatAlertDateTime(alert.createdAt)}
              </p>
            </DetailTile>

            <DetailTile label="Summary" className="md:col-span-3">
              <p className="font-semibold text-main">{alert.summary}</p>
            </DetailTile>

            {mission && (
              <>
                <DetailTile label="Mission">
                  <p className="font-semibold text-main">{mission.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    Status: {mission.status.replace("_", " ")}
                  </p>
                </DetailTile>

                <DetailTile label="Urgency">
                  <PriorityBadge priority={mission.priority} />
                </DetailTile>

                <DetailTile label="Waiting Time">
                  <p className="font-semibold text-main">
                    {getWaitingTime(mission.created_at)}
                  </p>
                </DetailTile>

                <DetailTile label="Ideal Delivery Time">
                  <p className="font-semibold text-main">
                    {formatIdealDeliveryTime(mission.ideal_delivery_time)}
                  </p>
                </DetailTile>

                <DetailTile label="Delivered At">
                  <p className="font-semibold text-main">
                    {deliveredAt
                      ? formatAlertDateTime(deliveredAt)
                      : "Not delivered"}
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

                <DetailTile label="Cargo">
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
              </>
            )}

            {driver && (
              <>
                <DetailTile label="Driver">
                  <p className="font-semibold text-main">{driver.name}</p>
                </DetailTile>

                <DetailTile label="Driver Status">
                  <p className="font-semibold capitalize text-main">
                    {driver.status.replace("_", " ")}
                  </p>
                </DetailTile>

                <DetailTile label="Vehicle">
                  <p className="font-semibold text-main">
                    {CAR_SPECS[driver.car_type]?.icon || "Car"}{" "}
                    {CAR_SPECS[driver.car_type]?.label || driver.car_type}
                  </p>
                </DetailTile>
              </>
            )}
          </div>

          <div className="mt-5 flex justify-end border-t border-app pt-5">
            <button
              type="button"
              onClick={() => onDismiss(alert.id)}
              className="rounded-xl border border-app bg-card-soft px-5 py-2.5 text-sm font-bold text-main transition hover:bg-card-soft"
            >
              Dismiss Alert
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
