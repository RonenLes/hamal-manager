import type { Driver, Mission } from "@/lib/api-client";
import { formatDateTime24 } from "@/lib/date-format";

import DetailTile from "../shared/DetailTile";
import PriorityBadge from "../shared/PriorityBadge";

export type RequestStatus = "pending" | "approved" | "declined";

export type DeliveryRequest = {
  id: string;
  driver: Driver;
  mission: Mission;
  requestedAt: string;
  driverScore: number;
  status: RequestStatus;
};

type PendingRequestEntryProps = {
  request: DeliveryRequest;
  isExpanded: boolean;
  isActionLoading: boolean;
  onToggle: () => void;
  onAccept: (request: DeliveryRequest) => void;
  onDecline: (requestId: string) => void;
};

function formatDateTime(dateValue?: string) {
  return formatDateTime24(dateValue);
}

function getRequestStatusClasses(status: RequestStatus) {
  switch (status) {
    case "pending":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
    case "approved":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "declined":
      return "border-red-500/30 bg-red-500/10 text-red-300";
  }
}

function getDriverScoreClasses(score: number) {
  if (score >= 85) return "text-emerald-300";
  if (score >= 65) return "text-orange-300";
  return "text-red-300";
}

export default function PendingRequestEntry({
  request,
  isExpanded,
  isActionLoading,
  onToggle,
  onAccept,
  onDecline,
}: PendingRequestEntryProps) {
  return (
    <article className="bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-card-soft"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-main">
              Driver: {request.driver.name}
            </h3>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getRequestStatusClasses(
                request.status
              )}`}
            >
              {request.status}
            </span>

            <PriorityBadge priority={request.mission.priority} />
          </div>

          <p className="mt-1 truncate text-sm text-muted">
            Delivery: {request.mission.title} - To:{" "}
            {request.mission.dropoff?.address || "Dropoff TBD"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span
            className={`text-sm font-black ${getDriverScoreClasses(
              request.driverScore
            )}`}
          >
            {request.driverScore}%
          </span>

          <span className="text-xl text-muted">{isExpanded ? "^" : "v"}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-app bg-app/60 px-5 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <DetailTile label="Driver">
              <p className="font-semibold text-main">{request.driver.name}</p>
              <p className="mt-1 text-sm capitalize text-muted">
                Status: {request.driver.status.replace("_", " ")}
              </p>
            </DetailTile>

            <DetailTile label="From">
              <p className="font-semibold text-main">
                {request.mission.pickup?.address || "Pickup location TBD"}
              </p>
            </DetailTile>

            <DetailTile label="To">
              <p className="font-semibold text-main">
                {request.mission.dropoff?.address || "Dropoff location TBD"}
              </p>
            </DetailTile>

            <DetailTile label="Request Time">
              <p className="font-semibold text-main">
                {formatDateTime(request.requestedAt)}
              </p>
              <p className="mt-1 text-sm text-muted">
                Initially published: {formatDateTime(request.mission.created_at)}
              </p>
            </DetailTile>

            <DetailTile label="Driver Score">
              <p
                className={`text-3xl font-black ${getDriverScoreClasses(
                  request.driverScore
                )}`}
              >
                {request.driverScore}%
              </p>
              <p className="mt-1 text-sm text-muted">
                Estimated compatibility score
              </p>
            </DetailTile>

            <DetailTile label="Urgency">
              <PriorityBadge priority={request.mission.priority} />
            </DetailTile>

            <DetailTile label="Cargo / Product" className="md:col-span-2">
              <p className="font-semibold text-main">
                {request.mission.description || "No product description"}
              </p>
              <p className="mt-1 text-sm text-muted">
                {request.mission.cargo?.weight_kg ?? "?"} kg -{" "}
                {request.mission.cargo?.volume_liters ?? "?"} L
                {request.mission.cargo?.requires_cooling
                  ? " - Cooling required"
                  : ""}
              </p>
            </DetailTile>

            <DetailTile label="Request Status">
              <p
                className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold capitalize ${getRequestStatusClasses(
                  request.status
                )}`}
              >
                {request.status}
              </p>
            </DetailTile>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-app pt-5 sm:flex-row sm:justify-end">
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
              onClick={() => onAccept(request)}
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
