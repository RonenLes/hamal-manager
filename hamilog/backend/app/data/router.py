
from fastapi import APIRouter

from .service import list_cities as get_cities
from .service import list_streets as get_streets

router = APIRouter(prefix="/api", tags=["Locations"])


@router.get("/locations/cities")
def list_cities():
    return get_cities()


@router.get("/locations/streets")
def list_streets(city: str):
    return get_streets(city)
