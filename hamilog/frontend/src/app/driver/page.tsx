"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type MessageParticipant,
  type Mission,
  type MissionDeliveryRequest,
  type StoredUser,
  approveMissionRequest,
  cancelMission,
  declineMissionRequest,
  getMessageParticipants,
  getMissionRequests,
  getMissions,
  getStoredUser,
  getToken,
  updateMissionStatus,
} from "@/lib/api-client";
import StatCard from "@/components/dispatcher/dashboard/StatCard";
import ActiveMissionCard from "@/components/driver/missions/ActiveMissionCard";
import DispatcherRequestCard from "@/components/driver/requests/DispatcherRequestCard";
import DispatcherStatsWindow from "@/components/dispatcher/shared/DispatcherStatsWindow";
import { getMissionDistanceLabel } from "@/lib/mission-distance";
import { formatIdealDeliveryTime } from "@/lib/mission-time";

function isPresentOrFutureMission(mission: Mission) {
  return mission.status === "assigned" || mission.status === "in_transit";
}

function sortPresentAndFutureMissions(a: Mission, b: Mission) {
  if (a.status === "in_transit" && b.status !== "in_transit") return -1;
  if (a.status !== "in_transit" && b.status === "in_transit") return 1;

  const aTime = new Date(a.ideal_delivery_time || a.created_at).getTime();
  const bTime = new Date(b.ideal_delivery_time || b.created_at).getTime();

  return aTime - bTime;
}

// Renders the driver dashboard page component.
export default function DriverDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [openMissions, setOpenMissions] = useState<Mission[]>([]);
  const [dispatcherRequests, setDispatcherRequests] = useState<
    MissionDeliveryRequest[]
  >([]);
  const [dispatchers, setDispatchers] = useState<MessageParticipant[]>([]);
  const [isRequestsPanelOpen, setIsRequestsPanelOpen] = useState(true);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [requestActionLoadingId, setRequestActionLoadingId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser || storedUser.role !== "driver") {
      router.replace("/login?role=driver");
      return;
    }

    const driverId = storedUser.driver_id;

    // Fetches the latest page data.
    async function fetchData() {
      try {
        const [myData, openData, participantData, requestData] = await Promise.all([
          getMissions({ driverUid: driverId }),
          getMissions({ status: "available" }),
          getMessageParticipants(),
          getMissionRequests({ status: "pending" }),
        ]);

        setMissions(
          myData.filter(
            (mission) => mission.assigned_driver_id === driverId
          )
        );
        setOpenMissions(
          openData.filter((mission) => mission.status === "available")
        );
        setDispatchers(participantData.dispatchers);
        setDispatcherRequests(
          requestData.filter(
            (request) => request.source === "dispatcher" && request.mission
          )
        );
        setUser(storedUser);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [router]);

  // Handles the refresh dashboard logic.
  async function refreshDashboard() {
    if (!user?.driver_id) return;

    const [myData, openData, participantData, requestData] = await Promise.all([
      getMissions({ driverUid: user.driver_id }),
      getMissions({ status: "available" }),
      getMessageParticipants(),
      getMissionRequests({ status: "pending" }),
    ]);

    setMissions(
      myData.filter((mission) => mission.assigned_driver_id === user.driver_id)
    );
    setOpenMissions(openData.filter((mission) => mission.status === "available"));
    setDispatchers(participantData.dispatchers);
    setDispatcherRequests(
      requestData.filter(
        (request) => request.source === "dispatcher" && request.mission
      )
    );
  }

  // Handles the mark delivered action.
  async function handleMarkDelivered(missionId: string) {
    await updateMissionStatus(missionId, "delivered");
    await refreshDashboard();
  }

  // Handles the start transit action.
  async function handleStartTransit(missionId: string, status: "in_transit") {
    await updateMissionStatus(missionId, status);
    await refreshDashboard();
  }

  // Handles the cancel mission action.
  async function handleCancelMission(missionId: string, reason: string) {
    await cancelMission(missionId, reason);
    await refreshDashboard();
  }

  // Handles accepting a dispatcher suggestion.
  async function handleAcceptDispatcherRequest(requestId: string) {
    setRequestActionLoadingId(requestId);

    try {
      await approveMissionRequest(requestId);
      await refreshDashboard();
      setExpandedRequestId(null);
    } catch (error: unknown) {
      const detail =
        error && typeof error === "object" && "detail" in error
          ? String((error as { detail: unknown }).detail)
          : null;

      alert(detail || "Could not accept dispatcher request.");
    } finally {
      setRequestActionLoadingId(null);
    }
  }

  // Handles declining a dispatcher suggestion.
  async function handleDeclineDispatcherRequest(requestId: string) {
    setRequestActionLoadingId(requestId);

    try {
      await declineMissionRequest(requestId);
      await refreshDashboard();
      setExpandedRequestId(null);
    } catch (error: unknown) {
      const detail =
        error && typeof error === "object" && "detail" in error
          ? String((error as { detail: unknown }).detail)
          : null;

      alert(detail || "Could not decline dispatcher request.");
    } finally {
      setRequestActionLoadingId(null);
    }
  }

  const presentAndFutureMissions = missions
    .filter(isPresentOrFutureMission)
    .sort(sortPresentAndFutureMissions);
  const activeMission =
    presentAndFutureMissions.find(
      (mission) => mission.status === "in_transit"
    ) || presentAndFutureMissions[0];
  const activeCount = presentAndFutureMissions.filter(
    (mission) => mission.status === "in_transit"
  ).length;
  const completedCount = missions.filter(
    (mission) => mission.status === "delivered"
  ).length;
  const deliveredMissions = missions.filter(
    (mission) => mission.status === "delivered"
  );
  const onlineDispatchers = dispatchers.filter(
    (dispatcher) => dispatcher.is_online
  );

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

        </header>

        <DispatcherStatsWindow>
          <StatCard
            title="Active Mission"
            value={`${activeCount}`}
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

          <StatCard
            title="Total Km"
            value={getMissionDistanceLabel(deliveredMissions)}
            subtitle="Delivered routes"
            icon="km"
            color="blue"
          />
        </DispatcherStatsWindow>

        <section className="mb-5 rounded-2xl border border-app bg-card p-5 shadow-xl">
          <h2 className="text-xl font-black text-main">Driver Status</h2>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <div className="flex justify-between gap-4 rounded-xl border border-app bg-card-soft p-4">
              <span className="text-muted">Account</span>
              <span className="font-bold text-main">
                {user?.username || "Driver"}
              </span>
            </div>
            <div className="flex justify-between gap-4 rounded-xl border border-app bg-card-soft p-4">
              <span className="text-muted">Vehicle</span>
              <span className="font-bold capitalize text-main">
                {user?.car_type?.replace("_", " ") || "Not set"}
              </span>
            </div>
            <div className="flex justify-between gap-4 rounded-xl border border-app bg-card-soft p-4">
              <span className="text-muted">Online</span>
              <span className="font-bold text-emerald-300">Ready</span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 xl:gap-5">
          <div className="xl:col-span-2">
            {activeMission ? (
              <ActiveMissionCard
                mission={activeMission}
                onMarkDelivered={handleMarkDelivered}
                onUpdateStatus={handleStartTransit}
                onCancelMission={handleCancelMission}
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

            <section
              className={`mt-5 overflow-auto rounded-2xl border border-app bg-card shadow-xl ${
                isRequestsPanelOpen ? "resize-y" : ""
              }`}
              style={{
                minHeight: isRequestsPanelOpen ? "220px" : undefined,
                maxHeight: isRequestsPanelOpen ? "620px" : undefined,
              }}
            >
              <button
                type="button"
                onClick={() => setIsRequestsPanelOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-3 border-b border-app px-5 py-4 text-left transition hover:bg-card-soft"
              >
                <div>
                  <h2 className="text-xl font-black text-main">
                    Dispatcher Requests
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Suggested deliveries waiting for your answer.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-blue-500/15 px-3 py-2 text-sm font-black text-blue-300">
                    {dispatcherRequests.length}
                  </span>
                  <span className="text-xl text-muted">
                    {isRequestsPanelOpen ? "^" : "v"}
                  </span>
                </div>
              </button>

              {isRequestsPanelOpen && (
                <div className="grid gap-3 p-4">
                  {dispatcherRequests.length === 0 && (
                    <p className="rounded-xl border border-app bg-card-soft p-4 text-sm text-muted">
                      No dispatcher requests are waiting.
                    </p>
                  )}

                  {dispatcherRequests.map((request) => (
                    <DispatcherRequestCard
                      key={request.id}
                      request={request}
                      isExpanded={expandedRequestId === request.id}
                      isActionLoading={requestActionLoadingId === request.id}
                      onToggle={() =>
                        setExpandedRequestId((current) =>
                          current === request.id ? null : request.id
                        )
                      }
                      onAccept={handleAcceptDispatcherRequest}
                      onDecline={handleDeclineDispatcherRequest}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="mt-5 rounded-2xl border border-app bg-card shadow-xl">
              <div className="border-b border-app px-5 py-4">
                <h2 className="text-xl font-black text-main">
                  Assigned Missions
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Present and future missions linked to your driver account.
                </p>
              </div>

              <div className="divide-y divide-[var(--border-app)]">
                {presentAndFutureMissions.length === 0 && (
                  <p className="p-5 text-sm text-muted">
                    No present or future assigned missions yet.
                  </p>
                )}

                {presentAndFutureMissions.map((mission) => (
                  <div
                    key={mission.id}
                    className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-main">
                        {mission.title}
                      </p>
                      <p className="text-sm text-muted">
                        {mission.status.replace("_", " ")} -{" "}
                        {formatIdealDeliveryTime(mission.ideal_delivery_time)}
                      </p>
                    </div>
                    <Link
                      href="/driver/my-missions"
                      className="rounded-xl border border-app bg-card-soft px-4 py-2 text-center text-sm font-bold text-main transition hover:bg-card-soft"
                    >
                      Open
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-2xl border border-app bg-card p-5 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-main">
                    Online Dispatchers
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Message operations support directly.
                  </p>
                </div>
                <span className="rounded-xl bg-emerald-500/15 px-3 py-2 text-sm font-black text-emerald-300">
                  {onlineDispatchers.length}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {onlineDispatchers.length === 0 && (
                  <p className="rounded-xl border border-app bg-card-soft p-4 text-sm text-muted">
                    No dispatcher is marked online right now.
                  </p>
                )}

                {onlineDispatchers.map((dispatcher) => (
                  <div
                    key={dispatcher.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-app bg-card-soft p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-main">
                        {dispatcher.name}
                      </p>
                      <p className="text-sm text-emerald-300">Online</p>
                    </div>
                    <Link
                      href={`/driver/messages/dispatcher/${dispatcher.id}`}
                      className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-sm font-black text-blue-200 transition hover:bg-blue-500/20"
                      aria-label={`Message ${dispatcher.name}`}
                    >
                      @
                    </Link>
                  </div>
                ))}
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
                  href="/driver/availability"
                  className="rounded-xl border border-app bg-card-soft px-4 py-3 text-sm font-bold text-main hover:bg-card-soft"
                >
                  Availability
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
