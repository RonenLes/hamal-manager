"""Backward-compatible application state imports.

New code should import from app.database.state.
"""

from .database.state import db, manager

__all__ = ["db", "manager"]
