import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from auth import get_current_user, require_role
from missions_DB_module import (
    DriverStatus,
    MissionStatus,
    calculate_match_score,
    check_driver_mission_compatibility,
)

from ..schemas import CreateMissionDeliveryRequest
from ..serializers import serialize_single
from ..state import db, manager

router = APIRouter(prefix="/api", tags=["Mission Requests"])


def _enrich_mission_request(request: dict) -> dict:
    mission = db.get_mission_by_id(request.get("mission_id"))
    driver = db.get_driver_by_id(request.get("driver_id"))
    enriched = serialize_single(request)
    enriched["mission"] = serialize_single(mission) if mission else None
    enriched["driver"] = serialize_single(driver) if driver else None
    enriched["driver_score"] = (
        calculate_match_score(driver, mission)
        if driver and mission
        else driver.get("score", 0) if driver else 0
    )
    return enriched


@router.post("/mission-requests", status_code=201)
async def create_mission_request(
    body: CreateMissionDeliveryRequest,
    user: dict = Depends(get_current_user),
) -> dict:
    if user.get("role") != "driver" or not user.get("driver_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers can request missions",
        )

    mission = db.get_mission_by_id(body.mission_id)
    if mission is None:
        raise HTTPException(status_code=404, detail="Mission not found")
    if mission.get("status") != MissionStatus.available.value:
        raise HTTPException(
            status_code=400,
            detail="Only available missions can be requested",
        )

    driver = db.get_driver_by_id(user["driver_id"])
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")

    compatible, reason = check_driver_mission_compatibility(driver, mission)
    if not compatible:
        raise HTTPException(status_code=400, detail=reason)

    now = datetime.now(timezone.utc).isoformat()
    created = db.create_mission_request({
        "id": f"mreq_{uuid.uuid4().hex[:8]}",
        "mission_id": body.mission_id,
        "driver_id": user["driver_id"],
        "status": "pending",
        "created_at": now,
        "reviewed_at": None,
    })

    payload = {
        "type": "mission_request_created",
        "request": _enrich_mission_request(created),
    }
    await manager.broadcast_to_dispatchers(payload)
    return payload["request"]


@router.get("/mission-requests")
async def list_mission_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    user: dict = Depends(require_role("dispatcher")),
) -> List[dict]:
    return [
        _enrich_mission_request(request)
        for request in db.list_mission_requests(status_filter)
    ]


@router.post("/mission-requests/{request_id}/approve")
async def approve_mission_request(
    request_id: str,
    user: dict = Depends(require_role("dispatcher")),
) -> dict:
    request = db.get_mission_request_by_id(request_id)
    if request is None:
        raise HTTPException(status_code=404, detail="Mission request not found")
    if request.get("status") != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending mission requests can be approved",
        )

    mission = db.get_mission_by_id(request["mission_id"])
    driver = db.get_driver_by_id(request["driver_id"])
    if mission is None:
        raise HTTPException(status_code=404, detail="Mission not found")
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")
    if mission.get("status") != MissionStatus.available.value:
        raise HTTPException(
            status_code=400,
            detail="Mission is no longer available",
        )

    compatible, reason = check_driver_mission_compatibility(driver, mission)
    if not compatible:
        raise HTTPException(status_code=400, detail=reason)

    updated_request = db.review_mission_request(request_id, "approved")
    updated_mission = db.update_mission_status(
        request["mission_id"],
        MissionStatus.assigned.value,
        request["driver_id"],
    )
    db.update_driver_status(
        request["driver_id"],
        DriverStatus.on_mission.value,
        request["mission_id"],
    )
    db.decline_other_mission_requests(request["mission_id"], request_id)

    payload = {
        "type": "mission_request_approved",
        "request": _enrich_mission_request(updated_request),
        "mission": serialize_single(updated_mission),
    }
    await manager.broadcast_to_dispatchers(payload)
    await manager.send_to_driver(request["driver_id"], {
        "type": "mission_assigned_to_you",
        "mission": serialize_single(updated_mission),
    })
    return payload["request"]


@router.post("/mission-requests/{request_id}/decline")
async def decline_mission_request(
    request_id: str,
    user: dict = Depends(require_role("dispatcher")),
) -> dict:
    request = db.get_mission_request_by_id(request_id)
    if request is None:
        raise HTTPException(status_code=404, detail="Mission request not found")
    if request.get("status") != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending mission requests can be declined",
        )

    updated = db.review_mission_request(request_id, "declined")
    payload = {
        "type": "mission_request_declined",
        "request": _enrich_mission_request(updated),
    }
    await manager.broadcast_to_dispatchers(payload)
    await manager.send_to_driver(request["driver_id"], payload)
    return payload["request"]
