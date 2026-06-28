import os
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.collection import Collection

from ..core.security import get_seed_users
from ..features.driver_requests.service import SAMPLE_DRIVER_REQUESTS
from ..features.missions.models import MissionStatus
from .memory_store import InMemoryDB

load_dotenv()


def _to_mongo_value(value: Any) -> Any:
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, dict):
        return {key: _to_mongo_value(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_to_mongo_value(item) for item in value]
    return value


def _without_object_id(document: Optional[dict]) -> Optional[dict]:
    if document is None:
        return None

    document.pop("_id", None)
    return document


class MongoDB:
    def __init__(self) -> None:
        mongo_uri = os.getenv("MONGO_URI")
        db_name = os.getenv("DB_NAME", "hamilog")
        if not mongo_uri:
            raise RuntimeError("MONGO_URI is not set")

        self.client = MongoClient(mongo_uri, serverSelectionTimeoutMS=8000)
        self.client.admin.command("ping")
        self.database = self.client[db_name]
        self.missions: Collection = self.database["missions"]
        self.drivers: Collection = self.database["drivers"]
        self.driver_requests: Collection = self.database["driver_requests"]
        self.mission_requests: Collection = self.database["mission_requests"]
        self.messages: Collection = self.database["messages"]
        self.support_tickets: Collection = self.database["support_tickets"]
        self.users: Collection = self.database["users"]
        self._ensure_indexes()
        self._seed_if_empty()
        self._ensure_mission_fields()
        self._ensure_driver_fields()
        self._ensure_user_fields()

    def _ensure_indexes(self) -> None:
        self.missions.create_index("id", unique=True)
        self.missions.create_index("status")
        self.missions.create_index("assigned_driver_id")
        self.drivers.create_index("id", unique=True)
        self.drivers.create_index("status")
        self.driver_requests.create_index("id", unique=True)
        self.driver_requests.create_index("status")
        self.mission_requests.create_index("id", unique=True)
        self.mission_requests.create_index("status")
        self.mission_requests.create_index("mission_id")
        self.mission_requests.create_index("driver_id")
        self.messages.create_index("id", unique=True)
        self.messages.create_index([("sender_role", 1), ("sender_id", 1)])
        self.messages.create_index([("recipient_role", 1), ("recipient_id", 1)])
        self.messages.create_index("created_at")
        self.messages.create_index("read_at")
        self.support_tickets.create_index("id", unique=True)
        self.support_tickets.create_index("user_id")
        self.support_tickets.create_index("status")
        self.support_tickets.create_index("created_at")
        self.users.create_index("username", unique=True)
        self.users.create_index("role")

    def _seed_if_empty(self) -> None:
        sample_db = InMemoryDB()

        if not self.missions.estimated_document_count():
            self.missions.insert_many([
                _to_mongo_value(mission)
                for mission in sample_db.get_all_missions()
            ])

        if not self.drivers.estimated_document_count():
            self.drivers.insert_many([
                _to_mongo_value(driver)
                for driver in sample_db.get_all_drivers()
            ])

        if not self.driver_requests.estimated_document_count():
            self.driver_requests.insert_many([
                _to_mongo_value(request)
                for request in SAMPLE_DRIVER_REQUESTS
            ])

        if not self.users.estimated_document_count():
            self.users.insert_many([
                _to_mongo_value(user)
                for user in get_seed_users().values()
            ])

    def _ensure_mission_fields(self) -> None:
        self.missions.update_many(
            {"ideal_delivery_time": {"$exists": False}},
            {"$set": {"ideal_delivery_time": None}},
        )
        for mission in self.missions.find({"ideal_delivery_time": {"$type": "int"}}):
            created_at = mission.get("created_at") or datetime.now(timezone.utc)
            self.missions.update_one(
                {"_id": mission["_id"]},
                {
                    "$set": {
                        "ideal_delivery_time": created_at
                        + timedelta(minutes=mission["ideal_delivery_time"]),
                    },
                },
            )
        self.missions.update_many(
            {"delivered_at": {"$exists": False}},
            {"$set": {"delivered_at": None}},
        )
        self.missions.update_many(
            {"cancellation_history": {"$exists": False}},
            {"$set": {"cancellation_history": []}},
        )
        for mission in self.missions.find({
            "status": MissionStatus.delivered.value,
            "delivered_at": None,
        }):
            delivered_at = mission.get("updated_at")
            if delivered_at is not None:
                self.missions.update_one(
                    {"_id": mission["_id"]},
                    {"$set": {"delivered_at": delivered_at}},
                )

    def _ensure_driver_fields(self) -> None:
        self.drivers.update_many(
            {"joined_at": {"$exists": False}},
            {"$set": {"joined_at": datetime.now(timezone.utc)}},
        )
        self.drivers.update_many(
            {"history_score": {"$exists": False}},
            {"$set": {"history_score": []}},
        )
        self.drivers.update_many(
            {"availability_dates": {"$exists": False}},
            {"$set": {"availability_dates": []}},
        )

    def _ensure_user_fields(self) -> None:
        for user in get_seed_users().values():
            self.users.update_one(
                {"username": user["username"]},
                {"$setOnInsert": _to_mongo_value(user)},
                upsert=True,
            )
        self.users.update_one(
            {"username": "dispatcher1", "name": {"$exists": False}},
            {"$set": {"name": "Operations Dispatcher"}},
        )

    def _all(self, collection: Collection, query: Optional[Dict[str, Any]] = None) -> List[dict]:
        return [
            _without_object_id(document)
            for document in collection.find(query or {})
        ]

    def _one(self, collection: Collection, query: Dict[str, Any]) -> Optional[dict]:
        return _without_object_id(collection.find_one(query))

    def get_all_missions(self) -> List[dict]:
        return self._all(self.missions)

    def get_mission_by_id(self, mission_id: str) -> Optional[dict]:
        return self._one(self.missions, {"id": mission_id})

    def create_mission(self, mission_data: dict) -> dict:
        mission_data = _to_mongo_value(mission_data)
        mission_data.setdefault("ideal_delivery_time", None)
        mission_data.setdefault("delivered_at", None)
        mission_data.setdefault("cancellation_history", [])
        self.missions.insert_one(mission_data)
        return self.get_mission_by_id(mission_data["id"]) or mission_data

    def update_mission_status(
        self,
        mission_id: str,
        status: str,
        driver_id: Optional[str] = None,
    ) -> Optional[dict]:
        updates: Dict[str, Any] = {
            "status": status,
            "updated_at": datetime.now(timezone.utc),
        }
        if status == MissionStatus.delivered.value:
            updates["delivered_at"] = updates["updated_at"]
        if driver_id is not None:
            updates["assigned_driver_id"] = driver_id

        self.missions.update_one({"id": mission_id}, {"$set": updates})
        return self.get_mission_by_id(mission_id)

    def cancel_mission_assignment(
        self,
        mission_id: str,
        cancellation_record: dict,
        final_status: str = MissionStatus.available.value,
    ) -> Optional[dict]:
        updates: Dict[str, Any] = {
            "status": final_status,
            "assigned_driver_id": None,
            "updated_at": datetime.now(timezone.utc),
        }
        self.missions.update_one(
            {"id": mission_id},
            {
                "$set": updates,
                "$push": {
                    "cancellation_history": _to_mongo_value(cancellation_record),
                },
            },
        )
        return self.get_mission_by_id(mission_id)
    
    def update_mission_details(self,mission_id:str, updates:dict)-> Optional[dict]:   
        fields = {
            "title",
            "description",
            "cargo",
            "pickup",
            "dropoff",
            "priority",
            "ideal_delivery_time",
        }
        clean_updates = {
            key:_to_mongo_value(value)
            for key,value in updates.items()
            if key in fields and value is not None
        }
        if not clean_updates:
            return self.get_mission_by_id(mission_id)
        clean_updates["updated_at"] = datetime.now(timezone.utc)
        self.missions.update_one(
            {"id": mission_id},
            {"$set": clean_updates},
        )
        return self.get_mission_by_id(mission_id)



    def get_missions_by_status(self, status: str) -> List[dict]:
        return self._all(self.missions, {"status": status})

    def get_missions_by_driver(self, driver_id: str) -> List[dict]:
        return self._all(self.missions, {"assigned_driver_id": driver_id})

    def get_all_drivers(self) -> List[dict]:
        return self._all(self.drivers)

    def get_driver_by_id(self, driver_id: str) -> Optional[dict]:
        return self._one(self.drivers, {"id": driver_id})

    def create_driver(self, driver_data: dict) -> dict:
        driver_data = _to_mongo_value(driver_data)
        driver_data.setdefault("joined_at", datetime.now(timezone.utc))
        self.drivers.insert_one(driver_data)
        return self.get_driver_by_id(driver_data["id"]) or driver_data

    def update_driver_status(
        self,
        driver_id: str,
        status: str,
        mission_id: Optional[str] = None,
    ) -> Optional[dict]:
        updates: Dict[str, Any] = {"status": status, "current_mission_id": mission_id}
        self.drivers.update_one({"id": driver_id}, {"$set": updates})
        return self.get_driver_by_id(driver_id)

    def update_driver_location(
        self,
        driver_id: str,
        location: dict,
    ) -> Optional[dict]:
        self.drivers.update_one(
            {"id": driver_id},
            {"$set": {"current_location": _to_mongo_value(location)}},
        )
        return self.get_driver_by_id(driver_id)

    def update_driver_availability_dates(
        self,
        driver_id: str,
        availability_dates: List[str],
    ) -> Optional[dict]:
        self.drivers.update_one(
            {"id": driver_id},
            {"$set": {"availability_dates": availability_dates}},
        )
        return self.get_driver_by_id(driver_id)

    def count_pending_driver_requests(self) -> int:
        return self.driver_requests.count_documents({"status": "pending"})

    def list_driver_requests(self, status_filter: Optional[str] = None) -> List[dict]:
        query = {"status": status_filter} if status_filter else None
        return self._all(self.driver_requests, query)

    def get_driver_request_by_id(self, request_id: str) -> Optional[dict]:
        return self._one(self.driver_requests, {"id": request_id})

    def create_driver_request(self, request_data: dict) -> dict:
        request_data = _to_mongo_value(request_data)
        self.driver_requests.insert_one(request_data)
        return self.get_driver_request_by_id(request_data["id"]) or request_data

    def review_driver_request(self, request_id: str, next_status: str) -> Optional[dict]:
        self.driver_requests.update_one(
            {"id": request_id},
            {
                "$set": {
                    "status": next_status,
                    "reviewed_at": datetime.now(timezone.utc).isoformat(),
                },
            },
        )
        return self.get_driver_request_by_id(request_id)
    
    def update_driver_score(
        self,
        driver_id: str,
        score: int,
        mission: Optional[dict] = None,
    ) -> Optional[dict]:
        score_record: Dict[str, Any] = {
            "score": score,
            "date": datetime.now(timezone.utc),
        }
        if mission is not None:
            score_record["mission_id"] = mission.get("id")
            score_record["mission_title"] = mission.get("title")

        self.drivers.update_one(
            {"id": driver_id},
            {
                "$set": {"score": score},
                "$push": {"history_score": _to_mongo_value(score_record)},
            },
        )
        return self._one(self.drivers, {"id": driver_id})

    def get_user_by_username(self, username: str) -> Optional[dict]:
        return self._one(self.users, {"username": username})

    def list_users(self, role_filter: Optional[str] = None) -> List[dict]:
        query = {"role": role_filter} if role_filter else None
        return self._all(self.users, query)

    def create_message(self, message_data: dict) -> dict:
        message_data = _to_mongo_value(message_data)
        self.messages.insert_one(message_data)
        return self._one(self.messages, {"id": message_data["id"]}) or message_data

    def list_messages_for_user(self, user_id: str, user_role: str) -> List[dict]:
        return [
            _without_object_id(document)
            for document in self.messages.find(
                {
                    "$or": [
                        {"sender_id": user_id, "sender_role": user_role},
                        {"recipient_id": user_id, "recipient_role": user_role},
                    ],
                }
            ).sort("created_at", -1)
        ]

    def list_conversation_messages(
        self,
        user_id: str,
        user_role: str,
        participant_id: str,
        participant_role: str,
    ) -> List[dict]:
        return [
            _without_object_id(document)
            for document in self.messages.find(
                {
                    "$or": [
                        {
                            "sender_id": user_id,
                            "sender_role": user_role,
                            "recipient_id": participant_id,
                            "recipient_role": participant_role,
                        },
                        {
                            "sender_id": participant_id,
                            "sender_role": participant_role,
                            "recipient_id": user_id,
                            "recipient_role": user_role,
                        },
                    ],
                }
            ).sort("created_at", 1)
        ]

    def mark_conversation_messages_read(
        self,
        user_id: str,
        user_role: str,
        participant_id: str,
        participant_role: str,
        read_at: datetime,
    ) -> int:
        result = self.messages.update_many(
            {
                "sender_id": participant_id,
                "sender_role": participant_role,
                "recipient_id": user_id,
                "recipient_role": user_role,
                "read_at": None,
            },
            {"$set": {"read_at": read_at}},
        )
        return result.modified_count

    def create_support_ticket(self, ticket_data: dict) -> dict:
        ticket_data = _to_mongo_value(ticket_data)
        self.support_tickets.insert_one(ticket_data)
        return self._one(self.support_tickets, {"id": ticket_data["id"]}) or ticket_data

    def list_support_tickets(self) -> List[dict]:
        return [
            _without_object_id(document)
            for document in self.support_tickets.find({}).sort("created_at", -1)
        ]

    def create_mission_request(self, request_data: dict) -> dict:
        existing = self.mission_requests.find_one({
            "mission_id": request_data["mission_id"],
            "driver_id": request_data["driver_id"],
            "status": "pending",
        })
        if existing:
            return _without_object_id(existing) or request_data

        request_data = _to_mongo_value(request_data)
        self.mission_requests.insert_one(request_data)
        return self.get_mission_request_by_id(request_data["id"]) or request_data

    def get_mission_request_by_id(self, request_id: str) -> Optional[dict]:
        return self._one(self.mission_requests, {"id": request_id})

    def list_mission_requests(self, status_filter: Optional[str] = None) -> List[dict]:
        query = {"status": status_filter} if status_filter else None
        return self._all(self.mission_requests, query)

    def review_mission_request(self, request_id: str, next_status: str) -> Optional[dict]:
        updates: Dict[str, Any] = {
            "status": next_status,
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
        }
        self.mission_requests.update_one({"id": request_id}, {"$set": updates})
        return self.get_mission_request_by_id(request_id)

    def decline_other_mission_requests(self, mission_id: str, approved_request_id: str) -> None:
        self.mission_requests.update_many(
            {
                "mission_id": mission_id,
                "id": {"$ne": approved_request_id},
                "status": "pending",
            },
            {
                "$set": {
                    "status": "declined",
                    "reviewed_at": datetime.now(timezone.utc).isoformat(),
                },
            },
        )

    def reset_sample_data(self) -> None:
        self.missions.delete_many({})
        self.drivers.delete_many({})
        self.driver_requests.delete_many({})
        self.mission_requests.delete_many({})
        self.messages.delete_many({})
        self.support_tickets.delete_many({})
        self.users.delete_many({})
        self._seed_if_empty()
