from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field


UserRole = Literal["dispatcher", "driver"]


class Message(BaseModel):
    id: str
    sender_id: str
    sender_role: UserRole
    sender_name: str
    recipient_id: str
    recipient_role: UserRole
    recipient_name: str
    body: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    read_at: Optional[datetime] = None
