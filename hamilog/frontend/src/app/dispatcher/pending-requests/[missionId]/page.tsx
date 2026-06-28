"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  approveMissionRequest,
  declineMissionRequest,
  getMissionRequests,
  getStoredUser,
  getToken,
} from "@/lib/api-client";

import PendingRequestDriverEntry, {
  type DriverMissionRequest,
} from "@/components/dispatcher/pending-requests/PendingRequestDriverEntry";
import DetailTile from "@/components/dispatcher/shared/DetailTile";
import PriorityBadge from "@/components/dispatcher/shared/PriorityBadge";
import BackToMenuButton from "@/components/shared/BackToMenuButton";
import type { Mission } from "@/lib/types";
import { formatDateTime24 } from "@/lib/date-format";
import { formatIdealDeliveryTime, getMissionDeliveredAt } from "@/lib/mission-time";

type MissionRequestsPageProps = {
  params: Promise<{
    missionId: string;
  }>;
};

type MissionDeliveryRequest = Awaited<
  ReturnType<typeof getMissionRequests>
>[number];

// Converts the value to a match percentage.
function toMatchPercentage(score: number) {
  return Math.round(score * 100);
}

// Returns the state classes.
function getStateClasses(state: string) {
  if (state === "available") return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  if (state === "assigned") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (state === "cancelled") return "border-red-500/30 bg-red-500/10 text-red-300";
  return "border-orange-500/30 bg-orange-500/10 text-orange-300";
}

// Returns the mission requests for page.
function getMissionRequestsForPage(
  missionId: string,
  requests: MissionDeliveryRequest[]
) {
  let mission: Mission | null = null;
  const driverRequests: DriverMissionRequest[] = [];

  for (const request of requests) {
    if (!request.driver || !request.mission) continue;
    if (request.mission.id !== missionId) continue;

    mission = request.mission;
    driverRequests.push({
      id: request.id,
      driver: request.driver,
      requestedAt: request.created_at,
      matchScore: toMatchPercentage(request.match_score),
      status: request.status,
    });
  }

  return {
    mission,
    requests: driverRequests.sort((a, b) => b.matchScore - a.matchScore),
  };
}

// Renders the mission requests page component.
export default function MissionRequestsPage({ params }: MissionRequestsPageProps) {
  const { missionId } = use(params);
  const router = useRouter();

  const [mission, setMission] = useState<Mission | null>(null);
  const [requests, setRequests] = useState<DriverMissionRequest[]>([]);
  const [expandedDriverRequestId, setExpandedDriverRequestId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (!token || !user || user.role !== "dispatcher") {
      router.replace("/login?role=dispatcher");
    }
  }, [router]);

  const fetchData = useCallback(async () => {
    try {
      const requestData = await getMissionRequests({ status: "pending" });
      const next = getMissionRequestsForPage(missionId, requestData);
      setMission(next.mission);
      setRequests(next.requests);
    } finally {
      setLoading(false);
    }
  }, [missionId]);

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const bestMatch = useMemo(() => {
    return requests.length
      ? Math.max(...requests.map((request) => request.matchScore))
      : 0;
  }, [requests]);
  const deliveredAt = mission ? getMissionDeliveredAt(mission) : null;

  // Handles the accept action.
  async function handleAccept(requestId: string) {
    setActionLoadingId(requestId);

    try {
      await approveMissionRequest(requestId);
      await fetchData();
      setExpandedDriverRequestId(null);
    } catch {
      alert("Could not approve request. Make sure the backend is running.");
    } finally {
      setActionLoadingId(null);
    }
  }

  // Handles the decline action.
  async function handleDecline(requestId: string) {
    setActionLoadingId(requestId);

    try {
      await declineMissionRequest(requestId);
      await fetchData();
      setExpandedDriverRequestId(null);
    } catch {
      alert("Could not decline request. Make sure the backend is running.");
    } finally {
      setActionLoadingId(null);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app text-main">
        Loading mission requests...
      </main>
    );
  }

  if (!mission) {
    return (
      <main className="min-h-screen bg-app p-6 text-main">
        <div className="mx-auto max-w-5xl">
          <BackToMenuButton href="/dispatcher/pending-requests" />
          <div className="mt-6 rounded-2xl border border-app bg-card p-8 text-center text-muted">
            No pending requests were found for this mission.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <BackToMenuButton href="/dispatcher/pending-requests" />
          <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-orange-400">
            Mission Requests
          </p>
          <h1 className="mt-1 text-3xl font-black">{mission.title}</h1>
          <p className="mt-2 text-muted">
            Review drivers requesting this mission and choose who should take it.
          </p>
        </header>

        <section className="mb-6 rounded-2xl border border-app bg-card p-5 shadow-xl">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={mission.priority} />
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStateClasses(
                mission.status
              )}`}
            >
              {mission.status.replace("_", " ")}
            </span>
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">
              {requests.length} request{requests.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <DetailTile label="From">
              <p className="font-semibold text-main">
                {mission.pickup?.address || "Pickup location TBD"}
              </p>
            </DetailTile>
            <DetailTile label="To">
              <p className="font-semibold text-main">
                {mission.dropoff?.address || "Dropoff location TBD"}
              </p>
            </DetailTile>
            <DetailTile label="Cargo">
              <p className="font-semibold text-main">
                {mission.cargo?.weight_kg ?? "?"} kg -{" "}
                {mission.cargo?.volume_liters ?? "?"} L
              </p>
            </DetailTile>
            <DetailTile label="Ideal Time">
              <p className="font-semibold text-main">
                {formatIdealDeliveryTime(mission.ideal_delivery_time)}
              </p>
            </DetailTile>
            <DetailTile label="Delivered At">
              <p className="font-semibold text-main">
                {deliveredAt ? formatDateTime24(deliveredAt) : "Not delivered"}
              </p>
            </DetailTile>
            <DetailTile label="Best Match">
              <p className="text-3xl font-black text-main">{bestMatch}%</p>
            </DetailTile>
          </div>
        </section>

        <section className="rounded-2xl border border-app bg-card shadow-xl">
          <div className="border-b border-app px-5 py-4">
            <h2 className="text-xl font-bold">Requesting Drivers</h2>
            <p className="mt-1 text-sm text-muted">
              Open a driver to see details, history, and assignment actions.
            </p>
          </div>

          <div>
            {requests.length === 0 && (
              <div className="p-8 text-center text-muted">
                There are no pending driver requests for this mission.
              </div>
            )}

            {requests.map((request) => (
              <PendingRequestDriverEntry
                key={request.id}
                request={request}
                isExpanded={expandedDriverRequestId === request.id}
                isActionLoading={actionLoadingId === request.id}
                onToggle={() =>
                  setExpandedDriverRequestId((current) =>
                    current === request.id ? null : request.id
                  )
                }
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
