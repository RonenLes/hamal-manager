"use client";

import Link from "next/link";
import { LoadingScreen } from "@/components/shared/Spinner";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BackToMenuButton from "@/components/shared/BackToMenuButton";

import {
  type Driver,
  type Mission,
  type MissionPriority,
  cancelMission,
  getDrivers,
  getMissions,
  getToken,
  getStoredUser,
} from "@/lib/api-client";

import DispatcherStatBox from "@/components/dispatcher/shared/DispatcherStatBox";
import DispatcherStatsWindow from "@/components/dispatcher/shared/DispatcherStatsWindow";
import MissionEntry from "@/components/dispatcher/missions/MissionEntry";
import MissionFilters, {
  type MissionStatusFilter,
} from "@/components/dispatcher/missions/MissionFilters";

const initialFilters: MissionStatusFilter = {
  unassigned: true,
  assigned: true,
  active: true,
  cooling: false,
  urgencyLow: false,
  urgencyMedium: false,
  urgencyHigh: false,
  urgencyCritical: false,
  orderByDeliveryDate: true,
};

// Returns the initial filters from query.
function getInitialFiltersFromQuery(): MissionStatusFilter {
  if (typeof window === "undefined") return initialFilters;

  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  const priority = params.get("priority");

  if (!status && !priority) return initialFilters;

  return {
    ...initialFilters,
    unassigned: status === "open",
    assigned: status === "open",
    active: status === "active",
    urgencyLow: priority === "low",
    urgencyMedium: priority === "medium",
    urgencyHigh: priority === "high",
    urgencyCritical: priority === "critical",
  };
}

// Returns the mission state.
function getMissionState(mission: Mission) {
  if (mission.status === "in_transit") return "active";
  if (mission.status === "assigned") return "assigned";
  if (mission.status === "available" && !mission.assigned_driver_id) {
    return "unassigned";
  }

  return mission.status;
}

// Returns the state classes.
function getStateClasses(state: string) {
  if (state === "active") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (state === "assigned") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300";
  }

  if (state === "unassigned") {
    return "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300";
  }

  if (state === "delivered") {
    return "border-slate-500/30 bg-slate-500/10 text-muted";
  }

  if (state === "cancelled") {
    return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";
  }

  return "border-slate-500/30 bg-slate-500/10 text-muted";
}

// Returns the priority rank.
function getPriorityRank(priority: MissionPriority) {
  switch (priority) {
    case "critical":
      return 0;
    case "high":
      return 1;
    case "medium":
      return 2;
    case "low":
      return 3;
    default:
      return 4;
  }
}

// Renders the missions page component.
export default function MissionsPage() {
  const router = useRouter();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [expandedMissionId, setExpandedMissionId] = useState<string | null>(null);
  const [filters, setFilters] = useState<MissionStatusFilter>(getInitialFiltersFromQuery,);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (!token || !user || user.role !== "dispatcher") {
      router.replace("/login?role=dispatcher");
    }
  }, [router]);

  // Fetches the latest page data.
  async function fetchData() {
    try {
      const [missionsData, driversData] = await Promise.all([
        getMissions(),
        getDrivers(),
      ]);
      setMissions(missionsData);
      setDrivers(driversData);
    } catch{
      alert("Could not load missions or drivers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(fetchData);

    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    return {
      total: missions.length,
      unassigned: missions.filter(
        (mission) => getMissionState(mission) === "unassigned"
      ).length,
      assigned: missions.filter(
        (mission) => getMissionState(mission) === "assigned"
      ).length,
      active: missions.filter(
        (mission) => getMissionState(mission) === "active"
      ).length,
      cooling: missions.filter((mission) => mission.cargo?.requires_cooling)
        .length,
    };
  }, [missions]);

  const filteredMissions = useMemo(() => {
    let result = missions.filter((mission) => {
      const state = getMissionState(mission);
      const statusMatches =
        (filters.unassigned && state === "unassigned") ||
        (filters.assigned && state === "assigned") ||
        (filters.active && state === "active");
      const noStatusFilterSelected =
        !filters.unassigned && !filters.assigned && !filters.active;
      const statusOk = noStatusFilterSelected || statusMatches;
      const coolingOk =
        !filters.cooling || Boolean(mission.cargo?.requires_cooling);
      const urgencyFiltersSelected =
        filters.urgencyLow ||
        filters.urgencyMedium ||
        filters.urgencyHigh ||
        filters.urgencyCritical;
      const urgencyOk =
        !urgencyFiltersSelected ||
        (filters.urgencyLow && mission.priority === "low") ||
        (filters.urgencyMedium && mission.priority === "medium") ||
        (filters.urgencyHigh && mission.priority === "high") ||
        (filters.urgencyCritical && mission.priority === "critical");

      return statusOk && coolingOk && urgencyOk;
    });

    result = [...result].sort((a, b) => {
      if (filters.orderByDeliveryDate) {
        const firstDate = a.ideal_delivery_time || a.created_at;
        const secondDate = b.ideal_delivery_time || b.created_at;

        return (
          new Date(secondDate).getTime() - new Date(firstDate).getTime()
        );
      }

      return getPriorityRank(a.priority) - getPriorityRank(b.priority);
    });

    return result;
  }, [missions, filters]);

  const driverNameById = useMemo(() => {
    return new Map(drivers.map((driver) => [driver.id, driver.name]));
  }, [drivers]);

  // Updates the filter.
  function updateFilter(key: keyof MissionStatusFilter) {
    setFilters((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  // Handles dispatcher mission cancellation.
  async function handleCancelMission(mission: Mission) {
    const reason = window.prompt("Why cancel this mission?");
    const cleanReason = reason?.trim();

    if (!cleanReason) return;

    try {
      await cancelMission(mission.id, cleanReason);
      await fetchData();
    } catch (error: unknown) {
      const detail =
        error && typeof error === "object" && "detail" in error
          ? String((error as { detail: unknown }).detail)
          : null;

      alert(detail || "Could not cancel mission.");
    }
  }

  if (loading) {
    return (
      <LoadingScreen label="Loading missions..." />
    );
  }

  return (
    <main className="min-h-screen bg-app px-3 py-4 text-main sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 sm:mb-6">
          <div>
            <div className="mb-4">
              <BackToMenuButton href="/dispatcher/menu" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wider text-red-400">
              Mission Management
            </p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Missions</h1>
            <p className="mt-2 text-muted">
              Add missions, review delivery details, and filter the mission pool.
            </p>
          </div>
        </header>

        <DispatcherStatsWindow>
          <DispatcherStatBox
            title="Missions"
            value={stats.total}
            subtitle="Total missions"
          />
          <DispatcherStatBox
            title="Unassigned"
            value={stats.unassigned}
            subtitle="Needs driver"
          />
          <DispatcherStatBox
            title="Assigned"
            value={stats.assigned}
            subtitle="Driver selected"
          />
          <DispatcherStatBox
            title="Active"
            value={stats.active}
            subtitle="In delivery"
          />
          <DispatcherStatBox
            title="Cooling"
            value={stats.cooling}
            subtitle="Requires cooling"
          />
        </DispatcherStatsWindow>

        <section className="mb-6 rounded-xl border border-app bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-main">Mission actions</h2>
              <p className="mt-1 text-sm text-muted">Open a dedicated form to create a mission.</p>
            </div>
            <Link
              href="/dispatcher/missions/new"
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-main transition hover:bg-emerald-500"
            >
              + Add New Mission
            </Link>
          </div>
        </section>

        <MissionFilters
          filters={filters}
          onToggle={updateFilter}
          onReset={() => setFilters(initialFilters)}
        />

        <section>
          <div className="rounded-xl border border-app bg-card shadow-sm">
            <div className="border-b border-app px-4 py-3 sm:px-5 sm:py-4">
              <h2 className="text-xl font-bold">Mission Entries</h2>
              <p className="mt-1 text-sm text-muted">
                Click a mission to expand its full delivery details.
              </p>
            </div>

            <div className="divide-y divide-white/10">
              {filteredMissions.length === 0 && (
                <div className="p-8 text-center text-muted">
                  No missions match the selected filters.
                </div>
              )}

              {filteredMissions.map((mission) => {
                const state = getMissionState(mission);
                const isExpanded = expandedMissionId === mission.id;

                return (
                  <MissionEntry
                    key={mission.id}
                    mission={mission}
                    state={state}
                    isExpanded={isExpanded}
                    onToggle={() =>
                      setExpandedMissionId(isExpanded ? null : mission.id)
                    }
                    onCancel={handleCancelMission}
                    assignedDriverName={
                      mission.assigned_driver_id
                        ? driverNameById.get(mission.assigned_driver_id)
                        : undefined
                    }
                    getStateClasses={getStateClasses}
                  />
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
