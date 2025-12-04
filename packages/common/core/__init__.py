"""
Core module for FileForge.

Provides configuration, database, celery, and logging utilities.
"""

from packages.common.core.celery_app import celery_app
from packages.common.core.config import settings
from packages.common.core.database import (
    AsyncSessionLocal,
    Base,
    close_db,
    engine,
    get_db,
    get_db_context,
    init_db,
)
from packages.common.core.logging import get_logger, setup_logging


__all__ = [
    "settings",
    "engine",
    "AsyncSessionLocal",
    "Base",
    "get_db",
    "get_db_context",
    "init_db",
    "close_db",
    "celery_app",
    "setup_logging",
    "get_logger",
]
