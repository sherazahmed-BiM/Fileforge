"""
Authentication module for FileForge.

Provides API key authentication and rate limiting.
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


__all__ = [
    "get_api_key",
    "get_optional_api_key",
    "verify_api_key",
    "RateLimiter",
    "check_rate_limit",
]
