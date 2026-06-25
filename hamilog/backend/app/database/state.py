from ..realtime.websocket_manager import ConnectionManager
from .memory_store import InMemoryDB
from .mongo_store import MongoDB

try:
    db = MongoDB()
except Exception:
    db = InMemoryDB()

manager = ConnectionManager()
