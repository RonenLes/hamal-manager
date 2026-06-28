"use client";

import { useState } from "react";

import type { Mission } from "@/lib/api-client";

import LoadingMissionCards from "../shared/LoadingMissionCards";
import OpenTaskCard from "../missions/OpenTaskCard";

type OpenTasksTabProps = {
  missions: Mission[];
  loading: boolean;
  acceptingMissionId: string | null;
  onAcceptMission: (missionId: string) => void;
};

// Renders the open tasks tab component.
export default function OpenTasksTab({
  missions,
  loading,
  acceptingMissionId,
  onAcceptMission,
}: OpenTasksTabProps) {
  const [expandedMissionId, setExpandedMissionId] = useState<string | null>(
    null
  );

  if (loading) {
    return <LoadingMissionCards />;
  }

  if (missions.length === 0) {
    return (
      <section className="rounded-2xl border border-app bg-card p-8 text-center shadow-xl">
        <h2 className="text-xl font-black text-main">All Clear</h2>
        <p className="mt-2 text-sm text-muted">
          No open missions right now. The list refreshes automatically.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-app bg-card p-4 shadow-xl">
        <h2 className="text-xl font-black text-main">Open Tasks</h2>
        <p className="mt-1 text-sm text-muted">
          These missions are currently available for your driver profile.
        </p>
      </div>

      {missions.map((mission) => (
        <OpenTaskCard
          key={mission.id}
          mission={mission}
          isExpanded={expandedMissionId === mission.id}
          accepting={acceptingMissionId === mission.id}
          onToggle={() =>
            setExpandedMissionId((current) =>
              current === mission.id ? null : mission.id
            )
          }
          onAccept={onAcceptMission}
        />
      ))}
    </section>
  );
}
