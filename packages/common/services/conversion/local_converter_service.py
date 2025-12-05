"""
Local Converter Service for FileForge

Handles PDF text extraction using local processing only.
"""

import uuid
from pathlib import Path
from typing import Any

import aiofiles
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from packages.common.core.config import settings
from packages.common.core.logging import get_logger
from packages.common.services.conversion.processor import DocumentProcessor


logger = get_logger(__name__)


class LocalConverterService:
    """
    Service for extracting text from PDF files.

    Uses local processing only - no external API calls.
    """

    def __init__(self, db: AsyncSession):
        """Initialize local converter service."""
        self.db = db
        self.processor = DocumentProcessor()

    async def extract_text(self, file: UploadFile) -> dict[str, Any]:
        """
        Extract text from a PDF file.

        Args:
            file: Uploaded PDF file

        Returns:
            Dictionary with extracted text organized by page
        """
        # Validate file
        if not file.filename:
            raise ValueError("Filename is required")

        file_ext = Path(file.filename).suffix.lower()
        if file_ext != ".pdf":
            raise ValueError(f"Only PDF files are supported. Got: {file_ext}")

        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}.pdf"

        # Ensure upload directory exists
        upload_dir = Path(settings.upload_dir)
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Save file
        file_path = upload_dir / unique_filename
        await self._save_upload(file, file_path)

        try:
            # Process file
            result = self.processor.process(file_path)

            # Return as dictionary
            return result.to_dict()

        finally:
            # Clean up temp file
            if file_path.exists():
                file_path.unlink()

    async def _save_upload(self, file: UploadFile, path: Path) -> None:
        """Save uploaded file to disk."""
        async with aiofiles.open(path, "wb") as f:
            content = await file.read()
            await f.write(content)
