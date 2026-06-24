from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from ...core.security import get_current_user, require_role

from ...database.state import db
from ...features.driver_requests.service import (
    DriverRequestNotFoundError,
    DriverRequestNotPendingError,
)
from ...shared.serializers import serialize_drivers, serialize_single

router = APIRouter(prefix="/api")


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

    return serialize_single(reviewed)
