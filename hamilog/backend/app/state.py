from missions_DB_module import InMemoryDB

from .mongo_store import MongoDB
from .websocket_manager import ConnectionManager

try:
    db = MongoDB()
except Exception:
    db = InMemoryDB()

manager = ConnectionManager()
