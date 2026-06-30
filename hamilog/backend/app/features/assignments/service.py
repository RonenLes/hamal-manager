from __future__ import annotations

from datetime import datetime
from typing import List, Tuple

from ..drivers.models import CAR_SPECS, CarType, DriverStatus
from ..missions.models import CargoSpecifications, MissionStatus, Priority


def check_driver_mission_compatibility(
    driver: dict,
    mission: dict,
) -> Tuple[bool, str]:
    """Determine whether a driver is allowed to accept a mission."""

    driver_status = driver.get("status")
    if isinstance(driver_status, DriverStatus):
        driver_status = driver_status.value
    if driver_status != DriverStatus.available.value:
        return False, f"Driver is not available (status: {driver_status})"

    car_type_raw = driver.get("car_type")
    if isinstance(car_type_raw, str):
        car_type_raw = CarType(car_type_raw)
    specs = CAR_SPECS[car_type_raw]

    cargo = mission.get("cargo", {})
    if isinstance(cargo, CargoSpecifications):
        cargo = cargo.model_dump()

    weight = cargo.get("weight_kg", 0)
    volume = cargo.get("volume_liters", 0)
    needs_cooling = cargo.get("requires_cooling", False)

    if weight > specs["max_weight"]:
        return (
            False,
            f"Cargo weight ({weight} kg) exceeds {car_type_raw.value} max ({specs['max_weight']} kg)",
        )

    if volume > specs["max_volume"]:
        return (
            False,
            f"Cargo volume ({volume} L) exceeds {car_type_raw.value} max ({specs['max_volume']} L)",
        )

    if needs_cooling and not specs["cooling"]:
        return False, f"{car_type_raw.value} does not support cooling"

    return True, "Compatible"


def get_compatible_missions(driver: dict, db) -> List[dict]:
    """Return all available missions from db that the driver can transport."""

    available = db.get_missions_by_status(MissionStatus.available.value)
    compatible: List[dict] = []
    for mission in available:
        ok, _ = check_driver_mission_compatibility(driver, mission)
        if ok:
            compatible.append(mission)
    return compatible


def driver_matches_mission_date(driver: dict, mission: dict) -> Tuple[bool, str]:
    """Check whether a driver marked availability for the mission date."""

    ideal_delivery_time = mission.get("ideal_delivery_time")
    if not ideal_delivery_time:
        return True, "Mission has no ideal delivery date"

    try:
        mission_date = datetime.fromisoformat(
            str(ideal_delivery_time).replace("Z", "+00:00")
        ).date().isoformat()
    except ValueError:
        return True, "Mission date could not be parsed"

    availability_dates = driver.get("availability_dates") or []
    if mission_date not in availability_dates:
        return False, f"Driver did not mark availability for {mission_date}"

    return True, "Driver is available on the mission date"


def get_suggested_drivers_for_mission(mission: dict, db) -> List[dict]:
    """Return drivers that fit the cargo and marked availability for a mission."""

    suggested: List[dict] = []
    for driver in db.get_all_drivers():
        compatible, _ = check_driver_mission_compatibility(driver, mission)
        date_ok, _ = driver_matches_mission_date(driver, mission)
        if compatible and date_ok:
            suggested.append(driver)

    return suggested




def calculate_match_score(driver: dict, mission: dict) -> float:
    """Produce a 0.0-1.0 score indicating how well a driver matches a mission."""

    ok, _ = check_driver_mission_compatibility(driver, mission)
    if not ok:
        return 0.0

    car_type_raw = driver.get("car_type")
    if isinstance(car_type_raw, str):
        car_type_raw = CarType(car_type_raw)
    specs = CAR_SPECS[car_type_raw]

    cargo = mission.get("cargo", {})
    if isinstance(cargo, CargoSpecifications):
        cargo = cargo.model_dump()

    weight_ratio = (
        cargo.get("weight_kg", 0) / specs["max_weight"]
        if specs["max_weight"]
        else 0
    )
    volume_ratio = (
        cargo.get("volume_liters", 0) / specs["max_volume"]
        if specs["max_volume"]
        else 0
    )
    utilisation = (weight_ratio + volume_ratio) / 2.0

    priority_raw = mission.get("priority", Priority.medium.value)
    if isinstance(priority_raw, Priority):
        priority_raw = priority_raw.value
    priority_map = {
        Priority.low.value: 0.1,
        Priority.medium.value: 0.4,
        Priority.high.value: 0.7,
        Priority.critical.value: 1.0,
    }
    priority_score = priority_map.get(priority_raw, 0.4)
    driver_score = driver.get("score",0)/100

    score = 0.60 * utilisation + 0.25 * priority_score + 0.15*driver_score
    return round(min(score, 1.0), 4)
