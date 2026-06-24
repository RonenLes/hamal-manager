// =============================================================================
// Hamilog Shared Types — Mirrors backend Pydantic models exactly
// =============================================================================

// ---------------------------------------------------------------------------
// Enums (match backend str enums)
// ---------------------------------------------------------------------------

export type MissionStatus =
  | 'available'
  | 'assigned'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export type MissionPriority = 'low' | 'medium' | 'high' | 'critical';

export type CarType = 'sedan' | 'suv' | 'van' | 'refrigerated_van';

export type DriverStatus = 'available' | 'on_mission' | 'offline' | 'blacklisted';

// ---------------------------------------------------------------------------
// Data Models
// ---------------------------------------------------------------------------

export interface CargoSpecifications {
  volume_liters: number;
  weight_kg: number;
  requires_cooling: boolean;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  status: MissionStatus;
  cargo: CargoSpecifications;
  pickup: Location;
  dropoff: Location;
  assigned_driver_id: string | null;
  priority: MissionPriority;
  created_at: string;
  updated_at: string;
  /** Computed by the constraint engine when fetching available missions for a driver */
  match_score?: number;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  car_type: CarType;
  status: DriverStatus;
  current_location: Location | null;
  current_mission_id: string | null;
  score?: number;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface LoginResponse {
  token: string;
  user: {
    username: string;
    role: 'dispatcher' | 'driver';
    car_type?: CarType;
    driver_id?: string;
  };
}

export interface StoredUser {
  username: string;
  role: 'dispatcher' | 'driver';
  car_type?: CarType;
  driver_id?: string;
}

// ---------------------------------------------------------------------------
// API Responses
// ---------------------------------------------------------------------------

export interface CargoAnalysisResponse {
  source: 'openai' | 'mock_parser';
  cargo: {
    volume_liters: number;
    weight_kg: number;
    requires_cooling: boolean;
  };
  raw_response?: string;
  note?: string;
}

export interface AssignResponse {
  message: string;
  mission: Mission;
  compatible: boolean;
  compatibility_reason: string;
}

export interface ApiError {
  detail: string;
  status: number;
}

// ---------------------------------------------------------------------------
// WebSocket Messages
// ---------------------------------------------------------------------------

export interface WSGpsUpdate {
  type: 'gps_update';
  driver_id: string;
  location: Location;
  timestamp: string;
}

export interface WSMissionStatusUpdate {
  type: 'mission_status_update';
  mission: Mission;
}

export interface WSMissionAssigned {
  type: 'mission_assigned';
  mission: Mission;
  driver_id: string;
  constraint_check: { compatible: boolean; reason: string };
}

export interface WSMissionCreated {
  type: 'mission_created';
  mission: Mission;
}

export interface WSSnapshot {
  type: 'snapshot';
  missions: Mission[];
  drivers: Driver[];
}

export interface WSMissionAssignedToYou {
  type: 'mission_assigned_to_you';
  mission: Mission;
}

export type DriverRequest = {
  id: string;
  name: string;
  phone: string;
  address: string;
  car_type: CarType;
  status: "pending" | "approved" | "declined";
  created_at: string;
  reviewed_at?: string;
};

export type MissionRequestStatus = "pending" | "approved" | "declined";

export type MissionDeliveryRequest = {
  id: string;
  mission_id: string;
  driver_id: string;
  status: MissionRequestStatus;
  created_at: string;
  reviewed_at?: string | null;
  mission: Mission | null;
  driver: Driver | null;
  driver_score: number;
};

export type WSDispatchMessage =
  | WSGpsUpdate
  | WSMissionStatusUpdate
  | WSMissionAssigned
  | WSMissionCreated
  | WSSnapshot;

export type WSDriverMessage =
  | WSMissionAssignedToYou
  | WSMissionStatusUpdate;
