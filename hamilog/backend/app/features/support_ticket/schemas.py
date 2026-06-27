from pydantic import BaseModel, Field

from .models import TicketMainSubject, TicketSubSubject

class CreateSupportTicketRequest(BaseModel):
    main_subject: TicketMainSubject
    sub_subject: TicketSubSubject
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=2000)