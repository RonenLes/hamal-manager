import Link from "next/link";

import type { Driver } from "@/lib/api-client";
import DashboardPanel from "./DashboardPanel";

type DriverStatusPanelProps = {
  drivers: Driver[];
};

// Renders the driver status panel component.
export default function DriverStatusPanel({ drivers }: DriverStatusPanelProps) {
  const visibleDrivers = drivers
    .filter((driver) => driver.status !== "blacklisted")
    .sort((a, b) => {
      if (a.status === "on_mission" && b.status !== "on_mission") return -1;
      if (a.status !== "on_mission" && b.status === "on_mission") return 1;

      if (a.status === "available" && b.status !== "available") return -1;
      if (a.status !== "available" && b.status === "available") return 1;

      return a.name.localeCompare(b.name);
    });

  return (
    <DashboardPanel
      title="Driver Status"
      count={visibleDrivers.filter((driver) => driver.status === "available").length}
      accent="green"
      seeAllHref="/dispatcher/drivers"
    >
      <div className="space-y-3">
        {visibleDrivers.map((driver) => (
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

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-card-soft px-3 py-1 text-xs capitalize text-muted">
                {driver.status.replace("_", " ")}
              </span>

              <Link
                href={`/dispatcher/messages/driver/${driver.id}`}
                aria-label={`Message ${driver.name}`}
                title={`Message ${driver.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white transition hover:bg-blue-500"
              >
                <span aria-hidden="true">✉</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}
