"""
API Key Authentication for FileForge

Provides FastAPI dependencies for API key authentication.
"""

from typing import Optional

from fastapi import Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from packages.common.models.api_key import APIKey


# Header name for API key
API_KEY_HEADER = "X-API-Key"


async def get_api_key_header(
    x_api_key: Optional[str] = Header(None, alias=API_KEY_HEADER),
) -> Optional[str]:
    """
    Extract API key from header.

    Args:
        x_api_key: API key from X-API-Key header

    Returns:
        API key if present, None otherwise
    """
    return x_api_key


async def get_api_key(
    api_key: Optional[str],
    db: AsyncSession,
) -> APIKey:
    """
    Validate API key and return the APIKey model.

    Args:
        api_key: Raw API key from header
        db: Database session

    Returns:
        Validated APIKey model

    Raises:
        HTTPException: If API key is invalid
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required. Provide X-API-Key header.",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    # Validate key format
    if not api_key.startswith("ff_live_"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key format",
        )

    # Hash the key and look up in database
    key_hash = APIKey.hash_key(api_key)

    result = await db.execute(
        select(APIKey).where(APIKey.key_hash == key_hash)
    )
    db_key = result.scalar_one_or_none()

    if not db_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )

    # Check if key is valid (active and not expired)
    if not db_key.is_valid():
        if not db_key.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key has been revoked",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key has expired",
            )

    return db_key


async def verify_api_key(
    api_key: Optional[str],
    db: AsyncSession,
) -> APIKey:
    """
    Verify API key and record usage.

    This is the main dependency to use in public API endpoints.
    It validates the key and updates usage statistics.

    Args:
        api_key: Raw API key from header
        db: Database session

    Returns:
        Validated APIKey model with usage recorded

    Raises:
        HTTPException: If API key is invalid
    """
    db_key = await get_api_key(api_key, db)

    # Record usage
    db_key.record_usage()
    await db.flush()

    return db_key


class RequireAPIKey:
    """
    Dependency class for requiring API key authentication.

    Usage:
        @router.get("/endpoint")
        async def endpoint(
            api_key: APIKey = Depends(RequireAPIKey()),
            db: AsyncSession = Depends(get_db)
        ):
            ...
    """

    def __init__(self, record_usage: bool = True):
        """
        Initialize the dependency.

        Args:
            record_usage: Whether to record usage statistics
        """
        self.record_usage = record_usage

    async def __call__(
        self,
        x_api_key: Optional[str] = Header(None, alias=API_KEY_HEADER),
        db: AsyncSession = None,
    ) -> APIKey:
        """
        Validate the API key.

        Note: The db parameter needs to be injected by the endpoint.
        """
        if self.record_usage:
            return await verify_api_key(x_api_key, db)
        else:
            return await get_api_key(x_api_key, db)
