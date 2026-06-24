import type { Driver, Mission } from "@/lib/api-client";
import { getMissionDeliveredAt } from "@/lib/mission-time";

export type DriverScorePoint = {
  label: string;
  score: number;
};

type ScoredDriver = Driver & {
  score?: number;
};

function clampScore(score: number) {
  return Math.min(100, Math.max(0, Math.round(score)));
}

function getMissionScoreDelta(mission: Mission) {
  if (mission.status === "delivered") return 3;
  if (mission.status === "cancelled") return -8;
  if (mission.status === "in_transit") return 1;
  return 0;
}

function formatPointLabel(dateValue: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(dateValue));
}

export function getDriverScore(driver: ScoredDriver, index = 0) {
  if (typeof driver.score === "number") return clampScore(driver.score);

  return 90 - ((index * 7) % 28);
}

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

export function getDeliveriesMade(driver: Driver, missions: Mission[]) {
  return missions.filter(
    (mission) =>
      mission.assigned_driver_id === driver.id &&
      mission.status === "delivered"
  ).length;
}

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

export function getDriverScoreTimeline({
  driver,
  missions,
  score,
}: {
  driver: Driver;
  missions: Mission[];
  score: number;
}): DriverScorePoint[] {
  const driverMissions = getDriverMissions(driver, driver.id, missions);

  if (driverMissions.length === 0) {
    return [
      { label: "Start", score: clampScore(score - 2) },
      { label: "Now", score: clampScore(score) },
    ];
  }

  const recentMissions = driverMissions.slice(-6);
  const netDelta = recentMissions.reduce(
    (total, mission) => total + getMissionScoreDelta(mission),
    0
  );
  let runningScore = clampScore(score - netDelta);

  const points = recentMissions.map((mission) => {
    runningScore = clampScore(runningScore + getMissionScoreDelta(mission));

    return {
      label: formatPointLabel(
        getMissionDeliveredAt(mission) ?? mission.updated_at ?? mission.created_at
      ),
      score: runningScore,
    };
  });

  const lastPoint = points[points.length - 1];
  if (!lastPoint || lastPoint.score !== clampScore(score)) {
    points.push({ label: "Now", score: clampScore(score) });
  }

  return points;
}
