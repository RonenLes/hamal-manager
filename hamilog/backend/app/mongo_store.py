"""Backward-compatible Mongo store imports.

New code should import from app.database.mongo_store.
"""

from .database.mongo_store import MongoDB

__all__ = ["MongoDB"]
