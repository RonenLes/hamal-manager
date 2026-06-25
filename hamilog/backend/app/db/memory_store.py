"""Backward-compatible in-memory store imports.

New code should import from app.database.memory_store.
"""

from ..database.memory_store import InMemoryDB

__all__ = ["InMemoryDB"]
