from fastapi import APIRouter

from ...database.state import manager

router = APIRouter(tags=["System"])


@router.get("/health")
async def health_check() -> dict:
    return {
        "status": "ok",
        "service": "hamilog-backend",
        "database": "mongodb-atlas",
        "active_ws_drivers": len(manager.driver_connections),
        "active_ws_dispatchers": len(manager.dispatcher_connections),
    }
