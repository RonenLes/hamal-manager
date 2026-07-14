"use client";

import { useEffect, useMemo, useState } from "react";
import { LoadingScreen } from "@/components/shared/Spinner";
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

import DispatcherStatBox from "@/components/dispatcher/shared/DispatcherStatBox";
import DispatcherStatsWindow from "@/components/dispatcher/shared/DispatcherStatsWindow";
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
    return missions
      .filter(
        (mission) =>
          mission.status !== "delivered" && mission.status !== "cancelled"
      )
      .map((mission) => {
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
    };
  }, [mapPoints]);

  if (loading) {
    return (
      <LoadingScreen label="Loading live map..." />
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

          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Live Delivery Map</h1>

          <p className="mt-2 text-muted">
            View current deliveries on the map. Active deliveries are marked in
            green.
          </p>
        </header>

        <DispatcherStatsWindow>
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

        </DispatcherStatsWindow>

        <section>
          <div className="rounded-xl border border-app bg-card p-3 shadow-sm sm:p-4">
            <LiveMapFiltersPanel filters={filters} onChange={setFilters} />
            <DeliveryDetailsPanel selectedPoint={selectedPoint} />
            <LiveMapCanvas
              points={mapPoints}
              filters={filters}
              selectedMissionId={selectedMissionId}
              onSelectMission={setSelectedMissionId}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
