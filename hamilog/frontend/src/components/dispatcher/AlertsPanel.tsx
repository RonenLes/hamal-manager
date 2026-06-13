// src/components/dispatcher/AlertsPanel.tsx

import type { Mission, Driver } from "@/lib/api-client";
import DashboardPanel from "./DashboardPanel";

type AlertsPanelProps = {
  missions: Mission[];
  drivers: Driver[];
};

export default function AlertsPanel({ missions, drivers }: AlertsPanelProps) {
  const unassignedCount = missions.filter(
    (mission) =>
      mission.status === "available" && !mission.assigned_driver_id
  ).length;

  const offlineDrivers = drivers.filter(
    (driver) => driver.status === "offline"
  );

  const coolingMissions = missions.filter(
    (mission) =>
      mission.status === "available" && mission.cargo?.requires_cooling
  );

  const alerts = [
    ...(unassignedCount > 0
      ? [
          {
            type: "warning",
            title: `${unassignedCount} mission(s) need assignment`,
            subtitle: "Assign a driver as soon as possible.",
          },
        ]
      : []),

    ...offlineDrivers.map((driver) => ({
      type: "danger",
      title: `${driver.name} is offline`,
      subtitle: "Driver is currently unavailable.",
    })),

    ...coolingMissions.map((mission) => ({
      type: "info",
      title: `${mission.title} requires cooling`,
      subtitle: "Use a vehicle that supports refrigerated cargo.",
    })),
  ];

  return (
    <DashboardPanel title="Alerts" count={alerts.length} accent="orange">
      <div className="space-y-3">
        {alerts.length === 0 && (
          <p className="text-sm text-muted">No alerts right now.</p>
        )}

        {alerts.map((alert, index) => {
          const classes =
            alert.type === "danger"
              ? "alert-danger"
              : alert.type === "warning"
                ? "alert-warning"
                : "alert-info";

          return (
            <div
              key={`${alert.title}-${index}`}
              className={`rounded-xl border p-4 ${classes}`}
            >
              <p className="font-semibold">{alert.title}</p>
              <p className="mt-1 text-sm opacity-80">{alert.subtitle}</p>
            </div>
          );
        })}
      </div>
    </DashboardPanel>
  );
}