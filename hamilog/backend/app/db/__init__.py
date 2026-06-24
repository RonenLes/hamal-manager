"""Backward-compatible database imports.

New code should import from app.database.
"""

from ..database import InMemoryDB, MongoDB

__all__ = ["InMemoryDB", "MongoDB"]
