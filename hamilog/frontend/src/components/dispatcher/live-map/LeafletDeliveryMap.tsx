"use client";

import { divIcon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import { getPointColor, getStateLabel } from "./map-utils";
import type { LiveMapFilters, MapPoint } from "./types";

const ISRAEL_CENTER: [number, number] = [31.7683, 35.2137];

type LeafletDeliveryMapProps = {
  points: MapPoint[];
  filters: LiveMapFilters;
  selectedMissionId: string | null;
  onSelectMission: (missionId: string) => void;
};

type CoordinateLocation = {
  lat: number;
  lng: number;
  address?: string;
};

// Checks whether the value has valid coordinates.
function hasValidCoordinates(
  location?: CoordinateLocation | null
): location is CoordinateLocation {
  return (
    typeof location?.lat === "number" &&
    typeof location?.lng === "number" &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng)
  );
}

// Creates the mission icon.
function createMissionIcon(color: string, isSelected: boolean) {
  const size = isSelected ? 24 : 18;

  return divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `
      <span style="
        display:block;
        width:${size}px;
        height:${size}px;
        border-radius:9999px;
        background:${color};
        border:3px solid ${isSelected ? "#ffffff" : "#020617"};
        box-shadow:0 8px 18px rgba(0,0,0,0.35);
      "></span>
    `,
  });
}

// Creates the driver icon.
function createDriverIcon() {
  return divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
    html: `
      <span style="
        display:flex;
        align-items:center;
        justify-content:center;
        width:28px;
        height:28px;
        border-radius:9999px;
        background:#22c55e;
        border:3px solid #ffffff;
        color:#052e16;
        font-size:14px;
        font-weight:900;
        box-shadow:0 10px 22px rgba(0,0,0,0.35);
      ">D</span>
    `,
  });
}

// Renders the leaflet delivery map component.
export default function LeafletDeliveryMap({
  points,
  filters,
  selectedMissionId,
  onSelectMission,
}: LeafletDeliveryMapProps) {
  // Handles the should show delivery location logic.
  function shouldShowDeliveryLocation(point: MapPoint) {
    if (point.state === "active") return filters.activeDeliveryLocations;
    return filters.nonActiveDeliveryLocations;
  }

  return (
    <div className="h-[520px] bg-app">
      <MapContainer
        center={ISRAEL_CENTER}
        zoom={8}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.map((point) => {
          if (!shouldShowDeliveryLocation(point)) return null;
          if (!hasValidCoordinates(point.mission.pickup)) return null;

          const isSelected = selectedMissionId === point.id;
          const color = getPointColor(point.state);

          return (
            <Marker
              key={`pickup-${point.id}`}
              position={[point.mission.pickup.lat, point.mission.pickup.lng]}
              icon={createMissionIcon(color, isSelected)}
              eventHandlers={{
                click: () => onSelectMission(point.id),
              }}
            >
              <Popup>
                <strong>{point.mission.title}</strong>
                <br />
                {getStateLabel(point.state)}
                <br />
                {point.mission.pickup.address}
              </Popup>
            </Marker>
          );
        })}

        {points.map((point) => {
          if (!shouldShowDeliveryLocation(point)) return null;
          if (!hasValidCoordinates(point.mission.dropoff)) return null;

          return (
            <Marker
              key={`dropoff-${point.id}`}
              position={[point.mission.dropoff.lat, point.mission.dropoff.lng]}
              icon={createMissionIcon("#64748b", selectedMissionId === point.id)}
              eventHandlers={{
                click: () => onSelectMission(point.id),
              }}
            >
              <Popup>
                <strong>{point.mission.title}</strong>
                <br />
                Dropoff
                <br />
                {point.mission.dropoff.address}
              </Popup>
            </Marker>
          );
        })}

        {points.map((point) => {
          if (!filters.activeDrivers) return null;
          const location = point.driver?.current_location;
          if (point.state !== "active" || !hasValidCoordinates(location)) {
            return null;
          }

          return (
            <Marker
              key={`driver-${point.driver?.id}-${point.id}`}
              position={[location.lat, location.lng]}
              icon={createDriverIcon()}
              eventHandlers={{
                click: () => onSelectMission(point.id),
              }}
            >
              <Popup>
                <strong>{point.driver?.name}</strong>
                <br />
                Active driver location
                <br />
                {location.address}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
