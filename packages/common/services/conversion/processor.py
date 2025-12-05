"""
Document Processor for FileForge

Processes PDF files and extracts text content.
"""

import hashlib
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from packages.common.services.conversion.extractors.base import ExtractionResult
from packages.common.services.conversion.extractors.pdf_extractor import PDFExtractor
from packages.common.core.logging import get_logger


logger = get_logger(__name__)


@dataclass
class ProcessingResult:
    """
    Result of document processing.

    Contains extracted text and metadata.
    """

    # File info
    filename: str
    file_type: str
    file_size_bytes: int
    file_hash: str

    # Extraction result
    extraction: ExtractionResult

    # Statistics
    page_count: int = 0
    word_count: int = 0

    # Warnings
    warnings: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        """Set statistics from extraction."""
        self.page_count = self.extraction.page_count
        self.word_count = self.extraction.word_count

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary format."""
        return {
            "document": {
                "filename": self.filename,
                "file_type": self.file_type,
                "file_size_bytes": self.file_size_bytes,
                "file_hash": self.file_hash,
                "metadata": self.extraction.metadata,
            },
            "pages": [
                {
                    "page_number": el.page_number,
                    "text": el.content,
                }
                for el in self.extraction.elements
                if el.content.strip()
            ],
            "statistics": {
                "page_count": self.page_count,
                "word_count": self.word_count,
            },
            "extraction_method": self.extraction.extraction_method,
            "warnings": self.warnings + self.extraction.warnings,
        }


class DocumentProcessor:
    """
    Document processor for extracting text from PDFs.

    Usage:
        processor = DocumentProcessor()
        result = processor.process("document.pdf")
        data = result.to_dict()
    """

    def __init__(self):
        """Initialize document processor."""
        self._pdf_extractor = None

    @property
    def pdf_extractor(self) -> PDFExtractor:
        """Lazy load PDF extractor."""
        if self._pdf_extractor is None:
            self._pdf_extractor = PDFExtractor()
        return self._pdf_extractor

    def process(self, file_path: str | Path, **options: Any) -> ProcessingResult:
        """
        Process a PDF file and extract text.

        Args:
            file_path: Path to the PDF file
            **options: Additional options (reserved for future use)

        Returns:
            ProcessingResult with extracted text
        """
        file_path = Path(file_path)
        logger.info(f"Processing file: {file_path.name}")

        # Validate file exists
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        # Check file type
        ext = file_path.suffix.lower()
        if ext != ".pdf":
            raise ValueError(f"Only PDF files are supported. Got: {ext}")

        # Get file info
        file_size = file_path.stat().st_size
        file_hash = self._compute_hash(file_path)

        # Extract text
        extraction_result = self.pdf_extractor.extract(file_path)

        # Build result
        result = ProcessingResult(
            filename=file_path.name,
            file_type="pdf",
            file_size_bytes=file_size,
            file_hash=file_hash,
            extraction=extraction_result,
            warnings=[],
        )

        logger.info(
            f"Processed {file_path.name}: "
            f"{result.page_count} pages, {result.word_count} words"
        )

        return result

    @staticmethod
    def _compute_hash(file_path: Path) -> str:
        """Compute SHA-256 hash of file."""
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                sha256.update(chunk)
        return sha256.hexdigest()
