from datetime import datetime
from typing import List


def serialize_single(record: dict) -> dict:
    if record is None:
        return {}

    out = {}
    for key, value in record.items():
        if isinstance(value, datetime):
            out[key] = value.isoformat()
        elif hasattr(value, "value"):
            out[key] = value.value
        elif isinstance(value, dict):
            out[key] = serialize_single(value)
        elif isinstance(value, list):
            out[key] = [
                serialize_single(item) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            out[key] = value

    return out


def serialize_missions(missions: List[dict]) -> List[dict]:
    return [serialize_single(mission) for mission in missions]


def serialize_drivers(drivers: List[dict]) -> List[dict]:
    return [serialize_single(driver) for driver in drivers]
