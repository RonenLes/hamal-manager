// =============================================================================
// Hamilog API Client — Decoupled data-fetching layer (NO UI code)
// =============================================================================
// All endpoints match the actual FastAPI backend routes in main.py.

import type {
  Mission,
  MissionStatus,
  Driver,
  LoginResponse,
  StoredUser,
  CargoAnalysisResponse,
  AssignResponse,
  ApiError,
  DriverRequest,
  MissionDeliveryRequest,
  SuggestedDriver,
  Message,
  MessageConversation,
  MessageParticipantsResponse,
  CreateSupportTicketPayload,
  SupportTicket,
  CarType,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/** Derive WebSocket base URL from API_BASE (http→ws, https→wss). */
export function getWsBase(): string {
  return API_BASE.replace(/^http/, 'ws');
}

// ---------------------------------------------------------------------------
// Re-export types for convenience
// ---------------------------------------------------------------------------

export type {
  Mission,
  MissionStatus,
  MissionPriority,
  CarType,
  DriverStatus,
  CargoSpecifications,
  Location,
  Driver,
  DriverRequest,
  MissionDeliveryRequest,
  SuggestedDriver,
  Message,
  MessageConversation,
  MessageParticipant,
  MessageParticipantsResponse,
  TicketMainSubject,
  TicketSubSubject,
  CreateSupportTicketPayload,
  SupportTicket,
  UserRole,
  LoginResponse,
  StoredUser,
  CargoAnalysisResponse,
  AssignResponse,
  ApiError,
  WSDispatchMessage,
  WSDriverMessage,
} from './types';

// ---------------------------------------------------------------------------
// JWT / Token helpers
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'hamilog_token';
const USER_KEY = 'hamilog_user';

// Returns the token.
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Sets the token.
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

// Clears the token.
export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem('hamilog-seen-alert-popups');
}

// Returns the stored user.
export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Sets the stored user.
export function setStoredUser(user: StoredUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // ignore JSON parse errors
    }
    const err: ApiError = { detail, status: res.status };
    throw err;
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Auth — POST /auth/login (JSON body, not form-encoded)
// ---------------------------------------------------------------------------

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    let detail = 'Login failed';
    try {
      const b = await res.json();
      detail = b.detail || detail;
    } catch {
      // ignore
    }
    throw { detail, status: res.status } as ApiError;
  }

  const data: LoginResponse = await res.json();
  // Backend returns { token, user: { username, role, car_type?, driver_id? } }
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

// ---------------------------------------------------------------------------
// Missions — core mission build
// ---------------------------------------------------------------------------
export type CreateMissionPayload = {
  title: string;
  description: string;
  cargo: {
    volume_liters: number;
    weight_kg: number;
    requires_cooling: boolean;
  };
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  dropoff: {
    lat: number;
    lng: number;
    address: string;
  };
  priority?: string;
  ideal_delivery_time?: string | null;
};

// ---------------------------------------------------------------------------
// Missions — GET /api/missions
// ---------------------------------------------------------------------------

export async function getMissions(
  params?: { status?: MissionStatus; driverUid?: string },
): Promise<Mission[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.driverUid) query.set('driverUid', params.driverUid);
  const qs = query.toString();
  return apiFetch<Mission[]>(`/api/missions${qs ? `?${qs}` : ''}`);
}

// GET /api/missions/:id
export async function getMission(missionId: string): Promise<Mission> {
  return apiFetch<Mission>(`/api/missions/${missionId}`);
}

// PUT /api/mission/:id/status
export async function updateMissionStatus(
  missionId: string,
  status: MissionStatus,
  driverId?: string,
): Promise<Mission> {
  return apiFetch<Mission>(`/api/mission/${missionId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, driver_id: driverId }),
  });
}

// PUT /api/missions/:id
export async function updateMission(
  missionId: string,
  data: Partial<CreateMissionPayload>,
): Promise<Mission> {
  return apiFetch<Mission>(`/api/missions/${missionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// POST /api/missions/:id/cancel
export async function cancelMission(
  missionId: string,
  reason: string,
): Promise<Mission> {
  return apiFetch<Mission>(`/api/missions/${missionId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// POST /api/assign (dispatcher force-assign)
export async function assignMission(
  missionId: string,
  driverId: string,
): Promise<AssignResponse> {
  return apiFetch<AssignResponse>('/api/assign', {
    method: 'POST',
    body: JSON.stringify({ mission_id: missionId, driver_id: driverId }),
  });
}

// Creates the mission request.
export async function createMissionRequest(
  missionId: string,
): Promise<MissionDeliveryRequest> {
  return apiFetch<MissionDeliveryRequest>('/api/mission-requests', {
    method: 'POST',
    body: JSON.stringify({ mission_id: missionId }),
  });
}

// Returns the mission requests.
export async function getMissionRequests(
  params?: { status?: 'pending' | 'approved' | 'declined' },
): Promise<MissionDeliveryRequest[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  const qs = query.toString();
  return apiFetch<MissionDeliveryRequest[]>(
    `/api/mission-requests${qs ? `?${qs}` : ''}`,
  );
}

// Approves the mission request.
export async function approveMissionRequest(
  requestId: string,
): Promise<MissionDeliveryRequest> {
  return apiFetch<MissionDeliveryRequest>(
    `/api/mission-requests/${requestId}/approve`,
    { method: 'POST' },
  );
}

// Declines the mission request.
export async function declineMissionRequest(
  requestId: string,
): Promise<MissionDeliveryRequest> {
  return apiFetch<MissionDeliveryRequest>(
    `/api/mission-requests/${requestId}/decline`,
    { method: 'POST' },
  );
}

// POST /api/missions (create new mission)
export async function createMission(data: CreateMissionPayload): Promise<Mission> {
  return apiFetch<Mission>('/api/missions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// Drivers — GET /api/drivers (dispatcher only)
// ---------------------------------------------------------------------------

export async function getDrivers(): Promise<Driver[]> {
  return apiFetch<Driver[]>('/api/drivers');
}

// GET /api/drivers/:id
export async function getDriver(driverId: string): Promise<Driver> {
  return apiFetch<Driver>(`/api/drivers/${driverId}`);
}

// Updates the driver availability.
export async function updateDriverAvailability(
  driverId: string,
  availabilityDates: string[],
): Promise<Driver> {
  return apiFetch<Driver>(`/api/drivers/${driverId}/availability`, {
    method: 'PUT',
    body: JSON.stringify({ availability_dates: availabilityDates }),
  });
}

// Returns the pending driver requests count.
export async function getPendingDriverRequestsCount() {
  const data = await apiFetch<{ count: number }>(
    '/api/driver-requests/pending/count',
  );

  return data.count;
}

// Returns the pending driver requests.
export async function getPendingDriverRequests(): Promise<DriverRequest[]> {
  return apiFetch<DriverRequest[]>('/api/driver-requests?status=pending');
}

export type CreateDriverRequestPayload = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  car_type: CarType;
  password: string;
};

// Creates the driver request.
export async function createDriverRequest(
  data: CreateDriverRequestPayload,
): Promise<DriverRequest> {
  return apiFetch<DriverRequest>('/api/driver-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Approves the driver request.
export async function approveDriverRequest(
  requestId: string,
): Promise<DriverRequest> {
  return apiFetch<DriverRequest>(`/api/driver-requests/${requestId}/approve`, {
    method: 'POST',
  });
}

// Declines the driver request.
export async function declineDriverRequest(
  requestId: string,
): Promise<DriverRequest> {
  return apiFetch<DriverRequest>(`/api/driver-requests/${requestId}/decline`, {
    method: 'POST',
  });
}

// ---------------------------------------------------------------------------
// AI Cargo Analysis — POST /api/analyze-cargo
// ---------------------------------------------------------------------------

export async function getMessageParticipants(): Promise<MessageParticipantsResponse> {
  return apiFetch<MessageParticipantsResponse>('/api/messages/participants');
}

// Returns the message conversations.
export async function getMessageConversations(): Promise<MessageConversation[]> {
  return apiFetch<MessageConversation[]>('/api/messages/conversations');
}

// Returns the messages.
export async function getMessages(
  participantRole: 'dispatcher' | 'driver',
  participantId: string,
): Promise<Message[]> {
  return apiFetch<Message[]>(`/api/messages/${participantRole}/${participantId}`);
}

// Handles the send message logic.
export async function sendMessage(
  recipientRole: 'dispatcher' | 'driver',
  recipientId: string,
  body: string,
): Promise<Message> {
  return apiFetch<Message>('/api/messages', {
    method: 'POST',
    body: JSON.stringify({
      recipient_role: recipientRole,
      recipient_id: recipientId,
      body,
    }),
  });
}

// Handles the mark messages read logic.
export async function markMessagesRead(
  participantRole: 'dispatcher' | 'driver',
  participantId: string,
): Promise<{ updated: number }> {
  return apiFetch<{ updated: number }>(
    `/api/messages/${participantRole}/${participantId}/read`,
    { method: 'POST' },
  );
}

// Returns drivers suited for an unassigned mission.
export async function getSuggestedDrivers(
  missionId: string,
): Promise<SuggestedDriver[]> {
  return apiFetch<SuggestedDriver[]>(`/api/missions/${missionId}/suggested-drivers`);
}

// Sends a dispatcher suggestion to a specific driver.
export async function suggestMissionToDriver(
  missionId: string,
  driverId: string,
  note: string,
): Promise<MissionDeliveryRequest> {
  return apiFetch<MissionDeliveryRequest>('/api/mission-requests/suggestions', {
    method: 'POST',
    body: JSON.stringify({
      mission_id: missionId,
      driver_id: driverId,
      note,
    }),
  });
}

// Returns the available location cities.
export async function getLocationCities(): Promise<string[]> {
  return apiFetch<string[]>('/api/locations/cities');
}

// Returns the streets for the selected city.
export async function getLocationStreets(city: string): Promise<string[]> {
  const query = new URLSearchParams({ city });
  return apiFetch<string[]>(`/api/locations/streets?${query.toString()}`);
}

// Creates the support ticket.
export async function createSupportTicket(
  data: CreateSupportTicketPayload,
): Promise<SupportTicket> {
  return apiFetch<SupportTicket>('/api/support-ticket', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Handles the analyze cargo logic.
export async function analyzeCargo(
  description: string,
): Promise<CargoAnalysisResponse> {
  return apiFetch<CargoAnalysisResponse>('/api/analyze-cargo', {
    method: 'POST',
    body: JSON.stringify({ description }),
  });
}

export type ChatbotHistoryMessage = {
  role: 'user' | 'bot';
  text: string;
};

// Handles the send chatbot message logic.
export async function sendChatbotMessage(
  message: string,
  context?: {
    pagePath?: string;
    history?: ChatbotHistoryMessage[];
  },
): Promise<{ reply: string }> {
  return apiFetch<{ reply: string }>("/api/chatbot", {
    method: "POST",
    body: JSON.stringify({
      message,
      page_path: context?.pagePath,
      history: context?.history ?? [],
    }),
  });
}
