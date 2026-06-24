// src/components/dispatcher/dashboard/TodaysSchedule.tsx

import type { Mission, Driver } from "@/lib/api-client";
import { formatTime24FromValue } from "@/lib/date-format";
import DashboardPanel from "./DashboardPanel";

type TodaysScheduleProps = {
  missions: Mission[];
  drivers: Driver[];
};

function formatTime(date?: string) {
  return formatTime24FromValue(date, "Now");
}

export default function TodaysSchedule({
  missions,
  drivers,
}: TodaysScheduleProps) {
  const activeMissions = missions.filter(
    (mission) =>
      mission.status === "assigned" || mission.status === "in_transit"
  );

  function getDriverName(driverId?: string | null) {
    if (!driverId) return "No driver assigned";

    return (
      drivers.find((driver) => driver.id === driverId)?.name ||
      "Unknown driver"
    );
  }

  return (
    <DashboardPanel
      title="Today's Schedule"
      count={activeMissions.length}
      accent="blue"
    >
      <div className="space-y-4">
        {activeMissions.length === 0 && (
          <p className="text-sm text-muted">No scheduled missions yet.</p>
        )}

        {activeMissions.map((mission) => (
          <div
            key={mission.id}
            className="border-b border-app pb-4 last:border-b-0"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-lg font-black text-main">
                {formatTime(mission.created_at)}
              </div>

              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium capitalize text-blue-300">
                {mission.status.replace("_", " ")}
              </span>
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

              <div className="pt-2 text-muted">
                Driver: {getDriverName(mission.assigned_driver_id)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}
