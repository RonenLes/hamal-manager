// src/components/dispatcher/dashboard/PendingRequests.tsx

import type { Mission } from "@/lib/api-client";
import DashboardPanel from "./DashboardPanel";
import PriorityBadge from "../shared/PriorityBadge";

type PendingRequestsProps = {
  missions: Mission[];
  onPreview?: (mission: Mission) => void;
};

export default function PendingRequests({
  missions,
  onPreview,
}: PendingRequestsProps) {
  return (
    <DashboardPanel
      title="Pending Requests"
      count={missions.length}
      accent="orange"
    >
      <div className="space-y-4">
        {missions.length === 0 && (
          <p className="text-sm text-muted">No pending requests.</p>
        )}

        {missions.map((mission) => (
          <article
            key={mission.id}
            className="rounded-xl border border-app bg-app/70 p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-main">{mission.title}</h3>
                <p className="mt-1 text-sm text-muted">
                  {mission.description}
                </p>
              </div>

              <PriorityBadge priority={mission.priority} />
            </div>

            <div className="space-y-2 text-sm text-muted">
              <p>
                <span className="text-soft">Cargo:</span>{" "}
                {mission.cargo?.weight_kg ?? "?"} kg ·{" "}
                {mission.cargo?.volume_liters ?? "?"} L
                {mission.cargo?.requires_cooling ? " · Cooling required" : ""}
              </p>

              <p>
                <span className="text-soft">From:</span>{" "}
                {mission.pickup?.address || "TBD"}
              </p>

              <p>
                <span className="text-soft">To:</span>{" "}
                {mission.dropoff?.address || "TBD"}
              </p>
            </div>

            <button
              onClick={() => onPreview?.(mission)}
              className="mt-4 w-full rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-main hover:bg-orange-400"
            >
              Preview
            </button>
          </article>
        ))}
      </div>
    </DashboardPanel>
  );
}
