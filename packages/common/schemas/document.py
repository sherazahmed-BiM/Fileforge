"""
Document Schemas for FileForge

Pydantic models for document API requests and responses.
"""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from packages.common.models.document import DocumentStatus


class ChunkResponse(BaseModel):
    """Schema for chunk in API response."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    index: int
    text: str
    text_length: int
    token_count: int
    chunk_type: str
    element_category: Optional[str] = None
    source_page: Optional[int] = None
    source_section: Optional[str] = None
    metadata: Optional[dict[str, Any]] = Field(default=None, validation_alias="chunk_metadata")


class DocumentBase(BaseModel):
    """Base schema for document."""

    filename: str
    file_type: str
    file_size_bytes: int


class DocumentCreate(BaseModel):
    """Schema for creating a document (internal use)."""

    filename: str
    original_filename: str
    file_type: str
    mime_type: Optional[str] = None
    file_size_bytes: int
    file_hash: Optional[str] = None


class DocumentResponse(BaseModel):
    """Schema for document in API response."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    filename: str
    original_filename: str
    file_type: str
    mime_type: Optional[str] = None
    file_size_bytes: int
    file_hash: Optional[str] = None
    status: DocumentStatus
    error_message: Optional[str] = None
    metadata: Optional[dict[str, Any]] = Field(default=None, validation_alias="doc_metadata")
    raw_text_length: Optional[int] = None
    chunk_strategy: Optional[str] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
    total_chunks: Optional[int] = None
    total_tokens: Optional[int] = None
    processing_started_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None
    processing_duration_ms: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class DocumentWithChunksResponse(DocumentResponse):
    """Schema for document with chunks in API response."""

    chunks: list[ChunkResponse] = []


class DocumentListResponse(BaseModel):
    """Schema for paginated document list."""

    items: list[DocumentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class DocumentSummary(BaseModel):
    """Brief summary of a document."""

    id: int
    filename: str
    file_type: str
    status: DocumentStatus
    total_chunks: Optional[int] = None
    total_tokens: Optional[int] = None
    created_at: datetime


# LLM-ready output format
class LLMChunk(BaseModel):
    """LLM-ready chunk format."""

    index: int
    text: str
    token_count: int
    metadata: dict[str, Any] = Field(default_factory=dict)


class LLMDocumentContent(BaseModel):
    """LLM-ready document content."""

    raw_text: Optional[str] = None
    chunks: list[LLMChunk] = []


class LLMDocumentResponse(BaseModel):
    """
    LLM-ready document response format.

    This is the main output format for converted documents.
    """

    id: int
    filename: str
    file_type: str
    file_size_bytes: int
    processed_at: datetime
    metadata: dict[str, Any] = Field(default_factory=dict)
    content: LLMDocumentContent
    statistics: dict[str, Any] = Field(default_factory=dict)

    @classmethod
    def from_document(
        cls,
        document: "DocumentResponse",
        chunks: list[ChunkResponse],
        include_raw_text: bool = False,
        raw_text: Optional[str] = None,
    ) -> "LLMDocumentResponse":
        """Create LLM response from document and chunks."""
        llm_chunks = [
            LLMChunk(
                index=chunk.index,
                text=chunk.text,
                token_count=chunk.token_count,
                metadata={
                    "chunk_type": chunk.chunk_type,
                    "element_category": chunk.element_category,
                    "source_page": chunk.source_page,
                    "source_section": chunk.source_section,
                    **(chunk.metadata or {}),
                },
            )
            for chunk in chunks
        ]

        return cls(
            id=document.id,
            filename=document.filename,
            file_type=document.file_type,
            file_size_bytes=document.file_size_bytes,
            processed_at=document.processing_completed_at or document.updated_at,
            metadata=document.metadata or {},
            content=LLMDocumentContent(
                raw_text=raw_text if include_raw_text else None,
                chunks=llm_chunks,
            ),
            statistics={
                "total_chunks": document.total_chunks,
                "total_tokens": document.total_tokens,
                "chunk_strategy": document.chunk_strategy,
                "chunk_size": document.chunk_size,
                "chunk_overlap": document.chunk_overlap,
                "processing_duration_ms": document.processing_duration_ms,
            },
        )
