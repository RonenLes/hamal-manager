"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type Mission,
  type Driver,
  getMissions,
  getDrivers,
  getToken,
  getStoredUser,
  clearToken,
} from "@/lib/api-client";

import TodaysSchedule from "@/components/dispatcher/dashboard/TodaysSchedule";
import PendingRequests from "@/components/dispatcher/dashboard/PendingRequests";
import UnassignedMissions from "@/components/dispatcher/dashboard/UnassignedMissions";
import AlertsPanel from "@/components/dispatcher/dashboard/AlertsPanel";
import DriverStatusPanel from "@/components/dispatcher/dashboard/DriverStatusPanel";
import RecentActivity from "@/components/dispatcher/dashboard/RecentActivity";
import StatCard from "@/components/dispatcher/dashboard/StatCard";

export default function DispatcherPage() {
  const router = useRouter();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
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

  function handleLogout() {
    clearToken();
    router.push("/");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app text-main">
        Loading dispatcher dashboard...
      </main>
    );
  }

  return (
      <main className="min-h-screen bg-app p-6 text-main">
    <header className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-black">Dispatcher Dashboard</h1>
        <p className="text-sm text-muted">
          Real-time delivery operations
        </p>
      </div>

      <button
        onClick={handleLogout}
        className="rounded-xl border border-app bg-card-soft px-4 py-2 text-sm text-main hover:bg-card-soft"
      >
        Logout
      </button>
    </header>

    <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
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
    </section>

    <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <TodaysSchedule missions={missions} drivers={drivers} />

      <PendingRequests
        missions={missions.filter((mission) => mission.status === "available")}
      />

      <UnassignedMissions missions={missions} />

      <AlertsPanel missions={missions} drivers={drivers} />

      <DriverStatusPanel drivers={drivers} />

      <RecentActivity missions={missions} drivers={drivers} />
    </section>
  </main>
  );
}
