"""
Auth API Endpoints for FileForge

Handles user registration, login, logout, and email verification.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.converter_api.dependencies import get_db
from packages.common.auth.session import (
    clear_session_cookie,
    get_session_token,
    set_session_cookie,
)
from packages.common.schemas.auth import (
    LoginRequest,
    LoginResponse,
    LogoutResponse,
    ResendVerificationRequest,
    ResendVerificationResponse,
    SignupRequest,
    SignupResponse,
    UserResponse,
    VerifyEmailRequest,
    VerifyEmailResponse,
    VerifyOTPRequest,
)
from packages.common.services.auth import AuthService
from packages.common.services.email import EmailService


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    request: SignupRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user account.

    Sends a verification email to the provided address.
    User must verify email before logging in.
    """
    auth_service = AuthService(db)
    email_service = EmailService()

    try:
        user = await auth_service.signup(request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    # Send verification email
    await email_service.send_verification_email(
        email=user.email,
        token=user.verification_token,
        name=user.name,
    )

    return SignupResponse(
        message="Account created. Please check your email to verify your account.",
        user_id=user.id,
        email=user.email,
    )


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    response: Response,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate user and create session.

    Sets an httponly cookie with the session token.
    """
    auth_service = AuthService(db)

    # Get client info for session
    ip_address = http_request.client.host if http_request.client else None
    user_agent = http_request.headers.get("user-agent")

    try:
        user, session_token = await auth_service.login(
            request,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )

    # Set session cookie
    set_session_cookie(response, session_token)

    return LoginResponse(
        message="Login successful",
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            is_verified=user.is_verified,
            created_at=user.created_at,
        ),
    )


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    response: Response,
    session_token: str = Depends(get_session_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Logout user and invalidate session.

    Clears the session cookie.
    """
    if session_token:
        auth_service = AuthService(db)
        await auth_service.logout(session_token)

    # Clear session cookie
    clear_session_cookie(response)

    return LogoutResponse(message="Logged out successfully")


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    session_token: str = Depends(get_session_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current authenticated user.

    Returns user information if authenticated.
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

    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        is_verified=user.is_verified,
        created_at=user.created_at,
    )


@router.post("/verify-email", response_model=VerifyEmailResponse)
async def verify_email(
    request: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify user email with token (link-based verification).

    Token is sent via email during registration.
    """
    auth_service = AuthService(db)
    email_service = EmailService()

    user = await auth_service.verify_email(request.token)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    # Send welcome email
    await email_service.send_welcome_email(
        email=user.email,
        name=user.name,
    )

    return VerifyEmailResponse(
        message="Email verified successfully. You can now log in.",
        verified=True,
    )


@router.post("/verify-otp", response_model=VerifyEmailResponse)
async def verify_otp(
    request: VerifyOTPRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify user email with OTP code.

    6-digit code is sent via email during registration.
    """
    auth_service = AuthService(db)
    email_service = EmailService()

    user = await auth_service.verify_email_with_otp(request.email, request.code)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code",
        )

    # Send welcome email
    await email_service.send_welcome_email(
        email=user.email,
        name=user.name,
    )

    return VerifyEmailResponse(
        message="Email verified successfully. You can now log in.",
        verified=True,
    )


@router.post("/resend-verification", response_model=ResendVerificationResponse)
async def resend_verification(
    request: ResendVerificationRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Resend verification email.

    Always returns success to prevent email enumeration.
    """
    auth_service = AuthService(db)
    email_service = EmailService()

    user = await auth_service.resend_verification(request.email)

    # Send email if user exists and is unverified
    if user:
        await email_service.send_verification_email(
            email=user.email,
            token=user.verification_token,
            name=user.name,
        )

    # Always return success to prevent email enumeration
    return ResendVerificationResponse(
        message="If an account exists with this email and is not verified, a verification email has been sent."
    )
