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

export interface CancellationRecord {
  actor_role: 'driver' | 'dispatcher' | string;
  actor_id: string;
  reason?: string | null;
  cancelled_at: string;
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
  ideal_delivery_time?: string | null;
  delivered_at?: string | null;
  cancellation_history?: CancellationRecord[];
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
    name?: string;
    car_type?: CarType;
    driver_id?: string;
  };
}

export interface StoredUser {
  username: string;
  role: 'dispatcher' | 'driver';
  name?: string;
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
  match_score: number;
};

export type UserRole = "dispatcher" | "driver";

export type Message = {
  id: string;
  sender_id: string;
  sender_role: UserRole;
  sender_name: string;
  recipient_id: string;
  recipient_role: UserRole;
  recipient_name: string;
  body: string;
  created_at: string;
  read_at?: string | null;
};

export type MessageConversation = {
  participant_id: string;
  participant_role: UserRole;
  participant_name: string;
  last_message: Message;
  unread_count: number;
};

export type MessageParticipant = {
  id: string;
  role: UserRole;
  name: string;
  status: "online" | "offline" | DriverStatus;
  is_online: boolean;
  current_mission_id?: string | null;
  current_mission?: Mission | null;
};

export type MessageParticipantsResponse = {
  drivers: MessageParticipant[];
  dispatchers: MessageParticipant[];
};

export type TicketMainSubject =
  | "technical"
  | "account"
  | "mission"
  | "driver"
  | "other";

export type TicketSubSubject =
  | "login_problem"
  | "map_problem"
  | "mission_assignment"
  | "driver_status"
  | "message_problem"
  | "other";

export type SupportTicket = {
  id: string;
  user_id: string;
  user_role: UserRole;
  main_subject: TicketMainSubject;
  sub_subject: TicketSubSubject;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type CreateSupportTicketPayload = {
  main_subject: TicketMainSubject;
  sub_subject: TicketSubSubject;
  title: string;
  description: string;
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
