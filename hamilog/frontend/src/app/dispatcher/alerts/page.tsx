"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BackToMenuButton from "@/components/shared/BackToMenuButton";

import {
  type Mission,
  type Driver,
  getMissions,
  getDrivers,
  getToken,
  getStoredUser,
} from "@/lib/api-client";

import AlertEntry, {
  type AlertLevel,
  type DispatcherAlert,
  getWaitingTime,
} from "@/components/dispatcher/alerts/AlertEntry";
import AlertPopup, { type PopupAlert } from "@/components/dispatcher/alerts/AlertPopup";
import DispatcherStatBox from "@/components/dispatcher/shared/DispatcherStatBox";
import {
  getSeenAlertPopupIds,
  saveSeenAlertPopupIds,
} from "@/lib/alert-popup-storage";
import { CAR_SPECS } from "@/lib/car-specs";
import { getLatestDriverCancellation } from "@/lib/mission-alerts";
import { isNotificationsDisabled, playAppSound } from "@/lib/sounds";

// Returns the level rank.
function getLevelRank(level: AlertLevel) {
  switch (level) {
    case "critical":
      return 0;
    case "warning":
      return 1;
    case "info":
      return 2;
    case "success":
      return 3;
  }
}

type AlertLevelFilter = AlertLevel | "all";
type RelatedAlertFilter = "all" | "mission" | "driver" | "cargo" | "system";

const alertLevelFilters: { id: AlertLevelFilter; label: string }[] = [
  { id: "all", label: "All levels" },
  { id: "critical", label: "Critical" },
  { id: "warning", label: "Warnings" },
  { id: "info", label: "Info" },
  { id: "success", label: "OK" },
];

const relatedAlertFilters: { id: RelatedAlertFilter; label: string }[] = [
  { id: "all", label: "All related alerts" },
  { id: "mission", label: "Missions" },
  { id: "driver", label: "Drivers" },
  { id: "cargo", label: "Cargo" },
  { id: "system", label: "System" },
];

// Returns the related alert filter.
function getRelatedAlertFilter(alert: DispatcherAlert): RelatedAlertFilter {
  if (alert.type.toLowerCase().includes("cooling")) return "cargo";
  if (alert.driver) return "driver";
  if (alert.mission) return "mission";
  return "system";
}

// Returns the compatible drivers.
function getCompatibleDrivers(mission: Mission, drivers: Driver[]) {
  return drivers.filter((driver) => {
    if (driver.status !== "available") return false;

    const spec = CAR_SPECS[driver.car_type];

    if (!spec || !mission.cargo) return true;

    const canCarryWeight =
      mission.cargo.weight_kg === undefined ||
      spec.max_weight >= mission.cargo.weight_kg;
    const canCarryVolume =
      mission.cargo.volume_liters === undefined ||
      spec.max_volume >= mission.cargo.volume_liters;
    const canCool = !mission.cargo.requires_cooling || Boolean(spec.cooling);

    return canCarryWeight && canCarryVolume && canCool;
  });
}

// Builds the alerts.
function buildAlerts(missions: Mission[], drivers: Driver[]) {
  const alerts: DispatcherAlert[] = [];

  missions.forEach((mission) => {
    const waitingMinutes = mission.created_at
      ? Math.floor((Date.now() - new Date(mission.created_at).getTime()) / 60000)
      : 0;
    const isUnassigned =
      mission.status === "available" && !mission.assigned_driver_id;

    if (isUnassigned && mission.priority === "critical") {
      alerts.push({
        id: `critical-unassigned-${mission.id}`,
        level: "critical",
        type: "Critical Unassigned Mission",
        title: "Critical mission has no driver",
        summary: `${mission.title} needs immediate assignment.`,
        createdAt: mission.created_at,
        mission,
      });
    } else if (isUnassigned) {
      alerts.push({
        id: `unassigned-${mission.id}`,
        level: "warning",
        type: "Unassigned Mission",
        title: "Mission waiting for driver",
        summary: `${mission.title} is still in the delivery pool.`,
        createdAt: mission.created_at,
        mission,
      });
    }

    if (mission.cargo?.requires_cooling && mission.status === "available") {
      alerts.push({
        id: `cooling-${mission.id}`,
        level: "info",
        type: "Cooling Required",
        title: "Cooling vehicle required",
        summary: `${mission.title} requires refrigerated transport.`,
        createdAt: mission.created_at,
        mission,
      });
    }

    if (isUnassigned && waitingMinutes >= 30) {
      alerts.push({
        id: `stale-${mission.id}`,
        level: "warning",
        type: "Stale Mission",
        title: "Mission waiting too long",
        summary: `${mission.title} has been waiting for ${getWaitingTime(
          mission.created_at
        )}.`,
        createdAt: mission.created_at,
        mission,
      });
    }

    if (isUnassigned && getCompatibleDrivers(mission, drivers).length === 0) {
      alerts.push({
        id: `no-compatible-driver-${mission.id}`,
        level: "critical",
        type: "No Compatible Driver",
        title: "No compatible driver found",
        summary: `${mission.title} has no available compatible driver.`,
        createdAt: mission.created_at,
        mission,
      });
    }

    const driverCancellation = getLatestDriverCancellation(mission);

    if (driverCancellation) {
      const driver = drivers.find(
        (item) => item.id === driverCancellation.actor_id
      );
      const reason = driverCancellation.reason
        ? ` Reason: ${driverCancellation.reason}`
        : "";

      alerts.push({
        id: `driver-cancelled-${mission.id}-${driverCancellation.cancelled_at}`,
        level: "warning",
        type: "Driver Cancelled Mission",
        title: "Driver cancelled a mission",
        summary: `${driver?.name || "A driver"} cancelled ${
          mission.title
        }.${reason}`,
        createdAt: driverCancellation.cancelled_at,
        mission,
        driver,
      });
    }
  });

  drivers.forEach((driver) => {
    if (driver.status === "blacklisted") {
      alerts.push({
        id: `blacklisted-driver-${driver.id}`,
        level: "critical",
        type: "Driver Blocked",
        title: "Driver is blocked",
        summary: `${driver.name} is marked as blacklisted.`,
        createdAt: new Date().toISOString(),
        driver,
      });
    }
  });

  if (alerts.length === 0) {
    alerts.push({
      id: "system-ok",
      level: "success",
      type: "System Status",
      title: "No active alerts",
      summary: "All dispatcher systems look normal.",
      createdAt: new Date().toISOString(),
    });
  }

  return alerts.sort((a, b) => {
    const levelDiff = getLevelRank(a.level) - getLevelRank(b.level);

    if (levelDiff !== 0) return levelDiff;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// Groups the alerts for popup.
function groupAlertsForPopup(alerts: DispatcherAlert[]): PopupAlert[] {
  const groups = new Map<string, DispatcherAlert[]>();

  alerts.forEach((alert) => {
    const current = groups.get(alert.type) ?? [];
    groups.set(alert.type, [...current, alert]);
  });

  return Array.from(groups.entries()).map(([type, group]) => ({
    id: group.map((alert) => alert.id).join("|"),
    title: group.length === 1 ? group[0].title : `${group.length} ${type} alerts`,
    summary: group[0].summary,
    summaries: group.map((alert) => `${alert.title}: ${alert.summary}`),
    type,
    level: group[0].level,
  }));
}

// Renders the alerts page component.
export default function AlertsPage() {
  const router = useRouter();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [levelFilter, setLevelFilter] = useState<AlertLevelFilter>("all");
  const [relatedFilter, setRelatedFilter] = useState<RelatedAlertFilter>("all");
  const seenAlertIds = useRef<Set<string>>(getSeenAlertPopupIds());
  const lastSoundAlertId = useRef<string | null>(null);
  const [queuedAlerts, setQueuedAlerts] = useState<PopupAlert[]>([]);
  const popupAlert = queuedAlerts[0] ?? null;
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

  const activeAlerts = useMemo(() => {
    return buildAlerts(missions, drivers).filter(
      (alert) => !dismissedIds.includes(alert.id)
    );
  }, [missions, drivers, dismissedIds]);

  const alerts = useMemo(() => {
    return activeAlerts.filter((alert) => {
      const levelMatches = levelFilter === "all" || alert.level === levelFilter;
      const relatedMatches =
        relatedFilter === "all" ||
        getRelatedAlertFilter(alert) === relatedFilter;

      return levelMatches && relatedMatches;
    });
  }, [activeAlerts, levelFilter, relatedFilter]);

  const stats = useMemo(() => {
    return {
      total: activeAlerts.length,
      critical: activeAlerts.filter((alert) => alert.level === "critical").length,
      warning: activeAlerts.filter((alert) => alert.level === "warning").length,
      info: activeAlerts.filter((alert) => alert.level === "info").length,
      success: activeAlerts.filter((alert) => alert.level === "success").length,
    };
  }, [activeAlerts]);

  useEffect(() => {
    if (isNotificationsDisabled()) return;

    const popupAlerts = groupAlertsForPopup(
      activeAlerts.filter((alert) => alert.level !== "success"),
    ).filter((alert) => !seenAlertIds.current.has(alert.id));

    if (popupAlerts.length === 0) return;

    popupAlerts.forEach((alert) => seenAlertIds.current.add(alert.id));
    saveSeenAlertPopupIds(seenAlertIds.current);
    setQueuedAlerts((current) => [...current, ...popupAlerts]);
  }, [activeAlerts]);

  useEffect(() => {
    if (isNotificationsDisabled()) return;
    if (!popupAlert || lastSoundAlertId.current === popupAlert.id) return;

    lastSoundAlertId.current = popupAlert.id;
    playAppSound("alert");
  }, [popupAlert]);

  // Handles the dismiss action.
  function handleDismiss(alertId: string) {
    setDismissedIds((current) => [...current, alertId]);
    setExpandedId(null);
  }

  // Handles the dismiss all action.
  function handleDismissAll() {
    setDismissedIds((current) => [
      ...new Set([...current, ...activeAlerts.map((alert) => alert.id)]),
    ]);
    setExpandedId(null);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app text-main">
        Loading alerts...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app p-6 text-main">
      {popupAlert && (
        <AlertPopup
          alert={popupAlert}
          onOk={() => setQueuedAlerts((current) => current.slice(1))}
        />
      )}

      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4">
              <BackToMenuButton href="/dispatcher/menu" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-400">
              Operations Monitoring
            </p>
            <h1 className="mt-1 text-3xl font-black">Alerts</h1>
            <p className="mt-2 text-muted">
              Review urgent mission, driver, cargo, and system alerts.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDismissAll}
            disabled={activeAlerts.length === 0}
            className="rounded-xl border border-app bg-card-soft px-5 py-3 text-sm font-black text-main transition hover:bg-card-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            Dismiss All
          </button>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <DispatcherStatBox
            title="Alerts"
            value={stats.total}
            subtitle="Active alerts"
          />
          <DispatcherStatBox
            title="Critical"
            value={stats.critical}
            subtitle="Needs immediate action"
          />
          <DispatcherStatBox
            title="Warnings"
            value={stats.warning}
            subtitle="Needs attention"
          />
          <DispatcherStatBox
            title="Info"
            value={stats.info}
            subtitle="Important notes"
          />
          <DispatcherStatBox
            title="OK"
            value={stats.success}
            subtitle="Normal status"
          />
        </section>

        <section className="rounded-2xl border border-app bg-card shadow-xl">
          <div className="border-b border-app px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-bold">Alert Entries</h2>
                <p className="mt-1 text-sm text-muted">
                  Click an alert to expand full details.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">
                    Severity
                  </span>
                  <select
                    value={levelFilter}
                    onChange={(event) =>
                      setLevelFilter(event.target.value as AlertLevelFilter)
                    }
                    className="mt-1 w-full rounded-xl border border-app bg-input px-3 py-2 text-sm text-main outline-none focus:border-blue-500"
                  >
                    {alertLevelFilters.map((filter) => (
                      <option key={filter.id} value={filter.id}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">
                    Related to
                  </span>
                  <select
                    value={relatedFilter}
                    onChange={(event) =>
                      setRelatedFilter(event.target.value as RelatedAlertFilter)
                    }
                    className="mt-1 w-full rounded-xl border border-app bg-input px-3 py-2 text-sm text-main outline-none focus:border-blue-500"
                  >
                    {relatedAlertFilters.map((filter) => (
                      <option key={filter.id} value={filter.id}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <p className="mt-3 text-sm text-muted">
              Showing {alerts.length} of {activeAlerts.length} active alerts.
            </p>
          </div>

          <div className="divide-y" style={{ '--tw-divide-opacity': '1', borderColor: 'var(--border-app)' } as React.CSSProperties}>
            {alerts.length === 0 && (
              <div className="p-8 text-center text-muted">
                No active alerts.
              </div>
            )}

            {alerts.map((alert) => {
              const isExpanded = expandedId === alert.id;

              return (
                <AlertEntry
                  key={alert.id}
                  alert={alert}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedId(isExpanded ? null : alert.id)}
                  onDismiss={handleDismiss}
                />
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
