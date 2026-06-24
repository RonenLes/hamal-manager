from __future__ import annotations

from enum import Enum
from typing import Dict, Optional

from pydantic import BaseModel

from ...shared.models import Location


class DriverStatus(str, Enum):
    """Driver availability states."""

    available = "available"
    on_mission = "on_mission"
    offline = "offline"
    blacklisted = "blacklisted"


class CarType(str, Enum):
    """Vehicle classifications used by the matching rules."""

    sedan = "sedan"
    suv = "suv"
    van = "van"
    refrigerated_van = "refrigerated_van"


CAR_SPECS: Dict[CarType, Dict] = {
    CarType.sedan: {
        "max_weight": 50.0,
        "max_volume": 200.0,
        "cooling": False,
    },
    CarType.suv: {
        "max_weight": 150.0,
        "max_volume": 600.0,
        "cooling": False,
    },
    CarType.van: {
        "max_weight": 500.0,
        "max_volume": 2000.0,
        "cooling": False,
    },
    CarType.refrigerated_van: {
        "max_weight": 400.0,
        "max_volume": 1500.0,
        "cooling": True,
    },
}


class Driver(BaseModel):
    """A volunteer driver with a specific vehicle type."""

    id: str
    name: str
    email: str
    phone: str
    car_type: CarType
    status: DriverStatus = DriverStatus.available
    current_location: Optional[Location] = None
    current_mission_id: Optional[str] = None
    score: Optional[int] = None
