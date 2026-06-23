from datetime import datetime, timezone
from typing import List, Literal, Optional


class DriverRequestNotFoundError(Exception):
    pass


class DriverRequestNotPendingError(Exception):
    pass


driver_requests = [
    {
        "id": "req_001",
        "name": "Daniel Cohen",
        "phone": "050-1111111",
        "address": "Beer Sheva",
        "car_type": "sedan",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "req_002",
        "name": "Noa Levi",
        "phone": "052-2222222",
        "address": "Tel Aviv",
        "car_type": "van",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "req_003",
        "name": "Amir Tal",
        "phone": "054-3333333",
        "address": "Haifa",
        "car_type": "refrigerated_van",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "req_004",
        "name": "Lior Ezra",
        "phone": "053-4444444",
        "address": "Jerusalem",
        "car_type": "suv",
        "status": "approved",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "req_005",
        "name": "Shira Ben-David",
        "phone": "052-5555555",
        "address": "Ashdod",
        "car_type": "van",
        "status": "declined",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
    },
]


def count_pending_driver_requests() -> int:
    return sum(1 for request in driver_requests if request["status"] == "pending")


def list_driver_requests(status_filter: Optional[str] = None) -> List[dict]:
    if status_filter:
        return [
            request
            for request in driver_requests
            if request["status"] == status_filter
        ]

    return driver_requests


def review_driver_request(
    request_id: str,
    next_status: Literal["approved", "declined"],
) -> dict:
    request = next(
        (item for item in driver_requests if item["id"] == request_id),
        None,
    )

    if request is None:
        raise DriverRequestNotFoundError

    if request["status"] != "pending":
        raise DriverRequestNotPendingError

    request["status"] = next_status
    request["reviewed_at"] = datetime.now(timezone.utc).isoformat()

    return request
