from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from ...features.drivers.service import calculate_driver_trust_score
from ...core.security import get_current_user, require_role
from ...database.state import db, manager
from ...features.assignments.service import calculate_match_score, get_compatible_missions
from ...features.drivers.models import DriverStatus
from ...shared.serializers import serialize_missions, serialize_single
from .models import CancellationRecord, Mission, MissionStatus
from .schemas import (
    CancelMissionRequest,
    CreateMissionRequest,
    StatusUpdateRequest,
    UpdateMissionRequest,
)

router = APIRouter(prefix="/api", tags=["Missions"])


def get_actor_id(user: dict) -> str:
    return user.get("driver_id") or user.get("sub") or user.get("username") or "unknown"


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
        ideal_delivery_time=body.ideal_delivery_time,
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
    elif body.status == MissionStatus.delivered:
        if driver_id:
            db.update_driver_status(driver_id, DriverStatus.available.value, None)
                     
    elif body.status == MissionStatus.cancelled:
        if user.get("role") != "dispatcher":
            raise HTTPException(
                status_code=403,
                detail="Only dispatchers can cancel a mission",
            )
        if driver_id:
            db.update_driver_status(driver_id, DriverStatus.available.value, None)
        cancellation_record = CancellationRecord(
            actor_role=user.get("role", "unknown"),
            actor_id=get_actor_id(user),
            reason=body.reason,
        ).model_dump()
        updated = db.cancel_mission_assignment(
            mission_id,
            cancellation_record,
            final_status=MissionStatus.cancelled.value,
        )
        payload = {
            "type": "mission_status_update",
            "mission": serialize_single(updated),
        }
        await manager.broadcast_to_dispatchers(payload)
        if driver_id:
            await manager.send_to_driver(driver_id, payload)
        return serialize_single(updated)

    updated = db.update_mission_status(mission_id, body.status.value, driver_id)
    payload = {
        "type": "mission_status_update",
        "mission": serialize_single(updated),
    }
    await manager.broadcast_to_dispatchers(payload)
    if driver_id:
        await manager.send_to_driver(driver_id, payload)

    return serialize_single(updated)


@router.post("/missions/{mission_id}/cancel")
async def cancel_mission(
    mission_id: str,
    body: CancelMissionRequest,
    user: dict = Depends(get_current_user),
) -> dict:
    mission = db.get_mission_by_id(mission_id)
    if mission is None:
        raise HTTPException(status_code=404, detail="Mission not found")

    driver_id = mission.get("assigned_driver_id")
    if user.get("role") == "driver":
        current_driver_id = user.get("driver_id")
        if not current_driver_id or driver_id != current_driver_id:
            raise HTTPException(
                status_code=403,
                detail="Drivers can only cancel their own assigned mission",
            )
        final_status = MissionStatus.available.value
    elif user.get("role") == "dispatcher":
        final_status = MissionStatus.cancelled.value
    else:
        raise HTTPException(status_code=403, detail="Invalid role")

    if mission.get("status") not in (
        MissionStatus.assigned.value,
        MissionStatus.in_transit.value,
    ):
        raise HTTPException(
            status_code=400,
            detail="Only active assigned missions can be cancelled",
        )

    cancellation_record = CancellationRecord(
        actor_role=user.get("role", "unknown"),
        actor_id=get_actor_id(user),
        reason=body.reason,
    ).model_dump()
    updated = db.cancel_mission_assignment(
        mission_id,
        cancellation_record,
        final_status=final_status,
    )

    if driver_id:
        db.update_driver_status(driver_id, DriverStatus.available.value, None)

    payload = {
        "type": "mission_status_update",
        "mission": serialize_single(updated),
    }
    await manager.broadcast_to_dispatchers(payload)
    if driver_id:
        await manager.send_to_driver(driver_id, payload)

    return serialize_single(updated)


@router.put("/missions/{mission_id}")
async def update_mission(
    mission_id: str,
    body: UpdateMissionRequest,
    user: dict = Depends(require_role("dispatcher")),
) -> dict:
    mission = db.get_mission_by_id(mission_id)
    if mission is None:
        raise HTTPException(status_code=404, detail="Mission not found")
    if (
        mission.get("status") != MissionStatus.available.value
        or mission.get("assigned_driver_id")
    ):
        raise HTTPException(
            status_code=400,
            detail="Only unassigned missions can be edited",
        )

    updated = db.update_mission_details(
        mission_id,
        body.model_dump(exclude_unset=True),
    )
    await manager.broadcast_to_dispatchers({
        "type": "mission_updated",
        "mission": serialize_single(updated),
    })
    return serialize_single(updated)
