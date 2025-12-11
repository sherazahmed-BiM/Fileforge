"""
API Key Model for FileForge

Provides API key authentication for public API access.
"""

import secrets
from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.models.base import BaseModel


class ApiKeyStatus(str, Enum):
    """API Key status."""
    ACTIVE = "active"
    REVOKED = "revoked"
    EXPIRED = "expired"


class ApiKey(BaseModel):
    """
    API Key model for authenticating API requests.

    Each API key has:
    - A unique key (shown only once at creation)
    - A prefix for identification (e.g., "ff_live_abc123...")
    - Rate limiting configuration
    - Usage tracking
    """

    __tablename__ = "api_keys"

    # Key identification
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # The actual key (hashed for storage, prefix stored separately for display)
    key_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    key_prefix: Mapped[str] = mapped_column(String(12), nullable=False)  # e.g., "ff_live_abc1"

    # Status and permissions
    status: Mapped[ApiKeyStatus] = mapped_column(
        String(20), default=ApiKeyStatus.ACTIVE, nullable=False
    )

    # Rate limiting (requests per minute)
    rate_limit_rpm: Mapped[int] = mapped_column(Integer, default=60, nullable=False)

    # Usage tracking
    request_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Expiration
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Owner information (optional, for future user system)
    owner_email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Soft delete
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    @classmethod
    def generate_key(cls) -> tuple[str, str, str]:
        """
        Generate a new API key.

        Returns:
            Tuple of (full_key, key_hash, key_prefix)
            - full_key: The complete key to show the user (only shown once)
            - key_hash: SHA-256 hash for storage
            - key_prefix: First 12 chars for display (e.g., "ff_live_abc1")
        """
        import hashlib

        # Generate a secure random key
        random_part = secrets.token_urlsafe(32)
        full_key = f"ff_live_{random_part}"

        # Hash for storage
        key_hash = hashlib.sha256(full_key.encode()).hexdigest()

        # Prefix for display
        key_prefix = full_key[:12]

        return full_key, key_hash, key_prefix

    @staticmethod
    def hash_key(key: str) -> str:
        """Hash an API key for comparison."""
        import hashlib
        return hashlib.sha256(key.encode()).hexdigest()

    def is_valid(self) -> bool:
        """Check if the API key is valid (active and not expired)."""
        if self.status != ApiKeyStatus.ACTIVE:
            return False
        if self.is_deleted:
            return False
        return not (self.expires_at and self.expires_at < datetime.utcnow())

    def increment_usage(self) -> None:
        """Increment the usage counter and update last used timestamp."""
        self.request_count += 1
        self.last_used_at = datetime.utcnow()

    def __repr__(self) -> str:
        return f"<ApiKey(id={self.id}, name='{self.name}', prefix='{self.key_prefix}...')>"
