"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type Mission,
  type StoredUser,
  clearToken,
  getMissions,
  getStoredUser,
  getToken,
  updateMissionStatus,
} from "@/lib/api-client";
import StatCard from "@/components/dispatcher/dashboard/StatCard";
import ActiveMissionCard from "@/components/driver/missions/ActiveMissionCard";

export default function DriverDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [openMissions, setOpenMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser || storedUser.role !== "driver") {
      router.replace("/login?role=driver");
      return;
    }

    setUser(storedUser);

    async function fetchData() {
      try {
        const [myData, openData] = await Promise.all([
          getMissions({ driverUid: storedUser.driver_id }),
          getMissions({ status: "available" }),
        ]);

        setMissions(
          myData.filter(
            (mission) => mission.assigned_driver_id === storedUser.driver_id
          )
        );
        setOpenMissions(
          openData.filter((mission) => mission.status === "available")
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [router]);

  function handleLogout() {
    clearToken();
    router.push("/");
  }

  async function refreshDashboard() {
    if (!user?.driver_id) return;

    const [myData, openData] = await Promise.all([
      getMissions({ driverUid: user.driver_id }),
      getMissions({ status: "available" }),
    ]);

    setMissions(
      myData.filter((mission) => mission.assigned_driver_id === user.driver_id)
    );
    setOpenMissions(openData.filter((mission) => mission.status === "available"));
  }

  async function handleMarkDelivered(missionId: string) {
    await updateMissionStatus(missionId, "delivered");
    await refreshDashboard();
  }

  async function handleStartTransit(missionId: string, status: "in_transit") {
    await updateMissionStatus(missionId, status);
    await refreshDashboard();
  }

  const activeMission = missions.find(
    (mission) => mission.status === "assigned" || mission.status === "in_transit"
  );
  const completedCount = missions.filter(
    (mission) => mission.status === "delivered"
  ).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app text-main">
        Loading driver dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-black">Driver Dashboard</h1>
            <p className="mt-1 text-sm text-muted">
              Today&apos;s delivery status, available tasks, and driver tools.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-app bg-card-soft px-4 py-2 text-sm text-main hover:bg-card-soft"
            >
              Logout
            </button>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            title="Active Mission"
            value={activeMission ? "1" : "0"}
            subtitle={activeMission ? activeMission.status.replace("_", " ") : "No active route"}
            icon="🚚"
            color="blue"
          />

          <StatCard
            title="Open Tasks"
            value={`${openMissions.length}`}
            subtitle="Available missions"
            icon="📦"
            color="orange"
          />

          <StatCard
            title="Completed"
            value={`${completedCount}`}
            subtitle="Delivered missions"
            icon="✓"
            color="green"
          />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2">
            {activeMission ? (
              <ActiveMissionCard
                mission={activeMission}
                onMarkDelivered={handleMarkDelivered}
                onUpdateStatus={handleStartTransit}
              />
            ) : (
              <div className="rounded-2xl border border-app bg-card p-8 text-center shadow-xl">
                <h2 className="text-xl font-black text-main">
                  No Active Mission
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Open Tasks has missions available for your vehicle profile.
                </p>
                <Link
                  href="/driver/open-tasks"
                  className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  View Open Tasks
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <section className="rounded-2xl border border-app bg-card p-5 shadow-xl">
              <h2 className="text-xl font-black text-main">Driver Status</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Account</span>
                  <span className="font-bold text-main">
                    {user?.username || "Driver"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Vehicle</span>
                  <span className="font-bold capitalize text-main">
                    {user?.car_type?.replace("_", " ") || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Online</span>
                  <span className="font-bold text-emerald-300">Ready</span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-app bg-card p-5 shadow-xl">
              <h2 className="text-xl font-black text-main">Quick Actions</h2>
              <div className="mt-4 grid gap-3">
                <Link
                  href="/driver/my-missions"
                  className="rounded-xl border border-app bg-card-soft px-4 py-3 text-sm font-bold text-main hover:bg-card-soft"
                >
                  My Missions
                </Link>
                <Link
                  href="/driver/open-tasks"
                  className="rounded-xl border border-app bg-card-soft px-4 py-3 text-sm font-bold text-main hover:bg-card-soft"
                >
                  Open Tasks
                </Link>
                <Link
                  href="/driver/settings"
                  className="rounded-xl border border-app bg-card-soft px-4 py-3 text-sm font-bold text-main hover:bg-card-soft"
                >
                  Settings
                </Link>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
