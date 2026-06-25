from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from ...shared.models import Location
from .models import CargoSpecifications, MissionStatus


class StatusUpdateRequest(BaseModel):
    status: MissionStatus
    driver_id: Optional[str] = None
    reason: Optional[str] = None


class CreateMissionRequest(BaseModel):
    title: str
    description: str
    cargo: CargoSpecifications
    pickup: Location
    dropoff: Location
    priority: str = "medium"
    ideal_delivery_time: Optional[datetime] = None

class UpdateMissionRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cargo: Optional[CargoSpecifications] = None
    pickup: Optional[Location] = None
    dropoff: Optional[Location] = None
    priority: Optional[str] = None
    ideal_delivery_time: Optional[datetime] = None


class CancelMissionRequest(BaseModel):
    reason: str
