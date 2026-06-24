"""Backward-compatible auth imports.

New code should import from app.core.security.
"""

from app.core.security import *  # noqa: F401,F403
