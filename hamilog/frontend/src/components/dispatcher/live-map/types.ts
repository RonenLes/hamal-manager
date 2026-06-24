import type { Driver, Mission } from "@/lib/api-client";

export type DeliveryMapState =
  | "active"
  | "assigned"
  | "unassigned"
  | "delivered"
  | "cancelled";

export type MapPoint = {
  id: string;
  mission: Mission;
  driver?: Driver;
  state: DeliveryMapState;
};

export type LiveMapFilters = {
  activeDrivers: boolean;
  activeDeliveryLocations: boolean;
  nonActiveDeliveryLocations: boolean;
};
