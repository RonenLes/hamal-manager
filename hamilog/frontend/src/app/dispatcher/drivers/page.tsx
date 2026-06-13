"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

type ExtendedDriver = Driver & {
  phone?: string;
  address?: string;
  score?: number;
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

function getDriverScore(driver: ExtendedDriver, index: number) {
  if (typeof driver.score === "number") return driver.score;

  // Temporary fallback score until backend sends real driver score
  return 90 - ((index * 7) % 28);
}

function getScoreClasses(score: number) {
  if (score >= 85) return "text-emerald-300";
  if (score >= 65) return "text-orange-300";
  return "text-red-300";
}

function getStatusClasses(isActive: boolean, status: string) {
  if (isActive) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "available") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  }

  if (status === "offline") {
    return "border-slate-500/30 bg-slate-500/10 text-muted";
  }

  return "border-orange-500/30 bg-orange-500/10 text-orange-300";
}

function getStatusDotClasses(isActive: boolean, status: string) {
  if (isActive) return "bg-emerald-400";
  if (status === "available") return "bg-blue-400";
  if (status === "offline") return "bg-slate-500";
  return "bg-orange-400";
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

function getActiveMissionForDriver(driver: Driver, missions: Mission[]) {
  if (driver.current_mission_id) {
    const missionFromDriver = missions.find(
      (mission) => mission.id === driver.current_mission_id
    );

    if (missionFromDriver) return missionFromDriver;
  }

  return missions.find(
    (mission) =>
      mission.assigned_driver_id === driver.id &&
      (mission.status === "assigned" || mission.status === "in_transit")
  );
}

function getDeliveriesMade(driver: Driver, missions: Mission[]) {
  return missions.filter(
    (mission) =>
      mission.assigned_driver_id === driver.id &&
      mission.status === "delivered"
  ).length;
}

export default function DriversPage() {
  const router = useRouter();

  const [drivers, setDrivers] = useState<ExtendedDriver[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedDriverId, setCopiedDriverId] = useState<string | null>(null);
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
      const [driversData, missionsData] = await Promise.all([
        getDrivers(),
        getMissions(),
      ]);

      setDrivers(driversData as ExtendedDriver[]);
      setMissions(missionsData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const activeDrivers = drivers.filter((driver) =>
      Boolean(getActiveMissionForDriver(driver, missions))
    ).length;

    const availableDrivers = drivers.filter(
      (driver) => driver.status === "available"
    ).length;

    const offlineDrivers = drivers.filter(
      (driver) => driver.status === "offline"
    ).length;

    const totalDeliveries = drivers.reduce((sum, driver) => {
      return sum + getDeliveriesMade(driver, missions);
    }, 0);

    return {
      total: drivers.length,
      active: activeDrivers,
      available: availableDrivers,
      offline: offlineDrivers,
      deliveries: totalDeliveries,
    };
  }, [drivers, missions]);

  const sortedDrivers = useMemo(() => {
    return [...drivers].sort((a, b) => {
      const aActive = Boolean(getActiveMissionForDriver(a, missions));
      const bActive = Boolean(getActiveMissionForDriver(b, missions));

      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;

      if (a.status === "available" && b.status !== "available") return -1;
      if (a.status !== "available" && b.status === "available") return 1;

      return a.name.localeCompare(b.name);
    });
  }, [drivers, missions]);

  async function handleCopyPhone(driverId: string, phone: string) {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedDriverId(driverId);

      setTimeout(() => {
        setCopiedDriverId(null);
      }, 1500);
    } catch {
      alert("Could not copy phone number.");
    }
  }

  if (loading) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-app text-main">
      Loading drivers...
    </main>
  );
}

return (
  <main className="min-h-screen bg-app p-6 text-main">
    <div className="mx-auto max-w-7xl">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
          Driver Management
        </p>

        <h1 className="mt-1 text-3xl font-black">Drivers</h1>

        <p className="mt-2 text-muted">
          View driver status, score, contact details, active delivery, and
          delivery history.
        </p>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatBox
          title="Drivers"
          value={stats.total}
          subtitle="Total drivers"
        />

        <StatBox
          title="Active"
          value={stats.active}
          subtitle="Currently delivering"
        />

        <StatBox
          title="Available"
          value={stats.available}
          subtitle="Ready for assignment"
        />

        <StatBox
          title="Offline"
          value={stats.offline}
          subtitle="Not available"
        />

        <StatBox
          title="Deliveries"
          value={stats.deliveries}
          subtitle="Completed total"
        />
      </section>

      <section className="rounded-2xl border border-app bg-card shadow-xl">
        <div className="border-b border-app px-5 py-4">
          <h2 className="text-xl font-bold text-main">Driver Entries</h2>

          <p className="mt-1 text-sm text-muted">
            Click a driver to expand full details.
          </p>
        </div>

        <div className="divide-y divide-[var(--border-app)]">
          {sortedDrivers.length === 0 && (
            <div className="p-8 text-center text-muted">
              No drivers found.
            </div>
          )}

          {sortedDrivers.map((driver, index) => {
            const isExpanded = expandedId === driver.id;
            const activeMission = getActiveMissionForDriver(driver, missions);
            const isActive = Boolean(activeMission);
            const deliveriesMade = getDeliveriesMade(driver, missions);
            const score = getDriverScore(driver, index);
            const spec = CAR_SPECS[driver.car_type];

            const phone = driver.phone || "No phone number yet";
            const address = driver.address || "No address yet";

            return (
              <article key={driver.id} className="bg-card">
                <div className="flex w-full items-center justify-between gap-4 px-5 py-4 transition hover:bg-[var(--bg-card-soft)]">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : driver.id)
                    }
                    className="flex min-w-0 flex-1 items-center gap-4 text-left"
                  >
                    <span
                      className={`h-3 w-3 shrink-0 rounded-full ${getStatusDotClasses(
                        isActive,
                        driver.status
                      )}`}
                    />

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-bold text-main">
                          {driver.name}
                        </h3>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusClasses(
                            isActive,
                            driver.status
                          )}`}
                        >
                          {isActive
                            ? "Active"
                            : driver.status.replace("_", " ")}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-sm text-muted">
                        {spec?.label || driver.car_type} · {deliveriesMade}{" "}
                        deliveries made
                      </p>
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className={`text-sm font-black ${getScoreClasses(score)}`}>
                      {score}%
                    </span>

                    <Link
                      href={`/dispatcher/drivers/${driver.id}/history`}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-500"
                    >
                      History
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : driver.id)
                      }
                      className="text-xl text-muted"
                    >
                      {isExpanded ? "⌃" : "⌄"}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-app bg-card-soft px-5 py-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-xl border border-app bg-card p-4">
                        <p className="text-xs uppercase tracking-wider text-soft">
                          Full Name
                        </p>

                        <p className="mt-2 font-semibold text-main">
                          {driver.name}
                        </p>
                      </div>

                      <div className="rounded-xl border border-app bg-card p-4">
                        <p className="text-xs uppercase tracking-wider text-soft">
                          Driver Score
                        </p>

                        <p
                          className={`mt-2 text-3xl font-black ${getScoreClasses(
                            score
                          )}`}
                        >
                          {score}%
                        </p>
                      </div>

                      <div className="rounded-xl border border-app bg-card p-4">
                        <p className="text-xs uppercase tracking-wider text-soft">
                          Status
                        </p>

                        <p
                          className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-bold capitalize ${getStatusClasses(
                            isActive,
                            driver.status
                          )}`}
                        >
                          {isActive
                            ? "Active"
                            : driver.status.replace("_", " ")}
                        </p>
                      </div>

                      <div className="rounded-xl border border-app bg-card p-4">
                        <p className="text-xs uppercase tracking-wider text-soft">
                          Phone Number
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                          <p className="flex-1 font-semibold text-main">
                            {phone}
                          </p>

                          <button
                            type="button"
                            onClick={() => handleCopyPhone(driver.id, phone)}
                            disabled={!driver.phone}
                            className="rounded-lg border border-app bg-card-soft px-3 py-1.5 text-xs font-bold text-main transition hover:bg-[var(--bg-card-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {copiedDriverId === driver.id ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </div>

                      <div className="rounded-xl border border-app bg-card p-4 md:col-span-2">
                        <p className="text-xs uppercase tracking-wider text-soft">
                          Address
                        </p>

                        <p className="mt-2 font-semibold text-main">
                          {address}
                        </p>
                      </div>

                      <div className="rounded-xl border border-app bg-card p-4">
                        <p className="text-xs uppercase tracking-wider text-soft">
                          Deliveries Made
                        </p>

                        <p className="mt-2 text-3xl font-black text-main">
                          {deliveriesMade}
                        </p>
                      </div>

                      <div className="rounded-xl border border-app bg-card p-4">
                        <p className="text-xs uppercase tracking-wider text-soft">
                          Vehicle
                        </p>

                        <p className="mt-2 font-semibold text-main">
                          {spec?.icon || "🚗"}{" "}
                          {spec?.label || driver.car_type}
                        </p>

                        <p className="mt-1 text-sm text-muted">
                          {spec?.max_weight ?? "?"} kg ·{" "}
                          {spec?.max_volume ?? "?"} L
                          {spec?.cooling ? " · Cooling" : ""}
                        </p>
                      </div>

                      <div className="rounded-xl border border-app bg-card p-4">
                        <p className="text-xs uppercase tracking-wider text-soft">
                          Driver ID
                        </p>

                        <p className="mt-2 font-mono text-sm text-muted">
                          {driver.id}
                        </p>
                      </div>
                    </div>

                    {isActive && activeMission && (
                      <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">
                              Active Delivery
                            </p>

                            <h3 className="mt-1 text-xl font-black text-main">
                              {activeMission.title}
                            </h3>
                          </div>

                          <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-white">
                            ✓ Active
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                          <div className="rounded-xl border border-app bg-card p-4">
                            <p className="text-xs uppercase tracking-wider text-soft">
                              Delivery Status
                            </p>

                            <p className="mt-2 font-semibold capitalize text-main">
                              {activeMission.status.replace("_", " ")}
                            </p>
                          </div>

                          <div className="rounded-xl border border-app bg-card p-4">
                            <p className="text-xs uppercase tracking-wider text-soft">
                              Urgency
                            </p>

                            <div className="mt-2">
                              <PriorityBadge
                                priority={activeMission.priority}
                              />
                            </div>
                          </div>

                          <div className="rounded-xl border border-app bg-card p-4">
                            <p className="text-xs uppercase tracking-wider text-soft">
                              Start Time
                            </p>

                            <p className="mt-2 font-semibold text-main">
                              {formatDateTime(activeMission.created_at)}
                            </p>
                          </div>

                          <div className="rounded-xl border border-app bg-card p-4">
                            <p className="text-xs uppercase tracking-wider text-soft">
                              From
                            </p>

                            <p className="mt-2 font-semibold text-main">
                              {activeMission.pickup?.address ||
                                "Pickup location TBD"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-app bg-card p-4">
                            <p className="text-xs uppercase tracking-wider text-soft">
                              To
                            </p>

                            <p className="mt-2 font-semibold text-main">
                              {activeMission.dropoff?.address ||
                                "Dropoff location TBD"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-app bg-card p-4">
                            <p className="text-xs uppercase tracking-wider text-soft">
                              Cargo
                            </p>

                            <p className="mt-2 font-semibold text-main">
                              {activeMission.description ||
                                "No product description"}
                            </p>

                            <p className="mt-1 text-sm text-muted">
                              {activeMission.cargo?.weight_kg ?? "?"} kg ·{" "}
                              {activeMission.cargo?.volume_liters ?? "?"} L
                              {activeMission.cargo?.requires_cooling
                                ? " · Cooling required"
                                : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!isActive && (
                      <div className="mt-5 rounded-2xl border border-app bg-card p-5 text-muted">
                        This driver is not currently assigned to an active
                        delivery.
                      </div>
                    )}
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