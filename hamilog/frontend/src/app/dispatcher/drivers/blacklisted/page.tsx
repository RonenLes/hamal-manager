"use client";

import { useEffect, useMemo, useState } from "react";
import { LoadingScreen } from "@/components/shared/Spinner";
import { useRouter } from "next/navigation";

import {
  type Mission,
  getMissions,
  getDrivers,
  getToken,
  getStoredUser,
} from "@/lib/api-client";
import {
  getActiveMissionForDriver,
  getDeliveriesMade,
  getDriverScore,
  getDriverScoreMissionTimeline,
  getDriverScoreTimeline,
} from "@/lib/driver-metrics";

import DriverEntry, {
  type ExtendedDriver,
} from "@/components/dispatcher/drivers/DriverEntry";
import DispatcherStatBox from "@/components/dispatcher/shared/DispatcherStatBox";
import DispatcherStatsWindow from "@/components/dispatcher/shared/DispatcherStatsWindow";
import BackToMenuButton from "@/components/shared/BackToMenuButton";

// Renders the blacklisted drivers page component.
export default function BlacklistedDriversPage() {
  const router = useRouter();

  const [drivers, setDrivers] = useState<ExtendedDriver[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedGraphId, setExpandedGraphId] = useState<string | null>(null);
  const [copiedDriverId, setCopiedDriverId] = useState<string | null>(null);
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

  const blacklistedDrivers = useMemo(() => {
    return drivers
      .filter((driver) => driver.status === "blacklisted")
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [drivers]);

  const stats = useMemo(() => {
    const deliveries = blacklistedDrivers.reduce((sum, driver) => {
      return sum + getDeliveriesMade(driver, missions);
    }, 0);

    const averageScore =
      blacklistedDrivers.length === 0
        ? 0
        : Math.round(
            blacklistedDrivers.reduce((sum, driver, index) => {
              return sum + getDriverScore(driver, index);
            }, 0) / blacklistedDrivers.length
          );

    return {
      total: blacklistedDrivers.length,
      deliveries,
      averageScore,
    };
  }, [blacklistedDrivers, missions]);

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
      <LoadingScreen label="Loading blacklisted drivers..." />
    );
  }

  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <BackToMenuButton href="/dispatcher/drivers" />

            <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">
              Driver Management
            </p>
            <h1 className="mt-1 text-3xl font-semibold">Blacklisted Drivers</h1>
            <p className="mt-2 text-muted">
              Review blacklisted drivers, delivery history, score movement, and
              contact details.
            </p>
          </div>
        </header>

        <DispatcherStatsWindow>
          <DispatcherStatBox
            title="Blacklisted"
            value={stats.total}
            subtitle="Restricted drivers"
          />
          <DispatcherStatBox
            title="Avg Score"
            value={stats.averageScore}
            subtitle="Current score average (%)"
          />
          <DispatcherStatBox
            title="Deliveries"
            value={stats.deliveries}
            subtitle="Completed before blacklist"
          />
        </DispatcherStatsWindow>

        <section className="rounded-xl border border-app bg-card shadow-sm">
          <div className="border-b border-app px-5 py-4">
            <h2 className="text-xl font-bold text-main">
              Blacklisted Driver Entries
            </h2>
            <p className="mt-1 text-sm text-muted">
              Click a driver to expand full details.
            </p>
          </div>

          <div className="divide-y divide-[var(--border-app)]">
            {blacklistedDrivers.length === 0 && (
              <div className="p-8 text-center text-muted">
                No blacklisted drivers found.
              </div>
            )}

            {blacklistedDrivers.map((driver, index) => {
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
