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
from packages.common.services.conversion.extractors.docx_extractor import DOCXExtractor
from packages.common.services.conversion.extractors.spreadsheet_extractor import (
    XLSXExtractor,
    CSVExtractor,
)
from packages.common.services.conversion.extractors.text_extractor import (
    TextExtractor,
    MarkdownExtractor,
    HTMLExtractor,
)
from packages.common.services.conversion.extractors.image_extractor import ImageExtractor

# Try to import docling extractor (may not be available if docling is not installed)
try:
    from packages.common.services.conversion.extractors.docling_extractor import (
        DoclingPDFExtractor,
    )
except ImportError:
    DoclingPDFExtractor = None  # type: ignore

__all__ = [
    # Base classes
    "BaseExtractor",
    "ExtractedElement",
    "ElementType",
    "ExtractionResult",
    # Extractors
    "PDFExtractor",
    "DOCXExtractor",
    "XLSXExtractor",
    "CSVExtractor",
    "TextExtractor",
    "MarkdownExtractor",
    "HTMLExtractor",
    "ImageExtractor",
]

# Conditionally add docling extractor to exports
if DoclingPDFExtractor is not None:
    __all__.append("DoclingPDFExtractor")
