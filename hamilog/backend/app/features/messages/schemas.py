from typing import Literal

from pydantic import BaseModel, Field


UserRole = Literal["dispatcher", "driver"]


class CreateMessageRequest(BaseModel):
    recipient_id: str
    recipient_role: UserRole
    body: str = Field(min_length=1, max_length=2000)
