"""
API Key Service for FileForge

Handles API key creation, validation, and management.
"""

from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from packages.common.models import APIKey, User
from packages.common.schemas.api_key import CreateAPIKeyRequest, UpdateAPIKeyRequest


class APIKeyService:
    """Service for API key operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_api_key(
        self,
        user: User,
        request: CreateAPIKeyRequest,
    ) -> tuple[APIKey, str]:
        """
        Create a new API key for a user.

        Args:
            user: User who owns the key
            request: API key creation request

        Returns:
            Tuple of (APIKey model, full_key)
            Note: The full_key is only returned once and cannot be retrieved again.
        """
        # Generate the key
        full_key, key_prefix, key_hash = APIKey.generate_key()

        # Calculate expiration if specified
        expires_at = None
        if request.expires_in_days:
            expires_at = datetime.utcnow() + timedelta(days=request.expires_in_days)

        # Create the API key
        api_key = APIKey(
            user_id=user.id,
            name=request.name,
            key_prefix=key_prefix,
            key_hash=key_hash,
            rate_limit_rpm=request.rate_limit_rpm,
            rate_limit_rpd=request.rate_limit_rpd,
            expires_at=expires_at,
        )

        self.db.add(api_key)
        await self.db.commit()
        await self.db.refresh(api_key)

        return api_key, full_key

    async def get_api_key_by_id(
        self,
        key_id: int,
        user: User,
    ) -> Optional[APIKey]:
        """
        Get an API key by ID for a specific user.

        Args:
            key_id: API key ID
            user: User who owns the key

        Returns:
            APIKey if found and owned by user, None otherwise
        """
        result = await self.db.execute(
            select(APIKey).where(
                APIKey.id == key_id,
                APIKey.user_id == user.id,
            )
        )
        return result.scalar_one_or_none()

    async def list_api_keys(
        self,
        user: User,
    ) -> list[APIKey]:
        """
        List all API keys for a user.

        Args:
            user: User whose keys to list

        Returns:
            List of APIKey models
        """
        result = await self.db.execute(
            select(APIKey)
            .where(APIKey.user_id == user.id)
            .order_by(APIKey.created_at.desc())
        )
        return list(result.scalars().all())

    async def update_api_key(
        self,
        key_id: int,
        user: User,
        request: UpdateAPIKeyRequest,
    ) -> Optional[APIKey]:
        """
        Update an API key.

        Args:
            key_id: API key ID
            user: User who owns the key
            request: Update request

        Returns:
            Updated APIKey if found, None otherwise
        """
        api_key = await self.get_api_key_by_id(key_id, user)
        if not api_key:
            return None

        # Update fields if provided
        if request.name is not None:
            api_key.name = request.name
        if request.is_active is not None:
            api_key.is_active = request.is_active
        if request.rate_limit_rpm is not None:
            api_key.rate_limit_rpm = request.rate_limit_rpm
        if request.rate_limit_rpd is not None:
            api_key.rate_limit_rpd = request.rate_limit_rpd

        await self.db.commit()
        await self.db.refresh(api_key)

        return api_key

    async def delete_api_key(
        self,
        key_id: int,
        user: User,
    ) -> bool:
        """
        Delete (revoke) an API key.

        Args:
            key_id: API key ID
            user: User who owns the key

        Returns:
            True if deleted, False if not found
        """
        api_key = await self.get_api_key_by_id(key_id, user)
        if not api_key:
            return False

        await self.db.delete(api_key)
        await self.db.commit()

        return True

    async def revoke_api_key(
        self,
        key_id: int,
        user: User,
    ) -> Optional[APIKey]:
        """
        Revoke an API key (set is_active to False).

        Args:
            key_id: API key ID
            user: User who owns the key

        Returns:
            Revoked APIKey if found, None otherwise
        """
        api_key = await self.get_api_key_by_id(key_id, user)
        if not api_key:
            return None

        api_key.revoke()
        await self.db.commit()
        await self.db.refresh(api_key)

        return api_key

    async def get_api_key_by_hash(
        self,
        key_hash: str,
    ) -> Optional[APIKey]:
        """
        Get an API key by its hash (for authentication).

        Args:
            key_hash: SHA-256 hash of the API key

        Returns:
            APIKey if found, None otherwise
        """
        result = await self.db.execute(
            select(APIKey).where(APIKey.key_hash == key_hash)
        )
        return result.scalar_one_or_none()

    async def validate_and_record_usage(
        self,
        raw_key: str,
    ) -> Optional[APIKey]:
        """
        Validate an API key and record its usage.

        Args:
            raw_key: The raw API key from the request

        Returns:
            Valid APIKey if authentication succeeds, None otherwise
        """
        key_hash = APIKey.hash_key(raw_key)
        api_key = await self.get_api_key_by_hash(key_hash)

        if not api_key or not api_key.is_valid():
            return None

        # Record usage
        api_key.record_usage()
        await self.db.flush()

        return api_key
