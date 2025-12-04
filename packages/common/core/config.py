"""
Configuration Management for FileForge

Loads settings from environment variables with safe defaults.
Follows the same pattern as FlowPuppy.
"""

from typing import Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from packages.common.config.defaults import ApplicationDefaults


# Create defaults instance
_defaults = ApplicationDefaults()


class Settings(BaseSettings):
    """
    Application Settings for FileForge.

    Inherits safe defaults and overrides with environment variables.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ==================== Application ====================
    app_name: str = Field(default=_defaults.APP_NAME)
    app_version: str = Field(default=_defaults.APP_VERSION)
    debug: bool = Field(default=_defaults.DEBUG)
    environment: str = Field(default=_defaults.ENVIRONMENT)

    # ==================== API Server ====================
    api_host: str = Field(default=_defaults.API_HOST)
    api_port: int = Field(default=_defaults.API_PORT)
    admin_api_port: int = Field(default=_defaults.ADMIN_API_PORT)
    cors_origins: str = Field(default=",".join(_defaults.CORS_ORIGINS))

    # ==================== Database ====================
    database_url: str = Field(default=_defaults.DATABASE_URL)
    database_sync_url: str = Field(default=_defaults.DATABASE_SYNC_URL)
    database_pool_size: int = Field(default=_defaults.DATABASE_POOL_SIZE)
    database_max_overflow: int = Field(default=_defaults.DATABASE_MAX_OVERFLOW)
    database_echo: bool = Field(default=_defaults.DATABASE_ECHO)

    # ==================== Redis ====================
    redis_url: str = Field(default=_defaults.REDIS_URL)
    redis_max_connections: int = Field(default=_defaults.REDIS_MAX_CONNECTIONS)

    # ==================== Celery ====================
    celery_broker_url: str = Field(default=_defaults.CELERY_BROKER_URL)
    celery_result_backend: str = Field(default=_defaults.CELERY_RESULT_BACKEND)
    celery_task_time_limit: int = Field(default=_defaults.CELERY_TASK_TIME_LIMIT)
    celery_task_soft_time_limit: int = Field(default=_defaults.CELERY_TASK_SOFT_TIME_LIMIT)

    # ==================== File Processing ====================
    max_file_size: int = Field(default=_defaults.MAX_FILE_SIZE)
    upload_dir: str = Field(default=_defaults.UPLOAD_DIR)
    supported_extensions: str = Field(default=",".join(_defaults.SUPPORTED_EXTENSIONS))

    # ==================== Chunking ====================
    default_chunk_size: int = Field(default=_defaults.DEFAULT_CHUNK_SIZE)
    default_chunk_overlap: int = Field(default=_defaults.DEFAULT_CHUNK_OVERLAP)
    max_chunk_size: int = Field(default=_defaults.MAX_CHUNK_SIZE)

    # ==================== OCR ====================
    ocr_languages: str = Field(default=_defaults.OCR_LANGUAGES)
    ocr_enabled: bool = Field(default=_defaults.OCR_ENABLED)

    # ==================== Logging ====================
    log_level: str = Field(default=_defaults.LOG_LEVEL)
    log_format: str = Field(default=_defaults.LOG_FORMAT)
    log_json: bool = Field(default=_defaults.LOG_JSON)

    def get_cors_origins_list(self) -> list[str]:
        """Get CORS origins as a list."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    def get_supported_extensions_list(self) -> list[str]:
        """Get supported extensions as a list."""
        return [ext.strip() for ext in self.supported_extensions.split(",") if ext.strip()]


# Singleton instance
settings = Settings()
