"""
Authentication module for FileForge.

Provides session-based and API key authentication.
"""

from packages.common.auth.api_key import (
    API_KEY_HEADER,
    RequireAPIKey,
    get_api_key,
    get_api_key_header,
    verify_api_key,
)
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
    # API key auth
    "API_KEY_HEADER",
    "get_api_key_header",
    "get_api_key",
    "verify_api_key",
    "RequireAPIKey",
]
