"""
Document Extractors for FileForge

Modular extraction system for converting files to LLM-ready format.
"""

from packages.common.services.conversion.extractors.base import (
    BaseExtractor,
    ExtractedElement,
    ElementType,
    ExtractionResult,
)
from packages.common.services.conversion.extractors.pdf_extractor import PDFExtractor

# Try to import docling extractor (may not be available if docling is not installed)
try:
    from packages.common.services.conversion.extractors.docling_extractor import (
        DoclingExtractor,
        DoclingPDFExtractor,  # Backward compatibility alias
    )
except ImportError:
    DoclingExtractor = None  # type: ignore
    DoclingPDFExtractor = None  # type: ignore

__all__ = [
    # Base classes
    "BaseExtractor",
    "ExtractedElement",
    "ElementType",
    "ExtractionResult",
    # Extractors
    "PDFExtractor",
]

# Conditionally add docling extractors to exports
if DoclingExtractor is not None:
    __all__.extend(["DoclingExtractor", "DoclingPDFExtractor"])
