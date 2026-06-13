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

import PriorityBadge from "@/components/dispatcher/PriorityBadge";

type DeliveryState =
  | "active"
  | "assigned"
  | "unassigned"
  | "delivered"
  | "cancelled";

function getDeliveryState(mission: Mission): DeliveryState {
  if (mission.status === "in_transit") return "active";
  if (mission.status === "assigned") return "assigned";
  if (mission.status === "delivered") return "delivered";
  if (mission.status === "cancelled") return "cancelled";

  return "unassigned";
}

function getDeliveryStateLabel(state: DeliveryState) {
  switch (state) {
    case "active":
      return "In Action";
    case "assigned":
      return "Assigned";
    case "unassigned":
      return "Not Assigned";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
  }
}

function getStateBadgeClasses(state: DeliveryState) {
  switch (state) {
    case "active":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "assigned":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "unassigned":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
    case "delivered":
      return "border-slate-500/30 bg-slate-500/10 text-muted";
    case "cancelled":
      return "border-red-500/30 bg-red-500/10 text-red-300";
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
  }
}

function toLocalDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatReadableDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateValue?: string) {
  if (!dateValue) return "Not started";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Not started";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isSameLocalDate(dateValue: string | undefined, selectedDate: string) {
  if (!dateValue) return false;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return toLocalDateInputValue(date) === selectedDate;
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

export default function TodaysSchedulePage() {
  const router = useRouter();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(
    toLocalDateInputValue(new Date())
  );

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

  const scheduleMissions = useMemo(() => {
    return missions.filter((mission) =>
      isSameLocalDate(mission.created_at, selectedDate)
    );
  }, [missions, selectedDate]);

  const stats = useMemo(() => {
    const active = scheduleMissions.filter(
      (mission) => getDeliveryState(mission) === "active"
    ).length;

    const assigned = scheduleMissions.filter(
      (mission) => getDeliveryState(mission) === "assigned"
    ).length;

    const unassigned = scheduleMissions.filter(
      (mission) => getDeliveryState(mission) === "unassigned"
    ).length;

    const delivered = scheduleMissions.filter(
      (mission) => getDeliveryState(mission) === "delivered"
    ).length;

    return {
      total: scheduleMissions.length,
      active,
      assigned,
      unassigned,
      delivered,
    };
  }, [scheduleMissions]);

  const sortedMissions = useMemo(() => {
    const stateOrder: Record<DeliveryState, number> = {
      active: 0,
      assigned: 1,
      unassigned: 2,
      delivered: 3,
      cancelled: 4,
    };

    const priorityOrder = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return [...scheduleMissions].sort((a, b) => {
      const stateDiff =
        stateOrder[getDeliveryState(a)] - stateOrder[getDeliveryState(b)];

      if (stateDiff !== 0) return stateDiff;

      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [scheduleMissions]);

  function getDriverName(driverId?: string | null) {
    if (!driverId) return "No driver assigned";

    return (
      drivers.find((driver) => driver.id === driverId)?.name ||
      "Unknown driver"
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app text-main">
        Loading schedule...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              Date Schedule
            </p>

            <h1 className="mt-1 text-3xl font-black">
              {formatReadableDate(selectedDate)} Schedule
            </h1>

            <p className="mt-2 text-muted">
              Track deliveries, assignments, urgency, drivers, cargo, and active
              missions for the selected date.
            </p>
          </div>

          <div className="rounded-2xl border border-app bg-card p-4">
            <label className="mb-2 block text-sm font-semibold text-muted">
              Change date
            </label>

            <input
              type="date"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setExpandedId(null);
              }}
              className="rounded-xl border border-app bg-app px-4 py-2 text-main outline-none focus:border-blue-500"
            />
          </div>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatBox
            title="Selected Date"
            value={stats.total}
            subtitle="Total missions"
          />

          <StatBox
            title="In Action"
            value={stats.active}
            subtitle="Currently active"
          />

          <StatBox
            title="Assigned"
            value={stats.assigned}
            subtitle="Waiting to start"
          />

          <StatBox
            title="Unassigned"
            value={stats.unassigned}
            subtitle="Needs driver"
          />

          <StatBox
            title="Delivered"
            value={stats.delivered}
            subtitle="Completed"
          />
        </section>

        <section className="rounded-2xl border border-app bg-card shadow-xl">
          <div className="border-b border-app px-5 py-4">
            <h2 className="text-xl font-bold">Delivery Entries</h2>
            <p className="mt-1 text-sm text-muted">
              Click a delivery to expand its full information.
            </p>
          </div>

          <div className="divide-y divide-white/10">
            {sortedMissions.length === 0 && (
              <div className="p-8 text-center text-muted">
                No deliveries for this date.
              </div>
            )}

            {sortedMissions.map((mission) => {
              const state = getDeliveryState(mission);
              const isExpanded = expandedId === mission.id;
              const driverName = getDriverName(mission.assigned_driver_id);

              return (
                <article key={mission.id} className="bg-card">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : mission.id)
                    }
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-card-soft"
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

                          {state === "active" && (
                            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-black text-main">
                              ✓
                            </span>
                          )}

                          <PriorityBadge priority={mission.priority} />
                        </div>

                        <p className="mt-1 truncate text-sm text-muted">
                          {mission.pickup?.address || "Pickup TBD"} →{" "}
                          {mission.dropoff?.address || "Dropoff TBD"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${getStateBadgeClasses(
                          state
                        )}`}
                      >
                        {getDeliveryStateLabel(state)}
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
                            Delivery Status
                          </p>

                          <p
                            className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-bold ${getStateBadgeClasses(
                              state
                            )}`}
                          >
                            {getDeliveryStateLabel(state)}
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
                            {driverName}
                          </p>
                        </div>

                        <div className="rounded-xl border border-app bg-card p-4">
                          <p className="text-xs uppercase tracking-wider text-soft">
                            Product / Cargo
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
                            Pickup
                          </p>

                          <p className="mt-2 font-semibold text-main">
                            {mission.pickup?.address || "Pickup location TBD"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-app bg-card p-4">
                          <p className="text-xs uppercase tracking-wider text-soft">
                            Dropoff
                          </p>

                          <p className="mt-2 font-semibold text-main">
                            {mission.dropoff?.address ||
                              "Dropoff location TBD"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-app bg-card p-4">
                          <p className="text-xs uppercase tracking-wider text-soft">
                            Delivery Start Time
                          </p>

                          <p className="mt-2 font-semibold text-main">
                            {state === "unassigned"
                              ? "Not started"
                              : formatTime(mission.created_at)}
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