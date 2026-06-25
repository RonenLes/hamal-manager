import type { Mission } from "@/lib/api-client";

type DriverHistoryStatsProps = {
  missions: Mission[];
  loading: boolean;
};

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
    <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-app bg-card p-5 shadow-xl"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-muted">
            {stat.label}
          </p>
          <p className="mt-2 text-2xl font-black text-main">{stat.value}</p>
        </div>
      ))}
    </section>
  );
}
