import type { Mission } from "@/lib/api-client";

type CompletedMissionItemProps = {
  mission: Mission;
};

export default function CompletedMissionItem({
  mission,
}: CompletedMissionItemProps) {
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-app bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="font-bold text-main">{mission.title}</h3>
        <p className="mt-1 text-sm text-muted">
          {mission.cargo?.weight_kg ?? "?"} kg -{" "}
          {mission.cargo?.volume_liters ?? "?"} L
        </p>
      </div>

      <span className="w-fit rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
        Delivered
      </span>
    </article>
  );
}
