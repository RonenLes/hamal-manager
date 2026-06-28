"use client";

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

import DispatcherStatBox from "@/components/dispatcher/shared/DispatcherStatBox";
import DriverHistoryEntry, {
  type DriverHistoryState,
} from "@/components/dispatcher/drivers/DriverHistoryEntry";
import BackToMenuButton from "@/components/shared/BackToMenuButton";

// Returns the param string.
function getParamString(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value || "";
}

// Returns the delivery state.
function getDeliveryState(mission: Mission): DriverHistoryState {
  if (mission.status === "in_transit") return "active";
  if (mission.status === "assigned") return "assigned";
  if (mission.status === "available") return "unassigned";
  if (mission.status === "delivered") return "delivered";
  if (mission.status === "cancelled") return "cancelled";

  return "other";
}

// Renders the driver history page component.
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

  // Fetches the latest page data.
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
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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
          <BackToMenuButton href="/dispatcher/drivers" />

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
          <BackToMenuButton href="/dispatcher/drivers" />

          <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-emerald-400">
            Driver History
          </p>
          <h1 className="mt-1 text-3xl font-black">{driver.name}</h1>
          <p className="mt-2 text-muted">
            Delivery history, completed missions, active assignments, and full
            mission details.
          </p>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <DispatcherStatBox
            title="Total"
            value={stats.total}
            subtitle="All assigned deliveries"
          />
          <DispatcherStatBox
            title="Delivered"
            value={stats.delivered}
            subtitle="Completed missions"
          />
          <DispatcherStatBox
            title="Active"
            value={stats.active}
            subtitle="Currently in delivery"
          />
          <DispatcherStatBox
            title="Assigned"
            value={stats.assigned}
            subtitle="Waiting to start"
          />
          <DispatcherStatBox
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
                <DriverHistoryEntry
                  key={mission.id}
                  mission={mission}
                  state={state}
                  driverName={driver.name}
                  isExpanded={isExpanded}
                  onToggle={() =>
                    setExpandedMissionId(isExpanded ? null : mission.id)
                  }
                />
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
