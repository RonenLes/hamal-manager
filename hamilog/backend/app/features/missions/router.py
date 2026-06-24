from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from ...core.security import get_current_user
from ...database.state import db, manager
from ...features.assignments.service import calculate_match_score, get_compatible_missions
from ...features.drivers.models import DriverStatus
from ...shared.serializers import serialize_missions, serialize_single
from .models import Mission, MissionStatus
from .schemas import CreateMissionRequest, StatusUpdateRequest

router = APIRouter(prefix="/api", tags=["Missions"])


@router.get("/missions")
async def list_missions(
    status_filter: Optional[str] = Query(None, alias="status"),
    driverUid: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
) -> List[dict]:
    role = user.get("role", "")

    if role == "driver" and status_filter == MissionStatus.available.value:
        driver_id = user.get("driver_id")
        if driver_id:
            driver = db.get_driver_by_id(driver_id)
            if driver:
                missions = get_compatible_missions(driver, db)
                for mission in missions:
                    mission["match_score"] = calculate_match_score(driver, mission)
                missions.sort(key=lambda item: item.get("match_score", 0), reverse=True)
                return serialize_missions(missions)

    if driverUid:
        return serialize_missions(db.get_missions_by_driver(driverUid))

    if status_filter:
        return serialize_missions(db.get_missions_by_status(status_filter))

    return serialize_missions(db.get_all_missions())


@router.post("/missions", status_code=201)
async def create_mission(
    body: CreateMissionRequest,
    user: dict = Depends(get_current_user),
) -> dict:
    mission = Mission(
        title=body.title,
        description=body.description,
        cargo=body.cargo,
        pickup=body.pickup,
        dropoff=body.dropoff,
        priority=body.priority,
    )
    created = db.create_mission(mission.model_dump())

    await manager.broadcast_to_dispatchers({
        "type": "mission_created",
        "mission": serialize_single(created),
    })
    return serialize_single(created)


@router.get("/missions/{mission_id}")
async def get_mission(
    mission_id: str,
    user: dict = Depends(get_current_user),
) -> dict:
    mission = db.get_mission_by_id(mission_id)
    if mission is None:
        raise HTTPException(status_code=404, detail="Mission not found")

    return serialize_single(mission)


@router.put("/mission/{mission_id}/status")
async def update_mission_status(
    mission_id: str,
    body: StatusUpdateRequest,
    user: dict = Depends(get_current_user),
) -> dict:
    mission = db.get_mission_by_id(mission_id)
    if mission is None:
        raise HTTPException(status_code=404, detail="Mission not found")

    driver_id = body.driver_id or mission.get("assigned_driver_id")

    if body.status == MissionStatus.assigned and driver_id:
        db.update_driver_status(driver_id, DriverStatus.on_mission.value, mission_id)
    elif body.status in (MissionStatus.delivered, MissionStatus.cancelled):
        if driver_id:
            db.update_driver_status(driver_id, DriverStatus.available.value, None)

    updated = db.update_mission_status(mission_id, body.status.value, driver_id)
    payload = {
        "type": "mission_status_update",
        "mission": serialize_single(updated),
    }
    await manager.broadcast_to_dispatchers(payload)
    if driver_id:
        await manager.send_to_driver(driver_id, payload)

    return serialize_single(updated)
