import type { Driver, Mission } from "@/lib/api-client";

export type DriverScorePoint = {
  label: string;
  score: number;
};

type ScoredDriver = Driver & {
  score?: number;
};

// Clamps the score.
function clampScore(score: number) {
  return Math.min(100, Math.max(0, Math.round(score)));
}

// Formats the point label for display.
function formatPointLabel(dateValue: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(dateValue));
}

// Returns the sorted score history.
function getSortedScoreHistory(driver: Driver) {
  return [...(driver.history_score ?? [])].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}

// Returns the driver score.
export function getDriverScore(driver: ScoredDriver, index = 0) {
  if (typeof driver.score === "number") return clampScore(driver.score);

  return 90 - ((index * 7) % 28);
}

// Returns the active mission for driver.
export function getActiveMissionForDriver(driver: Driver, missions: Mission[]) {
  if (driver.current_mission_id) {
    const missionFromDriver = missions.find(
      (mission) => mission.id === driver.current_mission_id
    );

    if (missionFromDriver) return missionFromDriver;
  }

  return missions.find(
    (mission) =>
      mission.assigned_driver_id === driver.id &&
      (mission.status === "assigned" || mission.status === "in_transit")
  );
}

// Returns the deliveries made.
export function getDeliveriesMade(driver: Driver, missions: Mission[]) {
  return missions.filter(
    (mission) =>
      mission.assigned_driver_id === driver.id &&
      mission.status === "delivered"
  ).length;
}

// Returns the driver missions.
export function getDriverMissions(
  driver: Driver | null,
  driverId: string,
  missions: Mission[]
) {
  return missions
    .filter((mission) => {
      return (
        mission.assigned_driver_id === driverId ||
        driver?.current_mission_id === mission.id
      );
    })
    .sort((a, b) => {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
}

// Returns the driver score timeline.
export function getDriverScoreTimeline({
  driver,
  score,
}: {
  driver: Driver;
  score: number;
}): DriverScorePoint[] {
  const history = getSortedScoreHistory(driver);

  if (history.length === 0) {
    return [
      { label: "Start", score: clampScore(score - 2) },
      { label: "Now", score: clampScore(score) },
    ];
  }

  return history.slice(-8).map((record) => ({
    label: formatPointLabel(record.date),
    score: clampScore(record.score),
  }));
}

// Returns the driver score mission timeline.
export function getDriverScoreMissionTimeline({
  driver,
  score,
}: {
  driver: Driver;
  score: number;
}): DriverScorePoint[] {
  const history = getSortedScoreHistory(driver);

  if (history.length === 0) {
    return [{ label: "No missions", score: clampScore(score) }];
  }

  return history.slice(-8).map((record, index) => ({
    label: record.mission_title || record.mission_id || `Mission ${index + 1}`,
    score: clampScore(record.score),
  }));
}
