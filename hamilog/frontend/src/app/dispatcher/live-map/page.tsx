"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BackToMenuButton from "@/components/shared/BackToMenuButton";

import {
  type Mission,
  type Driver,
  getMissions,
  getDrivers,
  getToken,
  getStoredUser,
} from "@/lib/api-client";
import { formatDateTime24 } from "@/lib/date-format";

import DispatcherStatBox from "@/components/dispatcher/shared/DispatcherStatBox";
import DeliveryDetailsPanel from "@/components/dispatcher/live-map/DeliveryDetailsPanel";
import LiveMapCanvas from "@/components/dispatcher/live-map/LiveMapCanvas";
import LiveMapFiltersPanel, {
  defaultLiveMapFilters,
} from "@/components/dispatcher/live-map/LiveMapFilters";
import { getDeliveryState } from "@/components/dispatcher/live-map/map-utils";
import type {
  LiveMapFilters,
  MapPoint,
} from "@/components/dispatcher/live-map/types";

// Returns the driver for mission.
function getDriverForMission(mission: Mission, drivers: Driver[]) {
  return drivers.find(
    (driver) =>
      driver.id === mission.assigned_driver_id ||
      driver.current_mission_id === mission.id
  );
}

// Renders the live delivery map page component.
export default function LiveDeliveryMapPage() {
  const router = useRouter();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(
    null
  );
  const [filters, setFilters] = useState<LiveMapFilters>(
    defaultLiveMapFilters
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

  const mapPoints = useMemo<MapPoint[]>(() => {
    return missions.map((mission) => {
      return {
        id: mission.id,
        mission,
        driver: getDriverForMission(mission, drivers),
        state: getDeliveryState(mission),
      };
    });
  }, [missions, drivers]);

  const selectedPoint = useMemo(() => {
    if (!selectedMissionId) return null;

    return mapPoints.find((point) => point.id === selectedMissionId) || null;
  }, [selectedMissionId, mapPoints]);

  const stats = useMemo(() => {
    return {
      total: mapPoints.length,
      active: mapPoints.filter((point) => point.state === "active").length,
      assigned: mapPoints.filter((point) => point.state === "assigned").length,
      unassigned: mapPoints.filter((point) => point.state === "unassigned")
        .length,
      delivered: mapPoints.filter((point) => point.state === "delivered")
        .length,
    };
  }, [mapPoints]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app text-main">
        Loading live map...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app px-3 py-4 text-main sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <div className="mb-4">
            <BackToMenuButton href="/dispatcher/menu" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            Live Operations
          </p>

          <h1 className="mt-1 text-2xl font-black sm:text-3xl">Live Delivery Map</h1>

          <p className="mt-2 text-muted">
            View deliveries to make on the map. Active deliveries are marked in
            green.
          </p>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <DispatcherStatBox
            title="Deliveries"
            value={stats.total}
            subtitle="All shown"
          />

          <DispatcherStatBox
            title="Active"
            value={stats.active}
            subtitle="Green points"
          />

          <DispatcherStatBox
            title="Assigned"
            value={stats.assigned}
            subtitle="Waiting to start"
          />

          <DispatcherStatBox
            title="Unassigned"
            value={stats.unassigned}
            subtitle="Needs driver"
          />

          <DispatcherStatBox
            title="Delivered"
            value={stats.delivered}
            subtitle="Completed"
          />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-app bg-card p-3 shadow-xl sm:p-4">
            <LiveMapFiltersPanel filters={filters} onChange={setFilters} />
            <LiveMapCanvas
            points={mapPoints}
            filters={filters}
            selectedMissionId={selectedMissionId}
            onSelectMission={setSelectedMissionId}
          />
          </div>

          <DeliveryDetailsPanel selectedPoint={selectedPoint} />
        </section>
      </div>
    </main>
  );
}
