import type { Driver } from "@/lib/api-client";
import DashboardPanel from "./DashboardPanel";

type DriverStatusPanelProps = {
  drivers: Driver[];
};

export default function DriverStatusPanel({ drivers }: DriverStatusPanelProps) {
  return (
    <DashboardPanel
      title="Driver Status"
      count={drivers.filter((driver) => driver.status === "available").length}
      accent="green"
    >
      <div className="space-y-3">
        {drivers.map((driver) => (
          <div
            key={driver.id}
            className="flex items-center justify-between rounded-xl border border-app bg-app/70 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  driver.status === "available"
                    ? "bg-emerald-400"
                    : driver.status === "on_mission"
                      ? "bg-orange-400"
                      : "bg-slate-500"
                }`}
              />

              <div>
                <p className="font-medium text-main">{driver.name}</p>
                {driver.current_mission_id && (
                  <p className="text-xs text-muted">
                    Mission #{driver.current_mission_id}
                  </p>
                )}
              </div>
            </div>

            <span className="rounded-full bg-card-soft px-3 py-1 text-xs capitalize text-muted">
              {driver.status.replace("_", " ")}
            </span>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}