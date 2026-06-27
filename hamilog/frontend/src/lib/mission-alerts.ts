import type { CancellationRecord, Mission } from "@/lib/types";

export function getLatestDriverCancellation(
  mission: Mission
): CancellationRecord | null {
  const driverCancellations = (mission.cancellation_history ?? []).filter(
    (record) => record.actor_role === "driver"
  );

  if (driverCancellations.length === 0) return null;

  return [...driverCancellations].sort(
    (a, b) =>
      new Date(b.cancelled_at).getTime() - new Date(a.cancelled_at).getTime()
  )[0];
}
