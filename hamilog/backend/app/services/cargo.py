"""Backward-compatible cargo service imports.

New code should import from app.features.cargo.service.
"""

from ..features.cargo.service import analyze_cargo_description, mock_parse_cargo

__all__ = ["analyze_cargo_description", "mock_parse_cargo"]
