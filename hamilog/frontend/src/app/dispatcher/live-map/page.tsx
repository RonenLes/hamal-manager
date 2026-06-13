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
} from "@/lib/api-client";

import PriorityBadge from "@/components/dispatcher/PriorityBadge";

type DeliveryMapState =
  | "active"
  | "assigned"
  | "unassigned"
  | "delivered"
  | "cancelled";

type MapPoint = {
  id: string;
  x: number;
  y: number;
  mission: Mission;
  driver?: Driver;
  state: DeliveryMapState;
};

const FALLBACK_POINTS = [
  { x: 180, y: 120 },
  { x: 330, y: 170 },
  { x: 520, y: 130 },
  { x: 250, y: 280 },
  { x: 480, y: 300 },
  { x: 610, y: 220 },
  { x: 140, y: 340 },
];

function getDeliveryState(mission: Mission): DeliveryMapState {
  if (mission.status === "in_transit") return "active";
  if (mission.status === "assigned") return "assigned";
  if (mission.status === "delivered") return "delivered";
  if (mission.status === "cancelled") return "cancelled";

  return "unassigned";
}

function getStateLabel(state: DeliveryMapState) {
  switch (state) {
    case "active":
      return "Active";
    case "assigned":
      return "Assigned";
    case "unassigned":
      return "Not Assigned";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
  }
}

function getPointColor(state: DeliveryMapState) {
  switch (state) {
    case "active":
      return "#22c55e"; // green
    case "assigned":
      return "#3b82f6"; // blue
    case "unassigned":
      return "#f97316"; // orange
    case "delivered":
      return "#94a3b8"; // slate
    case "cancelled":
      return "#ef4444"; // red
  }
}

function getBadgeClasses(state: DeliveryMapState) {
  switch (state) {
    case "active":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "assigned":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "unassigned":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
    case "delivered":
      return "border-slate-500/30 bg-slate-500/10 text-muted";
    case "cancelled":
      return "border-red-500/30 bg-red-500/10 text-red-300";
  }
}

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

function locationToSvgPoint(
  location: Mission["pickup"],
  fallbackIndex: number
) {
  const fallback = FALLBACK_POINTS[fallbackIndex % FALLBACK_POINTS.length];

  if (!location?.lat || !location?.lng) {
    return fallback;
  }

  const x = 80 + ((location.lng + 180) / 360) * 540;
  const y = 60 + ((90 - location.lat) / 180) * 300;

  return {
    x: Math.max(60, Math.min(640, x)),
    y: Math.max(60, Math.min(360, y)),
  };
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

export default function LiveDeliveryMapPage() {
  const router = useRouter();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(
    null
  );
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
      const [missionsData, driversData] = await Promise.all([
        getMissions(),
        getDrivers(),
      ]);

      setMissions(missionsData);
      setDrivers(driversData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const mapPoints = useMemo<MapPoint[]>(() => {
    return missions.map((mission, index) => {
      const point = locationToSvgPoint(mission.pickup, index);

      const driver = drivers.find(
        (item) =>
          item.id === mission.assigned_driver_id ||
          item.current_mission_id === mission.id
      );

      return {
        id: mission.id,
        x: point.x,
        y: point.y,
        mission,
        driver,
        state: getDeliveryState(mission),
      };
    });
  }, [missions, drivers]);

  const selectedPoint = useMemo(() => {
    if (!selectedMissionId) return null;

    return mapPoints.find((point) => point.id === selectedMissionId) || null;
  }, [selectedMissionId, mapPoints]);

  const stats = useMemo(() => {
    return {
      total: mapPoints.length,
      active: mapPoints.filter((point) => point.state === "active").length,
      assigned: mapPoints.filter((point) => point.state === "assigned").length,
      unassigned: mapPoints.filter((point) => point.state === "unassigned")
        .length,
      delivered: mapPoints.filter((point) => point.state === "delivered")
        .length,
    };
  }, [mapPoints]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app text-main">
        Loading live map...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            Live Operations
          </p>

          <h1 className="mt-1 text-3xl font-black">Live Delivery Map</h1>

          <p className="mt-2 text-muted">
            View deliveries to make on the map. Active deliveries are marked in
            green.
          </p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatBox title="Deliveries" value={stats.total} subtitle="All shown" />

          <StatBox
            title="Active"
            value={stats.active}
            subtitle="Green points"
          />

          <StatBox
            title="Assigned"
            value={stats.assigned}
            subtitle="Waiting to start"
          />

          <StatBox
            title="Unassigned"
            value={stats.unassigned}
            subtitle="Needs driver"
          />

          <StatBox
            title="Delivered"
            value={stats.delivered}
            subtitle="Completed"
          />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-app bg-card shadow-xl">
            <div className="border-b border-app px-5 py-4">
              <h2 className="text-xl font-bold">Map</h2>
              <p className="mt-1 text-sm text-muted">
                Click a point to view the delivery details.
              </p>
            </div>

            <div className="p-5">
              <div className="overflow-hidden rounded-2xl border border-app bg-app">
                <svg
                  viewBox="0 0 700 420"
                  className="h-[520px] w-full"
                  role="img"
                  aria-label="Live delivery map"
                >
                  <rect width="700" height="420" fill="#020617" />

                  {Array.from({ length: 15 }).map((_, index) => (
                    <line
                      key={`vertical-${index}`}
                      x1={index * 50}
                      y1={0}
                      x2={index * 50}
                      y2={420}
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="1"
                    />
                  ))}

                  {Array.from({ length: 9 }).map((_, index) => (
                    <line
                      key={`horizontal-${index}`}
                      x1={0}
                      y1={index * 50}
                      x2={700}
                      y2={index * 50}
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="1"
                    />
                  ))}

                  <path
                    d="M90,220 Q180,90 350,120 T610,210 Q650,320 500,350 T130,320 Z"
                    fill="rgba(59,130,246,0.03)"
                    stroke="rgba(59,130,246,0.18)"
                    strokeWidth="2"
                    strokeDasharray="7 5"
                  />

                  <path
                    d="M60,210 L640,210"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />

                  <path
                    d="M350,60 L350,370"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />

                  <path
                    d="M140,100 L570,330"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  <path
                    d="M130,340 L580,100"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {mapPoints.map((point) => {
                    const color = getPointColor(point.state);
                    const isSelected = selectedMissionId === point.id;

                    return (
                      <g
                        key={point.id}
                        onClick={() => setSelectedMissionId(point.id)}
                        className="cursor-pointer"
                      >
                        {point.state === "active" && (
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="18"
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                            opacity="0.5"
                          >
                            <animate
                              attributeName="r"
                              from="12"
                              to="28"
                              dur="1.8s"
                              repeatCount="indefinite"
                            />

                            <animate
                              attributeName="opacity"
                              from="0.6"
                              to="0"
                              dur="1.8s"
                              repeatCount="indefinite"
                            />
                          </circle>
                        )}

                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={isSelected ? 11 : 8}
                          fill={color}
                          stroke={isSelected ? "#ffffff" : "#020617"}
                          strokeWidth="3"
                        />

                        <text
                          x={point.x}
                          y={point.y - 16}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.75)"
                          fontSize="10"
                          fontWeight="700"
                        >
                          {point.mission.title.slice(0, 14)}
                        </text>
                      </g>
                    );
                  })}

                  <g transform="translate(22, 382)">
                    <circle cx="0" cy="0" r="5" fill="#22c55e" />
                    <text x="12" y="4" fill="rgba(255,255,255,0.55)" fontSize="10">
                      Active
                    </text>

                    <circle cx="80" cy="0" r="5" fill="#3b82f6" />
                    <text x="92" y="4" fill="rgba(255,255,255,0.55)" fontSize="10">
                      Assigned
                    </text>

                    <circle cx="172" cy="0" r="5" fill="#f97316" />
                    <text x="184" y="4" fill="rgba(255,255,255,0.55)" fontSize="10">
                      Unassigned
                    </text>

                    <circle cx="280" cy="0" r="5" fill="#94a3b8" />
                    <text x="292" y="4" fill="rgba(255,255,255,0.55)" fontSize="10">
                      Delivered
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          </div>

          <aside className="rounded-2xl border border-app bg-card shadow-xl">
            <div className="border-b border-app px-5 py-4">
              <h2 className="text-xl font-bold">Delivery Details</h2>
              <p className="mt-1 text-sm text-muted">
                Selected map point information.
              </p>
            </div>

            {!selectedPoint && (
              <div className="p-6 text-muted">
                Select a delivery point on the map.
              </div>
            )}

            {selectedPoint && (
              <div className="space-y-4 p-5">
                <div>
                  <h3 className="text-2xl font-black text-main">
                    {selectedPoint.mission.title}
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${getBadgeClasses(
                        selectedPoint.state
                      )}`}
                    >
                      {getStateLabel(selectedPoint.state)}
                    </span>

                    <PriorityBadge priority={selectedPoint.mission.priority} />
                  </div>
                </div>

                <div className="rounded-xl border border-app bg-app/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-soft">
                    Driver
                  </p>

                  <p className="mt-2 font-semibold text-main">
                    {selectedPoint.driver?.name || "No driver assigned"}
                  </p>
                </div>

                <div className="rounded-xl border border-app bg-app/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-soft">
                    From
                  </p>

                  <p className="mt-2 font-semibold text-main">
                    {selectedPoint.mission.pickup?.address ||
                      "Pickup location TBD"}
                  </p>
                </div>

                <div className="rounded-xl border border-app bg-app/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-soft">
                    To
                  </p>

                  <p className="mt-2 font-semibold text-main">
                    {selectedPoint.mission.dropoff?.address ||
                      "Dropoff location TBD"}
                  </p>
                </div>

                <div className="rounded-xl border border-app bg-app/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-soft">
                    Cargo
                  </p>

                  <p className="mt-2 font-semibold text-main">
                    {selectedPoint.mission.description ||
                      "No product description"}
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    {selectedPoint.mission.cargo?.weight_kg ?? "?"} kg ·{" "}
                    {selectedPoint.mission.cargo?.volume_liters ?? "?"} L
                    {selectedPoint.mission.cargo?.requires_cooling
                      ? " · Cooling required"
                      : ""}
                  </p>
                </div>

                <div className="rounded-xl border border-app bg-app/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-soft">
                    Published
                  </p>

                  <p className="mt-2 font-semibold text-main">
                    {formatDateTime(selectedPoint.mission.created_at)}
                  </p>
                </div>

                <div className="rounded-xl border border-app bg-app/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-soft">
                    Mission ID
                  </p>

                  <p className="mt-2 font-mono text-sm text-muted">
                    {selectedPoint.mission.id}
                  </p>
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}