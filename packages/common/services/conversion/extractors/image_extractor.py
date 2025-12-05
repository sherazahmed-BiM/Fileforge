"""
Image Extractor for FileForge

Extracts text from images using Tesseract OCR.
This is a local-only solution with no external API dependencies.
"""

from pathlib import Path
from typing import Any, Optional

try:
    from PIL import Image
except ImportError:
    Image = None

try:
    import pytesseract
except ImportError:
    pytesseract = None

from packages.common.services.conversion.extractors.base import (
    BaseExtractor,
    ElementType,
    ExtractedElement,
    ExtractionResult,
)
from packages.common.core.logging import get_logger


logger = get_logger(__name__)


class ImageExtractor(BaseExtractor):
    """
    Extractor for image files using Tesseract OCR.

    Features:
    - OCR text extraction
    - Multiple language support
    - Confidence scoring
    - Image preprocessing (optional)

    Requirements:
    - Tesseract OCR installed on system
    - pytesseract Python package
    - Pillow for image handling
    """

    SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff", ".tif", ".webp"}

    def __init__(
        self,
        tesseract_cmd: Optional[str] = None,
        default_lang: str = "eng",
    ):
        """
        Initialize image extractor.

        Args:
            tesseract_cmd: Path to tesseract executable (auto-detected if None)
            default_lang: Default OCR language
        """
        super().__init__()

        if Image is None:
            raise ImportError(
                "Pillow is required for image extraction. "
                "Install with: pip install Pillow"
            )

        if pytesseract is None:
            raise ImportError(
                "pytesseract is required for OCR. "
                "Install with: pip install pytesseract"
            )

        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

        self.default_lang = default_lang

        # Verify Tesseract is installed
        try:
            pytesseract.get_tesseract_version()
        except Exception as e:
            raise RuntimeError(
                f"Tesseract OCR not found. Please install Tesseract: {e}"
            )

    def extract(
        self,
        file_path: str | Path,
        lang: Optional[str] = None,
        preprocess: bool = True,
        **options: Any,
    ) -> ExtractionResult:
        """
        Extract text from an image using OCR.

        Args:
            file_path: Path to the image file
            lang: OCR language(s), e.g., "eng", "eng+fra"
            preprocess: Whether to preprocess image for better OCR

        Returns:
            ExtractionResult with extracted text
        """
        file_path = Path(file_path)
        logger.info(f"Extracting image (OCR): {file_path.name}")

        lang = lang or self.default_lang
        elements: list[ExtractedElement] = []
        warnings: list[str] = []
        metadata: dict[str, Any] = {}

        try:
            image = Image.open(file_path)
        except Exception as e:
            logger.error(f"Failed to open image: {e}")
            raise

        try:
            # Get image metadata
            metadata = self._extract_metadata(image, file_path)

            # Preprocess if requested
            if preprocess:
                image = self._preprocess_image(image)

            # Perform OCR with detailed output
            ocr_result = self._perform_ocr(image, lang)

            if ocr_result["text"].strip():
                # Parse OCR output into elements
                elements = self._parse_ocr_output(
                    ocr_result["text"],
                    ocr_result.get("confidence", 1.0),
                )
            else:
                warnings.append("No text detected in image. Image may be blank or non-textual.")

            # Add confidence to metadata
            if "confidence" in ocr_result:
                metadata["ocr_confidence"] = ocr_result["confidence"]
            metadata["ocr_language"] = lang

        finally:
            image.close()

        raw_text = "\n\n".join(el.content for el in elements)
        word_count = self._count_words(raw_text)

        return ExtractionResult(
            elements=elements,
            metadata=metadata,
            raw_text=raw_text,
            page_count=1,
            word_count=word_count,
            extraction_method="tesseract",
            warnings=warnings,
        )

    def _extract_metadata(self, image: "Image.Image", file_path: Path) -> dict[str, Any]:
        """Extract image metadata."""
        metadata: dict[str, Any] = {
            "width": image.width,
            "height": image.height,
            "format": image.format,
            "mode": image.mode,
        }

        # EXIF data if available
        try:
            exif = image._getexif()
            if exif:
                metadata["has_exif"] = True
        except Exception:
            pass

        return metadata

    def _preprocess_image(self, image: "Image.Image") -> "Image.Image":
        """
        Preprocess image for better OCR results.

        - Convert to grayscale
        - Increase contrast if needed
        - Resize if too small
        """
        # Convert to grayscale
        if image.mode != "L":
            image = image.convert("L")

        # Resize if image is very small
        min_dim = min(image.width, image.height)
        if min_dim < 300:
            scale = 300 / min_dim
            new_size = (int(image.width * scale), int(image.height * scale))
            image = image.resize(new_size, Image.Resampling.LANCZOS)

        return image

    def _perform_ocr(
        self,
        image: "Image.Image",
        lang: str,
    ) -> dict[str, Any]:
        """Perform OCR on image."""
        result: dict[str, Any] = {}

        try:
            # Get text with confidence data
            data = pytesseract.image_to_data(
                image,
                lang=lang,
                output_type=pytesseract.Output.DICT,
            )

            # Extract text
            texts = []
            confidences = []

            for i, text in enumerate(data["text"]):
                conf = data["conf"][i]
                if text.strip() and conf > 0:
                    texts.append(text)
                    confidences.append(conf)

            result["text"] = " ".join(texts)

            # Calculate average confidence
            if confidences:
                result["confidence"] = sum(confidences) / len(confidences) / 100.0
            else:
                result["confidence"] = 0.0

        except Exception as e:
            logger.warning(f"Detailed OCR failed, falling back to simple: {e}")
            # Fallback to simple OCR
            result["text"] = pytesseract.image_to_string(image, lang=lang)
            result["confidence"] = 1.0  # Unknown confidence

        return result

    def _parse_ocr_output(
        self,
        text: str,
        confidence: float,
    ) -> list[ExtractedElement]:
        """Parse OCR output into structured elements."""
        elements: list[ExtractedElement] = []

        # Split into paragraphs
        paragraphs = text.split("\n\n")

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # Simple heuristics for element type
            lines = para.split("\n")

            if len(lines) == 1 and len(para) < 100 and para.isupper():
                # Likely a heading
                element_type = ElementType.HEADING
            elif len(lines) == 1 and len(para) < 50:
                # Might be a title or short heading
                element_type = ElementType.HEADING
            else:
                element_type = ElementType.PARAGRAPH

            elements.append(
                ExtractedElement(
                    element_type=element_type,
                    content=para,
                    confidence=confidence,
                )
            )

        return elements

    @staticmethod
    def is_tesseract_available() -> bool:
        """Check if Tesseract is available on the system."""
        if pytesseract is None:
            return False
        try:
            pytesseract.get_tesseract_version()
            return True
        except Exception:
            return False
