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

import PriorityBadge from "@/components/dispatcher/PriorityBadge";

type RequestStatus = "pending" | "accepted" | "declined";

type DeliveryRequest = {
  id: string;
  driver: Driver;
  mission: Mission;
  requestedAt: string;
  driverScore: number;
  status: RequestStatus;
};

function formatDateTime(dateValue?: string) {
  if (!dateValue) return "Unknown";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRequestStatusClasses(status: RequestStatus) {
  switch (status) {
    case "pending":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
    case "accepted":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "declined":
      return "border-red-500/30 bg-red-500/10 text-red-300";
  }
}

function getDriverScoreClasses(score: number) {
  if (score >= 85) return "text-emerald-300";
  if (score >= 65) return "text-orange-300";
  return "text-red-300";
}

function StatBox({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-app bg-card p-5 shadow-xl">
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-2 text-3xl font-black text-main">{value}</p>
      <p className="mt-1 text-xs text-soft">{subtitle}</p>
    </div>
  );
}

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

  const [missions, setMissions] = useState<Mission[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
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

      setMissions(missionsData);
      setDrivers(driversData);

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
          <StatBox
            title="Total Requests"
            value={stats.total}
            subtitle="All driver requests"
          />

          <StatBox
            title="Pending"
            value={stats.pending}
            subtitle="Waiting for decision"
          />

          <StatBox
            title="Accepted"
            value={stats.accepted}
            subtitle="Approved by dispatcher"
          />

          <StatBox
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
              const isActionLoading = actionLoadingId === request.id;

              return (
                <article key={request.id} className="bg-card">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : request.id)
                    }
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-card-soft"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-main">
                          Driver: {request.driver.name}
                        </h3>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getRequestStatusClasses(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>

                        <PriorityBadge priority={request.mission.priority} />
                      </div>

                      <p className="mt-1 truncate text-sm text-muted">
                        Delivery: {request.mission.title} · To:{" "}
                        {request.mission.dropoff?.address || "Dropoff TBD"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`text-sm font-black ${getDriverScoreClasses(
                          request.driverScore
                        )}`}
                      >
                        {request.driverScore}%
                      </span>

                      <span className="text-xl text-muted">
                        {isExpanded ? "⌃" : "⌄"}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-app bg-app/60 px-5 py-5">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-xl border border-app bg-card p-4">
                          <p className="text-xs uppercase tracking-wider text-soft">
                            Driver
                          </p>

                          <p className="mt-2 font-semibold text-main">
                            {request.driver.name}
                          </p>

                          <p className="mt-1 text-sm capitalize text-muted">
                            Status: {request.driver.status.replace("_", " ")}
                          </p>
                        </div>

                        <div className="rounded-xl border border-app bg-card p-4">
                          <p className="text-xs uppercase tracking-wider text-soft">
                            From
                          </p>

                          <p className="mt-2 font-semibold text-main">
                            {request.mission.pickup?.address ||
                              "Pickup location TBD"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-app bg-card p-4">
                          <p className="text-xs uppercase tracking-wider text-soft">
                            To
                          </p>

                          <p className="mt-2 font-semibold text-main">
                            {request.mission.dropoff?.address ||
                              "Dropoff location TBD"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-app bg-card p-4">
                          <p className="text-xs uppercase tracking-wider text-soft">
                            Request Time
                          </p>

                          <p className="mt-2 font-semibold text-main">
                            {formatDateTime(request.requestedAt)}
                          </p>

                          <p className="mt-1 text-sm text-muted">
                            Initially published:{" "}
                            {formatDateTime(request.mission.created_at)}
                          </p>
                        </div>

                        <div className="rounded-xl border border-app bg-card p-4">
                          <p className="text-xs uppercase tracking-wider text-soft">
                            Driver Score
                          </p>

                          <p
                            className={`mt-2 text-3xl font-black ${getDriverScoreClasses(
                              request.driverScore
                            )}`}
                          >
                            {request.driverScore}%
                          </p>

                          <p className="mt-1 text-sm text-muted">
                            Estimated compatibility score
                          </p>
                        </div>

                        <div className="rounded-xl border border-app bg-card p-4">
                          <p className="text-xs uppercase tracking-wider text-soft">
                            Urgency
                          </p>

                          <div className="mt-2">
                            <PriorityBadge
                              priority={request.mission.priority}
                            />
                          </div>
                        </div>

                        <div className="rounded-xl border border-app bg-card p-4 md:col-span-2">
                          <p className="text-xs uppercase tracking-wider text-soft">
                            Cargo / Product
                          </p>

                          <p className="mt-2 font-semibold text-main">
                            {request.mission.description ||
                              "No product description"}
                          </p>

                          <p className="mt-1 text-sm text-muted">
                            {request.mission.cargo?.weight_kg ?? "?"} kg ·{" "}
                            {request.mission.cargo?.volume_liters ?? "?"} L
                            {request.mission.cargo?.requires_cooling
                              ? " · Cooling required"
                              : ""}
                          </p>
                        </div>

                        <div className="rounded-xl border border-app bg-card p-4">
                          <p className="text-xs uppercase tracking-wider text-soft">
                            Request Status
                          </p>

                          <p
                            className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-bold capitalize ${getRequestStatusClasses(
                              request.status
                            )}`}
                          >
                            {request.status}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 border-t border-app pt-5 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => handleDecline(request.id)}
                          disabled={
                            request.status !== "pending" || isActionLoading
                          }
                          className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-main transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Decline
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAccept(request)}
                          disabled={
                            request.status !== "pending" || isActionLoading
                          }
                          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-main transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {isActionLoading ? "Accepting..." : "Accept"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}