"""
Auth Schemas for FileForge

Pydantic models for authentication requests and responses.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    """Request for user registration."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(
        ..., min_length=8, max_length=128, description="Password (min 8 characters)"
    )
    name: Optional[str] = Field(
        None, max_length=255, description="User display name"
    )


class SignupResponse(BaseModel):
    """Response for user registration."""

    message: str
    user_id: int
    email: str


class LoginRequest(BaseModel):
    """Request for user login."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class LoginResponse(BaseModel):
    """Response for successful login."""

    message: str
    user: "UserResponse"


class LogoutResponse(BaseModel):
    """Response for logout."""

    message: str


class UserResponse(BaseModel):
    """User information response."""

    id: int
    email: str
    name: Optional[str]
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class VerifyEmailRequest(BaseModel):
    """Request for email verification (link-based)."""

    token: str = Field(..., description="Email verification token")


class VerifyEmailResponse(BaseModel):
    """Response for email verification."""

    message: str
    verified: bool


class VerifyOTPRequest(BaseModel):
    """Request for OTP-based email verification."""

    email: EmailStr = Field(..., description="User email address")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")


class ResendVerificationRequest(BaseModel):
    """Request to resend verification email."""

    email: EmailStr = Field(..., description="User email address")


class ResendVerificationResponse(BaseModel):
    """Response for resend verification."""

    message: str


class AuthErrorResponse(BaseModel):
    """Error response for authentication failures."""

    detail: str
    code: Optional[str] = None
