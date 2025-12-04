"""
Converter Service for FileForge

Orchestrates the full document conversion pipeline.
"""

import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import aiofiles
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from packages.common.core.config import settings
from packages.common.core.logging import get_logger
from packages.common.models.chunk import Chunk, ChunkType
from packages.common.models.document import Document, DocumentStatus
from packages.common.schemas.convert import ChunkStrategy, ConvertRequest
from packages.common.services.conversion.parser_service import ParserService


logger = get_logger(__name__)


class ConverterService:
    """
    Service for converting files to LLM-ready format.

    Handles:
    - File upload and storage
    - Document creation in database
    - Parsing and chunking (via ParserService)
    - Chunk storage in database
    """

    def __init__(self, db: AsyncSession):
        """Initialize converter service."""
        self.db = db
        self.parser = ParserService()

    async def create_document_from_upload(
        self,
        file: UploadFile,
        request: ConvertRequest,
    ) -> Document:
        """
        Create a document record from an uploaded file.

        Args:
            file: Uploaded file
            request: Conversion request parameters

        Returns:
            Created Document model
        """
        # Generate unique filename
        file_ext = Path(file.filename or "unknown").suffix.lower()
        unique_filename = f"{uuid.uuid4()}{file_ext}"

        # Ensure upload directory exists
        upload_dir = Path(settings.upload_dir)
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Save file
        file_path = upload_dir / unique_filename
        await self._save_upload(file, file_path)

        # Get file info
        file_size = file_path.stat().st_size
        file_hash = self.parser.compute_file_hash(file_path)
        file_type = self.parser.get_file_type(file_path)
        mime_type = self.parser.get_mime_type(file_path)

        # Create document record
        document = Document(
            filename=unique_filename,
            original_filename=file.filename or "unknown",
            file_type=file_type,
            mime_type=mime_type,
            file_size_bytes=file_size,
            file_hash=file_hash,
            status=DocumentStatus.PENDING,
            chunk_strategy=request.chunk_strategy.value,
            chunk_size=request.chunk_size,
            chunk_overlap=request.chunk_overlap,
        )

        self.db.add(document)
        await self.db.flush()
        await self.db.refresh(document)

        logger.info(f"Created document {document.id}: {document.original_filename}")
        return document

    async def _save_upload(self, file: UploadFile, path: Path) -> None:
        """Save uploaded file to disk."""
        async with aiofiles.open(path, "wb") as f:
            content = await file.read()
            await f.write(content)

    async def process_document(
        self,
        document: Document,
        request: ConvertRequest,
    ) -> Document:
        """
        Process a document: parse, chunk, and store results.

        Args:
            document: Document to process
            request: Conversion request parameters

        Returns:
            Updated Document with processing results
        """
        file_path = Path(settings.upload_dir) / document.filename

        try:
            # Mark as processing
            document.mark_processing()
            await self.db.flush()

            # Parse file
            elements, metadata = self.parser.parse_file(
                file_path,
                extract_tables=request.extract_tables,
                extract_images=request.extract_images,
                ocr_enabled=request.ocr_enabled,
                ocr_languages=request.ocr_languages,
            )

            # Get raw text
            raw_text = self.parser.get_raw_text(elements)
            document.raw_text = raw_text
            document.raw_text_length = len(raw_text)
            document.doc_metadata = metadata

            # Chunk elements
            chunks_data = self.parser.chunk_elements(
                elements,
                strategy=ChunkStrategy(request.chunk_strategy),
                chunk_size=request.chunk_size,
                chunk_overlap=request.chunk_overlap,
            )

            # Create chunk records
            total_tokens = 0
            chunk_type = (
                ChunkType.SEMANTIC
                if request.chunk_strategy == ChunkStrategy.SEMANTIC
                else ChunkType.FIXED
            )

            for chunk_data in chunks_data:
                chunk = Chunk(
                    document_id=document.id,
                    index=chunk_data["index"],
                    text=chunk_data["text"],
                    text_length=chunk_data["text_length"],
                    token_count=chunk_data["token_count"],
                    chunk_type=chunk_type,
                    element_category=chunk_data.get("element_category"),
                    source_page=chunk_data.get("source_page"),
                    source_section=chunk_data.get("source_section"),
                    chunk_metadata=chunk_data.get("metadata"),
                )
                self.db.add(chunk)
                total_tokens += chunk_data["token_count"]

            # Mark as completed
            document.mark_completed(
                total_chunks=len(chunks_data),
                total_tokens=total_tokens,
            )

            await self.db.flush()
            await self.db.refresh(document)

            logger.info(
                f"Processed document {document.id}: "
                f"{len(chunks_data)} chunks, {total_tokens} tokens"
            )

            return document

        except Exception as e:
            logger.error(f"Failed to process document {document.id}: {e}")
            document.mark_failed(str(e))
            await self.db.flush()
            raise

        finally:
            # Optionally clean up the uploaded file
            # Uncomment if you want to delete files after processing
            # if file_path.exists():
            #     file_path.unlink()
            pass

    async def convert_file_sync(
        self,
        file: UploadFile,
        request: ConvertRequest,
    ) -> Document:
        """
        Convert a file synchronously (blocking).

        For small files, this processes immediately and returns results.

        Args:
            file: Uploaded file
            request: Conversion request parameters

        Returns:
            Processed Document with chunks
        """
        # Create document
        document = await self.create_document_from_upload(file, request)

        # Process immediately
        document = await self.process_document(document, request)

        # Load chunks
        await self.db.refresh(document, ["chunks"])

        return document

    async def get_document(self, document_id: int) -> Optional[Document]:
        """Get a document by ID."""
        return await self.db.get(Document, document_id)

    async def get_document_with_chunks(self, document_id: int) -> Optional[Document]:
        """Get a document with its chunks."""
        document = await self.db.get(Document, document_id)
        if document:
            await self.db.refresh(document, ["chunks"])
        return document

    async def delete_document(self, document_id: int) -> bool:
        """Delete a document and its chunks."""
        document = await self.get_document(document_id)
        if not document:
            return False

        # Delete file if exists
        file_path = Path(settings.upload_dir) / document.filename
        if file_path.exists():
            file_path.unlink()

        await self.db.delete(document)
        await self.db.flush()

        logger.info(f"Deleted document {document_id}")
        return True
