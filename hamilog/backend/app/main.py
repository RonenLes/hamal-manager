import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import assignments, auth, cargo, drivers, missions, system, websockets

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
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(missions.router)
    app.include_router(drivers.router)
    app.include_router(assignments.router)
    app.include_router(cargo.router)
    app.include_router(websockets.router)
    app.include_router(system.router)

    return app


app = create_app()
