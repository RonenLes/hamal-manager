import type { Mission } from "@/lib/api-client";
import type { DeliveryMapState } from "./types";

export function getDeliveryState(mission: Mission): DeliveryMapState {
  if (mission.status === "in_transit") return "active";
  if (mission.status === "assigned") return "assigned";
  if (mission.status === "delivered") return "delivered";
  if (mission.status === "cancelled") return "cancelled";

  return "unassigned";
}

export function getStateLabel(state: DeliveryMapState) {
  switch (state) {
    case "active":
      return "Active";
    case "assigned":
      return "Assigned";
    case "unassigned":
      return "Not Assigned";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
  }
}

export function getPointColor(state: DeliveryMapState) {
  switch (state) {
    case "active":
      return "#22c55e";
    case "assigned":
      return "#3b82f6";
    case "unassigned":
      return "#f97316";
    case "delivered":
      return "#94a3b8";
    case "cancelled":
      return "#ef4444";
  }
}

export function getBadgeClasses(state: DeliveryMapState) {
  switch (state) {
    case "active":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "assigned":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "unassigned":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
    case "delivered":
      return "border-slate-500/30 bg-slate-500/10 text-muted";
    case "cancelled":
      return "border-red-500/30 bg-red-500/10 text-red-300";
  }
}
