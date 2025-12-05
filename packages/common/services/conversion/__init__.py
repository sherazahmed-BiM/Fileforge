"""
Conversion services for FileForge.

Provides PDF text extraction using PyMuPDF.
"""

# Legacy services (still needed for worker)
from packages.common.services.conversion.converter_service import ConverterService
from packages.common.services.conversion.parser_service import ParserService

# Local converter service (new, simplified)
from packages.common.services.conversion.local_converter_service import LocalConverterService

# Processor
from packages.common.services.conversion.processor import (
    DocumentProcessor,
    ProcessingResult,
)

# Extractors
from packages.common.services.conversion.extractors.base import (
    BaseExtractor,
    ExtractedElement,
    ElementType,
    ExtractionResult,
)
from packages.common.services.conversion.extractors.pdf_extractor import PDFExtractor


__all__ = [
    # Legacy
    "ConverterService",
    "ParserService",
    # New
    "LocalConverterService",
    "DocumentProcessor",
    "ProcessingResult",
    "BaseExtractor",
    "ExtractedElement",
    "ElementType",
    "ExtractionResult",
    "PDFExtractor",
]
