from typing import Any, Dict

from fastapi import APIRouter, HTTPException, status

from auth import TEST_USERS, create_jwt

from ..schemas import LoginRequest, LoginResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest) -> LoginResponse:
    user_record = TEST_USERS.get(body.username)
    if user_record is None or user_record["password"] != body.password:
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
