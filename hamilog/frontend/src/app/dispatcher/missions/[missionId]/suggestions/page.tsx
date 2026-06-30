"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import SuggestedDriverEntry from "@/components/dispatcher/missions/SuggestedDriverEntry";
import DetailTile from "@/components/dispatcher/shared/DetailTile";
import PriorityBadge from "@/components/dispatcher/shared/PriorityBadge";
import BackToMenuButton from "@/components/shared/BackToMenuButton";
import {
  getMission,
  getMissionRequests,
  getStoredUser,
  getSuggestedDrivers,
  getToken,
  suggestMissionToDriver,
  type Mission,
  type MissionDeliveryRequest,
  type SuggestedDriver,
} from "@/lib/api-client";
import { formatIdealDeliveryTime } from "@/lib/mission-time";

type SuggestionsPageProps = {
  params: Promise<{
    missionId: string;
  }>;
};

export default function MissionSuggestionsPage({ params }: SuggestionsPageProps) {
  const { missionId } = use(params);
  const router = useRouter();

  const [mission, setMission] = useState<Mission | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedDriver[]>([]);
  const [sentSuggestions, setSentSuggestions] = useState<MissionDeliveryRequest[]>([]);
  const [expandedDriverId, setExpandedDriverId] = useState<string | null>(null);
  const [isSentListOpen, setIsSentListOpen] = useState(false);
  const [sendingDriverId, setSendingDriverId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (!token || !user || user.role !== "dispatcher") {
      router.replace("/login?role=dispatcher");
    }
  }, [router]);

  const fetchData = useCallback(async () => {
    try {
      const [missionData, suggestedDrivers, requestData] = await Promise.all([
        getMission(missionId),
        getSuggestedDrivers(missionId),
        getMissionRequests({ status: "pending" }),
      ]);
      const sent = requestData.filter(
        (request) =>
          request.mission_id === missionId &&
          request.source === "dispatcher" &&
          request.driver
      );
      const sentDriverIds = new Set(sent.map((request) => request.driver_id));

      setMission(missionData);
      setSentSuggestions(sent);
      setSuggestions(
        suggestedDrivers
          .filter((item) => !sentDriverIds.has(item.driver.id))
          .sort((a, b) => b.match_score - a.match_score)
      );
    } finally {
      setLoading(false);
    }
  }, [missionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const bestMatch = useMemo(() => {
    return suggestions.length
      ? Math.round(Math.max(...suggestions.map((item) => item.match_score)) * 100)
      : 0;
  }, [suggestions]);

  async function handleSendSuggestion(driverId: string, note: string) {
    setSendingDriverId(driverId);

    try {
      await suggestMissionToDriver(missionId, driverId, note);
      await fetchData();
    } catch (error: unknown) {
      const detail =
        error && typeof error === "object" && "detail" in error
          ? String((error as { detail: unknown }).detail)
          : null;

      alert(detail || "Could not send suggestion.");
    } finally {
      setSendingDriverId(null);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app text-main">
        Loading suggested drivers...
      </main>
    );
  }

  if (!mission) {
    return (
      <main className="min-h-screen bg-app p-6 text-main">
        <div className="mx-auto max-w-5xl">
          <BackToMenuButton href="/dispatcher/missions" />
          <div className="mt-6 rounded-2xl border border-app bg-card p-8 text-center text-muted">
            Mission not found.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app px-3 py-4 text-main sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <BackToMenuButton href="/dispatcher/missions" />
          <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-orange-400">
            Driver Suggestions
          </p>
          <h1 className="mt-1 text-2xl font-black sm:text-3xl">
            Suggest {mission.title}
          </h1>
          <p className="mt-2 text-muted">
            Choose drivers that fit the vehicle requirements and marked availability.
          </p>
        </header>

        <section className="mb-6 rounded-2xl border border-app bg-card p-5 shadow-xl">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={mission.priority} />
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">
              {suggestions.length} suited driver
              {suggestions.length === 1 ? "" : "s"}
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
            <DetailTile label="Best Match">
              <p className="text-3xl font-black text-main">{bestMatch}%</p>
            </DetailTile>
          </div>

          <div className="mt-5 border-t border-app pt-4">
            <button
              type="button"
              onClick={() => setIsSentListOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-app bg-card-soft px-4 py-3 text-left transition hover:bg-card-soft"
            >
              <span className="font-bold text-main">
                Already suggested to {sentSuggestions.length} driver
                {sentSuggestions.length === 1 ? "" : "s"}
              </span>
              <span className="text-xl text-muted">
                {isSentListOpen ? "^" : "v"}
              </span>
            </button>

            {isSentListOpen && (
              <div className="mt-3 grid gap-2">
                {sentSuggestions.length === 0 && (
                  <p className="rounded-xl border border-app bg-app p-4 text-sm text-muted">
                    No suggestions have been sent for this mission yet.
                  </p>
                )}

                {sentSuggestions.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-xl border border-app bg-app p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-bold text-main">
                          {request.driver?.name || request.driver_id}
                        </p>
                        <p className="text-sm text-muted">
                          {request.driver?.phone || "No phone"} -{" "}
                          {request.driver?.email || "No email"}
                        </p>
                      </div>
                      <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">
                        Pending
                      </span>
                    </div>
                    {request.note && (
                      <p className="mt-3 text-sm text-muted">{request.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-app bg-card shadow-xl">
          <div className="border-b border-app px-5 py-4">
            <h2 className="text-xl font-bold">Suitable Drivers</h2>
            <p className="mt-1 text-sm text-muted">
              Expand a driver, add a personal note, and send the suggestion.
            </p>
          </div>

          <div>
            {suggestions.length === 0 && (
              <div className="p-8 text-center text-muted">
                No drivers currently match this mission and marked availability.
              </div>
            )}

            {suggestions.map((suggestion) => (
              <SuggestedDriverEntry
                key={suggestion.driver.id}
                suggestion={suggestion}
                isExpanded={expandedDriverId === suggestion.driver.id}
                isSending={sendingDriverId === suggestion.driver.id}
                onToggle={() =>
                  setExpandedDriverId((current) =>
                    current === suggestion.driver.id ? null : suggestion.driver.id
                  )
                }
                onSend={handleSendSuggestion}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
