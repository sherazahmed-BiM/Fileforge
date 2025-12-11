"""
LibreOffice Converter for FileForge

Provides high-quality conversion of legacy document formats to modern formats
using LibreOffice in headless mode. This enables processing of formats like
DOC, XLS, PPT, RTF, ODT, etc. by converting them to DOCX/XLSX/PPTX first.

Supported conversions:
- Word Processing → DOCX: doc, dot, dotm, rtf, odt, abw, zabw, hwp, sxw, wpd
- Spreadsheets → XLSX: xls, et, fods, ods, sxc, wk1, wks
- Presentations → PPTX: ppt, pot, pptm, odp, sxi
- Other → PDF: Various formats as fallback
"""

import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from packages.common.core.logging import get_logger


logger = get_logger(__name__)


# Format mappings: source extension -> (target format, target extension)
WORD_FORMATS = {
    ".doc": ("docx", ".docx"),
    ".dot": ("docx", ".docx"),
    ".dotm": ("docx", ".docx"),
    ".dotx": ("docx", ".docx"),
    ".rtf": ("docx", ".docx"),
    ".odt": ("docx", ".docx"),
    ".ott": ("docx", ".docx"),
    ".abw": ("docx", ".docx"),
    ".zabw": ("docx", ".docx"),
    ".hwp": ("docx", ".docx"),  # Korean Hangul - requires plugin
    ".sxw": ("docx", ".docx"),  # StarOffice/OpenOffice Writer
    ".sxg": ("docx", ".docx"),  # StarOffice Master Document
    ".wpd": ("docx", ".docx"),  # WordPerfect
    ".wps": ("docx", ".docx"),  # Microsoft Works
    ".cwk": ("docx", ".docx"),  # ClarisWorks/AppleWorks (limited support)
    ".mcw": ("docx", ".docx"),  # MacWrite (limited support)
}

SPREADSHEET_FORMATS = {
    ".xls": ("xlsx", ".xlsx"),
    ".xlm": ("xlsx", ".xlsx"),
    ".xlt": ("xlsx", ".xlsx"),
    ".et": ("xlsx", ".xlsx"),   # WPS Spreadsheet
    ".fods": ("xlsx", ".xlsx"), # Flat ODS
    ".ods": ("xlsx", ".xlsx"),  # OpenDocument Spreadsheet
    ".ots": ("xlsx", ".xlsx"),  # ODS Template
    ".sxc": ("xlsx", ".xlsx"),  # StarOffice Calc
    ".wk1": ("xlsx", ".xlsx"),  # Lotus 1-2-3
    ".wks": ("xlsx", ".xlsx"),  # Lotus 1-2-3
    ".dif": ("xlsx", ".xlsx"),  # Data Interchange Format
    ".dbf": ("xlsx", ".xlsx"),  # dBase (can also use dbfread directly)
    ".mw": ("xlsx", ".xlsx"),   # Maple worksheet (if supported)
}

PRESENTATION_FORMATS = {
    ".ppt": ("pptx", ".pptx"),
    ".pot": ("pptx", ".pptx"),
    ".pptm": ("pptx", ".pptx"),
    ".pps": ("pptx", ".pptx"),
    ".ppsx": ("pptx", ".pptx"),
    ".odp": ("pptx", ".pptx"),  # OpenDocument Presentation
    ".otp": ("pptx", ".pptx"),  # ODP Template
    ".sxi": ("pptx", ".pptx"),  # StarOffice Impress
}

# All supported formats combined
ALL_CONVERTIBLE_FORMATS = {
    **WORD_FORMATS,
    **SPREADSHEET_FORMATS,
    **PRESENTATION_FORMATS,
}


def get_libreoffice_path() -> str | None:
    """
    Find the LibreOffice executable path.

    Returns:
        Path to soffice executable, or None if not found
    """
    # Common paths to check
    candidates = [
        # Linux
        "/usr/bin/soffice",
        "/usr/bin/libreoffice",
        "/usr/lib/libreoffice/program/soffice",
        "/opt/libreoffice/program/soffice",
        "/snap/bin/libreoffice",
        # macOS
        "/Applications/LibreOffice.app/Contents/MacOS/soffice",
        # Check PATH
        shutil.which("soffice"),
        shutil.which("libreoffice"),
    ]

    for path in candidates:
        if path and os.path.isfile(path):
            return path

    return None


def is_libreoffice_available() -> bool:
    """Check if LibreOffice is available on the system."""
    return get_libreoffice_path() is not None


def get_target_format(source_path: Path) -> tuple[str, str] | None:
    """
    Get the target format for a source file.

    Args:
        source_path: Path to the source file

    Returns:
        Tuple of (format_name, extension) or None if not supported
    """
    ext = source_path.suffix.lower()
    return ALL_CONVERTIBLE_FORMATS.get(ext)


def is_convertible(file_path: str | Path) -> bool:
    """
    Check if a file can be converted by LibreOffice.

    Args:
        file_path: Path to the file

    Returns:
        True if the file format is supported for conversion
    """
    ext = Path(file_path).suffix.lower()
    return ext in ALL_CONVERTIBLE_FORMATS


def convert_to_modern_format(
    source_path: str | Path,
    output_dir: str | Path | None = None,
    timeout: int = 120,
) -> Path:
    """
    Convert a legacy document to a modern format using LibreOffice.

    Args:
        source_path: Path to the source file
        output_dir: Directory for output (default: same as source)
        timeout: Conversion timeout in seconds

    Returns:
        Path to the converted file

    Raises:
        RuntimeError: If LibreOffice is not available or conversion fails
        ValueError: If the format is not supported
    """
    source_path = Path(source_path)

    if not source_path.exists():
        raise FileNotFoundError(f"Source file not found: {source_path}")

    # Get target format
    target_info = get_target_format(source_path)
    if not target_info:
        raise ValueError(
            f"Unsupported format for conversion: {source_path.suffix}. "
            f"Supported formats: {', '.join(sorted(ALL_CONVERTIBLE_FORMATS.keys()))}"
        )

    target_format, target_ext = target_info

    # Find LibreOffice
    soffice_path = get_libreoffice_path()
    if not soffice_path:
        raise RuntimeError(
            "LibreOffice is not installed or not found. "
            "Please install LibreOffice to convert legacy document formats."
        )

    # Determine output directory
    if output_dir is None:
        output_dir = tempfile.mkdtemp(prefix="fileforge_convert_")
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Build command
    # --headless: No GUI
    # --convert-to: Target format
    # --outdir: Output directory
    cmd = [
        soffice_path,
        "--headless",
        "--invisible",
        "--nologo",
        "--nofirststartwizard",
        "--convert-to", target_format,
        "--outdir", str(output_dir),
        str(source_path),
    ]

    logger.info(
        f"Converting {source_path.name} ({source_path.suffix}) "
        f"to {target_format} using LibreOffice"
    )

    try:
        # Run conversion
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            env={**os.environ, "HOME": tempfile.gettempdir()},  # Avoid profile issues
        )

        if result.returncode != 0:
            error_msg = result.stderr or result.stdout or "Unknown error"
            logger.error(f"LibreOffice conversion failed: {error_msg}")
            raise RuntimeError(f"LibreOffice conversion failed: {error_msg}")

        # Find the output file
        expected_output = output_dir / f"{source_path.stem}{target_ext}"

        if expected_output.exists():
            logger.info(f"Successfully converted to: {expected_output}")
            return expected_output

        # Sometimes LibreOffice creates files with slightly different names
        # Search for any file with the target extension
        converted_files = list(output_dir.glob(f"*{target_ext}"))
        if converted_files:
            output_file = converted_files[0]
            logger.info(f"Found converted file: {output_file}")
            return output_file

        # Check for any new files in the output directory
        all_files = list(output_dir.iterdir())
        if all_files:
            logger.warning(
                f"Expected output not found. Available files: {[f.name for f in all_files]}"
            )
            # Return the first file that's not the source
            for f in all_files:
                if f.name != source_path.name:
                    return f

        raise RuntimeError(
            f"Conversion completed but output file not found. "
            f"Expected: {expected_output}"
        )

    except subprocess.TimeoutExpired:
        raise RuntimeError(
            f"LibreOffice conversion timed out after {timeout} seconds"
        )
    except Exception as e:
        if isinstance(e, RuntimeError):
            raise
        logger.error(f"LibreOffice conversion error: {e}")
        raise RuntimeError(f"LibreOffice conversion failed: {e}")


class LibreOfficeConverter:
    """
    Context manager for LibreOffice document conversion.

    Handles temporary file cleanup automatically.

    Usage:
        with LibreOfficeConverter(source_path) as converted_path:
            # Process the converted file
            result = docling_extractor.extract(converted_path)
    """

    def __init__(
        self,
        source_path: str | Path,
        keep_converted: bool = False,
        timeout: int = 120,
    ):
        """
        Initialize the converter.

        Args:
            source_path: Path to the source file to convert
            keep_converted: If True, don't delete the converted file on exit
            timeout: Conversion timeout in seconds
        """
        self.source_path = Path(source_path)
        self.keep_converted = keep_converted
        self.timeout = timeout
        self.temp_dir: Path | None = None
        self.converted_path: Path | None = None

    def __enter__(self) -> Path:
        """Convert the file and return the path to the converted file."""
        # Create temp directory
        self.temp_dir = Path(tempfile.mkdtemp(prefix="fileforge_lo_"))

        # Convert
        self.converted_path = convert_to_modern_format(
            self.source_path,
            output_dir=self.temp_dir,
            timeout=self.timeout,
        )

        return self.converted_path

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Clean up temporary files."""
        if not self.keep_converted and self.temp_dir and self.temp_dir.exists():
            try:
                shutil.rmtree(self.temp_dir)
            except Exception as e:
                logger.warning(f"Failed to clean up temp directory: {e}")

        return False  # Don't suppress exceptions


def get_supported_extensions() -> set[str]:
    """Get all file extensions supported for LibreOffice conversion."""
    return set(ALL_CONVERTIBLE_FORMATS.keys())


def get_word_extensions() -> set[str]:
    """Get file extensions for word processing documents."""
    return set(WORD_FORMATS.keys())


def get_spreadsheet_extensions() -> set[str]:
    """Get file extensions for spreadsheet documents."""
    return set(SPREADSHEET_FORMATS.keys())


def get_presentation_extensions() -> set[str]:
    """Get file extensions for presentation documents."""
    return set(PRESENTATION_FORMATS.keys())
