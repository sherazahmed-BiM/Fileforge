"""
FastAPI Dependencies for Converter API
"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from packages.common.core.database import AsyncSessionLocal


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting async database sessions.

    Yields:
        AsyncSession: Database session
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
