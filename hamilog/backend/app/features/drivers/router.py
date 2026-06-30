import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ...core.security import get_current_user, hash_password, require_role

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
    city: str
    car_type: CarType
    password: str = Field(min_length=6)


class UpdateDriverAvailabilityRequest(BaseModel):
    availability_dates: List[str]


def _public_driver_request(request: dict) -> dict:
    return {
        key: value
        for key, value in serialize_single(request).items()
        if key not in {"password_hash"}
    }


def _public_driver_requests(requests: List[dict]) -> List[dict]:
    return [_public_driver_request(request) for request in requests]


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
    return _public_driver_requests(db.list_driver_requests(status_filter))


@router.post("/driver-requests", status_code=201, tags=["Driver Requests"])
async def create_driver_request(body: CreateDriverRequest) -> dict:
    email = body.email.strip().lower()
    if db.get_user_by_username(email) is not None:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists",
        )

    created = db.create_driver_request({
        "id": f"req_{uuid.uuid4().hex[:8]}",
        "name": body.name.strip(),
        "email": email,
        "phone": body.phone.strip(),
        "address": body.address.strip(),
        "city": body.city.strip(),
        "car_type": body.car_type.value,
        "password_hash": hash_password(body.password),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "reviewed_at": None,
    })
    return _public_driver_request(created)


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
                "address": reviewed.get("address", ""),
                "city": reviewed.get("city", ""),
                "car_type": reviewed.get("car_type"),
                "status": DriverStatus.available.value,
                "current_location": {
                    "lat": 0,
                    "lng": 0,
                    "address": ", ".join(
                        item
                        for item in [
                            reviewed.get("address", ""),
                            reviewed.get("city", ""),
                        ]
                        if item
                    ),
                },
                "current_mission_id": None,
                "score": 100,
                "history_score": [],
                "joined_at": datetime.now(timezone.utc),
            })

        username = reviewed.get("email")
        if username and db.get_user_by_username(username) is None:
            db.create_user({
                "username": username,
                "password_hash": reviewed.get("password_hash"),
                "role": "driver",
                "name": reviewed.get("name", "New Driver"),
                "email": reviewed.get("email"),
                "phone": reviewed.get("phone", ""),
                "address": reviewed.get("address", ""),
                "city": reviewed.get("city", ""),
                "car_type": reviewed.get("car_type"),
                "driver_id": driver_id,
            })

    return _public_driver_request(reviewed)
