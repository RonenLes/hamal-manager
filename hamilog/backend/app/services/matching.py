"""Backward-compatible assignment matching imports.

New code should import from app.features.assignments.service.
"""

from ..features.assignments.service import (
    calculate_match_score,
    check_driver_mission_compatibility,
    get_compatible_missions,
)

__all__ = [
    "calculate_match_score",
    "check_driver_mission_compatibility",
    "get_compatible_missions",
]
