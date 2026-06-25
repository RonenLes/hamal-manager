"""Backward-compatible schema imports.

New code should import schemas from each feature package.
"""

from .features.assignments.schemas import AssignRequest
from .features.auth.schemas import LoginRequest, LoginResponse
from .features.cargo.schemas import CargoAnalysisRequest
from .features.mission_requests.schemas import CreateMissionDeliveryRequest
from .features.missions.schemas import CreateMissionRequest, StatusUpdateRequest

__all__ = [
    "AssignRequest",
    "CargoAnalysisRequest",
    "CreateMissionDeliveryRequest",
    "CreateMissionRequest",
    "LoginRequest",
    "LoginResponse",
    "StatusUpdateRequest",
]
