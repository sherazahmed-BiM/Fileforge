"""
API Key Authentication for FileForge

Provides FastAPI dependencies for API key authentication.
"""


from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from packages.common.core.logging import get_logger
from packages.common.models.api_key import ApiKey


logger = get_logger(__name__)

# API Key header configuration
API_KEY_HEADER = APIKeyHeader(
    name="X-API-Key",
    scheme_name="API Key",
    description="API key for authentication. Get your key from the admin panel.",
    auto_error=False,
)


async def verify_api_key(
    db: AsyncSession,
    api_key: str,
) -> ApiKey | None:
    """
    Verify an API key and return the ApiKey model if valid.

    Args:
        db: Database session
        api_key: The API key string to verify

    Returns:
        ApiKey model if valid, None otherwise
    """
    if not api_key:
        return None

    # Hash the provided key for comparison
    key_hash = ApiKey.hash_key(api_key)

    # Look up the key
    result = await db.execute(
        select(ApiKey).where(
            ApiKey.key_hash == key_hash,
            ApiKey.is_deleted == False,  # noqa: E712
        )
    )
    api_key_record = result.scalar_one_or_none()

    if not api_key_record:
        return None

    # Check if key is valid (active and not expired)
    if not api_key_record.is_valid():
        return None

    # Update usage statistics
    api_key_record.increment_usage()
    await db.flush()

    return api_key_record


async def get_api_key(
    api_key_header: str | None = Security(API_KEY_HEADER),
) -> str:
    """
    FastAPI dependency that requires a valid API key.

    Use this for endpoints that require authentication.

    Raises:
        HTTPException: If API key is missing or invalid
    """
    if not api_key_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "missing_api_key",
                "message": "API key is required. Include it in the X-API-Key header.",
            },
            headers={"WWW-Authenticate": "ApiKey"},
        )

    return api_key_header


async def get_optional_api_key(
    api_key_header: str | None = Security(API_KEY_HEADER),
) -> str | None:
    """
    FastAPI dependency that optionally accepts an API key.

    Use this for endpoints that work with or without authentication
    but may have different behavior based on auth status.
    """
    return api_key_header


async def _get_db_for_auth():
    """Get database session for auth - imported here to avoid circular imports."""
    from packages.common.core.database import get_db_context

    async with get_db_context() as db:
        yield db


class ApiKeyAuth:
    """
    Dependency class for API key authentication with database verification.

    Usage:
        @router.get("/endpoint")
        async def endpoint(
            api_key: ApiKey = Depends(ApiKeyAuth()),
            db: AsyncSession = Depends(get_db),
        ):
            ...
    """

    def __init__(self, required: bool = True):
        """
        Initialize the auth dependency.

        Args:
            required: If True, raises 401 if no valid key. If False, returns None.
        """
        self.required = required

    async def __call__(
        self,
        api_key_header: str | None = Security(API_KEY_HEADER),
        db: AsyncSession = Depends(_get_db_for_auth),
    ) -> ApiKey | None:
        """Verify the API key and return the ApiKey model."""
        if not api_key_header:
            if self.required:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "error": "missing_api_key",
                        "message": "API key is required. Include it in the X-API-Key header.",
                    },
                    headers={"WWW-Authenticate": "ApiKey"},
                )
            return None

        api_key_record = await verify_api_key(db, api_key_header)

        if not api_key_record:
            if self.required:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "error": "invalid_api_key",
                        "message": "Invalid or expired API key.",
                    },
                    headers={"WWW-Authenticate": "ApiKey"},
                )
            return None

        logger.debug(
            f"API key authenticated: {api_key_record.key_prefix}... "
            f"(name={api_key_record.name})"
        )

        return api_key_record
