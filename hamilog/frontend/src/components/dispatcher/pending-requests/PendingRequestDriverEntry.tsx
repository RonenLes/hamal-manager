import Link from "next/link";

import type { Driver } from "@/lib/api-client";
import { CAR_SPECS } from "@/lib/car-specs";

import DetailTile from "../shared/DetailTile";

export type RequestStatus = "pending" | "approved" | "declined";

export type DriverMissionRequest = {
  id: string;
  driver: Driver;
  requestedAt: string;
  matchScore: number;
  status: RequestStatus;
};

type PendingRequestDriverEntryProps = {
  request: DriverMissionRequest;
  isExpanded: boolean;
  isActionLoading: boolean;
  onToggle: () => void;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
};

function getScoreClasses(score: number) {
  if (score >= 85) return "text-emerald-300";
  if (score >= 65) return "text-orange-300";
  return "text-red-300";
}

function getStatusClasses(status: string) {
  if (status === "available") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  }
  if (status === "offline") {
    return "border-slate-500/30 bg-slate-500/10 text-muted";
  }
  if (status === "blacklisted") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }
  return "border-orange-500/30 bg-orange-500/10 text-orange-300";
}

export default function PendingRequestDriverEntry({
  request,
  isExpanded,
  isActionLoading,
  onToggle,
  onAccept,
  onDecline,
}: PendingRequestDriverEntryProps) {
  const { driver } = request;
  const spec = CAR_SPECS[driver.car_type];
  const driverScore = driver.score ?? 0;
  const location = driver.current_location?.address || "No current location";

  return (
    <article className="border-t border-app bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-card-soft"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate font-bold text-main">{driver.name}</h4>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusClasses(
                driver.status
              )}`}
            >
              {driver.status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-muted">
            {spec?.label || driver.car_type} - {location}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold uppercase text-soft">Match</p>
            <p className={`text-sm font-black ${getScoreClasses(request.matchScore)}`}>
              {request.matchScore}%
            </p>
          </div>
          <span className="text-xl text-muted">{isExpanded ? "^" : "v"}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-app bg-app/60 px-5 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <DetailTile label="Driver Score">
              <p className={`text-3xl font-black ${getScoreClasses(driverScore)}`}>
                {driverScore}%
              </p>
            </DetailTile>

            <DetailTile label="Match Score">
              <p
                className={`text-3xl font-black ${getScoreClasses(
                  request.matchScore
                )}`}
              >
                {request.matchScore}%
              </p>
            </DetailTile>

            <DetailTile label="Status">
              <p
                className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold capitalize ${getStatusClasses(
                  driver.status
                )}`}
              >
                {driver.status.replace("_", " ")}
              </p>
            </DetailTile>

            <DetailTile label="Phone">
              <p className="font-semibold text-main">
                {driver.phone || "No phone number"}
              </p>
            </DetailTile>

            <DetailTile label="Email">
              <p className="font-semibold text-main">
                {driver.email || "No email"}
              </p>
            </DetailTile>

            <DetailTile label="Current Location">
              <p className="font-semibold text-main">{location}</p>
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

            <DetailTile label="Current Mission">
              <p className="font-mono text-sm text-muted">
                {driver.current_mission_id || "No active mission"}
              </p>
            </DetailTile>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-app pt-5 sm:flex-row sm:justify-end">
            <Link
              href={`/dispatcher/drivers/${driver.id}/history`}
              className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-5 py-2.5 text-center text-sm font-bold text-blue-200 transition hover:bg-blue-500/20"
            >
              Driver History
            </Link>
            <button
              type="button"
              onClick={() => onDecline(request.id)}
              disabled={request.status !== "pending" || isActionLoading}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-main transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => onAccept(request.id)}
              disabled={request.status !== "pending" || isActionLoading}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-main transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isActionLoading ? "Approving..." : "Approve"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
