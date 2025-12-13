"""
API Key Model for FileForge

Stores API keys for external application authentication.
"""

import hashlib
import secrets
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from packages.common.models.base import BaseModel


if TYPE_CHECKING:
    from packages.common.models.user import User


class APIKey(BaseModel):
    """
    API Key model for external application authentication.

    Keys are stored hashed (SHA-256). The plain key is only shown once at creation.
    """

    __tablename__ = "api_keys"

    # Foreign key to user (owner of the key)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Key identification
    name: Mapped[str] = mapped_column(
        String(100), nullable=False, default="Default"
    )
    key_prefix: Mapped[str] = mapped_column(
        String(16), nullable=False
    )  # e.g., "ff_live_abc1"

    # Key hash (SHA-256, 64 chars)
    key_hash: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, index=True
    )

    # Status
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )

    # Rate limits
    rate_limit_rpm: Mapped[int] = mapped_column(
        Integer, default=60, nullable=False
    )  # Requests per minute
    rate_limit_rpd: Mapped[int] = mapped_column(
        Integer, default=1000, nullable=False
    )  # Requests per day

    # Usage tracking
    total_requests: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    last_used_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )

    # Optional expiration
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True, index=True
    )

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="api_keys")

    # Key format constants
    KEY_PREFIX = "ff_live_"
    KEY_LENGTH = 32  # Random part length

    @classmethod
    def generate_key(cls) -> tuple[str, str, str]:
        """
        Generate a new API key.

        Returns:
            Tuple of (full_key, key_prefix, key_hash)
            - full_key: The complete key to show to user (only once)
            - key_prefix: First 16 chars for identification
            - key_hash: SHA-256 hash to store in database
        """
        random_part = secrets.token_urlsafe(cls.KEY_LENGTH)
        full_key = f"{cls.KEY_PREFIX}{random_part}"
        key_prefix = full_key[:16]
        key_hash = hashlib.sha256(full_key.encode()).hexdigest()
        return full_key, key_prefix, key_hash

    @staticmethod
    def hash_key(key: str) -> str:
        """Hash an API key for comparison."""
        return hashlib.sha256(key.encode()).hexdigest()

    def is_valid(self) -> bool:
        """Check if API key is valid (active and not expired)."""
        if not self.is_active:
            return False
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return False
        return True

    def record_usage(self) -> None:
        """Record a usage of this API key."""
        self.total_requests += 1
        self.last_used_at = datetime.utcnow()

    def revoke(self) -> None:
        """Revoke the API key."""
        self.is_active = False

    def __repr__(self) -> str:
        return f"<APIKey(id={self.id}, name={self.name}, prefix={self.key_prefix}, active={self.is_active})>"
