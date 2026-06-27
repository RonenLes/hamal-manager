from datetime import datetime, timezone
from enum import Enum
from typing import Literal
from pydantic import BaseModel, Field

UserRole = Literal["dispatcher", "driver"]

class TicketMainSubject(str, Enum):
    technical = "technical"
    account = "account"
    mission = "mission"
    driver = "driver"
    other = "other"


class TicketSubSubject(str, Enum):
    login_problem = "login_problem"
    map_problem = "map_problem"
    mission_assignment = "mission_assignment"
    driver_status = "driver_status"
    message_problem = "message_problem"
    other = "other"


class SupportTicket(BaseModel):
    id: str
    user_id: str
    user_role: UserRole
    main_subject: TicketMainSubject
    sub_subject: TicketSubSubject
    title: str
    description: str
    status: str = "open"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
