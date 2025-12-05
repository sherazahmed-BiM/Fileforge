"""
PDF Text Extractor for FileForge

Focused on extracting text from PDFs with maximum accuracy.
Uses PyMuPDF (fitz) for text extraction.
"""

from pathlib import Path
from typing import Any

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

from packages.common.services.conversion.extractors.base import (
    BaseExtractor,
    ElementType,
    ExtractedElement,
    ExtractionResult,
)
from packages.common.core.logging import get_logger


logger = get_logger(__name__)


class PDFExtractor(BaseExtractor):
    """
    PDF text extractor using PyMuPDF.

    Focused purely on accurate text extraction from PDFs.
    """

    SUPPORTED_EXTENSIONS = {".pdf"}

    def __init__(self):
        """Initialize PDF extractor."""
        super().__init__()

        if fitz is None:
            raise ImportError(
                "PyMuPDF is required for PDF extraction. "
                "Install with: pip install pymupdf"
            )

    def extract(
        self,
        file_path: str | Path,
        **options: Any,
    ) -> ExtractionResult:
        """
        Extract text from a PDF file.

        Args:
            file_path: Path to the PDF file

        Returns:
            ExtractionResult with extracted text
        """
        file_path = Path(file_path)
        logger.info(f"Extracting text from PDF: {file_path.name}")

        elements: list[ExtractedElement] = []
        warnings: list[str] = []
        metadata: dict[str, Any] = {}

        try:
            doc = fitz.open(file_path)
        except Exception as e:
            logger.error(f"Failed to open PDF: {e}")
            raise

        try:
            # Extract document metadata
            metadata = self._extract_metadata(doc)
            page_count = len(doc)

            # Process each page
            for page_num in range(page_count):
                page = doc[page_num]
                page_text = self._extract_page_text(page, page_num + 1)

                if page_text:
                    elements.append(
                        ExtractedElement(
                            element_type=ElementType.TEXT,
                            content=page_text,
                            page_number=page_num + 1,
                        )
                    )

            # Check if PDF has very little text (might be scanned)
            total_text = sum(len(el.content) for el in elements)
            if total_text < 100 and page_count > 0:
                warnings.append(
                    "PDF has very little extractable text. "
                    "It may be a scanned document requiring OCR."
                )

        finally:
            doc.close()

        # Combine all text
        raw_text = "\n\n".join(
            el.content for el in elements if el.content.strip()
        )

        word_count = len(raw_text.split()) if raw_text else 0

        return ExtractionResult(
            elements=elements,
            metadata=metadata,
            raw_text=raw_text,
            page_count=page_count,
            word_count=word_count,
            extraction_method="pymupdf",
            warnings=warnings,
        )

    def _extract_metadata(self, doc: "fitz.Document") -> dict[str, Any]:
        """Extract PDF metadata."""
        metadata: dict[str, Any] = {}

        try:
            pdf_metadata = doc.metadata
            if pdf_metadata:
                if pdf_metadata.get("title"):
                    metadata["title"] = pdf_metadata["title"]
                if pdf_metadata.get("author"):
                    metadata["author"] = pdf_metadata["author"]
                if pdf_metadata.get("subject"):
                    metadata["subject"] = pdf_metadata["subject"]
                if pdf_metadata.get("creationDate"):
                    metadata["creation_date"] = pdf_metadata["creationDate"]
        except Exception as e:
            logger.warning(f"Failed to extract PDF metadata: {e}")

        return metadata

    def _extract_page_text(self, page: "fitz.Page", page_num: int) -> str:
        """
        Extract text from a single page with maximum accuracy.

        Uses multiple extraction methods and picks the best result.
        """
        # Method 1: Standard text extraction
        text_standard = page.get_text("text")

        # Method 2: Text with layout preservation
        text_layout = page.get_text("text", flags=fitz.TEXT_PRESERVE_WHITESPACE)

        # Method 3: Block-based extraction for better structure
        text_blocks = self._extract_text_blocks(page)

        # Pick the method that gives the most content
        # while maintaining readability
        candidates = [
            ("standard", text_standard),
            ("layout", text_layout),
            ("blocks", text_blocks),
        ]

        # Choose the one with best quality
        best_text = ""
        best_score = 0

        for method, text in candidates:
            if not text:
                continue

            score = self._score_text_quality(text)
            if score > best_score:
                best_score = score
                best_text = text

        # Clean up the text
        cleaned = self._clean_text(best_text)

        return cleaned

    def _extract_text_blocks(self, page: "fitz.Page") -> str:
        """Extract text using block-based method for better structure."""
        blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]

        text_parts = []

        for block in blocks:
            if block.get("type") != 0:  # Skip non-text blocks
                continue

            block_lines = []
            for line in block.get("lines", []):
                line_text = ""
                for span in line.get("spans", []):
                    line_text += span.get("text", "")
                if line_text.strip():
                    block_lines.append(line_text.strip())

            if block_lines:
                block_text = " ".join(block_lines)
                text_parts.append(block_text)

        return "\n\n".join(text_parts)

    def _score_text_quality(self, text: str) -> float:
        """
        Score text quality based on various factors.

        Higher score = better quality text.
        """
        if not text:
            return 0

        score = 0.0

        # Length (more text is generally better, up to a point)
        length = len(text)
        score += min(length / 100, 10)  # Max 10 points for length

        # Word count (readable words)
        words = text.split()
        word_count = len(words)
        score += min(word_count / 10, 10)  # Max 10 points

        # Average word length (reasonable = 4-8 chars)
        if word_count > 0:
            avg_word_len = sum(len(w) for w in words) / word_count
            if 4 <= avg_word_len <= 8:
                score += 5

        # Penalize excessive whitespace
        whitespace_ratio = text.count(" ") / max(length, 1)
        if whitespace_ratio > 0.5:
            score -= 5

        # Penalize too many special characters
        special_chars = sum(1 for c in text if not c.isalnum() and not c.isspace())
        special_ratio = special_chars / max(length, 1)
        if special_ratio > 0.3:
            score -= 5

        return max(score, 0)

    def _clean_text(self, text: str) -> str:
        """Clean up extracted text while preserving accuracy."""
        if not text:
            return ""

        # Normalize line endings
        text = text.replace("\r\n", "\n").replace("\r", "\n")

        # Remove excessive blank lines (more than 2 consecutive)
        import re
        text = re.sub(r"\n{3,}", "\n\n", text)

        # Remove trailing whitespace from lines
        lines = [line.rstrip() for line in text.split("\n")]
        text = "\n".join(lines)

        # Remove leading/trailing whitespace from entire text
        text = text.strip()

        return text
