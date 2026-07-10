import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from ...core.security import get_current_user
from ...database.state import db, manager
from ...shared.serializers import serialize_single
from .models import Message, UserRole
from .schemas import CreateMessageRequest

router = APIRouter(prefix="/api", tags=["Messages"])


def _current_user_id(user: dict) -> str:
    if user.get("role") == "driver":
        return user.get("driver_id") or user.get("sub") or "unknown"

    return user.get("sub") or user.get("username") or "unknown"


def _current_user_name(user: dict) -> str:
    user_id = _current_user_id(user)

    if user.get("role") == "driver":
        driver = db.get_driver_by_id(user_id)
        if driver:
            return driver.get("name") or user_id

    user_record = db.get_user_by_username(user.get("sub", ""))
    if user_record:
        return user_record.get("name") or user_record.get("username") or user_id

    return user_id


def _get_recipient_name(recipient_id: str, recipient_role: UserRole) -> str:
    if recipient_role == "driver":
        driver = db.get_driver_by_id(recipient_id)
        if driver is None:
            raise HTTPException(status_code=404, detail="Recipient driver not found")
        return driver.get("name") or recipient_id

    user_record = db.get_user_by_username(recipient_id)
    if user_record is None or user_record.get("role") != "dispatcher":
        raise HTTPException(status_code=404, detail="Recipient dispatcher not found")

    return user_record.get("name") or user_record.get("username") or recipient_id


def _ensure_can_message(
    sender_role: UserRole,
    sender_id: str,
    recipient_role: UserRole,
    recipient_id: str,
) -> None:
    if sender_id == recipient_id and sender_role == recipient_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send a message to yourself",
        )

    if recipient_role not in ("dispatcher", "driver"):
        raise HTTPException(status_code=400, detail="Invalid recipient role")


def _active_mission_for_driver(driver: dict) -> dict | None:
    mission_id = driver.get("current_mission_id")
    if not mission_id:
        return None

    mission = db.get_mission_by_id(mission_id)
    return serialize_single(mission) if mission else None


def _created_at_sort_value(message: dict) -> float:
    created_at = message.get("created_at")
    if isinstance(created_at, datetime):
        return created_at.timestamp()
    if isinstance(created_at, str):
        try:
            return datetime.fromisoformat(created_at).timestamp()
        except ValueError:
            return 0

    return 0


async def _notify_message(message: dict) -> None:
    payload = {
        "type": "message_created",
        "message": serialize_single(message),
    }

    if message.get("recipient_role") == "driver":
        await manager.send_to_driver(message["recipient_id"], payload)

    if (
        message.get("sender_role") == "dispatcher"
        or message.get("recipient_role") == "dispatcher"
    ):
        await manager.broadcast_to_dispatchers(payload)


@router.post("/messages", status_code=201)
async def create_message(
    body: CreateMessageRequest,
    user: dict = Depends(get_current_user),
) -> dict:
    sender_role = user.get("role")
    if sender_role not in ("dispatcher", "driver"):
        raise HTTPException(status_code=403, detail="Invalid sender role")

    sender_id = _current_user_id(user)
    recipient_name = _get_recipient_name(body.recipient_id, body.recipient_role)
    _ensure_can_message(sender_role, sender_id, body.recipient_role, body.recipient_id)
    message_body = body.body.strip()
    if not message_body:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message body cannot be empty",
        )

    message = Message(
        id=f"msg_{uuid.uuid4().hex[:10]}",
        sender_id=sender_id,
        sender_role=sender_role,
        sender_name=_current_user_name(user),
        recipient_id=body.recipient_id,
        recipient_role=body.recipient_role,
        recipient_name=recipient_name,
        body=message_body,
    )
    created = db.create_message(message.model_dump())
    await _notify_message(created)
    return serialize_single(created)


@router.get("/messages/conversations")
async def list_conversations(
    user: dict = Depends(get_current_user),
) -> List[dict]:
    user_id = _current_user_id(user)
    user_role = user.get("role")
    messages = db.list_messages_for_user(user_id, user_role)
    conversations: dict[str, dict] = {}

    for message in messages:
        is_sender = (
            message.get("sender_id") == user_id
            and message.get("sender_role") == user_role
        )
        other_id = message.get("recipient_id") if is_sender else message.get("sender_id")
        other_role = message.get("recipient_role") if is_sender else message.get("sender_role")
        other_name = (
            message.get("recipient_name") if is_sender else message.get("sender_name")
        )
        key = f"{other_role}:{other_id}"
        current = conversations.get(key)
        created_at_sort_value = _created_at_sort_value(message)

        if current is None or created_at_sort_value > current["last_message_sort"]:
            conversations[key] = {
                "participant_id": other_id,
                "participant_role": other_role,
                "participant_name": other_name,
                "last_message": serialize_single(message),
                "last_message_sort": created_at_sort_value,
                "unread_count": 0,
            }

        if (
            message.get("recipient_id") == user_id
            and message.get("recipient_role") == user_role
            and message.get("read_at") is None
        ):
            conversations[key]["unread_count"] += 1

    sorted_conversations = sorted(
        conversations.values(),
        key=lambda item: item["last_message_sort"],
        reverse=True,
    )

    for conversation in sorted_conversations:
        conversation.pop("last_message_sort", None)

    return sorted_conversations


@router.get("/messages/participants")
async def list_message_participants(
    user: dict = Depends(get_current_user),
) -> dict:
    user_id = _current_user_id(user)
    user_role = user.get("role")

    drivers = []
    for driver in db.get_all_drivers():
        if user_role == "driver" and driver.get("id") == user_id:
            continue
        if driver.get("status") == "blacklisted":
            continue

        drivers.append({
            "id": driver.get("id"),
            "role": "driver",
            "name": driver.get("name") or driver.get("id"),
            "status": driver.get("status"),
            "is_online": driver.get("status") != "offline",
            "current_mission_id": driver.get("current_mission_id"),
            "current_mission": _active_mission_for_driver(driver),
        })

    dispatchers = []
    for dispatcher in db.list_users("dispatcher"):
        dispatcher_id = dispatcher.get("username")
        if user_role == "dispatcher" and dispatcher_id == user_id:
            continue

        dispatchers.append({
            "id": dispatcher_id,
            "role": "dispatcher",
            "name": dispatcher.get("name") or dispatcher_id,
            "status": "online",
            "is_online": True,
            "current_mission_id": None,
            "current_mission": None,
        })

    return {"drivers": drivers, "dispatchers": dispatchers}


@router.get("/messages/{participant_role}/{participant_id}")
async def list_messages(
    participant_role: UserRole,
    participant_id: str,
    user: dict = Depends(get_current_user),
) -> List[dict]:
    user_id = _current_user_id(user)
    user_role = user.get("role")
    return [
        serialize_single(message)
        for message in db.list_conversation_messages(
            user_id,
            user_role,
            participant_id,
            participant_role,
        )
    ]


@router.post("/messages/{participant_role}/{participant_id}/read")
async def mark_conversation_read(
    participant_role: UserRole,
    participant_id: str,
    user: dict = Depends(get_current_user),
) -> dict:
    user_id = _current_user_id(user)
    user_role = user.get("role")
    count = db.mark_conversation_messages_read(
        user_id,
        user_role,
        participant_id,
        participant_role,
        datetime.now(timezone.utc),
    )
    return {"updated": count}
