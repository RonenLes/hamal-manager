"""Backward-compatible websocket manager imports.

New code should import from app.realtime.websocket_manager.
"""

from .realtime.websocket_manager import ConnectionManager

__all__ = ["ConnectionManager"]
