"""
Document Extractors for FileForge

Modular extraction system for converting files to LLM-ready format.

Extractors:
- UniversalExtractor: Handles all formats (recommended for most use cases)
- DoclingExtractor: Modern formats (PDF, DOCX, XLSX, PPTX, HTML, MD, CSV, images)
- PDFExtractor: PDF-only fallback using PyMuPDF

The UniversalExtractor automatically routes to the best extraction method:
- Modern formats → Docling
- Legacy Office formats → LibreOffice conversion → Docling
- Email formats → Built-in parsers
- Ebook formats → EbookLib
- Data formats → Specialized parsers
"""

from packages.common.services.conversion.extractors.base import (
    BaseExtractor,
    ExtractedElement,
    ElementType,
    ExtractionResult,
    StructuredTableData,
    TableSchema,
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

# Try to import universal extractor
try:
    from packages.common.services.conversion.extractors.universal_extractor import (
        UniversalExtractor,
    )
except ImportError:
    UniversalExtractor = None  # type: ignore

__all__ = [
    # Base classes
    "BaseExtractor",
    "ExtractedElement",
    "ElementType",
    "ExtractionResult",
    "StructuredTableData",
    "TableSchema",
    # Extractors
    "PDFExtractor",
]

# Conditionally add docling extractors to exports
if DoclingExtractor is not None:
    __all__.extend(["DoclingExtractor", "DoclingPDFExtractor"])

# Conditionally add universal extractor to exports
if UniversalExtractor is not None:
    __all__.append("UniversalExtractor")
