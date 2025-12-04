"""
Conversion Endpoints for FileForge

Handles file upload and conversion to LLM-ready format.
"""

from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.converter_api.dependencies import get_db
from apps.worker.tasks.convert_task import convert_document
from packages.common.core.config import settings
from packages.common.core.logging import get_logger
from packages.common.models.document import Document, DocumentStatus
from packages.common.schemas.convert import (
    ChunkStrategy,
    ConvertRequest,
    ConvertResponse,
    ConvertStatusResponse,
    SupportedFormatsResponse,
)
from packages.common.schemas.document import (
    DocumentResponse,
    DocumentWithChunksResponse,
    LLMDocumentResponse,
)
from packages.common.services.conversion import ConverterService


logger = get_logger(__name__)
router = APIRouter()


@router.post(
    "/",
    response_model=ConvertResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Convert a file (async)",
    description="Upload a file and queue it for conversion. Returns a document ID for polling.",
)
async def convert_file_async(
    file: UploadFile = File(..., description="File to convert"),
    chunk_strategy: ChunkStrategy = Form(default=ChunkStrategy.SEMANTIC),
    chunk_size: int = Form(default=1000, ge=100, le=10000),
    chunk_overlap: int = Form(default=100, ge=0, le=1000),
    extract_tables: bool = Form(default=True),
    extract_images: bool = Form(default=False),
    ocr_enabled: bool = Form(default=True),
    ocr_languages: str = Form(default="eng"),
    db: AsyncSession = Depends(get_db),
) -> ConvertResponse:
    """
    Upload a file and queue it for async conversion.

    The file is validated, saved, and a Celery task is queued for processing.
    Poll the status endpoint to check when conversion is complete.
    """
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    file_ext = Path(file.filename).suffix.lower()
    supported = settings.get_supported_extensions_list()
    if file_ext not in supported:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Supported: {supported}",
        )

    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning

    if file_size > settings.max_file_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.max_file_size / 1024 / 1024:.1f}MB",
        )

    # Create conversion request
    request = ConvertRequest(
        chunk_strategy=chunk_strategy,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        extract_tables=extract_tables,
        extract_images=extract_images,
        ocr_enabled=ocr_enabled,
        ocr_languages=ocr_languages,
    )

    # Create document record
    converter = ConverterService(db)
    document = await converter.create_document_from_upload(file, request)
    await db.commit()

    # Queue conversion task
    convert_document.delay(
        document_id=document.id,
        chunk_strategy=chunk_strategy.value,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        extract_tables=extract_tables,
        extract_images=extract_images,
        ocr_enabled=ocr_enabled,
        ocr_languages=ocr_languages,
    )

    logger.info(f"Queued conversion task for document {document.id}")

    return ConvertResponse(
        document_id=document.id,
        status="processing",
        message="File uploaded and queued for conversion",
        poll_url=f"/api/v1/convert/status/{document.id}",
    )


@router.post(
    "/sync",
    response_model=LLMDocumentResponse,
    summary="Convert a file (sync)",
    description="Upload and convert a file synchronously. Blocks until complete.",
)
async def convert_file_sync(
    file: UploadFile = File(..., description="File to convert"),
    chunk_strategy: ChunkStrategy = Form(default=ChunkStrategy.SEMANTIC),
    chunk_size: int = Form(default=1000, ge=100, le=10000),
    chunk_overlap: int = Form(default=100, ge=0, le=1000),
    extract_tables: bool = Form(default=True),
    extract_images: bool = Form(default=False),
    include_raw_text: bool = Form(default=False),
    ocr_enabled: bool = Form(default=True),
    ocr_languages: str = Form(default="eng"),
    db: AsyncSession = Depends(get_db),
) -> LLMDocumentResponse:
    """
    Upload and convert a file synchronously.

    Warning: This blocks until conversion is complete. Use async endpoint for large files.
    """
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    file_ext = Path(file.filename).suffix.lower()
    supported = settings.get_supported_extensions_list()
    if file_ext not in supported:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Supported: {supported}",
        )

    # Check file size (smaller limit for sync)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    max_sync_size = min(settings.max_file_size, 10 * 1024 * 1024)  # 10MB max for sync
    if file_size > max_sync_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large for sync processing. Maximum: {max_sync_size / 1024 / 1024:.1f}MB. Use async endpoint.",
        )

    # Create request and process
    request = ConvertRequest(
        chunk_strategy=chunk_strategy,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        extract_tables=extract_tables,
        extract_images=extract_images,
        include_raw_text=include_raw_text,
        ocr_enabled=ocr_enabled,
        ocr_languages=ocr_languages,
    )

    converter = ConverterService(db)
    document = await converter.convert_file_sync(file, request)

    # Build response
    from packages.common.schemas.document import ChunkResponse

    doc_response = DocumentResponse.model_validate(document)
    chunks_response = [ChunkResponse.model_validate(c) for c in document.chunks]

    return LLMDocumentResponse.from_document(
        document=doc_response,
        chunks=chunks_response,
        include_raw_text=include_raw_text,
        raw_text=document.raw_text if include_raw_text else None,
    )


@router.get(
    "/status/{document_id}",
    response_model=ConvertStatusResponse,
    summary="Check conversion status",
)
async def get_conversion_status(
    document_id: int,
    db: AsyncSession = Depends(get_db),
) -> ConvertStatusResponse:
    """Check the status of a conversion task."""
    document = await db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    result_url = None
    if document.status == DocumentStatus.COMPLETED:
        result_url = f"/api/v1/documents/{document_id}"

    return ConvertStatusResponse(
        document_id=document.id,
        status=document.status.value,
        progress=1.0 if document.status == DocumentStatus.COMPLETED else None,
        error_message=document.error_message,
        result_url=result_url,
    )


@router.get(
    "/formats",
    response_model=SupportedFormatsResponse,
    summary="List supported formats",
)
async def get_supported_formats() -> SupportedFormatsResponse:
    """Get list of supported file formats."""
    formats = [
        {"extension": ".pdf", "mime_type": "application/pdf", "description": "PDF documents"},
        {"extension": ".docx", "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "description": "Word documents"},
        {"extension": ".doc", "mime_type": "application/msword", "description": "Legacy Word documents"},
        {"extension": ".xlsx", "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "description": "Excel spreadsheets"},
        {"extension": ".xls", "mime_type": "application/vnd.ms-excel", "description": "Legacy Excel spreadsheets"},
        {"extension": ".pptx", "mime_type": "application/vnd.openxmlformats-officedocument.presentationml.presentation", "description": "PowerPoint presentations"},
        {"extension": ".txt", "mime_type": "text/plain", "description": "Plain text files"},
        {"extension": ".md", "mime_type": "text/markdown", "description": "Markdown files"},
        {"extension": ".html", "mime_type": "text/html", "description": "HTML documents"},
        {"extension": ".csv", "mime_type": "text/csv", "description": "CSV data files"},
        {"extension": ".json", "mime_type": "application/json", "description": "JSON files"},
        {"extension": ".xml", "mime_type": "application/xml", "description": "XML files"},
        {"extension": ".png", "mime_type": "image/png", "description": "PNG images (OCR)"},
        {"extension": ".jpg", "mime_type": "image/jpeg", "description": "JPEG images (OCR)"},
    ]

    return SupportedFormatsResponse(formats=formats, total=len(formats))
