import math
from typing import List, Optional
from datetime import datetime, timezone

from ..missions.models import MissionStatus


REASON_PENALTIES = {
    "Medical or personal emergency": 5,
    "Vehicle problem": 15,
    "Pickup location unreachable": 10,
    "Cargo does not match mission details": 0,
    "Other": 25,
    }

PRIORITY_MULTIPLIER = {
    "low": 0.7,
    "medium": 1.0,
    "high": 1.3,
    "critical": 1.8,
}

DISTANCE_BONUS_KM_STEP = 10
MAX_DISTANCE_BONUS = 10


def driver_cancelled_mission(mission: dict, driver_id: str) -> List[dict]:
    return [
        record
        for record in mission.get("cancellation_history",[])
        if record.get("actor_role") == "driver"
        and record.get("actor_id") == driver_id
    ]

def parse_to_datetime(value) -> Optional[datetime]:
    if value is None:
        return None

    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value

    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed

    return None

def calc_time_diff(bigger_time,smaller_time):
    if bigger_time is None or smaller_time is None:
        return 0, 0, 0

    diff= bigger_time-smaller_time
    total_minutes = diff.total_seconds()/60
    hours = int(total_minutes // 60)
    minutes = int(total_minutes % 60)
    return total_minutes,hours,minutes


def get_location_value(location, key: str) -> Optional[float]:
    if location is None:
        return None

    if isinstance(location, dict):
        value = location.get(key)
    else:
        value = getattr(location, key, None)

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def calculate_delivery_distance_km(mission: dict) -> float:
    pickup = mission.get("pickup")
    dropoff = mission.get("dropoff")

    pickup_lat = get_location_value(pickup, "lat")
    pickup_lng = get_location_value(pickup, "lng")
    dropoff_lat = get_location_value(dropoff, "lat")
    dropoff_lng = get_location_value(dropoff, "lng")

    if None in (pickup_lat, pickup_lng, dropoff_lat, dropoff_lng):
        return 0

    earth_radius_km = 6371
    lat_delta = math.radians(dropoff_lat - pickup_lat)
    lng_delta = math.radians(dropoff_lng - pickup_lng)
    pickup_lat_rad = math.radians(pickup_lat)
    dropoff_lat_rad = math.radians(dropoff_lat)

    a = (
        math.sin(lat_delta / 2) ** 2
        + math.cos(pickup_lat_rad)
        * math.cos(dropoff_lat_rad)
        * math.sin(lng_delta / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return earth_radius_km * c


def get_distance_bonus(mission: dict) -> int:
    distance_km = calculate_delivery_distance_km(mission)
    return min(MAX_DISTANCE_BONUS, int(distance_km // DISTANCE_BONUS_KM_STEP))


def mission_delivered_score(mission,driver_score) -> int:
    minutes_penalty =0.07
    hours_penalty=0.4
    distance_bonus = get_distance_bonus(mission)
    
        
    actual_delivery_time = parse_to_datetime(mission.get("delivered_at"))
    ideal_delivery_time = parse_to_datetime(mission.get("ideal_delivery_time"))

    if actual_delivery_time is None or ideal_delivery_time is None:
        return min(100, driver_score + 10 + distance_bonus)

    total_minutes,hours,minutes = calc_time_diff(actual_delivery_time,ideal_delivery_time)

    if total_minutes <= 0:
        return min(100, driver_score + 5 + distance_bonus)
    elif hours ==0 and minutes > 30:
        return driver_score - (minutes * minutes_penalty) + distance_bonus
    else:
        return max(
            0,
            driver_score - (minutes_penalty * minutes + hours_penalty * hours) + distance_bonus,
        )


def get_time_penalty(minutes_before_deadline: float) -> int:
    if minutes_before_deadline >= 300:
        return 0

    if minutes_before_deadline >= 120:
        return 5

    if minutes_before_deadline >= 60:
        return 10

    if minutes_before_deadline >= 30:
        return 15

    if minutes_before_deadline >= 0:
        return 25

    return 35

def mission_cancelled_score(mission,driver_id,driver_score)->int:
    record = driver_cancelled_mission(mission,driver_id)

    if not record: return driver_score



    latest_cancel = record[-1]
    reason = latest_cancel.get("reason","Other")
    cancelled_at = parse_to_datetime(latest_cancel.get("cancelled_at"))
    ideal_delivery_time = parse_to_datetime(mission.get("ideal_delivery_time"))

    if cancelled_at is None or ideal_delivery_time is None:
        return max(0, round(driver_score - REASON_PENALTIES["Other"]))

    total_minutes,_,_ = calc_time_diff(ideal_delivery_time,cancelled_at)

    reason_penalty = REASON_PENALTIES.get(reason,REASON_PENALTIES["Other"])
    time_penalty = get_time_penalty(total_minutes)

    priority= mission.get("priority","medium")
    priority_multiplier = PRIORITY_MULTIPLIER.get(priority,1.0)

    total_penalty = (reason_penalty+time_penalty)*priority_multiplier

    return max(0,round(driver_score-total_penalty))


def get_mission_score_time(mission: dict, driver_id: str) -> datetime:
    cancellation_records = driver_cancelled_mission(mission, driver_id)
    if cancellation_records:
        cancelled_at = parse_to_datetime(
            cancellation_records[-1].get("cancelled_at")
        )
        if cancelled_at is not None:
            return cancelled_at

    delivered_at = parse_to_datetime(mission.get("delivered_at"))
    if delivered_at is not None:
        return delivered_at

    updated_at = parse_to_datetime(mission.get("updated_at"))
    if updated_at is not None:
        return updated_at

    return datetime.min.replace(tzinfo=timezone.utc)


def calculate_driver_trust_score(driver: dict, missions: List[dict]) -> int:
    driver_id = driver.get("id") or driver.get("driver_id")
    score = driver.get("score")

    if score is None:
        score = 100

    if not driver_id or not missions:
        return round(max(0, min(score, 100)))

    scored_missions = sorted(
        missions,
        key=lambda mission: get_mission_score_time(mission, driver_id),
    )

    for mission in scored_missions:
        if driver_cancelled_mission(mission, driver_id):
            score = mission_cancelled_score(mission, driver_id, score)
            continue

        if mission.get("status") == MissionStatus.delivered.value:
            score = mission_delivered_score(mission, score)

    return round(max(0, min(score, 100)))


def calculate_driver_score_for_mission(driver: dict, mission: dict) -> int:
    driver_id = driver.get("id") or driver.get("driver_id")
    score = driver.get("score")

    if score is None:
        score = 100

    if driver_id and driver_cancelled_mission(mission, driver_id):
        score = mission_cancelled_score(mission, driver_id, score)
        return round(max(0, min(score, 100)))

    if mission.get("status") == MissionStatus.delivered.value:
        score = mission_delivered_score(mission, score)

    return round(max(0, min(score, 100)))
