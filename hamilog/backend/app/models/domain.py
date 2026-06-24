"""Backward-compatible domain model imports.

New code should import models from app.features.*.models or app.shared.models.
"""

from ..features.drivers.models import CAR_SPECS, CarType, Driver, DriverStatus
from ..features.missions.models import CargoSpecifications, Mission, MissionStatus, Priority
from ..shared.models import Location

__all__ = [
    "CAR_SPECS",
    "CargoSpecifications",
    "CarType",
    "Driver",
    "DriverStatus",
    "Location",
    "Mission",
    "MissionStatus",
    "Priority",
]
