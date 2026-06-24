"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getMissionRequests,
  getStoredUser,
  getToken,
} from "@/lib/api-client";

import PendingMissionRequestEntry, {
  type MissionRequestGroup,
} from "@/components/dispatcher/pending-requests/PendingMissionRequestEntry";
import DispatcherStatBox from "@/components/dispatcher/shared/DispatcherStatBox";

type MissionDeliveryRequest = Awaited<
  ReturnType<typeof getMissionRequests>
>[number];

function toMatchPercentage(score: number) {
  return Math.round(score * 100);
}

function groupRequestsByMission(
  requests: MissionDeliveryRequest[]
): MissionRequestGroup[] {
  const groups = new Map<string, MissionRequestGroup>();

  for (const request of requests) {
    if (!request.driver || !request.mission) continue;
    if (request.mission.status !== "available") continue;
    if (request.mission.assigned_driver_id) continue;

    const existing = groups.get(request.mission.id);
    const group =
      existing ??
      ({
        mission: request.mission,
        requests: [],
      } satisfies MissionRequestGroup);

    group.requests.push({
      id: request.id,
      driver: request.driver,
      requestedAt: request.created_at,
      matchScore: toMatchPercentage(request.match_score),
      status: request.status,
    });

    groups.set(request.mission.id, group);
  }

  return [...groups.values()].map((group) => ({
    ...group,
    requests: [...group.requests].sort((a, b) => b.matchScore - a.matchScore),
  }));
}

export default function PendingRequestsPage() {
  const router = useRouter();

  const [groups, setGroups] = useState<MissionRequestGroup[]>([]);
  const [expandedMissionId, setExpandedMissionId] = useState<string | null>(null);
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
      const requestData = await getMissionRequests({ status: "pending" });
      setGroups(groupRequestsByMission(requestData));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const sortedGroups = useMemo(() => {
    const priorityOrder = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return [...groups].sort((a, b) => {
      const priorityDiff =
        priorityOrder[a.mission.priority] - priorityOrder[b.mission.priority];

      if (priorityDiff !== 0) return priorityDiff;

      const bestA = Math.max(...a.requests.map((request) => request.matchScore));
      const bestB = Math.max(...b.requests.map((request) => request.matchScore));

      return bestB - bestA;
    });
  }, [groups]);

  const stats = useMemo(() => {
    const totalRequests = groups.reduce(
      (total, group) => total + group.requests.length,
      0
    );
    const criticalMissions = groups.filter(
      (group) => group.mission.priority === "critical"
    ).length;
    const bestMatch = groups.length
      ? Math.max(
          ...groups.flatMap((group) =>
            group.requests.map((request) => request.matchScore)
          )
        )
      : 0;

    return {
      missions: groups.length,
      requests: totalRequests,
      criticalMissions,
      bestMatch,
    };
  }, [groups]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app text-main">
        Loading pending requests...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-400">
            Delivery Pool Requests
          </p>
          <h1 className="mt-1 text-3xl font-black">Pending Requests</h1>
          <p className="mt-2 text-muted">
            Unassigned missions with drivers waiting for dispatcher approval.
          </p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DispatcherStatBox
            title="Requested Missions"
            value={stats.missions}
            subtitle="Unassigned missions with requests"
          />
          <DispatcherStatBox
            title="Driver Requests"
            value={stats.requests}
            subtitle="Pending driver offers"
          />
          <DispatcherStatBox
            title="Critical"
            value={stats.criticalMissions}
            subtitle="Urgent missions waiting"
          />
          <DispatcherStatBox
            title="Best Match"
            value={stats.bestMatch}
            subtitle="Highest compatibility (%)"
          />
        </section>

        <section className="rounded-2xl border border-app bg-card shadow-xl">
          <div className="border-b border-app px-5 py-4">
            <h2 className="text-xl font-bold">Missions With Driver Requests</h2>
            <p className="mt-1 text-sm text-muted">
              Open a mission to review its details and compare requesting drivers.
            </p>
          </div>

          <div className="divide-y divide-white/10">
            {sortedGroups.length === 0 && (
              <div className="p-8 text-center text-muted">
                No unassigned missions have pending driver requests.
              </div>
            )}

            {sortedGroups.map((group) => {
              const isExpanded = expandedMissionId === group.mission.id;

              return (
                <PendingMissionRequestEntry
                  key={group.mission.id}
                  group={group}
                  isExpanded={isExpanded}
                  onToggleMission={() => {
                    setExpandedMissionId(isExpanded ? null : group.mission.id);
                  }}
                />
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
