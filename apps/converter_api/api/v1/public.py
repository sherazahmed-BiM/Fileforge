"""
Public API Endpoints for FileForge

External-facing API for file conversion using API key authentication.
Includes rate limiting, sync and async processing.
"""

import time
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Header, HTTPException, Query, UploadFile, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.converter_api.api.v1.convert import SUPPORTED_EXTENSIONS
from apps.converter_api.dependencies import get_db
from packages.common.auth.api_key import API_KEY_HEADER, get_api_key
from packages.common.core.config import settings
from packages.common.core.logging import get_logger
from packages.common.middleware.rate_limit import check_rate_limit, get_rate_limiter
from packages.common.models import APIKey, Document
from packages.common.models.document import DocumentStatus
from packages.common.schemas.api_key import (
    ChunkContent,
    ContentResponse,
    ConvertAsyncResponse,
    ConvertResponse,
    DocumentInfo,
    FormatInfo,
    FormatsResponse,
    JobStatusResponse,
    PageContent,
    PublicAPIError,
    PublicAPIErrorDetail,
    StatisticsResponse,
    UsageResponse,
)
from packages.common.services.conversion.local_converter_service import LocalConverterService


logger = get_logger(__name__)
router = APIRouter()


async def get_verified_api_key(
    x_api_key: Optional[str] = Header(None, alias=API_KEY_HEADER),
    db: AsyncSession = Depends(get_db),
) -> APIKey:
    """
    Validate API key and check rate limits.

    This is the main dependency for all public API endpoints.
    """
    # Get and validate the API key
    api_key = await get_api_key(x_api_key, db)

    # Check rate limits
    await check_rate_limit(
        api_key_id=api_key.id,
        limit_rpm=api_key.rate_limit_rpm,
        limit_rpd=api_key.rate_limit_rpd,
    )

    # Update usage in database
    api_key.record_usage()
    await db.flush()

    return api_key


def create_error_response(
    status_code: int,
    code: str,
    message: str,
    retry_after: Optional[int] = None,
) -> JSONResponse:
    """Create a standardized error response."""
    error = PublicAPIError(
        error=PublicAPIErrorDetail(
            code=code,
            message=message,
            retry_after=retry_after,
        )
    )
    return JSONResponse(
        status_code=status_code,
        content=error.model_dump(),
    )


@router.post(
    "/convert",
    response_model=ConvertResponse,
    summary="Convert a file to LLM-ready format",
    responses={
        400: {"model": PublicAPIError, "description": "Bad request"},
        401: {"model": PublicAPIError, "description": "Unauthorized"},
        429: {"model": PublicAPIError, "description": "Rate limit exceeded"},
        500: {"model": PublicAPIError, "description": "Server error"},
    },
)
async def convert_file(
    file: UploadFile = File(..., description="Document file to process"),
    chunk_strategy: str = Query(
        default="semantic",
        description="Chunking strategy: semantic, fixed, or none",
    ),
    chunk_size: int = Query(
        default=1000,
        ge=100,
        le=10000,
        description="Target chunk size in characters (for fixed strategy)",
    ),
    chunk_overlap: int = Query(
        default=100,
        ge=0,
        le=500,
        description="Overlap between chunks in characters",
    ),
    api_key: APIKey = Depends(get_verified_api_key),
    db: AsyncSession = Depends(get_db),
) -> ConvertResponse:
    """
    Upload a file and get LLM-ready JSON output synchronously.

    This endpoint processes the file immediately and returns the result.
    For large files (>10MB), consider using /convert/async instead.

    **Chunk Strategies:**
    - `semantic`: Split by document structure (sections, paragraphs)
    - `fixed`: Split by character count with overlap
    - `none`: No chunking, return full text

    **Rate Limits:**
    - Default: 60 requests/minute, 1000 requests/day
    - Custom limits per API key
    """
    start_time = time.time()

    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_FILE", "message": "Filename is required"},
        )

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "UNSUPPORTED_FORMAT",
                "message": f"Unsupported file format: {file_ext}",
            },
        )

    # Check file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    max_size = min(settings.max_file_size, 100 * 1024 * 1024)  # 100MB max
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "FILE_TOO_LARGE",
                "message": f"File too large. Maximum: {max_size / 1024 / 1024:.1f}MB",
            },
        )

    # Validate chunk strategy
    if chunk_strategy not in ["semantic", "fixed", "none"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_CHUNK_STRATEGY",
                "message": "chunk_strategy must be 'semantic', 'fixed', or 'none'",
            },
        )

    # Process file
    try:
        converter = LocalConverterService(db)
        result = await converter.extract_text(file)
    except Exception as e:
        logger.error(f"Failed to process file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "PROCESSING_ERROR",
                "message": f"Failed to process file: {str(e)}",
            },
        )

    # Calculate processing time
    processing_time_ms = int((time.time() - start_time) * 1000)

    # Build response
    pages = result.get("pages", [])
    page_content = [
        PageContent(
            page_number=p.get("page_number", i + 1),
            text=p.get("text", ""),
            word_count=len(p.get("text", "").split()),
        )
        for i, p in enumerate(pages)
    ]

    # Calculate totals
    total_text = " ".join(p.text for p in page_content)
    total_words = sum(p.word_count for p in page_content)

    # Create chunks based on strategy
    chunks = []
    if chunk_strategy != "none" and total_text:
        # Simple chunking for now - could be enhanced with semantic chunking
        if chunk_strategy == "fixed":
            # Fixed size chunking with overlap
            text = total_text
            chunk_index = 0
            pos = 0
            while pos < len(text):
                end = min(pos + chunk_size, len(text))
                chunk_text = text[pos:end]
                token_count = len(chunk_text.split())  # Approximate token count
                chunks.append(
                    ChunkContent(
                        index=chunk_index,
                        text=chunk_text,
                        token_count=token_count,
                        source_page=None,
                    )
                )
                chunk_index += 1
                pos = end - chunk_overlap if end < len(text) else len(text)
        else:
            # Semantic chunking - use page boundaries as chunks
            for i, page in enumerate(page_content):
                if page.text.strip():
                    chunks.append(
                        ChunkContent(
                            index=i,
                            text=page.text,
                            token_count=page.word_count,
                            source_page=page.page_number,
                        )
                    )

    total_tokens = sum(c.token_count for c in chunks) if chunks else total_words

    # Get file type info
    file_info = SUPPORTED_EXTENSIONS.get(file_ext, {})

    return ConvertResponse(
        document=DocumentInfo(
            filename=file.filename,
            file_type=file_ext.lstrip("."),
            file_size_bytes=file_size,
            page_count=len(pages),
        ),
        content=ContentResponse(
            pages=page_content,
            chunks=chunks,
        ),
        statistics=StatisticsResponse(
            total_pages=len(pages),
            total_words=total_words,
            total_chunks=len(chunks),
            total_tokens=total_tokens,
            processing_time_ms=processing_time_ms,
        ),
    )


@router.post(
    "/convert/async",
    response_model=ConvertAsyncResponse,
    summary="Queue a file for async conversion",
    responses={
        400: {"model": PublicAPIError, "description": "Bad request"},
        401: {"model": PublicAPIError, "description": "Unauthorized"},
        429: {"model": PublicAPIError, "description": "Rate limit exceeded"},
    },
)
async def convert_file_async(
    file: UploadFile = File(..., description="Document file to process"),
    chunk_strategy: str = Query(default="semantic"),
    chunk_size: int = Query(default=1000, ge=100, le=10000),
    chunk_overlap: int = Query(default=100, ge=0, le=500),
    api_key: APIKey = Depends(get_verified_api_key),
    db: AsyncSession = Depends(get_db),
) -> ConvertAsyncResponse:
    """
    Queue a file for asynchronous processing.

    Returns a job ID that can be used to check status and retrieve results.
    Use this for large files or when you don't need immediate results.

    **Workflow:**
    1. POST /convert/async - Get job_id
    2. GET /jobs/{job_id} - Check status
    3. GET /jobs/{job_id}/result - Get results when complete
    """
    # Validate file (same as sync)
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_FILE", "message": "Filename is required"},
        )

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "UNSUPPORTED_FORMAT",
                "message": f"Unsupported file format: {file_ext}",
            },
        )

    # For now, create a job ID and process synchronously
    # TODO: Implement actual async processing with Celery
    job_id = str(uuid.uuid4())

    logger.info(f"Created async job {job_id} for user with API key {api_key.id}")

    return ConvertAsyncResponse(
        job_id=job_id,
        message="File queued for processing. Use GET /jobs/{job_id} to check status.",
    )


@router.get(
    "/jobs/{job_id}",
    response_model=JobStatusResponse,
    summary="Check async job status",
    responses={
        404: {"model": PublicAPIError, "description": "Job not found"},
    },
)
async def get_job_status(
    job_id: str,
    api_key: APIKey = Depends(get_verified_api_key),
    db: AsyncSession = Depends(get_db),
) -> JobStatusResponse:
    """
    Check the status of an async conversion job.

    **Status values:**
    - `pending`: Job is queued
    - `processing`: Job is being processed
    - `completed`: Job finished successfully
    - `failed`: Job failed with error
    """
    # TODO: Implement actual job lookup from database/Redis
    # For now, return a mock response
    from datetime import datetime

    return JobStatusResponse(
        job_id=job_id,
        status="pending",
        progress=0,
        created_at=datetime.utcnow(),
    )


@router.get(
    "/jobs/{job_id}/result",
    response_model=ConvertResponse,
    summary="Get async job result",
    responses={
        404: {"model": PublicAPIError, "description": "Job not found"},
        409: {"model": PublicAPIError, "description": "Job not complete"},
    },
)
async def get_job_result(
    job_id: str,
    api_key: APIKey = Depends(get_verified_api_key),
    db: AsyncSession = Depends(get_db),
) -> ConvertResponse:
    """
    Get the result of a completed async conversion job.

    Returns the same format as the sync /convert endpoint.
    Only available when job status is 'completed'.
    """
    # TODO: Implement actual job result retrieval
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={
            "code": "JOB_NOT_FOUND",
            "message": "Job not found or not yet complete",
        },
    )


@router.get(
    "/usage",
    response_model=UsageResponse,
    summary="Get API key usage statistics",
)
async def get_usage(
    api_key: APIKey = Depends(get_verified_api_key),
    db: AsyncSession = Depends(get_db),
) -> UsageResponse:
    """
    Get current usage statistics for your API key.

    Shows requests this minute, today, and total requests.
    """
    # Get current usage from rate limiter
    rate_limiter = get_rate_limiter()
    usage = await rate_limiter.get_usage(api_key.id)

    return UsageResponse(
        api_key_name=api_key.name,
        rate_limit_rpm=api_key.rate_limit_rpm,
        rate_limit_rpd=api_key.rate_limit_rpd,
        requests_this_minute=usage["requests_this_minute"],
        requests_today=usage["requests_today"],
        total_requests=api_key.total_requests,
        last_used_at=api_key.last_used_at,
    )


@router.get(
    "/formats",
    response_model=FormatsResponse,
    summary="List supported file formats",
)
async def get_formats(
    api_key: APIKey = Depends(get_verified_api_key),
) -> FormatsResponse:
    """
    Get a list of all supported file formats.

    Includes extension, MIME type, category, and description.
    """
    formats = [
        FormatInfo(
            extension=ext,
            mime_type=info["mime_type"],
            category=info["category"],
            description=info["description"],
        )
        for ext, info in SUPPORTED_EXTENSIONS.items()
    ]

    # Sort by category then extension
    formats.sort(key=lambda x: (x.category, x.extension))

    return FormatsResponse(
        formats=formats,
        total=len(formats),
    )
