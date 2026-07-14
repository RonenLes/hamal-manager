import { useMemo } from "react";

import type { Mission } from "@/lib/api-client";

import ActiveMissionCard from "../missions/ActiveMissionCard";
import CompletedMissionItem from "../missions/CompletedMissionItem";

type MyMissionsTabProps = {
  missions: Mission[];
  onMarkDelivered: (id: string) => void;
  onUpdateStatus: (id: string, status: "in_transit") => void;
  onCancelMission: (id: string, reason: string) => void;
};

function isPresentOrFutureMission(mission: Mission) {
  return mission.status === "assigned" || mission.status === "in_transit";
}

function sortPresentAndFutureMissions(a: Mission, b: Mission) {
  if (a.status === "in_transit" && b.status !== "in_transit") return -1;
  if (a.status !== "in_transit" && b.status === "in_transit") return 1;

  const aTime = new Date(a.ideal_delivery_time || a.created_at).getTime();
  const bTime = new Date(b.ideal_delivery_time || b.created_at).getTime();

  return aTime - bTime;
}

// Renders the my missions tab component.
export default function MyMissionsTab({
  missions,
  onMarkDelivered,
  onUpdateStatus,
  onCancelMission,
}: MyMissionsTabProps) {
  const presentAndFutureMissions = useMemo(
    () =>
      missions
        .filter(isPresentOrFutureMission)
        .sort(sortPresentAndFutureMissions),
    [missions],
  );

  const completedMissions = useMemo(
    () => missions.filter((mission) => mission.status === "delivered"),
    [missions],
  );

  if (presentAndFutureMissions.length === 0 && completedMissions.length === 0) {
    return (
      <section className="rounded-xl border border-app bg-card p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-main">No Assigned Missions</h2>
        <p className="mt-2 text-sm text-muted">
          Check Open Tasks to find available missions that match your vehicle.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      {presentAndFutureMissions.length > 0 && (
        <div className="space-y-4">
          {presentAndFutureMissions.map((mission) => (
            <ActiveMissionCard
              key={mission.id}
              mission={mission}
              onMarkDelivered={onMarkDelivered}
              onUpdateStatus={onUpdateStatus}
              onCancelMission={onCancelMission}
            />
          ))}
        </div>
      )}

      {completedMissions.length > 0 && (
        <div className="rounded-xl border border-app bg-card p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-main">Completed</h2>
            <p className="mt-1 text-sm text-muted">
              {completedMissions.length} delivered mission
              {completedMissions.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="space-y-3">
            {completedMissions.map((mission) => (
              <CompletedMissionItem key={mission.id} mission={mission} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
