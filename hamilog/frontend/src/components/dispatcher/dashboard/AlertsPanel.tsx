"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Mission, Driver } from "@/lib/api-client";
import AlertPopup, { type PopupAlert } from "@/components/dispatcher/alerts/AlertPopup";
import {
  getSeenAlertPopupIds,
  saveSeenAlertPopupIds,
} from "@/lib/alert-popup-storage";
import { playAppSound } from "@/lib/sounds";
import DashboardPanel from "./DashboardPanel";

type AlertsPanelProps = {
  missions: Mission[];
  drivers: Driver[];
};

type DashboardAlert = {
  id: string;
  type: "warning" | "danger" | "info";
  title: string;
  summary: string;
};

function groupAlertsForPopup(alerts: DashboardAlert[]): PopupAlert[] {
  const groups = new Map<DashboardAlert["type"], DashboardAlert[]>();

  alerts.forEach((alert) => {
    const current = groups.get(alert.type) ?? [];
    groups.set(alert.type, [...current, alert]);
  });

  return Array.from(groups.entries()).map(([type, group]) => {
    const level: PopupAlert["level"] = type === "danger" ? "critical" : type;
    const label =
      type === "danger" ? "Critical Alert" : type === "warning" ? "Warning" : "Info";

    return {
      id: group.map((alert) => alert.id).join("|"),
      type: label,
      level,
      title:
        group.length === 1
          ? group[0].title
          : `${group.length} ${label.toLowerCase()} alerts`,
      summary: group[0].summary,
      summaries: group.map((alert) => `${alert.title}: ${alert.summary}`),
    };
  });
}

export default function AlertsPanel({ missions, drivers }: AlertsPanelProps) {
  const unassignedCount = missions.filter(
    (mission) =>
      mission.status === "available" && !mission.assigned_driver_id
  ).length;

  const offlineDrivers = drivers.filter(
    (driver) => driver.status === "offline"
  );

  const coolingMissions = missions.filter(
    (mission) =>
      mission.status === "available" && mission.cargo?.requires_cooling
  );

  const seenAlertIds = useRef<Set<string>>(getSeenAlertPopupIds());
  const lastSoundAlertId = useRef<string | null>(null);
  const [queuedAlerts, setQueuedAlerts] = useState<PopupAlert[]>([]);
  const popupAlert = queuedAlerts[0] ?? null;

  const alerts = useMemo<DashboardAlert[]>(() => [
    ...(unassignedCount > 0
      ? [
          {
            id: "dashboard-unassigned-missions",
            type: "warning" as const,
            title: `${unassignedCount} mission(s) need assignment`,
            summary: "Assign a driver as soon as possible.",
          },
        ]
      : []),

    ...offlineDrivers.map((driver) => ({
      id: `dashboard-offline-driver-${driver.id}`,
      type: "danger" as const,
      title: `${driver.name} is offline`,
      summary: "Driver is currently unavailable.",
    })),

    ...coolingMissions.map((mission) => ({
      id: `dashboard-cooling-${mission.id}`,
      type: "info" as const,
      title: `${mission.title} requires cooling`,
      summary: "Use a vehicle that supports refrigerated cargo.",
    })),
  ], [coolingMissions, offlineDrivers, unassignedCount]);

  useEffect(() => {
    const groupedAlerts = groupAlertsForPopup(alerts);
    const newAlerts = groupedAlerts.filter((alert) => !seenAlertIds.current.has(alert.id));
    if (newAlerts.length === 0) return;

    newAlerts.forEach((alert) => seenAlertIds.current.add(alert.id));
    saveSeenAlertPopupIds(seenAlertIds.current);
    setQueuedAlerts((current) => [...current, ...newAlerts]);
  }, [alerts]);

  useEffect(() => {
    if (!popupAlert || lastSoundAlertId.current === popupAlert.id) return;

    lastSoundAlertId.current = popupAlert.id;
    playAppSound("alert");
  }, [popupAlert]);

  return (
    <>
      {popupAlert && (
        <AlertPopup
          alert={popupAlert}
          onOk={() => setQueuedAlerts((current) => current.slice(1))}
        />
      )}

      <DashboardPanel title="Alerts" count={alerts.length} accent="orange">
        <div className="space-y-3">
          {alerts.length === 0 && (
            <p className="text-sm text-muted">No alerts right now.</p>
          )}

          {alerts.map((alert, index) => {
          const classes =
            alert.type === "danger"
              ? "alert-danger"
              : alert.type === "warning"
                ? "alert-warning"
                : "alert-info";

          return (
            <div
              key={`${alert.title}-${index}`}
              className={`rounded-xl border p-4 ${classes}`}
            >
              <p className="font-semibold">{alert.title}</p>
              <p className="mt-1 text-sm opacity-80">{alert.summary}</p>
            </div>
          );
        })}
        </div>
      </DashboardPanel>
    </>
  );
}
