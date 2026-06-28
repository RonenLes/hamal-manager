import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ...core.security import get_current_user, require_role

from ...database.state import db
from ...features.driver_requests.service import (
    DriverRequestNotFoundError,
    DriverRequestNotPendingError,
)
from ...features.drivers.models import CarType, DriverStatus
from ...shared.serializers import serialize_drivers, serialize_single

router = APIRouter(prefix="/api")


class CreateDriverRequest(BaseModel):
    name: str
    email: str
    phone: str
    address: str
    car_type: CarType


class UpdateDriverAvailabilityRequest(BaseModel):
    availability_dates: List[str]


@router.get("/drivers", tags=["Drivers"])
async def list_drivers(
    user: dict = Depends(require_role("dispatcher")),
) -> List[dict]:
    return serialize_drivers(db.get_all_drivers())


@router.get("/drivers/{driver_id}", tags=["Drivers"])
async def get_driver(
    driver_id: str,
    user: dict = Depends(get_current_user),
) -> dict:
    driver = db.get_driver_by_id(driver_id)
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")

    return serialize_single(driver)


@router.put("/drivers/{driver_id}/availability", tags=["Drivers"])
async def update_driver_availability(
    driver_id: str,
    body: UpdateDriverAvailabilityRequest,
    user: dict = Depends(get_current_user),
) -> dict:
    if user.get("role") == "driver" and user.get("driver_id") != driver_id:
        raise HTTPException(
            status_code=403,
            detail="Drivers can only update their own availability",
        )
    if user.get("role") not in ("driver", "dispatcher"):
        raise HTTPException(status_code=403, detail="Invalid role")

    driver = db.update_driver_availability_dates(
        driver_id,
        sorted(set(body.availability_dates)),
    )
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")

    return serialize_single(driver)


@router.get("/driver-requests/pending/count", tags=["Driver Requests"])
async def get_pending_driver_requests_count(
    user: dict = Depends(require_role("dispatcher")),
) -> dict:
    return {"count": db.count_pending_driver_requests()}


@router.get("/driver-requests", tags=["Driver Requests"])
async def list_driver_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    user: dict = Depends(require_role("dispatcher")),
) -> List[dict]:
    return db.list_driver_requests(status_filter)


@router.post("/driver-requests", status_code=201, tags=["Driver Requests"])
async def create_driver_request(body: CreateDriverRequest) -> dict:
    created = db.create_driver_request({
        "id": f"req_{uuid.uuid4().hex[:8]}",
        "name": body.name.strip(),
        "email": body.email,
        "phone": body.phone.strip(),
        "address": body.address.strip(),
        "car_type": body.car_type.value,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "reviewed_at": None,
    })
    return serialize_single(created)


@router.post("/driver-requests/{request_id}/approve", tags=["Driver Requests"])
async def approve_driver_request(
    request_id: str,
    user: dict = Depends(require_role("dispatcher")),
) -> dict:
    try:
        return _review_driver_request(request_id, "approved")
    except DriverRequestNotFoundError:
        raise HTTPException(status_code=404, detail="Driver request not found")
    except DriverRequestNotPendingError:
        raise HTTPException(
            status_code=400,
            detail="Only pending requests can be approved",
        )


@router.post("/driver-requests/{request_id}/decline", tags=["Driver Requests"])
async def decline_driver_request(
    request_id: str,
    user: dict = Depends(require_role("dispatcher")),
) -> dict:
    try:
        return _review_driver_request(request_id, "declined")
    except DriverRequestNotFoundError:
        raise HTTPException(status_code=404, detail="Driver request not found")
    except DriverRequestNotPendingError:
        raise HTTPException(
            status_code=400,
            detail="Only pending requests can be declined",
        )


def _review_driver_request(request_id: str, next_status: str) -> dict:
    request = db.get_driver_request_by_id(request_id)
    if request is None:
        raise DriverRequestNotFoundError

    if request.get("status") != "pending":
        raise DriverRequestNotPendingError

    reviewed = db.review_driver_request(request_id, next_status)
    if reviewed is None:
        raise DriverRequestNotFoundError

    if next_status == "approved":
        driver_id = f"drv_{request_id}"
        if db.get_driver_by_id(driver_id) is None:
            db.create_driver({
                "id": driver_id,
                "name": reviewed.get("name", "New Driver"),
                "email": reviewed.get("email") or f"{driver_id}@hamilog.local",
                "phone": reviewed.get("phone", ""),
                "car_type": reviewed.get("car_type"),
                "status": DriverStatus.available.value,
                "current_location": {
                    "lat": 0,
                    "lng": 0,
                    "address": reviewed.get("address", ""),
                },
                "current_mission_id": None,
                "score": 100,
                "history_score": [],
                "joined_at": datetime.now(timezone.utc),
            })

    return serialize_single(reviewed)
