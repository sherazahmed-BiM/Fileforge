"""
Session-based Authentication for FileForge

Provides FastAPI dependencies for session cookie authentication.
"""

from typing import Optional

from fastapi import Cookie, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from packages.common.models import User
from packages.common.services.auth import AuthService


# Cookie configuration
SESSION_COOKIE_NAME = "fileforge_session"
SESSION_COOKIE_MAX_AGE = 30 * 24 * 60 * 60  # 30 days in seconds


async def get_session_token(
    request: Request,
    session_token: Optional[str] = Cookie(None, alias=SESSION_COOKIE_NAME),
) -> Optional[str]:
    """
    Extract session token from cookie.

    Args:
        request: FastAPI request
        session_token: Session token from cookie

    Returns:
        Session token if present, None otherwise
    """
    return session_token


async def get_current_user(
    session_token: Optional[str] = Depends(get_session_token),
    db: AsyncSession = Depends(),
) -> User:
    """
    Get current authenticated user from session.

    Args:
        session_token: Session token from cookie
        db: Database session

    Returns:
        Authenticated User

    Raises:
        HTTPException: If not authenticated
    """
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    auth_service = AuthService(db)
    user = await auth_service.get_user_by_session(session_token)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        )

    return user


async def get_optional_user(
    session_token: Optional[str] = Depends(get_session_token),
    db: AsyncSession = Depends(),
) -> Optional[User]:
    """
    Get current user if authenticated, None otherwise.

    Args:
        session_token: Session token from cookie
        db: Database session

    Returns:
        User if authenticated, None otherwise
    """
    if not session_token:
        return None

    auth_service = AuthService(db)
    return await auth_service.get_user_by_session(session_token)


def set_session_cookie(response, token: str) -> None:
    """
    Set session cookie on response.

    Args:
        response: FastAPI response
        token: Session token to set
    """
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=SESSION_COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True in production with HTTPS
    )


def clear_session_cookie(response) -> None:
    """
    Clear session cookie from response.

    Args:
        response: FastAPI response
    """
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        httponly=True,
        samesite="lax",
    )
