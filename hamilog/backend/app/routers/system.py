from fastapi import APIRouter

from ..state import manager

router = APIRouter(tags=["System"])


@router.get("/health")
async def health_check() -> dict:
    return {
        "status": "ok",
        "service": "hamilog-backend",
        "database": "in-memory",
        "active_ws_drivers": len(manager.driver_connections),
        "active_ws_dispatchers": len(manager.dispatcher_connections),
    }
