"""
Parser Service for FileForge

Uses Unstructured.io for document parsing and text extraction.
Optionally uses Docling for PDF extraction when available.
"""

import hashlib
from pathlib import Path
from typing import Any, Optional

import tiktoken
from unstructured.chunking.basic import chunk_elements
from unstructured.chunking.title import chunk_by_title
from unstructured.partition.auto import partition

from packages.common.core.config import settings
from packages.common.core.logging import get_logger
from packages.common.schemas.convert import ChunkStrategy

# Try to import docling extractor
try:
    from packages.common.services.conversion.extractors.docling_extractor import (
        DoclingPDFExtractor,
    )
    DOCLING_AVAILABLE = True
except ImportError:
    DOCLING_AVAILABLE = False
    DoclingPDFExtractor = None  # type: ignore

logger = get_logger(__name__)


class UnstructuredElementAdapter:
    """
    Adapter to make ExtractedElement look like an Unstructured element.
    
    This allows docling extraction results to work with unstructured chunking.
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
        # Create a simple metadata object
        self.metadata = self._create_metadata()

    def _create_metadata(self) -> Any:
        """Create metadata object compatible with unstructured."""
        class Metadata:
            def __init__(self, page_number: Optional[int] = None, section: Optional[str] = None):
                self.page_number = page_number
                self.section = section
                self.text_as_html = None
                self.coordinates = None

        return Metadata(
            page_number=self._element.page_number,
            section=self._element.section,
        )

    def __str__(self) -> str:
        """Return element content as string."""
        return self._element.content


class ParserService:
    """
    Service for parsing documents using Docling as primary and Unstructured.io as fallback.

    Handles:
    - Document parsing (PDF, DOCX, XLSX, HTML, etc.)
    - Text extraction with metadata
    - Chunking (fixed and semantic)
    - Token counting
    
    Uses Docling as the primary extraction service for PDFs.
    Falls back to Unstructured only if Docling is unavailable or fails.
    """

    def __init__(self):
        """Initialize parser service with Docling as primary."""
        # Initialize tiktoken encoder for token counting
        try:
            self.encoder = tiktoken.get_encoding("cl100k_base")  # GPT-4 tokenizer
        except Exception:
            self.encoder = tiktoken.get_encoding("gpt2")
        
        self._docling_extractor = None

    @property
    def docling_extractor(self) -> Optional[DoclingPDFExtractor]:
        """Lazy load docling extractor (primary service)."""
        if not DOCLING_AVAILABLE:
            return None
        if self._docling_extractor is None:
            try:
                self._docling_extractor = DoclingPDFExtractor(
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
        strategy: str = "auto",
        extract_tables: bool = True,
        extract_images: bool = False,
        ocr_enabled: bool = True,
        ocr_languages: str = "eng",
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

        file_ext = file_path.suffix.lower()

        # Use docling as primary service for PDFs
        if file_ext == ".pdf":
            if self.docling_extractor:
                try:
                    logger.info("Using Docling (primary) for PDF extraction")
                    return self._parse_with_docling(
                        file_path,
                        extract_tables=extract_tables,
                        extract_images=extract_images,
                        ocr_enabled=ocr_enabled,
                    )
                except Exception as e:
                    logger.warning(
                        f"Docling extraction failed, falling back to Unstructured: {e}"
                    )
                    # Fall through to unstructured fallback
            else:
                logger.info("Docling unavailable, using Unstructured for PDF")

        # Fall back to unstructured for other formats or when docling unavailable/failed
        return self._parse_with_unstructured(
            file_path,
            strategy=strategy,
            extract_tables=extract_tables,
            extract_images=extract_images,
            ocr_enabled=ocr_enabled,
            ocr_languages=ocr_languages,
        )

    def _parse_with_docling(
        self,
        file_path: Path,
        extract_tables: bool = True,
        extract_images: bool = False,
        ocr_enabled: bool = True,
    ) -> tuple[list[Any], dict[str, Any]]:
        """Parse PDF using Docling (primary service)."""
        if not DOCLING_AVAILABLE:
            raise RuntimeError("Docling is not available")

        # Create extractor with current settings
        # Note: Converter initialization happens lazily on first use
        # and is cached per extractor instance for performance
        extractor = DoclingPDFExtractor(
            enable_ocr=ocr_enabled,
            enable_tables=extract_tables,
            generate_images=extract_images,
        )

        # Extract using docling
        # First extraction will initialize the converter (takes ~20s)
        # Subsequent extractions with same settings reuse the converter
        extraction_result = extractor.extract(
            file_path,
            extract_images=extract_images,
        )

        # Convert ExtractionResult to unstructured-like elements
        elements = []
        for el in extraction_result.elements:
            # Map element types to unstructured categories
            category_map = {
                "text": "NarrativeText",
                "title": "Title",
                "heading": "Title",
                "paragraph": "NarrativeText",
                "table": "Table",
                "image": "Figure",
            }
            category = category_map.get(el.element_type.value, "NarrativeText")
            
            adapter = UnstructuredElementAdapter(el, category=category)
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

    def _parse_with_unstructured(
        self,
        file_path: Path,
        strategy: str = "auto",
        extract_tables: bool = True,
        extract_images: bool = False,
        ocr_enabled: bool = True,
        ocr_languages: str = "eng",
    ) -> tuple[list[Any], dict[str, Any]]:
        """Parse file using Unstructured."""
        # Determine parsing strategy
        partition_kwargs: dict[str, Any] = {
            "filename": str(file_path),
            "infer_table_structure": extract_tables,
        }

        # Handle different file types
        file_ext = file_path.suffix.lower()

        if file_ext == ".pdf":
            partition_kwargs.update({
                "strategy": strategy if strategy != "auto" else "fast",
                "extract_images_in_pdf": extract_images,
            })
            if ocr_enabled:
                partition_kwargs["languages"] = ocr_languages.split(",")

        elif file_ext in [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff"]:
            if ocr_enabled:
                partition_kwargs["languages"] = ocr_languages.split(",")

        try:
            elements = partition(**partition_kwargs)
            logger.info(f"Extracted {len(elements)} elements from {file_path.name} using Unstructured")
        except Exception as e:
            logger.error(f"Failed to parse {file_path}: {e}")
            raise

        # Extract metadata
        metadata = self._extract_metadata(elements, file_path)
        metadata["extraction_method"] = "unstructured"

        return elements, metadata

    def _extract_metadata(self, elements: list[Any], file_path: Path) -> dict[str, Any]:
        """Extract document metadata from elements."""
        metadata: dict[str, Any] = {
            "filename": file_path.name,
            "file_extension": file_path.suffix.lower(),
        }

        # Get page count
        page_numbers = set()
        for el in elements:
            if hasattr(el, "metadata") and hasattr(el.metadata, "page_number"):
                if el.metadata.page_number is not None:
                    page_numbers.add(el.metadata.page_number)

        if page_numbers:
            metadata["page_count"] = max(page_numbers)

        # Count element types
        element_counts: dict[str, int] = {}
        for el in elements:
            category = getattr(el, "category", "Unknown")
            element_counts[category] = element_counts.get(category, 0) + 1

        metadata["element_counts"] = element_counts

        # Extract document properties if available
        if elements and hasattr(elements[0], "metadata"):
            el_metadata = elements[0].metadata
            if hasattr(el_metadata, "languages"):
                metadata["languages"] = el_metadata.languages

        return metadata

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
            elements: List of Unstructured elements
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
            chunked = chunk_by_title(
                elements,
                max_characters=chunk_size,
                new_after_n_chars=int(chunk_size * 0.8),
                combine_text_under_n_chars=int(chunk_size * 0.3),
                multipage_sections=True,
            )
        else:
            # Fixed-size chunking
            chunked = chunk_elements(
                elements,
                max_characters=chunk_size,
                new_after_n_chars=int(chunk_size * 0.8),
                overlap=chunk_overlap,
            )

        return self._elements_to_chunks(chunked)

    def _elements_to_chunks(self, elements: list[Any]) -> list[dict[str, Any]]:
        """Convert Unstructured elements to chunk dictionaries."""
        chunks = []

        for idx, element in enumerate(elements):
            text = str(element)
            token_count = self.count_tokens(text)

            chunk = {
                "index": idx,
                "text": text,
                "text_length": len(text),
                "token_count": token_count,
                "element_category": getattr(element, "category", None),
                "metadata": {},
            }

            # Extract element metadata
            if hasattr(element, "metadata"):
                el_meta = element.metadata
                if hasattr(el_meta, "page_number") and el_meta.page_number:
                    chunk["source_page"] = el_meta.page_number
                if hasattr(el_meta, "section"):
                    chunk["source_section"] = el_meta.section
                if hasattr(el_meta, "text_as_html") and el_meta.text_as_html:
                    chunk["metadata"]["html"] = el_meta.text_as_html
                if hasattr(el_meta, "coordinates") and el_meta.coordinates:
                    chunk["metadata"]["coordinates"] = {
                        "points": el_meta.coordinates.points,
                        "system": el_meta.coordinates.system,
                    }

            chunks.append(chunk)

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
    def get_mime_type(file_path: str | Path) -> Optional[str]:
        """Get MIME type using python-magic."""
        try:
            import magic
            return magic.from_file(str(file_path), mime=True)
        except Exception:
            return None
