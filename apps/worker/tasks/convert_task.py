"""
Celery Tasks for FileForge

Async document conversion tasks.
"""

import asyncio
from typing import Any

from celery import shared_task

from packages.common.core.celery_app import celery_app
from packages.common.core.database import get_db_context
from packages.common.core.logging import get_logger
from packages.common.models.document import Document, DocumentStatus
from packages.common.schemas.convert import ChunkStrategy, ConvertRequest
from packages.common.services.conversion import ConverterService, ParserService


logger = get_logger(__name__)


@celery_app.task(
    name="convert_document",
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 60},
    retry_backoff=True,
    retry_backoff_max=600,
    acks_late=True,
)
def convert_document(
    self,
    document_id: int,
    chunk_strategy: str = "semantic",
    chunk_size: int = 1000,
    chunk_overlap: int = 100,
    extract_tables: bool = True,
    extract_images: bool = False,
    ocr_enabled: bool = True,
    ocr_languages: str = "eng",
) -> dict[str, Any]:
    """
    Celery task to convert a document asynchronously.

    Args:
        document_id: ID of the document to process
        chunk_strategy: Chunking strategy to use
        chunk_size: Target chunk size
        chunk_overlap: Overlap between chunks
        extract_tables: Whether to extract tables
        extract_images: Whether to extract images
        ocr_enabled: Whether to enable OCR
        ocr_languages: OCR languages

    Returns:
        Dict with processing results
    """
    logger.info(f"Starting conversion task for document {document_id}")

    # Run async code in sync context
    result = asyncio.run(
        _process_document_async(
            document_id=document_id,
            chunk_strategy=chunk_strategy,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            extract_tables=extract_tables,
            extract_images=extract_images,
            ocr_enabled=ocr_enabled,
            ocr_languages=ocr_languages,
        )
    )

    return result


async def _process_document_async(
    document_id: int,
    chunk_strategy: str,
    chunk_size: int,
    chunk_overlap: int,
    extract_tables: bool,
    extract_images: bool,
    ocr_enabled: bool,
    ocr_languages: str,
) -> dict[str, Any]:
    """
    Async document processing implementation.

    Args:
        document_id: ID of the document to process
        chunk_strategy: Chunking strategy to use
        chunk_size: Target chunk size
        chunk_overlap: Overlap between chunks
        extract_tables: Whether to extract tables
        extract_images: Whether to extract images
        ocr_enabled: Whether to enable OCR
        ocr_languages: OCR languages

    Returns:
        Dict with processing results
    """
    async with get_db_context() as db:
        # Get document
        document = await db.get(Document, document_id)
        if not document:
            logger.error(f"Document {document_id} not found")
            return {
                "success": False,
                "document_id": document_id,
                "error": "Document not found",
            }

        if document.status == DocumentStatus.COMPLETED:
            logger.info(f"Document {document_id} already processed")
            return {
                "success": True,
                "document_id": document_id,
                "status": "already_completed",
                "total_chunks": document.total_chunks,
                "total_tokens": document.total_tokens,
            }

        # Create conversion request
        request = ConvertRequest(
            chunk_strategy=ChunkStrategy(chunk_strategy),
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            extract_tables=extract_tables,
            extract_images=extract_images,
            ocr_enabled=ocr_enabled,
            ocr_languages=ocr_languages,
        )

        try:
            # Process document
            converter = ConverterService(db)
            document = await converter.process_document(document, request)

            await db.commit()

            logger.info(
                f"Successfully processed document {document_id}: "
                f"{document.total_chunks} chunks, {document.total_tokens} tokens"
            )

            return {
                "success": True,
                "document_id": document_id,
                "status": "completed",
                "total_chunks": document.total_chunks,
                "total_tokens": document.total_tokens,
                "processing_duration_ms": document.processing_duration_ms,
            }

        except Exception as e:
            logger.error(f"Failed to process document {document_id}: {e}")
            await db.rollback()
            return {
                "success": False,
                "document_id": document_id,
                "error": str(e),
            }


@celery_app.task(name="health_check")
def health_check() -> dict[str, Any]:
    """Simple health check task."""
    return {
        "status": "healthy",
        "worker": "fileforge",
    }
