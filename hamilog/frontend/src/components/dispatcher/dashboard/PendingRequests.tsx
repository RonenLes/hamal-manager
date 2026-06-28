// src/components/dispatcher/dashboard/PendingRequests.tsx

import Link from "next/link";
import type { Mission, MissionDeliveryRequest } from "@/lib/api-client";
import { formatIdealDeliveryTime } from "@/lib/mission-time";
import DashboardPanel from "./DashboardPanel";
import PriorityBadge from "../shared/PriorityBadge";

type PendingRequestsProps = {
  missionRequests: MissionDeliveryRequest[];
};

type PendingMissionGroup = {
  mission: Mission;
  requestCount: number;
};

// Returns the pending mission groups.
function getPendingMissionGroups(
  missionRequests: MissionDeliveryRequest[]
): PendingMissionGroup[] {
  const groups = new Map<string, PendingMissionGroup>();

  for (const request of missionRequests) {
    if (!request.mission) continue;
    if (request.mission.status !== "available") continue;
    if (request.mission.assigned_driver_id) continue;

    const existing = groups.get(request.mission.id);

    groups.set(request.mission.id, {
      mission: request.mission,
      requestCount: (existing?.requestCount ?? 0) + 1,
    });
  }

  return [...groups.values()].sort((a, b) => {
    const requestDiff = b.requestCount - a.requestCount;
    if (requestDiff !== 0) return requestDiff;

    return (
      new Date(b.mission.created_at).getTime() -
      new Date(a.mission.created_at).getTime()
    );
  });
}

// Renders the pending requests component.
export default function PendingRequests({ missionRequests }: PendingRequestsProps) {
  const pendingMissionGroups = getPendingMissionGroups(missionRequests);
  const visibleGroups = pendingMissionGroups.slice(0, 5);

  return (
    <DashboardPanel
      title="Pending Requests"
      count={pendingMissionGroups.length}
      accent="orange"
      seeAllHref="/dispatcher/pending-requests"
    >
      <div className="space-y-4">
        {visibleGroups.length === 0 && (
          <p className="text-sm text-muted">No pending requests.</p>
        )}

        {visibleGroups.map(({ mission, requestCount }) => (
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

              <div className="flex shrink-0 flex-col items-end gap-2">
                <PriorityBadge priority={mission.priority} />
                <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">
                  {requestCount} request{requestCount === 1 ? "" : "s"}
                </span>
              </div>
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

              <p>
                <span className="text-soft">Ideal time:</span>{" "}
                {formatIdealDeliveryTime(mission.ideal_delivery_time)}
              </p>
            </div>

            <Link
              href={`/dispatcher/pending-requests/${mission.id}`}
              className="mt-4 block w-full rounded-xl bg-orange-500 px-4 py-2 text-center text-sm font-bold text-white transition hover:bg-orange-400"
            >
              Preview
            </Link>
          </article>
        ))}
      </div>
    </DashboardPanel>
  );
}
