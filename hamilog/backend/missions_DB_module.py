"""Backward-compatible imports for the refactored backend domain modules.

New code should import from:
    - app.features.missions.models for mission models
    - app.features.drivers.models for driver models
    - app.database.memory_store for the in-memory fallback store
    - app.features.assignments.service for matching logic
"""

from app.db import InMemoryDB
from app.models import (
    CAR_SPECS,
    CargoSpecifications,
    CarType,
    Driver,
    DriverStatus,
    Location,
    Mission,
    MissionStatus,
    Priority,
)
from app.services.matching import (
    calculate_match_score,
    check_driver_mission_compatibility,
    get_compatible_missions,
)

__all__ = [
    "CAR_SPECS",
    "CargoSpecifications",
    "CarType",
    "Driver",
    "DriverStatus",
    "InMemoryDB",
    "Location",
    "Mission",
    "MissionStatus",
    "Priority",
    "calculate_match_score",
    "check_driver_mission_compatibility",
    "get_compatible_missions",
]
