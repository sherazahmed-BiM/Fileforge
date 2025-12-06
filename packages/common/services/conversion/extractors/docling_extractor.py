"""
Docling-based Extractor for FileForge

Uses Docling for high-accuracy document text and image extraction.
Supports multiple file formats: PDF, DOCX, XLSX, PPTX, HTML, Markdown, images, and more.
Docling provides superior document understanding with layout analysis.

Supported formats and extraction strategies:
- PDF: Full layout analysis, tables, images, OCR support
- DOCX: Word documents with formatting preserved
- XLSX: Excel spreadsheets exported as markdown tables
- PPTX: PowerPoint presentations with slide content
- HTML/HTM/XHTML: Web pages with structure preserved
- MD/Markdown: Markdown files passed through
- CSV: Tabular data as markdown tables
- Images (PNG, JPG, JPEG, TIFF, BMP, WEBP, GIF): OCR text extraction
- Audio (WAV, MP3): Transcription (if supported)
- AsciiDoc: Documentation format
- VTT: Video captions/subtitles
- XML: Structured data extraction
- JSON: Docling JSON format
"""

import base64
import io
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

# Lazy imports for Docling
_docling_available = None
_DocumentConverter = None
_PdfFormatOption = None
_PdfPipelineOptions = None
_InputFormat = None
_ImageRefMode = None


def _load_docling():
    """Lazy load Docling to avoid import overhead."""
    global _docling_available, _DocumentConverter, _PdfFormatOption
    global _PdfPipelineOptions, _InputFormat, _ImageRefMode

    if _docling_available is not None:
        return _docling_available

    try:
        from docling.document_converter import DocumentConverter, PdfFormatOption
        from docling.datamodel.pipeline_options import PdfPipelineOptions
        from docling.datamodel.base_models import InputFormat
        from docling_core.types.doc import ImageRefMode

        _DocumentConverter = DocumentConverter
        _PdfFormatOption = PdfFormatOption
        _PdfPipelineOptions = PdfPipelineOptions
        _InputFormat = InputFormat
        _ImageRefMode = ImageRefMode
        _docling_available = True
        logger.info("Docling loaded successfully")
    except ImportError as e:
        logger.warning(f"Docling not available: {e}")
        _docling_available = False

    return _docling_available


def _get_input_format(file_path: Path) -> Optional[Any]:
    """Map file extension to Docling InputFormat."""
    if _InputFormat is None:
        return None

    ext = file_path.suffix.lower()

    # Map extensions to InputFormat enum values
    # Based on Docling 2.64.0: ASCIIDOC, AUDIO, CSV, DOCX, HTML, IMAGE,
    # JSON_DOCLING, MD, METS_GBS, PDF, PPTX, VTT, XLSX, XML_JATS, XML_USPTO
    format_map = {
        # Documents
        '.pdf': _InputFormat.PDF,
        '.docx': _InputFormat.DOCX,
        '.xlsx': _InputFormat.XLSX,
        '.pptx': _InputFormat.PPTX,
        # Markup
        '.html': _InputFormat.HTML,
        '.htm': _InputFormat.HTML,
        '.xhtml': _InputFormat.HTML,  # Use HTML for XHTML
        '.md': _InputFormat.MD,
        '.markdown': _InputFormat.MD,
        '.adoc': _InputFormat.ASCIIDOC,
        '.asciidoc': _InputFormat.ASCIIDOC,
        # Data
        '.csv': _InputFormat.CSV,
        '.vtt': _InputFormat.VTT,
        # Images (all use IMAGE type)
        '.png': _InputFormat.IMAGE,
        '.jpg': _InputFormat.IMAGE,
        '.jpeg': _InputFormat.IMAGE,
        '.tiff': _InputFormat.IMAGE,
        '.tif': _InputFormat.IMAGE,
        '.bmp': _InputFormat.IMAGE,
        '.webp': _InputFormat.IMAGE,
        '.gif': _InputFormat.IMAGE,
        # Audio
        '.wav': _InputFormat.AUDIO,
        '.mp3': _InputFormat.AUDIO,
        # XML formats
        '.xml': _InputFormat.XML_USPTO,
        # Docling JSON
        '.json': _InputFormat.JSON_DOCLING,
    }

    return format_map.get(ext)


def _get_format_category(input_format) -> str:
    """Get the category of a file format for logging and processing hints."""
    if _InputFormat is None:
        return "unknown"

    if input_format == _InputFormat.PDF:
        return "document"
    elif input_format in (_InputFormat.DOCX, _InputFormat.PPTX):
        return "office"
    elif input_format == _InputFormat.XLSX:
        return "spreadsheet"
    elif input_format == _InputFormat.CSV:
        return "tabular"
    elif input_format in (_InputFormat.HTML, _InputFormat.MD, _InputFormat.ASCIIDOC):
        return "markup"
    elif input_format == _InputFormat.IMAGE:
        return "image"
    elif input_format == _InputFormat.AUDIO:
        return "audio"
    elif input_format == _InputFormat.VTT:
        return "caption"
    elif input_format in (_InputFormat.XML_USPTO, _InputFormat.XML_JATS):
        return "xml"
    elif input_format == _InputFormat.JSON_DOCLING:
        return "json"
    else:
        return "other"


class DoclingExtractor(BaseExtractor):
    """
    Multi-format extractor using Docling for high-accuracy extraction.

    Supports: PDF, DOCX, XLSX, PPTX, HTML, Markdown, CSV, images (PNG, JPEG, TIFF, BMP, WEBP),
    audio (WAV, MP3), and more.

    Docling provides:
    - Advanced layout analysis
    - Accurate text extraction with reading order
    - Table structure recognition
    - Picture/image extraction
    - OCR support for scanned documents and images
    """

    # All file formats supported by Docling
    SUPPORTED_EXTENSIONS = {
        # Documents
        ".pdf", ".docx", ".xlsx", ".pptx",
        # Markup
        ".html", ".htm", ".xhtml", ".md", ".markdown", ".adoc", ".asciidoc",
        # Data
        ".csv",
        # Images
        ".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp", ".webp",
        # Audio
        ".wav", ".mp3",
        # Docling JSON
        ".json",
    }

    def __init__(
        self,
        enable_ocr: bool = False,
        enable_tables: bool = True,
        generate_images: bool = True,
        images_scale: float = 2.0,
    ):
        """
        Initialize Docling extractor for multiple file formats.

        Args:
            enable_ocr: Enable OCR for scanned documents and images
            enable_tables: Enable table structure extraction
            generate_images: Extract images from documents
            images_scale: Scale factor for extracted images
        """
        super().__init__()

        if not _load_docling():
            raise ImportError(
                "Docling is required for this extractor. "
                "Install with: pip install docling[ocr]"
            )

        self.enable_ocr = enable_ocr
        self.enable_tables = enable_tables
        self.generate_images = generate_images
        self.images_scale = images_scale

        # Lazy-load converter (per format)
        self._converters: dict[str, Any] = {}

    def _get_converter(self, file_path: Path):
        """Get or create converter for specific file format."""
        input_format = _get_input_format(file_path)

        if input_format is None:
            raise ValueError(f"Unsupported file format: {file_path.suffix}")

        format_key = str(input_format)

        if format_key not in self._converters:
            # Configure format-specific options
            format_options = {}

            # PDF-specific options
            if input_format == _InputFormat.PDF:
                pipeline_options = _PdfPipelineOptions()
                pipeline_options.do_ocr = self.enable_ocr
                pipeline_options.do_table_structure = self.enable_tables
                pipeline_options.generate_picture_images = self.generate_images
                pipeline_options.images_scale = self.images_scale

                format_options[input_format] = _PdfFormatOption(
                    pipeline_options=pipeline_options
                )
            # For other formats, don't add to format_options - use defaults

            # Create converter - only pass format_options if we have PDF-specific config
            if format_options:
                self._converters[format_key] = _DocumentConverter(
                    format_options=format_options
                )
            else:
                # Use default converter for non-PDF formats
                self._converters[format_key] = _DocumentConverter()

        return self._converters[format_key]

    def extract(
        self,
        file_path: str | Path,
        extract_images: bool = True,
        **options: Any,
    ) -> ExtractionResult:
        """
        Extract text and images from a file using Docling.

        Args:
            file_path: Path to the file (PDF, DOCX, XLSX, PPTX, HTML, images, etc.)
            extract_images: Whether to extract images

        Returns:
            ExtractionResult with extracted text and images
        """
        file_path = Path(file_path)
        file_ext = file_path.suffix.lower()
        
        # Check if format is supported
        input_format = _get_input_format(file_path)
        if input_format is None:
            raise ValueError(
                f"Unsupported file format: {file_ext}. "
                f"Supported formats: {', '.join(sorted(self.SUPPORTED_EXTENSIONS))}"
            )
        
        logger.info(
            f"Extracting from {input_format.value.upper()} using Docling: {file_path.name}"
        )

        elements: list[ExtractedElement] = []
        warnings: list[str] = []
        metadata: dict[str, Any] = {}

        try:
            # Get converter for this file format
            converter = self._get_converter(file_path)
            
            # Convert document using Docling
            result = converter.convert(str(file_path))
            doc = result.document

            # Get page count
            page_count = result.input.page_count if result.input else 0

            # Extract metadata
            metadata = self._extract_metadata(result)

            # Group content by page
            page_texts: dict[int, list[str]] = {}
            page_images: list[ExtractedElement] = []

            # First, try to export the entire document as markdown (most reliable)
            # This works for CSV, XLSX, and most other formats
            try:
                markdown_text = doc.export_to_markdown()
                if markdown_text and markdown_text.strip():
                    page_texts[1] = [markdown_text]
                    logger.info(f"Extracted {len(markdown_text)} chars via markdown export")
            except Exception as e:
                logger.warning(f"Markdown export failed: {e}")

            # If markdown export didn't work, try iterate_items
            if not page_texts:
                for item, level in doc.iterate_items():
                    item_page = self._get_item_page(item)

                    # Handle text items
                    if hasattr(item, 'text') and item.text:
                        if item_page not in page_texts:
                            page_texts[item_page] = []
                        page_texts[item_page].append(item.text)

            # Also extract tables (important for CSV, XLSX, etc.)
            if not page_texts and hasattr(doc, 'tables') and doc.tables:
                for table in doc.tables:
                    table_page = self._get_item_page(table)
                    if table_page not in page_texts:
                        page_texts[table_page] = []

                    # Try to export table as markdown or text
                    try:
                        if hasattr(table, 'export_to_markdown'):
                            table_text = table.export_to_markdown()
                        elif hasattr(table, 'text') and table.text:
                            table_text = table.text
                        else:
                            # Fallback: try to get data from table cells
                            table_text = self._extract_table_text(table)

                        if table_text:
                            page_texts[table_page].append(table_text)
                    except Exception as e:
                        logger.warning(f"Failed to extract table: {e}")

            # Create text elements per page
            for page_num in sorted(page_texts.keys()):
                text_content = "\n\n".join(page_texts[page_num])
                if text_content.strip():
                    elements.append(
                        ExtractedElement(
                            element_type=ElementType.TEXT,
                            content=text_content,
                            page_number=page_num,
                        )
                    )

            # Extract images if requested
            total_images = 0
            if extract_images and self.generate_images:
                for idx, picture in enumerate(doc.pictures):
                    img_element = self._extract_picture(picture, idx, doc)
                    if img_element:
                        elements.append(img_element)
                        total_images += 1

            metadata["total_images"] = total_images

            # Check if document has very little text (may need OCR)
            total_text = sum(
                len(el.content) for el in elements
                if el.element_type == ElementType.TEXT
            )
            if total_text < 100 and page_count > 0:
                if input_format in (_InputFormat.PDF, _InputFormat.IMAGE):
                    warnings.append(
                        f"Document has very little extractable text. "
                        f"Consider enabling OCR for scanned documents or images."
                    )

        except Exception as e:
            logger.error(f"Docling extraction failed: {e}")
            raise

        # Combine all text for raw_text
        raw_text = "\n\n".join(
            el.content for el in elements
            if el.element_type == ElementType.TEXT and el.content.strip()
        )

        word_count = len(raw_text.split()) if raw_text else 0

        return ExtractionResult(
            elements=elements,
            metadata=metadata,
            raw_text=raw_text,
            page_count=page_count,
            word_count=word_count,
            extraction_method=f"docling_{input_format.value if input_format else 'unknown'}",
            warnings=warnings,
        )

    def _extract_metadata(self, result) -> dict[str, Any]:
        """Extract document metadata from Docling result."""
        metadata: dict[str, Any] = {}

        try:
            if result.input:
                if result.input.page_count:
                    metadata["page_count"] = result.input.page_count
                if result.input.filesize:
                    metadata["file_size"] = result.input.filesize
                if result.input.format:
                    metadata["format"] = str(result.input.format)
        except Exception as e:
            logger.warning(f"Failed to extract metadata: {e}")

        return metadata

    def _get_item_page(self, item) -> int:
        """Get page number for a document item."""
        try:
            if hasattr(item, 'prov') and item.prov and len(item.prov) > 0:
                # prov contains provenance info including page
                prov = item.prov[0]
                if hasattr(prov, 'page_no'):
                    return prov.page_no
        except Exception:
            pass
        return 1  # Default to page 1

    def _extract_picture(
        self,
        picture,
        index: int,
        doc,
    ) -> Optional[ExtractedElement]:
        """Extract a picture from the document."""
        try:
            # Get page number
            page_num = self._get_item_page(picture)

            # Get image data
            if hasattr(picture, 'image') and picture.image:
                image = picture.image

                # Check if image has URI (base64 data)
                if hasattr(image, 'uri') and image.uri:
                    uri = str(image.uri)

                    # If it's already a data URI, use it directly
                    if uri.startswith('data:'):
                        image_data = uri
                    else:
                        # Try to read from file path
                        try:
                            img_path = Path(uri)
                            if img_path.exists():
                                with open(img_path, 'rb') as f:
                                    img_bytes = f.read()
                                    b64 = base64.b64encode(img_bytes).decode('utf-8')
                                    # Determine mime type
                                    ext = img_path.suffix.lower()
                                    mime = {
                                        '.png': 'image/png',
                                        '.jpg': 'image/jpeg',
                                        '.jpeg': 'image/jpeg',
                                        '.gif': 'image/gif',
                                        '.webp': 'image/webp',
                                    }.get(ext, 'image/png')
                                    image_data = f"data:{mime};base64,{b64}"
                            else:
                                return None
                        except Exception:
                            return None

                    # Get caption if available
                    caption = ""
                    if hasattr(picture, 'caption_text'):
                        try:
                            caption = picture.caption_text(doc=doc) or ""
                        except Exception:
                            pass

                    # Get image dimensions if available
                    width = getattr(image, 'width', None)
                    height = getattr(image, 'height', None)

                    return ExtractedElement(
                        element_type=ElementType.IMAGE,
                        content=caption or f"Image {index + 1} on page {page_num}",
                        page_number=page_num,
                        image_data=image_data,
                        metadata={
                            "image_index": index,
                            "width": width,
                            "height": height,
                            "image_type": "docling_picture",
                        },
                    )

        except Exception as e:
            logger.warning(f"Failed to extract picture {index}: {e}")

        return None

    def _extract_table_text(self, table) -> str:
        """Extract text from table cells as a fallback."""
        try:
            rows = []
            if hasattr(table, 'data') and table.data:
                # Try to access table data as a grid
                data = table.data
                if hasattr(data, 'grid'):
                    for row in data.grid:
                        row_texts = []
                        for cell in row:
                            if hasattr(cell, 'text'):
                                row_texts.append(str(cell.text))
                            elif isinstance(cell, str):
                                row_texts.append(cell)
                        if row_texts:
                            rows.append(" | ".join(row_texts))
                elif isinstance(data, list):
                    for row in data:
                        if isinstance(row, list):
                            row_texts = [str(cell) for cell in row]
                            rows.append(" | ".join(row_texts))
            return "\n".join(rows)
        except Exception as e:
            logger.warning(f"Failed to extract table text: {e}")
            return ""


# Keep backward compatibility alias
DoclingPDFExtractor = DoclingExtractor
