import uuid
from fastapi import APIRouter, Depends

from ...core.security import get_current_user
from ...database.state import db
from ...shared.serializers import serialize_single
from .models import SupportTicket
from .schemas import CreateSupportTicketRequest


router = APIRouter(prefix="/api", tags=["Support Tickets"])

@router.post("/support-ticket",status_code=201)
async def create_support_ticket(
    body: CreateSupportTicketRequest,
    user: dict = Depends(get_current_user),
) -> dict:
    ticket = SupportTicket(
        id=f"ticket_{uuid.uuid4().hex[:8]}",
        user_id= user.get("driver_id") or user.get("sub") or "unknown",
        user_role=user.get("role", "unknown"),
        main_subject=body.main_subject,
        sub_subject=body.sub_subject,
        title=body.title,
        description=body.description,
    )
    created= db.create_support_ticket(ticket.model_dump())
    return serialize_single(created)
