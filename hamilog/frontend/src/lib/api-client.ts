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
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

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

// POST /api/missions (create new mission)
export async function createMission(data: {
  title: string;
  description: string;
  cargo: { volume_liters: number; weight_kg: number; requires_cooling: boolean };
  pickup: { lat: number; lng: number; address: string };
  dropoff: { lat: number; lng: number; address: string };
  priority?: string;
}): Promise<Mission> {
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

// ---------------------------------------------------------------------------
// AI Cargo Analysis — POST /api/analyze-cargo
// ---------------------------------------------------------------------------

export async function analyzeCargo(
  description: string,
): Promise<CargoAnalysisResponse> {
  return apiFetch<CargoAnalysisResponse>('/api/analyze-cargo', {
    method: 'POST',
    body: JSON.stringify({ description }),
  });
}
