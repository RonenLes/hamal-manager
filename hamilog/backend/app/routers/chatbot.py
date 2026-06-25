import os

from dotenv import load_dotenv
from fastapi import APIRouter
from pydantic import BaseModel
from google import genai

load_dotenv()

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


SYSTEM_PROMPT = """
You are Hamilog Assistant, an AI helper inside the Hamilog logistics system.

Hamilog is a volunteer logistics platform with two main roles:
- Dispatcher: manages missions, drivers, cargo, reports, schedules, alerts, and pending requests.
- Driver: views open tasks, accepts missions, tracks assigned missions, updates mission status, and manages profile/settings.

Important concepts:
- Mission: a delivery task with pickup, destination, priority, cargo, status, and assigned driver.
- Open Tasks: available missions that drivers can review and accept.
- Dashboard: overview screen with current status and important system information.
- Reports: dispatcher analytics and operational reports.
- Settings: accessibility, theme, and font size options.

Answer clearly, briefly, and practically.
If the user asks about something outside Hamilog, politely relate the answer back to logistics or system usage.
"""


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
async def chatbot(request: ChatRequest):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return ChatResponse(reply=fallback_reply(request.message))

    try:
        client = genai.Client(api_key=api_key)

        prompt = f"""
{SYSTEM_PROMPT}

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

        return ChatResponse(reply=f"Gemini error: {type(error).__name__}: {error_text}")