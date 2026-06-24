from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..database.state import db, manager
from ..shared.serializers import serialize_drivers, serialize_missions

router = APIRouter()


@router.websocket("/ws/gps/{driver_id}")
async def websocket_gps(websocket: WebSocket, driver_id: str) -> None:
    await manager.connect_driver(driver_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            location = {
                "lat": data.get("lat", 0.0),
                "lng": data.get("lng", 0.0),
                "address": data.get("address", "GPS update"),
            }
            db.update_driver_location(driver_id, location)

            await manager.broadcast_to_dispatchers({
                "type": "gps_update",
                "driver_id": driver_id,
                "location": location,
                "timestamp": data.get(
                    "timestamp",
                    datetime.now(timezone.utc).isoformat(),
                ),
            })
    except WebSocketDisconnect:
        manager.disconnect_driver(driver_id)
    except Exception:
        manager.disconnect_driver(driver_id)


@router.websocket("/ws/dispatch")
async def websocket_dispatch(websocket: WebSocket) -> None:
    await manager.connect_dispatcher(websocket)
    try:
        await websocket.send_json({
            "type": "snapshot",
            "missions": serialize_missions(db.get_all_missions()),
            "drivers": serialize_drivers(db.get_all_drivers()),
        })

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_dispatcher(websocket)
    except Exception:
        manager.disconnect_dispatcher(websocket)
