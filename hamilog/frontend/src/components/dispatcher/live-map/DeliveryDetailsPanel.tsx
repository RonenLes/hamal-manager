import Link from "next/link";

import { getStateLabel } from "./map-utils";
import type { MapPoint } from "./types";

type DeliveryDetailsPanelProps = {
  selectedPoint: MapPoint | null;
};

// Renders the selected delivery summary component.
export default function DeliveryDetailsPanel({
  selectedPoint,
}: DeliveryDetailsPanelProps) {
  return (
    <div className="mb-3 rounded-xl border border-app bg-card-soft px-3 py-3">
      {!selectedPoint && (
        <p className="text-sm font-semibold text-muted">
          Select a delivery point on the map.
        </p>
      )}

      {selectedPoint && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-soft">
              Selected Delivery
            </p>
            <h2 className="mt-1 truncate text-base font-black text-main">
              {selectedPoint.mission.title}
            </h2>
            <p className="mt-1 truncate text-sm text-muted">
              {getStateLabel(selectedPoint.state)} -{" "}
              {selectedPoint.driver?.name || "No driver assigned"}
            </p>
          </div>

          <Link
            href={`/dispatcher/live-map/${selectedPoint.mission.id}`}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            See more
          </Link>
        </div>
      )}
    </div>
  );
}
