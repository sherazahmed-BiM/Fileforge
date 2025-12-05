"""
Conversion Endpoints for FileForge

Handles PDF file upload and text extraction.
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


@router.post(
    "/local",
    summary="Extract text from PDF",
    description="Upload a PDF file and extract text with page-by-page output.",
)
async def extract_pdf_text(
    file: UploadFile = File(..., description="PDF file to process"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Extract text from a PDF file.

    Returns page-by-page format:
    {
        "document": { filename, file_type, metadata },
        "pages": [
            { "page_number": 1, "text": "..." },
            { "page_number": 2, "text": "..." }
        ],
        "statistics": { page_count, word_count },
        "warnings": []
    }

    Uses PyMuPDF for text extraction - no external API calls.
    """
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    file_ext = Path(file.filename).suffix.lower()
    if file_ext != ".pdf":
        raise HTTPException(
            status_code=400,
            detail=f"Only PDF files are supported. Got: {file_ext}",
        )

    # Check file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    max_size = min(settings.max_file_size, 50 * 1024 * 1024)  # 50MB max
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
        logger.error(f"Failed to extract text from PDF: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process PDF: {str(e)}",
        )


@router.get(
    "/formats",
    summary="List supported formats",
)
async def get_supported_formats() -> dict:
    """Get list of supported file formats."""
    return {
        "formats": [
            {
                "extension": ".pdf",
                "mime_type": "application/pdf",
                "description": "PDF documents",
            }
        ],
        "total": 1,
    }
