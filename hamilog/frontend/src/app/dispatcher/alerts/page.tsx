"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type Mission,
  type Driver,
  getMissions,
  getDrivers,
  getToken,
  getStoredUser,
} from "@/lib/api-client";

import { CAR_SPECS } from "@/lib/car-specs";
import PriorityBadge from "@/components/dispatcher/PriorityBadge";

type AlertLevel = "critical" | "warning" | "info" | "success";

type DispatcherAlert = {
  id: string;
  level: AlertLevel;
  title: string;
  summary: string;
  createdAt: string;
  type: string;
  mission?: Mission;
  driver?: Driver;
};

function formatDateTime(dateValue?: string) {
  if (!dateValue) return "Unknown";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getWaitingTime(dateValue?: string) {
  if (!dateValue) return "Unknown";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

function getAlertClasses(level: AlertLevel) {
  switch (level) {
    case "critical":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    case "warning":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
    case "info":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "success":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }
}

function getAlertDotClasses(level: AlertLevel) {
  switch (level) {
    case "critical":
      return "bg-red-400";
    case "warning":
      return "bg-orange-400";
    case "info":
      return "bg-blue-400";
    case "success":
      return "bg-emerald-400";
  }
}

function getAlertIcon(level: AlertLevel) {
  switch (level) {
    case "critical":
      return "🚨";
    case "warning":
      return "⚠️";
    case "info":
      return "ℹ️";
    case "success":
      return "✅";
  }
}

function getLevelRank(level: AlertLevel) {
  switch (level) {
    case "critical":
      return 0;
    case "warning":
      return 1;
    case "info":
      return 2;
    case "success":
      return 3;
  }
}

function getCompatibleDrivers(mission: Mission, drivers: Driver[]) {
  return drivers.filter((driver) => {
    if (driver.status !== "available") return false;

    const spec = CAR_SPECS[driver.car_type];

    if (!spec || !mission.cargo) return true;

    const canCarryWeight =
      mission.cargo.weight_kg === undefined ||
      spec.max_weight >= mission.cargo.weight_kg;

    const canCarryVolume =
      mission.cargo.volume_liters === undefined ||
      spec.max_volume >= mission.cargo.volume_liters;

    const canCool = !mission.cargo.requires_cooling || Boolean(spec.cooling);

    return canCarryWeight && canCarryVolume && canCool;
  });
}

function StatBox({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-app bg-card p-5 shadow-xl">
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-2 text-3xl font-black text-main">{value}</p>
      <p className="mt-1 text-xs text-soft">{subtitle}</p>
    </div>
  );
}

function buildAlerts(missions: Mission[], drivers: Driver[]) {
  const alerts: DispatcherAlert[] = [];

  missions.forEach((mission) => {
    const waitingMinutes = mission.created_at
      ? Math.floor((Date.now() - new Date(mission.created_at).getTime()) / 60000)
      : 0;

    const isUnassigned =
      mission.status === "available" && !mission.assigned_driver_id;

    if (isUnassigned && mission.priority === "critical") {
      alerts.push({
        id: `critical-unassigned-${mission.id}`,
        level: "critical",
        type: "Critical Unassigned Mission",
        title: "Critical mission has no driver",
        summary: `${mission.title} needs immediate assignment.`,
        createdAt: mission.created_at,
        mission,
      });
    } else if (isUnassigned) {
      alerts.push({
        id: `unassigned-${mission.id}`,
        level: "warning",
        type: "Unassigned Mission",
        title: "Mission waiting for driver",
        summary: `${mission.title} is still in the delivery pool.`,
        createdAt: mission.created_at,
        mission,
      });
    }

    if (mission.cargo?.requires_cooling && mission.status === "available") {
      alerts.push({
        id: `cooling-${mission.id}`,
        level: "info",
        type: "Cooling Required",
        title: "Cooling vehicle required",
        summary: `${mission.title} requires refrigerated transport.`,
        createdAt: mission.created_at,
        mission,
      });
    }

    if (isUnassigned && waitingMinutes >= 30) {
      alerts.push({
        id: `stale-${mission.id}`,
        level: "warning",
        type: "Stale Mission",
        title: "Mission waiting too long",
        summary: `${mission.title} has been waiting for ${getWaitingTime(
          mission.created_at
        )}.`,
        createdAt: mission.created_at,
        mission,
      });
    }

    if (isUnassigned) {
      const compatibleDrivers = getCompatibleDrivers(mission, drivers);

      if (compatibleDrivers.length === 0) {
        alerts.push({
          id: `no-compatible-driver-${mission.id}`,
          level: "critical",
          type: "No Compatible Driver",
          title: "No compatible driver found",
          summary: `${mission.title} has no available compatible driver.`,
          createdAt: mission.created_at,
          mission,
        });
      }
    }
  });

  drivers.forEach((driver) => {
    if (driver.status === "offline") {
      alerts.push({
        id: `offline-driver-${driver.id}`,
        level: "warning",
        type: "Driver Offline",
        title: "Driver is offline",
        summary: `${driver.name} is currently unavailable.`,
        createdAt: new Date().toISOString(),
        driver,
      });
    }

    if (driver.status === "blacklisted") {
      alerts.push({
        id: `blacklisted-driver-${driver.id}`,
        level: "critical",
        type: "Driver Blocked",
        title: "Driver is blocked",
        summary: `${driver.name} is marked as blacklisted.`,
        createdAt: new Date().toISOString(),
        driver,
      });
    }
  });

  if (alerts.length === 0) {
    alerts.push({
      id: "system-ok",
      level: "success",
      type: "System Status",
      title: "No active alerts",
      summary: "All dispatcher systems look normal.",
      createdAt: new Date().toISOString(),
    });
  }

  return alerts.sort((a, b) => {
    const levelDiff = getLevelRank(a.level) - getLevelRank(b.level);

    if (levelDiff !== 0) return levelDiff;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export default function AlertsPage() {
  const router = useRouter();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (!token || !user || user.role !== "dispatcher") {
      router.replace("/login?role=dispatcher");
    }
  }, [router]);

  async function fetchData() {
    try {
      const [missionsData, driversData] = await Promise.all([
        getMissions(),
        getDrivers(),
      ]);

      setMissions(missionsData);
      setDrivers(driversData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const alerts = useMemo(() => {
    return buildAlerts(missions, drivers).filter(
      (alert) => !dismissedIds.includes(alert.id)
    );
  }, [missions, drivers, dismissedIds]);

  const stats = useMemo(() => {
    return {
      total: alerts.length,
      critical: alerts.filter((alert) => alert.level === "critical").length,
      warning: alerts.filter((alert) => alert.level === "warning").length,
      info: alerts.filter((alert) => alert.level === "info").length,
      success: alerts.filter((alert) => alert.level === "success").length,
    };
  }, [alerts]);

  function handleDismiss(alertId: string) {
    setDismissedIds((current) => [...current, alertId]);
    setExpandedId(null);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app text-main">
        Loading alerts...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-400">
            Operations Monitoring
          </p>

          <h1 className="mt-1 text-3xl font-black">Alerts</h1>

          <p className="mt-2 text-muted">
            Review urgent mission, driver, cargo, and system alerts.
          </p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatBox title="Alerts" value={stats.total} subtitle="Active alerts" />
          <StatBox
            title="Critical"
            value={stats.critical}
            subtitle="Needs immediate action"
          />
          <StatBox
            title="Warnings"
            value={stats.warning}
            subtitle="Needs attention"
          />
          <StatBox title="Info" value={stats.info} subtitle="Important notes" />
          <StatBox title="OK" value={stats.success} subtitle="Normal status" />
        </section>

        <section className="rounded-2xl border border-app bg-card shadow-xl">
          <div className="border-b border-app px-5 py-4">
            <h2 className="text-xl font-bold">Alert Entries</h2>
            <p className="mt-1 text-sm text-muted">
              Click an alert to expand full details.
            </p>
          </div>

          <div className="divide-y divide-white/10">
            {alerts.length === 0 && (
              <div className="p-8 text-center text-muted">
                No active alerts.
              </div>
            )}

            {alerts.map((alert) => {
              const isExpanded = expandedId === alert.id;
              const mission = alert.mission;
              const driver = alert.driver;

              return (
                <article key={alert.id} className="bg-card">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : alert.id)
                    }
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-card-soft"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span
                        className={`h-3 w-3 shrink-0 rounded-full ${getAlertDotClasses(
                          alert.level
                        )}`}
                      />

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg">
                            {getAlertIcon(alert.level)}
                          </span>

                          <h3 className="truncate font-bold text-main">
                            {alert.title}
                          </h3>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getAlertClasses(
                              alert.level
                            )}`}
                          >
                            {alert.level}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-sm text-muted">
                          {alert.summary}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-soft">
                        {alert.type}
                      </span>

                      <span className="text-xl text-muted">
                        {isExpanded ? "⌃" : "⌄"}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-app bg-app/60 px-5 py-5">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-xl border border-app bg-card p-4">
                          <p className="text-xs uppercase tracking-wider text-soft">
                            Alert Type
                          </p>

                          <p className="mt-2 font-semibold text-main">
                            {alert.type}
                          </p>
                        </div>

                        <div className="rounded-xl border border-app bg-card p-4">
                          <p className="text-xs uppercase tracking-wider text-soft">
                            Alert Level
                          </p>

                          <p
                            className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-bold capitalize ${getAlertClasses(
                              alert.level
                            )}`}
                          >
                            {alert.level}
                          </p>
                        </div>

                        <div className="rounded-xl border border-app bg-card p-4">
                          <p className="text-xs uppercase tracking-wider text-soft">
                            Created
                          </p>

                          <p className="mt-2 font-semibold text-main">
                            {formatDateTime(alert.createdAt)}
                          </p>
                        </div>

                        <div className="rounded-xl border border-app bg-card p-4 md:col-span-3">
                          <p className="text-xs uppercase tracking-wider text-soft">
                            Summary
                          </p>

                          <p className="mt-2 font-semibold text-main">
                            {alert.summary}
                          </p>
                        </div>

                        {mission && (
                          <>
                            <div className="rounded-xl border border-app bg-card p-4">
                              <p className="text-xs uppercase tracking-wider text-soft">
                                Mission
                              </p>

                              <p className="mt-2 font-semibold text-main">
                                {mission.title}
                              </p>

                              <p className="mt-1 text-sm text-muted">
                                Status: {mission.status.replace("_", " ")}
                              </p>
                            </div>

                            <div className="rounded-xl border border-app bg-card p-4">
                              <p className="text-xs uppercase tracking-wider text-soft">
                                Urgency
                              </p>

                              <div className="mt-2">
                                <PriorityBadge priority={mission.priority} />
                              </div>
                            </div>

                            <div className="rounded-xl border border-app bg-card p-4">
                              <p className="text-xs uppercase tracking-wider text-soft">
                                Waiting Time
                              </p>

                              <p className="mt-2 font-semibold text-main">
                                {getWaitingTime(mission.created_at)}
                              </p>
                            </div>

                            <div className="rounded-xl border border-app bg-card p-4">
                              <p className="text-xs uppercase tracking-wider text-soft">
                                From
                              </p>

                              <p className="mt-2 font-semibold text-main">
                                {mission.pickup?.address ||
                                  "Pickup location TBD"}
                              </p>
                            </div>

                            <div className="rounded-xl border border-app bg-card p-4">
                              <p className="text-xs uppercase tracking-wider text-soft">
                                To
                              </p>

                              <p className="mt-2 font-semibold text-main">
                                {mission.dropoff?.address ||
                                  "Dropoff location TBD"}
                              </p>
                            </div>

                            <div className="rounded-xl border border-app bg-card p-4">
                              <p className="text-xs uppercase tracking-wider text-soft">
                                Cargo
                              </p>

                              <p className="mt-2 font-semibold text-main">
                                {mission.description ||
                                  "No product description"}
                              </p>

                              <p className="mt-1 text-sm text-muted">
                                {mission.cargo?.weight_kg ?? "?"} kg ·{" "}
                                {mission.cargo?.volume_liters ?? "?"} L
                                {mission.cargo?.requires_cooling
                                  ? " · Cooling required"
                                  : ""}
                              </p>
                            </div>
                          </>
                        )}

                        {driver && (
                          <>
                            <div className="rounded-xl border border-app bg-card p-4">
                              <p className="text-xs uppercase tracking-wider text-soft">
                                Driver
                              </p>

                              <p className="mt-2 font-semibold text-main">
                                {driver.name}
                              </p>
                            </div>

                            <div className="rounded-xl border border-app bg-card p-4">
                              <p className="text-xs uppercase tracking-wider text-soft">
                                Driver Status
                              </p>

                              <p className="mt-2 font-semibold capitalize text-main">
                                {driver.status.replace("_", " ")}
                              </p>
                            </div>

                            <div className="rounded-xl border border-app bg-card p-4">
                              <p className="text-xs uppercase tracking-wider text-soft">
                                Vehicle
                              </p>

                              <p className="mt-2 font-semibold text-main">
                                {CAR_SPECS[driver.car_type]?.icon || "🚗"}{" "}
                                {CAR_SPECS[driver.car_type]?.label ||
                                  driver.car_type}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="mt-5 flex justify-end border-t border-app pt-5">
                        <button
                          type="button"
                          onClick={() => handleDismiss(alert.id)}
                          className="rounded-xl border border-app bg-card-soft px-5 py-2.5 text-sm font-bold text-main transition hover:bg-card-soft"
                        >
                          Dismiss Alert
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}