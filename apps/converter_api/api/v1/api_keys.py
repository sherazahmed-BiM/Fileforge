"""
API Key Management Endpoints for FileForge

CRUD operations for API keys.
"""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.converter_api.dependencies import get_db
from packages.common.auth.rate_limit import get_rate_limiter
from packages.common.core.logging import get_logger
from packages.common.models.api_key import ApiKey, ApiKeyStatus
from packages.common.schemas.api_key import (
    ApiKeyCreate,
    ApiKeyCreateResponse,
    ApiKeyListResponse,
    ApiKeyResponse,
    ApiKeyUpdate,
    ApiKeyUsageResponse,
)


logger = get_logger(__name__)
router = APIRouter()


@router.post(
    "/",
    response_model=ApiKeyCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new API key",
)
async def create_api_key(
    request: ApiKeyCreate,
    db: AsyncSession = Depends(get_db),
) -> ApiKeyCreateResponse:
    """
    Create a new API key.

    IMPORTANT: The full key is only shown once in the response.
    Make sure to save it securely.
    """
    # Generate new key
    full_key, key_hash, key_prefix = ApiKey.generate_key()

    # Calculate expiration
    expires_at = None
    if request.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=request.expires_in_days)

    # Create API key record
    api_key = ApiKey(
        name=request.name,
        description=request.description,
        key_hash=key_hash,
        key_prefix=key_prefix,
        rate_limit_rpm=request.rate_limit_rpm,
        expires_at=expires_at,
        owner_email=request.owner_email,
    )

    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)

    logger.info(f"Created API key: {key_prefix}... (name={request.name})")

    # Return response with the full key (only time it's shown)
    return ApiKeyCreateResponse(
        id=api_key.id,
        name=api_key.name,
        description=api_key.description,
        key=full_key,
        key_prefix=key_prefix,
        status=api_key.status,
        rate_limit_rpm=api_key.rate_limit_rpm,
        expires_at=api_key.expires_at,
        created_at=api_key.created_at,
    )


@router.get(
    "/",
    response_model=ApiKeyListResponse,
    summary="List all API keys",
)
async def list_api_keys(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    status_filter: ApiKeyStatus | None = Query(default=None, description="Filter by status"),
    include_deleted: bool = Query(default=False, description="Include deleted keys"),
    db: AsyncSession = Depends(get_db),
) -> ApiKeyListResponse:
    """List all API keys with pagination and filtering."""
    # Build query
    query = select(ApiKey).order_by(ApiKey.created_at.desc())

    if not include_deleted:
        query = query.where(ApiKey.is_deleted == False)  # noqa: E712

    if status_filter:
        query = query.where(ApiKey.status == status_filter)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    # Execute
    result = await db.execute(query)
    api_keys = result.scalars().all()

    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size

    return ApiKeyListResponse(
        items=[ApiKeyResponse.model_validate(key) for key in api_keys],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/{key_id}",
    response_model=ApiKeyResponse,
    summary="Get API key by ID",
)
async def get_api_key(
    key_id: int,
    db: AsyncSession = Depends(get_db),
) -> ApiKeyResponse:
    """Get an API key by ID."""
    api_key = await db.get(ApiKey, key_id)

    if not api_key or api_key.is_deleted:
        raise HTTPException(status_code=404, detail="API key not found")

    return ApiKeyResponse.model_validate(api_key)


@router.patch(
    "/{key_id}",
    response_model=ApiKeyResponse,
    summary="Update an API key",
)
async def update_api_key(
    key_id: int,
    request: ApiKeyUpdate,
    db: AsyncSession = Depends(get_db),
) -> ApiKeyResponse:
    """Update an API key's metadata."""
    api_key = await db.get(ApiKey, key_id)

    if not api_key or api_key.is_deleted:
        raise HTTPException(status_code=404, detail="API key not found")

    # Update fields
    if request.name is not None:
        api_key.name = request.name
    if request.description is not None:
        api_key.description = request.description
    if request.rate_limit_rpm is not None:
        api_key.rate_limit_rpm = request.rate_limit_rpm
    if request.status is not None:
        api_key.status = request.status

    await db.commit()
    await db.refresh(api_key)

    logger.info(f"Updated API key: {api_key.key_prefix}...")

    return ApiKeyResponse.model_validate(api_key)


@router.post(
    "/{key_id}/revoke",
    response_model=ApiKeyResponse,
    summary="Revoke an API key",
)
async def revoke_api_key(
    key_id: int,
    db: AsyncSession = Depends(get_db),
) -> ApiKeyResponse:
    """Revoke an API key (it will no longer be valid)."""
    api_key = await db.get(ApiKey, key_id)

    if not api_key or api_key.is_deleted:
        raise HTTPException(status_code=404, detail="API key not found")

    if api_key.status == ApiKeyStatus.REVOKED:
        raise HTTPException(status_code=400, detail="API key is already revoked")

    api_key.status = ApiKeyStatus.REVOKED
    await db.commit()
    await db.refresh(api_key)

    logger.info(f"Revoked API key: {api_key.key_prefix}...")

    return ApiKeyResponse.model_validate(api_key)


@router.delete(
    "/{key_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an API key",
)
async def delete_api_key(
    key_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Soft delete an API key."""
    api_key = await db.get(ApiKey, key_id)

    if not api_key or api_key.is_deleted:
        raise HTTPException(status_code=404, detail="API key not found")

    api_key.is_deleted = True
    api_key.status = ApiKeyStatus.REVOKED
    await db.commit()

    logger.info(f"Deleted API key: {api_key.key_prefix}...")


@router.get(
    "/{key_id}/usage",
    response_model=ApiKeyUsageResponse,
    summary="Get API key usage statistics",
)
async def get_api_key_usage(
    key_id: int,
    db: AsyncSession = Depends(get_db),
) -> ApiKeyUsageResponse:
    """Get usage statistics for an API key."""
    api_key = await db.get(ApiKey, key_id)

    if not api_key or api_key.is_deleted:
        raise HTTPException(status_code=404, detail="API key not found")

    # Get current rate limit window usage from Redis
    limiter = get_rate_limiter()
    try:
        usage_info = await limiter.get_usage(f"api_key:{api_key.id}")
        current_usage = usage_info.get("current_count", 0)
    except Exception:
        # If Redis is unavailable, just return 0
        current_usage = 0

    return ApiKeyUsageResponse(
        key_prefix=api_key.key_prefix,
        name=api_key.name,
        request_count=api_key.request_count,
        last_used_at=api_key.last_used_at,
        rate_limit_rpm=api_key.rate_limit_rpm,
        current_usage_in_window=current_usage,
    )
