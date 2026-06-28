"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type Mission,
  type Driver,
  type DriverRequest,
  type MissionDeliveryRequest,
  type StoredUser,
  getMissions,
  getDrivers,
  getMissionRequests,
  getPendingDriverRequests,
  getToken,
  getStoredUser,
} from "@/lib/api-client";

import TodaysSchedule from "@/components/dispatcher/dashboard/TodaysSchedule";
import PendingRequests from "@/components/dispatcher/dashboard/PendingRequests";
import UnassignedMissions from "@/components/dispatcher/dashboard/UnassignedMissions";
import AlertsPanel from "@/components/dispatcher/dashboard/AlertsPanel";
import DriverStatusPanel from "@/components/dispatcher/dashboard/DriverStatusPanel";
import RecentActivity from "@/components/dispatcher/dashboard/RecentActivity";
import StatCard from "@/components/dispatcher/dashboard/StatCard";
import DispatcherStatsWindow from "@/components/dispatcher/shared/DispatcherStatsWindow";

// Returns the display name.
function getDisplayName(user: StoredUser | null) {
  if (user?.name) return user.name;
  if (!user?.username) return "Dispatcher";

  return user.username
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// Renders the dispatcher page component.
export default function DispatcherPage() {
  const router = useRouter();

  const [user] = useState<StoredUser | null>(() => getStoredUser());
  const [missions, setMissions] = useState<Mission[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [missionRequests, setMissionRequests] = useState<
    MissionDeliveryRequest[]
  >([]);
  const [driverRequests, setDriverRequests] = useState<DriverRequest[]>([]);
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
      const [
        missionsData,
        driversData,
        missionRequestsData,
        driverRequestsData,
      ] = await Promise.all([
        getMissions(),
        getDrivers(),
        getMissionRequests({ status: "pending" }),
        getPendingDriverRequests(),
      ]);

      setMissions(missionsData);
      setDrivers(driversData);
      setMissionRequests(missionRequestsData);
      setDriverRequests(driverRequestsData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app text-main">
        Loading dispatcher dashboard...
      </main>
    );
  }

  return (
      <main className="min-h-screen bg-app px-3 py-4 text-main sm:p-6">
    <header className="mb-4 sm:mb-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
          Hello, {getDisplayName(user)}
        </p>
        <h1 className="text-2xl font-black sm:text-3xl">Dispatcher Dashboard</h1>
        <p className="text-sm text-muted">
          Real-time delivery operations
        </p>
      </div>
    </header>

    <DispatcherStatsWindow>
      <StatCard
        title="Deliveries Today"
        value={`${
          missions.filter((mission) => mission.status === "delivered").length
        } / ${missions.length}`}
        subtitle="Completed deliveries"
        icon="✓"
        color="green"
      />

      <StatCard
        title="Active Drivers"
        value={`${
          drivers.filter((driver) => driver.status !== "offline").length
        } / ${drivers.length}`}
        subtitle="Drivers currently online"
        icon="👥"
        color="orange"
      />
    </DispatcherStatsWindow>

    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 xl:gap-5">
      <TodaysSchedule missions={missions} drivers={drivers} />

      <PendingRequests
        missionRequests={missionRequests}
      />

      <UnassignedMissions missions={missions} />

      <AlertsPanel missions={missions} drivers={drivers} />

      <DriverStatusPanel drivers={drivers} />

      <RecentActivity
        missions={missions}
        drivers={drivers}
        missionRequests={missionRequests}
        driverRequests={driverRequests}
      />
    </section>
  </main>
  );
}
