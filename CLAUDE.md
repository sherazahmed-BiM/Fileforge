# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FileForge** - A privacy-focused REST API that converts any file into LLM-ready JSON data with intelligent chunking support.

**Tech Stack**:
- **Backend**: Python monorepo with FastAPI, Celery workers, SQLAlchemy (async), PostgreSQL, Redis, and Unstructured.io for document parsing
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Motion (Framer Motion), React Query

## Quick Start

```bash
make install           # Install all dependencies (Python + Frontend)
make infra-up          # Start PostgreSQL + Redis in Docker
make migrate           # Run database migrations
make dev               # Start all services with Honcho (API + Worker + Frontend)
```

Services run on:
- Backend API: http://localhost:19000
- Frontend: http://localhost:3000

## Commands

### Development
```bash
make dev               # Start all services (API + Worker + Frontend) with Honcho
make api               # Start Converter API only
make worker            # Start Celery worker only
make worker-beat       # Start Celery beat scheduler
make infra-up          # Start PostgreSQL (15433) + Redis (16380)
make infra-down        # Stop infrastructure services
make down              # Stop all Docker services
make logs              # View Docker logs (postgres, redis)
```

### Database
```bash
make migrate           # Run migrations
make migrate-create    # Create new migration (prompts for message)
make migrate-down      # Roll back last migration
make db-reset          # Reset database (WARNING: deletes all data)
make db-shell          # Open PostgreSQL shell
```

### Code Quality
```bash
make lint              # Run Ruff linter
make lint-fix          # Auto-fix linting issues
make format            # Format code with Ruff
make typecheck         # Run mypy type checker
make check             # Run both lint and typecheck
```

### Testing
```bash
make test              # Run all tests
make test-cov          # Run with coverage report
make test-unit         # Run unit tests only
make test-integration  # Run integration tests only

# Run a single test file or test function
uv run pytest tests/unit/test_file.py -v
uv run pytest tests/unit/test_file.py::test_function_name -v
```

### Cleanup
```bash
make clean             # Remove Python cache files
make clean-all         # Remove all generated files and volumes
```

## Architecture

### Single API Design (Converter API)

| API | Port | Purpose |
|-----|------|---------|
| **Converter API** | 19000 | File conversion and document management |
| **Admin API** | 19001 | (Future) Admin operations |

### Directory Structure

```
fileforge/
├── apps/
│   ├── converter_api/         # Main conversion API
│   │   ├── api/v1/            # Versioned endpoints
│   │   ├── dependencies.py    # FastAPI dependencies
│   │   └── main.py            # FastAPI app
│   ├── admin_api/             # Admin API (future)
│   ├── worker/                # Celery worker
│   │   └── tasks/             # Async tasks
│   └── frontend/              # Next.js frontend application
│       ├── src/
│       │   ├── app/           # App Router pages
│       │   ├── components/    # React components
│       │   │   ├── ui/        # shadcn/ui components
│       │   │   ├── layout/    # Sidebar, Header
│       │   │   ├── upload/    # Dropzone, UploadOptions
│       │   │   └── documents/ # DocumentCard, ChunkViewer
│       │   ├── hooks/         # React Query hooks
│       │   ├── lib/           # API client, utilities
│       │   ├── types/         # TypeScript types
│       │   └── config/        # API configuration
│       └── package.json
│
├── packages/common/
│   ├── core/                  # Config, database, Celery, logging
│   ├── config/                # Application defaults
│   ├── models/                # SQLAlchemy models (Document, Chunk)
│   ├── schemas/               # Pydantic schemas
│   ├── services/              # Business logic
│   │   └── conversion/        # Parser and converter services
│   ├── parsers/               # (Legacy) File parsers
│   └── utils/                 # Utilities
│
├── infra/
│   ├── alembic/               # Database migrations
│   └── scripts/               # Docker entrypoints
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── pyproject.toml             # UV dependencies
├── docker-compose.yml         # Local infrastructure
├── Procfile.dev               # Honcho process definitions
├── Makefile                   # Dev commands
└── CLAUDE.md                  # This file
```

### Database Models

**Document** - Represents a converted file:
- `filename`, `original_filename`, `file_type`, `mime_type`
- `file_size_bytes`, `file_hash`
- `status` (pending, processing, completed, failed)
- `metadata` (JSONB - extracted document properties)
- `raw_text`, `raw_text_length`
- `chunk_strategy`, `chunk_size`, `chunk_overlap`
- `total_chunks`, `total_tokens`
- Timestamps for processing tracking

**Chunk** - Text segments from documents:
- `document_id` (FK)
- `index`, `text`, `text_length`, `token_count`
- `chunk_type` (fixed, semantic)
- `element_category` (Title, NarrativeText, Table, etc.)
- `source_page`, `source_section`
- `metadata` (JSONB - coordinates, HTML for tables)

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/convert` | Upload and queue file for async conversion |
| `POST` | `/api/v1/convert/sync` | Upload and convert synchronously (blocking) |
| `GET` | `/api/v1/convert/status/{id}` | Check conversion status |
| `GET` | `/api/v1/convert/formats` | List supported file formats |
| `GET` | `/api/v1/documents` | List all documents |
| `GET` | `/api/v1/documents/{id}` | Get document with chunks |
| `GET` | `/api/v1/documents/{id}/llm` | Get LLM-ready format |
| `GET` | `/api/v1/documents/{id}/chunks` | Get chunks only |
| `DELETE` | `/api/v1/documents/{id}` | Delete document |
| `POST` | `/api/v1/documents/{id}/reprocess` | Reprocess failed document |

### Key Services

**ParserService** (`packages/common/services/conversion/parser_service.py`):
- Uses Unstructured.io for document parsing
- Supports PDF, DOCX, XLSX, HTML, images, etc.
- Handles chunking (fixed-size and semantic)
- Token counting with tiktoken

**ConverterService** (`packages/common/services/conversion/converter_service.py`):
- Orchestrates file upload and storage
- Creates document records
- Processes files through ParserService
- Stores chunks in database

### Celery Tasks

**convert_document** (`apps/worker/tasks/convert_task.py`):
- Async document processing
- Auto-retry with exponential backoff
- Updates document status in database

## Supported File Formats

| Category | Formats |
|----------|---------|
| Documents | PDF, DOCX, DOC, TXT, MD, HTML |
| Spreadsheets | XLSX, XLS, CSV |
| Presentations | PPTX, PPT |
| Data | JSON, XML |
| Images (OCR) | PNG, JPG, JPEG, GIF, BMP, TIFF |

## Chunking Strategies

| Strategy | Description |
|----------|-------------|
| `semantic` | Split by document structure (titles, sections) |
| `fixed` | Split by character count with overlap |
| `none` | No chunking, return raw elements |

## Environment Configuration

```env
# Database
DATABASE_URL=postgresql+asyncpg://fileforge:fileforge@localhost:15433/fileforge

# Redis
REDIS_URL=redis://localhost:16380/0
CELERY_BROKER_URL=redis://localhost:16380/1

# File Processing
MAX_FILE_SIZE=104857600  # 100MB
UPLOAD_DIR=/tmp/fileforge/uploads

# Chunking
DEFAULT_CHUNK_SIZE=1000
DEFAULT_CHUNK_OVERLAP=100

# OCR
OCR_ENABLED=true
OCR_LANGUAGES=eng
```

## Code Style

- **UV**: Package management with `dependency-groups` in pyproject.toml (not `tool.uv.dev-dependencies`)
- **Ruff**: Default settings, Python 3.11+
- **Imports**: Absolute from package root
- **Async**: Use async/await for database operations
- **Type hints**: Required for all functions

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

## Frontend Architecture

### Key Components
- **Sidebar** (`components/layout/sidebar.tsx`): Collapsible navigation
- **Dropzone** (`components/upload/dropzone.tsx`): Drag & drop file upload with react-dropzone
- **DocumentCard** (`components/documents/document-card.tsx`): Document status and actions
- **ChunkViewer** (`components/documents/chunk-viewer.tsx`): View and copy document chunks

### State Management
- **React Query** for server state (API data caching, polling)
- **Local state** for UI state (forms, toggles)

### API Integration
```typescript
// API client (lib/api.ts)
import { getDocuments, convertFile, getDocumentLLM } from "@/lib/api";

// React Query hooks (hooks/use-documents.ts)
const { data, isLoading } = useDocuments();
const uploadMutation = useUploadFile();
```

### Adding shadcn/ui Components
```bash
cd apps/frontend && npx shadcn@latest add [component-name]
```

## API Documentation

- Converter API: http://localhost:19000/docs
- OpenAPI JSON: http://localhost:19000/openapi.json
- Frontend: http://localhost:3000
