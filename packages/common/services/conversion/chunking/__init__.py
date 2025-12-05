"""
Chunking module for FileForge

Provides intelligent text chunking for LLM-ready output.
"""

from packages.common.services.conversion.chunking.chunker import (
    Chunker,
    ChunkingStrategy,
    ProcessedChunk,
)

__all__ = [
    "Chunker",
    "ChunkingStrategy",
    "ProcessedChunk",
]
