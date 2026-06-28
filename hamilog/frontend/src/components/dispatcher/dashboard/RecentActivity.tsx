// src/components/dispatcher/dashboard/RecentActivity.tsx

import Link from "next/link";

import type {
  Driver,
  DriverRequest,
  Mission,
  MissionDeliveryRequest,
} from "@/lib/api-client";
import { formatTime24FromValue } from "@/lib/date-format";
import { getLatestDriverCancellation } from "@/lib/mission-alerts";
import { getMissionDeliveredAt } from "@/lib/mission-time";
import DashboardPanel from "./DashboardPanel";

type RecentActivityProps = {
  missions: Mission[];
  drivers: Driver[];
  missionRequests: MissionDeliveryRequest[];
  driverRequests: DriverRequest[];
};

type ActivityItem = {
  id: string;
  title: string;
  detail?: string;
  time?: string;
  href: string;
  tone: "blue" | "green" | "orange" | "red";
};

// Formats the time for display.
function formatTime(date?: string) {
  return formatTime24FromValue(date, "Recently");
}

// Returns the tone class.
function getToneClass(tone: ActivityItem["tone"]) {
  switch (tone) {
    case "green":
      return "bg-emerald-400";
    case "orange":
      return "bg-orange-400";
    case "red":
      return "bg-red-400";
    case "blue":
      return "bg-blue-400";
  }
}

// Renders the recent activity component.
export default function RecentActivity({
  missions,
  drivers,
  missionRequests,
  driverRequests,
}: RecentActivityProps) {
  // Returns the driver name.
  function getDriverName(driverId?: string | null) {
    if (!driverId) return null;

    return drivers.find((driver) => driver.id === driverId)?.name || null;
  }

  const activities: ActivityItem[] = [
    ...missionRequests.map((request) => ({
      id: `mission-request-${request.id}`,
      title: "New mission request from driver",
      detail: `${request.driver?.name || "Driver"} requested ${
        request.mission?.title || "a mission"
      }`,
      time: request.created_at,
      href: request.mission_id
        ? `/dispatcher/pending-requests/${request.mission_id}`
        : "/dispatcher/pending-requests",
      tone: "orange" as const,
    })),

    ...driverRequests.map((request) => ({
      id: `driver-request-${request.id}`,
      title: "New driver request",
      detail: `${request.name} wants to join as a driver`,
      time: request.created_at,
      href: "/dispatcher/drivers/new-drivers",
      tone: "blue" as const,
    })),

    ...missions.flatMap((mission) => {
      const cancellation = getLatestDriverCancellation(mission);
      if (!cancellation) return [];

      const driverName = getDriverName(cancellation.actor_id);
      const reason = cancellation.reason ? ` Reason: ${cancellation.reason}` : "";

      return [
        {
          id: `driver-cancel-${mission.id}-${cancellation.cancelled_at}`,
          title: "Driver cancelled mission",
          detail: `${driverName || "Driver"} cancelled ${mission.title}.${reason}`,
          time: cancellation.cancelled_at,
          href: "/dispatcher/alerts",
          tone: "red" as const,
        },
      ];
    }),

    ...missions
      .filter((mission) => mission.status === "delivered")
      .map((mission) => {
        const driverName = getDriverName(mission.assigned_driver_id);

        return {
          id: `driver-delivered-${mission.id}`,
          title: "Driver finished delivery",
          detail: `${driverName || "Driver"} delivered ${mission.title}`,
          time: getMissionDeliveredAt(mission) || mission.updated_at,
          href: "/dispatcher/schedule",
          tone: "green" as const,
        };
      }),
  ]
    .sort(
      (a, b) =>
        new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime()
    )
    .slice(0, 8);

  return (
    <DashboardPanel title="Recent Activity" accent="purple">
      <div className="space-y-4">
        {activities.length === 0 && (
          <p className="text-sm text-muted">No recent activity.</p>
        )}

        {activities.map((activity) => (
          <Link
            key={activity.id}
            href={activity.href}
            className="flex gap-3 rounded-xl p-2 transition hover:bg-card-soft"
          >
            <span
              className={`mt-1 h-3 w-3 shrink-0 rounded-full ${getToneClass(
                activity.tone
              )}`}
            />

            <div className="border-l border-app pl-4">
              <p className="font-medium text-main">{activity.title}</p>

              {activity.detail && (
                <p className="text-sm text-muted">{activity.detail}</p>
              )}

              <p className="mt-1 text-xs text-soft">
                {formatTime(activity.time)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </DashboardPanel>
  );
}
