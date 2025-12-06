"""
Conversion Endpoints for FileForge

Handles file upload and text extraction for multiple formats.
"""

from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.converter_api.dependencies import get_db
from packages.common.core.config import settings
from packages.common.core.logging import get_logger
from packages.common.services.conversion.local_converter_service import LocalConverterService


logger = get_logger(__name__)
router = APIRouter()

# All supported file extensions
SUPPORTED_EXTENSIONS = {
    # Documents
    ".pdf": {"mime_type": "application/pdf", "category": "Documents", "description": "PDF documents"},
    ".docx": {"mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "category": "Documents", "description": "Microsoft Word documents"},
    ".xlsx": {"mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "category": "Spreadsheets", "description": "Microsoft Excel spreadsheets"},
    ".pptx": {"mime_type": "application/vnd.openxmlformats-officedocument.presentationml.presentation", "category": "Presentations", "description": "Microsoft PowerPoint presentations"},
    # Markup
    ".html": {"mime_type": "text/html", "category": "Markup", "description": "HTML documents"},
    ".htm": {"mime_type": "text/html", "category": "Markup", "description": "HTML documents"},
    ".xhtml": {"mime_type": "application/xhtml+xml", "category": "Markup", "description": "XHTML documents"},
    ".md": {"mime_type": "text/markdown", "category": "Markup", "description": "Markdown documents"},
    ".markdown": {"mime_type": "text/markdown", "category": "Markup", "description": "Markdown documents"},
    ".adoc": {"mime_type": "text/asciidoc", "category": "Markup", "description": "AsciiDoc documents"},
    ".asciidoc": {"mime_type": "text/asciidoc", "category": "Markup", "description": "AsciiDoc documents"},
    # Data
    ".csv": {"mime_type": "text/csv", "category": "Data", "description": "CSV files"},
    ".vtt": {"mime_type": "text/vtt", "category": "Data", "description": "WebVTT subtitle files"},
    ".xml": {"mime_type": "application/xml", "category": "Data", "description": "XML documents"},
    ".json": {"mime_type": "application/json", "category": "Data", "description": "JSON documents"},
    # Images (OCR supported)
    ".png": {"mime_type": "image/png", "category": "Images", "description": "PNG images (OCR supported)"},
    ".jpg": {"mime_type": "image/jpeg", "category": "Images", "description": "JPEG images (OCR supported)"},
    ".jpeg": {"mime_type": "image/jpeg", "category": "Images", "description": "JPEG images (OCR supported)"},
    ".tiff": {"mime_type": "image/tiff", "category": "Images", "description": "TIFF images (OCR supported)"},
    ".tif": {"mime_type": "image/tiff", "category": "Images", "description": "TIFF images (OCR supported)"},
    ".bmp": {"mime_type": "image/bmp", "category": "Images", "description": "BMP images (OCR supported)"},
    ".webp": {"mime_type": "image/webp", "category": "Images", "description": "WebP images (OCR supported)"},
    ".gif": {"mime_type": "image/gif", "category": "Images", "description": "GIF images (OCR supported)"},
    # Audio
    ".wav": {"mime_type": "audio/wav", "category": "Audio", "description": "WAV audio files"},
    ".mp3": {"mime_type": "audio/mpeg", "category": "Audio", "description": "MP3 audio files"},
}


@router.post(
    "/local",
    summary="Extract text from document",
    description="Upload a document and extract text with page-by-page output. Supports PDF, DOCX, XLSX, PPTX, HTML, Markdown, images, and more.",
)
async def extract_document_text(
    file: UploadFile = File(..., description="Document file to process"),
    db: AsyncSession = Depends(get_db),
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
    """
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
