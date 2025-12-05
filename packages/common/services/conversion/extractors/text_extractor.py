"""
Text Extractor for FileForge

Extracts content from plain text, Markdown, and HTML files.
"""

import re
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Optional

from packages.common.services.conversion.extractors.base import (
    BaseExtractor,
    ElementType,
    ExtractedElement,
    ExtractionResult,
)
from packages.common.core.logging import get_logger


logger = get_logger(__name__)


class HTMLTextExtractor(HTMLParser):
    """HTML parser that extracts text content."""

    def __init__(self):
        super().__init__()
        self.result: list[str] = []
        self.current_tag: Optional[str] = None
        self.skip_tags = {"script", "style", "noscript", "head", "meta", "link"}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, Optional[str]]]) -> None:
        self.current_tag = tag.lower()

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in {"p", "div", "br", "h1", "h2", "h3", "h4", "h5", "h6", "li", "tr"}:
            self.result.append("\n")
        self.current_tag = None

    def handle_data(self, data: str) -> None:
        if self.current_tag not in self.skip_tags:
            text = data.strip()
            if text:
                self.result.append(text + " ")

    def get_text(self) -> str:
        return "".join(self.result).strip()


class TextExtractor(BaseExtractor):
    """
    Extractor for plain text files.

    Supports: TXT
    """

    SUPPORTED_EXTENSIONS = {".txt"}

    def extract(
        self,
        file_path: str | Path,
        encoding: Optional[str] = None,
        **options: Any,
    ) -> ExtractionResult:
        """
        Extract content from a text file.

        Args:
            file_path: Path to the text file
            encoding: File encoding (auto-detected if None)

        Returns:
            ExtractionResult with extracted text
        """
        file_path = Path(file_path)
        logger.info(f"Extracting TXT: {file_path.name}")

        # Detect encoding if not provided
        if encoding is None:
            encoding = self._detect_encoding(file_path)

        try:
            with open(file_path, "r", encoding=encoding) as f:
                content = f.read()
        except Exception as e:
            logger.error(f"Failed to read text file: {e}")
            raise

        elements = self._parse_text(content)

        raw_text = content.strip()
        word_count = self._count_words(raw_text)

        return ExtractionResult(
            elements=elements,
            metadata={"encoding": encoding},
            raw_text=raw_text,
            page_count=1,
            word_count=word_count,
            extraction_method="text",
            warnings=[],
        )

    def _detect_encoding(self, file_path: Path) -> str:
        """Detect file encoding."""
        encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252", "ascii"]

        for enc in encodings:
            try:
                with open(file_path, "r", encoding=enc) as f:
                    f.read()
                return enc
            except UnicodeDecodeError:
                continue

        return "utf-8"

    def _parse_text(self, content: str) -> list[ExtractedElement]:
        """Parse text into elements (paragraphs)."""
        elements: list[ExtractedElement] = []

        # Split by blank lines to get paragraphs
        paragraphs = re.split(r"\n\s*\n", content)

        for para in paragraphs:
            text = para.strip()
            if text:
                elements.append(
                    ExtractedElement(
                        element_type=ElementType.PARAGRAPH,
                        content=text,
                    )
                )

        return elements


class MarkdownExtractor(BaseExtractor):
    """
    Extractor for Markdown files.

    Features:
    - Heading detection (# syntax)
    - Code block detection
    - List detection
    - Table detection
    """

    SUPPORTED_EXTENSIONS = {".md", ".markdown"}

    def extract(
        self,
        file_path: str | Path,
        encoding: Optional[str] = None,
        **options: Any,
    ) -> ExtractionResult:
        """
        Extract content from a Markdown file.

        Args:
            file_path: Path to the Markdown file
            encoding: File encoding (auto-detected if None)

        Returns:
            ExtractionResult with extracted elements
        """
        file_path = Path(file_path)
        logger.info(f"Extracting Markdown: {file_path.name}")

        # Detect encoding if not provided
        if encoding is None:
            encoding = self._detect_encoding(file_path)

        try:
            with open(file_path, "r", encoding=encoding) as f:
                content = f.read()
        except Exception as e:
            logger.error(f"Failed to read Markdown file: {e}")
            raise

        elements = self._parse_markdown(content)

        raw_text = content.strip()
        word_count = self._count_words(raw_text)

        return ExtractionResult(
            elements=elements,
            metadata={"encoding": encoding},
            raw_text=raw_text,
            page_count=1,
            word_count=word_count,
            extraction_method="markdown",
            warnings=[],
        )

    def _detect_encoding(self, file_path: Path) -> str:
        """Detect file encoding."""
        encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]

        for enc in encodings:
            try:
                with open(file_path, "r", encoding=enc) as f:
                    f.read()
                return enc
            except UnicodeDecodeError:
                continue

        return "utf-8"

    def _parse_markdown(self, content: str) -> list[ExtractedElement]:
        """Parse Markdown into structured elements."""
        elements: list[ExtractedElement] = []
        lines = content.split("\n")

        i = 0
        current_section: Optional[str] = None

        while i < len(lines):
            line = lines[i]

            # Check for code block
            if line.startswith("```"):
                code_lines = []
                lang = line[3:].strip()
                i += 1
                while i < len(lines) and not lines[i].startswith("```"):
                    code_lines.append(lines[i])
                    i += 1
                if code_lines:
                    elements.append(
                        ExtractedElement(
                            element_type=ElementType.CODE,
                            content="\n".join(code_lines),
                            section=current_section,
                            metadata={"language": lang} if lang else {},
                        )
                    )
                i += 1
                continue

            # Check for heading
            heading_match = re.match(r"^(#{1,6})\s+(.+)$", line)
            if heading_match:
                level = len(heading_match.group(1))
                title = heading_match.group(2).strip()
                element_type = ElementType.TITLE if level == 1 else ElementType.HEADING
                current_section = title
                elements.append(
                    ExtractedElement(
                        element_type=element_type,
                        content=title,
                        section=current_section if level > 1 else None,
                        metadata={"level": level},
                    )
                )
                i += 1
                continue

            # Check for list item
            list_match = re.match(r"^\s*[-*+]\s+(.+)$", line) or re.match(r"^\s*\d+\.\s+(.+)$", line)
            if list_match:
                elements.append(
                    ExtractedElement(
                        element_type=ElementType.LIST_ITEM,
                        content=list_match.group(1).strip(),
                        section=current_section,
                    )
                )
                i += 1
                continue

            # Check for table (simple markdown table)
            if "|" in line and i + 1 < len(lines) and re.match(r"^\|[\s\-:|]+\|$", lines[i + 1]):
                table_lines = [line]
                i += 1
                while i < len(lines) and "|" in lines[i]:
                    table_lines.append(lines[i])
                    i += 1

                table_data = self._parse_markdown_table(table_lines)
                if table_data:
                    elements.append(
                        ExtractedElement(
                            element_type=ElementType.TABLE,
                            content="\n".join(table_lines),
                            section=current_section,
                            table_data=table_data,
                        )
                    )
                continue

            # Regular paragraph
            if line.strip():
                # Collect consecutive non-empty lines as paragraph
                para_lines = [line]
                i += 1
                while i < len(lines) and lines[i].strip() and not lines[i].startswith("#") and not lines[i].startswith("```"):
                    if re.match(r"^\s*[-*+]\s+", lines[i]) or re.match(r"^\s*\d+\.\s+", lines[i]):
                        break
                    if "|" in lines[i]:
                        break
                    para_lines.append(lines[i])
                    i += 1

                elements.append(
                    ExtractedElement(
                        element_type=ElementType.PARAGRAPH,
                        content=" ".join(para_lines).strip(),
                        section=current_section,
                    )
                )
                continue

            i += 1

        return elements

    def _parse_markdown_table(self, lines: list[str]) -> list[list[str]]:
        """Parse markdown table into 2D array."""
        table_data: list[list[str]] = []

        for i, line in enumerate(lines):
            # Skip separator line
            if i == 1 and re.match(r"^\|[\s\-:|]+\|$", line):
                continue

            cells = [cell.strip() for cell in line.split("|")]
            # Remove empty first/last cells from pipe-delimited format
            if cells and not cells[0]:
                cells = cells[1:]
            if cells and not cells[-1]:
                cells = cells[:-1]

            if cells:
                table_data.append(cells)

        return table_data


class HTMLExtractor(BaseExtractor):
    """
    Extractor for HTML files.

    Features:
    - Text extraction with tag awareness
    - Title extraction
    - Basic structure preservation
    """

    SUPPORTED_EXTENSIONS = {".html", ".htm"}

    def extract(
        self,
        file_path: str | Path,
        encoding: Optional[str] = None,
        **options: Any,
    ) -> ExtractionResult:
        """
        Extract content from an HTML file.

        Args:
            file_path: Path to the HTML file
            encoding: File encoding (auto-detected if None)

        Returns:
            ExtractionResult with extracted text
        """
        file_path = Path(file_path)
        logger.info(f"Extracting HTML: {file_path.name}")

        # Detect encoding if not provided
        if encoding is None:
            encoding = self._detect_encoding(file_path)

        try:
            with open(file_path, "r", encoding=encoding) as f:
                content = f.read()
        except Exception as e:
            logger.error(f"Failed to read HTML file: {e}")
            raise

        elements = self._parse_html(content)

        raw_text = "\n\n".join(el.content for el in elements)
        word_count = self._count_words(raw_text)

        # Extract title
        title_match = re.search(r"<title[^>]*>([^<]+)</title>", content, re.IGNORECASE)
        title = title_match.group(1).strip() if title_match else None

        metadata: dict[str, Any] = {"encoding": encoding}
        if title:
            metadata["title"] = title

        return ExtractionResult(
            elements=elements,
            metadata=metadata,
            raw_text=raw_text,
            page_count=1,
            word_count=word_count,
            extraction_method="html",
            warnings=[],
        )

    def _detect_encoding(self, file_path: Path) -> str:
        """Detect file encoding."""
        # Try to find encoding in meta tag first
        try:
            with open(file_path, "rb") as f:
                head = f.read(1024).decode("ascii", errors="ignore")
                charset_match = re.search(r'charset=["\']?([^"\'\s>]+)', head, re.IGNORECASE)
                if charset_match:
                    return charset_match.group(1)
        except Exception:
            pass

        # Fall back to common encodings
        encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
        for enc in encodings:
            try:
                with open(file_path, "r", encoding=enc) as f:
                    f.read()
                return enc
            except UnicodeDecodeError:
                continue

        return "utf-8"

    def _parse_html(self, content: str) -> list[ExtractedElement]:
        """Parse HTML into text elements."""
        elements: list[ExtractedElement] = []

        # Extract title
        title_match = re.search(r"<title[^>]*>([^<]+)</title>", content, re.IGNORECASE)
        if title_match:
            elements.append(
                ExtractedElement(
                    element_type=ElementType.TITLE,
                    content=title_match.group(1).strip(),
                )
            )

        # Extract headings
        for match in re.finditer(r"<h([1-6])[^>]*>([^<]+)</h\1>", content, re.IGNORECASE):
            level = int(match.group(1))
            text = match.group(2).strip()
            if text:
                elements.append(
                    ExtractedElement(
                        element_type=ElementType.HEADING,
                        content=text,
                        metadata={"level": level},
                    )
                )

        # Extract body text
        parser = HTMLTextExtractor()
        try:
            # Try to find body content
            body_match = re.search(r"<body[^>]*>(.*)</body>", content, re.IGNORECASE | re.DOTALL)
            if body_match:
                parser.feed(body_match.group(1))
            else:
                parser.feed(content)

            body_text = parser.get_text()

            # Split into paragraphs
            paragraphs = re.split(r"\n\s*\n", body_text)
            for para in paragraphs:
                text = para.strip()
                if text and len(text) > 20:  # Skip very short fragments
                    elements.append(
                        ExtractedElement(
                            element_type=ElementType.PARAGRAPH,
                            content=text,
                        )
                    )

        except Exception as e:
            logger.warning(f"HTML parsing error: {e}")

        return elements
