from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

from ...shared.models import Location


class MissionStatus(str, Enum):
    """Lifecycle states a mission can be in."""

    available = "available"
    assigned = "assigned"
    in_transit = "in_transit"
    delivered = "delivered"
    cancelled = "cancelled"


class Priority(str, Enum):
    """Mission urgency levels, also used for scoring."""

    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class CargoSpecifications(BaseModel):
    """Physical properties of the cargo to be transported."""

    volume_liters: float = Field(..., ge=0, description="Cargo volume in liters")
    weight_kg: float = Field(..., ge=0, description="Cargo weight in kilograms")
    requires_cooling: bool = Field(
        default=False,
        description="Whether the cargo needs refrigeration",
    )


class Mission(BaseModel):
    """A delivery mission from pickup to dropoff."""

    id: str = Field(default_factory=lambda: f"msn_{uuid.uuid4().hex[:8]}")
    title: str
    description: str
    status: MissionStatus = MissionStatus.available
    cargo: CargoSpecifications
    pickup: Location
    dropoff: Location
    assigned_driver_id: Optional[str] = None
    priority: Priority = Priority.medium
    ideal_delivery_time: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
