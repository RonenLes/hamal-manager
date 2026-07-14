"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LoadingScreen } from "@/components/shared/Spinner";
import { useRouter } from "next/navigation";

import DispatcherRequestCard from "@/components/driver/requests/DispatcherRequestCard";
import BackToMenuButton from "@/components/shared/BackToMenuButton";
import {
  approveMissionRequest,
  declineMissionRequest,
  getMissionRequests,
  getStoredUser,
  getToken,
  type MissionDeliveryRequest,
} from "@/lib/api-client";

export default function DriverRequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<MissionDeliveryRequest[]>([]);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (!token || !user || user.role !== "driver") {
      router.replace("/login?role=driver");
    }
  }, [router]);

  const fetchData = useCallback(async () => {
    try {
      const requestData = await getMissionRequests({ status: "pending" });
      setRequests(
        requestData.filter(
          (request) => request.source === "dispatcher" && request.mission
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const stats = useMemo(() => {
    const urgent = requests.filter(
      (request) =>
        request.mission?.priority === "high" ||
        request.mission?.priority === "critical"
    ).length;

    return {
      total: requests.length,
      urgent,
    };
  }, [requests]);

  async function handleAccept(requestId: string) {
    setActionLoadingId(requestId);

    try {
      await approveMissionRequest(requestId);
      await fetchData();
      setExpandedRequestId(null);
    } catch (error: unknown) {
      const detail =
        error && typeof error === "object" && "detail" in error
          ? String((error as { detail: unknown }).detail)
          : null;

      alert(detail || "Could not accept request.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDecline(requestId: string) {
    setActionLoadingId(requestId);

    try {
      await declineMissionRequest(requestId);
      await fetchData();
      setExpandedRequestId(null);
    } catch (error: unknown) {
      const detail =
        error && typeof error === "object" && "detail" in error
          ? String((error as { detail: unknown }).detail)
          : null;

      alert(detail || "Could not decline request.");
    } finally {
      setActionLoadingId(null);
    }
  }

  if (loading) {
    return (
      <LoadingScreen label="Loading dispatcher requests..." />
    );
  }

  return (
    <main className="min-h-screen bg-app px-3 py-4 text-main sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 sm:mb-8">
          <div className="mb-4">
            <BackToMenuButton href="/driver/menu" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            Dispatcher Requests
          </p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
            Requests From Dispatcher
          </h1>
          <p className="mt-2 text-muted">
            Review suggested deliveries and choose whether to accept or decline.
          </p>
        </header>

        <section className="mb-5 grid grid-cols-2 gap-3 sm:gap-5">
          <div className="rounded-xl border border-app bg-card p-4 shadow-sm">
            <p className="text-sm font-bold text-muted">Pending</p>
            <p className="mt-1 text-3xl font-semibold text-main">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-app bg-card p-4 shadow-sm">
            <p className="text-sm font-bold text-muted">Urgent</p>
            <p className="mt-1 text-3xl font-semibold text-main">{stats.urgent}</p>
          </div>
        </section>

        <section className="grid gap-4">
          {requests.length === 0 && (
            <div className="rounded-xl border border-app bg-card p-8 text-center text-muted shadow-sm">
              No dispatcher requests are waiting for you.
            </div>
          )}

          {requests.map((request) => (
            <DispatcherRequestCard
              key={request.id}
              request={request}
              isExpanded={expandedRequestId === request.id}
              isActionLoading={actionLoadingId === request.id}
              onToggle={() =>
                setExpandedRequestId((current) =>
                  current === request.id ? null : request.id
                )
              }
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
