"""
Parser Service for FileForge

Uses Unstructured.io for document parsing and text extraction.
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


logger = get_logger(__name__)


class ParserService:
    """
    Service for parsing documents using Unstructured.io.

    Handles:
    - Document parsing (PDF, DOCX, XLSX, HTML, etc.)
    - Text extraction with metadata
    - Chunking (fixed and semantic)
    - Token counting
    """

    def __init__(self):
        """Initialize parser service."""
        # Initialize tiktoken encoder for token counting
        try:
            self.encoder = tiktoken.get_encoding("cl100k_base")  # GPT-4 tokenizer
        except Exception:
            self.encoder = tiktoken.get_encoding("gpt2")

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
            logger.info(f"Extracted {len(elements)} elements from {file_path.name}")
        except Exception as e:
            logger.error(f"Failed to parse {file_path}: {e}")
            raise

        # Extract metadata
        metadata = self._extract_metadata(elements, file_path)

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
