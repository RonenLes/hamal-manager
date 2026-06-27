from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from ..features.drivers.models import CarType, Driver, DriverStatus
from ..features.missions.models import CargoSpecifications, Mission, MissionStatus, Priority
from ..shared.models import Location


class InMemoryDB:
    """
    A lightweight, dict-backed store that mirrors the interface we would
    expose through Motor/MongoDB.  Pre-seeded with sample data so the app
    is immediately functional without any external database.
    """

    def __init__(self) -> None:
        self.missions: Dict[str, dict] = {}
        self.drivers: Dict[str, dict] = {}
        self.driver_requests: Dict[str, dict] = {}
        self.mission_requests: Dict[str, dict] = {}
        self.messages: Dict[str, dict] = {}
        self.support_tickets: Dict[str, dict] = {}
        self.users: Dict[str, dict] = {}
        self._seed()

    # ----- seeding ----------------------------------------------------------

    def _seed(self) -> None:
        """Populate the store with realistic sample missions and drivers."""
        now = datetime.now(timezone.utc)
        two_hours_ago = now - timedelta(hours=2)
        six_hours_ago = now - timedelta(hours=6)
        yesterday = now - timedelta(days=1)
        two_days_ago = now - timedelta(days=2)
        three_days_ago = now - timedelta(days=3)
        four_days_ago = now - timedelta(days=4)

        sample_missions: List[Mission] = [
            Mission(
                id="msn_001",
                title="Medical Supplies to Shelter A",
                description="Urgent delivery of first-aid kits and medications to the northern shelter.",
                status=MissionStatus.available,
                cargo=CargoSpecifications(volume_liters=45.0, weight_kg=30.0, requires_cooling=True),
                pickup=Location(lat=32.0853, lng=34.7818, address="Tel Aviv Medical Center"),
                dropoff=Location(lat=32.1093, lng=34.8553, address="Shelter A, Ramat Gan"),
                priority=Priority.critical,
                created_at=now,
                updated_at=now,
            ),
            Mission(
                id="msn_002",
                title="Food Packages — Downtown Distribution",
                description="120 family food packages for downtown distribution point.",
                status=MissionStatus.available,
                cargo=CargoSpecifications(volume_liters=1800.0, weight_kg=450.0, requires_cooling=False),
                pickup=Location(lat=32.0667, lng=34.7667, address="Central Warehouse, Tel Aviv"),
                dropoff=Location(lat=32.0700, lng=34.7700, address="Downtown Distribution Center"),
                priority=Priority.high,
                created_at=now,
                updated_at=now,
            ),
            Mission(
                id="msn_003",
                title="Blankets to Community Center",
                description="50 thermal blankets for overnight volunteers.",
                status=MissionStatus.available,
                cargo=CargoSpecifications(volume_liters=500.0, weight_kg=80.0, requires_cooling=False),
                pickup=Location(lat=31.7683, lng=35.2137, address="Jerusalem Logistics Hub"),
                dropoff=Location(lat=31.7750, lng=35.2200, address="Community Center, Jerusalem"),
                priority=Priority.medium,
                created_at=now,
                updated_at=now,
            ),
            Mission(
                id="msn_004",
                title="Frozen Vaccines — Clinic B",
                description="Temperature-sensitive vaccines requiring cold-chain transport.",
                status=MissionStatus.available,
                cargo=CargoSpecifications(volume_liters=30.0, weight_kg=15.0, requires_cooling=True),
                pickup=Location(lat=32.7940, lng=34.9896, address="Haifa Pharma Depot"),
                dropoff=Location(lat=32.8000, lng=35.0000, address="Clinic B, Haifa"),
                priority=Priority.critical,
                created_at=now,
                updated_at=now,
            ),
            Mission(
                id="msn_005",
                title="Office Supplies — HQ Restock",
                description="Paper, pens, and printer cartridges for the operations HQ.",
                status=MissionStatus.available,
                cargo=CargoSpecifications(volume_liters=120.0, weight_kg=40.0, requires_cooling=False),
                pickup=Location(lat=32.0853, lng=34.7818, address="Office Depot, Tel Aviv"),
                dropoff=Location(lat=32.0900, lng=34.7900, address="Hamilog HQ"),
                priority=Priority.low,
                created_at=now,
                updated_at=now,
            ),
            Mission(
                id="msn_006",
                title="Water Pallets — Southern Outpost",
                description="Heavy pallet of bottled water for southern volunteer outpost.",
                status=MissionStatus.available,
                cargo=CargoSpecifications(volume_liters=1500.0, weight_kg=480.0, requires_cooling=False),
                pickup=Location(lat=31.2530, lng=34.7915, address="Be'er Sheva Warehouse"),
                dropoff=Location(lat=31.2600, lng=34.8000, address="Southern Outpost"),
                priority=Priority.high,
                created_at=now,
                updated_at=now,
            ),
            Mission(
                id="msn_007",
                title="Generator Parts to Field Team",
                description="Replacement generator cables and filters for the Jerusalem field team.",
                status=MissionStatus.assigned,
                cargo=CargoSpecifications(volume_liters=220.0, weight_kg=95.0, requires_cooling=False),
                pickup=Location(lat=31.7810, lng=35.2100, address="Jerusalem Equipment Depot"),
                dropoff=Location(lat=31.7930, lng=35.2250, address="Field Team Staging Area"),
                assigned_driver_id="drv_002",
                priority=Priority.high,
                created_at=two_hours_ago,
                updated_at=two_hours_ago,
            ),
            Mission(
                id="msn_008",
                title="Emergency Radios to Haifa Command",
                description="Battery packs and emergency radio units for live operations.",
                status=MissionStatus.in_transit,
                cargo=CargoSpecifications(volume_liters=160.0, weight_kg=70.0, requires_cooling=False),
                pickup=Location(lat=32.7925, lng=34.9870, address="Haifa Logistics Annex"),
                dropoff=Location(lat=32.8070, lng=35.0030, address="Haifa Command Center"),
                assigned_driver_id="drv_003",
                priority=Priority.critical,
                created_at=six_hours_ago,
                updated_at=two_hours_ago,
            ),
            Mission(
                id="msn_009",
                title="Baby Formula to Family Center",
                description="Sealed cartons of baby formula and hygiene kits.",
                status=MissionStatus.delivered,
                cargo=CargoSpecifications(volume_liters=180.0, weight_kg=45.0, requires_cooling=False),
                pickup=Location(lat=32.0640, lng=34.7710, address="Tel Aviv Relief Warehouse"),
                dropoff=Location(lat=32.1010, lng=34.8120, address="Family Support Center"),
                assigned_driver_id="drv_001",
                priority=Priority.medium,
                created_at=yesterday,
                updated_at=yesterday + timedelta(hours=3),
            ),
            Mission(
                id="msn_010",
                title="Cancelled Clothing Transfer",
                description="Clothing transfer cancelled after receiving site reported enough stock.",
                status=MissionStatus.cancelled,
                cargo=CargoSpecifications(volume_liters=350.0, weight_kg=60.0, requires_cooling=False),
                pickup=Location(lat=32.0905, lng=34.7755, address="North Tel Aviv Donation Center"),
                dropoff=Location(lat=32.1210, lng=34.8125, address="Temporary Shelter C"),
                priority=Priority.low,
                created_at=two_days_ago,
                updated_at=two_days_ago + timedelta(hours=1),
            ),
            Mission(
                id="msn_011",
                title="Hygiene Kits to Ashdod Shelter",
                description="Completed delivery of hygiene kits and towels.",
                status=MissionStatus.delivered,
                cargo=CargoSpecifications(volume_liters=260.0, weight_kg=110.0, requires_cooling=False),
                pickup=Location(lat=31.8000, lng=34.6500, address="Ashdod Supply Hub"),
                dropoff=Location(lat=31.8050, lng=34.6550, address="Ashdod Shelter"),
                assigned_driver_id="drv_001",
                priority=Priority.high,
                created_at=three_days_ago,
                updated_at=three_days_ago + timedelta(hours=4),
            ),
            Mission(
                id="msn_012",
                title="Cold Medicine to Pediatric Clinic",
                description="Delivered temperature-sensitive pediatric medicine.",
                status=MissionStatus.delivered,
                cargo=CargoSpecifications(volume_liters=25.0, weight_kg=12.0, requires_cooling=True),
                pickup=Location(lat=32.0853, lng=34.7818, address="Tel Aviv Medical Center"),
                dropoff=Location(lat=32.0950, lng=34.8300, address="Pediatric Clinic, Givatayim"),
                assigned_driver_id="drv_004",
                priority=Priority.critical,
                created_at=four_days_ago,
                updated_at=four_days_ago + timedelta(hours=2),
            ),
            Mission(
                id="msn_013",
                title="Volunteer Meals to Night Shift",
                description="Delivered packed meals for night-shift volunteers.",
                status=MissionStatus.delivered,
                cargo=CargoSpecifications(volume_liters=90.0, weight_kg=28.0, requires_cooling=False),
                pickup=Location(lat=31.2530, lng=34.7915, address="Be'er Sheva Kitchen"),
                dropoff=Location(lat=31.2600, lng=34.8000, address="Southern Outpost"),
                assigned_driver_id="drv_003",
                priority=Priority.medium,
                created_at=two_days_ago,
                updated_at=two_days_ago + timedelta(hours=5),
            ),
        ]

        sample_drivers: List[Driver] = [
            Driver(
                id="drv_001",
                name="Alice Ronen",
                email="alice@hamilog.dev",
                phone="+972-50-111-1111",
                car_type=CarType.sedan,
                status=DriverStatus.available,
                current_location=Location(lat=32.0800, lng=34.7800, address="Central Tel Aviv"),
                score=94,
                joined_at=now,
            ),
            Driver(
                id="drv_002",
                name="Bob Levi",
                email="bob@hamilog.dev",
                phone="+972-50-222-2222",
                car_type=CarType.suv,
                status=DriverStatus.available,
                current_location=Location(lat=31.7700, lng=35.2100, address="Jerusalem Center"),
                score=82,
                joined_at=now,
            ),
            Driver(
                id="drv_003",
                name="Carol Mizrahi",
                email="carol@hamilog.dev",
                phone="+972-50-333-3333",
                car_type=CarType.van,
                status=DriverStatus.on_mission,
                current_location=Location(lat=32.7900, lng=34.9900, address="Haifa Port Area"),
                current_mission_id="msn_008",
                score=88,
                joined_at=now,
            ),
            Driver(
                id="drv_004",
                name="Dan Shapira",
                email="dan@hamilog.dev",
                phone="+972-50-444-4444",
                car_type=CarType.refrigerated_van,
                status=DriverStatus.available,
                current_location=Location(lat=32.0900, lng=34.7850, address="North Tel Aviv"),
                score=91,
                joined_at=now,
            ),
            Driver(
                id="drv_005",
                name="Eyal Barak",
                email="eyal@hamilog.dev",
                phone="+972-50-555-5555",
                car_type=CarType.suv,
                status=DriverStatus.offline,
                current_location=Location(lat=31.2520, lng=34.7860, address="Be'er Sheva"),
                score=67,
                joined_at=now,
            ),
            Driver(
                id="drv_006",
                name="Maya Cohen",
                email="maya@hamilog.dev",
                phone="+972-50-666-6666",
                car_type=CarType.van,
                status=DriverStatus.blacklisted,
                current_location=Location(lat=32.1663, lng=34.8433, address="Herzliya"),
                score=42,
                joined_at=now,
            ),
        ]

        for m in sample_missions:
            mission = m.model_dump()
            mission["ideal_delivery_time"] = (
                mission.get("ideal_delivery_time")
                or mission["created_at"] + timedelta(hours=2)
            )
            mission.setdefault("cancellation_history", [])
            if mission.get("status") == MissionStatus.delivered.value:
                mission["delivered_at"] = mission.get("updated_at")
            self.missions[m.id] = mission
        for d in sample_drivers:
            self.drivers[d.id] = d.model_dump()

        from ..features.driver_requests.service import SAMPLE_DRIVER_REQUESTS

        for request in SAMPLE_DRIVER_REQUESTS:
            self.driver_requests[request["id"]] = request.copy()

        from ..core.security import get_seed_users

        for username, user in get_seed_users().items():
            self.users[username] = user

    # ----- Mission CRUD -----------------------------------------------------

    def get_all_missions(self) -> List[dict]:
        """Return every mission in the store."""
        return list(self.missions.values())

    def get_mission_by_id(self, mission_id: str) -> Optional[dict]:
        """Fetch a single mission by its ID, or ``None``."""
        return self.missions.get(mission_id)

    def create_mission(self, mission_data: dict) -> dict:
        """
        Insert a new mission.  If no ``id`` is provided one will be
        auto-generated.  Timestamps are set to *now*.
        """
        now = datetime.now(timezone.utc)
        mission_data.setdefault("id", f"msn_{uuid.uuid4().hex[:8]}")
        mission_data.setdefault("status", MissionStatus.available.value)
        mission_data.setdefault(
            "ideal_delivery_time",
            now + timedelta(hours=2),
        )
        mission_data.setdefault("delivered_at", None)
        mission_data.setdefault("cancellation_history", [])
        mission_data.setdefault("created_at", now)
        mission_data["updated_at"] = now
        self.missions[mission_data["id"]] = mission_data
        return mission_data

    def update_mission_status(
        self,
        mission_id: str,
        status: str,
        driver_id: Optional[str] = None,
    ) -> Optional[dict]:
        """
        Transition a mission to a new status.  Optionally attach a driver.
        Returns the updated mission dict, or ``None`` if not found.
        """
        mission = self.missions.get(mission_id)
        if mission is None:
            return None
        mission["status"] = status
        now = datetime.now(timezone.utc)
        mission["updated_at"] = now
        if status == MissionStatus.delivered.value:
            mission["delivered_at"] = now
        if driver_id is not None:
            mission["assigned_driver_id"] = driver_id
        return mission

    def cancel_mission_assignment(
        self,
        mission_id: str,
        cancellation_record: dict,
        final_status: str = MissionStatus.available.value,
    ) -> Optional[dict]:
        mission = self.missions.get(mission_id)
        if mission is None:
            return None

        now = datetime.now(timezone.utc)
        mission.setdefault("cancellation_history", []).append(cancellation_record)
        mission["status"] = final_status
        mission["assigned_driver_id"] = None
        mission["updated_at"] = now
        return mission
    
    def update_mission_details(self,mission_id:str, updates:dict)-> Optional[dict]:
        mission = self.missions.get(mission_id)
        if mission is None: return None
        fields = {
            "title",
            "description",
            "cargo",
            "pickup",
            "dropoff",
            "priority",
            "ideal_delivery_time",
        }
        for key,value in updates.items():
            if key in fields and value is not None:
                mission[key] = value
        mission["updated_at"]=datetime.now(timezone.utc)
        return mission

    def get_missions_by_status(self, status: str) -> List[dict]:
        """Return all missions that match the given status string."""
        return [m for m in self.missions.values() if m.get("status") == status]

    def get_missions_by_driver(self, driver_id: str) -> List[dict]:
        """Return missions currently assigned to a specific driver."""
        return [
            m for m in self.missions.values()
            if m.get("assigned_driver_id") == driver_id
        ]

    # ----- Driver CRUD ------------------------------------------------------

    def get_all_drivers(self) -> List[dict]:
        """Return every driver in the store."""
        return list(self.drivers.values())

    def get_driver_by_id(self, driver_id: str) -> Optional[dict]:
        """Fetch a single driver by ID, or ``None``."""
        return self.drivers.get(driver_id)

    def create_driver(self, driver_data: dict) -> dict:
        """Insert a new driver into the store."""
        driver_data.setdefault("joined_at", datetime.now(timezone.utc))
        self.drivers[driver_data["id"]] = driver_data
        return driver_data

    def update_driver_status(
        self,
        driver_id: str,
        status: str,
        mission_id: Optional[str] = None,
    ) -> Optional[dict]:
        """
        Change a driver's availability status and optionally link them to
        a mission.  Returns ``None`` if the driver is not found.
        """
        driver = self.drivers.get(driver_id)
        if driver is None:
            return None
        driver["status"] = status
        driver["current_mission_id"] = mission_id
        return driver

    def update_driver_location(
        self,
        driver_id: str,
        location: dict,
    ) -> Optional[dict]:
        """
        Store the latest GPS fix for a driver.  Called by the GPS WebSocket
        handler.
        """
        driver = self.drivers.get(driver_id)
        if driver is None:
            return None
        driver["current_location"] = location
        return driver

    # ----- Driver Request CRUD --------------------------------------------

    def count_pending_driver_requests(self) -> int:
        """Return the number of pending driver signup requests."""
        return sum(
            1
            for request in self.driver_requests.values()
            if request.get("status") == "pending"
        )

    def list_driver_requests(self, status_filter: Optional[str] = None) -> List[dict]:
        """Return driver requests, optionally filtered by review status."""
        requests = list(self.driver_requests.values())
        if status_filter is None:
            return requests
        return [
            request
            for request in requests
            if request.get("status") == status_filter
        ]

    def get_driver_request_by_id(self, request_id: str) -> Optional[dict]:
        """Fetch a single driver request by ID, or ``None``."""
        return self.driver_requests.get(request_id)

    def review_driver_request(self, request_id: str, next_status: str) -> Optional[dict]:
        """Approve or decline a pending driver request."""
        request = self.driver_requests.get(request_id)
        if request is None:
            return None
        request["status"] = next_status
        request["reviewed_at"] = datetime.now(timezone.utc).isoformat()
        return request

    # ----- User CRUD -------------------------------------------------------

    def get_user_by_username(self, username: str) -> Optional[dict]:
        """Fetch a user login record by username, or ``None``."""
        return self.users.get(username)

    def list_users(self, role_filter: Optional[str] = None) -> List[dict]:
        users = list(self.users.values())
        if role_filter is None:
            return users
        return [user for user in users if user.get("role") == role_filter]

    # ----- Message CRUD ----------------------------------------------------

    def create_message(self, message_data: dict) -> dict:
        self.messages[message_data["id"]] = message_data
        return message_data

    def list_messages_for_user(self, user_id: str, user_role: str) -> List[dict]:
        messages = [
            message
            for message in self.messages.values()
            if (
                message.get("sender_id") == user_id
                and message.get("sender_role") == user_role
            )
            or (
                message.get("recipient_id") == user_id
                and message.get("recipient_role") == user_role
            )
        ]
        return sorted(
            messages,
            key=lambda message: message.get("created_at"),
            reverse=True,
        )

    def list_conversation_messages(
        self,
        user_id: str,
        user_role: str,
        participant_id: str,
        participant_role: str,
    ) -> List[dict]:
        messages = [
            message
            for message in self.messages.values()
            if (
                message.get("sender_id") == user_id
                and message.get("sender_role") == user_role
                and message.get("recipient_id") == participant_id
                and message.get("recipient_role") == participant_role
            )
            or (
                message.get("sender_id") == participant_id
                and message.get("sender_role") == participant_role
                and message.get("recipient_id") == user_id
                and message.get("recipient_role") == user_role
            )
        ]
        return sorted(messages, key=lambda message: message.get("created_at"))

    def mark_conversation_messages_read(
        self,
        user_id: str,
        user_role: str,
        participant_id: str,
        participant_role: str,
        read_at: datetime,
    ) -> int:
        updated = 0
        for message in self.messages.values():
            if (
                message.get("sender_id") == participant_id
                and message.get("sender_role") == participant_role
                and message.get("recipient_id") == user_id
                and message.get("recipient_role") == user_role
                and message.get("read_at") is None
            ):
                message["read_at"] = read_at
                updated += 1

        return updated

    # ----- Support Ticket CRUD --------------------------------------------

    def create_support_ticket(self, ticket_data: dict) -> dict:
        self.support_tickets[ticket_data["id"]] = ticket_data
        return ticket_data

    def list_support_tickets(self) -> List[dict]:
        return sorted(
            self.support_tickets.values(),
            key=lambda ticket: ticket.get("created_at"),
            reverse=True,
        )

    # ----- Mission Request CRUD -------------------------------------------

    def create_mission_request(self, request_data: dict) -> dict:
        """Create or return an existing pending request for a mission/driver."""
        for request in self.mission_requests.values():
            if (
                request.get("mission_id") == request_data["mission_id"]
                and request.get("driver_id") == request_data["driver_id"]
                and request.get("status") == "pending"
            ):
                return request

        self.mission_requests[request_data["id"]] = request_data
        return request_data

    def get_mission_request_by_id(self, request_id: str) -> Optional[dict]:
        """Fetch a single mission request by ID, or ``None``."""
        return self.mission_requests.get(request_id)

    def list_mission_requests(self, status_filter: Optional[str] = None) -> List[dict]:
        """Return mission delivery requests, optionally filtered by status."""
        requests = list(self.mission_requests.values())
        if status_filter is None:
            return requests
        return [
            request
            for request in requests
            if request.get("status") == status_filter
        ]

    def review_mission_request(self, request_id: str, next_status: str) -> Optional[dict]:
        """Approve or decline a driver request to take a mission."""
        request = self.mission_requests.get(request_id)
        if request is None:
            return None
        request["status"] = next_status
        request["reviewed_at"] = datetime.now(timezone.utc).isoformat()
        return request

    def decline_other_mission_requests(self, mission_id: str, approved_request_id: str) -> None:
        """Decline other pending requests once a mission is assigned."""
        reviewed_at = datetime.now(timezone.utc).isoformat()
        for request in self.mission_requests.values():
            if (
                request.get("mission_id") == mission_id
                and request.get("id") != approved_request_id
                and request.get("status") == "pending"
            ):
                request["status"] = "declined"
                request["reviewed_at"] = reviewed_at
