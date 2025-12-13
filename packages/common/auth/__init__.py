"""
Authentication module for FileForge.

Provides session-based authentication.
"""

from packages.common.auth.session import (
    SESSION_COOKIE_NAME,
    clear_session_cookie,
    get_current_user,
    get_optional_user,
    get_session_token,
    set_session_cookie,
)


__all__ = [
    # Session auth
    "SESSION_COOKIE_NAME",
    "get_session_token",
    "get_current_user",
    "get_optional_user",
    "set_session_cookie",
    "clear_session_cookie",
]
