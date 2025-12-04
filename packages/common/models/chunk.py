"""
Chunk Model for FileForge

Represents a text chunk extracted from a document.
"""

import enum
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import BigInteger, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from packages.common.models.base import BaseModel


if TYPE_CHECKING:
    from packages.common.models.document import Document


class ChunkType(str, enum.Enum):
    """Chunk type based on extraction strategy."""

    FIXED = "fixed"       # Fixed-size character/token chunking
    SEMANTIC = "semantic"  # Title/section-based semantic chunking


class ElementCategory(str, enum.Enum):
    """
    Element category from Unstructured.io.

    Maps to the element types returned by the partition functions.
    """

    TITLE = "Title"
    NARRATIVE_TEXT = "NarrativeText"
    LIST_ITEM = "ListItem"
    TABLE = "Table"
    IMAGE = "Image"
    FORMULA = "Formula"
    FOOTER = "Footer"
    HEADER = "Header"
    PAGE_BREAK = "PageBreak"
    UNCATEGORIZED = "UncategorizedText"
    ADDRESS = "Address"
    EMAIL_ADDRESS = "EmailAddress"
    COMPOSITE_ELEMENT = "CompositeElement"  # From chunking


class Chunk(BaseModel):
    """
    Chunk model representing a text segment from a document.

    Each chunk contains:
    - Text content
    - Token count for LLM context management
    - Metadata about source location
    - Element category from parsing
    """

    # Foreign key to document
    document_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Chunk position
    index: Mapped[int] = mapped_column(Integer, nullable=False)

    # Content
    text: Mapped[str] = mapped_column(Text, nullable=False)
    text_length: Mapped[int] = mapped_column(Integer, nullable=False)
    token_count: Mapped[int] = mapped_column(Integer, nullable=False)

    # Chunk type and category
    chunk_type: Mapped[ChunkType] = mapped_column(
        Enum(ChunkType),
        default=ChunkType.FIXED,
        nullable=False,
    )
    element_category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Source metadata
    source_page: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    source_section: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Extended metadata (coordinates, HTML representation for tables, etc.)
    chunk_metadata: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True, default=dict)

    # Relationship to document
    document: Mapped["Document"] = relationship("Document", back_populates="chunks")

    def __repr__(self) -> str:
        return f"<Chunk(id={self.id}, document_id={self.document_id}, index={self.index}, tokens={self.token_count})>"

    def to_llm_format(self) -> dict[str, Any]:
        """
        Convert chunk to LLM-ready format.

        Returns a dictionary suitable for embedding or RAG pipelines.
        """
        return {
            "id": self.id,
            "document_id": self.document_id,
            "index": self.index,
            "text": self.text,
            "token_count": self.token_count,
            "metadata": {
                "chunk_type": self.chunk_type.value if self.chunk_type else None,
                "element_category": self.element_category,
                "source_page": self.source_page,
                "source_section": self.source_section,
                **(self.chunk_metadata or {}),
            },
        }
