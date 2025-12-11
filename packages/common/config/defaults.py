"""
Application Defaults for FileForge

Safe, non-sensitive default values that can be committed to version control.
Sensitive values should be overridden via environment variables.
"""


class ApplicationDefaults:
    """
    Default configuration values for FileForge.

    These are safe defaults that work for local development.
    Production values should be set via environment variables.
    """

    # ==================== Application ====================
    APP_NAME: str = "FileForge"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # ==================== API Server ====================
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 19000
    ADMIN_API_PORT: int = 19001
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5200",
        "http://localhost:19000",
        "http://localhost:19001",
    ]

    # ==================== Database ====================
    DATABASE_URL: str = "postgresql+asyncpg://fileforge:fileforge@localhost:15433/fileforge"
    DATABASE_SYNC_URL: str = "postgresql://fileforge:fileforge@localhost:15433/fileforge"
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_ECHO: bool = False

    # ==================== Redis ====================
    REDIS_URL: str = "redis://localhost:16380/0"
    REDIS_MAX_CONNECTIONS: int = 10

    # ==================== Celery ====================
    CELERY_BROKER_URL: str = "redis://localhost:16380/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:16380/2"
    CELERY_TASK_TIME_LIMIT: int = 3600  # 1 hour
    CELERY_TASK_SOFT_TIME_LIMIT: int = 3300  # 55 minutes

    # ==================== File Processing ====================
    MAX_FILE_SIZE: int = 104857600  # 100MB
    UPLOAD_DIR: str = "/tmp/fileforge/uploads"
    SUPPORTED_EXTENSIONS: list[str] = [
        # Documents - Modern Office
        ".pdf", ".docx", ".xlsx", ".pptx",
        # Documents - Legacy Office (via LibreOffice)
        ".doc", ".dot", ".dotm", ".dotx", ".rtf",
        ".xls", ".xlm", ".xlt",
        ".ppt", ".pot", ".pptm", ".pps", ".ppsx",
        # Documents - Open Document Format (via LibreOffice)
        ".odt", ".ott", ".ods", ".ots", ".odp", ".otp",
        # Documents - Legacy Word Processing (via LibreOffice)
        ".abw", ".zabw", ".hwp", ".sxw", ".sxg", ".wpd", ".wps", ".cwk", ".mcw",
        # Spreadsheets - Legacy (via LibreOffice)
        ".et", ".fods", ".sxc", ".wk1", ".wks", ".dif",
        # Presentations - Legacy (via LibreOffice)
        ".sxi",
        # Markup
        ".html", ".htm", ".xhtml", ".md", ".markdown", ".adoc", ".asciidoc",
        ".rst", ".org",
        # Data
        ".csv", ".tsv", ".dbf",
        # Images (OCR supported)
        ".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp", ".webp", ".gif",
        ".heic", ".heif",
        # Email
        ".eml", ".msg", ".p7s",
        # Ebooks
        ".epub",
    ]

    # ==================== Chunking ====================
    DEFAULT_CHUNK_SIZE: int = 1000
    DEFAULT_CHUNK_OVERLAP: int = 100
    MAX_CHUNK_SIZE: int = 2000

    # ==================== OCR ====================
    OCR_LANGUAGES: str = "eng"
    OCR_ENABLED: bool = True

    # ==================== Logging ====================
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_JSON: bool = False
