// src/components/dispatcher/dashboard/UnassignedMissions.tsx

import type { Mission } from "@/lib/api-client";
import { formatTime24FromValue } from "@/lib/date-format";
import DashboardPanel from "./DashboardPanel";
import PriorityBadge from "../shared/PriorityBadge";

type UnassignedMissionsProps = {
  missions: Mission[];
};

function formatTime(date?: string) {
  return formatTime24FromValue(date, "New");
}

export default function UnassignedMissions({
  missions,
}: UnassignedMissionsProps) {
  const unassigned = missions.filter(
    (mission) =>
      mission.status === "available" && !mission.assigned_driver_id
  );

  return (
    <DashboardPanel
      title="Unassigned"
      count={unassigned.length}
      accent="red"
    >
      <div className="space-y-4">
        {unassigned.length === 0 && (
          <p className="text-sm text-muted">No unassigned missions.</p>
        )}

        {unassigned.map((mission) => (
          <article
            key={mission.id}
            className="border-b border-app pb-4 last:border-b-0"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-lg font-black text-main">
                {formatTime(mission.created_at)}
              </p>

              <PriorityBadge priority={mission.priority} />
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-soft">From</p>
                <p className="text-main">
                  {mission.pickup?.address || "Pickup location TBD"}
                </p>
              </div>

              <div>
                <p className="text-xs text-soft">To</p>
                <p className="text-main">
                  {mission.dropoff?.address || "Dropoff location TBD"}
                </p>
              </div>

              <p className="pt-2 text-orange-300">No driver assigned</p>
            </div>
          </article>
        ))}
      </div>
    </DashboardPanel>
  );
}
