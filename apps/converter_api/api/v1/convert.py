"""
Conversion Endpoints for FileForge

Handles file upload and text extraction for multiple formats.
"""

from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from apps.converter_api.dependencies import get_db
from packages.common.auth.api_key import ApiKeyAuth
from packages.common.auth.rate_limit import check_rate_limit
from packages.common.core.config import settings
from packages.common.core.logging import get_logger
from packages.common.models.api_key import ApiKey
from packages.common.services.conversion.local_converter_service import LocalConverterService


logger = get_logger(__name__)
router = APIRouter()

# All supported file extensions
SUPPORTED_EXTENSIONS = {
    # Documents - Modern Office
    ".pdf": {"mime_type": "application/pdf", "category": "Documents", "description": "PDF documents"},
    ".docx": {"mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "category": "Documents", "description": "Microsoft Word documents"},
    ".xlsx": {"mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "category": "Spreadsheets", "description": "Microsoft Excel spreadsheets"},
    ".pptx": {"mime_type": "application/vnd.openxmlformats-officedocument.presentationml.presentation", "category": "Presentations", "description": "Microsoft PowerPoint presentations"},
    # Documents - Legacy Office (via LibreOffice)
    ".doc": {"mime_type": "application/msword", "category": "Documents", "description": "Microsoft Word (97-2003)"},
    ".dot": {"mime_type": "application/msword", "category": "Documents", "description": "Word template"},
    ".dotm": {"mime_type": "application/vnd.ms-word.template.macroEnabled.12", "category": "Documents", "description": "Word macro-enabled template"},
    ".dotx": {"mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.template", "category": "Documents", "description": "Word template"},
    ".rtf": {"mime_type": "application/rtf", "category": "Documents", "description": "Rich Text Format"},
    ".xls": {"mime_type": "application/vnd.ms-excel", "category": "Spreadsheets", "description": "Microsoft Excel (97-2003)"},
    ".xlm": {"mime_type": "application/vnd.ms-excel", "category": "Spreadsheets", "description": "Excel macro sheet"},
    ".xlt": {"mime_type": "application/vnd.ms-excel", "category": "Spreadsheets", "description": "Excel template"},
    ".ppt": {"mime_type": "application/vnd.ms-powerpoint", "category": "Presentations", "description": "Microsoft PowerPoint (97-2003)"},
    ".pot": {"mime_type": "application/vnd.ms-powerpoint", "category": "Presentations", "description": "PowerPoint template"},
    ".pptm": {"mime_type": "application/vnd.ms-powerpoint.presentation.macroEnabled.12", "category": "Presentations", "description": "PowerPoint macro-enabled"},
    ".pps": {"mime_type": "application/vnd.ms-powerpoint", "category": "Presentations", "description": "PowerPoint slide show"},
    ".ppsx": {"mime_type": "application/vnd.openxmlformats-officedocument.presentationml.slideshow", "category": "Presentations", "description": "PowerPoint slide show"},
    # Documents - Open Document Format (via LibreOffice)
    ".odt": {"mime_type": "application/vnd.oasis.opendocument.text", "category": "Documents", "description": "Open Document Text"},
    ".ott": {"mime_type": "application/vnd.oasis.opendocument.text-template", "category": "Documents", "description": "Open Document Text Template"},
    ".ods": {"mime_type": "application/vnd.oasis.opendocument.spreadsheet", "category": "Spreadsheets", "description": "Open Document Spreadsheet"},
    ".ots": {"mime_type": "application/vnd.oasis.opendocument.spreadsheet-template", "category": "Spreadsheets", "description": "Open Document Spreadsheet Template"},
    ".odp": {"mime_type": "application/vnd.oasis.opendocument.presentation", "category": "Presentations", "description": "Open Document Presentation"},
    ".otp": {"mime_type": "application/vnd.oasis.opendocument.presentation-template", "category": "Presentations", "description": "Open Document Presentation Template"},
    # Documents - Legacy Word Processing (via LibreOffice)
    ".abw": {"mime_type": "application/x-abiword", "category": "Documents", "description": "AbiWord document"},
    ".zabw": {"mime_type": "application/x-abiword", "category": "Documents", "description": "AbiWord compressed"},
    ".hwp": {"mime_type": "application/x-hwp", "category": "Documents", "description": "Hangul Word Processor"},
    ".sxw": {"mime_type": "application/vnd.sun.xml.writer", "category": "Documents", "description": "StarOffice Writer"},
    ".sxg": {"mime_type": "application/vnd.sun.xml.writer.global", "category": "Documents", "description": "StarOffice Writer Global"},
    ".wpd": {"mime_type": "application/vnd.wordperfect", "category": "Documents", "description": "WordPerfect"},
    ".wps": {"mime_type": "application/vnd.ms-works", "category": "Documents", "description": "Microsoft Works"},
    ".cwk": {"mime_type": "application/x-appleworks", "category": "Documents", "description": "AppleWorks/ClarisWorks"},
    ".mcw": {"mime_type": "application/macwriteii", "category": "Documents", "description": "MacWrite"},
    # Spreadsheets - Legacy (via LibreOffice)
    ".et": {"mime_type": "application/x-et", "category": "Spreadsheets", "description": "Kingsoft ET"},
    ".fods": {"mime_type": "application/vnd.oasis.opendocument.spreadsheet-flat-xml", "category": "Spreadsheets", "description": "Flat Open Document Spreadsheet"},
    ".sxc": {"mime_type": "application/vnd.sun.xml.calc", "category": "Spreadsheets", "description": "StarOffice Calc"},
    ".wk1": {"mime_type": "application/vnd.lotus-1-2-3", "category": "Spreadsheets", "description": "Lotus 1-2-3"},
    ".wks": {"mime_type": "application/vnd.lotus-1-2-3", "category": "Spreadsheets", "description": "Lotus 1-2-3 worksheet"},
    ".dif": {"mime_type": "text/x-dif", "category": "Spreadsheets", "description": "Data Interchange Format"},
    # Presentations - Legacy (via LibreOffice)
    ".sxi": {"mime_type": "application/vnd.sun.xml.impress", "category": "Presentations", "description": "StarOffice Impress"},
    # Markup
    ".html": {"mime_type": "text/html", "category": "Markup", "description": "HTML documents"},
    ".htm": {"mime_type": "text/html", "category": "Markup", "description": "HTML documents"},
    ".xhtml": {"mime_type": "application/xhtml+xml", "category": "Markup", "description": "XHTML documents"},
    ".md": {"mime_type": "text/markdown", "category": "Markup", "description": "Markdown documents"},
    ".markdown": {"mime_type": "text/markdown", "category": "Markup", "description": "Markdown documents"},
    ".adoc": {"mime_type": "text/asciidoc", "category": "Markup", "description": "AsciiDoc documents"},
    ".asciidoc": {"mime_type": "text/asciidoc", "category": "Markup", "description": "AsciiDoc documents"},
    ".rst": {"mime_type": "text/x-rst", "category": "Markup", "description": "reStructuredText"},
    ".org": {"mime_type": "text/x-org", "category": "Markup", "description": "Org-mode"},
    # Data
    ".csv": {"mime_type": "text/csv", "category": "Data", "description": "CSV files"},
    ".tsv": {"mime_type": "text/tab-separated-values", "category": "Data", "description": "TSV files"},
    ".vtt": {"mime_type": "text/vtt", "category": "Data", "description": "WebVTT subtitle files"},
    ".xml": {"mime_type": "application/xml", "category": "Data", "description": "XML documents"},
    ".json": {"mime_type": "application/json", "category": "Data", "description": "JSON documents"},
    ".dbf": {"mime_type": "application/x-dbf", "category": "Data", "description": "dBase database file"},
    # Images (OCR supported)
    ".png": {"mime_type": "image/png", "category": "Images", "description": "PNG images (OCR supported)"},
    ".jpg": {"mime_type": "image/jpeg", "category": "Images", "description": "JPEG images (OCR supported)"},
    ".jpeg": {"mime_type": "image/jpeg", "category": "Images", "description": "JPEG images (OCR supported)"},
    ".tiff": {"mime_type": "image/tiff", "category": "Images", "description": "TIFF images (OCR supported)"},
    ".tif": {"mime_type": "image/tiff", "category": "Images", "description": "TIFF images (OCR supported)"},
    ".bmp": {"mime_type": "image/bmp", "category": "Images", "description": "BMP images (OCR supported)"},
    ".webp": {"mime_type": "image/webp", "category": "Images", "description": "WebP images (OCR supported)"},
    ".gif": {"mime_type": "image/gif", "category": "Images", "description": "GIF images (OCR supported)"},
    ".heic": {"mime_type": "image/heic", "category": "Images", "description": "HEIC images (OCR supported)"},
    ".heif": {"mime_type": "image/heif", "category": "Images", "description": "HEIF images (OCR supported)"},
    # Email
    ".eml": {"mime_type": "message/rfc822", "category": "Email", "description": "Email message (MIME)"},
    ".msg": {"mime_type": "application/vnd.ms-outlook", "category": "Email", "description": "Outlook message"},
    ".p7s": {"mime_type": "application/pkcs7-signature", "category": "Email", "description": "S/MIME signed message"},
    # Ebooks
    ".epub": {"mime_type": "application/epub+zip", "category": "Ebooks", "description": "EPUB ebook"},
    # Audio (transcription via Whisper ASR)
    ".mp3": {"mime_type": "audio/mpeg", "category": "Audio", "description": "MP3 audio (transcription)"},
    ".wav": {"mime_type": "audio/wav", "category": "Audio", "description": "WAV audio (transcription)"},
    ".m4a": {"mime_type": "audio/mp4", "category": "Audio", "description": "M4A audio (transcription)"},
    ".flac": {"mime_type": "audio/flac", "category": "Audio", "description": "FLAC audio (transcription)"},
    ".ogg": {"mime_type": "audio/ogg", "category": "Audio", "description": "OGG audio (transcription)"},
    ".webm": {"mime_type": "audio/webm", "category": "Audio", "description": "WebM audio (transcription)"},
}


@router.post(
    "/local",
    summary="Extract text from document",
    description="Upload a document and extract text with page-by-page output. Supports PDF, DOCX, XLSX, PPTX, HTML, Markdown, images, and more.",
)
async def extract_document_text(
    file: UploadFile = File(..., description="Document file to process"),
    db: AsyncSession = Depends(get_db),
    api_key: ApiKey | None = Depends(ApiKeyAuth(required=False)),
) -> dict:
    """
    Extract text from a document file.

    Supported formats: PDF, DOCX, XLSX, PPTX, HTML, Markdown, CSV, images (with OCR), and more.

    Returns page-by-page format:
    {
        "document": { filename, file_type, metadata },
        "pages": [
            { "page_number": 1, "text": "...", "images": [...] },
            { "page_number": 2, "text": "...", "images": [...] }
        ],
        "statistics": { page_count, word_count, image_count },
        "warnings": []
    }

    Authentication: Include X-API-Key header for authenticated access with rate limiting.
    """
    # Apply rate limiting if API key is provided
    if api_key:
        await check_rate_limit(
            key=f"api_key:{api_key.id}",
            limit=api_key.rate_limit_rpm,
            window=60,
        )

    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in SUPPORTED_EXTENSIONS:
        supported_list = ", ".join(sorted(SUPPORTED_EXTENSIONS.keys()))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: {file_ext}. Supported formats: {supported_list}",
        )

    # Check file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    max_size = min(settings.max_file_size, 100 * 1024 * 1024)  # 100MB max
    if file_size > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum: {max_size / 1024 / 1024:.1f}MB",
        )

    # Extract text
    try:
        converter = LocalConverterService(db)
        result = await converter.extract_text(file)
        return result
    except Exception as e:
        logger.error(f"Failed to extract text from {file_ext}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process file: {str(e)}",
        )


@router.get(
    "/formats",
    summary="List supported formats",
)
async def get_supported_formats() -> dict:
    """Get list of supported file formats grouped by category."""
    formats = []
    for ext, info in SUPPORTED_EXTENSIONS.items():
        formats.append({
            "extension": ext,
            "mime_type": info["mime_type"],
            "category": info["category"],
            "description": info["description"],
        })

    # Sort by category then extension
    formats.sort(key=lambda x: (x["category"], x["extension"]))

    # Group by category for summary
    categories = {}
    for fmt in formats:
        cat = fmt["category"]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(fmt["extension"])

    return {
        "formats": formats,
        "categories": categories,
        "total": len(formats),
    }
