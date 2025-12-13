"""
API Key Schemas for FileForge

Pydantic models for API key management and public API responses.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# API Key Management Schemas

class CreateAPIKeyRequest(BaseModel):
    """Request to create a new API key."""

    name: str = Field(
        default="Default",
        max_length=100,
        description="Friendly name for the API key"
    )
    rate_limit_rpm: int = Field(
        default=60,
        ge=1,
        le=1000,
        description="Requests per minute limit"
    )
    rate_limit_rpd: int = Field(
        default=1000,
        ge=1,
        le=100000,
        description="Requests per day limit"
    )
    expires_in_days: Optional[int] = Field(
        default=None,
        ge=1,
        le=365,
        description="Number of days until key expires (null for no expiration)"
    )


class CreateAPIKeyResponse(BaseModel):
    """Response when creating a new API key.

    IMPORTANT: The 'key' field contains the full API key and is only
    shown once. It cannot be retrieved again after this response.
    """

    id: int
    name: str
    key: str = Field(..., description="Full API key (shown only once!)")
    key_prefix: str
    rate_limit_rpm: int
    rate_limit_rpd: int
    expires_at: Optional[datetime]
    created_at: datetime


class APIKeyResponse(BaseModel):
    """API key information (without the full key)."""

    id: int
    name: str
    key_prefix: str
    is_active: bool
    rate_limit_rpm: int
    rate_limit_rpd: int
    total_requests: int
    last_used_at: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class APIKeyListResponse(BaseModel):
    """List of API keys."""

    items: list[APIKeyResponse]
    total: int


class UpdateAPIKeyRequest(BaseModel):
    """Request to update an API key."""

    name: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    rate_limit_rpm: Optional[int] = Field(None, ge=1, le=1000)
    rate_limit_rpd: Optional[int] = Field(None, ge=1, le=100000)


class DeleteAPIKeyResponse(BaseModel):
    """Response when deleting an API key."""

    message: str
    id: int


# Public API Schemas

class PublicAPIErrorDetail(BaseModel):
    """Error detail for public API responses."""

    code: str
    message: str
    retry_after: Optional[int] = Field(
        None,
        description="Seconds to wait before retrying (for rate limit errors)"
    )


class PublicAPIError(BaseModel):
    """Error response for public API."""

    success: bool = False
    error: PublicAPIErrorDetail


class DocumentInfo(BaseModel):
    """Document information in public API response."""

    filename: str
    file_type: str
    file_size_bytes: int
    page_count: int


class PageContent(BaseModel):
    """Page content in public API response."""

    page_number: int
    text: str
    word_count: int


class ChunkContent(BaseModel):
    """Chunk content in public API response."""

    index: int
    text: str
    token_count: int
    source_page: Optional[int] = None


class ContentResponse(BaseModel):
    """Content section of public API response."""

    pages: list[PageContent]
    chunks: list[ChunkContent]


class StatisticsResponse(BaseModel):
    """Statistics section of public API response."""

    total_pages: int
    total_words: int
    total_chunks: int
    total_tokens: int
    processing_time_ms: int


class ConvertResponse(BaseModel):
    """Successful response from public convert API."""

    success: bool = True
    document: DocumentInfo
    content: ContentResponse
    statistics: StatisticsResponse


class ConvertAsyncResponse(BaseModel):
    """Response from async convert endpoint."""

    success: bool = True
    job_id: str
    message: str = "File queued for processing"


class JobStatusResponse(BaseModel):
    """Response for job status check."""

    success: bool = True
    job_id: str
    status: str = Field(..., description="pending | processing | completed | failed")
    progress: Optional[int] = Field(None, ge=0, le=100)
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class UsageResponse(BaseModel):
    """Usage statistics for the current API key."""

    success: bool = True
    api_key_name: str
    rate_limit_rpm: int
    rate_limit_rpd: int
    requests_this_minute: int
    requests_today: int
    total_requests: int
    last_used_at: Optional[datetime]


class FormatInfo(BaseModel):
    """Supported format information."""

    extension: str
    mime_type: str
    category: str
    description: str


class FormatsResponse(BaseModel):
    """List of supported formats."""

    success: bool = True
    formats: list[FormatInfo]
    total: int
