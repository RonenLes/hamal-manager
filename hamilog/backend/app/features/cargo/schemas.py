from pydantic import BaseModel


class CargoAnalysisRequest(BaseModel):
    description: str
