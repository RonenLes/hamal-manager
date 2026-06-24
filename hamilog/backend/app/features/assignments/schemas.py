from pydantic import BaseModel


class AssignRequest(BaseModel):
    mission_id: str
    driver_id: str
