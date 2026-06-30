import os
import json
import asyncio
from functools import lru_cache
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from ..shared.models import Location

NOMINATIM_URL = os.getenv(
    "NOMINATIM_URL",
    "https://nominatim.openstreetmap.org/search",
)
USER_AGENT = os.getenv("GEOCODER_USER_AGENT", "hamilog-logistics/1.0")


class GeocodingError(Exception):
    """Raised when an address cannot be converted into coordinates."""


def _normalize_address(address: str) -> str:
    value = address.strip()
    if "israel" in value.lower() or "ישראל" in value:
        return value

    return f"{value}, Israel"


@lru_cache(maxsize=1024)
def _cached_address_key(address: str) -> str:
    return _normalize_address(address)


async def geocode_address(address: str) -> Location:
    query = _cached_address_key(address)

    try:
        results = await asyncio.to_thread(_request_geocode, query)
    except (HTTPError, URLError, TimeoutError, OSError) as exc:
        raise GeocodingError("Address lookup failed") from exc

    if not results:
        raise GeocodingError("Address was not found")

    result = results[0]
    try:
        lat = float(result["lat"])
        lng = float(result["lon"])
    except (KeyError, TypeError, ValueError) as exc:
        raise GeocodingError("Address lookup returned invalid coordinates") from exc

    return Location(
        address=result.get("display_name") or address.strip(),
        lat=lat,
        lng=lng,
    )


def _request_geocode(query: str) -> list[dict]:
    params = urlencode({
        "q": query,
        "format": "json",
        "limit": 1,
        "countrycodes": "il",
        "addressdetails": 1,
    })
    request = Request(
        f"{NOMINATIM_URL}?{params}",
        headers={"User-Agent": USER_AGENT},
    )

    with urlopen(request, timeout=8) as response:
        return json.loads(response.read().decode("utf-8"))
