"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackToMenuButton from "@/components/shared/BackToMenuButton";
import Calendar, { toDateInputValue } from "@/components/shared/Calendar";

import {
  type Mission,
  getMissions,
  getDrivers,
  getToken,
  getStoredUser,
  getPendingDriverRequestsCount,
} from "@/lib/api-client";

import DispatcherStatBox from "@/components/dispatcher/shared/DispatcherStatBox";
import DispatcherStatsWindow from "@/components/dispatcher/shared/DispatcherStatsWindow";
import DriverEntry, {
  type ExtendedDriver,
} from "@/components/dispatcher/drivers/DriverEntry";
import {
  getActiveMissionForDriver,
  getDeliveriesMade,
  getDriverScore,
  getDriverScoreMissionTimeline,
  getDriverScoreTimeline,
} from "@/lib/driver-metrics";

// Returns the initial status filter.
function getInitialStatusFilter() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("status");
}

// Renders the drivers page component.
export default function DriversPage() {
  const router = useRouter();

  const [drivers, setDrivers] = useState<ExtendedDriver[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedGraphId, setExpandedGraphId] = useState<string | null>(null);
  const [copiedDriverId, setCopiedDriverId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter] = useState<string | null>(getInitialStatusFilter);
  const [selectedAvailabilityDate, setSelectedAvailabilityDate] = useState(
    toDateInputValue(new Date())
  );
  const [pendingDriverRequestsCount, setPendingDriverRequestsCount] =
    useState(0);

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
      const [driversData, missionsData, pendingCount] = await Promise.all([
        getDrivers(),
        getMissions(),
        getPendingDriverRequestsCount(),
      ]);

      setDrivers(driversData as ExtendedDriver[]);
      setMissions(missionsData);
      setPendingDriverRequestsCount(pendingCount);
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
    const visibleDrivers = drivers.filter(
      (driver) => driver.status !== "blacklisted"
    );

    const activeDrivers = visibleDrivers.filter((driver) =>
      Boolean(getActiveMissionForDriver(driver, missions))
    ).length;

    const availableDrivers = visibleDrivers.filter(
      (driver) => driver.status === "available"
    ).length;

    const offlineDrivers = visibleDrivers.filter(
      (driver) => driver.status === "offline"
    ).length;

    const totalDeliveries = visibleDrivers.reduce((sum, driver) => {
      return sum + getDeliveriesMade(driver, missions);
    }, 0);

    return {
      total: visibleDrivers.length,
      active: activeDrivers,
      available: availableDrivers,
      offline: offlineDrivers,
      deliveries: totalDeliveries,
    };
  }, [drivers, missions]);

  const sortedDrivers = useMemo(() => {
    return drivers
      .filter((driver) => {
        if (driver.status === "blacklisted") return false;
        if (statusFilter === "available") return driver.status === "available";
        if (statusFilter === "on_mission") {
          return (
            driver.status === "on_mission" ||
            Boolean(getActiveMissionForDriver(driver, missions))
          );
        }

        return true;
      })
      .sort((a, b) => {
        const aActive = Boolean(getActiveMissionForDriver(a, missions));
        const bActive = Boolean(getActiveMissionForDriver(b, missions));

        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;

        if (a.status === "available" && b.status !== "available") return -1;
        if (a.status !== "available" && b.status === "available") return 1;

        return a.name.localeCompare(b.name);
      });
  }, [drivers, missions, statusFilter]);

  const availabilityByDate = useMemo(() => {
    return drivers
      .filter((driver) => driver.status !== "blacklisted")
      .reduce<Record<string, ExtendedDriver[]>>((groups, driver) => {
        for (const date of driver.availability_dates ?? []) {
          groups[date] = [...(groups[date] ?? []), driver];
        }

        return groups;
      }, {});
  }, [drivers]);

  const availabilityDates = useMemo(
    () => Object.keys(availabilityByDate).sort(),
    [availabilityByDate]
  );

  const availabilityMarkers = useMemo(
    () =>
      availabilityDates.map((date) => {
        const count = availabilityByDate[date]?.length ?? 0;

        return {
          date,
          label: `${count} driver${count === 1 ? "" : "s"}`,
          tone: "emerald" as const,
        };
      }),
    [availabilityByDate, availabilityDates]
  );

  const selectedDateDrivers = useMemo(
    () =>
      [...(availabilityByDate[selectedAvailabilityDate] ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    [availabilityByDate, selectedAvailabilityDate]
  );

  // Handles the copy phone action.
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
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-4">
              <BackToMenuButton href="/dispatcher/menu" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
              Driver Management
            </p>
            <h1 className="mt-1 text-3xl font-black">Drivers</h1>
            <p className="mt-2 text-muted">
              View driver status, score, contact details, active delivery, and
              delivery history.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <Link
              href="/dispatcher/drivers/new-drivers"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
            >
              Pending new drivers
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-black text-white">
                {pendingDriverRequestsCount}
              </span>
            </Link>

            <Link
              href="/dispatcher/drivers/blacklisted"
              className="inline-flex items-center justify-center rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-200 transition hover:bg-red-500/20"
            >
              Blacklisted drivers
            </Link>
          </div>
        </header>

        <DispatcherStatsWindow>
          <DispatcherStatBox
            title="Drivers"
            value={stats.total}
            subtitle="Total drivers"
          />
          <DispatcherStatBox
            title="Active"
            value={stats.active}
            subtitle="Currently delivering"
          />
          <DispatcherStatBox
            title="Available"
            value={stats.available}
            subtitle="Ready for assignment"
          />
          <DispatcherStatBox
            title="Offline"
            value={stats.offline}
            subtitle="Not available"
          />
          <DispatcherStatBox
            title="Deliveries"
            value={stats.deliveries}
            subtitle="Completed total"
          />
        </DispatcherStatsWindow>

        <section className="mb-6 rounded-2xl border border-app bg-card p-4 shadow-xl sm:p-5">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-main">
                Driver Availability Calendar
              </h2>
              <p className="mt-1 text-sm text-muted">
                Select a date to see which drivers marked themselves available.
              </p>
            </div>
            <span className="rounded-xl bg-emerald-500/15 px-3 py-2 text-sm font-black text-emerald-300">
              {selectedDateDrivers.length} available
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
            <Calendar
              selectedDate={selectedAvailabilityDate}
              onSelectDate={setSelectedAvailabilityDate}
              markers={availabilityMarkers}
              selectedDates={availabilityDates}
              embedded
            />

            <aside className="rounded-xl border border-app bg-card-soft p-4">
              <h3 className="text-base font-black text-main">
                Available Drivers
              </h3>
              <p className="mt-1 text-sm text-muted">
                {selectedAvailabilityDate}
              </p>

              <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
                {selectedDateDrivers.length === 0 && (
                  <p className="rounded-xl border border-app bg-card p-4 text-sm text-muted">
                    No drivers marked available for this date.
                  </p>
                )}

                {selectedDateDrivers.map((driver) => {
                  const spec = driver.car_type.replace("_", " ");

                  return (
                    <div
                      key={driver.id}
                      className="rounded-xl border border-app bg-card p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-main">
                            {driver.name}
                          </p>
                          <p className="mt-1 text-xs capitalize text-muted">
                            {spec}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-bold capitalize text-emerald-300">
                          {driver.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
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
              const score = getDriverScore(driver, index);

              return (
                <DriverEntry
                  key={driver.id}
                  driver={driver}
                  activeMission={getActiveMissionForDriver(driver, missions)}
                  deliveriesMade={getDeliveriesMade(driver, missions)}
                  score={score}
                  dateScorePoints={getDriverScoreTimeline({
                    driver,
                    score,
                  })}
                  missionScorePoints={getDriverScoreMissionTimeline({
                    driver,
                    score,
                  })}
                  isExpanded={isExpanded}
                  isGraphExpanded={expandedGraphId === driver.id}
                  copiedDriverId={copiedDriverId}
                  onToggle={() =>
                    setExpandedId(isExpanded ? null : driver.id)
                  }
                  onToggleGraph={() =>
                    setExpandedGraphId(
                      expandedGraphId === driver.id ? null : driver.id
                    )
                  }
                  onCopyPhone={handleCopyPhone}
                />
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
