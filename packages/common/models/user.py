"""
User Model for FileForge

Represents authenticated users with email verification support.
"""

import secrets
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from packages.common.models.base import BaseModel


if TYPE_CHECKING:
    from packages.common.models.api_key import APIKey
    from packages.common.models.document import Document
    from packages.common.models.session import Session


class User(BaseModel):
    """
    User model for authentication.

    Stores user credentials and verification status.
    """

    # User identity
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Password (hashed with bcrypt)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Email verification
    is_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    verification_token: Mapped[Optional[str]] = mapped_column(
        String(64), nullable=True, index=True
    )
    verification_token_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Password reset
    password_reset_token: Mapped[Optional[str]] = mapped_column(
        String(64), nullable=True, index=True
    )
    password_reset_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )

    # Account status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    documents: Mapped[list["Document"]] = relationship(
        "Document",
        back_populates="user",
        lazy="selectin",
    )
    sessions: Mapped[list["Session"]] = relationship(
        "Session",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    api_keys: Mapped[list["APIKey"]] = relationship(
        "APIKey",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    @classmethod
    def generate_token(cls) -> str:
        """Generate a secure random token for verification or password reset."""
        return secrets.token_urlsafe(48)

    @classmethod
    def generate_otp(cls) -> str:
        """Generate a 6-digit OTP code for email verification."""
        return f"{secrets.randbelow(1000000):06d}"

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', verified={self.is_verified})>"
