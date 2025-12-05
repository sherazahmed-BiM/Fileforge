"""
PDF Extractor for FileForge

Extracts text and images from PDFs with maximum accuracy.
Uses PyMuPDF (fitz) for extraction.
"""

import base64
import io
from pathlib import Path
from typing import Any, Optional

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    from PIL import Image
except ImportError:
    Image = None

from packages.common.services.conversion.extractors.base import (
    BaseExtractor,
    ElementType,
    ExtractedElement,
    ExtractionResult,
)
from packages.common.core.logging import get_logger


logger = get_logger(__name__)


class PDFExtractor(BaseExtractor):
    """
    PDF extractor using PyMuPDF.

    Extracts:
    - Text content (page by page)
    - Embedded images (as base64)
    - Page renders for pages with vector graphics (diagrams, charts)
    """

    SUPPORTED_EXTENSIONS = {".pdf"}

    def __init__(
        self,
        max_image_size: int = 1200,
        image_quality: int = 85,
        min_image_size: int = 50,
    ):
        """
        Initialize PDF extractor.

        Args:
            max_image_size: Maximum image dimension (will resize if larger)
            image_quality: JPEG quality for extracted images (1-100)
            min_image_size: Minimum image dimension (skip smaller images)
        """
        super().__init__()

        if fitz is None:
            raise ImportError(
                "PyMuPDF is required for PDF extraction. "
                "Install with: pip install pymupdf"
            )

        self.max_image_size = max_image_size
        self.image_quality = image_quality
        self.min_image_size = min_image_size
        self.can_extract_images = Image is not None

    def extract(
        self,
        file_path: str | Path,
        extract_images: bool = True,
        **options: Any,
    ) -> ExtractionResult:
        """
        Extract text and images from a PDF file.

        Args:
            file_path: Path to the PDF file
            extract_images: Whether to extract images

        Returns:
            ExtractionResult with extracted text and images
        """
        file_path = Path(file_path)
        logger.info(f"Extracting from PDF: {file_path.name}")

        elements: list[ExtractedElement] = []
        warnings: list[str] = []
        metadata: dict[str, Any] = {}

        should_extract_images = extract_images and self.can_extract_images

        if extract_images and not self.can_extract_images:
            warnings.append("PIL/Pillow not installed - image extraction disabled")

        try:
            doc = fitz.open(file_path)
        except Exception as e:
            logger.error(f"Failed to open PDF: {e}")
            raise

        try:
            # Extract document metadata
            metadata = self._extract_metadata(doc)
            page_count = len(doc)

            total_images = 0
            # Track seen image xrefs across all pages to avoid duplicates
            seen_xrefs: set[int] = set()

            # Process each page
            for page_num in range(page_count):
                page = doc[page_num]

                # Extract text
                page_text = self._extract_page_text(page, page_num + 1)
                if page_text:
                    elements.append(
                        ExtractedElement(
                            element_type=ElementType.TEXT,
                            content=page_text,
                            page_number=page_num + 1,
                        )
                    )

                # Extract images
                if should_extract_images:
                    page_images = self._extract_page_images(
                        doc, page, page_num + 1, seen_xrefs
                    )
                    elements.extend(page_images)
                    total_images += len(page_images)

            metadata["total_images"] = total_images

            # Check if PDF has very little text (might be scanned)
            total_text = sum(
                len(el.content) for el in elements
                if el.element_type == ElementType.TEXT
            )
            if total_text < 100 and page_count > 0:
                warnings.append(
                    "PDF has very little extractable text. "
                    "It may be a scanned document requiring OCR."
                )

        finally:
            doc.close()

        # Combine all text for raw_text
        raw_text = "\n\n".join(
            el.content for el in elements
            if el.element_type == ElementType.TEXT and el.content.strip()
        )

        word_count = len(raw_text.split()) if raw_text else 0

        return ExtractionResult(
            elements=elements,
            metadata=metadata,
            raw_text=raw_text,
            page_count=page_count,
            word_count=word_count,
            extraction_method="pymupdf",
            warnings=warnings,
        )

    def _extract_metadata(self, doc: "fitz.Document") -> dict[str, Any]:
        """Extract PDF metadata."""
        metadata: dict[str, Any] = {}

        try:
            pdf_metadata = doc.metadata
            if pdf_metadata:
                if pdf_metadata.get("title"):
                    metadata["title"] = pdf_metadata["title"]
                if pdf_metadata.get("author"):
                    metadata["author"] = pdf_metadata["author"]
                if pdf_metadata.get("subject"):
                    metadata["subject"] = pdf_metadata["subject"]
                if pdf_metadata.get("creationDate"):
                    metadata["creation_date"] = pdf_metadata["creationDate"]
        except Exception as e:
            logger.warning(f"Failed to extract PDF metadata: {e}")

        return metadata

    def _extract_page_text(self, page: "fitz.Page", page_num: int) -> str:
        """
        Extract text from a single page with maximum accuracy.

        Uses multiple extraction methods and picks the best result.
        """
        # Method 1: Standard text extraction
        text_standard = page.get_text("text")

        # Method 2: Block-based extraction for better structure
        text_blocks = self._extract_text_blocks(page)

        # Pick the one with better quality
        candidates = [
            ("standard", text_standard),
            ("blocks", text_blocks),
        ]

        best_text = ""
        best_score = 0

        for method, text in candidates:
            if not text:
                continue

            score = self._score_text_quality(text)
            if score > best_score:
                best_score = score
                best_text = text

        # Clean up the text
        return self._clean_text(best_text)

    def _extract_text_blocks(self, page: "fitz.Page") -> str:
        """Extract text using block-based method for better structure."""
        blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]

        text_parts = []

        for block in blocks:
            if block.get("type") != 0:  # Skip non-text blocks
                continue

            block_lines = []
            for line in block.get("lines", []):
                line_text = ""
                for span in line.get("spans", []):
                    line_text += span.get("text", "")
                if line_text.strip():
                    block_lines.append(line_text.strip())

            if block_lines:
                block_text = " ".join(block_lines)
                text_parts.append(block_text)

        return "\n\n".join(text_parts)

    def _score_text_quality(self, text: str) -> float:
        """Score text quality. Higher = better."""
        if not text:
            return 0

        score = 0.0
        length = len(text)

        score += min(length / 100, 10)

        words = text.split()
        word_count = len(words)
        score += min(word_count / 10, 10)

        if word_count > 0:
            avg_word_len = sum(len(w) for w in words) / word_count
            if 4 <= avg_word_len <= 8:
                score += 5

        return max(score, 0)

    def _clean_text(self, text: str) -> str:
        """Clean up extracted text."""
        if not text:
            return ""

        import re

        text = text.replace("\r\n", "\n").replace("\r", "\n")
        text = re.sub(r"\n{3,}", "\n\n", text)

        lines = [line.rstrip() for line in text.split("\n")]
        text = "\n".join(lines)

        return text.strip()

    def _extract_page_images(
        self,
        doc: "fitz.Document",
        page: "fitz.Page",
        page_num: int,
        seen_xrefs: set[int] | None = None,
    ) -> list[ExtractedElement]:
        """
        Extract images from a page.

        Args:
            doc: PDF document
            page: Page to extract from
            page_num: Page number (1-indexed)
            seen_xrefs: Set of already processed image xrefs (to avoid duplicates)

        Returns:
            List of extracted image elements
        """
        if seen_xrefs is None:
            seen_xrefs = set()

        elements = []

        # Get embedded images
        image_list = page.get_images(full=True)

        for img_index, img_info in enumerate(image_list):
            xref = img_info[0]

            # Skip if we've already processed this image
            if xref in seen_xrefs:
                continue

            # Skip soft masks and smasks (these are transparency/alpha channels, not real images)
            # img_info format: (xref, smask, width, height, bpc, colorspace, alt_colorspace, name, filter, referencer)
            smask = img_info[1] if len(img_info) > 1 else 0

            # Check if this image IS a mask by looking at its properties
            try:
                img_dict = doc.xref_object(xref, compressed=True)
                # Skip if it's a soft mask or has /ImageMask flag
                if "/SMask" in img_dict or "/Mask" in img_dict:
                    # This image has a mask, but is still a real image - process it
                    pass
                if "/ImageMask true" in img_dict:
                    # This is itself a mask, not a real image - skip it
                    continue
            except Exception:
                pass

            img_element = self._extract_embedded_image(
                doc, img_info, page_num, img_index
            )
            if img_element:
                seen_xrefs.add(xref)
                elements.append(img_element)

        return elements

    def _extract_embedded_image(
        self,
        doc: "fitz.Document",
        img_info: tuple,
        page_num: int,
        img_index: int,
    ) -> Optional[ExtractedElement]:
        """Extract a single embedded image and convert to base64."""
        try:
            xref = img_info[0]

            base_image = doc.extract_image(xref)
            if not base_image:
                return None

            image_bytes = base_image["image"]
            image_ext = base_image.get("ext", "png")

            img = Image.open(io.BytesIO(image_bytes))

            orig_width, orig_height = img.size

            # Skip very small images (likely decorative)
            if orig_width < self.min_image_size or orig_height < self.min_image_size:
                return None

            # Skip images that are likely solid colors or backgrounds
            if self._is_solid_color_image(img):
                return None

            # Resize if too large
            if orig_width > self.max_image_size or orig_height > self.max_image_size:
                ratio = min(
                    self.max_image_size / orig_width,
                    self.max_image_size / orig_height
                )
                new_size = (int(orig_width * ratio), int(orig_height * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)

            # Convert to RGB if necessary
            if img.mode in ("RGBA", "P"):
                background = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "RGBA":
                    background.paste(img, mask=img.split()[3])
                else:
                    background.paste(img)
                img = background
            elif img.mode != "RGB":
                img = img.convert("RGB")

            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=self.image_quality)
            base64_data = base64.b64encode(buffer.getvalue()).decode("utf-8")

            return ExtractedElement(
                element_type=ElementType.IMAGE,
                content=f"Image {img_index + 1} on page {page_num}",
                page_number=page_num,
                image_data=f"data:image/jpeg;base64,{base64_data}",
                metadata={
                    "original_width": orig_width,
                    "original_height": orig_height,
                    "extracted_width": img.size[0],
                    "extracted_height": img.size[1],
                    "original_format": image_ext,
                    "image_type": "embedded",
                },
            )

        except Exception as e:
            logger.warning(f"Failed to extract image {img_index} from page {page_num}: {e}")
            return None

    def _is_solid_color_image(self, img: "Image.Image") -> bool:
        """
        Check if an image is essentially a solid color (background/decorative).

        Returns True if the image has very low color variance.
        """
        try:
            # Convert to RGB for consistent analysis
            if img.mode != "RGB":
                test_img = img.convert("RGB")
            else:
                test_img = img

            # Sample pixels from the image
            width, height = test_img.size

            # For very small images, check all pixels
            if width * height <= 100:
                pixels = list(test_img.getdata())
            else:
                # Sample ~100 pixels from different locations
                pixels = []
                step_x = max(1, width // 10)
                step_y = max(1, height // 10)
                for y in range(0, height, step_y):
                    for x in range(0, width, step_x):
                        pixels.append(test_img.getpixel((x, y)))

            if not pixels:
                return False

            # Calculate color variance
            r_vals = [p[0] for p in pixels]
            g_vals = [p[1] for p in pixels]
            b_vals = [p[2] for p in pixels]

            def variance(vals: list[int]) -> float:
                if not vals:
                    return 0
                mean = sum(vals) / len(vals)
                return sum((v - mean) ** 2 for v in vals) / len(vals)

            # If variance is very low across all channels, it's likely a solid color
            total_variance = variance(r_vals) + variance(g_vals) + variance(b_vals)

            # Threshold: very low variance means solid color
            return total_variance < 100

        except Exception:
            return False

    def _render_page_as_image(
        self,
        page: "fitz.Page",
        page_num: int,
        dpi: int = 150,
    ) -> Optional[ExtractedElement]:
        """
        Render a PDF page as an image.

        Useful for pages with vector graphics (diagrams, charts).
        """
        try:
            zoom = dpi / 72
            matrix = fitz.Matrix(zoom, zoom)

            pixmap = page.get_pixmap(matrix=matrix)

            img = Image.frombytes(
                "RGB",
                [pixmap.width, pixmap.height],
                pixmap.samples
            )

            orig_width, orig_height = img.size

            # Resize if too large
            if orig_width > self.max_image_size or orig_height > self.max_image_size:
                ratio = min(
                    self.max_image_size / orig_width,
                    self.max_image_size / orig_height
                )
                new_size = (int(orig_width * ratio), int(orig_height * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)

            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=self.image_quality)
            base64_data = base64.b64encode(buffer.getvalue()).decode("utf-8")

            return ExtractedElement(
                element_type=ElementType.IMAGE,
                content=f"Page {page_num} rendered (contains graphics/diagrams)",
                page_number=page_num,
                image_data=f"data:image/jpeg;base64,{base64_data}",
                metadata={
                    "original_width": orig_width,
                    "original_height": orig_height,
                    "extracted_width": img.size[0],
                    "extracted_height": img.size[1],
                    "dpi": dpi,
                    "image_type": "page_render",
                },
            )

        except Exception as e:
            logger.warning(f"Failed to render page {page_num} as image: {e}")
            return None
