from pydantic import BaseModel


class CreateMissionDeliveryRequest(BaseModel):
    mission_id: str
