"""
auth.py — Authentication & Authorisation helpers for Hamilog
=============================================================

Provides:
    * JWT creation / validation (HS256, 24-hour expiry)
    * FastAPI dependencies for extracting the current user from a Bearer
      token and for enforcing role-based access control
    * Seed users used to initialise the database in development
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import jwt
from dotenv import load_dotenv
from fastapi import Header, HTTPException, status
from passlib.context import CryptContext

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

JWT_SECRET: str = os.getenv("JWT_SECRET", "hamilog-dev-secret-key-change-in-production")
JWT_ALGORITHM: str = "HS256"
JWT_EXPIRY_HOURS: int = 24
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# ---------------------------------------------------------------------------
# Seed Users
# ---------------------------------------------------------------------------

TEST_USERS: Dict[str, Dict[str, Any]] = {
    "dispatcher1": {
        "password": "dispatch123",
        "role": "dispatcher",
        "name": "Operations Dispatcher",
    },
    "dispatcher2": {
        "password": "dispatch123",
        "role": "dispatcher",
        "name": "Field Dispatcher",
    },
    "driver_sedan": {
        "password": "drive123",
        "role": "driver",
        "car_type": "sedan",
        "driver_id": "drv_001",
    },
    "driver_suv": {
        "password": "drive123",
        "role": "driver",
        "car_type": "suv",
        "driver_id": "drv_002",
    },
    "driver_van": {
        "password": "drive123",
        "role": "driver",
        "car_type": "van",
        "driver_id": "drv_003",
    },
    "driver_refrigerated": {
        "password": "drive123",
        "role": "driver",
        "car_type": "refrigerated_van",
        "driver_id": "drv_004",
    },
}


def hash_password(password: str) -> str:
    """Hash a plain-text password for safe storage."""
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Check a plain-text password against a stored hash."""
    return pwd_context.verify(password, password_hash)


def get_seed_users() -> Dict[str, Dict[str, Any]]:
    """Return development users with hashed passwords for database seeding."""
    return {
        username: {
            key: value
            for key, value in {
                **record,
                "username": username,
                "password_hash": hash_password(record["password"]),
            }.items()
            if key != "password"
        }
        for username, record in TEST_USERS.items()
    }


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def create_jwt(
    user_id: str,
    role: str,
    car_type: Optional[str] = None,
    driver_id: Optional[str] = None,
) -> str:
    """
    Build and sign a JWT.

    Payload includes:
        - sub  : the username / user identifier
        - role : 'dispatcher' | 'driver'
        - car_type : vehicle classification (drivers only)
        - driver_id : internal driver record ID (drivers only)
        - exp  : expiry timestamp (now + 24 h)
        - iat  : issued-at timestamp
    """
    now = datetime.now(timezone.utc)
    payload: Dict[str, Any] = {
        "sub": user_id,
        "role": role,
        "exp": now + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": now,
    }
    if car_type is not None:
        payload["car_type"] = car_type
    if driver_id is not None:
        payload["driver_id"] = driver_id
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt(token: str) -> Dict[str, Any]:
    """
    Decode and validate a JWT.

    Raises:
        HTTPException 401 on any validation failure (expired, malformed,
        bad signature, etc.).
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )


# ---------------------------------------------------------------------------
# FastAPI Dependencies
# ---------------------------------------------------------------------------

def get_current_user(authorization: str = Header(...)) -> Dict[str, Any]:
    """
    FastAPI dependency — extracts a Bearer token from the ``Authorization``
    header, decodes it, and returns the payload dict.

    Usage::

        @app.get("/protected")
        def protected(user: dict = Depends(get_current_user)):
            ...
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must start with 'Bearer '",
        )
    token = authorization.split(" ", 1)[1]
    return decode_jwt(token)


def require_role(role: str):
    """
    Dependency factory that ensures the authenticated user holds a
    specific role.

    Usage::

        @app.get("/dispatchers-only", dependencies=[Depends(require_role("dispatcher"))])
        def dispatchers_only():
            ...

    Returns a dependency function suitable for ``Depends()``.
    """

    def _role_checker(user: Optional[str] = Header(None, alias="authorization")) -> Dict[str, Any]:
        """Inner dependency — validates the token *and* the role claim."""
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing Authorization header",
            )
        # ``user`` arrives as the raw header value here; decode it first.
        if isinstance(user, str):
            if not user.startswith("Bearer "):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authorization header must start with 'Bearer '",
                )
            token = user.split(" ", 1)[1]
            user = decode_jwt(token)

        if user.get("role") != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This endpoint requires the '{role}' role",
            )
        return user

    return _role_checker
