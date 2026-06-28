"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type DriverRequest,
  getPendingDriverRequests,
  getToken,
  getStoredUser,
  approveDriverRequest,
  declineDriverRequest,
} from "@/lib/api-client";

import NewDriverRequestEntry from "@/components/dispatcher/drivers/NewDriverRequestEntry";
import BackToMenuButton from "@/components/shared/BackToMenuButton";

// Renders the new drivers page component.
export default function NewDriversPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<DriverRequest[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (!token || !user || user.role !== "dispatcher") {
      router.replace("/login?role=dispatcher");
    }
  }, [router]);

  // Fetches the latest page data.
  async function fetchData() {
    try {
      const data = await getPendingDriverRequests();
      setRequests(data);
    } finally {
      setLoading(false);
    }
  }

  // Handles the approve action.
  async function handleApprove(requestId: string) {
    try {
      await approveDriverRequest(requestId);
      setExpandedId(null);
      await fetchData();
    } catch {
      alert("Could not approve driver request.");
    }
  }

  // Handles the decline action.
  async function handleDecline(requestId: string) {
    try {
      await declineDriverRequest(requestId);
      setExpandedId(null);
      await fetchData();
    } catch {
      alert("Could not decline driver request.");
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app text-main">
        Loading new driver requests...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <BackToMenuButton href="/dispatcher/drivers" />

          <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-emerald-400">
            New Driver Requests
          </p>

          <h1 className="mt-1 text-3xl font-black">Pending Drivers</h1>

          <p className="mt-2 text-muted">
            Review new volunteer driver requests and approve or decline them.
          </p>
        </header>

        <section className="rounded-2xl border border-app bg-card shadow-xl">
          <div className="border-b border-app px-5 py-4">
            <h2 className="text-xl font-bold text-main">Pending Requests</h2>

            <p className="mt-1 text-sm text-muted">
              {requests.length} pending request
              {requests.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="divide-y divide-[var(--border-app)]">
            {requests.length === 0 && (
              <div className="p-8 text-center text-muted">
                There are no pending driver requests.
              </div>
            )}

            {requests.map((request) => {
              const isExpanded = expandedId === request.id;

              return (
                <NewDriverRequestEntry
                  key={request.id}
                  driverRequest={request}
                  isExpanded={isExpanded}
                  onToggle={() =>
                    setExpandedId(isExpanded ? null : request.id)
                  }
                  onApprove={() => handleApprove(request.id)}
                  onDecline={() => handleDecline(request.id)}
                />
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
