import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "hamilog")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI is not set. Add it to backend/.env.")

client: AsyncIOMotorClient = AsyncIOMotorClient(MONGO_URI)
database: AsyncIOMotorDatabase = client[DB_NAME]

missions_collection = database["missions"]
drivers_collection = database["drivers"]
driver_requests_collection = database["driver_requests"]
users_collection = database["users"]


async def ping_database() -> bool:
    await client.admin.command("ping")
    return True
