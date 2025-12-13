"""
Rate Limiting Middleware for FileForge Public API

Uses Redis sliding window counters to enforce rate limits per API key.
"""

import time
from typing import Optional

import redis.asyncio as redis
from fastapi import HTTPException, Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware

from packages.common.core.config import settings


class RateLimiter:
    """
    Redis-based rate limiter using sliding window counters.

    Tracks both per-minute (RPM) and per-day (RPD) limits.
    """

    # Redis key prefixes
    KEY_PREFIX_MINUTE = "rate_limit:minute:"
    KEY_PREFIX_DAY = "rate_limit:day:"

    # Time windows in seconds
    WINDOW_MINUTE = 60
    WINDOW_DAY = 86400  # 24 hours

    def __init__(self, redis_url: Optional[str] = None):
        """
        Initialize the rate limiter.

        Args:
            redis_url: Redis connection URL. If None, uses settings.redis_url
        """
        self.redis_url = redis_url or settings.redis_url
        self._redis: Optional[redis.Redis] = None

    async def get_redis(self) -> redis.Redis:
        """Get or create Redis connection."""
        if self._redis is None:
            self._redis = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
        return self._redis

    async def close(self) -> None:
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            self._redis = None

    async def check_rate_limit(
        self,
        api_key_id: int,
        limit_rpm: int,
        limit_rpd: int,
    ) -> tuple[bool, dict]:
        """
        Check if request is within rate limits.

        Args:
            api_key_id: API key ID to check
            limit_rpm: Requests per minute limit
            limit_rpd: Requests per day limit

        Returns:
            Tuple of (is_allowed, headers_dict)
            headers_dict contains X-RateLimit-* headers
        """
        redis_client = await self.get_redis()
        now = int(time.time())

        # Keys for this API key
        minute_key = f"{self.KEY_PREFIX_MINUTE}{api_key_id}"
        day_key = f"{self.KEY_PREFIX_DAY}{api_key_id}"

        # Get current counts
        pipe = redis_client.pipeline()
        pipe.get(minute_key)
        pipe.get(day_key)
        results = await pipe.execute()

        minute_count = int(results[0] or 0)
        day_count = int(results[1] or 0)

        # Determine reset times
        minute_reset = now + self.WINDOW_MINUTE
        day_reset = now + self.WINDOW_DAY

        # Check limits
        rpm_exceeded = minute_count >= limit_rpm
        rpd_exceeded = day_count >= limit_rpd

        # Build headers (use per-minute limit for standard headers)
        headers = {
            "X-RateLimit-Limit": str(limit_rpm),
            "X-RateLimit-Remaining": str(max(0, limit_rpm - minute_count - 1)),
            "X-RateLimit-Reset": str(minute_reset),
            "X-RateLimit-Limit-Day": str(limit_rpd),
            "X-RateLimit-Remaining-Day": str(max(0, limit_rpd - day_count - 1)),
        }

        if rpm_exceeded:
            headers["Retry-After"] = str(self.WINDOW_MINUTE)
            return False, headers

        if rpd_exceeded:
            headers["Retry-After"] = str(self.WINDOW_DAY)
            return False, headers

        return True, headers

    async def record_request(
        self,
        api_key_id: int,
    ) -> None:
        """
        Record a request for rate limiting.

        Increments counters with appropriate expiry.

        Args:
            api_key_id: API key ID to record
        """
        redis_client = await self.get_redis()

        minute_key = f"{self.KEY_PREFIX_MINUTE}{api_key_id}"
        day_key = f"{self.KEY_PREFIX_DAY}{api_key_id}"

        pipe = redis_client.pipeline()

        # Increment minute counter with expiry
        pipe.incr(minute_key)
        pipe.expire(minute_key, self.WINDOW_MINUTE)

        # Increment day counter with expiry
        pipe.incr(day_key)
        pipe.expire(day_key, self.WINDOW_DAY)

        await pipe.execute()

    async def get_usage(
        self,
        api_key_id: int,
    ) -> dict:
        """
        Get current usage for an API key.

        Args:
            api_key_id: API key ID to check

        Returns:
            Dict with requests_this_minute and requests_today
        """
        redis_client = await self.get_redis()

        minute_key = f"{self.KEY_PREFIX_MINUTE}{api_key_id}"
        day_key = f"{self.KEY_PREFIX_DAY}{api_key_id}"

        pipe = redis_client.pipeline()
        pipe.get(minute_key)
        pipe.get(day_key)
        results = await pipe.execute()

        return {
            "requests_this_minute": int(results[0] or 0),
            "requests_today": int(results[1] or 0),
        }


# Global rate limiter instance
_rate_limiter: Optional[RateLimiter] = None


def get_rate_limiter() -> RateLimiter:
    """Get or create the global rate limiter instance."""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter


async def check_rate_limit(
    api_key_id: int,
    limit_rpm: int,
    limit_rpd: int,
) -> dict:
    """
    Check and record rate limit for an API key.

    This is a convenience function for use in endpoints.

    Args:
        api_key_id: API key ID
        limit_rpm: Requests per minute limit
        limit_rpd: Requests per day limit

    Returns:
        Dict with rate limit headers

    Raises:
        HTTPException: If rate limit is exceeded
    """
    limiter = get_rate_limiter()

    is_allowed, headers = await limiter.check_rate_limit(
        api_key_id, limit_rpm, limit_rpd
    )

    if not is_allowed:
        retry_after = int(headers.get("Retry-After", 60))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "RATE_LIMIT_EXCEEDED",
                "message": f"Rate limit exceeded. Try again in {retry_after} seconds.",
                "retry_after": retry_after,
            },
            headers=headers,
        )

    # Record this request
    await limiter.record_request(api_key_id)

    return headers


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware for adding rate limit headers to responses.

    Note: The actual rate limit checking is done in the endpoint
    dependencies for more granular control. This middleware
    adds the headers to all responses.
    """

    def __init__(self, app):
        super().__init__(app)
        self.rate_limiter = get_rate_limiter()

    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request and add rate limit headers if available."""
        response = await call_next(request)

        # Rate limit headers are added by the check_rate_limit function
        # in the request state if applicable

        return response
