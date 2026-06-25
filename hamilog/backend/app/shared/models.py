from pydantic import BaseModel, Field


class Location(BaseModel):
    """A GPS coordinate with a human-readable address."""

    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    address: str = Field(..., min_length=1)
