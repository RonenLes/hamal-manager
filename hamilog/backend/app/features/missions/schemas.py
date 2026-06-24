from typing import Optional

from pydantic import BaseModel

from ...shared.models import Location
from .models import CargoSpecifications, MissionStatus


class StatusUpdateRequest(BaseModel):
    status: MissionStatus
    driver_id: Optional[str] = None


class CreateMissionRequest(BaseModel):
    title: str
    description: str
    cargo: CargoSpecifications
    pickup: Location
    dropoff: Location
    priority: str = "medium"
