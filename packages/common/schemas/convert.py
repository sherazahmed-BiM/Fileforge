"""
Conversion Schemas for FileForge

Pydantic models for file conversion requests and responses.
"""

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class ChunkStrategy(str, Enum):
    """Available chunking strategies."""

    FIXED = "fixed"       # Fixed-size character/token chunking
    SEMANTIC = "semantic"  # Title/section-based semantic chunking
    NONE = "none"         # No chunking, return raw text only


class ConvertRequest(BaseModel):
    """
    Request parameters for file conversion.

    These parameters are passed as form data alongside the file upload.
    """

    # Chunking configuration
    chunk_strategy: ChunkStrategy = Field(
        default=ChunkStrategy.SEMANTIC,
        description="Chunking strategy to use",
    )
    chunk_size: int = Field(
        default=1000,
        ge=100,
        le=10000,
        description="Target chunk size in characters (for fixed strategy)",
    )
    chunk_overlap: int = Field(
        default=100,
        ge=0,
        le=1000,
        description="Overlap between chunks in characters",
    )

    # Processing options
    extract_tables: bool = Field(
        default=True,
        description="Extract tables as structured data",
    )
    extract_images: bool = Field(
        default=False,
        description="Extract and OCR images from documents",
    )
    include_metadata: bool = Field(
        default=True,
        description="Include document metadata in output",
    )
    include_raw_text: bool = Field(
        default=False,
        description="Include full raw text in response",
    )

    # OCR settings
    ocr_enabled: bool = Field(
        default=True,
        description="Enable OCR for images and scanned documents",
    )
    ocr_languages: str = Field(
        default="eng",
        description="OCR languages (comma-separated, e.g., 'eng,fra,deu')",
    )

    # Output format
    output_format: str = Field(
        default="json",
        description="Output format (json only for now)",
    )


class ConvertResponse(BaseModel):
    """
    Response for async file conversion.

    Returns document ID for status polling.
    """

    document_id: int
    status: str
    message: str
    poll_url: str


class ConvertStatusResponse(BaseModel):
    """Response for conversion status check."""

    document_id: int
    status: str
    progress: Optional[float] = None
    error_message: Optional[str] = None
    result_url: Optional[str] = None


class ConvertSyncResponse(BaseModel):
    """
    Response for synchronous file conversion.

    Contains the full converted document data.
    """

    id: int
    filename: str
    file_type: str
    file_size_bytes: int
    processed_at: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    content: dict[str, Any] = Field(default_factory=dict)
    statistics: dict[str, Any] = Field(default_factory=dict)


class BatchConvertRequest(BaseModel):
    """Request for batch file conversion."""

    # Shared configuration for all files
    chunk_strategy: ChunkStrategy = Field(default=ChunkStrategy.SEMANTIC)
    chunk_size: int = Field(default=1000, ge=100, le=10000)
    chunk_overlap: int = Field(default=100, ge=0, le=1000)
    extract_tables: bool = Field(default=True)
    ocr_enabled: bool = Field(default=True)


class BatchConvertResponse(BaseModel):
    """Response for batch file conversion."""

    batch_id: str
    total_files: int
    documents: list[ConvertResponse]
    status: str


class SupportedFormatsResponse(BaseModel):
    """Response listing supported file formats."""

    formats: list[dict[str, Any]]
    total: int
