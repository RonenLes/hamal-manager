import type { ReactNode } from "react";

import { formatDateTime24 } from "@/lib/date-format";
import { formatIdealDeliveryTime, getMissionDeliveredAt } from "@/lib/mission-time";

import PriorityBadge from "@/components/dispatcher/shared/PriorityBadge";

import { getBadgeClasses, getStateLabel } from "./map-utils";
import type { MapPoint } from "./types";

type DeliveryDetailsPanelProps = {
  selectedPoint: MapPoint | null;
};

// Renders the detail block component.
function DetailBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-app bg-app/70 p-4">
      <p className="text-xs uppercase tracking-wider text-soft">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

// Renders the delivery details panel component.
export default function DeliveryDetailsPanel({
  selectedPoint,
}: DeliveryDetailsPanelProps) {
  const deliveredAt = selectedPoint
    ? getMissionDeliveredAt(selectedPoint.mission)
    : null;

  return (
    <aside className="rounded-2xl border border-app bg-card shadow-xl">
      <div className="border-b border-app px-5 py-4">
        <h2 className="text-xl font-bold">Delivery Details</h2>
        <p className="mt-1 text-sm text-muted">
          Selected map point information.
        </p>
      </div>

      {!selectedPoint && (
        <div className="p-6 text-muted">Select a delivery point on the map.</div>
      )}

      {selectedPoint && (
        <div className="space-y-4 p-5">
          <div>
            <h3 className="text-2xl font-black text-main">
              {selectedPoint.mission.title}
            </h3>

            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${getBadgeClasses(
                  selectedPoint.state
                )}`}
              >
                {getStateLabel(selectedPoint.state)}
              </span>

              <PriorityBadge priority={selectedPoint.mission.priority} />
            </div>
          </div>

          <DetailBlock label="Driver">
            <p className="font-semibold text-main">
              {selectedPoint.driver?.name || "No driver assigned"}
            </p>
          </DetailBlock>

          <DetailBlock label="From">
            <p className="font-semibold text-main">
              {selectedPoint.mission.pickup?.address || "Pickup location TBD"}
            </p>
          </DetailBlock>

          <DetailBlock label="To">
            <p className="font-semibold text-main">
              {selectedPoint.mission.dropoff?.address || "Dropoff location TBD"}
            </p>
          </DetailBlock>

          <DetailBlock label="Cargo">
            <p className="font-semibold text-main">
              {selectedPoint.mission.description || "No product description"}
            </p>

            <p className="mt-1 text-sm text-muted">
              {selectedPoint.mission.cargo?.weight_kg ?? "?"} kg -{" "}
              {selectedPoint.mission.cargo?.volume_liters ?? "?"} L
              {selectedPoint.mission.cargo?.requires_cooling
                ? " - Cooling required"
                : ""}
            </p>
          </DetailBlock>

          <DetailBlock label="Published">
            <p className="font-semibold text-main">
              {formatDateTime24(selectedPoint.mission.created_at)}
            </p>
          </DetailBlock>

          <DetailBlock label="Ideal Delivery Time">
            <p className="font-semibold text-main">
              {formatIdealDeliveryTime(
                selectedPoint.mission.ideal_delivery_time
              )}
            </p>
          </DetailBlock>

          <DetailBlock label="Delivered At">
            <p className="font-semibold text-main">
              {deliveredAt ? formatDateTime24(deliveredAt) : "Not delivered"}
            </p>
          </DetailBlock>

          <DetailBlock label="Mission ID">
            <p className="font-mono text-sm text-muted">
              {selectedPoint.mission.id}
            </p>
          </DetailBlock>
        </div>
      )}
    </aside>
  );
}
