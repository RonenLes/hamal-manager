"use client";

import dynamic from "next/dynamic";

import type { LiveMapFilters, MapPoint } from "./types";

const LeafletDeliveryMap = dynamic(() => import("./LeafletDeliveryMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] items-center justify-center bg-app text-muted">
      Loading map...
    </div>
  ),
});

type LiveMapCanvasProps = {
  points: MapPoint[];
  filters: LiveMapFilters;
  selectedMissionId: string | null;
  onSelectMission: (missionId: string) => void;
};

// Renders the live map canvas component.
export default function LiveMapCanvas({
  points,
  filters,
  selectedMissionId,
  onSelectMission,
}: LiveMapCanvasProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-app bg-card shadow-xl">
      <div className="border-b border-app px-5 py-4">
        <h2 className="text-xl font-bold">Map</h2>
        <p className="mt-1 text-sm text-muted">
          Click a marker to view delivery details.
        </p>
      </div>

      <LeafletDeliveryMap
        points={points}
        filters={filters}
        selectedMissionId={selectedMissionId}
        onSelectMission={onSelectMission}
      />
    </div>
  );
}
