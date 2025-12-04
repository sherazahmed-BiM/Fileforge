"""
Base Model for FileForge

Provides common fields and functionality for all models.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Integer
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.core.database import Base


class BaseModel(Base):
    """
    Abstract base class for all models.

    Provides common fields: id, created_at, updated_at
    """

    __abstract__ = True

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    @declared_attr
    def __tablename__(cls) -> str:
        """
        Auto-generate table name from class name.

        Example: Document -> documents, Chunk -> chunks
        """
        name = cls.__name__
        # Convert CamelCase to snake_case and pluralize
        result = "".join(["_" + c.lower() if c.isupper() else c for c in name]).lstrip("_")
        return result + "s"

    def to_dict(self) -> dict[str, Any]:
        """Convert model to dictionary."""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                result[column.name] = value.isoformat()
            else:
                result[column.name] = value
        return result

    def __repr__(self) -> str:
        """String representation."""
        return f"<{self.__class__.__name__}(id={self.id})>"
