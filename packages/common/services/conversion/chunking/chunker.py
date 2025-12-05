"""
Chunker for FileForge

Provides semantic and fixed-size chunking for LLM-ready document processing.
"""

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

try:
    import tiktoken
except ImportError:
    tiktoken = None

from packages.common.services.conversion.extractors.base import (
    ExtractedElement,
    ElementType,
    ExtractionResult,
)
from packages.common.core.logging import get_logger


logger = get_logger(__name__)


class ChunkingStrategy(str, Enum):
    """Chunking strategies."""

    NONE = "none"  # No chunking, return elements as-is
    FIXED = "fixed"  # Fixed-size chunking by characters/tokens
    SEMANTIC = "semantic"  # Semantic chunking by document structure


@dataclass
class ProcessedChunk:
    """
    A processed chunk ready for LLM consumption.
    """

    index: int
    text: str
    token_count: int
    char_count: int

    # Source information
    element_types: list[str] = field(default_factory=list)
    source_pages: list[int] = field(default_factory=list)
    source_sections: list[str] = field(default_factory=list)

    # Additional metadata
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        result = {
            "index": self.index,
            "text": self.text,
            "token_count": self.token_count,
            "char_count": self.char_count,
        }

        if self.element_types:
            result["element_types"] = self.element_types
        if self.source_pages:
            result["source_pages"] = list(set(self.source_pages))
        if self.source_sections:
            result["source_sections"] = list(set(s for s in self.source_sections if s))
        if self.metadata:
            result["metadata"] = self.metadata

        return result


class Chunker:
    """
    Document chunker that converts extracted elements into LLM-ready chunks.

    Supports multiple strategies:
    - NONE: Returns each element as a separate chunk
    - FIXED: Splits text into fixed-size chunks with overlap
    - SEMANTIC: Groups elements by document structure (headings, sections)
    """

    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 100,
        use_token_count: bool = True,
    ):
        """
        Initialize chunker.

        Args:
            chunk_size: Target chunk size (tokens or characters based on use_token_count)
            chunk_overlap: Overlap between chunks
            use_token_count: If True, use tokens for sizing; otherwise use characters
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.use_token_count = use_token_count

        # Initialize tokenizer
        self.encoder = None
        if use_token_count and tiktoken:
            try:
                self.encoder = tiktoken.get_encoding("cl100k_base")
            except Exception:
                try:
                    self.encoder = tiktoken.get_encoding("gpt2")
                except Exception:
                    logger.warning("Failed to load tokenizer, falling back to character count")
                    self.use_token_count = False

    def chunk(
        self,
        result: ExtractionResult,
        strategy: ChunkingStrategy = ChunkingStrategy.SEMANTIC,
    ) -> list[ProcessedChunk]:
        """
        Chunk extracted elements into LLM-ready chunks.

        Args:
            result: ExtractionResult from an extractor
            strategy: Chunking strategy to use

        Returns:
            List of ProcessedChunk objects
        """
        if strategy == ChunkingStrategy.NONE:
            return self._chunk_none(result)
        elif strategy == ChunkingStrategy.FIXED:
            return self._chunk_fixed(result)
        else:  # SEMANTIC
            return self._chunk_semantic(result)

    def _chunk_none(self, result: ExtractionResult) -> list[ProcessedChunk]:
        """Return each element as a separate chunk."""
        chunks = []

        for idx, element in enumerate(result.elements):
            if not element.content.strip():
                continue

            chunks.append(
                ProcessedChunk(
                    index=idx,
                    text=element.content,
                    token_count=self.count_tokens(element.content),
                    char_count=len(element.content),
                    element_types=[element.element_type.value],
                    source_pages=[element.page_number] if element.page_number else [],
                    source_sections=[element.section] if element.section else [],
                    metadata=element.metadata.copy() if element.metadata else {},
                )
            )

        return chunks

    def _chunk_fixed(self, result: ExtractionResult) -> list[ProcessedChunk]:
        """Split into fixed-size chunks with overlap."""
        # Combine all text
        full_text = result.get_raw_text()

        if not full_text.strip():
            return []

        chunks = []
        chunk_idx = 0

        if self.use_token_count and self.encoder:
            # Token-based chunking
            chunks = self._chunk_by_tokens(full_text, result.elements)
        else:
            # Character-based chunking
            chunks = self._chunk_by_chars(full_text, result.elements)

        return chunks

    def _chunk_by_tokens(
        self,
        text: str,
        elements: list[ExtractedElement],
    ) -> list[ProcessedChunk]:
        """Chunk text by token count."""
        chunks = []
        tokens = self.encoder.encode(text)
        total_tokens = len(tokens)

        start = 0
        chunk_idx = 0

        while start < total_tokens:
            end = min(start + self.chunk_size, total_tokens)

            # Decode chunk
            chunk_tokens = tokens[start:end]
            chunk_text = self.encoder.decode(chunk_tokens)

            # Try to break at sentence boundary
            if end < total_tokens:
                chunk_text = self._adjust_to_sentence_boundary(chunk_text)

            if chunk_text.strip():
                chunks.append(
                    ProcessedChunk(
                        index=chunk_idx,
                        text=chunk_text.strip(),
                        token_count=len(self.encoder.encode(chunk_text)),
                        char_count=len(chunk_text),
                        element_types=self._get_element_types(elements),
                        source_pages=self._get_source_pages(elements),
                        source_sections=self._get_source_sections(elements),
                    )
                )
                chunk_idx += 1

            # Move to next chunk with overlap
            start = end - self.chunk_overlap
            if start <= 0 and end >= total_tokens:
                break

        return chunks

    def _chunk_by_chars(
        self,
        text: str,
        elements: list[ExtractedElement],
    ) -> list[ProcessedChunk]:
        """Chunk text by character count."""
        chunks = []
        total_chars = len(text)

        start = 0
        chunk_idx = 0

        while start < total_chars:
            end = min(start + self.chunk_size, total_chars)

            chunk_text = text[start:end]

            # Try to break at sentence boundary
            if end < total_chars:
                chunk_text = self._adjust_to_sentence_boundary(chunk_text)

            if chunk_text.strip():
                chunks.append(
                    ProcessedChunk(
                        index=chunk_idx,
                        text=chunk_text.strip(),
                        token_count=self.count_tokens(chunk_text),
                        char_count=len(chunk_text),
                        element_types=self._get_element_types(elements),
                        source_pages=self._get_source_pages(elements),
                        source_sections=self._get_source_sections(elements),
                    )
                )
                chunk_idx += 1

            # Move to next chunk with overlap
            start = end - self.chunk_overlap
            if start <= 0 and end >= total_chars:
                break

        return chunks

    def _chunk_semantic(self, result: ExtractionResult) -> list[ProcessedChunk]:
        """
        Semantic chunking based on document structure.

        Groups elements by sections (under headings) and respects
        the chunk_size limit.
        """
        chunks = []
        chunk_idx = 0

        current_section: Optional[str] = None
        current_elements: list[ExtractedElement] = []
        current_size = 0

        for element in result.elements:
            # Check if this is a section break (heading)
            is_section_break = element.element_type in {
                ElementType.TITLE,
                ElementType.HEADING,
            }

            element_size = self._get_size(element.content)

            # If this element alone exceeds chunk size, split it
            if element_size > self.chunk_size:
                # Flush current buffer first
                if current_elements:
                    chunk = self._create_chunk_from_elements(
                        chunk_idx, current_elements, current_section
                    )
                    if chunk:
                        chunks.append(chunk)
                        chunk_idx += 1
                    current_elements = []
                    current_size = 0

                # Split large element
                split_chunks = self._split_large_element(element, chunk_idx)
                for c in split_chunks:
                    chunks.append(c)
                    chunk_idx += 1
                continue

            # Check if we should start a new chunk
            should_break = False

            if is_section_break and current_elements:
                should_break = True
            elif current_size + element_size > self.chunk_size:
                should_break = True

            if should_break:
                chunk = self._create_chunk_from_elements(
                    chunk_idx, current_elements, current_section
                )
                if chunk:
                    chunks.append(chunk)
                    chunk_idx += 1
                current_elements = []
                current_size = 0

            # Update current section
            if is_section_break:
                current_section = element.content

            # Add element to current buffer
            current_elements.append(element)
            current_size += element_size

        # Flush remaining elements
        if current_elements:
            chunk = self._create_chunk_from_elements(
                chunk_idx, current_elements, current_section
            )
            if chunk:
                chunks.append(chunk)

        return chunks

    def _create_chunk_from_elements(
        self,
        index: int,
        elements: list[ExtractedElement],
        section: Optional[str],
    ) -> Optional[ProcessedChunk]:
        """Create a chunk from a list of elements."""
        if not elements:
            return None

        texts = []
        for el in elements:
            if el.element_type == ElementType.TABLE and el.table_data:
                # Include table as markdown
                texts.append(el.content)
            elif el.content.strip():
                texts.append(el.content.strip())

        text = "\n\n".join(texts)

        if not text.strip():
            return None

        return ProcessedChunk(
            index=index,
            text=text,
            token_count=self.count_tokens(text),
            char_count=len(text),
            element_types=list(set(el.element_type.value for el in elements)),
            source_pages=[el.page_number for el in elements if el.page_number],
            source_sections=[section] if section else [],
        )

    def _split_large_element(
        self,
        element: ExtractedElement,
        start_index: int,
    ) -> list[ProcessedChunk]:
        """Split a large element into multiple chunks."""
        chunks = []
        text = element.content

        # For tables, try to split by rows
        if element.element_type == ElementType.TABLE and element.table_data:
            return self._split_large_table(element, start_index)

        # For text, split by sentences
        sentences = self._split_into_sentences(text)
        current_text = ""
        current_size = 0
        chunk_idx = start_index

        for sentence in sentences:
            sentence_size = self._get_size(sentence)

            if current_size + sentence_size > self.chunk_size and current_text:
                chunks.append(
                    ProcessedChunk(
                        index=chunk_idx,
                        text=current_text.strip(),
                        token_count=self.count_tokens(current_text),
                        char_count=len(current_text),
                        element_types=[element.element_type.value],
                        source_pages=[element.page_number] if element.page_number else [],
                        source_sections=[element.section] if element.section else [],
                    )
                )
                chunk_idx += 1
                current_text = ""
                current_size = 0

            current_text += sentence + " "
            current_size += sentence_size

        # Add remaining text
        if current_text.strip():
            chunks.append(
                ProcessedChunk(
                    index=chunk_idx,
                    text=current_text.strip(),
                    token_count=self.count_tokens(current_text),
                    char_count=len(current_text),
                    element_types=[element.element_type.value],
                    source_pages=[element.page_number] if element.page_number else [],
                    source_sections=[element.section] if element.section else [],
                )
            )

        return chunks

    def _split_large_table(
        self,
        element: ExtractedElement,
        start_index: int,
    ) -> list[ProcessedChunk]:
        """Split a large table into multiple chunks."""
        chunks = []

        if not element.table_data:
            return chunks

        table_data = element.table_data
        header = table_data[0] if table_data else []

        current_rows = [header]
        current_size = self._get_size(str(header))
        chunk_idx = start_index

        for row in table_data[1:]:
            row_size = self._get_size(str(row))

            if current_size + row_size > self.chunk_size and len(current_rows) > 1:
                # Create chunk
                chunk_text = self._table_to_markdown(current_rows)
                chunks.append(
                    ProcessedChunk(
                        index=chunk_idx,
                        text=chunk_text,
                        token_count=self.count_tokens(chunk_text),
                        char_count=len(chunk_text),
                        element_types=[ElementType.TABLE.value],
                        source_pages=[element.page_number] if element.page_number else [],
                        source_sections=[element.section] if element.section else [],
                    )
                )
                chunk_idx += 1
                current_rows = [header]
                current_size = self._get_size(str(header))

            current_rows.append(row)
            current_size += row_size

        # Add remaining rows
        if len(current_rows) > 1:
            chunk_text = self._table_to_markdown(current_rows)
            chunks.append(
                ProcessedChunk(
                    index=chunk_idx,
                    text=chunk_text,
                    token_count=self.count_tokens(chunk_text),
                    char_count=len(chunk_text),
                    element_types=[ElementType.TABLE.value],
                    source_pages=[element.page_number] if element.page_number else [],
                    source_sections=[element.section] if element.section else [],
                )
            )

        return chunks

    def _get_size(self, text: str) -> int:
        """Get size of text based on chunking mode."""
        if self.use_token_count and self.encoder:
            return len(self.encoder.encode(text))
        return len(text)

    def count_tokens(self, text: str) -> int:
        """Count tokens in text."""
        if self.encoder:
            try:
                return len(self.encoder.encode(text))
            except Exception:
                pass
        # Fallback: estimate ~4 chars per token
        return len(text) // 4

    def _split_into_sentences(self, text: str) -> list[str]:
        """Split text into sentences."""
        # Simple sentence splitter
        pattern = r"(?<=[.!?])\s+"
        sentences = re.split(pattern, text)
        return [s.strip() for s in sentences if s.strip()]

    def _adjust_to_sentence_boundary(self, text: str) -> str:
        """Try to adjust chunk to end at a sentence boundary."""
        # Find last sentence ending
        match = re.search(r"[.!?]\s*[A-Z]", text[::-1])
        if match:
            end_pos = len(text) - match.start()
            # Only use if we're not cutting too much
            if end_pos > len(text) * 0.5:
                return text[:end_pos]
        return text

    def _get_element_types(self, elements: list[ExtractedElement]) -> list[str]:
        """Get unique element types."""
        return list(set(el.element_type.value for el in elements))

    def _get_source_pages(self, elements: list[ExtractedElement]) -> list[int]:
        """Get unique source pages."""
        return list(set(el.page_number for el in elements if el.page_number))

    def _get_source_sections(self, elements: list[ExtractedElement]) -> list[str]:
        """Get unique source sections."""
        return list(set(el.section for el in elements if el.section))

    def _table_to_markdown(self, table_data: list[list[str]]) -> str:
        """Convert table data to markdown."""
        if not table_data:
            return ""

        lines = []
        if table_data:
            header = " | ".join(str(cell) for cell in table_data[0])
            lines.append(f"| {header} |")
            lines.append("| " + " | ".join("---" for _ in table_data[0]) + " |")

        for row in table_data[1:]:
            row_text = " | ".join(str(cell) for cell in row)
            lines.append(f"| {row_text} |")

        return "\n".join(lines)
