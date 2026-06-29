import DispatcherStatsWindow from "@/components/dispatcher/shared/DispatcherStatsWindow";
import type { Mission } from "@/lib/api-client";

type DriverHistoryStatsProps = {
  missions: Mission[];
  loading: boolean;
};

// Renders the driver history stats component.
export default function DriverHistoryStats({
  missions,
  loading,
}: DriverHistoryStatsProps) {
  const totalWeight = missions.reduce(
    (sum, mission) => sum + (mission.cargo?.weight_kg ?? 0),
    0,
  );
  const totalVolume = missions.reduce(
    (sum, mission) => sum + (mission.cargo?.volume_liters ?? 0),
    0,
  );

  const stats = [
    { label: "Finished Missions", value: loading ? "..." : missions.length },
    { label: "Total Weight", value: loading ? "..." : `${totalWeight} kg` },
    { label: "Total Volume", value: loading ? "..." : `${totalVolume} L` },
  ];

  return (
    <DispatcherStatsWindow>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="min-h-24 w-44 shrink-0 rounded-xl border border-app bg-card p-4 shadow-sm sm:w-56 lg:flex-1"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-muted">
            {stat.label}
          </p>
          <p className="mt-2 text-2xl font-black text-main">{stat.value}</p>
        </div>
      ))}
    </DispatcherStatsWindow>
  );
}
