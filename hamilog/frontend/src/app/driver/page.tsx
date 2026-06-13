"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  type Mission,
  type MissionPriority,
  type StoredUser,
  getMissions,
  updateMissionStatus,
  clearToken,
  getToken,
  getStoredUser,
} from "@/lib/api-client";
import { GPSWebSocket } from "@/lib/websocket-client";

// =============================================================================
// TYPES
// =============================================================================

type Tab = "my-missions" | "open-tasks" | "profile";

const PRIORITY_COLORS: Record<MissionPriority, string> = {
  critical: "var(--accent-rose)",
  high: "var(--accent-amber)",
  medium: "var(--accent-blue)",
  low: "var(--text-secondary)",
};

// =============================================================================
// SMALL COMPONENTS
// =============================================================================

function PriorityBadge({ priority }: { priority: MissionPriority }) {
  const cls =
    priority === "critical"
      ? "badge-critical"
      : priority === "high"
        ? "badge-high"
        : priority === "medium"
          ? "badge-medium"
          : "badge-low";
  return <span className={`badge ${cls}`}>{priority}</span>;
}

function StatusProgress({ status }: { status: string }) {
  const steps = ["assigned", "in_transit", "delivered"];
  const currentIdx = steps.indexOf(status);

  return (
    <div className="flex items-center gap-1 w-full" id="status-progress">
      {steps.map((step, i) => {
        const isCompleted = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCurrent ? "animate-pulse-glow" : ""
                }`}
                style={{
                  background: isCompleted ? "var(--gradient-blue)" : "rgba(255,255,255,0.06)",
                  color: isCompleted ? "#fff" : "var(--text-secondary)",
                  border: isCompleted ? "none" : "1px solid var(--border-subtle)",
                }}
              >
                {isCompleted ? "✓" : i + 1}
              </div>
              <span
                className="text-[10px] mt-1 capitalize"
                style={{ color: isCompleted ? "var(--text-primary)" : "var(--text-secondary)" }}
              >
                {step.replace("_", " ")}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="h-0.5 flex-1 rounded-full mx-1 -mt-4"
                style={{
                  background: i < currentIdx ? "var(--accent-blue)" : "rgba(255,255,255,0.08)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-panel p-5 space-y-3">
      <div className="skeleton h-5 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-8 w-1/3 mt-2" />
    </div>
  );
}

function MatchScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80
      ? "var(--accent-emerald)"
      : pct >= 50
        ? "var(--accent-amber)"
        : "var(--accent-rose)";

  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
        Match
      </span>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

// =============================================================================
// MISSION DETAIL BOTTOM SHEET
// =============================================================================

function MissionDetailSheet({
  mission,
  onClose,
  onAccept,
  accepting,
}: {
  mission: Mission;
  onClose: () => void;
  onAccept: (id: string) => void;
  accepting: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
        id="sheet-backdrop"
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 glass-card rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up"
        style={{ borderBottom: "none", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        id="mission-detail-sheet"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        <div className="px-6 pb-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2
                className="font-[family-name:var(--font-outfit)] text-xl font-bold mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                {mission.title}
              </h2>
              <PriorityBadge priority={mission.priority} />
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm cursor-pointer bg-transparent border-none"
              style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)" }}
              id="sheet-close-btn"
            >
              ✕
            </button>
          </div>

          {/* Description */}
          <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
            {mission.description}
          </p>

          {/* Match score */}
          {mission.match_score != null && (
            <div className="glass-panel p-3 mb-5">
              <MatchScoreBar score={mission.match_score} />
            </div>
          )}

          {/* Cargo details */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="glass-panel p-3 text-center">
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Weight</div>
              <div className="text-lg font-bold" style={{ color: "var(--accent-blue)" }}>
                {mission.cargo?.weight_kg || "–"}<span className="text-xs font-normal ml-0.5">kg</span>
              </div>
            </div>
            <div className="glass-panel p-3 text-center">
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Volume</div>
              <div className="text-lg font-bold" style={{ color: "var(--accent-cyan)" }}>
                {mission.cargo?.volume_liters || "–"}<span className="text-xs font-normal ml-0.5">L</span>
              </div>
            </div>
            {mission.cargo?.requires_cooling && (
              <div className="glass-panel p-3 text-center col-span-2">
                <div className="text-sm font-semibold" style={{ color: "var(--accent-cyan)" }}>
                  ❄️ Requires Cooling
                </div>
              </div>
            )}
          </div>

          {/* Pickup / Dropoff */}
          <div className="space-y-3 mb-5">
            <div className="glass-panel p-4">
              <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--accent-emerald)" }}>
                📍 Pickup
              </div>
              <div className="text-sm" style={{ color: "var(--text-primary)" }}>
                {mission.pickup?.address || "Address TBD"}
              </div>
            </div>
            <div className="glass-panel p-4">
              <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--accent-rose)" }}>
                📍 Dropoff
              </div>
              <div className="text-sm" style={{ color: "var(--text-primary)" }}>
                {mission.dropoff?.address || "Address TBD"}
              </div>
            </div>
          </div>

          {/* Map preview (SVG) */}
          <div className="glass-panel p-3 mb-6 rounded-xl overflow-hidden" style={{ background: "#080c16" }}>
            <svg viewBox="0 0 300 120" className="w-full">
              <line x1="0" y1="60" x2="300" y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="150" y1="0" x2="150" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              {/* Pickup marker */}
              <circle cx="80" cy="50" r="6" fill="#10b981" stroke="#0a0e1a" strokeWidth="2" />
              <text x="80" y="75" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8">
                Pickup
              </text>
              {/* Route */}
              <path d="M86,50 Q150,20 214,70" fill="none" stroke="var(--accent-blue)" strokeWidth="1.5" strokeDasharray="4 3" />
              {/* Dropoff marker */}
              <circle cx="220" cy="70" r="6" fill="#f43f5e" stroke="#0a0e1a" strokeWidth="2" />
              <text x="220" y="95" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8">
                Dropoff
              </text>
            </svg>
          </div>

          {/* Accept button */}
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="w-full py-4 rounded-2xl text-base font-bold cursor-pointer border-none transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "var(--gradient-blue)",
                color: "#fff",
                boxShadow: "0 8px 30px -5px rgba(59,130,246,0.4)",
              }}
              id="accept-mission-btn"
            >
              ACCEPT MISSION
            </button>
          ) : (
            <div className="space-y-2" style={{ animation: "fade-up 0.3s ease-out forwards" }}>
              <p className="text-center text-sm" style={{ color: "var(--accent-amber)" }}>
                Are you sure you want to accept this mission?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirming(false)}
                  className="btn-secondary flex-1 py-3"
                  id="confirm-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onAccept(mission.id)}
                  disabled={accepting}
                  className="btn-primary flex-1 py-3"
                  id="confirm-accept-btn"
                >
                  {accepting ? "Accepting…" : "Confirm"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// =============================================================================
// MY MISSIONS TAB
// =============================================================================

function MyMissionsTab({
  missions,
  onMarkDelivered,
  onUpdateStatus,
}: {
  missions: Mission[];
  onMarkDelivered: (id: string) => void;
  onUpdateStatus: (id: string, status: "in_transit") => void;
}) {
  const activeMission = useMemo(
    () => missions.find((m) => m.status === "assigned" || m.status === "in_transit"),
    [missions],
  );

  const completedMissions = useMemo(() => missions.filter((m) => m.status === "delivered"), [missions]);

  if (!activeMission && completedMissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4 animate-float">📦</div>
        <h3
          className="font-[family-name:var(--font-outfit)] text-lg font-bold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          No Active Missions
        </h3>
        <p className="text-sm max-w-xs" style={{ color: "var(--text-secondary)" }}>
          Check the Open Tasks tab to find available missions in your area.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Active mission card */}
      {activeMission && (
        <div
          className="glass-card p-5"
          style={{
            borderColor: `${PRIORITY_COLORS[activeMission.priority]}33`,
            animation: "fade-up 0.5s ease-out forwards",
          }}
          id="active-mission-card"
        >
          <div className="flex items-center justify-between mb-3">
            <h3
              className="font-[family-name:var(--font-outfit)] text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {activeMission.title}
            </h3>
            <PriorityBadge priority={activeMission.priority} />
          </div>

          {/* Status progress */}
          <div className="mb-5">
            <StatusProgress status={activeMission.status} />
          </div>

          {/* Addresses */}
          <div className="space-y-3 mb-4">
            <div className="glass-panel p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ background: "var(--accent-emerald)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent-emerald)" }}>
                  Pickup
                </span>
              </div>
              <div className="text-sm" style={{ color: "var(--text-primary)" }}>
                {activeMission.pickup?.address || "TBD"}
              </div>
            </div>
            <div className="glass-panel p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ background: "var(--accent-rose)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent-rose)" }}>
                  Dropoff
                </span>
              </div>
              <div className="text-sm" style={{ color: "var(--text-primary)" }}>
                {activeMission.dropoff?.address || "TBD"}
              </div>
            </div>
          </div>

          {/* Cargo info */}
          <div className="flex gap-3 mb-5">
            <div className="glass-panel px-3 py-2 text-center flex-1">
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Weight</div>
              <div className="text-sm font-bold" style={{ color: "var(--accent-blue)" }}>
                {activeMission.cargo?.weight_kg || "–"}kg
              </div>
            </div>
            <div className="glass-panel px-3 py-2 text-center flex-1">
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Volume</div>
              <div className="text-sm font-bold" style={{ color: "var(--accent-cyan)" }}>
                {activeMission.cargo?.volume_liters || "–"}L
              </div>
            </div>
            {activeMission.cargo?.requires_cooling && (
              <div className="glass-panel px-3 py-2 text-center flex-1">
                <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Temp</div>
                <div className="text-sm font-bold" style={{ color: "var(--accent-cyan)" }}>❄️</div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {/* Navigate with Waze — HTTPS format */}
            <a
              href={`https://waze.com/ul?ll=${activeMission.dropoff?.lat || 32.08},${activeMission.dropoff?.lng || 34.78}&navigate=yes`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex-1 text-center text-sm no-underline flex items-center justify-center gap-2"
              id="waze-navigate-btn"
            >
              🗺️ Waze
            </a>

            {activeMission.status === "assigned" && (
              <button
                onClick={() => onUpdateStatus(activeMission.id, "in_transit")}
                className="btn-primary flex-1 text-sm"
                id="start-transit-btn"
              >
                Start Delivery
              </button>
            )}

            {activeMission.status === "in_transit" && (
              <button
                onClick={() => onMarkDelivered(activeMission.id)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer border-none"
                style={{
                  background: "var(--gradient-cool)",
                  color: "#fff",
                }}
                id="mark-delivered-btn"
              >
                ✓ Mark Delivered
              </button>
            )}
          </div>
        </div>
      )}

      {/* Completed list */}
      {completedMissions.length > 0 && (
        <div>
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Completed ({completedMissions.length})
          </h3>
          <div className="space-y-2">
            {completedMissions.map((m) => (
              <div key={m.id} className="glass-panel p-3 flex items-center justify-between" id={`completed-${m.id}`}>
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {m.title}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {m.cargo?.weight_kg}kg · {m.cargo?.volume_liters}L
                  </div>
                </div>
                <span className="text-xs" style={{ color: "var(--accent-emerald)" }}>✓ Delivered</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// OPEN TASKS TAB
// =============================================================================

function OpenTasksTab({
  missions,
  loading,
  onSelectMission,
}: {
  missions: Mission[];
  loading: boolean;
  onSelectMission: (m: Mission) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3 pb-24">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="font-[family-name:var(--font-outfit)] text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          All Clear!
        </h3>
        <p className="text-sm max-w-xs" style={{ color: "var(--text-secondary)" }}>
          No open missions right now. Pull down to refresh.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-24">
      {/* Pull-to-refresh hint */}
      <div className="text-center py-1">
        <span className="text-xs" style={{ color: "var(--text-secondary)", opacity: 0.5 }}>
          ↓ Pull to refresh
        </span>
      </div>

      {missions.map((m, i) => (
        <div
          key={m.id}
          className="glass-card p-5 cursor-pointer"
          style={{ animation: `fade-up 0.4s ease-out ${i * 0.08}s both` }}
          onClick={() => onSelectMission(m)}
          id={`open-task-${m.id}`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
              {m.title}
            </h3>
            <PriorityBadge priority={m.priority} />
          </div>

          <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
            {m.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <span className="glass-panel px-2 py-1 text-xs" style={{ color: "var(--accent-blue)" }}>
                {m.cargo?.weight_kg || "–"}kg
              </span>
              <span className="glass-panel px-2 py-1 text-xs" style={{ color: "var(--accent-cyan)" }}>
                {m.cargo?.volume_liters || "–"}L
              </span>
              {m.cargo?.requires_cooling && (
                <span className="glass-panel px-2 py-1 text-xs" style={{ color: "var(--accent-cyan)" }}>
                  ❄️
                </span>
              )}
            </div>
          </div>

          {/* Match score bar */}
          {m.match_score != null && <MatchScoreBar score={m.match_score} />}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// PROFILE TAB
// =============================================================================

function ProfileTab() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    if (u) setUser(u);
  }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    router.push("/");
  }, [router]);

  return (
    <div className="space-y-4 pb-24" style={{ animation: "fade-up 0.5s ease-out forwards" }}>
      {/* Profile card */}
      <div className="glass-card p-6 text-center">
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
          style={{ background: "rgba(59,130,246,0.15)" }}
        >
          👤
        </div>
        <h2
          className="font-[family-name:var(--font-outfit)] text-xl font-bold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          {user?.username || "Driver"}
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          @{user?.username || "unknown"}
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="badge badge-medium">
            {user?.role || "driver"}
          </span>
          {user?.car_type && (
            <span className="badge badge-low">
              🚗 {user.car_type.replace("_", " ")}
            </span>
          )}
        </div>
        {user?.driver_id && (
          <p className="text-xs mt-3" style={{ color: "var(--text-secondary)", opacity: 0.6 }}>
            Driver ID: {user.driver_id}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={handleLogout}
          className="btn-danger w-full"
          id="profile-logout-btn"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN DRIVER PAGE
// =============================================================================

export default function DriverPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("my-missions");
  const [myMissions, setMyMissions] = useState<Mission[]>([]);
  const [openMissions, setOpenMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [accepting, setAccepting] = useState(false);

  const wsRef = useRef<GPSWebSocket | null>(null);
  const userRef = useRef<StoredUser | null>(getStoredUser());

  // Auth guard
  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();
    if (!token || !user || user.role !== "driver") {
      router.replace("/login?role=driver");
      return;
    }
    userRef.current = user;
  }, [router]);

  // Data fetching — uses server-filtered endpoints
  const fetchData = useCallback(async () => {
    const user = userRef.current;
    if (!user) return;
    try {
      const [myData, openData] = await Promise.all([
        getMissions({ driverUid: user.driver_id }),
        getMissions({ status: "available" }),
      ]);
      // Client-side safety filter for my missions
      setMyMissions(myData.filter((m) => m.assigned_driver_id === user.driver_id));
      // Client-side safety filter for open tasks
      setOpenMissions(openData.filter((m) => m.status === "available"));
      setLoading(false);
    } catch {
      setMyMissions([]);
      setOpenMissions([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // GPS WebSocket — driver_id is embedded in the URL path
  useEffect(() => {
    const user = userRef.current;
    if (!user?.driver_id) return;

    const wsUrl = `ws://localhost:8000/ws/gps/${user.driver_id}`;
    const ws = new GPSWebSocket(
      wsUrl,
      (data) => console.log("[Driver WS]", data),
      (err) => console.error("[Driver WS Error]", err),
    );
    wsRef.current = ws;
    ws.connect();

    // Mock GPS stream — payload is {lat, lng, timestamp} only
    const gpsInterval = setInterval(() => {
      if (ws.isConnected) {
        ws.send({
          lat: 32.08 + (Math.random() - 0.5) * 0.02,
          lng: 34.78 + (Math.random() - 0.5) * 0.02,
          timestamp: new Date().toISOString(),
        });
      }
    }, 5000);

    return () => {
      clearInterval(gpsInterval);
      ws.disconnect();
    };
  }, []);

  // Handlers
  const handleAcceptMission = useCallback(
    async (missionId: string) => {
      const user = userRef.current;
      if (!user?.driver_id) return;
      setAccepting(true);
      try {
        await updateMissionStatus(missionId, "assigned", user.driver_id);
        setSelectedMission(null);
        await fetchData();
        setActiveTab("my-missions");
      } catch (err) {
        console.error("Failed to accept mission", err);
      } finally {
        setAccepting(false);
      }
    },
    [fetchData],
  );

  const handleMarkDelivered = useCallback(
    async (missionId: string) => {
      try {
        await updateMissionStatus(missionId, "delivered");
        await fetchData();
      } catch (err) {
        console.error("Failed to mark delivered", err);
      }
    },
    [fetchData],
  );

  const handleStartTransit = useCallback(
    async (missionId: string, status: "in_transit") => {
      try {
        await updateMissionStatus(missionId, status);
        await fetchData();
      } catch (err) {
        console.error("Failed to update status", err);
      }
    },
    [fetchData],
  );

  // Tab icons
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = useMemo(
    () => [
      {
        id: "my-missions",
        label: "My Missions",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 14l2 2 4-4" />
          </svg>
        ),
      },
      {
        id: "open-tasks",
        label: "Open Tasks",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        ),
      },
      {
        id: "profile",
        label: "Profile",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ),
      },
    ],
    [],
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <header className="glass-panel px-5 py-3 mx-3 mt-3 rounded-xl flex items-center justify-between" id="driver-header">
        <h1
          className="font-[family-name:var(--font-outfit)] text-base font-bold"
          style={{
            background: "var(--gradient-blue)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
          id="driver-title"
        >
          HAMILOG
        </h1>
        <div className="flex items-center gap-2">
          <span className="status-dot status-dot-active" />
          <span className="text-xs" style={{ color: "var(--accent-emerald)" }}>
            Online
          </span>
        </div>
      </header>

      {/* Tab content */}
      <main className="flex-1 overflow-y-auto px-3 pt-4">
        {activeTab === "my-missions" && (
          <MyMissionsTab
            missions={myMissions}
            onMarkDelivered={handleMarkDelivered}
            onUpdateStatus={handleStartTransit}
          />
        )}
        {activeTab === "open-tasks" && (
          <OpenTasksTab
            missions={openMissions}
            loading={loading}
            onSelectMission={setSelectedMission}
          />
        )}
        {activeTab === "profile" && <ProfileTab />}
      </main>

      {/* Bottom tab bar */}
      <nav
        className="glass-panel mx-3 mb-3 rounded-2xl flex items-center justify-around py-2"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
        id="bottom-tab-bar"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all cursor-pointer bg-transparent border-none"
              style={{
                color: isActive ? "var(--accent-blue)" : "var(--text-secondary)",
                background: isActive ? "rgba(59,130,246,0.08)" : "transparent",
              }}
              id={`tab-${tab.id}`}
            >
              {tab.icon}
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mission detail sheet */}
      {selectedMission && (
        <MissionDetailSheet
          mission={selectedMission}
          onClose={() => setSelectedMission(null)}
          onAccept={handleAcceptMission}
          accepting={accepting}
        />
      )}
    </div>
  );
}
