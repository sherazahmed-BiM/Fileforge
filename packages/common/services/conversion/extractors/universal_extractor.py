"""
Universal Extractor for FileForge

A comprehensive extractor that handles all supported file formats by routing
to the appropriate extraction method. This includes:

1. Modern formats (via Docling): PDF, DOCX, XLSX, PPTX, HTML, MD, CSV, images
2. Legacy Office formats (via LibreOffice → Docling): DOC, XLS, PPT, RTF, ODT, etc.
3. Email formats: EML, MSG, P7S
4. Ebook formats: EPUB
5. Data formats: DBF, DIF, TSV
6. Markup formats: RST, ORG
7. Additional image formats: HEIC
8. Audio formats (via Docling ASR/Whisper): MP3, WAV, M4A, FLAC, OGG, WEBM

The extractor automatically detects the file type and uses the best extraction
method for optimal results.
"""

import base64
import csv
import email
import os
import shutil
import tempfile
from email import policy
from pathlib import Path
from typing import Any

from packages.common.core.logging import get_logger


def _get_device() -> str:
    """Get the appropriate device for ML models (cuda or cpu)."""
    gpu_enabled = os.getenv("GPU_ENABLED", "false").lower() == "true"
    if not gpu_enabled:
        return "cpu"

    try:
        import torch
        if torch.cuda.is_available():
            device_id = os.getenv("CUDA_DEVICE", "0")
            return f"cuda:{device_id}" if device_id != "0" else "cuda"
    except ImportError:
        pass

    return "cpu"


from packages.common.services.conversion.extractors.base import (
    BaseExtractor,
    ElementType,
    ExtractedElement,
    ExtractionResult,
    StructuredTableData,
    TableSchema,
)
from packages.common.services.conversion.libreoffice import (
    LibreOfficeConverter,
    is_libreoffice_available,
)
from packages.common.services.conversion.libreoffice import (
    is_convertible as is_libreoffice_convertible,
)


logger = get_logger(__name__)


# Try to import optional dependencies
_docling_extractor = None
_ebooklib_available = False
_msg_parser_available = False
_dbfread_available = False
_pypandoc_available = False
_pillow_heif_available = False
_docling_asr_available = False


def _lazy_load_dependencies():
    """Lazy load optional dependencies."""
    global _docling_extractor, _ebooklib_available, _msg_parser_available
    global _dbfread_available, _pypandoc_available, _pillow_heif_available
    global _docling_asr_available

    # Docling
    if _docling_extractor is None:
        try:
            from packages.common.services.conversion.extractors.docling_extractor import (
                DoclingExtractor,
            )
            _docling_extractor = DoclingExtractor
        except ImportError:
            logger.warning("Docling not available")

    # EbookLib for EPUB
    try:
        import ebooklib  # noqa: F401
        _ebooklib_available = True
    except ImportError:
        pass

    # msg-parser for MSG files
    try:
        import msg_parser  # noqa: F401
        _msg_parser_available = True
    except ImportError:
        pass

    # dbfread for DBF files
    try:
        import dbfread  # noqa: F401
        _dbfread_available = True
    except ImportError:
        pass

    # pypandoc for RST/ORG
    try:
        import pypandoc  # noqa: F401
        _pypandoc_available = True
    except ImportError:
        pass

    # pillow-heif for HEIC
    try:
        import pillow_heif  # noqa: F401
        _pillow_heif_available = True
    except ImportError:
        pass

    # Docling ASR for audio transcription
    try:
        from docling.datamodel.base_models import InputFormat  # noqa: F401
        from docling.pipeline.asr_pipeline import AsrPipeline  # noqa: F401
        _docling_asr_available = True
    except ImportError:
        pass


class UniversalExtractor(BaseExtractor):
    """
    Universal file extractor that handles all supported formats.

    Routes extraction to the appropriate handler based on file type:
    - Modern Office formats → Docling
    - Legacy Office formats → LibreOffice conversion → Docling
    - Email formats → Built-in email parser / msg-parser
    - Ebook formats → EbookLib
    - Data formats → Specialized parsers
    - Markup formats → Pypandoc
    - Images → Docling OCR / Pillow-HEIF
    """

    # All supported extensions
    SUPPORTED_EXTENSIONS = {
        # Modern Office (Docling native)
        ".pdf", ".docx", ".xlsx", ".pptx",
        # Markup (Docling native)
        ".html", ".htm", ".xhtml", ".md", ".markdown", ".adoc", ".asciidoc",
        # Data (Docling native)
        ".csv",
        # Images (Docling native + HEIC)
        ".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp", ".webp", ".gif",
        ".heic", ".heif",
        # Legacy Word Processing (LibreOffice)
        ".doc", ".dot", ".dotm", ".dotx", ".rtf", ".odt", ".ott",
        ".abw", ".zabw", ".hwp", ".sxw", ".sxg", ".wpd", ".wps", ".cwk", ".mcw",
        # Legacy Spreadsheets (LibreOffice)
        ".xls", ".xlm", ".xlt", ".et", ".fods", ".ods", ".ots", ".sxc",
        ".wk1", ".wks", ".dif",
        # Legacy Presentations (LibreOffice)
        ".ppt", ".pot", ".pptm", ".pps", ".ppsx", ".odp", ".otp", ".sxi",
        # Email
        ".eml", ".msg", ".p7s",
        # Ebooks
        ".epub",
        # Data formats
        ".dbf", ".tsv",
        # Markup
        ".rst", ".org",
        # Audio (Docling ASR/Whisper)
        ".mp3", ".wav", ".m4a", ".flac", ".ogg", ".webm",
    }

    def __init__(
        self,
        enable_ocr: bool = True,
        enable_tables: bool = True,
        libreoffice_timeout: int = 120,
    ):
        """
        Initialize the universal extractor.

        Args:
            enable_ocr: Enable OCR for scanned documents and images
            enable_tables: Enable table structure extraction
            libreoffice_timeout: Timeout for LibreOffice conversion in seconds
        """
        super().__init__()
        _lazy_load_dependencies()

        self.enable_ocr = enable_ocr
        self.enable_tables = enable_tables
        self.libreoffice_timeout = libreoffice_timeout

        # Initialize Docling extractor if available
        self._docling: Any | None = None
        if _docling_extractor:
            try:
                self._docling = _docling_extractor(
                    enable_ocr=enable_ocr,
                    enable_tables=enable_tables,
                )
            except Exception as e:
                logger.warning(f"Failed to initialize Docling: {e}")

    def extract(
        self,
        file_path: str | Path,
        **options: Any,
    ) -> ExtractionResult:
        """
        Extract content from any supported file format.

        Args:
            file_path: Path to the file
            **options: Additional extraction options

        Returns:
            ExtractionResult with extracted content
        """
        file_path = Path(file_path)
        ext = file_path.suffix.lower()

        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        logger.info(f"Extracting {file_path.name} (format: {ext})")

        # Route to appropriate extractor
        if ext in {".eml", ".msg", ".p7s"}:
            return self._extract_email(file_path, ext)

        elif ext == ".epub":
            return self._extract_epub(file_path)

        elif ext == ".dbf":
            return self._extract_dbf(file_path)

        elif ext == ".tsv":
            return self._extract_tsv(file_path)

        elif ext == ".dif":
            return self._extract_dif(file_path)

        elif ext in {".rst", ".org"}:
            return self._extract_markup(file_path, ext)

        elif ext in {".heic", ".heif"}:
            return self._extract_heic(file_path)

        elif ext in {".mp3", ".wav", ".m4a", ".flac", ".ogg", ".webm"}:
            return self._extract_audio(file_path, **options)

        elif is_libreoffice_convertible(file_path):
            return self._extract_via_libreoffice(file_path, **options)

        elif self._docling and ext in self._docling.SUPPORTED_EXTENSIONS:
            return self._docling.extract(file_path, **options)

        else:
            raise ValueError(
                f"Unsupported file format: {ext}. "
                f"Supported formats: {', '.join(sorted(self.SUPPORTED_EXTENSIONS))}"
            )

    def _extract_via_libreoffice(
        self,
        file_path: Path,
        **options: Any,
    ) -> ExtractionResult:
        """
        Extract content from legacy formats by converting via LibreOffice.
        """
        if not is_libreoffice_available():
            raise RuntimeError(
                "LibreOffice is required for legacy document formats but is not installed. "
                "Please install LibreOffice to process this file."
            )

        if not self._docling:
            raise RuntimeError(
                "Docling is required for document processing but is not available."
            )

        logger.info(f"Converting {file_path.name} via LibreOffice")

        try:
            with LibreOfficeConverter(
                file_path,
                timeout=self.libreoffice_timeout,
            ) as converted_path:
                logger.info(f"Converted to: {converted_path.name}")

                # Extract using Docling
                result = self._docling.extract(converted_path, **options)

                # Update metadata to reflect original format
                result.metadata["original_format"] = file_path.suffix.lower()
                result.metadata["converted_via"] = "libreoffice"
                result.metadata["converted_to"] = converted_path.suffix.lower()

                return result

        except Exception as e:
            logger.error(f"LibreOffice extraction failed: {e}")
            raise

    def _extract_email(self, file_path: Path, ext: str) -> ExtractionResult:
        """Extract content from email files (EML, MSG, P7S)."""
        elements: list[ExtractedElement] = []
        metadata: dict[str, Any] = {"format": ext[1:]}
        warnings: list[str] = []

        try:
            if ext == ".msg":
                return self._extract_msg(file_path)
            else:
                # EML and P7S use standard email parsing
                with open(file_path, "rb") as f:
                    msg = email.message_from_binary_file(f, policy=policy.default)

                # Extract headers
                headers = {
                    "from": msg.get("From", ""),
                    "to": msg.get("To", ""),
                    "cc": msg.get("Cc", ""),
                    "subject": msg.get("Subject", ""),
                    "date": msg.get("Date", ""),
                    "message_id": msg.get("Message-ID", ""),
                }
                metadata["email_headers"] = headers

                # Build content
                content_parts = []

                # Add header summary
                header_text = f"""From: {headers['from']}
To: {headers['to']}
Subject: {headers['subject']}
Date: {headers['date']}
"""
                if headers['cc']:
                    header_text += f"CC: {headers['cc']}\n"

                elements.append(
                    ExtractedElement(
                        element_type=ElementType.HEADER,
                        content=header_text,
                        page_number=1,
                        metadata={"type": "email_header"},
                    )
                )
                content_parts.append(header_text)

                # Extract body
                body_text = ""
                html_body = ""
                attachments = []

                if msg.is_multipart():
                    for part in msg.walk():
                        content_type = part.get_content_type()
                        content_disposition = str(part.get("Content-Disposition", ""))

                        if "attachment" in content_disposition:
                            filename = part.get_filename() or "unnamed_attachment"
                            attachments.append({
                                "filename": filename,
                                "content_type": content_type,
                                "size": len(part.get_payload(decode=True) or b""),
                            })
                        elif content_type == "text/plain":
                            payload = part.get_payload(decode=True)
                            if payload:
                                charset = part.get_content_charset() or "utf-8"
                                try:
                                    body_text += payload.decode(charset, errors="replace")
                                except Exception:
                                    body_text += payload.decode("utf-8", errors="replace")
                        elif content_type == "text/html":
                            payload = part.get_payload(decode=True)
                            if payload:
                                charset = part.get_content_charset() or "utf-8"
                                try:
                                    html_body = payload.decode(charset, errors="replace")
                                except Exception:
                                    html_body = payload.decode("utf-8", errors="replace")
                else:
                    payload = msg.get_payload(decode=True)
                    if payload:
                        charset = msg.get_content_charset() or "utf-8"
                        try:
                            body_text = payload.decode(charset, errors="replace")
                        except Exception:
                            body_text = payload.decode("utf-8", errors="replace")

                # Prefer plain text, fall back to HTML stripped
                if body_text:
                    elements.append(
                        ExtractedElement(
                            element_type=ElementType.TEXT,
                            content=body_text,
                            page_number=1,
                            metadata={"type": "email_body"},
                        )
                    )
                    content_parts.append(body_text)
                elif html_body:
                    # Strip HTML tags for plain text
                    from html.parser import HTMLParser

                    class HTMLStripper(HTMLParser):
                        def __init__(self):
                            super().__init__()
                            self.text = []

                        def handle_data(self, data):
                            self.text.append(data)

                        def get_text(self):
                            return " ".join(self.text)

                    stripper = HTMLStripper()
                    stripper.feed(html_body)
                    plain_from_html = stripper.get_text()

                    elements.append(
                        ExtractedElement(
                            element_type=ElementType.TEXT,
                            content=plain_from_html,
                            page_number=1,
                            metadata={"type": "email_body", "source": "html"},
                        )
                    )
                    content_parts.append(plain_from_html)
                    metadata["html_body"] = html_body

                if attachments:
                    metadata["attachments"] = attachments
                    attachment_summary = f"\n\nAttachments ({len(attachments)}):\n"
                    for att in attachments:
                        attachment_summary += f"- {att['filename']} ({att['content_type']})\n"
                    elements.append(
                        ExtractedElement(
                            element_type=ElementType.TEXT,
                            content=attachment_summary,
                            page_number=1,
                            metadata={"type": "attachment_list"},
                        )
                    )
                    content_parts.append(attachment_summary)

                raw_text = "\n\n".join(content_parts)

        except Exception as e:
            logger.error(f"Email extraction failed: {e}")
            raise

        return ExtractionResult(
            elements=elements,
            metadata=metadata,
            raw_text=raw_text,
            page_count=1,
            word_count=len(raw_text.split()),
            extraction_method=f"email_{ext[1:]}",
            warnings=warnings,
        )

    def _extract_msg(self, file_path: Path) -> ExtractionResult:
        """Extract content from Outlook MSG files."""
        elements: list[ExtractedElement] = []
        metadata: dict[str, Any] = {"format": "msg"}
        warnings: list[str] = []

        if not _msg_parser_available:
            warnings.append(
                "msg-parser library not installed. Install with: pip install msg-parser"
            )
            # Try to read as binary and extract what we can
            return ExtractionResult(
                elements=[],
                metadata=metadata,
                raw_text="",
                page_count=0,
                word_count=0,
                extraction_method="msg_fallback",
                warnings=warnings,
            )

        try:
            from msg_parser import MsOxMessage

            msg = MsOxMessage(str(file_path))

            headers = {
                "from": msg.sender or "",
                "to": msg.recipients or "",
                "subject": msg.subject or "",
                "date": str(msg.sent_date) if msg.sent_date else "",
            }
            metadata["email_headers"] = headers

            content_parts = []

            # Header element
            header_text = f"""From: {headers['from']}
To: {headers['to']}
Subject: {headers['subject']}
Date: {headers['date']}
"""
            elements.append(
                ExtractedElement(
                    element_type=ElementType.HEADER,
                    content=header_text,
                    page_number=1,
                    metadata={"type": "email_header"},
                )
            )
            content_parts.append(header_text)

            # Body
            body = msg.body or ""
            if body:
                elements.append(
                    ExtractedElement(
                        element_type=ElementType.TEXT,
                        content=body,
                        page_number=1,
                        metadata={"type": "email_body"},
                    )
                )
                content_parts.append(body)

            # Attachments
            if hasattr(msg, "attachments") and msg.attachments:
                attachments = []
                for att in msg.attachments:
                    attachments.append({
                        "filename": getattr(att, "filename", "unnamed"),
                        "size": getattr(att, "size", 0),
                    })
                metadata["attachments"] = attachments

            raw_text = "\n\n".join(content_parts)

        except Exception as e:
            logger.error(f"MSG extraction failed: {e}")
            raise

        return ExtractionResult(
            elements=elements,
            metadata=metadata,
            raw_text=raw_text,
            page_count=1,
            word_count=len(raw_text.split()),
            extraction_method="msg_parser",
            warnings=warnings,
        )

    def _extract_epub(self, file_path: Path) -> ExtractionResult:
        """Extract content from EPUB ebook files."""
        elements: list[ExtractedElement] = []
        metadata: dict[str, Any] = {"format": "epub"}
        warnings: list[str] = []

        if not _ebooklib_available:
            warnings.append(
                "ebooklib not installed. Install with: pip install ebooklib"
            )
            return ExtractionResult(
                elements=[],
                metadata=metadata,
                raw_text="",
                page_count=0,
                word_count=0,
                extraction_method="epub_fallback",
                warnings=warnings,
            )

        try:
            from html.parser import HTMLParser

            import ebooklib
            from ebooklib import epub

            class HTMLStripper(HTMLParser):
                def __init__(self):
                    super().__init__()
                    self.text = []
                    self.in_body = False

                def handle_starttag(self, tag, attrs):  # noqa: ARG002
                    if tag == "body":
                        self.in_body = True

                def handle_endtag(self, tag):
                    if tag == "body":
                        self.in_body = False

                def handle_data(self, data):
                    text = data.strip()
                    if text:
                        self.text.append(text)

                def get_text(self):
                    return "\n".join(self.text)

            book = epub.read_epub(str(file_path))

            # Extract metadata
            title = book.get_metadata("DC", "title")
            creator = book.get_metadata("DC", "creator")
            language = book.get_metadata("DC", "language")

            metadata["epub_metadata"] = {
                "title": title[0][0] if title else "",
                "author": creator[0][0] if creator else "",
                "language": language[0][0] if language else "",
            }

            # Extract chapters
            content_parts = []
            chapter_num = 0

            for item in book.get_items():
                if item.get_type() == ebooklib.ITEM_DOCUMENT:
                    chapter_num += 1
                    content = item.get_content()

                    if isinstance(content, bytes):
                        content = content.decode("utf-8", errors="replace")

                    # Strip HTML
                    stripper = HTMLStripper()
                    stripper.feed(content)
                    text = stripper.get_text()

                    if text.strip():
                        elements.append(
                            ExtractedElement(
                                element_type=ElementType.TEXT,
                                content=text,
                                page_number=chapter_num,
                                metadata={"type": "chapter", "chapter": chapter_num},
                            )
                        )
                        content_parts.append(text)

            metadata["chapter_count"] = chapter_num
            raw_text = "\n\n".join(content_parts)

        except Exception as e:
            logger.error(f"EPUB extraction failed: {e}")
            raise

        return ExtractionResult(
            elements=elements,
            metadata=metadata,
            raw_text=raw_text,
            page_count=chapter_num,
            word_count=len(raw_text.split()),
            extraction_method="ebooklib",
            warnings=warnings,
        )

    def _extract_dbf(self, file_path: Path) -> ExtractionResult:
        """Extract content from dBase DBF files."""
        metadata: dict[str, Any] = {"format": "dbf", "format_output": "structured_json"}
        warnings: list[str] = []

        if not _dbfread_available:
            # Fall back to LibreOffice if available
            if is_libreoffice_available():
                return self._extract_via_libreoffice(file_path)

            warnings.append(
                "dbfread not installed. Install with: pip install dbfread"
            )
            return ExtractionResult(
                elements=[],
                metadata=metadata,
                raw_text="",
                page_count=0,
                word_count=0,
                extraction_method="dbf_fallback",
                warnings=warnings,
            )

        try:
            from dbfread import DBF

            table = DBF(str(file_path), load=True)

            # Get field names
            headers = table.field_names

            # Convert records to list of dicts
            all_rows = [dict(record) for record in table.records]

            if not all_rows:
                warnings.append("No data records found in DBF file")
                return ExtractionResult(
                    elements=[],
                    metadata=metadata,
                    raw_text="",
                    page_count=0,
                    word_count=0,
                    extraction_method="dbfread",
                    warnings=warnings,
                )

            # Detect column types
            column_types = {}
            for header in headers:
                values = [row.get(header) for row in all_rows]
                column_types[header] = self._detect_column_type(values)

            # Build schema
            schema_columns = []
            for i, header in enumerate(headers):
                schema_columns.append({
                    "name": header,
                    "type": column_types.get(header, "string"),
                    "nullable": any(row.get(header) is None for row in all_rows),
                    "index": i,
                })

            schema = TableSchema(columns=schema_columns)

            # Create structured data
            structured_table = StructuredTableData(
                name=file_path.stem,
                schema=schema,
                rows=all_rows,
                row_count=len(all_rows),
                column_count=len(headers),
                page_index=0,
                total_pages=1,
            )

            metadata["dbf_summary"] = {
                "total_rows": len(all_rows),
                "total_columns": len(headers),
                "columns": headers,
            }

            text_content = (
                f"DBF Data: {len(all_rows)} records, {len(headers)} fields. "
                f"Fields: {', '.join(headers)}"
            )

            elements = [
                ExtractedElement(
                    element_type=ElementType.TEXT,
                    content=text_content,
                    page_number=1,
                )
            ]

        except Exception as e:
            logger.error(f"DBF extraction failed: {e}")
            raise

        return ExtractionResult(
            elements=elements,
            metadata=metadata,
            raw_text=text_content,
            page_count=1,
            word_count=0,
            extraction_method="dbfread",
            warnings=warnings,
            structured_data=[structured_table],
        )

    def _extract_tsv(self, file_path: Path) -> ExtractionResult:
        """Extract content from TSV (Tab-Separated Values) files."""
        # Use CSV extractor with tab delimiter
        if self._docling:
            # Create a temp CSV copy and process
            # Or we can modify the CSV extraction logic
            pass

        # Direct TSV parsing
        metadata: dict[str, Any] = {"format": "tsv", "format_output": "structured_json"}
        warnings: list[str] = []

        try:
            with open(file_path, encoding="utf-8", errors="replace") as f:
                reader = csv.reader(f, delimiter="\t")

                rows_data = list(reader)

            if not rows_data:
                warnings.append("No data found in TSV file")
                return ExtractionResult(
                    elements=[],
                    metadata=metadata,
                    raw_text="",
                    page_count=0,
                    word_count=0,
                    extraction_method="tsv_parser",
                    warnings=warnings,
                )

            # First row as headers
            headers = [h.strip() or f"column_{i}" for i, h in enumerate(rows_data[0])]

            # Convert to list of dicts
            all_rows = []
            for row in rows_data[1:]:
                if any(cell.strip() for cell in row):
                    row_dict = {}
                    for i, cell in enumerate(row):
                        if i < len(headers):
                            row_dict[headers[i]] = cell.strip() or None
                    all_rows.append(row_dict)

            # Build schema
            column_types = {}
            for header in headers:
                values = [row.get(header) for row in all_rows]
                column_types[header] = self._detect_column_type(values)

            schema_columns = []
            for i, header in enumerate(headers):
                schema_columns.append({
                    "name": header,
                    "type": column_types.get(header, "string"),
                    "nullable": True,
                    "index": i,
                })

            schema = TableSchema(columns=schema_columns)

            structured_table = StructuredTableData(
                name=file_path.stem,
                schema=schema,
                rows=all_rows,
                row_count=len(all_rows),
                column_count=len(headers),
                page_index=0,
                total_pages=1,
            )

            metadata["tsv_summary"] = {
                "total_rows": len(all_rows),
                "total_columns": len(headers),
                "columns": headers,
            }

            text_content = (
                f"TSV Data: {len(all_rows)} rows, {len(headers)} columns. "
                f"Columns: {', '.join(headers)}"
            )

            elements = [
                ExtractedElement(
                    element_type=ElementType.TEXT,
                    content=text_content,
                    page_number=1,
                )
            ]

        except Exception as e:
            logger.error(f"TSV extraction failed: {e}")
            raise

        return ExtractionResult(
            elements=elements,
            metadata=metadata,
            raw_text=text_content,
            page_count=1,
            word_count=0,
            extraction_method="tsv_parser",
            warnings=warnings,
            structured_data=[structured_table],
        )

    def _extract_dif(self, file_path: Path) -> ExtractionResult:
        """Extract content from DIF (Data Interchange Format) files."""
        # DIF is a simple text-based format, try LibreOffice first for best results
        if is_libreoffice_available():
            return self._extract_via_libreoffice(file_path)

        # Fallback: basic DIF parsing
        metadata: dict[str, Any] = {"format": "dif"}
        warnings: list[str] = []

        try:
            with open(file_path, encoding="utf-8", errors="replace") as f:
                content = f.read()

            # Basic DIF parsing (simplified)
            # DIF format has TABLE, VECTORS, TUPLES sections
            elements = [
                ExtractedElement(
                    element_type=ElementType.TEXT,
                    content=content,
                    page_number=1,
                    metadata={"type": "raw_dif"},
                )
            ]

            warnings.append(
                "DIF file parsed as raw text. Install LibreOffice for better extraction."
            )

        except Exception as e:
            logger.error(f"DIF extraction failed: {e}")
            raise

        return ExtractionResult(
            elements=elements,
            metadata=metadata,
            raw_text=content,
            page_count=1,
            word_count=len(content.split()),
            extraction_method="dif_raw",
            warnings=warnings,
        )

    def _extract_markup(self, file_path: Path, ext: str) -> ExtractionResult:
        """Extract content from markup files (RST, ORG) via pypandoc."""
        metadata: dict[str, Any] = {"format": ext[1:]}
        warnings: list[str] = []

        # First try pypandoc for best results
        if _pypandoc_available:
            try:
                import pypandoc

                # Convert to markdown (universal intermediate format)
                markdown_content = pypandoc.convert_file(
                    str(file_path),
                    "md",
                    format=ext[1:],  # rst or org
                )

                # Also get plain text
                plain_text = pypandoc.convert_file(
                    str(file_path),
                    "plain",
                    format=ext[1:],
                )

                elements = [
                    ExtractedElement(
                        element_type=ElementType.TEXT,
                        content=plain_text,
                        page_number=1,
                    )
                ]

                metadata["markdown"] = markdown_content

                return ExtractionResult(
                    elements=elements,
                    metadata=metadata,
                    raw_text=plain_text,
                    page_count=1,
                    word_count=len(plain_text.split()),
                    extraction_method=f"pypandoc_{ext[1:]}",
                    warnings=warnings,
                )

            except Exception as e:
                logger.warning(f"Pypandoc conversion failed: {e}")
                warnings.append(f"Pypandoc conversion failed: {e}")

        # Fallback: read as plain text
        try:
            with open(file_path, encoding="utf-8", errors="replace") as f:
                content = f.read()

            elements = [
                ExtractedElement(
                    element_type=ElementType.TEXT,
                    content=content,
                    page_number=1,
                )
            ]

            if not _pypandoc_available:
                warnings.append(
                    "pypandoc not installed. Install with: pip install pypandoc. "
                    "Also requires pandoc system binary."
                )

        except Exception as e:
            logger.error(f"Markup extraction failed: {e}")
            raise

        return ExtractionResult(
            elements=elements,
            metadata=metadata,
            raw_text=content,
            page_count=1,
            word_count=len(content.split()),
            extraction_method=f"raw_{ext[1:]}",
            warnings=warnings,
        )

    def _extract_heic(self, file_path: Path) -> ExtractionResult:
        """Extract content from HEIC/HEIF images."""
        metadata: dict[str, Any] = {"format": "heic"}
        warnings: list[str] = []

        if not _pillow_heif_available:
            warnings.append(
                "pillow-heif not installed. Install with: pip install pillow-heif"
            )
            return ExtractionResult(
                elements=[],
                metadata=metadata,
                raw_text="",
                page_count=0,
                word_count=0,
                extraction_method="heic_fallback",
                warnings=warnings,
            )

        try:
            from PIL import Image
            from pillow_heif import register_heif_opener

            # Register HEIF opener with Pillow
            register_heif_opener()

            # Open and convert to JPEG for processing
            with Image.open(file_path) as img:
                # Convert to RGB if necessary
                if img.mode != "RGB":
                    img = img.convert("RGB")

                # Save as temporary JPEG
                temp_dir = tempfile.mkdtemp(prefix="fileforge_heic_")
                try:
                    temp_jpg = Path(temp_dir) / f"{file_path.stem}.jpg"
                    img.save(temp_jpg, "JPEG", quality=95)

                    # Process with Docling for OCR
                    if self._docling:
                        result = self._docling.extract(temp_jpg)
                        result.metadata["original_format"] = "heic"
                        result.metadata["converted_to"] = "jpeg"
                        return result

                    # Fallback: just return the image as base64
                    with open(temp_jpg, "rb") as f:
                        img_bytes = f.read()
                        b64 = base64.b64encode(img_bytes).decode("utf-8")

                    elements = [
                        ExtractedElement(
                            element_type=ElementType.IMAGE,
                            content=f"HEIC image: {file_path.name}",
                            page_number=1,
                            image_data=f"data:image/jpeg;base64,{b64}",
                            metadata={"original_format": "heic"},
                        )
                    ]

                finally:
                    shutil.rmtree(temp_dir, ignore_errors=True)

        except Exception as e:
            logger.error(f"HEIC extraction failed: {e}")
            raise

        return ExtractionResult(
            elements=elements,
            metadata=metadata,
            raw_text="",
            page_count=1,
            word_count=0,
            extraction_method="pillow_heif",
            warnings=warnings,
        )

    def _extract_audio(self, file_path: Path, **options: Any) -> ExtractionResult:
        """
        Extract content from audio files using Docling's ASR (Whisper) pipeline.

        Supports: MP3, WAV, M4A, FLAC, OGG, WEBM
        """
        metadata: dict[str, Any] = {"format": file_path.suffix.lower()[1:]}
        warnings: list[str] = []

        if not _docling_asr_available:
            warnings.append(
                "Docling ASR not available. Install with: pip install docling[asr]. "
                "Also requires ffmpeg: sudo apt install ffmpeg"
            )
            return ExtractionResult(
                elements=[],
                metadata=metadata,
                raw_text="",
                page_count=0,
                word_count=0,
                extraction_method="audio_fallback",
                warnings=warnings,
            )

        try:
            from docling.datamodel import asr_model_specs
            from docling.datamodel.base_models import InputFormat
            from docling.datamodel.pipeline_options import AcceleratorOptions, AsrPipelineOptions
            from docling.document_converter import AudioFormatOption, DocumentConverter
            from docling.pipeline.asr_pipeline import AsrPipeline

            # Configure ASR pipeline with Whisper BASE model (good balance of speed/accuracy)
            # Available models: WHISPER_TINY, WHISPER_BASE, WHISPER_SMALL, WHISPER_TURBO
            whisper_model = options.get("whisper_model", "base")
            model_map = {
                "tiny": asr_model_specs.WHISPER_TINY,
                "base": asr_model_specs.WHISPER_BASE,
                "small": asr_model_specs.WHISPER_SMALL,
            }

            # Check for turbo model
            if whisper_model == "turbo" and hasattr(asr_model_specs, "WHISPER_TURBO"):
                asr_options = asr_model_specs.WHISPER_TURBO
            else:
                asr_options = model_map.get(whisper_model, asr_model_specs.WHISPER_BASE)

            # Use GPU if available and enabled, otherwise CPU
            device = _get_device()
            accelerator_options = AcceleratorOptions(device=device)
            pipeline_options = AsrPipelineOptions(
                asr_options=asr_options,
                accelerator_options=accelerator_options,
            )

            logger.info(f"Transcribing audio with Whisper ({whisper_model}) on {device.upper()}: {file_path.name}")

            converter = DocumentConverter(
                format_options={
                    InputFormat.AUDIO: AudioFormatOption(
                        pipeline_cls=AsrPipeline,
                        pipeline_options=pipeline_options,
                    )
                }
            )

            # Convert/transcribe audio
            result = converter.convert(str(file_path))

            # Extract transcription
            transcription = result.document.export_to_markdown()

            # Get duration if available
            if hasattr(result.document, "metadata"):
                doc_metadata = result.document.metadata or {}
                if "duration" in doc_metadata:
                    metadata["duration_seconds"] = doc_metadata["duration"]

            metadata["whisper_model"] = whisper_model
            metadata["transcription_method"] = "docling_asr"

            elements = [
                ExtractedElement(
                    element_type=ElementType.TEXT,
                    content=transcription,
                    page_number=1,
                    metadata={"type": "audio_transcription"},
                )
            ]

            word_count = len(transcription.split())

            logger.info(f"Audio transcription complete: {word_count} words")

            return ExtractionResult(
                elements=elements,
                metadata=metadata,
                raw_text=transcription,
                page_count=1,
                word_count=word_count,
                extraction_method="docling_asr_whisper",
                warnings=warnings,
            )

        except Exception as e:
            logger.error(f"Audio transcription failed: {e}")
            raise RuntimeError(
                f"Audio transcription failed: {e}. "
                "Make sure ffmpeg is installed: sudo apt install ffmpeg"
            )

    def _detect_column_type(self, values: list[Any]) -> str:
        """Detect the data type for a column based on sample values."""
        non_empty = [v for v in values if v is not None and str(v).strip()]
        if not non_empty:
            return "string"

        sample = non_empty[:100]
        int_count = 0
        float_count = 0
        bool_count = 0

        for val in sample:
            s = str(val).strip()

            if s.lower() in ("true", "false", "yes", "no"):
                bool_count += 1
                continue

            try:
                int(s)
                int_count += 1
                continue
            except ValueError:
                pass

            try:
                float(s)
                float_count += 1
                continue
            except ValueError:
                pass

        total = len(sample)
        threshold = 0.8

        if int_count / total >= threshold:
            return "integer"
        if float_count / total >= threshold:
            return "number"
        if bool_count / total >= threshold:
            return "boolean"

        return "string"
