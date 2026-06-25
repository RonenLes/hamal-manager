from fastapi import APIRouter

from .schemas import CargoAnalysisRequest
from .service import analyze_cargo_description

router = APIRouter(prefix="/api", tags=["Cargo"])


@router.post("/analyze-cargo")
async def analyze_cargo(body: CargoAnalysisRequest) -> dict:
    return analyze_cargo_description(body.description)
