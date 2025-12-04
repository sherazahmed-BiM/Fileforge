"""
FileForge Converter API

Main FastAPI application for file-to-LLM conversion.
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from apps.converter_api.api.v1.router import api_router
from packages.common.core.config import settings
from packages.common.core.database import close_db
from packages.common.core.logging import setup_logging

# Frontend paths
FRONTEND_DIR = Path(__file__).parent.parent.parent / "frontend"
TEMPLATES_DIR = FRONTEND_DIR / "templates"
STATIC_DIR = FRONTEND_DIR / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events.

    Handles startup and shutdown.
    """
    # Startup
    setup_logging()
    print(f"Starting {settings.app_name} v{settings.app_version}")
    print(f"Environment: {settings.environment}")
    print(f"Debug mode: {settings.debug}")
    print(f"API docs: http://{settings.api_host}:{settings.api_port}/docs")

    yield

    # Shutdown
    print(f"Shutting down {settings.app_name}")
    await close_db()


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    # FileForge API

    Convert any file into LLM-ready JSON data.

    ## Features

    * **Multi-format support**: PDF, DOCX, XLSX, PPTX, HTML, Markdown, images, and more
    * **Smart chunking**: Fixed-size or semantic (title-based) chunking strategies
    * **Token counting**: Accurate token counts using tiktoken (GPT-4 tokenizer)
    * **OCR support**: Extract text from images and scanned documents
    * **Table extraction**: Structured table data with HTML representation
    * **Async processing**: Queue large files for background processing

    ## Quick Start

    1. Upload a file via `POST /api/v1/convert/sync` for immediate results
    2. Or use `POST /api/v1/convert` for async processing of large files
    3. Get results via `GET /api/v1/documents/{id}/llm`

    ## Output Format

    ```json
    {
      "id": 1,
      "filename": "document.pdf",
      "file_type": "pdf",
      "content": {
        "chunks": [
          {
            "index": 0,
            "text": "Chapter 1...",
            "token_count": 512,
            "metadata": {...}
          }
        ]
      }
    }
    ```
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
    debug=settings.debug,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get(
    "/health",
    tags=["Health"],
    summary="Health check",
    description="Check if the API is running",
)
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
    }


# Mount static files
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


# Root endpoint - serve frontend
@app.get(
    "/",
    tags=["Root"],
    summary="FileForge UI",
    description="Serve the FileForge web interface",
    response_class=HTMLResponse,
)
async def root():
    """Serve the FileForge web interface."""
    index_file = TEMPLATES_DIR / "index.html"
    if index_file.exists():
        return HTMLResponse(content=index_file.read_text())
    return HTMLResponse(content="<h1>FileForge</h1><p>Frontend not found. Visit <a href='/docs'>/docs</a> for API.</p>")


# API info endpoint
@app.get(
    "/api",
    tags=["Root"],
    summary="API Info",
    description="Get API information",
)
async def api_info():
    """API information endpoint."""
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "description": "Convert files to LLM-ready JSON data",
        "docs": "/docs",
        "health": "/health",
        "api": "/api/v1",
    }


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": str(exc) if settings.debug else "An error occurred",
        },
    )


# Include API router
app.include_router(api_router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "apps.converter_api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
