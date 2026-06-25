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
import { playAppSound } from "@/lib/sounds";

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
  });

  drivers.forEach((driver) => {
    if (driver.status === "offline") {
      alerts.push({
        id: `offline-driver-${driver.id}`,
        level: "warning",
        type: "Driver Offline",
        title: "Driver is offline",
        summary: `${driver.name} is currently unavailable.`,
        createdAt: new Date().toISOString(),
        driver,
      });
    }

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

export default function AlertsPage() {
  const router = useRouter();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
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

  const alerts = useMemo(() => {
    return buildAlerts(missions, drivers).filter(
      (alert) => !dismissedIds.includes(alert.id)
    );
  }, [missions, drivers, dismissedIds]);

  const stats = useMemo(() => {
    return {
      total: alerts.length,
      critical: alerts.filter((alert) => alert.level === "critical").length,
      warning: alerts.filter((alert) => alert.level === "warning").length,
      info: alerts.filter((alert) => alert.level === "info").length,
      success: alerts.filter((alert) => alert.level === "success").length,
    };
  }, [alerts]);

  useEffect(() => {
    const popupAlerts = groupAlertsForPopup(
      alerts.filter((alert) => alert.level !== "success"),
    ).filter((alert) => !seenAlertIds.current.has(alert.id));

    if (popupAlerts.length === 0) return;

    popupAlerts.forEach((alert) => seenAlertIds.current.add(alert.id));
    saveSeenAlertPopupIds(seenAlertIds.current);
    setQueuedAlerts((current) => [...current, ...popupAlerts]);
  }, [alerts]);

  useEffect(() => {
    if (!popupAlert || lastSoundAlertId.current === popupAlert.id) return;

    lastSoundAlertId.current = popupAlert.id;
    playAppSound("alert");
  }, [popupAlert]);

  function handleDismiss(alertId: string) {
    setDismissedIds((current) => [...current, alertId]);
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
        <header className="mb-6">
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
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
            <h2 className="text-xl font-bold">Alert Entries</h2>
            <p className="mt-1 text-sm text-muted">
              Click an alert to expand full details.
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
