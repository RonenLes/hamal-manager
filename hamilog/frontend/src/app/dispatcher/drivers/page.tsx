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
  getPendingDriverRequestsCount,
} from "@/lib/api-client";

import DispatcherStatBox from "@/components/dispatcher/shared/DispatcherStatBox";
import DriverEntry, {
  type ExtendedDriver,
} from "@/components/dispatcher/drivers/DriverEntry";

function getDriverScore(driver: ExtendedDriver, index: number) {
  if (typeof driver.score === "number") return driver.score;

  // Temporary fallback score until backend sends real driver score.
  return 90 - ((index * 7) % 28);
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
  const [pendingDriverRequestsCount, setPendingDriverRequestsCount] =
    useState(0);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (!token || !user || user.role !== "dispatcher") {
      router.replace("/login?role=dispatcher");
    }
  }, [router]);

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
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
              Driver Management
            </p>
            <h1 className="mt-1 text-3xl font-black">Drivers</h1>
            <p className="mt-2 text-muted">
              View driver status, score, contact details, active delivery, and
              delivery history.
            </p>
          </div>

          <Link
            href="/dispatcher/drivers/new-drivers"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            Pending new drivers
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-black text-white">
              {pendingDriverRequestsCount}
            </span>
          </Link>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

              return (
                <DriverEntry
                  key={driver.id}
                  driver={driver}
                  activeMission={getActiveMissionForDriver(driver, missions)}
                  deliveriesMade={getDeliveriesMade(driver, missions)}
                  score={getDriverScore(driver, index)}
                  isExpanded={isExpanded}
                  copiedDriverId={copiedDriverId}
                  onToggle={() =>
                    setExpandedId(isExpanded ? null : driver.id)
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
