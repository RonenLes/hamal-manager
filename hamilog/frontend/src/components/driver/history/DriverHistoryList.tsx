import type { Mission } from "@/lib/api-client";

import DriverHistoryMissionCard from "./DriverHistoryMissionCard";

type DriverHistoryListProps = {
  missions: Mission[];
  loading: boolean;
};

// Renders the driver history list component.
export default function DriverHistoryList({
  missions,
  loading,
}: DriverHistoryListProps) {
  if (loading) {
    return (
      <section className="w-full space-y-3">
        {["history-loading-1", "history-loading-2", "history-loading-3"].map(
          (item) => (
            <div
              key={item}
              className="h-28 rounded-2xl border border-app bg-card p-5 shadow-xl"
            >
              <div className="skeleton h-5 w-1/3" />
              <div className="skeleton mt-4 h-4 w-2/3" />
            </div>
          ),
        )}
      </section>
    );
  }

  if (missions.length === 0) {
    return (
      <section className="rounded-2xl border border-app bg-card p-8 text-center shadow-xl">
        <h2 className="text-xl font-black text-main">No Finished Missions</h2>
        <p className="mt-2 text-sm text-muted">
          Completed missions will appear here after you mark them delivered.
        </p>
      </section>
    );
  }

  return (
    <section className="w-full space-y-3">
      {missions.map((mission) => (
        <DriverHistoryMissionCard key={mission.id} mission={mission} />
      ))}
    </section>
  );
}
