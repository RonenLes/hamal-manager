"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type Mission,
  type StoredUser,
  getMissions,
  getStoredUser,
  getToken,
} from "@/lib/api-client";

import DriverHeader from "../shared/DriverHeader";
import DriverHistoryList from "./DriverHistoryList";
import DriverHistoryStats from "./DriverHistoryStats";

export default function DriverHistoryPage() {
  const router = useRouter();
  const userRef = useRef<StoredUser | null>(getStoredUser());

  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (!token || !user || user.role !== "driver") {
      router.replace("/login?role=driver");
      return;
    }

    userRef.current = user;
  }, [router]);

  const fetchHistory = useCallback(async () => {
    const user = userRef.current;
    if (!user?.driver_id) return;

    try {
      setError("");
      const data = await getMissions({
        driverUid: user.driver_id,
        status: "delivered",
      });
      setMissions(
        data.filter(
          (mission) =>
            mission.assigned_driver_id === user.driver_id &&
            mission.status === "delivered",
        ),
      );
    } catch {
      setError("Could not load mission history.");
      setMissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchHistory);
  }, [fetchHistory]);

  const sortedMissions = useMemo(
    () =>
      [...missions].sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      ),
    [missions],
  );

  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl">
        <DriverHeader
          title="History"
          description="Review all missions you have finished."
        />

        {error && (
          <div className="mb-5 rounded-2xl border alert-danger px-5 py-4">
            {error}
          </div>
        )}

        <DriverHistoryStats missions={sortedMissions} loading={loading} />
        <DriverHistoryList missions={sortedMissions} loading={loading} />
      </div>
    </main>
  );
}
