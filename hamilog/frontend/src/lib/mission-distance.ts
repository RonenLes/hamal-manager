import type { Mission } from "@/lib/api-client";

// Converts the value to a number.
function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

// Returns the mission distance km.
export function getMissionDistanceKm(mission: Mission) {
  const pickupLat = toNumber(mission.pickup?.lat);
  const pickupLng = toNumber(mission.pickup?.lng);
  const dropoffLat = toNumber(mission.dropoff?.lat);
  const dropoffLng = toNumber(mission.dropoff?.lng);

  if (
    pickupLat === null ||
    pickupLng === null ||
    dropoffLat === null ||
    dropoffLng === null
  ) {
    return 0;
  }

  const earthRadiusKm = 6371;
  const latDelta = ((dropoffLat - pickupLat) * Math.PI) / 180;
  const lngDelta = ((dropoffLng - pickupLng) * Math.PI) / 180;
  const pickupLatRad = (pickupLat * Math.PI) / 180;
  const dropoffLatRad = (dropoffLat * Math.PI) / 180;

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(pickupLatRad) *
      Math.cos(dropoffLatRad) *
      Math.sin(lngDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

// Returns the mission distance label.
export function getMissionDistanceLabel(missions: Mission[]) {
  const totalKm = missions.reduce(
    (sum, mission) => sum + getMissionDistanceKm(mission),
    0,
  );

  return `${Math.round(totalKm)} km`;
}
