# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FileForge** - A privacy-focused REST API that converts any file into LLM-ready JSON data with intelligent chunking support.

**Tech Stack**:
- **Backend**: Python 3.11+ monorepo with FastAPI, Celery workers, SQLAlchemy (async), PostgreSQL, Redis
- **Document Parsing**: Docling (primary, with OCR+VLM support) with PyMuPDF fallback, tiktoken for token counting
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Motion, React Query

## Quick Start

```bash
make install           # Install all dependencies (Python + Frontend)
make infra-up          # Start PostgreSQL + Redis in Docker
make migrate           # Run database migrations
make dev               # Start all services with Honcho (API + Worker + Frontend)
```

Services: API at http://localhost:19000, Frontend at http://localhost:3000

## Commands

### Development
```bash
make dev               # Start all services (API + Worker + Frontend) with Honcho
make api               # Converter API only (port 19000)
make worker            # Celery worker only
make infra-up          # PostgreSQL (15433) + Redis (16380)
make infra-down        # Stop infrastructure
```

### Frontend
```bash
cd apps/frontend && npm run dev    # Start frontend only (port 3000)
cd apps/frontend && npm run build  # Build frontend
cd apps/frontend && npx shadcn@latest add [component]  # Add shadcn component
```

### Database
```bash
make migrate           # Run migrations
make migrate-create    # Create new migration (prompts for message)
make migrate-down      # Roll back last migration
make db-reset          # Reset database (WARNING: deletes all data)
make db-shell          # Open PostgreSQL shell
```

### Code Quality & Testing
```bash
make lint              # Run Ruff linter
make lint-fix          # Auto-fix linting issues
make format            # Format code with Ruff
make typecheck         # Run mypy type checker
make check             # Run both lint and typecheck
make test              # Run all tests
make test-cov          # Run with coverage report

# Single test file or function
uv run pytest tests/unit/test_file.py -v
uv run pytest tests/unit/test_file.py::test_function_name -v

# Test by category
make test-unit         # Unit tests only
make test-integration  # Integration tests only
```

## Architecture

### Monorepo Structure

- **apps/converter_api/**: FastAPI app with versioned endpoints in `api/v1/`
- **apps/worker/**: Celery worker with async tasks in `tasks/`
- **apps/frontend/**: Next.js app with App Router, components in `src/components/`
- **packages/common/**: Shared code - models, schemas, services, core utilities
- **infra/alembic/**: Database migrations
- **tests/**: Unit and integration tests

### Key Services

**DocumentProcessor** (`packages/common/services/conversion/processor.py`):
- Main entry point for document extraction
- Uses Docling as primary extractor with PyMuPDF fallback
- Returns `ProcessingResult` with extracted text organized by pages

**Extractor System** (`packages/common/services/conversion/extractors/`):
- `BaseExtractor`: Abstract base class defining the extraction interface
- `DoclingExtractor`: Primary extractor using Docling (PDF, DOCX, XLSX, HTML, images with OCR)
- Specialized extractors: `PDFExtractor`, `SpreadsheetExtractor`, `TextExtractor`, `ImageExtractor`
- All extractors return `ExtractionResult` with `ExtractedElement` list

**ParserService** (`packages/common/services/conversion/parser_service.py`):
- Chunking strategies: semantic (by structure) and fixed (by character count)
- Token counting with tiktoken

**ConverterService** (`packages/common/services/conversion/converter_service.py`):
- Orchestrates file upload, storage, parsing, and chunk persistence
- Creates Document/Chunk records in database

### Database Models

**Document**: `status` (pending/processing/completed/failed), `chunk_strategy`, `metadata` (JSONB), `raw_text`, timestamps
**Chunk**: `document_id` (FK), `index`, `text`, `token_count`, `element_category`, `source_page`, `metadata` (JSONB)

### Celery Tasks

**convert_document** (`apps/worker/tasks/convert_task.py`): Async document processing with auto-retry and exponential backoff

## Key Patterns

### Database Session Management

```python
# FastAPI dependency
from apps.converter_api.dependencies import get_db
async def endpoint(db: AsyncSession = Depends(get_db)):
    ...

# Celery tasks (context manager)
from packages.common.core.database import get_db_context
async with get_db_context() as db:
    ...
```

### Service Usage

```python
from packages.common.services.conversion import ConverterService, ParserService

# In API endpoint
converter = ConverterService(db)
document = await converter.convert_file_sync(file, request)

# Direct parsing
parser = ParserService()
elements, metadata = parser.parse_file(file_path)
chunks = parser.chunk_elements(elements, strategy, chunk_size, overlap)
```

### Frontend State Management

```typescript
// React Query hooks (hooks/use-documents.ts)
const { data, isLoading } = useDocuments();
const uploadMutation = useUploadFile();
```

## Code Style

- **UV**: Package management with `dependency-groups` in pyproject.toml
- **Ruff**: Default settings, Python 3.11+
- **Imports**: Absolute from package root
- **Async**: Use async/await for database operations
- **Type hints**: Required for all functions

## API Documentation

- Swagger UI: http://localhost:19000/docs
- OpenAPI JSON: http://localhost:19000/openapi.json
