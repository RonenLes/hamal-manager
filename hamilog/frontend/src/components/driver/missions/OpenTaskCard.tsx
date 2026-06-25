"use client";

import { useState } from "react";

import type { Mission } from "@/lib/api-client";
import { formatIdealDeliveryTime } from "@/lib/mission-time";
import DetailTile from "@/components/dispatcher/shared/DetailTile";
import PriorityBadge from "@/components/dispatcher/shared/PriorityBadge";

import MatchScoreBar from "../shared/MatchScoreBar";

import TextToSpeechButton from "@/components/shared/TextToSpeechButton";


type OpenTaskCardProps = {
  mission: Mission;
  isExpanded: boolean;
  accepting: boolean;
  onToggle: () => void;
  onAccept: (missionId: string) => void;
};

export default function OpenTaskCard({
  mission,
  isExpanded,
  accepting,
  onToggle,
  onAccept,
}: OpenTaskCardProps) {
  const [confirming, setConfirming] = useState(false);

  const missionSpeechText = `
Mission: ${mission.title}.
Description: ${mission.description || "No description provided"}.
Priority: ${mission.priority}.
Pickup: ${mission.pickup?.address || "Pickup location TBD"}.
Dropoff: ${mission.dropoff?.address || "Dropoff location TBD"}.
Cargo: ${mission.cargo?.weight_kg ?? "unknown"} kilograms, ${mission.cargo?.volume_liters ?? "unknown"
    } liters.
${mission.cargo?.requires_cooling ? "Cooling is required." : "No cooling needed."}
`;

  const handleToggle = () => {
    if (isExpanded) {
      setConfirming(false);
    }

    onToggle();
  };

  return (
    <article className="rounded-2xl border border-app bg-card p-5 shadow-xl transition hover:bg-card-soft">
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
        aria-expanded={isExpanded}
        className="w-full cursor-pointer text-left"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-main">
              {mission.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted">
              {mission.description}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TextToSpeechButton text={missionSpeechText} />

            <PriorityBadge priority={mission.priority} />

            <span className="rounded-full border border-app bg-card-soft px-2.5 py-1 text-xs font-black text-muted">
              {isExpanded ? "Hide" : "Details"}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-app bg-card-soft px-3 py-1 text-xs font-bold text-blue-300">
            {mission.cargo?.weight_kg ?? "?"} kg
          </span>
          <span className="rounded-full border border-app bg-card-soft px-3 py-1 text-xs font-bold text-cyan-300">
            {mission.cargo?.volume_liters ?? "?"} L
          </span>
          <span className="rounded-full border border-app bg-card-soft px-3 py-1 text-xs font-bold text-orange-300">
            {formatIdealDeliveryTime(mission.ideal_delivery_time)}
          </span>
          {mission.cargo?.requires_cooling && (
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
              Cooling
            </span>
          )}
        </div>

        {mission.match_score != null && (
          <MatchScoreBar score={mission.match_score} />
        )}
      </div>

      {isExpanded && (
        <div className="mt-5 border-t border-app pt-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DetailTile label="Description" className="md:col-span-2">
              <p className="text-sm leading-6 text-muted">
                {mission.description || "No description provided."}
              </p>
            </DetailTile>

            {mission.match_score != null && (
              <DetailTile label="Match" className="md:col-span-2">
                <MatchScoreBar score={mission.match_score} />
              </DetailTile>
            )}

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

            <DetailTile label="Mission ID">
              <p className="break-all font-mono text-sm text-muted">
                {mission.id}
              </p>
            </DetailTile>
          </div>

          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="mt-5 w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
            >
              Request Mission
            </button>
          ) : (
            <div className="mt-5 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
              <p className="text-sm font-semibold text-orange-300">
                Send this mission request to the dispatcher?
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-xl border border-app bg-card-soft px-5 py-2.5 text-sm font-bold text-main transition hover:bg-card-soft"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onAccept(mission.id)}
                  disabled={accepting}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {accepting ? "Sending..." : "Send Request"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
