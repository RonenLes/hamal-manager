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

export default function MyMissionsTab({
  missions,
  onMarkDelivered,
  onUpdateStatus,
  onCancelMission,
}: MyMissionsTabProps) {
  const activeMission = useMemo(
    () =>
      missions.find(
        (mission) =>
          mission.status === "assigned" || mission.status === "in_transit"
      ),
    [missions],
  );

  const completedMissions = useMemo(
    () => missions.filter((mission) => mission.status === "delivered"),
    [missions],
  );

  if (!activeMission && completedMissions.length === 0) {
    return (
      <section className="rounded-2xl border border-app bg-card p-8 text-center shadow-xl">
        <h2 className="text-xl font-black text-main">No Active Missions</h2>
        <p className="mt-2 text-sm text-muted">
          Check Open Tasks to find available missions that match your vehicle.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      {activeMission && (
        <ActiveMissionCard
          mission={activeMission}
          onMarkDelivered={onMarkDelivered}
          onUpdateStatus={onUpdateStatus}
          onCancelMission={onCancelMission}
        />
      )}

      {completedMissions.length > 0 && (
        <div className="rounded-2xl border border-app bg-card p-5 shadow-xl">
          <div className="mb-4">
            <h2 className="text-xl font-black text-main">Completed</h2>
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
