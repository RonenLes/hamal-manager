from pydantic import BaseModel


class CreateMissionDeliveryRequest(BaseModel):
    mission_id: str


class CreateDispatcherMissionSuggestion(BaseModel):
    mission_id: str
    driver_id: str
    note: str = ""
