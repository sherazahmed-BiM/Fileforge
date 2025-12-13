"""
API v1 Router for FileForge Converter API

Aggregates all API v1 endpoints.
"""

from fastapi import APIRouter

from apps.converter_api.api.v1 import auth, convert, documents


# Create main API router
api_router = APIRouter()

# Include sub-routers
api_router.include_router(
    auth.router,
    tags=["Authentication"],
)

api_router.include_router(
    convert.router,
    prefix="/convert",
    tags=["Convert"],
)

api_router.include_router(
    documents.router,
    prefix="/documents",
    tags=["Documents"],
)
