from typing import Any, Dict, Optional

from pydantic import BaseModel

from missions_DB_module import CargoSpecifications, Location, MissionStatus


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: Dict[str, Any]


class StatusUpdateRequest(BaseModel):
    status: MissionStatus
    driver_id: Optional[str] = None


class AssignRequest(BaseModel):
    mission_id: str
    driver_id: str


class CreateMissionDeliveryRequest(BaseModel):
    mission_id: str


class CargoAnalysisRequest(BaseModel):
    description: str


class CreateMissionRequest(BaseModel):
    title: str
    description: str
    cargo: CargoSpecifications
    pickup: Location
    dropoff: Location
    priority: str = "medium"
