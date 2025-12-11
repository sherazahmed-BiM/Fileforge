"""
Document Processor for FileForge

Processes multiple document formats and extracts text content.

Supported formats:
- Modern Office: PDF, DOCX, XLSX, PPTX
- Legacy Office: DOC, XLS, PPT, RTF, ODT, etc. (via LibreOffice)
- Markup: HTML, Markdown, RST, ORG, AsciiDoc
- Email: EML, MSG, P7S
- Ebooks: EPUB
- Data: CSV, TSV, DBF, DIF
- Images: PNG, JPG, TIFF, BMP, WEBP, GIF, HEIC (with OCR)
"""

import hashlib
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from packages.common.core.logging import get_logger
from packages.common.services.conversion.extractors.base import (
    ElementType,
    ExtractionResult,
)
from packages.common.services.conversion.extractors.universal_extractor import (
    UniversalExtractor,
)


logger = get_logger(__name__)

# Use UniversalExtractor's extensions as single source of truth
SUPPORTED_EXTENSIONS = UniversalExtractor.SUPPORTED_EXTENSIONS


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
        """Convert to dictionary format with text and images organized by page."""
        # Check if this is structured tabular data (CSV/XLSX)
        if self.extraction.structured_data:
            return self._to_structured_dict()

        # Standard document processing
        return self._to_document_dict()

    def _to_structured_dict(self) -> dict[str, Any]:
        """Convert structured tabular data (CSV) to LLM-ready JSON format."""
        structured = self.extraction.structured_data
        if not structured:
            return self._to_document_dict()

        # Get summary from metadata
        summary = self.extraction.metadata.get("csv_summary", {})

        # Build tables array with native JSON objects (not strings)
        tables = []
        for table in structured:
            tables.append({
                "name": table.name,
                "schema": table.schema.to_dict(),
                "rows": table.rows,  # Native JSON objects
                "row_count": table.row_count,
                "column_count": table.column_count,
                "page_number": table.page_number,  # 1-based for readability
                "page_index": table.page_index,    # 0-based for programmatic use
                "total_pages": table.total_pages,
            })

        # Build the output structure
        result = {
            "document": {
                "filename": self.filename,
                "file_type": self.file_type,
                "file_size_bytes": self.file_size_bytes,
                "file_hash": self.file_hash,
                "format": "structured_json",
            },
            "summary": {
                "total_rows": summary.get("total_rows", 0),
                "total_columns": summary.get("total_columns", 0),
                "columns": summary.get("columns", []),
                "column_types": summary.get("column_types", {}),
                "total_pages": summary.get("pages", 1),
                "rows_per_page": summary.get("rows_per_page", 500),
            },
            "tables": tables,
            "extraction_method": self.extraction.extraction_method,
            "warnings": self.warnings + self.extraction.warnings,
        }

        # Add origin metadata if available
        if "origin" in summary:
            result["origin"] = summary["origin"]

        # Add markdown version if available
        if "markdown" in self.extraction.metadata:
            result["markdown"] = self.extraction.metadata["markdown"]

        return result

    def _to_document_dict(self) -> dict[str, Any]:
        """Convert standard document to dictionary format with text and images by page."""
        # Group elements by page
        pages_data: dict[int, dict[str, Any]] = {}

        for el in self.extraction.elements:
            page_num = el.page_number or 1

            if page_num not in pages_data:
                pages_data[page_num] = {
                    "page_number": page_num,
                    "text": "",
                    "images": [],
                }

            if el.element_type == ElementType.TEXT:
                # Append text content
                if el.content.strip():
                    if pages_data[page_num]["text"]:
                        pages_data[page_num]["text"] += "\n\n"
                    pages_data[page_num]["text"] += el.content
            elif el.element_type == ElementType.IMAGE and el.image_data:
                # Add image
                pages_data[page_num]["images"].append({
                    "description": el.content,
                    "data": el.image_data,
                    "metadata": el.metadata,
                })

        # Convert to sorted list
        pages = [pages_data[p] for p in sorted(pages_data.keys())]

        # If no pages found, create a single page with all text
        if not pages and self.extraction.raw_text:
            pages = [{
                "page_number": 1,
                "text": self.extraction.raw_text,
                "images": [],
            }]

        # Count total images
        total_images = sum(len(p["images"]) for p in pages)

        return {
            "document": {
                "filename": self.filename,
                "file_type": self.file_type,
                "file_size_bytes": self.file_size_bytes,
                "file_hash": self.file_hash,
                "metadata": self.extraction.metadata,
            },
            "pages": pages,
            "statistics": {
                "page_count": self.page_count or len(pages),
                "word_count": self.word_count,
                "image_count": total_images,
            },
            "extraction_method": self.extraction.extraction_method,
            "warnings": self.warnings + self.extraction.warnings,
        }


class DocumentProcessor:
    """
    Document processor for extracting text from multiple file formats.

    Uses UniversalExtractor as the primary extraction service, which routes to:
    - Docling for modern formats (PDF, DOCX, XLSX, PPTX, HTML, MD, CSV, images)
    - LibreOffice + Docling for legacy formats (DOC, XLS, PPT, RTF, ODT, etc.)
    - Specialized parsers for email, ebooks, and data formats

    Supported formats:
    - Modern Office: PDF, DOCX, XLSX, PPTX
    - Legacy Office: DOC, XLS, PPT, RTF, ODT, etc. (via LibreOffice)
    - Markup: HTML, Markdown, RST, ORG, AsciiDoc
    - Email: EML, MSG, P7S
    - Ebooks: EPUB
    - Data: CSV, TSV, DBF, DIF
    - Images: PNG, JPG, TIFF, BMP, WEBP, GIF, HEIC (with OCR)

    Usage:
        processor = DocumentProcessor()
        result = processor.process("document.pdf")
        data = result.to_dict()
    """

    def __init__(self):
        """Initialize document processor with UniversalExtractor as primary."""
        self._extractor = None

    @property
    def extractor(self):
        """Lazy load document extractor (UniversalExtractor → Docling → PyMuPDF fallback)."""
        if self._extractor is None:
            # Try UniversalExtractor first (handles all formats)
            try:
                from packages.common.services.conversion.extractors.universal_extractor import (
                    UniversalExtractor,
                )
                self._extractor = UniversalExtractor()
                logger.info("Using UniversalExtractor for document extraction")
            except (ImportError, Exception) as e:
                logger.warning(f"UniversalExtractor not available: {e}")
                # Fall back to DoclingExtractor
                try:
                    from packages.common.services.conversion.extractors.docling_extractor import (
                        DoclingExtractor,
                    )
                    self._extractor = DoclingExtractor()
                    logger.info("Falling back to DoclingExtractor")
                except (ImportError, Exception) as e2:
                    logger.warning(f"Docling not available: {e2}")
                    # Final fallback to PDF-only extractor
                    from packages.common.services.conversion.extractors.pdf_extractor import (
                        PDFExtractor,
                    )
                    self._extractor = PDFExtractor()
                    logger.info("Falling back to PyMuPDF (PDF only)")
        return self._extractor

    def process(self, file_path: str | Path, **options: Any) -> ProcessingResult:
        """
        Process a document file and extract text.

        Args:
            file_path: Path to the document file
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
        if ext not in SUPPORTED_EXTENSIONS:
            supported_list = ", ".join(sorted(SUPPORTED_EXTENSIONS))
            raise ValueError(f"Unsupported file format: {ext}. Supported: {supported_list}")

        # Get file info
        file_size = file_path.stat().st_size
        file_hash = self._compute_hash(file_path)

        # Determine file type (without dot)
        file_type = ext[1:] if ext.startswith(".") else ext

        # Extract text
        extraction_result = self.extractor.extract(file_path)

        # Build result
        result = ProcessingResult(
            filename=file_path.name,
            file_type=file_type,
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
