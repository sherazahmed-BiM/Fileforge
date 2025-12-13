"""
Session Model for FileForge

Stores user sessions for cookie-based authentication.
"""

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from packages.common.models.base import BaseModel


if TYPE_CHECKING:
    from packages.common.models.user import User


class Session(BaseModel):
    """
    Session model for authenticated user sessions.

    Stores session tokens and metadata for cookie-based auth.
    """

    # Foreign key to user
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Session token (stored hashed, plain sent in cookie)
    session_token_hash: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, index=True
    )

    # Session metadata
    expires_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, index=True
    )
    last_active_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Client information (for security monitoring)
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45), nullable=True
    )  # IPv6 max length
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Revocation
    is_revoked: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="sessions")

    @classmethod
    def generate_token(cls) -> tuple[str, str]:
        """
        Generate a session token.

        Returns:
            Tuple of (plain_token, token_hash)
        """
        plain_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(plain_token.encode()).hexdigest()
        return plain_token, token_hash

    @staticmethod
    def hash_token(token: str) -> str:
        """Hash a session token for comparison."""
        return hashlib.sha256(token.encode()).hexdigest()

    @classmethod
    def default_expiry(cls) -> datetime:
        """Get default session expiry (30 days from now)."""
        return datetime.utcnow() + timedelta(days=30)

    def is_valid(self) -> bool:
        """Check if session is valid (not expired and not revoked)."""
        if self.is_revoked:
            return False
        return datetime.utcnow() < self.expires_at

    def refresh(self) -> None:
        """Update last active timestamp."""
        self.last_active_at = datetime.utcnow()

    def revoke(self) -> None:
        """Revoke the session."""
        self.is_revoked = True
        self.revoked_at = datetime.utcnow()

    def __repr__(self) -> str:
        return f"<Session(id={self.id}, user_id={self.user_id}, valid={self.is_valid()})>"
