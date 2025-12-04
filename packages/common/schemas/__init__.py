"""
Schemas module for FileForge.

Exports all Pydantic schemas.
"""

from packages.common.schemas.convert import (
    BatchConvertRequest,
    BatchConvertResponse,
    ChunkStrategy,
    ConvertRequest,
    ConvertResponse,
    ConvertStatusResponse,
    ConvertSyncResponse,
    SupportedFormatsResponse,
)
from packages.common.schemas.document import (
    ChunkResponse,
    DocumentCreate,
    DocumentListResponse,
    DocumentResponse,
    DocumentSummary,
    DocumentWithChunksResponse,
    LLMChunk,
    LLMDocumentContent,
    LLMDocumentResponse,
)


__all__ = [
    # Convert schemas
    "ChunkStrategy",
    "ConvertRequest",
    "ConvertResponse",
    "ConvertStatusResponse",
    "ConvertSyncResponse",
    "BatchConvertRequest",
    "BatchConvertResponse",
    "SupportedFormatsResponse",
    # Document schemas
    "ChunkResponse",
    "DocumentCreate",
    "DocumentResponse",
    "DocumentWithChunksResponse",
    "DocumentListResponse",
    "DocumentSummary",
    "LLMChunk",
    "LLMDocumentContent",
    "LLMDocumentResponse",
]
