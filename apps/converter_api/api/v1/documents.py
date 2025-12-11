"""
Document Endpoints for FileForge

CRUD operations for documents and chunks.
"""


from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.converter_api.dependencies import get_db
from packages.common.auth.api_key import ApiKeyAuth
from packages.common.auth.rate_limit import check_rate_limit
from packages.common.core.logging import get_logger
from packages.common.models.api_key import ApiKey
from packages.common.models.chunk import Chunk
from packages.common.models.document import Document, DocumentStatus
from packages.common.schemas.document import (
    ChunkResponse,
    DocumentListResponse,
    DocumentResponse,
    DocumentWithChunksResponse,
    LLMDocumentResponse,
)
from packages.common.services.conversion import ConverterService


logger = get_logger(__name__)
router = APIRouter()


@router.get(
    "/",
    response_model=DocumentListResponse,
    summary="List all documents",
)
async def list_documents(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    status_filter: DocumentStatus | None = Query(default=None, description="Filter by status"),
    file_type: str | None = Query(default=None, description="Filter by file type"),
    db: AsyncSession = Depends(get_db),
    api_key: ApiKey | None = Depends(ApiKeyAuth(required=False)),
) -> DocumentListResponse:
    """List all documents with pagination and filtering."""
    # Apply rate limiting if API key is provided
    if api_key:
        await check_rate_limit(
            key=f"api_key:{api_key.id}",
            limit=api_key.rate_limit_rpm,
            window=60,
        )

    # Build query
    query = select(Document).order_by(Document.created_at.desc())

    if status_filter:
        query = query.where(Document.status == status_filter)
    if file_type:
        query = query.where(Document.file_type == file_type)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    # Execute
    result = await db.execute(query)
    documents = result.scalars().all()

    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size

    return DocumentListResponse(
        items=[DocumentResponse.model_validate(doc) for doc in documents],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/{document_id}",
    response_model=DocumentWithChunksResponse,
    summary="Get document by ID",
)
async def get_document(
    document_id: int,
    include_chunks: bool = Query(default=True, description="Include chunks in response"),
    db: AsyncSession = Depends(get_db),
) -> DocumentWithChunksResponse:
    """Get a document by ID with optional chunks."""
    query = select(Document).where(Document.id == document_id)

    if include_chunks:
        query = query.options(selectinload(Document.chunks))

    result = await db.execute(query)
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return DocumentWithChunksResponse.model_validate(document)


@router.get(
    "/{document_id}/llm",
    response_model=LLMDocumentResponse,
    summary="Get document in LLM-ready format",
)
async def get_document_llm_format(
    document_id: int,
    include_raw_text: bool = Query(default=False, description="Include full raw text"),
    db: AsyncSession = Depends(get_db),
) -> LLMDocumentResponse:
    """Get a document formatted for LLM consumption."""
    query = (
        select(Document)
        .where(Document.id == document_id)
        .options(selectinload(Document.chunks))
    )
    result = await db.execute(query)
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document.status != DocumentStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Document not ready. Status: {document.status.value}",
        )

    doc_response = DocumentResponse.model_validate(document)
    chunks_response = [ChunkResponse.model_validate(c) for c in document.chunks]

    return LLMDocumentResponse.from_document(
        document=doc_response,
        chunks=chunks_response,
        include_raw_text=include_raw_text,
        raw_text=document.raw_text if include_raw_text else None,
    )


@router.get(
    "/{document_id}/chunks",
    response_model=list[ChunkResponse],
    summary="Get document chunks",
)
async def get_document_chunks(
    document_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[ChunkResponse]:
    """Get chunks for a document with pagination."""
    # Verify document exists
    document = await db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Query chunks
    offset = (page - 1) * page_size
    query = (
        select(Chunk)
        .where(Chunk.document_id == document_id)
        .order_by(Chunk.index)
        .offset(offset)
        .limit(page_size)
    )

    result = await db.execute(query)
    chunks = result.scalars().all()

    return [ChunkResponse.model_validate(c) for c in chunks]


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a document",
)
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a document and all its chunks."""
    converter = ConverterService(db)
    deleted = await converter.delete_document(document_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")

    logger.info(f"Deleted document {document_id}")


@router.post(
    "/{document_id}/reprocess",
    response_model=DocumentResponse,
    summary="Reprocess a document",
)
async def reprocess_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    """Reset a failed document and queue for reprocessing."""
    from apps.worker.tasks.convert_task import convert_document

    document = await db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document.status not in [DocumentStatus.FAILED, DocumentStatus.COMPLETED]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reprocess document with status: {document.status.value}",
        )

    # Reset status
    document.status = DocumentStatus.PENDING
    document.error_message = None
    await db.flush()

    # Queue task
    convert_document.delay(
        document_id=document.id,
        chunk_strategy=document.chunk_strategy or "semantic",
        chunk_size=document.chunk_size or 1000,
        chunk_overlap=document.chunk_overlap or 100,
    )

    await db.commit()

    return DocumentResponse.model_validate(document)
