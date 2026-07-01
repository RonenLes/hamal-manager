import os
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from google import genai

from ..core.security import get_current_user
from ..database.state import db
from ..features.drivers.service import calculate_delivery_distance_km

load_dotenv()

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])


class ChatHistoryMessage(BaseModel):
    role: str
    text: str


class ChatRequest(BaseModel):
    message: str
    page_path: Optional[str] = None
    history: List[ChatHistoryMessage] = []


class ChatResponse(BaseModel):
    reply: str


SYSTEM_PROMPT = """
You are Hamilog Assistant, a role-aware AI helper inside the Hamilog logistics system.

Hamilog is a volunteer logistics platform with two main roles:
- Dispatcher: manages missions, drivers, cargo, reports, schedules, alerts, and pending requests.
- Driver: views open tasks, accepts missions, tracks assigned missions, updates mission status, and manages profile/settings.

Important concepts:
- Mission: a delivery task with pickup, destination, priority, cargo, status, and assigned driver.
- Open Tasks: available missions that drivers can review and accept.
- Dashboard: overview screen with current status and important system information.
- Reports: dispatcher analytics and operational reports.
- Settings: accessibility, theme, and font size options.

Rules:
- Use the supplied live Hamilog context before giving generic advice.
- Mention exact mission titles, status, cargo/supplies, distance in km, pickup/dropoff, and next action when relevant.
- For drivers, focus on their own assigned/current/open missions.
- For dispatchers, focus on operational overview, mission assignment, driver status, pending requests, and reports.
- Keep answers short, practical, and action-oriented.
- If the user asks for an app action you cannot perform, explain where to click.
- If the user asks outside Hamilog, politely connect the answer back to logistics or system usage.
"""


def _clean(value) -> str:
    return str(value or "").strip()


def _mission_cargo_label(mission: dict) -> str:
    cargo = mission.get("cargo") or {}
    parts = [
        f"{cargo.get('weight_kg', '?')} kg",
        f"{cargo.get('volume_liters', '?')} L",
    ]
    if cargo.get("requires_cooling"):
        parts.append("cooling required")
    return ", ".join(parts)


def _mission_distance_label(mission: dict) -> str:
    return f"{round(calculate_delivery_distance_km(mission), 1)} km"


def _mission_summary(mission: dict) -> dict:
    return {
        "id": mission.get("id"),
        "title": mission.get("title"),
        "status": mission.get("status"),
        "priority": mission.get("priority"),
        "supplies": _mission_cargo_label(mission),
        "distance": _mission_distance_label(mission),
        "pickup": (mission.get("pickup") or {}).get("address"),
        "dropoff": (mission.get("dropoff") or {}).get("address"),
        "assigned_driver_id": mission.get("assigned_driver_id"),
        "ideal_delivery_time": mission.get("ideal_delivery_time"),
    }


def _detect_intent(message: str) -> str:
    text = message.lower()

    if any(word in text for word in ("km", "distance", "far", "drive")):
        return "distance"
    if any(word in text for word in ("cargo", "supply", "supplies", "delivering", "cooling", "weight")):
        return "cargo"
    if any(word in text for word in ("request", "suggest", "pending", "approve", "decline")):
        return "requests"
    if any(word in text for word in ("open task", "available", "take mission", "accept")):
        return "open_tasks"
    if any(word in text for word in ("driver", "trust", "score", "status")):
        return "drivers"
    if any(word in text for word in ("where", "how", "click", "create", "register", "map", "report", "settings")):
        return "navigation"
    if any(word in text for word in ("mission", "missions", "today", "current", "assigned", "active")):
        return "missions"

    return "general"


def _user_missions(user: dict) -> list[dict]:
    if user.get("role") == "driver":
        driver_id = user.get("driver_id")
        return db.get_missions_by_driver(driver_id) if driver_id else []

    return db.get_all_missions()


def _build_live_context(user: dict, page_path: Optional[str]) -> dict:
    missions = _user_missions(user)
    operational = [
        mission
        for mission in missions
        if mission.get("status") not in ("delivered", "cancelled")
    ]
    delivered = [
        mission for mission in missions if mission.get("status") == "delivered"
    ]

    context = {
        "role": user.get("role"),
        "username": user.get("username") or user.get("sub"),
        "driver_id": user.get("driver_id"),
        "page_path": page_path,
        "mission_counts": {
            "total_visible": len(missions),
            "operational": len(operational),
            "delivered": len(delivered),
            "available": len([m for m in missions if m.get("status") == "available"]),
            "assigned": len([m for m in missions if m.get("status") == "assigned"]),
            "in_transit": len([m for m in missions if m.get("status") == "in_transit"]),
        },
        "operational_missions": [_mission_summary(mission) for mission in operational[:8]],
        "recent_delivered_missions": [_mission_summary(mission) for mission in delivered[:5]],
    }

    if user.get("role") == "dispatcher":
        drivers = db.get_all_drivers()
        requests = db.list_mission_requests("pending")
        context["driver_counts"] = {
            "total": len(drivers),
            "available": len([d for d in drivers if d.get("status") == "available"]),
            "on_mission": len([d for d in drivers if d.get("status") == "on_mission"]),
            "offline": len([d for d in drivers if d.get("status") == "offline"]),
        }
        context["pending_mission_requests"] = len(requests)
        context["drivers"] = [
            {
                "id": driver.get("id"),
                "name": driver.get("name"),
                "status": driver.get("status"),
                "car_type": driver.get("car_type"),
                "score": driver.get("score"),
                "current_mission_id": driver.get("current_mission_id"),
            }
            for driver in drivers[:8]
        ]

    return context


def _format_mission_line(mission: dict) -> str:
    return (
        f"{mission.get('title')} ({mission.get('status')}): "
        f"{mission.get('distance')}, supplies: {mission.get('supplies')}, "
        f"from {mission.get('pickup')} to {mission.get('dropoff')}."
    )


def _intent_reply(intent: str, context: dict) -> Optional[str]:
    missions = context["operational_missions"]

    if intent in ("distance", "cargo", "missions") and missions:
        lines = [_format_mission_line(mission) for mission in missions[:4]]
        intro = "Here are the relevant current missions:"
        if context.get("role") == "driver":
            intro = "Here are your current/future missions:"
        return intro + "\n" + "\n".join(f"- {line}" for line in lines)

    if intent == "distance" and not missions:
        return "There are no current or future missions with driving distance to show right now."

    if intent == "cargo" and not missions:
        return "There are no current or future missions with supplies/cargo to show right now."

    if intent == "requests":
        if context.get("role") == "dispatcher":
            return f"You currently have {context.get('pending_mission_requests', 0)} pending mission request(s). Open Dispatcher > Pending Requests to approve or decline them."
        return "Driver mission suggestions appear on your Driver Dashboard under Dispatcher Requests. You can accept or decline each request there."

    if intent == "open_tasks":
        return "Open Tasks shows available missions that match the driver's vehicle. Drivers can open a task and send a request to the dispatcher."

    if intent == "drivers" and context.get("role") == "dispatcher":
        counts = context.get("driver_counts", {})
        return (
            "Driver status summary: "
            f"{counts.get('available', 0)} available, "
            f"{counts.get('on_mission', 0)} on mission, "
            f"{counts.get('offline', 0)} offline. "
            "Open Dispatcher > Drivers for trust scores, vehicle type, and history."
        )

    if intent == "navigation":
        if context.get("role") == "dispatcher":
            return "Dispatcher flow: create missions in Missions, suggest drivers from mission suggestions, approve requests in Pending Requests, and track current work in Live Map."
        return "Driver flow: check Dispatcher Requests on the dashboard, use My Missions for assigned/current work, Open Tasks for available missions, and History for completed work."

    return None


def fallback_reply(message: str) -> str:
    message = message.lower()

    if "mission" in message or "task" in message:
        return "Missions are delivery tasks. Dispatchers can create and assign missions, while drivers can view open tasks and update mission status."

    if "driver" in message:
        return "Drivers can use the Driver Dashboard to view active missions, open tasks, profile information, and settings."

    if "dispatcher" in message:
        return "Dispatchers manage missions, drivers, reports, alerts, schedules, and pending requests."

    return "Hi, I am Hamilog Assistant. I can help you understand missions, drivers, dispatchers, reports, tasks, and system navigation."


@router.post("", response_model=ChatResponse)
async def chatbot(
    request: ChatRequest,
    user: dict = Depends(get_current_user),
):
    intent = _detect_intent(request.message)
    live_context = _build_live_context(user, request.page_path)
    deterministic_reply = _intent_reply(intent, live_context)

    if deterministic_reply:
        return ChatResponse(reply=deterministic_reply)

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return ChatResponse(reply=fallback_reply(request.message))

    try:
        client = genai.Client(api_key=api_key)

        history_text = "\n".join(
            f"{item.role}: {item.text}" for item in request.history[-8:]
        )

        prompt = f"""
{SYSTEM_PROMPT}

Detected intent: {intent}
Live Hamilog context:
{live_context}

Recent chat:
{history_text}

User question:
{request.message}
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        reply = response.text or fallback_reply(request.message)
        return ChatResponse(reply=reply)

    except Exception as error:
        error_text = str(error)

        if "503" in error_text or "UNAVAILABLE" in error_text:
            return ChatResponse(
                    reply="Gemini is temporarily unavailable. I can still help with basic Hamilog questions: missions, drivers, dispatchers, reports, and navigation."
            )

        return ChatResponse(
            reply="I could not reach the AI model right now, but I can still help with Hamilog missions, drivers, requests, distances, supplies, and navigation."
        )
