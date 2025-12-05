"""
DOCX Extractor for FileForge

Extracts text, tables, and metadata from Word documents using python-docx.
"""

from pathlib import Path
from typing import Any, Optional

try:
    from docx import Document as DocxDocument
    from docx.table import Table
    from docx.text.paragraph import Paragraph
except ImportError:
    DocxDocument = None

from packages.common.services.conversion.extractors.base import (
    BaseExtractor,
    ElementType,
    ExtractedElement,
    ExtractionResult,
)
from packages.common.core.logging import get_logger


logger = get_logger(__name__)


class DOCXExtractor(BaseExtractor):
    """
    Extractor for DOCX files using python-docx.

    Features:
    - Text extraction with paragraph structure
    - Heading detection via styles
    - Table extraction
    - List detection
    - Document metadata
    """

    SUPPORTED_EXTENSIONS = {".docx"}

    def __init__(self):
        """Initialize DOCX extractor."""
        super().__init__()

        if DocxDocument is None:
            raise ImportError(
                "python-docx is required for DOCX extraction. "
                "Install with: pip install python-docx"
            )

    def extract(
        self,
        file_path: str | Path,
        **options: Any,
    ) -> ExtractionResult:
        """
        Extract content from a DOCX file.

        Args:
            file_path: Path to the DOCX file

        Returns:
            ExtractionResult with all extracted elements
        """
        file_path = Path(file_path)
        logger.info(f"Extracting DOCX: {file_path.name}")

        elements: list[ExtractedElement] = []
        warnings: list[str] = []

        try:
            doc = DocxDocument(file_path)
        except Exception as e:
            logger.error(f"Failed to open DOCX: {e}")
            raise

        # Extract document metadata
        metadata = self._extract_metadata(doc)

        # Track current section
        current_section: Optional[str] = None

        # Process document body elements in order
        for element in doc.element.body:
            tag = element.tag.split("}")[-1]  # Remove namespace

            if tag == "p":
                # Paragraph
                para = Paragraph(element, doc)
                para_element = self._process_paragraph(para, current_section)
                if para_element:
                    elements.append(para_element)
                    # Update section if this is a heading
                    if para_element.element_type in {ElementType.HEADING, ElementType.TITLE}:
                        current_section = para_element.content

            elif tag == "tbl":
                # Table
                table = Table(element, doc)
                table_element = self._process_table(table, current_section)
                if table_element:
                    elements.append(table_element)

        # Compute raw text
        raw_text = "\n\n".join(
            el.content for el in elements
            if el.element_type != ElementType.IMAGE
        )

        word_count = self._count_words(raw_text)

        return ExtractionResult(
            elements=elements,
            metadata=metadata,
            raw_text=raw_text,
            page_count=0,  # DOCX doesn't have fixed pages
            word_count=word_count,
            extraction_method="python-docx",
            warnings=warnings,
        )

    def _extract_metadata(self, doc: "DocxDocument") -> dict[str, Any]:
        """Extract document metadata."""
        metadata: dict[str, Any] = {}

        try:
            core_props = doc.core_properties

            if core_props.title:
                metadata["title"] = core_props.title
            if core_props.author:
                metadata["author"] = core_props.author
            if core_props.subject:
                metadata["subject"] = core_props.subject
            if core_props.created:
                metadata["created"] = str(core_props.created)
            if core_props.modified:
                metadata["modified"] = str(core_props.modified)
            if core_props.last_modified_by:
                metadata["last_modified_by"] = core_props.last_modified_by
            if core_props.keywords:
                metadata["keywords"] = core_props.keywords
            if core_props.category:
                metadata["category"] = core_props.category

        except Exception as e:
            logger.warning(f"Failed to extract DOCX metadata: {e}")

        return metadata

    def _process_paragraph(
        self,
        para: "Paragraph",
        current_section: Optional[str] = None,
    ) -> Optional[ExtractedElement]:
        """Process a paragraph element."""
        text = para.text.strip()

        if not text:
            return None

        # Determine element type based on style
        style_name = para.style.name.lower() if para.style else ""

        if "title" in style_name:
            element_type = ElementType.TITLE
        elif "heading" in style_name:
            element_type = ElementType.HEADING
        elif "list" in style_name or self._is_list_paragraph(para):
            element_type = ElementType.LIST_ITEM
        else:
            element_type = ElementType.PARAGRAPH

        return ExtractedElement(
            element_type=element_type,
            content=text,
            section=current_section,
            metadata={"style": para.style.name if para.style else None},
        )

    def _is_list_paragraph(self, para: "Paragraph") -> bool:
        """Check if paragraph is part of a list."""
        # Check for numbering
        if para._p.pPr is not None:
            numPr = para._p.pPr.numPr
            if numPr is not None:
                return True
        return False

    def _process_table(
        self,
        table: "Table",
        current_section: Optional[str] = None,
    ) -> Optional[ExtractedElement]:
        """Process a table element."""
        table_data: list[list[str]] = []

        for row in table.rows:
            row_data = []
            for cell in row.cells:
                cell_text = cell.text.strip()
                row_data.append(cell_text)
            table_data.append(row_data)

        if not table_data or not any(any(cell for cell in row) for row in table_data):
            return None

        # Convert to text representation
        table_text = self._table_to_markdown(table_data)

        return ExtractedElement(
            element_type=ElementType.TABLE,
            content=table_text,
            section=current_section,
            table_data=table_data,
            table_html=self._table_to_html(table_data),
        )

    def _table_to_markdown(self, table_data: list[list[str]]) -> str:
        """Convert table data to markdown format."""
        if not table_data:
            return ""

        lines = []

        # Header row
        if table_data:
            header = " | ".join(str(cell) for cell in table_data[0])
            lines.append(f"| {header} |")
            lines.append("| " + " | ".join("---" for _ in table_data[0]) + " |")

        # Data rows
        for row in table_data[1:]:
            row_text = " | ".join(str(cell) for cell in row)
            lines.append(f"| {row_text} |")

        return "\n".join(lines)

    def _table_to_html(self, table_data: list[list[str]]) -> str:
        """Convert table data to HTML format."""
        if not table_data:
            return ""

        html_parts = ["<table>"]

        # Header
        if table_data:
            html_parts.append("<thead><tr>")
            for cell in table_data[0]:
                html_parts.append(f"<th>{cell}</th>")
            html_parts.append("</tr></thead>")

        # Body
        html_parts.append("<tbody>")
        for row in table_data[1:]:
            html_parts.append("<tr>")
            for cell in row:
                html_parts.append(f"<td>{cell}</td>")
            html_parts.append("</tr>")
        html_parts.append("</tbody></table>")

        return "".join(html_parts)
