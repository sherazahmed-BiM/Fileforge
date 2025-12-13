"""
Authentication module for FileForge.

Provides API key authentication, session authentication, and rate limiting.
"""

from packages.common.auth.api_key import (
    get_api_key,
    get_optional_api_key,
    verify_api_key,
)
from packages.common.auth.rate_limit import (
    RateLimiter,
    check_rate_limit,
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
    # API Key auth
    "get_api_key",
    "get_optional_api_key",
    "verify_api_key",
    # Rate limiting
    "RateLimiter",
    "check_rate_limit",
    # Session auth
    "SESSION_COOKIE_NAME",
    "get_session_token",
    "get_current_user",
    "get_optional_user",
    "set_session_cookie",
    "clear_session_cookie",
]
