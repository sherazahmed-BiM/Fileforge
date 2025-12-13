"""
API Key Management Endpoints for FileForge

Allows users to create, list, update, and delete API keys for public API access.
Requires session-based authentication.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.converter_api.dependencies import get_db
from packages.common.auth.session import get_session_token
from packages.common.core.logging import get_logger
from packages.common.models import User
from packages.common.schemas.api_key import (
    APIKeyListResponse,
    APIKeyResponse,
    CreateAPIKeyRequest,
    CreateAPIKeyResponse,
    DeleteAPIKeyResponse,
    UpdateAPIKeyRequest,
)
from packages.common.services.api_key_service import APIKeyService
from packages.common.services.auth import AuthService


logger = get_logger(__name__)
router = APIRouter()


async def get_current_user(
    session_token: str = Depends(get_session_token),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get current authenticated user. Raises 401 if not authenticated."""
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    auth_service = AuthService(db)
    user = await auth_service.get_user_by_session(session_token)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        )

    return user


@router.post(
    "/",
    response_model=CreateAPIKeyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new API key",
)
async def create_api_key(
    request: CreateAPIKeyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CreateAPIKeyResponse:
    """
    Create a new API key for the authenticated user.

    IMPORTANT: The full API key is only returned once in this response.
    It cannot be retrieved again. Make sure to save it securely.
    """
    api_key_service = APIKeyService(db)
    api_key, full_key = await api_key_service.create_api_key(current_user, request)

    logger.info(f"Created API key {api_key.id} for user {current_user.id}")

    return CreateAPIKeyResponse(
        id=api_key.id,
        name=api_key.name,
        key=full_key,
        key_prefix=api_key.key_prefix,
        rate_limit_rpm=api_key.rate_limit_rpm,
        rate_limit_rpd=api_key.rate_limit_rpd,
        expires_at=api_key.expires_at,
        created_at=api_key.created_at,
    )


@router.get(
    "/",
    response_model=APIKeyListResponse,
    summary="List all API keys",
)
async def list_api_keys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> APIKeyListResponse:
    """
    List all API keys for the authenticated user.

    Note: The full key is not returned, only the prefix for identification.
    """
    api_key_service = APIKeyService(db)
    api_keys = await api_key_service.list_api_keys(current_user)

    return APIKeyListResponse(
        items=[APIKeyResponse.model_validate(key) for key in api_keys],
        total=len(api_keys),
    )


@router.get(
    "/{key_id}",
    response_model=APIKeyResponse,
    summary="Get API key details",
)
async def get_api_key(
    key_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> APIKeyResponse:
    """
    Get details of a specific API key.

    Note: The full key is not returned, only the prefix for identification.
    """
    api_key_service = APIKeyService(db)
    api_key = await api_key_service.get_api_key_by_id(key_id, current_user)

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

    return APIKeyResponse.model_validate(api_key)


@router.patch(
    "/{key_id}",
    response_model=APIKeyResponse,
    summary="Update an API key",
)
async def update_api_key(
    key_id: int,
    request: UpdateAPIKeyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> APIKeyResponse:
    """
    Update an API key's name, rate limits, or active status.
    """
    api_key_service = APIKeyService(db)
    api_key = await api_key_service.update_api_key(key_id, current_user, request)

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

    logger.info(f"Updated API key {key_id} for user {current_user.id}")

    return APIKeyResponse.model_validate(api_key)


@router.delete(
    "/{key_id}",
    response_model=DeleteAPIKeyResponse,
    summary="Delete an API key",
)
async def delete_api_key(
    key_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeleteAPIKeyResponse:
    """
    Permanently delete an API key.

    This action cannot be undone. Any applications using this key
    will immediately lose access.
    """
    api_key_service = APIKeyService(db)
    deleted = await api_key_service.delete_api_key(key_id, current_user)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

    logger.info(f"Deleted API key {key_id} for user {current_user.id}")

    return DeleteAPIKeyResponse(
        message="API key deleted successfully",
        id=key_id,
    )


@router.post(
    "/{key_id}/revoke",
    response_model=APIKeyResponse,
    summary="Revoke an API key",
)
async def revoke_api_key(
    key_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> APIKeyResponse:
    """
    Revoke an API key (set to inactive).

    The key can be reactivated later using the update endpoint.
    """
    api_key_service = APIKeyService(db)
    api_key = await api_key_service.revoke_api_key(key_id, current_user)

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

    logger.info(f"Revoked API key {key_id} for user {current_user.id}")

    return APIKeyResponse.model_validate(api_key)
