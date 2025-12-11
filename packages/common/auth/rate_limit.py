"""
Rate Limiting for FileForge API

Provides Redis-based rate limiting using a sliding window algorithm.
"""

import time

from fastapi import HTTPException, status

from packages.common.core.config import settings
from packages.common.core.logging import get_logger


logger = get_logger(__name__)


class RateLimiter:
    """
    Redis-based rate limiter using sliding window algorithm.

    Usage:
        limiter = RateLimiter()

        @router.get("/endpoint")
        async def endpoint(request: Request):
            await limiter.check(request, key="user_123", limit=60)
            ...
    """

    def __init__(self, redis_url: str | None = None):
        """
        Initialize the rate limiter.

        Args:
            redis_url: Redis connection URL. Defaults to settings.redis_url.
        """
        self.redis_url = redis_url or settings.redis_url
        self._redis = None

    async def _get_redis(self):
        """Get or create Redis connection."""
        if self._redis is None:
            import redis.asyncio as redis

            self._redis = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
        return self._redis

    async def check(
        self,
        key: str,
        limit: int = 60,
        window: int = 60,
    ) -> dict:
        """
        Check rate limit for a given key.

        Args:
            key: Unique identifier for the rate limit (e.g., API key ID)
            limit: Maximum requests allowed in the window
            window: Time window in seconds (default: 60)

        Returns:
            Dict with rate limit info: remaining, reset_at, limit

        Raises:
            HTTPException: 429 Too Many Requests if limit exceeded
        """
        redis_client = await self._get_redis()
        now = time.time()
        window_start = now - window

        # Redis key for this rate limit
        redis_key = f"ratelimit:{key}"

        # Use a pipeline for atomic operations
        pipe = redis_client.pipeline()

        # Remove old entries outside the window
        pipe.zremrangebyscore(redis_key, 0, window_start)

        # Count current requests in window
        pipe.zcard(redis_key)

        # Execute pipeline
        results = await pipe.execute()
        current_count = results[1]

        if current_count >= limit:
            # Get the oldest entry to calculate reset time
            oldest = await redis_client.zrange(redis_key, 0, 0, withscores=True)
            reset_at = int(oldest[0][1] + window) if oldest else int(now + window)

            logger.warning(
                f"Rate limit exceeded for key {key}: {current_count}/{limit}"
            )

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "rate_limit_exceeded",
                    "message": f"Rate limit exceeded. Try again in {reset_at - int(now)} seconds.",
                    "limit": limit,
                    "remaining": 0,
                    "reset_at": reset_at,
                },
                headers={
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_at),
                    "Retry-After": str(reset_at - int(now)),
                },
            )

        # Add current request to the sorted set
        await redis_client.zadd(redis_key, {str(now): now})

        # Set expiry on the key
        await redis_client.expire(redis_key, window + 1)

        remaining = limit - current_count - 1
        reset_at = int(now + window)

        return {
            "limit": limit,
            "remaining": remaining,
            "reset_at": reset_at,
        }

    async def get_usage(self, key: str, window: int = 60) -> dict:
        """
        Get current usage for a key without incrementing.

        Args:
            key: Unique identifier for the rate limit
            window: Time window in seconds

        Returns:
            Dict with current usage info
        """
        redis_client = await self._get_redis()
        now = time.time()
        window_start = now - window

        redis_key = f"ratelimit:{key}"

        # Remove old entries and count current
        pipe = redis_client.pipeline()
        pipe.zremrangebyscore(redis_key, 0, window_start)
        pipe.zcard(redis_key)
        results = await pipe.execute()

        current_count = results[1]

        return {
            "current_count": current_count,
            "window": window,
        }

    async def reset(self, key: str) -> None:
        """Reset rate limit for a key."""
        redis_client = await self._get_redis()
        await redis_client.delete(f"ratelimit:{key}")

    async def close(self):
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            self._redis = None


# Global rate limiter instance
_rate_limiter: RateLimiter | None = None


def get_rate_limiter() -> RateLimiter:
    """Get the global rate limiter instance."""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter


async def check_rate_limit(
    key: str,
    limit: int = 60,
    window: int = 60,
) -> dict:
    """
    Convenience function to check rate limit.

    Args:
        key: Unique identifier for the rate limit
        limit: Maximum requests allowed in the window
        window: Time window in seconds

    Returns:
        Dict with rate limit info
    """
    limiter = get_rate_limiter()
    return await limiter.check(key, limit, window)
