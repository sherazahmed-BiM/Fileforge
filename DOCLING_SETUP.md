# Docling Setup Guide

## Current Installation

The project uses `docling[ocr]>=2.64.0` which includes OCR support.

## OCR Requirements

Docling supports multiple OCR engines. The default depends on your Python version:

### Python < 3.14 (Default: RapidOCR)
```bash
# RapidOCR is automatically included with docling[ocr]
# But you may need to install onnxruntime separately if not included:
pip install onnxruntime
```

### Python >= 3.14 (Default: EasyOCR)
```bash
# EasyOCR is automatically included with docling[ocr]
# No additional installation needed
```

### Alternative: Tesseract OCR
If you prefer Tesseract OCR:

**macOS:**
```bash
brew install tesseract leptonica pkg-config
export TESSDATA_PREFIX=/usr/local/share/tessdata/
pip install tesserocr
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install tesseract-ocr libtesseract-dev
pip install tesserocr
```

**Windows:**
- Download Tesseract installer from: https://github.com/UB-Mannheim/tesseract/wiki
- Add to PATH
- `pip install tesserocr`

## VLM (Vision Language Models) - Optional

VLMs enhance document understanding but are **not required** for basic functionality.

To enable VLM support:
```bash
# Update pyproject.toml to use:
# "docling[ocr,vlm]>=2.64.0"

# Then install:
pip install docling[ocr,vlm]
```

## What Works Without OCR/VLM?

✅ **Works without OCR:**
- Text-based PDFs (native text, not scanned)
- PDFs with embedded text
- Basic table extraction
- Image extraction

❌ **Requires OCR:**
- Scanned PDFs (images of documents)
- PDFs with image-based text
- Handwritten documents (if OCR supports it)

✅ **Works without VLM:**
- All basic extraction features
- Text extraction
- Table extraction
- Image extraction

💡 **VLM enhances:**
- Complex layout understanding
- Better table structure recognition
- Improved reading order detection
- Enhanced document structure analysis

## Current Configuration

The `DoclingPDFExtractor` is configured with:
- `enable_ocr=False` by default (can be enabled via `ocr_enabled=True` in parse options)
- `enable_tables=True` (table extraction enabled)
- `generate_images=True` (image extraction enabled)

## Testing OCR

To test if OCR is working:
1. Set `ocr_enabled=True` when calling `parse_file()`
2. Process a scanned PDF
3. Check if text is extracted correctly

## Troubleshooting

### OCR not working?
1. Check Python version (affects default OCR engine)
2. Verify OCR dependencies are installed
3. For Tesseract: ensure system package is installed and in PATH

### Import errors?
- Ensure `docling[ocr]` is installed, not just `docling`
- Check that all dependencies are installed

### Performance issues?
- OCR can be slow on large documents
- Consider processing in batches
- VLM adds significant processing time and memory usage

