"""
Document Model for FileForge

Represents a converted document with metadata and processing status.
"""

import enum
from datetime import datetime
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from packages.common.models.base import BaseModel


if TYPE_CHECKING:
    from packages.common.models.chunk import Chunk
    from packages.common.models.user import User


class DocumentStatus(str, enum.Enum):
    """Document processing status."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Document(BaseModel):
    """
    Document model representing a converted file.

    Stores file information, metadata, and processing status.
    Related chunks are stored in the Chunk model.
    """

    # File information
    filename: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    file_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)

    # Owner (nullable for backward compatibility)
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Processing status
    status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus),
        default=DocumentStatus.PENDING,
        nullable=False,
        index=True,
    )
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Document metadata (extracted from file)
    doc_metadata: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True, default=dict)

    # Raw extracted text
    raw_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    raw_text_length: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)

    # Processing information
    processing_started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    processing_completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    processing_duration_ms: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)

    # Chunking configuration used
    chunk_strategy: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    chunk_size: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    chunk_overlap: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    total_chunks: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    total_tokens: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)

    # Relationships
    chunks: Mapped[list["Chunk"]] = relationship(
        "Chunk",
        back_populates="document",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    user: Mapped[Optional["User"]] = relationship("User", back_populates="documents")

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, filename='{self.filename}', status={self.status.value})>"

    def mark_processing(self) -> None:
        """Mark document as processing."""
        self.status = DocumentStatus.PROCESSING
        self.processing_started_at = datetime.utcnow()

    def mark_completed(self, total_chunks: int, total_tokens: int) -> None:
        """Mark document as completed."""
        self.status = DocumentStatus.COMPLETED
        self.processing_completed_at = datetime.utcnow()
        self.total_chunks = total_chunks
        self.total_tokens = total_tokens
        if self.processing_started_at:
            duration = self.processing_completed_at - self.processing_started_at
            self.processing_duration_ms = int(duration.total_seconds() * 1000)

    def mark_failed(self, error_message: str) -> None:
        """Mark document as failed."""
        self.status = DocumentStatus.FAILED
        self.error_message = error_message
        self.processing_completed_at = datetime.utcnow()
        if self.processing_started_at:
            duration = self.processing_completed_at - self.processing_started_at
            self.processing_duration_ms = int(duration.total_seconds() * 1000)
