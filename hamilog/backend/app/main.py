import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.keep_alive import start_keep_alive_task, stop_keep_alive_task
from .features.assignments.router import router as assignments_router
from .features.auth.router import router as auth_router
from .features.cargo.router import router as cargo_router
from .features.drivers.router import router as drivers_router
from .features.mission_requests.router import router as mission_requests_router
from .features.messages.router import router as messages_router
from .features.missions.router import router as missions_router
from .features.system.router import router as system_router
from .features.support_ticket.router import router as support_ticket_router
from .realtime.router import router as websockets_router
from .routers.chatbot import router as chatbot_router

load_dotenv()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Hamilog - Volunteer Logistics API",
        version="1.0.0",
        description=(
            "Backend for coordinating volunteer drivers, missions, and real-time "
            "GPS tracking in emergency logistics scenarios."
        ),
    )

    cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    cors_origins = [
        origin.strip()
        for origin in cors_origins_raw.split(",")
        if origin.strip()
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=(
            r"^https?://(localhost|127\.0\.0\.1|"
            r"192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|"
            r"172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+):3000$"
        ),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router)
    app.include_router(missions_router)
    app.include_router(drivers_router)
    app.include_router(mission_requests_router)
    app.include_router(messages_router)
    app.include_router(assignments_router)
    app.include_router(cargo_router)
    app.include_router(support_ticket_router)
    app.include_router(websockets_router)
    app.include_router(system_router)
    app.include_router(chatbot_router)

    @app.on_event("startup")
    async def start_background_tasks() -> None:
        app.state.keep_alive_task = start_keep_alive_task()

    @app.on_event("shutdown")
    async def stop_background_tasks() -> None:
        await stop_keep_alive_task(getattr(app.state, "keep_alive_task", None))

    return app


app = create_app()
