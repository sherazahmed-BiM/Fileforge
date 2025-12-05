"""
Base Extractor for FileForge

Abstract base class that defines the interface for all file extractors.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Optional


class ElementType(str, Enum):
    """Types of extracted elements."""

    TEXT = "text"
    TITLE = "title"
    HEADING = "heading"
    PARAGRAPH = "paragraph"
    LIST_ITEM = "list_item"
    TABLE = "table"
    IMAGE = "image"
    CODE = "code"
    FORMULA = "formula"
    FOOTER = "footer"
    HEADER = "header"
    PAGE_BREAK = "page_break"
    UNKNOWN = "unknown"


@dataclass
class ExtractedElement:
    """
    Represents a single extracted element from a document.

    This is the atomic unit of extraction - can be text, table, image, etc.
    """

    element_type: ElementType
    content: str
    page_number: Optional[int] = None
    section: Optional[str] = None
    confidence: float = 1.0
    metadata: dict[str, Any] = field(default_factory=dict)

    # For tables
    table_data: Optional[list[list[str]]] = None
    table_html: Optional[str] = None

    # For images (base64 or description)
    image_data: Optional[str] = None
    image_description: Optional[str] = None

    @property
    def text_length(self) -> int:
        """Get the length of the content."""
        return len(self.content)

    def to_dict(self) -> dict[str, Any]:
        """Convert element to dictionary."""
        result = {
            "element_type": self.element_type.value,
            "content": self.content,
            "text_length": self.text_length,
            "confidence": self.confidence,
        }

        if self.page_number is not None:
            result["page_number"] = self.page_number
        if self.section:
            result["section"] = self.section
        if self.metadata:
            result["metadata"] = self.metadata
        if self.table_data:
            result["table_data"] = self.table_data
        if self.table_html:
            result["table_html"] = self.table_html
        if self.image_description:
            result["image_description"] = self.image_description

        return result


@dataclass
class ExtractionResult:
    """
    Result of document extraction.

    Contains all extracted elements plus document-level metadata.
    """

    elements: list[ExtractedElement]
    metadata: dict[str, Any] = field(default_factory=dict)
    raw_text: str = ""

    # Document info
    page_count: int = 0
    word_count: int = 0

    # Processing info
    extraction_method: str = ""
    warnings: list[str] = field(default_factory=list)

    @property
    def element_count(self) -> int:
        """Get total number of elements."""
        return len(self.elements)

    @property
    def text_elements(self) -> list[ExtractedElement]:
        """Get only text-based elements."""
        text_types = {
            ElementType.TEXT,
            ElementType.TITLE,
            ElementType.HEADING,
            ElementType.PARAGRAPH,
            ElementType.LIST_ITEM,
            ElementType.CODE,
        }
        return [el for el in self.elements if el.element_type in text_types]

    @property
    def table_elements(self) -> list[ExtractedElement]:
        """Get only table elements."""
        return [el for el in self.elements if el.element_type == ElementType.TABLE]

    @property
    def image_elements(self) -> list[ExtractedElement]:
        """Get only image elements."""
        return [el for el in self.elements if el.element_type == ElementType.IMAGE]

    def get_raw_text(self) -> str:
        """Combine all text content into raw text."""
        if self.raw_text:
            return self.raw_text

        texts = []
        for el in self.elements:
            if el.element_type == ElementType.TABLE and el.table_data:
                # Convert table to text representation
                table_text = self._table_to_text(el.table_data)
                texts.append(table_text)
            elif el.element_type == ElementType.IMAGE and el.image_description:
                texts.append(f"[Image: {el.image_description}]")
            elif el.content:
                texts.append(el.content)

        return "\n\n".join(texts)

    @staticmethod
    def _table_to_text(table_data: list[list[str]]) -> str:
        """Convert table data to readable text."""
        if not table_data:
            return ""

        lines = []
        for row in table_data:
            lines.append(" | ".join(str(cell) for cell in row))

        return "\n".join(lines)

    def to_dict(self) -> dict[str, Any]:
        """Convert result to dictionary."""
        return {
            "elements": [el.to_dict() for el in self.elements],
            "metadata": self.metadata,
            "raw_text": self.get_raw_text(),
            "page_count": self.page_count,
            "word_count": self.word_count,
            "element_count": self.element_count,
            "extraction_method": self.extraction_method,
            "warnings": self.warnings,
        }


class BaseExtractor(ABC):
    """
    Abstract base class for all file extractors.

    Each extractor handles a specific file type (PDF, DOCX, etc.)
    and converts it into a standardized ExtractionResult.
    """

    # Supported file extensions (set by subclasses)
    SUPPORTED_EXTENSIONS: set[str] = set()

    def __init__(self):
        """Initialize the extractor."""
        pass

    @classmethod
    def supports(cls, file_path: str | Path) -> bool:
        """Check if this extractor supports the given file."""
        ext = Path(file_path).suffix.lower()
        return ext in cls.SUPPORTED_EXTENSIONS

    @abstractmethod
    def extract(
        self,
        file_path: str | Path,
        **options: Any,
    ) -> ExtractionResult:
        """
        Extract content from a file.

        Args:
            file_path: Path to the file to extract
            **options: Extractor-specific options

        Returns:
            ExtractionResult containing all extracted elements
        """
        pass

    def _count_words(self, text: str) -> int:
        """Count words in text."""
        return len(text.split())

    def _create_element(
        self,
        element_type: ElementType,
        content: str,
        **kwargs: Any,
    ) -> ExtractedElement:
        """Helper to create an ExtractedElement."""
        return ExtractedElement(
            element_type=element_type,
            content=content,
            **kwargs,
        )
