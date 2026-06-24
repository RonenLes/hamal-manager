from typing import Any, Dict

from fastapi import APIRouter, HTTPException, status

from auth import create_jwt, verify_password

from ..schemas import LoginRequest, LoginResponse
from ..state import db

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest) -> LoginResponse:
    user_record = db.get_user_by_username(body.username)
    if user_record is None or not verify_password(
        body.password,
        user_record.get("password_hash", ""),
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_jwt(
        user_id=body.username,
        role=user_record["role"],
        car_type=user_record.get("car_type"),
        driver_id=user_record.get("driver_id"),
    )

    user_info: Dict[str, Any] = {
        "username": body.username,
        "role": user_record["role"],
    }
    if user_record.get("car_type"):
        user_info["car_type"] = user_record["car_type"]
    if user_record.get("driver_id"):
        user_info["driver_id"] = user_record["driver_id"]

    return LoginResponse(token=token, user=user_info)
