"use client";

import { use, useEffect, useMemo, useState } from "react";
import { LoadingScreen } from "@/components/shared/Spinner";
import { useRouter } from "next/navigation";

import BackToMenuButton from "@/components/shared/BackToMenuButton";
import DetailTile from "@/components/dispatcher/shared/DetailTile";
import PriorityBadge from "@/components/dispatcher/shared/PriorityBadge";
import {
  type Driver,
  type Mission,
  getDrivers,
  getMission,
  getStoredUser,
  getToken,
} from "@/lib/api-client";
import { formatDateTime24 } from "@/lib/date-format";
import {
  formatIdealDeliveryTime,
  getMissionDeliveredAt,
} from "@/lib/mission-time";
import {
  getBadgeClasses,
  getDeliveryState,
  getStateLabel,
} from "@/components/dispatcher/live-map/map-utils";

type LiveMapDetailsPageProps = {
  params: Promise<{
    missionId: string;
  }>;
};

// Renders the live map delivery details page component.
export default function LiveMapDeliveryDetailsPage({
  params,
}: LiveMapDetailsPageProps) {
  const { missionId } = use(params);
  const router = useRouter();
  const [mission, setMission] = useState<Mission | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (!token || !user || user.role !== "dispatcher") {
      router.replace("/login?role=dispatcher");
    }
  }, [router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [missionData, driversData] = await Promise.all([
          getMission(missionId),
          getDrivers(),
        ]);

        setMission(missionData);
        setDrivers(driversData);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [missionId]);

  const driver = useMemo(() => {
    if (!mission) return null;

    return (
      drivers.find(
        (item) =>
          item.id === mission.assigned_driver_id ||
          item.current_mission_id === mission.id
      ) || null
    );
  }, [drivers, mission]);

  if (loading) {
    return (
      <LoadingScreen label="Loading delivery details..." />
    );
  }

  if (!mission) {
    return (
      <main className="min-h-screen bg-app p-6 text-main">
        <div className="mx-auto max-w-5xl">
          <BackToMenuButton href="/dispatcher/live-map" label="Back to map" />
          <p className="mt-6 text-muted">Delivery not found.</p>
        </div>
      </main>
    );
  }

  const state = getDeliveryState(mission);
  const deliveredAt = getMissionDeliveredAt(mission);

  return (
    <main className="min-h-screen bg-app px-3 py-4 text-main sm:p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <BackToMenuButton href="/dispatcher/live-map" label="Back to map" />

          <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-blue-400">
            Live Map Details
          </p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
            {mission.title}
          </h1>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold ${getBadgeClasses(
                state
              )}`}
            >
              {getStateLabel(state)}
            </span>
            <PriorityBadge priority={mission.priority} />
          </div>
        </header>

        <section className="rounded-xl border border-app bg-card p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailTile label="Driver">
              <p className="font-semibold text-main">
                {driver?.name || "No driver assigned"}
              </p>
              {driver && (
                <p className="mt-1 text-sm text-muted">
                  {driver.phone || "No phone"} - {driver.email || "No email"}
                </p>
              )}
            </DetailTile>

            <DetailTile label="Delivery Status">
              <p
                className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold ${getBadgeClasses(
                  state
                )}`}
              >
                {getStateLabel(state)}
              </p>
            </DetailTile>

            <DetailTile label="Published">
              <p className="font-semibold text-main">
                {formatDateTime24(mission.created_at)}
              </p>
            </DetailTile>

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

            <DetailTile label="Ideal Delivery Time">
              <p className="font-semibold text-main">
                {formatIdealDeliveryTime(mission.ideal_delivery_time)}
              </p>
            </DetailTile>

            <DetailTile label="Delivered At">
              <p className="font-semibold text-main">
                {deliveredAt ? formatDateTime24(deliveredAt) : "Not delivered"}
              </p>
            </DetailTile>

            <DetailTile label="Cargo" className="lg:col-span-2">
              <p className="font-semibold text-main">
                {mission.description || "No product description"}
              </p>
              <p className="mt-1 text-sm text-muted">
                {mission.cargo?.weight_kg ?? "?"} kg -{" "}
                {mission.cargo?.volume_liters ?? "?"} L
                {mission.cargo?.requires_cooling
                  ? " - Cooling required"
                  : ""}
              </p>
            </DetailTile>

            <DetailTile label="Mission ID">
              <p className="break-all font-mono text-sm text-muted">
                {mission.id}
              </p>
            </DetailTile>
          </div>
        </section>
      </div>
    </main>
  );
}
