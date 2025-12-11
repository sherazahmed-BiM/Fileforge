"""
API Key Schemas for FileForge

Pydantic models for API key management requests and responses.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from packages.common.models.api_key import ApiKeyStatus


class ApiKeyCreate(BaseModel):
    """Schema for creating a new API key."""

    name: str = Field(..., min_length=1, max_length=255, description="Name for the API key")
    description: str | None = Field(None, description="Optional description")
    rate_limit_rpm: int = Field(default=60, ge=1, le=10000, description="Rate limit (requests per minute)")
    expires_in_days: int | None = Field(None, ge=1, le=365, description="Days until expiration (null for no expiry)")
    owner_email: str | None = Field(None, max_length=255, description="Owner email for notifications")


class ApiKeyCreateResponse(BaseModel):
    """
    Response when creating a new API key.

    IMPORTANT: The full key is only shown once at creation time.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None = None
    key: str = Field(..., description="The full API key - SAVE THIS, it won't be shown again!")
    key_prefix: str = Field(..., description="Prefix shown for identification")
    status: ApiKeyStatus
    rate_limit_rpm: int
    expires_at: datetime | None = None
    created_at: datetime


class ApiKeyResponse(BaseModel):
    """Schema for API key in responses (without the full key)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None = None
    key_prefix: str = Field(..., description="Key prefix for identification")
    status: ApiKeyStatus
    rate_limit_rpm: int
    request_count: int
    last_used_at: datetime | None = None
    expires_at: datetime | None = None
    owner_email: str | None = None
    created_at: datetime
    updated_at: datetime


class ApiKeyListResponse(BaseModel):
    """Schema for paginated API key list."""

    items: list[ApiKeyResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ApiKeyUpdate(BaseModel):
    """Schema for updating an API key."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    rate_limit_rpm: int | None = Field(None, ge=1, le=10000)
    status: ApiKeyStatus | None = None


class ApiKeyUsageResponse(BaseModel):
    """API key usage statistics."""

    key_prefix: str
    name: str
    request_count: int
    last_used_at: datetime | None = None
    rate_limit_rpm: int
    current_usage_in_window: int = 0
