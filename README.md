# FileForge

Convert any file into LLM-ready JSON data with intelligent chunking support.

## Features

- **Multi-format support**: PDF, DOCX, XLSX, PPTX, HTML, Markdown, images, and more
- **Smart chunking**: Fixed-size or semantic (title-based) chunking strategies
- **Token counting**: Accurate token counts using tiktoken (GPT-4 tokenizer)
- **OCR support**: Extract text from images and scanned documents
- **Table extraction**: Structured table data with HTML representation
- **Async processing**: Queue large files for background processing
- **Privacy-focused**: Fully local processing, no external APIs

## Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- [uv](https://docs.astral.sh/uv/) package manager

### Installation

```bash
# Clone the repository
cd fileforge

# Install dependencies
make install

# Start infrastructure (PostgreSQL + Redis)
make infra-up

# Run database migrations
make migrate

# Start development servers
make dev
```

The API will be available at http://localhost:19000/docs

## Usage

### Convert a File (Sync)

```bash
curl -X POST "http://localhost:19000/api/v1/convert/sync" \
  -F "file=@document.pdf" \
  -F "chunk_strategy=semantic" \
  -F "chunk_size=1000"
```

### Convert a File (Async)

```bash
# Upload and queue for processing
curl -X POST "http://localhost:19000/api/v1/convert" \
  -F "file=@large_document.pdf"

# Response: {"document_id": 1, "status": "processing", ...}

# Check status
curl "http://localhost:19000/api/v1/convert/status/1"

# Get results
curl "http://localhost:19000/api/v1/documents/1/llm"
```

### Python Client Example

```python
import httpx

# Sync conversion
with open("document.pdf", "rb") as f:
    response = httpx.post(
        "http://localhost:19000/api/v1/convert/sync",
        files={"file": f},
        data={
            "chunk_strategy": "semantic",
            "chunk_size": 1000,
        }
    )

result = response.json()
print(f"Chunks: {len(result['content']['chunks'])}")
print(f"Total tokens: {result['statistics']['total_tokens']}")
```

## Output Format

```json
{
  "id": 1,
  "filename": "document.pdf",
  "file_type": "pdf",
  "file_size_bytes": 245678,
  "processed_at": "2025-12-04T10:30:00Z",
  "metadata": {
    "page_count": 12,
    "element_counts": {"Title": 5, "NarrativeText": 45, "Table": 3}
  },
  "content": {
    "chunks": [
      {
        "index": 0,
        "text": "Chapter 1: Introduction...",
        "token_count": 512,
        "metadata": {
          "chunk_type": "semantic",
          "element_category": "Title",
          "source_page": 1
        }
      }
    ]
  },
  "statistics": {
    "total_chunks": 25,
    "total_tokens": 12500,
    "chunk_strategy": "semantic",
    "processing_duration_ms": 1234
  }
}
```

## Supported Formats

| Category | Formats |
|----------|---------|
| Documents | PDF, DOCX, DOC, TXT, MD, HTML |
| Spreadsheets | XLSX, XLS, CSV |
| Presentations | PPTX, PPT |
| Data | JSON, XML |
| Images (OCR) | PNG, JPG, JPEG, GIF, BMP, TIFF |

## Chunking Strategies

### Semantic Chunking (Default)

Splits documents by structure (titles, sections, paragraphs). Best for maintaining context.

```bash
-F "chunk_strategy=semantic"
```

### Fixed-Size Chunking

Splits by character count with configurable overlap. Best for uniform chunk sizes.

```bash
-F "chunk_strategy=fixed" \
-F "chunk_size=1000" \
-F "chunk_overlap=100"
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/convert` | Async file conversion |
| `POST` | `/api/v1/convert/sync` | Sync file conversion |
| `GET` | `/api/v1/convert/status/{id}` | Check conversion status |
| `GET` | `/api/v1/convert/formats` | List supported formats |
| `GET` | `/api/v1/documents` | List all documents |
| `GET` | `/api/v1/documents/{id}` | Get document details |
| `GET` | `/api/v1/documents/{id}/llm` | Get LLM-ready format |
| `DELETE` | `/api/v1/documents/{id}` | Delete document |

## Development

```bash
# Start API only
make api

# Start worker only
make worker

# Run linter
make lint

# Run tests
make test

# Format code
make format
```

## Configuration

Copy `.env.example` to `.env` and customize:

```env
# Database
DATABASE_URL=postgresql+asyncpg://fileforge:fileforge@localhost:15433/fileforge

# File Processing
MAX_FILE_SIZE=104857600  # 100MB
DEFAULT_CHUNK_SIZE=1000
DEFAULT_CHUNK_OVERLAP=100

# OCR
OCR_ENABLED=true
OCR_LANGUAGES=eng
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Client App    │────▶│  Converter API  │
└─────────────────┘     │   (FastAPI)     │
                        └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
            ┌───────────┐ ┌───────────┐ ┌───────────┐
            │ PostgreSQL│ │   Redis   │ │  Celery   │
            │           │ │  (Queue)  │ │  Worker   │
            └───────────┘ └───────────┘ └───────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │  Unstructured   │
                                    │  (Parsing)      │
                                    └─────────────────┘
```

## License

MIT
