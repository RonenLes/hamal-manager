import { useState } from "react";

import type { Mission } from "@/lib/api-client";
import { formatIdealDeliveryTime } from "@/lib/mission-time";
import DetailTile from "@/components/dispatcher/shared/DetailTile";
import PriorityBadge from "@/components/dispatcher/shared/PriorityBadge";

import StatusProgress from "../shared/StatusProgress";

import TextToSpeechButton from "@/components/shared/TextToSpeechButton";

type ActiveMissionCardProps = {
  mission: Mission;
  onMarkDelivered: (id: string) => void;
  onUpdateStatus: (id: string, status: "in_transit") => void;
  onCancelMission: (id: string, reason: string) => void;
};

const cancellationReasons = [
  "Vehicle problem",
  "Medical or personal emergency",
  "Pickup location unreachable",
  "Cargo does not match mission details",
  "Other",
];

// Renders the active mission card component.
export default function ActiveMissionCard({
  mission,
  onMarkDelivered,
  onUpdateStatus,
  onCancelMission,
}: ActiveMissionCardProps) {
  const missionSpeechText = `
Mission: ${mission.title}.
Description: ${mission.description}.
Priority: ${mission.priority}.
Status: ${mission.status}.
Pickup location: ${mission.pickup?.address || "Pickup location TBD"}.
Dropoff location: ${mission.dropoff?.address || "Dropoff location TBD"}.
Cargo: ${mission.cargo?.weight_kg ?? "unknown"} kilograms, ${mission.cargo?.volume_liters ?? "unknown"
    } liters.
${mission.cargo?.requires_cooling ? "Cooling is required." : "Cooling is not required."}
`;

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState(cancellationReasons[0]);

  // Submits the cancellation.
  function submitCancellation() {
    onCancelMission(mission.id, cancelReason);
    setIsCancelOpen(false);
  }

  return (
    <article className="rounded-xl border border-app bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-main">{mission.title}</h2>
          <p className="mt-1 text-sm text-muted">{mission.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <TextToSpeechButton text={missionSpeechText} />
          <PriorityBadge priority={mission.priority} />
        </div>
      </div>

      <div className="mb-5">
        <StatusProgress status={mission.status} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
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

        <DetailTile label="Cargo" className="md:col-span-2">
          <p className="font-semibold text-main">
            {mission.cargo?.weight_kg ?? "?"} kg -{" "}
            {mission.cargo?.volume_liters ?? "?"} L
            {mission.cargo?.requires_cooling ? " - Cooling required" : ""}
          </p>
        </DetailTile>

        <DetailTile label="Ideal Delivery Time">
          <p className="font-semibold text-main">
            {formatIdealDeliveryTime(mission.ideal_delivery_time)}
          </p>
        </DetailTile>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={`https://waze.com/ul?ll=${mission.dropoff?.lat || 32.08},${mission.dropoff?.lng || 34.78
            }&navigate=yes`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-app bg-card-soft px-5 py-2.5 text-center text-sm font-bold text-main transition hover:bg-card-soft"
        >
          Open in Waze
        </a>

        {mission.status === "assigned" && (
          <button
            type="button"
            onClick={() => onUpdateStatus(mission.id, "in_transit")}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            Start Delivery
          </button>
        )}

        {mission.status === "in_transit" && (
          <button
            type="button"
            onClick={() => onMarkDelivered(mission.id)}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500"
          >
            Mark Delivered
          </button>
        )}

        {(mission.status === "assigned" || mission.status === "in_transit") && (
          <button
            type="button"
            onClick={() => setIsCancelOpen(true)}
            className="rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm font-bold text-red-700 dark:text-red-200 transition hover:bg-red-500/20"
          >
            Cancel Mission
          </button>
        )}
      </div>

      {isCancelOpen && (
        <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <h3 className="text-sm font-bold text-red-100">Cancel mission</h3>
          <p className="mt-1 text-sm text-muted">
            Choose the reason. This will notify dispatch and return the mission
            to the available pool.
          </p>

          <select
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            className="mt-4 w-full rounded-xl border border-app bg-app px-4 py-3 text-main outline-none focus:border-red-400"
          >
            {cancellationReasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsCancelOpen(false)}
              className="rounded-xl border border-app px-5 py-2.5 text-sm font-bold text-main transition hover:bg-card-soft"
            >
              Keep Mission
            </button>
            <button
              type="button"
              onClick={submitCancellation}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-500"
            >
              Confirm Cancel
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
