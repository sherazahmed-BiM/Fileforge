"""
Parser Service for FileForge

Uses Docling as the primary document parsing and text extraction service.
Implements custom chunking strategies without external ML dependencies.
"""

import hashlib
from pathlib import Path
from typing import Any

import tiktoken

from packages.common.core.logging import get_logger
from packages.common.schemas.convert import ChunkStrategy


# Try to import docling extractor
try:
    from packages.common.services.conversion.extractors.docling_extractor import (
        DoclingExtractor,
    )
    DOCLING_AVAILABLE = True
except ImportError:
    DOCLING_AVAILABLE = False
    DoclingExtractor = None  # type: ignore

logger = get_logger(__name__)


class ElementAdapter:
    """
    Adapter to provide a consistent interface for extracted elements.
    """

    def __init__(self, element: Any, category: str = "NarrativeText"):
        """
        Initialize adapter.

        Args:
            element: ExtractedElement from docling
            category: Element category (defaults to NarrativeText)
        """
        self._element = element
        self.category = category
        self.page_number = getattr(element, "page_number", None)
        self.section = getattr(element, "section", None)
        self.content = getattr(element, "content", str(element))

    def __str__(self) -> str:
        """Return element content as string."""
        return self.content


class ParserService:
    """
    Service for parsing documents using Docling.

    Handles:
    - Document parsing (PDF, DOCX, XLSX, HTML, etc.)
    - Text extraction with metadata
    - Chunking (fixed and semantic)
    - Token counting
    """

    def __init__(self):
        """Initialize parser service with Docling."""
        # Initialize tiktoken encoder for token counting
        try:
            self.encoder = tiktoken.get_encoding("cl100k_base")  # GPT-4 tokenizer
        except Exception:
            self.encoder = tiktoken.get_encoding("gpt2")

        self._docling_extractor = None

    @property
    def docling_extractor(self) -> DoclingExtractor | None:
        """Lazy load docling extractor."""
        if not DOCLING_AVAILABLE:
            return None
        if self._docling_extractor is None:
            try:
                self._docling_extractor = DoclingExtractor(
                    enable_ocr=False,  # Can be enabled via options
                    enable_tables=True,
                    generate_images=True,
                )
            except Exception as e:
                logger.warning(f"Failed to initialize Docling extractor: {e}")
                return None
        return self._docling_extractor

    def parse_file(
        self,
        file_path: str | Path,
        strategy: str = "auto",  # noqa: ARG002 - kept for API compatibility
        extract_tables: bool = True,
        extract_images: bool = False,
        ocr_enabled: bool = True,
        ocr_languages: str = "eng",  # noqa: ARG002 - kept for API compatibility
    ) -> tuple[list[Any], dict[str, Any]]:
        """
        Parse a file and extract elements.

        Args:
            file_path: Path to the file
            strategy: Parsing strategy ('auto', 'fast', 'hi_res')
            extract_tables: Whether to extract tables
            extract_images: Whether to extract images
            ocr_enabled: Whether to enable OCR
            ocr_languages: OCR languages (comma-separated)

        Returns:
            Tuple of (elements, metadata)
        """
        file_path = Path(file_path)
        logger.info(f"Parsing file: {file_path}")

        if not DOCLING_AVAILABLE:
            raise RuntimeError(
                "Docling is not available. Please install docling package."
            )

        if not self.docling_extractor:
            raise RuntimeError("Failed to initialize Docling extractor")

        try:
            return self._parse_with_docling(
                file_path,
                extract_tables=extract_tables,
                extract_images=extract_images,
                ocr_enabled=ocr_enabled,
            )
        except Exception as e:
            logger.error(f"Docling extraction failed: {e}")
            raise

    def _parse_with_docling(
        self,
        file_path: Path,
        extract_tables: bool = True,
        extract_images: bool = False,
        ocr_enabled: bool = True,
    ) -> tuple[list[Any], dict[str, Any]]:
        """Parse file using Docling."""
        if not DOCLING_AVAILABLE:
            raise RuntimeError("Docling is not available")

        # Create extractor with current settings
        extractor = DoclingExtractor(
            enable_ocr=ocr_enabled,
            enable_tables=extract_tables,
            generate_images=extract_images,
        )

        # Extract using docling
        extraction_result = extractor.extract(
            file_path,
            extract_images=extract_images,
        )

        # Convert ExtractionResult to element adapters
        elements = []
        for el in extraction_result.elements:
            # Map element types to categories
            category_map = {
                "text": "NarrativeText",
                "title": "Title",
                "heading": "Title",
                "paragraph": "NarrativeText",
                "table": "Table",
                "image": "Figure",
            }
            category = category_map.get(el.element_type.value, "NarrativeText")

            adapter = ElementAdapter(el, category=category)
            elements.append(adapter)

        # Extract metadata
        metadata = extraction_result.metadata.copy()
        metadata["filename"] = file_path.name
        metadata["file_extension"] = file_path.suffix.lower()
        metadata["page_count"] = extraction_result.page_count
        metadata["extraction_method"] = "docling"

        # Count element types
        element_counts: dict[str, int] = {}
        for el in elements:
            category = getattr(el, "category", "Unknown")
            element_counts[category] = element_counts.get(category, 0) + 1
        metadata["element_counts"] = element_counts

        logger.info(
            f"Extracted {len(elements)} elements from {file_path.name} using Docling"
        )

        return elements, metadata

    def chunk_elements(
        self,
        elements: list[Any],
        strategy: ChunkStrategy,
        chunk_size: int = 1000,
        chunk_overlap: int = 100,
    ) -> list[dict[str, Any]]:
        """
        Chunk elements using the specified strategy.

        Args:
            elements: List of elements
            strategy: Chunking strategy
            chunk_size: Target chunk size in characters
            chunk_overlap: Overlap between chunks

        Returns:
            List of chunk dictionaries
        """
        if strategy == ChunkStrategy.NONE:
            # No chunking - return each element as a chunk
            return self._elements_to_chunks(elements)

        if strategy == ChunkStrategy.SEMANTIC:
            # Semantic chunking by title/section
            return self._chunk_by_semantic(elements, chunk_size)
        else:
            # Fixed-size chunking
            return self._chunk_fixed_size(elements, chunk_size, chunk_overlap)

    def _chunk_by_semantic(
        self,
        elements: list[Any],
        max_chunk_size: int = 1000,
    ) -> list[dict[str, Any]]:
        """
        Chunk elements semantically by grouping under titles/headings.

        Args:
            elements: List of elements
            max_chunk_size: Maximum chunk size in characters

        Returns:
            List of chunk dictionaries
        """
        chunks = []
        current_chunk_texts: list[str] = []
        current_chunk_size = 0
        current_section: str | None = None
        current_page: int | None = None

        for element in elements:
            text = str(element)
            text_len = len(text)
            category = getattr(element, "category", "NarrativeText")
            page = getattr(element, "page_number", None)
            section = getattr(element, "section", None)

            # Check if this is a title/heading that should start a new chunk
            is_title = category in ("Title", "Header", "Heading")

            # Start new chunk if:
            # 1. Current chunk + new text exceeds max size, OR
            # 2. We hit a new title/section
            should_split = (
                current_chunk_size + text_len > max_chunk_size
                and current_chunk_texts
            ) or (is_title and current_chunk_texts)

            if should_split:
                # Save current chunk
                chunk_text = "\n\n".join(current_chunk_texts)
                if chunk_text.strip():
                    chunks.append({
                        "index": len(chunks),
                        "text": chunk_text,
                        "text_length": len(chunk_text),
                        "token_count": self.count_tokens(chunk_text),
                        "element_category": "NarrativeText",
                        "source_page": current_page,
                        "source_section": current_section,
                        "metadata": {},
                    })

                # Reset for new chunk
                current_chunk_texts = []
                current_chunk_size = 0

            # Add text to current chunk
            if text.strip():
                current_chunk_texts.append(text)
                current_chunk_size += text_len

            # Update tracking
            if page:
                current_page = page
            if section:
                current_section = section

        # Don't forget the last chunk
        if current_chunk_texts:
            chunk_text = "\n\n".join(current_chunk_texts)
            if chunk_text.strip():
                chunks.append({
                    "index": len(chunks),
                    "text": chunk_text,
                    "text_length": len(chunk_text),
                    "token_count": self.count_tokens(chunk_text),
                    "element_category": "NarrativeText",
                    "source_page": current_page,
                    "source_section": current_section,
                    "metadata": {},
                })

        return chunks

    def _chunk_fixed_size(
        self,
        elements: list[Any],
        chunk_size: int = 1000,
        chunk_overlap: int = 100,
    ) -> list[dict[str, Any]]:
        """
        Chunk elements using fixed-size chunking with overlap.

        Args:
            elements: List of elements
            chunk_size: Target chunk size in characters
            chunk_overlap: Overlap between chunks

        Returns:
            List of chunk dictionaries
        """
        # First, get all text combined
        full_text = "\n\n".join(str(el) for el in elements)

        if not full_text.strip():
            return []

        chunks = []
        start = 0
        text_len = len(full_text)

        while start < text_len:
            # Calculate end position
            end = min(start + chunk_size, text_len)

            # Try to break at a sentence or word boundary
            if end < text_len:
                # Look for sentence boundary (. ! ?)
                for boundary in [". ", "! ", "? ", "\n\n", "\n", " "]:
                    boundary_pos = full_text.rfind(boundary, start, end)
                    if boundary_pos > start + chunk_size // 2:
                        end = boundary_pos + len(boundary)
                        break

            chunk_text = full_text[start:end].strip()

            if chunk_text:
                chunks.append({
                    "index": len(chunks),
                    "text": chunk_text,
                    "text_length": len(chunk_text),
                    "token_count": self.count_tokens(chunk_text),
                    "element_category": "NarrativeText",
                    "source_page": None,
                    "source_section": None,
                    "metadata": {},
                })

            # Move start position with overlap
            start = end - chunk_overlap if end < text_len else text_len

        return chunks

    def _elements_to_chunks(self, elements: list[Any]) -> list[dict[str, Any]]:
        """Convert elements to chunk dictionaries (no chunking)."""
        chunks = []

        for idx, element in enumerate(elements):
            text = str(element)
            if not text.strip():
                continue

            token_count = self.count_tokens(text)

            chunk = {
                "index": idx,
                "text": text,
                "text_length": len(text),
                "token_count": token_count,
                "element_category": getattr(element, "category", None),
                "source_page": getattr(element, "page_number", None),
                "source_section": getattr(element, "section", None),
                "metadata": {},
            }

            chunks.append(chunk)

        # Re-index after filtering empty elements
        for idx, chunk in enumerate(chunks):
            chunk["index"] = idx

        return chunks

    def count_tokens(self, text: str) -> int:
        """Count tokens in text using tiktoken."""
        try:
            return len(self.encoder.encode(text))
        except Exception:
            # Fallback: estimate ~4 chars per token
            return len(text) // 4

    def get_raw_text(self, elements: list[Any]) -> str:
        """Get raw text from all elements."""
        return "\n\n".join(str(el) for el in elements)

    @staticmethod
    def compute_file_hash(file_path: str | Path) -> str:
        """Compute SHA-256 hash of a file."""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    @staticmethod
    def get_file_type(file_path: str | Path) -> str:
        """Get file type from extension."""
        ext = Path(file_path).suffix.lower()
        type_map = {
            ".pdf": "pdf",
            ".docx": "docx",
            ".doc": "doc",
            ".xlsx": "xlsx",
            ".xls": "xls",
            ".pptx": "pptx",
            ".ppt": "ppt",
            ".txt": "txt",
            ".md": "markdown",
            ".html": "html",
            ".htm": "html",
            ".csv": "csv",
            ".json": "json",
            ".xml": "xml",
            ".png": "image",
            ".jpg": "image",
            ".jpeg": "image",
            ".gif": "image",
            ".bmp": "image",
            ".tiff": "image",
        }
        return type_map.get(ext, "unknown")

    @staticmethod
    def get_mime_type(file_path: str | Path) -> str | None:
        """Get MIME type using python-magic."""
        try:
            import magic
            return magic.from_file(str(file_path), mime=True)
        except Exception:
            return None
