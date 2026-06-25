from fastapi import APIRouter, Depends, HTTPException

from ...core.security import require_role
from ...database.state import db, manager
from ...features.drivers.models import DriverStatus
from ...features.missions.models import MissionStatus
from ...shared.serializers import serialize_single
from .schemas import AssignRequest
from .service import check_driver_mission_compatibility

router = APIRouter(prefix="/api", tags=["Assignments"])


@router.post("/assign")
async def force_assign_mission(
    body: AssignRequest,
    user: dict = Depends(require_role("dispatcher")),
) -> dict:
    mission = db.get_mission_by_id(body.mission_id)
    if mission is None:
        raise HTTPException(status_code=404, detail="Mission not found")

    driver = db.get_driver_by_id(body.driver_id)
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")

    compatible, reason = check_driver_mission_compatibility(driver, mission)
    updated_mission = db.update_mission_status(
        body.mission_id,
        MissionStatus.assigned.value,
        body.driver_id,
    )
    db.update_driver_status(
        body.driver_id,
        DriverStatus.on_mission.value,
        body.mission_id,
    )

    broadcast_payload = {
        "type": "mission_assigned",
        "mission": serialize_single(updated_mission),
        "driver_id": body.driver_id,
        "constraint_check": {"compatible": compatible, "reason": reason},
    }
    await manager.broadcast_to_dispatchers(broadcast_payload)
    await manager.send_to_driver(body.driver_id, {
        "type": "mission_assigned_to_you",
        "mission": serialize_single(updated_mission),
    })

    return {
        "message": "Mission assigned successfully",
        "mission": serialize_single(updated_mission),
        "compatible": compatible,
        "compatibility_reason": reason,
    }
