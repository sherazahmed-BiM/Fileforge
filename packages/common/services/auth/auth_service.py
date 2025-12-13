"""
Auth Service for FileForge

Handles user authentication, registration, and session management.
"""

import secrets
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from packages.common.models import Session, User
from packages.common.schemas.auth import (
    LoginRequest,
    SignupRequest,
)


class AuthService:
    """Service for authentication operations."""

    # Password hashing configuration
    BCRYPT_ROUNDS = 12

    # Session configuration
    SESSION_EXPIRY_DAYS = 30

    # Token expiry configuration
    VERIFICATION_TOKEN_EXPIRY_HOURS = 24
    PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1

    def __init__(self, db: AsyncSession):
        self.db = db

    async def signup(self, request: SignupRequest) -> User:
        """
        Register a new user.

        Args:
            request: Signup request with email, password, and optional name

        Returns:
            Created User object

        Raises:
            ValueError: If email already exists
        """
        # Check if email already exists
        existing = await self._get_user_by_email(request.email)
        if existing:
            raise ValueError("Email already registered")

        # Hash password
        password_hash = self._hash_password(request.password)

        # Generate 6-digit OTP code for verification
        verification_token = User.generate_otp()
        verification_expires = datetime.utcnow() + timedelta(
            hours=self.VERIFICATION_TOKEN_EXPIRY_HOURS
        )

        # Create user
        user = User(
            email=request.email.lower(),
            name=request.name,
            password_hash=password_hash,
            is_verified=False,
            verification_token=verification_token,
            verification_token_expires_at=verification_expires,
        )

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def login(
        self,
        request: LoginRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> tuple[User, str]:
        """
        Authenticate user and create session.

        Args:
            request: Login request with email and password
            ip_address: Client IP address
            user_agent: Client user agent

        Returns:
            Tuple of (User, session_token)

        Raises:
            ValueError: If credentials are invalid or user is not verified
        """
        # Get user by email
        user = await self._get_user_by_email(request.email)

        # Use constant-time comparison to prevent timing attacks
        if not user or not self._verify_password(request.password, user.password_hash):
            raise ValueError("Invalid email or password")

        # Check if user is verified
        if not user.is_verified:
            raise ValueError("Email not verified. Please check your email for the verification link.")

        # Check if user is active
        if not user.is_active:
            raise ValueError("Account is disabled")

        # Create session
        plain_token, token_hash = Session.generate_token()
        session = Session(
            user_id=user.id,
            session_token_hash=token_hash,
            expires_at=Session.default_expiry(),
            last_active_at=datetime.utcnow(),
            ip_address=ip_address,
            user_agent=user_agent,
        )

        # Update last login
        user.last_login_at = datetime.utcnow()

        self.db.add(session)
        await self.db.commit()

        return user, plain_token

    async def logout(self, session_token: str) -> bool:
        """
        Revoke a session.

        Args:
            session_token: Plain session token from cookie

        Returns:
            True if session was revoked, False if not found
        """
        token_hash = Session.hash_token(session_token)

        query = select(Session).where(
            Session.session_token_hash == token_hash,
            Session.is_revoked == False,
        )
        result = await self.db.execute(query)
        session = result.scalar_one_or_none()

        if not session:
            return False

        session.revoke()
        await self.db.commit()
        return True

    async def get_user_by_session(self, session_token: str) -> Optional[User]:
        """
        Get user from session token.

        Args:
            session_token: Plain session token from cookie

        Returns:
            User if session is valid, None otherwise
        """
        token_hash = Session.hash_token(session_token)

        query = (
            select(Session)
            .where(
                Session.session_token_hash == token_hash,
                Session.is_revoked == False,
                Session.expires_at > datetime.utcnow(),
            )
        )
        result = await self.db.execute(query)
        session = result.scalar_one_or_none()

        if not session:
            return None

        # Refresh session activity
        session.refresh()
        await self.db.commit()

        # Load user
        user_query = select(User).where(
            User.id == session.user_id,
            User.is_active == True,
        )
        user_result = await self.db.execute(user_query)
        return user_result.scalar_one_or_none()

    async def verify_email(self, token: str) -> Optional[User]:
        """
        Verify user email with token.

        Args:
            token: Verification token from email

        Returns:
            User if verification successful, None otherwise
        """
        query = select(User).where(
            User.verification_token == token,
            User.is_verified == False,
        )
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            return None

        # Check if token expired
        if user.verification_token_expires_at and user.verification_token_expires_at < datetime.utcnow():
            return None

        # Mark as verified
        user.is_verified = True
        user.verified_at = datetime.utcnow()
        user.verification_token = None
        user.verification_token_expires_at = None

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def verify_email_with_otp(self, email: str, otp_code: str) -> Optional[User]:
        """
        Verify user email with OTP code.

        Args:
            email: User email address
            otp_code: 6-digit OTP code from email

        Returns:
            User if verification successful, None otherwise
        """
        user = await self._get_user_by_email(email)

        if not user or user.is_verified:
            return None

        # Check if OTP matches
        if user.verification_token != otp_code:
            return None

        # Check if token expired
        if user.verification_token_expires_at and user.verification_token_expires_at < datetime.utcnow():
            return None

        # Mark as verified
        user.is_verified = True
        user.verified_at = datetime.utcnow()
        user.verification_token = None
        user.verification_token_expires_at = None

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def resend_verification(self, email: str) -> Optional[User]:
        """
        Resend verification email.

        Args:
            email: User email address

        Returns:
            User if found and unverified, None otherwise
        """
        user = await self._get_user_by_email(email)

        if not user or user.is_verified:
            # Don't reveal if user exists or is already verified
            return None

        # Generate new 6-digit OTP code
        user.verification_token = User.generate_otp()
        user.verification_token_expires_at = datetime.utcnow() + timedelta(
            hours=self.VERIFICATION_TOKEN_EXPIRY_HOURS
        )

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def _get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email address."""
        query = select(User).where(
            User.email == email.lower(),
            User.is_deleted == False,
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    def _hash_password(self, password: str) -> str:
        """Hash password with bcrypt."""
        salt = bcrypt.gensalt(rounds=self.BCRYPT_ROUNDS)
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    def _verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password against hash."""
        try:
            return bcrypt.checkpw(
                password.encode("utf-8"),
                password_hash.encode("utf-8"),
            )
        except Exception:
            return False
