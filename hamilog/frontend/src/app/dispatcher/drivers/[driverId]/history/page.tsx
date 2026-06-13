"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  type Mission,
  type Driver,
  getMissions,
  getDrivers,
  getToken,
  getStoredUser,
} from "@/lib/api-client";

import PriorityBadge from "@/components/dispatcher/PriorityBadge";

type DeliveryState =
  | "active"
  | "assigned"
  | "unassigned"
  | "delivered"
  | "cancelled"
  | "other";

function getParamString(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value || "";
}

function getDeliveryState(mission: Mission): DeliveryState {
  if (mission.status === "in_transit") return "active";
  if (mission.status === "assigned") return "assigned";
  if (mission.status === "available") return "unassigned";
  if (mission.status === "delivered") return "delivered";
  if (mission.status === "cancelled") return "cancelled";

  return "other";
}

function getStateLabel(state: DeliveryState) {
  switch (state) {
    case "active":
      return "Active";
    case "assigned":
      return "Assigned";
    case "unassigned":
      return "Unassigned";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    case "other":
      return "Other";
  }
}

function getStateClasses(state: DeliveryState) {
  switch (state) {
    case "active":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "assigned":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "unassigned":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
    case "delivered":
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
    case "cancelled":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    case "other":
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
  }
}

function getStateDotClasses(state: DeliveryState) {
  switch (state) {
    case "active":
      return "bg-emerald-400";
    case "assigned":
      return "bg-blue-400";
    case "unassigned":
      return "bg-orange-400";
    case "delivered":
      return "bg-slate-400";
    case "cancelled":
      return "bg-red-400";
    case "other":
      return "bg-slate-400";
  }
}

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

export default function DriverHistoryPage() {
  const router = useRouter();
  const params = useParams();

  const driverId = getParamString(params.driverId);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [expandedMissionId, setExpandedMissionId] = useState<string | null>(
    null
  );
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

      setDrivers(driversData);
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

  const driver = useMemo(() => {
    return drivers.find((item) => item.id === driverId) || null;
  }, [drivers, driverId]);

  const driverMissions = useMemo(() => {
    return missions
      .filter((mission) => {
        return (
          mission.assigned_driver_id === driverId ||
          driver?.current_mission_id === mission.id
        );
      })
      .sort((a, b) => {
        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      });
  }, [missions, driverId, driver]);

  const stats = useMemo(() => {
    return {
      total: driverMissions.length,
      delivered: driverMissions.filter(
        (mission) => getDeliveryState(mission) === "delivered"
      ).length,
      active: driverMissions.filter(
        (mission) => getDeliveryState(mission) === "active"
      ).length,
      assigned: driverMissions.filter(
        (mission) => getDeliveryState(mission) === "assigned"
      ).length,
      cancelled: driverMissions.filter(
        (mission) => getDeliveryState(mission) === "cancelled"
      ).length,
    };
  }, [driverMissions]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app text-main">
        Loading driver history...
      </main>
    );
  }

  if (!driver) {
    return (
      <main className="min-h-screen bg-app p-6 text-main">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/dispatcher/drivers"
            className="text-sm font-bold text-blue-400 hover:underline"
          >
            ← Back to Drivers
          </Link>

          <div className="mt-6 rounded-2xl border border-app bg-card p-8 text-center">
            <h1 className="text-3xl font-black">Driver not found</h1>
            <p className="mt-2 text-muted">
              Could not find a driver with ID: {driverId}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <Link
            href="/dispatcher/drivers"
            className="text-sm font-bold text-blue-400 hover:underline"
          >
            ← Back to Drivers
          </Link>

          <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-emerald-400">
            Driver History
          </p>

          <h1 className="mt-1 text-3xl font-black">{driver.name}</h1>

          <p className="mt-2 text-muted">
            Delivery history, completed missions, active assignments, and full
            mission details.
          </p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatBox
            title="Total"
            value={stats.total}
            subtitle="All assigned deliveries"
          />

          <StatBox
            title="Delivered"
            value={stats.delivered}
            subtitle="Completed missions"
          />

          <StatBox
            title="Active"
            value={stats.active}
            subtitle="Currently in delivery"
          />

          <StatBox
            title="Assigned"
            value={stats.assigned}
            subtitle="Waiting to start"
          />

          <StatBox
            title="Cancelled"
            value={stats.cancelled}
            subtitle="Cancelled deliveries"
          />
        </section>

        <section className="rounded-2xl border border-app bg-card shadow-xl">
          <div className="border-b border-app px-5 py-4">
            <h2 className="text-xl font-bold text-main">
              Delivery History Entries
            </h2>

            <p className="mt-1 text-sm text-muted">
              Click a delivery to view its full details.
            </p>
          </div>

          <div className="divide-y divide-[var(--border-app)]">
            {driverMissions.length === 0 && (
              <div className="p-8 text-center text-muted">
                This driver does not have delivery history yet.
              </div>
            )}

            {driverMissions.map((mission) => {
              const state = getDeliveryState(mission);
              const isExpanded = expandedMissionId === mission.id;

              return (
                <article key={mission.id} className="bg-card">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedMissionId(isExpanded ? null : mission.id)
                    }
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[var(--bg-card-soft)]"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span
                        className={`h-3 w-3 shrink-0 rounded-full ${getStateDotClasses(
                          state
                        )}`}
                      />

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-bold text-main">
                            {mission.title}
                          </h3>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${getStateClasses(
                              state
                            )}`}
                          >
                            {getStateLabel(state)}
                          </span>

                          <PriorityBadge priority={mission.priority} />
                        </div>

                        <p className="mt-1 truncate text-sm text-muted">
                          {mission.pickup?.address || "Pickup TBD"} →{" "}
                          {mission.dropoff?.address || "Dropoff TBD"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-soft">
                        {formatDateTime(mission.created_at)}
                      </span>

                      <span className="text-xl text-muted">
                        {isExpanded ? "⌃" : "⌄"}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-app bg-card-soft px-5 py-5">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-xl border border-app bg-card p-4">
                          <p className="text-xs uppercase tracking-wider text-soft">
                            Delivery Status
                          </p>

                          <p
                            className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-bold ${getStateClasses(
                              state
                            )}`}
                          >
                            {getStateLabel(state)}
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
                            Driver
                          </p>

                          <p className="mt-2 font-semibold text-main">
                            {driver.name}
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
                            Published / Start Time
                          </p>

                          <p className="mt-2 font-semibold text-main">
                            {formatDateTime(mission.created_at)}
                          </p>
                        </div>

                        <div className="rounded-xl border border-app bg-card p-4 md:col-span-2">
                          <p className="text-xs uppercase tracking-wider text-soft">
                            Cargo / Product
                          </p>

                          <p className="mt-2 font-semibold text-main">
                            {mission.description || "No product description"}
                          </p>

                          <p className="mt-1 text-sm text-muted">
                            {mission.cargo?.weight_kg ?? "?"} kg ·{" "}
                            {mission.cargo?.volume_liters ?? "?"} L
                            {mission.cargo?.requires_cooling
                              ? " · Cooling required"
                              : ""}
                          </p>
                        </div>

                        <div className="rounded-xl border border-app bg-card p-4">
                          <p className="text-xs uppercase tracking-wider text-soft">
                            Mission ID
                          </p>

                          <p className="mt-2 font-mono text-sm text-muted">
                            {mission.id}
                          </p>
                        </div>
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