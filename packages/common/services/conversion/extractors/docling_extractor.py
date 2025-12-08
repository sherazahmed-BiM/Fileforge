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
- CSV: Tabular data converted to JSON array of objects
- Images (PNG, JPG, JPEG, TIFF, BMP, WEBP, GIF): OCR text extraction
- Audio (WAV, MP3): Transcription (if supported)
- AsciiDoc: Documentation format
- VTT: Video captions/subtitles
- XML: Structured data extraction
- JSON: Docling JSON format
"""

import base64
import io
import json
import re
from pathlib import Path
from typing import Any, Optional

from packages.common.services.conversion.extractors.base import (
    BaseExtractor,
    ElementType,
    ExtractedElement,
    ExtractionResult,
    StructuredTableData,
    TableSchema,
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
        enable_ocr: bool = True,
        enable_tables: bool = True,
        generate_images: bool = True,
        images_scale: float = 2.0,
        enable_picture_description: bool = True,
        vlm_model: str = "granite",
    ):
        """
        Initialize Docling extractor for multiple file formats.

        Args:
            enable_ocr: Enable OCR for scanned documents and images (default: True)
            enable_tables: Enable table structure extraction
            generate_images: Extract images from documents
            images_scale: Scale factor for extracted images
            enable_picture_description: Use VLM to generate picture descriptions (default: True)
            vlm_model: VLM model to use - "granite" (ibm-granite/granite-vision-3.1-2b-preview),
                      "smolvlm" (HuggingFaceTB/SmolVLM-256M-Instruct), or "none"
        """
        super().__init__()

        if not _load_docling():
            raise ImportError(
                "Docling is required for this extractor. "
                "Install with: pip install docling[ocr,vlm]"
            )

        self.enable_ocr = enable_ocr
        self.enable_tables = enable_tables
        self.generate_images = generate_images
        self.images_scale = images_scale
        self.enable_picture_description = enable_picture_description
        self.vlm_model = vlm_model

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

            # PDF-specific options with OCR and VLM support
            if input_format == _InputFormat.PDF:
                pipeline_options = _PdfPipelineOptions()
                pipeline_options.do_ocr = self.enable_ocr
                pipeline_options.do_table_structure = self.enable_tables
                pipeline_options.generate_picture_images = self.generate_images
                pipeline_options.images_scale = self.images_scale

                # Enable VLM-based picture description for maximum accuracy
                if self.enable_picture_description and self.vlm_model != "none":
                    pipeline_options.do_picture_description = True
                    pipeline_options = self._configure_vlm_options(pipeline_options)

                format_options[input_format] = _PdfFormatOption(
                    pipeline_options=pipeline_options
                )

            # Image-specific options (for standalone images with OCR)
            elif input_format == _InputFormat.IMAGE:
                # Images use default converter but OCR is applied automatically
                pass

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

    def _configure_vlm_options(self, pipeline_options):
        """Configure VLM options for picture description."""
        try:
            if self.vlm_model == "granite":
                # Use IBM Granite Vision model (best accuracy)
                from docling.datamodel.pipeline_options import granite_picture_description
                pipeline_options.picture_description_options = granite_picture_description
                pipeline_options.picture_description_options.prompt = (
                    "Describe this image in detail. Include any text, diagrams, charts, "
                    "or visual elements. Be accurate and comprehensive."
                )
                logger.info("VLM enabled: Using Granite Vision for picture descriptions")

            elif self.vlm_model == "smolvlm":
                # Use SmolVLM (smaller, faster)
                from docling.datamodel.pipeline_options import smolvlm_picture_description
                pipeline_options.picture_description_options = smolvlm_picture_description
                pipeline_options.picture_description_options.prompt = (
                    "Describe this image in detail. Include any text, diagrams, charts, "
                    "or visual elements. Be accurate and comprehensive."
                )
                logger.info("VLM enabled: Using SmolVLM for picture descriptions")

            else:
                # Custom model or fallback
                logger.warning(f"Unknown VLM model: {self.vlm_model}, disabling picture description")
                pipeline_options.do_picture_description = False

        except ImportError as e:
            logger.warning(
                f"VLM support not available: {e}. "
                "Install with: pip install docling[vlm]. "
                "Disabling picture description."
            )
            pipeline_options.do_picture_description = False
        except Exception as e:
            logger.warning(f"Failed to configure VLM: {e}. Disabling picture description.")
            pipeline_options.do_picture_description = False

        return pipeline_options

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

            # Track elements with their order within each page
            # Key: page_num, Value: list of (order_index, element)
            page_elements: dict[int, list[tuple[int, ExtractedElement]]] = {}

            # Special handling for CSV files - convert to structured JSON format
            structured_tables: list[StructuredTableData] = []
            if input_format == _InputFormat.CSV:
                tables, summary = self._extract_csv_structured(doc, file_path)
                if tables:
                    structured_tables = tables
                    metadata["csv_summary"] = summary
                    metadata["format_output"] = "structured_json"
                    metadata["record_count"] = summary.get("total_rows", 0)

                    # Also get markdown version from Docling for alternative view
                    try:
                        markdown_text = doc.export_to_markdown()
                        if markdown_text and markdown_text.strip():
                            metadata["markdown"] = markdown_text
                    except Exception as e:
                        logger.warning(f"Failed to export CSV as markdown: {e}")

                    logger.info(
                        f"Extracted {summary.get('total_rows', 0)} records as structured JSON "
                        f"({summary.get('pages', 1)} pages)"
                    )
                    # Create a simple text summary for raw_text
                    text_el = ExtractedElement(
                        element_type=ElementType.TEXT,
                        content=(
                            f"CSV Data: {summary.get('total_rows', 0)} rows, "
                            f"{summary.get('total_columns', 0)} columns. "
                            f"Columns: {', '.join(summary.get('columns', []))}"
                        ),
                        page_number=1,
                    )
                    page_elements[1] = [(0, text_el)]
            else:
                # For PDFs and other document types, extract with proper ordering
                # First collect all items with their positions for correct ordering
                order_counter = 0

                # Process all document items in order (text, tables, pictures)
                for item, level in doc.iterate_items():
                    item_page = self._get_item_page(item)
                    item_order = self._get_item_order(item, order_counter)
                    order_counter += 1

                    if item_page not in page_elements:
                        page_elements[item_page] = []

                    # Check if this is a picture/image
                    item_type = type(item).__name__
                    if item_type in ('PictureItem', 'Picture') or (hasattr(item, 'image') and item.image):
                        # Extract image inline
                        if extract_images and self.generate_images:
                            img_element = self._extract_picture_item(item, order_counter, doc)
                            if img_element:
                                page_elements[item_page].append((item_order, img_element))
                    elif hasattr(item, 'text') and item.text:
                        # Text element
                        text_el = ExtractedElement(
                            element_type=ElementType.TEXT,
                            content=item.text,
                            page_number=item_page,
                        )
                        page_elements[item_page].append((item_order, text_el))

                # Also process pictures separately if they weren't in iterate_items
                if extract_images and self.generate_images and hasattr(doc, 'pictures'):
                    for idx, picture in enumerate(doc.pictures):
                        picture_page = self._get_item_page(picture)
                        picture_order = self._get_item_order(picture, 1000 + idx)

                        # Check if this picture was already added
                        if picture_page not in page_elements:
                            page_elements[picture_page] = []

                        # Check if picture already exists on this page
                        existing_images = [
                            el for _, el in page_elements[picture_page]
                            if el.element_type == ElementType.IMAGE
                        ]

                        # Only add if not already present (avoid duplicates)
                        if len(existing_images) <= idx:
                            img_element = self._extract_picture(picture, idx, doc)
                            if img_element:
                                page_elements[picture_page].append((picture_order, img_element))

                # Export markdown for documents (PDF, DOCX, etc.) for alternative view
                # Use EMBEDDED mode to include images as base64 in markdown
                if input_format in (_InputFormat.PDF, _InputFormat.DOCX, _InputFormat.PPTX, _InputFormat.HTML):
                    try:
                        markdown_text = self._export_markdown_with_images(doc)
                        if markdown_text and markdown_text.strip():
                            metadata["markdown"] = markdown_text
                            logger.info(f"Exported document as markdown with embedded images ({len(markdown_text)} chars)")
                    except Exception as e:
                        logger.warning(f"Markdown export failed: {e}")

            # Flatten page_elements into elements list, sorted by page and order
            for page_num in sorted(page_elements.keys()):
                # Sort elements within each page by their order index
                sorted_elements = sorted(page_elements[page_num], key=lambda x: x[0])
                for _, el in sorted_elements:
                    elements.append(el)

            # If no elements extracted, try markdown export as fallback
            if not elements:
                try:
                    markdown_text = self._export_markdown_with_images(doc)
                    if markdown_text and markdown_text.strip():
                        elements.append(
                            ExtractedElement(
                                element_type=ElementType.TEXT,
                                content=markdown_text,
                                page_number=1,
                            )
                        )
                        metadata["markdown"] = markdown_text
                        logger.info(f"Fallback: Extracted {len(markdown_text)} chars via markdown export")
                except Exception as e:
                    logger.warning(f"Fallback markdown export failed: {e}")

            # Count total images
            total_images = sum(1 for el in elements if el.element_type == ElementType.IMAGE)
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
            page_count=page_count or len(structured_tables),
            word_count=word_count,
            extraction_method=f"docling_{input_format.value if input_format else 'unknown'}",
            warnings=warnings,
            structured_data=structured_tables if structured_tables else None,
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

    def _export_markdown_with_images(self, doc) -> str:
        """
        Export document to markdown with embedded base64 images.

        Uses MarkdownDocSerializer with ImageRefMode.EMBEDDED to include
        images directly in the markdown as base64 data URIs.
        """
        try:
            # Try using the serializer with EMBEDDED image mode
            from docling_core.transforms.serializer.markdown import (
                MarkdownDocSerializer,
                MarkdownParams,
            )

            params = MarkdownParams(
                image_mode=_ImageRefMode.EMBEDDED,
            )
            serializer = MarkdownDocSerializer(doc=doc, params=params)
            result = serializer.serialize()
            return result.text
        except ImportError:
            # Fall back to simple export if serializer not available
            logger.warning("MarkdownDocSerializer not available, using simple export")
            return doc.export_to_markdown()
        except Exception as e:
            # Fall back to simple export on any error
            logger.warning(f"Markdown serializer failed: {e}, using simple export")
            return doc.export_to_markdown()

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

    def _get_item_order(self, item, default_order: int) -> int:
        """
        Get the order/position of an item within its page.

        Uses bounding box y-coordinate for vertical ordering.
        """
        try:
            if hasattr(item, 'prov') and item.prov and len(item.prov) > 0:
                prov = item.prov[0]
                # Use bounding box for ordering (top-to-bottom)
                if hasattr(prov, 'bbox') and prov.bbox:
                    bbox = prov.bbox
                    # Get top y-coordinate (lower y = higher on page in most PDF coords)
                    if hasattr(bbox, 't'):
                        return int(bbox.t * 1000)  # Scale to int for sorting
                    elif hasattr(bbox, 'top'):
                        return int(bbox.top * 1000)
                    elif hasattr(bbox, 'y'):
                        return int(bbox.y * 1000)
        except Exception:
            pass
        return default_order

    def _extract_picture_item(
        self,
        item,
        index: int,
        doc,
    ) -> Optional[ExtractedElement]:
        """Extract a picture from a document item (from iterate_items)."""
        try:
            # Get page number
            page_num = self._get_item_page(item)

            # Get image data - check if item has image attribute
            image = None
            if hasattr(item, 'image') and item.image:
                image = item.image
            elif hasattr(item, 'get_image'):
                try:
                    image = item.get_image(doc)
                except Exception:
                    pass

            if not image:
                return None

            # Check if image has URI (base64 data)
            image_data = None
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
                                ext = img_path.suffix.lower()
                                mime = {
                                    '.png': 'image/png',
                                    '.jpg': 'image/jpeg',
                                    '.jpeg': 'image/jpeg',
                                    '.gif': 'image/gif',
                                    '.webp': 'image/webp',
                                }.get(ext, 'image/png')
                                image_data = f"data:{mime};base64,{b64}"
                    except Exception:
                        pass

            if not image_data:
                return None

            # Get caption if available
            caption = ""
            if hasattr(item, 'caption_text'):
                try:
                    caption = item.caption_text(doc=doc) or ""
                except Exception:
                    pass
            elif hasattr(item, 'text') and item.text:
                caption = item.text

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
            logger.warning(f"Failed to extract picture item {index}: {e}")

        return None

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

    def _convert_table_to_json(self, table) -> list[dict[str, Any]]:
        """
        Convert Docling table data to JSON array of objects.

        Each row becomes an object with column headers as keys.
        """
        try:
            if not hasattr(table, 'data') or not table.data:
                return []

            data = table.data
            if not hasattr(data, 'table_cells') or not data.table_cells:
                return []

            cells = data.table_cells

            # Find dimensions
            max_row = 0
            max_col = 0
            for cell in cells:
                if hasattr(cell, 'end_row_offset_idx'):
                    max_row = max(max_row, cell.end_row_offset_idx)
                if hasattr(cell, 'end_col_offset_idx'):
                    max_col = max(max_col, cell.end_col_offset_idx)

            # Build grid
            grid: list[list[str]] = [[""] * max_col for _ in range(max_row)]
            headers: list[str] = []
            header_row_idx = 0

            for cell in cells:
                row_idx = getattr(cell, 'start_row_offset_idx', 0)
                col_idx = getattr(cell, 'start_col_offset_idx', 0)
                text = getattr(cell, 'text', '')
                is_header = getattr(cell, 'column_header', False)

                if row_idx < max_row and col_idx < max_col:
                    grid[row_idx][col_idx] = text

                    # Track header row
                    if is_header and row_idx == 0:
                        header_row_idx = 0

            # First row is headers
            if grid:
                headers = grid[header_row_idx]

            # Clean header names for JSON keys
            clean_headers = []
            for h in headers:
                # Convert to snake_case: "Customer Id" -> "customer_id"
                clean = h.strip().lower()
                clean = re.sub(r'[^\w\s]', '', clean)  # Remove special chars
                clean = re.sub(r'\s+', '_', clean)  # Spaces to underscores
                clean_headers.append(clean or f"column_{len(clean_headers)}")

            # Build JSON array from data rows
            json_rows: list[dict[str, Any]] = []
            for row_idx in range(header_row_idx + 1, len(grid)):
                row_data = grid[row_idx]
                obj: dict[str, Any] = {}

                for col_idx, value in enumerate(row_data):
                    if col_idx < len(clean_headers):
                        key = clean_headers[col_idx]
                        # Try to convert numeric values
                        obj[key] = self._parse_cell_value(value)

                if any(v for v in obj.values()):  # Skip empty rows
                    json_rows.append(obj)

            return json_rows

        except Exception as e:
            logger.warning(f"Failed to convert table to JSON: {e}")
            return []

    def _normalize_header(self, header: str) -> str:
        """Normalize header to snake_case."""
        if not header:
            return ""
        clean = header.strip().lower()
        clean = re.sub(r'[^\w\s]', '', clean)  # Remove special chars
        clean = re.sub(r'\s+', '_', clean)  # Spaces to underscores
        clean = re.sub(r'_+', '_', clean)  # Multiple underscores to single
        clean = clean.strip('_')
        return clean or "column"

    def _detect_column_type(self, values: list[Any]) -> str:
        """Detect the data type for a column based on sample values."""
        # Filter out None/empty values
        non_empty = [v for v in values if v is not None and str(v).strip()]

        if not non_empty:
            return "string"

        # Sample first 100 values for type detection
        sample = non_empty[:100]

        int_count = 0
        float_count = 0
        bool_count = 0
        date_count = 0

        date_patterns = [
            r'^\d{4}-\d{2}-\d{2}$',  # YYYY-MM-DD
            r'^\d{2}/\d{2}/\d{4}$',  # MM/DD/YYYY
            r'^\d{2}-\d{2}-\d{4}$',  # DD-MM-YYYY
        ]

        for val in sample:
            s = str(val).strip()

            # Check boolean
            if s.lower() in ('true', 'false', 'yes', 'no', '1', '0'):
                bool_count += 1
                continue

            # Check date
            for pattern in date_patterns:
                if re.match(pattern, s):
                    date_count += 1
                    break
            else:
                # Check integer
                try:
                    if s.isdigit() or (s.startswith('-') and s[1:].isdigit()):
                        int_count += 1
                        continue
                except (ValueError, IndexError):
                    pass

                # Check float
                try:
                    float(s)
                    if '.' in s or 'e' in s.lower():
                        float_count += 1
                        continue
                except ValueError:
                    pass

        total = len(sample)
        threshold = 0.8  # 80% of values must match

        if date_count / total >= threshold:
            return "date"
        if int_count / total >= threshold:
            return "integer"
        if float_count / total >= threshold:
            return "number"
        if bool_count / total >= threshold:
            return "boolean"

        return "string"

    def _is_id_or_phone_field(self, field_name: str) -> bool:
        """Check if field should always be treated as string (IDs, phones)."""
        id_patterns = ['id', 'phone', 'tel', 'fax', 'mobile', 'zip', 'postal', 'code', 'sku', 'isbn']
        field_lower = field_name.lower()
        return any(pattern in field_lower for pattern in id_patterns)

    def _is_phone_field(self, field_name: str) -> bool:
        """Check if field is specifically a phone number field."""
        phone_patterns = ['phone', 'tel', 'fax', 'mobile', 'cell']
        field_lower = field_name.lower()
        return any(pattern in field_lower for pattern in phone_patterns)

    def _clean_phone(self, value: str) -> str:
        """Extract digits only from phone number."""
        if not value:
            return ""
        return re.sub(r'[^\d]', '', value)

    def _is_valid_date(self, value: str) -> bool:
        """Validate if a string is a valid date."""
        if not value or not isinstance(value, str):
            return False

        date_patterns = [
            (r'^\d{4}-\d{2}-\d{2}$', '%Y-%m-%d'),  # YYYY-MM-DD
            (r'^\d{2}/\d{2}/\d{4}$', '%m/%d/%Y'),  # MM/DD/YYYY
            (r'^\d{2}-\d{2}-\d{4}$', '%d-%m-%Y'),  # DD-MM-YYYY
            (r'^\d{4}/\d{2}/\d{2}$', '%Y/%m/%d'),  # YYYY/MM/DD
        ]

        from datetime import datetime

        for pattern, fmt in date_patterns:
            if re.match(pattern, value):
                try:
                    datetime.strptime(value, fmt)
                    return True
                except ValueError:
                    return False

        return False

    def _parse_cell_value(self, value: str, field_name: str = "", force_string: bool = False) -> Any:
        """
        Parse cell value to appropriate type.

        Args:
            value: The cell value as string
            field_name: The column name (used to detect ID/phone fields)
            force_string: If True, always return string
        """
        if value is None:
            return None

        if not isinstance(value, str):
            value = str(value)

        value = value.strip()
        if not value:
            return None

        # IDs and phone numbers should always be strings
        if force_string or self._is_id_or_phone_field(field_name):
            return value

        # Try boolean
        if value.lower() in ('true', 'yes'):
            return True
        if value.lower() in ('false', 'no'):
            return False

        # Try integer (but not if it looks like an ID with leading zeros)
        if not value.startswith('0') or value == '0':
            try:
                if value.isdigit() or (value.startswith('-') and value[1:].isdigit()):
                    return int(value)
            except (ValueError, IndexError):
                pass

        # Try float
        try:
            if '.' in value and not value.startswith('0.') or 'e' in value.lower():
                parsed = float(value)
                # Avoid converting things like "1.0" that might be versions
                if '.' in value:
                    parts = value.split('.')
                    if len(parts) == 2 and parts[1].isdigit():
                        return parsed
        except ValueError:
            pass

        # Return as string
        return value

    def _extract_csv_structured(
        self,
        doc,
        file_path: Path,
        rows_per_page: int = 500,
    ) -> tuple[list[StructuredTableData], dict[str, Any]]:
        """
        Extract CSV content as structured table data.

        Returns:
            Tuple of (list of StructuredTableData pages, summary metadata)
        """
        import csv

        all_rows: list[dict[str, Any]] = []
        headers: list[str] = []
        original_headers: list[str] = []
        delimiter = ','
        encoding = 'utf-8'

        # Detect encoding
        try:
            with open(file_path, 'rb') as f:
                raw = f.read(8192)
                # Simple encoding detection
                if raw.startswith(b'\xef\xbb\xbf'):
                    encoding = 'utf-8-sig'
                elif raw.startswith(b'\xff\xfe'):
                    encoding = 'utf-16-le'
                elif raw.startswith(b'\xfe\xff'):
                    encoding = 'utf-16-be'
        except Exception:
            encoding = 'utf-8'

        # Parse CSV directly for best control
        try:
            with open(file_path, 'r', encoding=encoding, errors='replace') as f:
                # Detect delimiter
                sample = f.read(8192)
                f.seek(0)
                try:
                    dialect = csv.Sniffer().sniff(sample)
                    delimiter = dialect.delimiter
                except csv.Error:
                    delimiter = ','

                reader = csv.reader(f, delimiter=delimiter)

                # Read headers
                header_row = next(reader, None)
                if header_row:
                    original_headers = [h.strip() for h in header_row]
                    headers = [self._normalize_header(h) for h in original_headers]

                    # Handle duplicate headers
                    seen: dict[str, int] = {}
                    unique_headers = []
                    for h in headers:
                        if h in seen:
                            seen[h] += 1
                            unique_headers.append(f"{h}_{seen[h]}")
                        else:
                            seen[h] = 0
                            unique_headers.append(h)
                    headers = unique_headers

                # Identify phone and date fields for special processing
                phone_fields = [h for h in headers if self._is_phone_field(h)]

                # Read all data rows
                for row in reader:
                    if not row or all(not cell.strip() for cell in row):
                        continue  # Skip empty rows

                    row_dict: dict[str, Any] = {}
                    for i, cell in enumerate(row):
                        if i < len(headers):
                            field_name = headers[i]
                            parsed_value = self._parse_cell_value(cell, field_name)
                            row_dict[field_name] = parsed_value

                            # Add clean_phone for phone fields
                            if field_name in phone_fields and cell.strip():
                                clean_phone_key = f"{field_name}_clean"
                                row_dict[clean_phone_key] = self._clean_phone(cell)
                        else:
                            # Extra columns
                            row_dict[f"column_{i}"] = self._parse_cell_value(cell, "")

                    all_rows.append(row_dict)

        except Exception as e:
            logger.error(f"Failed to parse CSV: {e}")
            return [], {"error": str(e)}

        if not all_rows:
            return [], {"error": "No data rows found"}

        # Detect column types from data
        column_types: dict[str, str] = {}
        column_nullable: dict[str, bool] = {}

        for header in headers:
            values = [row.get(header) for row in all_rows]
            column_types[header] = self._detect_column_type(values)
            column_nullable[header] = any(v is None for v in values)

        # Add is_valid_date for date columns
        date_columns = [h for h, t in column_types.items() if t == "date"]
        for row in all_rows:
            for date_col in date_columns:
                value = row.get(date_col)
                if value is not None:
                    row[f"{date_col}_is_valid"] = self._is_valid_date(str(value))

        # Build schema
        schema_columns = []
        for i, header in enumerate(headers):
            original = original_headers[i] if i < len(original_headers) else header
            col_schema: dict[str, Any] = {
                "name": header,
                "original_name": original,
                "type": column_types.get(header, "string"),
                "nullable": column_nullable.get(header, True),
                "index": i,
            }
            # Mark phone fields
            if header in phone_fields:
                col_schema["has_clean_phone"] = True
            # Mark date fields
            if column_types.get(header) == "date":
                col_schema["has_validation"] = True

            schema_columns.append(col_schema)

        schema = TableSchema(columns=schema_columns)

        # Paginate if needed
        total_rows = len(all_rows)
        total_pages = (total_rows + rows_per_page - 1) // rows_per_page

        tables: list[StructuredTableData] = []

        for page_idx in range(total_pages):
            start_idx = page_idx * rows_per_page
            end_idx = min(start_idx + rows_per_page, total_rows)
            page_rows = all_rows[start_idx:end_idx]

            table = StructuredTableData(
                name=file_path.stem,
                schema=schema,
                rows=page_rows,
                row_count=len(page_rows),
                column_count=len(headers),
                page_index=page_idx,
                total_pages=total_pages,
            )
            tables.append(table)

        # Build origin metadata
        origin = {
            "source_type": "csv",
            "delimiter": delimiter,
            "encoding": encoding,
        }

        # Build summary
        summary = {
            "total_rows": total_rows,
            "total_columns": len(headers),
            "columns": headers,
            "column_types": column_types,
            "pages": total_pages,
            "rows_per_page": rows_per_page,
            "origin": origin,
        }

        return tables, summary


# Keep backward compatibility alias
DoclingPDFExtractor = DoclingExtractor
