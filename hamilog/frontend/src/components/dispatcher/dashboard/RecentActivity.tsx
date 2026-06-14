// src/components/dispatcher/dashboard/RecentActivity.tsx

import type { Mission, Driver } from "@/lib/api-client";
import DashboardPanel from "./DashboardPanel";

type RecentActivityProps = {
  missions: Mission[];
  drivers: Driver[];
};

function formatTime(date?: string) {
  if (!date) return "Recently";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Recently";
  }

  return parsed.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RecentActivity({
  missions,
  drivers,
}: RecentActivityProps) {
  const recentMissions = [...missions]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 6);

  function getDriverName(driverId?: string | null) {
    if (!driverId) return null;

    return drivers.find((driver) => driver.id === driverId)?.name || null;
  }

  return (
    <DashboardPanel title="Recent Activity" accent="purple">
      <div className="space-y-4">
        {recentMissions.length === 0 && (
          <p className="text-sm text-muted">No recent activity.</p>
        )}

        {recentMissions.map((mission) => {
          const driverName = getDriverName(mission.assigned_driver_id);

          return (
            <div key={mission.id} className="flex gap-3">
              <span
                className={`mt-1 h-3 w-3 rounded-full ${
                  mission.status === "delivered"
                    ? "bg-emerald-400"
                    : mission.status === "available"
                      ? "bg-blue-400"
                      : mission.status === "cancelled"
                        ? "bg-red-400"
                        : "bg-orange-400"
                }`}
              />

              <div className="border-l border-app pl-4">
                <p className="font-medium text-main">
                  {mission.title} — {mission.status.replace("_", " ")}
                </p>

                {driverName && (
                  <p className="text-sm text-muted">{driverName}</p>
                )}

                <p className="mt-1 text-xs text-soft">
                  {formatTime(mission.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardPanel>
  );
}
