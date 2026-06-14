"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type Mission,
  type Driver,
  getMissions,
  getDrivers,
  getToken,
  getStoredUser,
  assignMission,
} from "@/lib/api-client";

import DispatcherStatBox from "@/components/dispatcher/shared/DispatcherStatBox";
import PendingRequestEntry, {
  type DeliveryRequest,
  type RequestStatus,
} from "@/components/dispatcher/pending-requests/PendingRequestEntry";

function createMockRequests(missions: Mission[], drivers: Driver[]) {
  const availableMissions = missions.filter(
    (mission) => mission.status === "available"
  );

  const availableDrivers = drivers.filter(
    (driver) => driver.status === "available"
  );

  return availableMissions
    .slice(0, Math.min(availableMissions.length, availableDrivers.length))
    .map((mission, index): DeliveryRequest => {
      const driver = availableDrivers[index];

      return {
        id: `request-${mission.id}-${driver.id}`,
        driver,
        mission,
        requestedAt: mission.created_at,
        driverScore: mission.match_score ?? 70 + ((index * 7) % 25),
        status: "pending",
      };
    });
}

export default function PendingRequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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

      setRequests((currentRequests) => {
        const nextRequests = createMockRequests(missionsData, driversData);

        return nextRequests.map((nextRequest) => {
          const existing = currentRequests.find(
            (request) => request.id === nextRequest.id
          );

          return existing
            ? {
                ...nextRequest,
                status: existing.status,
              }
            : nextRequest;
        });
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((request) => request.status === "pending")
        .length,
      accepted: requests.filter((request) => request.status === "accepted")
        .length,
      declined: requests.filter((request) => request.status === "declined")
        .length,
    };
  }, [requests]);

  const sortedRequests = useMemo(() => {
    const priorityOrder = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    const statusOrder: Record<RequestStatus, number> = {
      pending: 0,
      accepted: 1,
      declined: 2,
    };

    return [...requests].sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];

      if (statusDiff !== 0) return statusDiff;

      const priorityDiff =
        priorityOrder[a.mission.priority] - priorityOrder[b.mission.priority];

      if (priorityDiff !== 0) return priorityDiff;

      return b.driverScore - a.driverScore;
    });
  }, [requests]);

  async function handleAccept(request: DeliveryRequest) {
    setActionLoadingId(request.id);

    try {
      await assignMission(request.mission.id, request.driver.id);

      setRequests((currentRequests) =>
        currentRequests.map((item) =>
          item.id === request.id ? { ...item, status: "accepted" } : item
        )
      );

      await fetchData();
    } catch {
      alert("Could not accept request. Make sure the backend is running.");
    } finally {
      setActionLoadingId(null);
    }
  }

  function handleDecline(requestId: string) {
    setRequests((currentRequests) =>
      currentRequests.map((item) =>
        item.id === requestId ? { ...item, status: "declined" } : item
      )
    );
  }

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
            Drivers requesting to deliver packages from the delivery pool.
          </p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DispatcherStatBox
            title="Total Requests"
            value={stats.total}
            subtitle="All driver requests"
          />
          <DispatcherStatBox
            title="Pending"
            value={stats.pending}
            subtitle="Waiting for decision"
          />
          <DispatcherStatBox
            title="Accepted"
            value={stats.accepted}
            subtitle="Approved by dispatcher"
          />
          <DispatcherStatBox
            title="Declined"
            value={stats.declined}
            subtitle="Rejected requests"
          />
        </section>

        <section className="rounded-2xl border border-app bg-card shadow-xl">
          <div className="border-b border-app px-5 py-4">
            <h2 className="text-xl font-bold">Driver Requests</h2>
            <p className="mt-1 text-sm text-muted">
              Click a request to expand the full delivery information.
            </p>
          </div>

          <div className="divide-y divide-white/10">
            {sortedRequests.length === 0 && (
              <div className="p-8 text-center text-muted">
                No pending driver requests yet.
              </div>
            )}

            {sortedRequests.map((request) => {
              const isExpanded = expandedId === request.id;

              return (
                <PendingRequestEntry
                  key={request.id}
                  request={request}
                  isExpanded={isExpanded}
                  isActionLoading={actionLoadingId === request.id}
                  onToggle={() =>
                    setExpandedId(isExpanded ? null : request.id)
                  }
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                />
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
