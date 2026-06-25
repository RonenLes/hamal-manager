"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type Mission,
  type StoredUser,
  cancelMission,
  createMissionRequest,
  getMissions,
  updateMissionStatus,
  getToken,
  getStoredUser,
  getWsBase,
} from "@/lib/api-client";
import { GPSWebSocket } from "@/lib/websocket-client";

import DriverHeader from "./shared/DriverHeader";
import MyMissionsTab from "./tabs/MyMissionsTab";
import OpenTasksTab from "./tabs/OpenTasksTab";
import ProfileTab from "./tabs/ProfileTab";
import type { DriverTab } from "./types";

type DriverMissionWorkspaceProps = {
  initialTab?: DriverTab;
};

export default function DriverMissionWorkspace({
  initialTab = "my-missions",
}: DriverMissionWorkspaceProps) {
  const router = useRouter();

  const [myMissions, setMyMissions] = useState<Mission[]>([]);
  const [openMissions, setOpenMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingMissionId, setAcceptingMissionId] = useState<string | null>(
    null
  );

  const wsRef = useRef<GPSWebSocket | null>(null);
  const userRef = useRef<StoredUser | null>(null);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (!token || !user || user.role !== "driver") {
      router.replace("/login?role=driver");
      return;
    }

    userRef.current = user;
  }, [router]);

  const fetchData = useCallback(async () => {
    const user = userRef.current;
    if (!user) return;

    try {
      const [myData, openData] = await Promise.all([
        getMissions({ driverUid: user.driver_id }),
        getMissions({ status: "available" }),
      ]);

      setMyMissions(
        myData.filter((mission) => mission.assigned_driver_id === user.driver_id)
      );
      setOpenMissions(
        openData.filter((mission) => mission.status === "available")
      );
    } catch {
      setMyMissions([]);
      setOpenMissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const user = userRef.current;
    if (!user?.driver_id) return;

    const ws = new GPSWebSocket(
      `${getWsBase()}/ws/gps/${user.driver_id}`,
      () => undefined,
      () => undefined
    );
    wsRef.current = ws;
    ws.connect();

    const gpsInterval = setInterval(() => {
      if (ws.isConnected) {
        ws.send({
          lat: 32.08 + (Math.random() - 0.5) * 0.02,
          lng: 34.78 + (Math.random() - 0.5) * 0.02,
          timestamp: new Date().toISOString(),
        });
      }
    }, 5000);

    return () => {
      clearInterval(gpsInterval);
      ws.disconnect();
    };
  }, []);

  const handleAcceptMission = useCallback(
    async (missionId: string) => {
      const user = userRef.current;
      if (!user?.driver_id) return;

      setAcceptingMissionId(missionId);

      try {
        await createMissionRequest(missionId);
        await fetchData();
        alert("Request sent to dispatcher for approval.");
      } catch {
        alert("Could not request mission.");
      } finally {
        setAcceptingMissionId(null);
      }
    },
    [fetchData]
  );

  const pageCopy = {
    "my-missions": {
      title: "My Missions",
      description:
        "Track assigned deliveries, start routes, and mark completed missions.",
    },
    "open-tasks": {
      title: "Open Tasks",
      description:
        "Review available missions, expand each entry, and request matching tasks.",
    },
    profile: {
      title: "Driver Profile",
      description: "View your driver account and vehicle information.",
    },
  } satisfies Record<DriverTab, { title: string; description: string }>;

  const handleMarkDelivered = useCallback(
    async (missionId: string) => {
      try {
        await updateMissionStatus(missionId, "delivered");
        await fetchData();
      } catch {
        alert("Could not mark mission as delivered.");
      }
    },
    [fetchData]
  );

  const handleStartTransit = useCallback(
    async (missionId: string, status: "in_transit") => {
      try {
        await updateMissionStatus(missionId, status);
        await fetchData();
      } catch {
        alert("Could not update mission status.");
      }
    },
    [fetchData]
  );

  const handleCancelMission = useCallback(
    async (missionId: string, reason: string) => {
      try {
        await cancelMission(missionId, reason);
        await fetchData();
      } catch {
        alert("Could not cancel mission.");
      }
    },
    [fetchData]
  );

  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl">
        <DriverHeader
          title={pageCopy[initialTab].title}
          description={pageCopy[initialTab].description}
        />

        {initialTab === "my-missions" && (
          <MyMissionsTab
            missions={myMissions}
            onMarkDelivered={handleMarkDelivered}
            onUpdateStatus={handleStartTransit}
            onCancelMission={handleCancelMission}
          />
        )}

        {initialTab === "open-tasks" && (
          <OpenTasksTab
            missions={openMissions}
            loading={loading}
            acceptingMissionId={acceptingMissionId}
            onAcceptMission={handleAcceptMission}
          />
        )}

        {initialTab === "profile" && <ProfileTab />}
      </div>
    </main>
  );
}
