"""
main.py — Hamilog FastAPI Application
=======================================

Entry-point for the Hamilog volunteer logistics backend.

Start with::

    uvicorn main:app --reload --port 8000

Features:
    * REST endpoints for missions, drivers, auth, and cargo analysis
    * WebSocket endpoints for real-time GPS tracking and dispatch updates
    * CORS configured from the ``CORS_ORIGINS`` env variable
    * Falls back to an in-memory database when MongoDB is unavailable
"""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from auth import (
    TEST_USERS,
    create_jwt,
    get_current_user,
    require_role,
)
from missions_DB_module import (
    CargoSpecifications,
    DriverStatus,
    InMemoryDB,
    Location,
    Mission,
    MissionStatus,
    calculate_match_score,
    check_driver_mission_compatibility,
    get_compatible_missions,
)

load_dotenv()

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Hamilog — Volunteer Logistics API",
    version="1.0.0",
    description=(
        "Backend for coordinating volunteer drivers, missions, and real-time "
        "GPS tracking in emergency logistics scenarios."
    ),
)

# CORS — allow the frontend origin(s) specified in .env
cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:3000")
cors_origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory database (used when MongoDB is not reachable)
db = InMemoryDB()


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    """Credentials for the ``/auth/login`` endpoint."""
    username: str
    password: str


class LoginResponse(BaseModel):
    """Successful login payload."""
    token: str
    user: Dict[str, Any]


class StatusUpdateRequest(BaseModel):
    """Body for ``PUT /api/mission/{id}/status``."""
    status: MissionStatus
    driver_id: Optional[str] = None


class AssignRequest(BaseModel):
    """Body for ``POST /api/assign``."""
    mission_id: str
    driver_id: str


class CargoAnalysisRequest(BaseModel):
    """Body for ``POST /api/analyze-cargo``."""
    description: str


class CreateMissionRequest(BaseModel):
    """Body for ``POST /api/missions``."""
    title: str
    description: str
    cargo: CargoSpecifications
    pickup: Location
    dropoff: Location
    priority: str = "medium"


# ---------------------------------------------------------------------------
# WebSocket Connection Manager
# ---------------------------------------------------------------------------

class ConnectionManager:
    """
    Manages active WebSocket connections for drivers and dispatchers.

    * ``driver_connections`` maps ``driver_id`` → ``WebSocket``
    * ``dispatcher_connections`` is a list of all connected dispatcher sockets

    Thread-safety note: uvicorn's default async event loop is single-threaded,
    so these plain dicts/lists are safe without locks.
    """

    def __init__(self) -> None:
        self.driver_connections: Dict[str, WebSocket] = {}
        self.dispatcher_connections: List[WebSocket] = []

    async def connect_driver(self, driver_id: str, websocket: WebSocket) -> None:
        """Accept a driver WebSocket and register it."""
        await websocket.accept()
        self.driver_connections[driver_id] = websocket

    async def connect_dispatcher(self, websocket: WebSocket) -> None:
        """Accept a dispatcher WebSocket and add it to the broadcast list."""
        await websocket.accept()
        self.dispatcher_connections.append(websocket)

    def disconnect_driver(self, driver_id: str) -> None:
        """Remove a driver connection (called on WebSocketDisconnect)."""
        self.driver_connections.pop(driver_id, None)

    def disconnect_dispatcher(self, websocket: WebSocket) -> None:
        """Remove a dispatcher connection."""
        if websocket in self.dispatcher_connections:
            self.dispatcher_connections.remove(websocket)

    async def broadcast_to_dispatchers(self, message: dict) -> None:
        """
        Send a JSON message to every connected dispatcher.
        Disconnected sockets are silently pruned.
        """
        stale: List[WebSocket] = []
        for ws in self.dispatcher_connections:
            try:
                await ws.send_json(message)
            except Exception:
                stale.append(ws)
        for ws in stale:
            self.disconnect_dispatcher(ws)

    async def send_to_driver(self, driver_id: str, message: dict) -> None:
        """Send a JSON message to a specific driver, if connected."""
        ws = self.driver_connections.get(driver_id)
        if ws is not None:
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect_driver(driver_id)


manager = ConnectionManager()


# ---------------------------------------------------------------------------
# Auth Endpoints
# ---------------------------------------------------------------------------

@app.post("/auth/login", response_model=LoginResponse, tags=["Auth"])
async def login(body: LoginRequest) -> LoginResponse:
    """
    Authenticate with username + password.

    Returns a JWT and user metadata on success.
    """
    user_record = TEST_USERS.get(body.username)
    if user_record is None or user_record["password"] != body.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_jwt(
        user_id=body.username,
        role=user_record["role"],
        car_type=user_record.get("car_type"),
        driver_id=user_record.get("driver_id"),
    )

    user_info: Dict[str, Any] = {
        "username": body.username,
        "role": user_record["role"],
    }
    if user_record.get("car_type"):
        user_info["car_type"] = user_record["car_type"]
    if user_record.get("driver_id"):
        user_info["driver_id"] = user_record["driver_id"]

    return LoginResponse(token=token, user=user_info)


# ---------------------------------------------------------------------------
# Mission Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/missions", tags=["Missions"])
async def list_missions(
    status_filter: Optional[str] = Query(None, alias="status"),
    driverUid: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
) -> List[dict]:
    """
    List missions with smart filtering based on user role.

    * **Drivers** requesting ``status=available`` get only missions that
      pass the constraint engine for their vehicle.
    * A ``driverUid`` query param filters to missions assigned to that driver.
    * **Dispatchers** receive all missions (optionally filtered by status).
    """
    role = user.get("role", "")

    # --- Driver asking for available missions → constraint-engine filter ---
    if role == "driver" and status_filter == MissionStatus.available.value:
        driver_id = user.get("driver_id")
        if driver_id:
            driver = db.get_driver_by_id(driver_id)
            if driver:
                missions = get_compatible_missions(driver, db)
                # Attach a match score to each mission for the frontend
                for m in missions:
                    m["match_score"] = calculate_match_score(driver, m)
                # Sort by score descending (best matches first)
                missions.sort(key=lambda m: m.get("match_score", 0), reverse=True)
                return _serialize_missions(missions)

    # --- Filter by assigned driver -----------------------------------------
    if driverUid:
        missions = db.get_missions_by_driver(driverUid)
        return _serialize_missions(missions)

    # --- Filter by status --------------------------------------------------
    if status_filter:
        missions = db.get_missions_by_status(status_filter)
        return _serialize_missions(missions)

    # --- Default: return all -----------------------------------------------
    return _serialize_missions(db.get_all_missions())


@app.post("/api/missions", tags=["Missions"], status_code=201)
async def create_mission(
    body: CreateMissionRequest,
    user: dict = Depends(get_current_user),
) -> dict:
    """Create a new mission. Broadcasts creation to all dispatchers."""
    mission = Mission(
        title=body.title,
        description=body.description,
        cargo=body.cargo,
        pickup=body.pickup,
        dropoff=body.dropoff,
        priority=body.priority,
    )
    mission_data = mission.model_dump()
    created = db.create_mission(mission_data)

    # Broadcast to dispatchers
    await manager.broadcast_to_dispatchers({
        "type": "mission_created",
        "mission": _serialize_single(created),
    })
    return _serialize_single(created)


@app.get("/api/missions/{mission_id}", tags=["Missions"])
async def get_mission(
    mission_id: str,
    user: dict = Depends(get_current_user),
) -> dict:
    """Fetch a single mission by ID."""
    mission = db.get_mission_by_id(mission_id)
    if mission is None:
        raise HTTPException(status_code=404, detail="Mission not found")
    return _serialize_single(mission)


@app.put("/api/mission/{mission_id}/status", tags=["Missions"])
async def update_mission_status(
    mission_id: str,
    body: StatusUpdateRequest,
    user: dict = Depends(get_current_user),
) -> dict:
    """
    Transition a mission to a new status.

    When setting status to ``assigned``, the corresponding driver's status
    is also changed to ``on_mission``.  When setting to ``delivered`` or
    ``cancelled`` the driver is released back to ``available``.

    Broadcasts the update to all dispatchers and (if applicable) to the
    assigned driver.
    """
    mission = db.get_mission_by_id(mission_id)
    if mission is None:
        raise HTTPException(status_code=404, detail="Mission not found")

    driver_id = body.driver_id or mission.get("assigned_driver_id")

    # Side-effects on the driver record
    if body.status == MissionStatus.assigned and driver_id:
        db.update_driver_status(driver_id, DriverStatus.on_mission.value, mission_id)
    elif body.status in (MissionStatus.delivered, MissionStatus.cancelled):
        if driver_id:
            db.update_driver_status(driver_id, DriverStatus.available.value, None)

    updated = db.update_mission_status(mission_id, body.status.value, driver_id)

    # Broadcast
    broadcast_payload = {
        "type": "mission_status_update",
        "mission": _serialize_single(updated),
    }
    await manager.broadcast_to_dispatchers(broadcast_payload)
    if driver_id:
        await manager.send_to_driver(driver_id, broadcast_payload)

    return _serialize_single(updated)


# ---------------------------------------------------------------------------
# Driver Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/drivers", tags=["Drivers"])
async def list_drivers(
    user: dict = Depends(require_role("dispatcher")),
) -> List[dict]:
    """
    Return all registered drivers with their current status and location.

    **Dispatcher only.**
    """
    return _serialize_drivers(db.get_all_drivers())


@app.get("/api/drivers/{driver_id}", tags=["Drivers"])
async def get_driver(
    driver_id: str,
    user: dict = Depends(get_current_user),
) -> dict:
    """Fetch a single driver by ID."""
    driver = db.get_driver_by_id(driver_id)
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")
    return _serialize_single(driver)


# ---------------------------------------------------------------------------
# Assignment Endpoint
# ---------------------------------------------------------------------------

@app.post("/api/assign", tags=["Assignments"])
async def force_assign_mission(
    body: AssignRequest,
    user: dict = Depends(require_role("dispatcher")),
) -> dict:
    """
    Dispatcher force-assigns a mission to a driver regardless of
    constraint-engine results (manual override).

    Updates both the mission and driver records and broadcasts changes.
    """
    mission = db.get_mission_by_id(body.mission_id)
    if mission is None:
        raise HTTPException(status_code=404, detail="Mission not found")
    driver = db.get_driver_by_id(body.driver_id)
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")

    # Run a compatibility check for informational purposes
    compatible, reason = check_driver_mission_compatibility(driver, mission)

    # Update records regardless of compatibility
    updated_mission = db.update_mission_status(
        body.mission_id,
        MissionStatus.assigned.value,
        body.driver_id,
    )
    db.update_driver_status(
        body.driver_id,
        DriverStatus.on_mission.value,
        body.mission_id,
    )

    # Broadcast
    broadcast_payload = {
        "type": "mission_assigned",
        "mission": _serialize_single(updated_mission),
        "driver_id": body.driver_id,
        "constraint_check": {"compatible": compatible, "reason": reason},
    }
    await manager.broadcast_to_dispatchers(broadcast_payload)
    await manager.send_to_driver(body.driver_id, {
        "type": "mission_assigned_to_you",
        "mission": _serialize_single(updated_mission),
    })

    return {
        "message": "Mission assigned successfully",
        "mission": _serialize_single(updated_mission),
        "compatible": compatible,
        "compatibility_reason": reason,
    }


# ---------------------------------------------------------------------------
# Cargo Analysis Endpoint
# ---------------------------------------------------------------------------

@app.post("/api/analyze-cargo", tags=["Cargo"])
async def analyze_cargo(body: CargoAnalysisRequest) -> dict:
    """
    Parse a free-text cargo description into structured
    ``CargoSpecifications``.

    Attempts to use OpenAI first; falls back to a regex-based parser when
    the API key is missing or the call fails.
    """
    openai_key = os.getenv("OPENAI_API_KEY", "")

    # --- Try OpenAI --------------------------------------------------------
    if openai_key and not openai_key.startswith("sk-your"):
        try:
            import httpx

            response = httpx.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openai_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are a logistics assistant. Extract cargo specifications "
                                "from the user's description and return a JSON object with "
                                "exactly these keys: volume_liters (float), weight_kg (float), "
                                "requires_cooling (bool). If a value is not mentioned, make a "
                                "reasonable estimate. Return ONLY valid JSON, no markdown."
                            ),
                        },
                        {"role": "user", "content": body.description},
                    ],
                    "temperature": 0.2,
                },
                timeout=15.0,
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            return {
                "source": "openai",
                "cargo": {
                    "volume_liters": float(parsed.get("volume_liters", 0)),
                    "weight_kg": float(parsed.get("weight_kg", 0)),
                    "requires_cooling": bool(parsed.get("requires_cooling", False)),
                },
                "raw_response": content,
            }
        except Exception as exc:
            # Fall through to the mock parser
            pass

    # --- Fallback: regex-based mock parser ---------------------------------
    return {
        "source": "mock_parser",
        "cargo": _mock_parse_cargo(body.description),
        "note": "Parsed using regex fallback (no OpenAI key configured)",
    }


def _mock_parse_cargo(description: str) -> dict:
    """
    Best-effort extraction of cargo numbers from free text using regex.

    Recognises patterns like:
        * ``50 kg``, ``50kg``, ``50 kilograms``
        * ``200 liters``, ``200L``, ``200 litres``
        * keywords: cold, frozen, refrigerated, chilled, cooled, perishable
    """
    text = description.lower()

    # Weight
    weight_match = re.search(
        r"(\d+(?:\.\d+)?)\s*(?:kg|kilo(?:gram)?s?|pounds?|lbs?)", text
    )
    weight = float(weight_match.group(1)) if weight_match else 10.0

    # If matched lbs/pounds, convert to kg
    if weight_match and any(u in weight_match.group(0) for u in ("pound", "lb")):
        weight *= 0.4536

    # Volume
    volume_match = re.search(
        r"(\d+(?:\.\d+)?)\s*(?:l(?:iter|itre)?s?|gallon)", text
    )
    volume = float(volume_match.group(1)) if volume_match else 50.0

    # Cooling
    cooling_keywords = {"cold", "frozen", "refrigerat", "chill", "cool", "perishable", "vaccine", "ice"}
    requires_cooling = any(kw in text for kw in cooling_keywords)

    return {
        "volume_liters": round(volume, 2),
        "weight_kg": round(weight, 2),
        "requires_cooling": requires_cooling,
    }


# ---------------------------------------------------------------------------
# WebSocket — Driver GPS
# ---------------------------------------------------------------------------

@app.websocket("/ws/gps/{driver_id}")
async def websocket_gps(websocket: WebSocket, driver_id: str) -> None:
    """
    Driver GPS tracking socket.

    Expects JSON messages of the form::

        {"lat": 32.08, "lng": 34.78, "timestamp": "2026-06-11T10:00:00Z"}

    Each fix is stored in the DB and forwarded to all dispatcher sockets.
    """
    await manager.connect_driver(driver_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Persist the location update
            location = {
                "lat": data.get("lat", 0.0),
                "lng": data.get("lng", 0.0),
                "address": data.get("address", "GPS update"),
            }
            db.update_driver_location(driver_id, location)

            # Forward to dispatchers
            await manager.broadcast_to_dispatchers({
                "type": "gps_update",
                "driver_id": driver_id,
                "location": location,
                "timestamp": data.get(
                    "timestamp",
                    datetime.now(timezone.utc).isoformat(),
                ),
            })
    except WebSocketDisconnect:
        manager.disconnect_driver(driver_id)
    except Exception:
        manager.disconnect_driver(driver_id)


# ---------------------------------------------------------------------------
# WebSocket — Dispatcher Feed
# ---------------------------------------------------------------------------

@app.websocket("/ws/dispatch")
async def websocket_dispatch(websocket: WebSocket) -> None:
    """
    Dispatcher real-time feed.

    Once connected, the dispatcher receives:
        * GPS updates from all drivers
        * Mission status changes
        * Assignment notifications

    The dispatcher can also send control messages (future expansion).
    """
    await manager.connect_dispatcher(websocket)
    try:
        # Send current snapshot on connect
        await websocket.send_json({
            "type": "snapshot",
            "missions": _serialize_missions(db.get_all_missions()),
            "drivers": _serialize_drivers(db.get_all_drivers()),
        })
        # Keep alive — listen for any messages from the dispatcher
        while True:
            data = await websocket.receive_text()
            # Currently no dispatcher→server commands; just keep alive
    except WebSocketDisconnect:
        manager.disconnect_dispatcher(websocket)
    except Exception:
        manager.disconnect_dispatcher(websocket)


# ---------------------------------------------------------------------------
# Serialisation Helpers
# ---------------------------------------------------------------------------

def _serialize_single(record: dict) -> dict:
    """
    Convert a single DB record to a JSON-safe dict.

    Handles ``datetime`` objects and nested enum values.
    """
    if record is None:
        return {}
    out = {}
    for k, v in record.items():
        if isinstance(v, datetime):
            out[k] = v.isoformat()
        elif hasattr(v, "value"):
            # Enum → string
            out[k] = v.value
        elif isinstance(v, dict):
            out[k] = _serialize_single(v)
        else:
            out[k] = v
    return out


def _serialize_missions(missions: List[dict]) -> List[dict]:
    """Serialize a list of mission dicts."""
    return [_serialize_single(m) for m in missions]


def _serialize_drivers(drivers: List[dict]) -> List[dict]:
    """Serialize a list of driver dicts."""
    return [_serialize_single(d) for d in drivers]


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

@app.get("/health", tags=["System"])
async def health_check() -> dict:
    """Simple liveness probe."""
    return {
        "status": "ok",
        "service": "hamilog-backend",
        "database": "in-memory",
        "active_ws_drivers": len(manager.driver_connections),
        "active_ws_dispatchers": len(manager.dispatcher_connections),
    }
