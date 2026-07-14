"use client";

import type { MissionDeliveryRequest } from "@/lib/api-client";
import { formatIdealDeliveryTime } from "@/lib/mission-time";
import DetailTile from "@/components/dispatcher/shared/DetailTile";
import PriorityBadge from "@/components/dispatcher/shared/PriorityBadge";
import CollapseDetailsButton from "@/components/shared/CollapseDetailsButton";

type DispatcherRequestCardProps = {
  request: MissionDeliveryRequest;
  isExpanded: boolean;
  isActionLoading: boolean;
  onToggle: () => void;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
};

function toMatchPercentage(score: number) {
  return Math.round(score * 100);
}

export default function DispatcherRequestCard({
  request,
  isExpanded,
  isActionLoading,
  onToggle,
  onAccept,
  onDecline,
}: DispatcherRequestCardProps) {
  const mission = request.mission;
  if (!mission) return null;

  const matchScore = toMatchPercentage(request.match_score);

  return (
    <article
      className={`w-full overflow-hidden rounded-2xl border border-app bg-card p-3 shadow-xl transition hover:bg-card-soft sm:p-5 ${
        isExpanded
          ? "relative z-10 outline outline-2 outline-blue-500/70 shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
          : ""
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col gap-3 text-left sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-lg font-black text-main">
              {mission.title}
            </h3>
            <PriorityBadge priority={mission.priority} />
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted">
            {request.note || mission.description || "No note provided."}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300">
            {matchScore}% match
          </span>
          <span className="rounded-full border border-app bg-card-soft px-2.5 py-1 text-xs font-black text-muted">
            {isExpanded ? "Hide" : "Details"}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 min-h-64 max-h-[75vh] resize-y overflow-auto border-t border-blue-500/40 pt-4 sm:mt-5 sm:pt-5">
          <CollapseDetailsButton onCollapse={onToggle} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <DetailTile label="Dispatcher Note" className="sm:col-span-2">
              <p className="text-sm leading-6 text-muted">
                {request.note || "No personal note was added."}
              </p>
            </DetailTile>

            <DetailTile label="Description" className="sm:col-span-2">
              <p className="text-sm leading-6 text-muted">
                {mission.description || "No description provided."}
              </p>
            </DetailTile>

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

            <DetailTile label="Weight">
              <p className="text-2xl font-black text-blue-300">
                {mission.cargo?.weight_kg ?? "?"} kg
              </p>
            </DetailTile>

            <DetailTile label="Volume">
              <p className="text-2xl font-black text-cyan-300">
                {mission.cargo?.volume_liters ?? "?"} L
              </p>
            </DetailTile>

            <DetailTile label="Ideal Delivery Time">
              <p className="font-semibold text-main">
                {formatIdealDeliveryTime(mission.ideal_delivery_time)}
              </p>
            </DetailTile>

            <DetailTile label="Cooling">
              <p className="font-semibold text-main">
                {mission.cargo?.requires_cooling
                  ? "Cooling required"
                  : "No cooling needed"}
              </p>
            </DetailTile>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-app pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onDecline(request.id)}
              disabled={isActionLoading}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-main transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => onAccept(request.id)}
              disabled={isActionLoading}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-main transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isActionLoading ? "Accepting..." : "Accept"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
