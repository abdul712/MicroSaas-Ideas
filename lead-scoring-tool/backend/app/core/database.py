"""
Database Configuration and Connection Management
PostgreSQL with SQLAlchemy async support and connection pooling
"""

from typing import AsyncGenerator, Dict, Any
from sqlalchemy.ext.asyncio import (
    AsyncSession, 
    AsyncEngine,
    create_async_engine,
    async_sessionmaker
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text, pool
from contextlib import asynccontextmanager
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)

# Global database engine and session factory
engine: AsyncEngine = None
SessionLocal: async_sessionmaker[AsyncSession] = None


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def init_database() -> None:
    """Initialize database connection and create engine."""
    global engine, SessionLocal
    
    logger.info("Initializing database connection", url=settings.DATABASE_URL.split('@')[1])
    
    # Create async engine with connection pooling
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        poolclass=pool.QueuePool,
        **settings.DATABASE_CONFIG,
        connect_args={
            "server_settings": {
                "application_name": "lead_scoring_backend",
            }
        }
    )
    
    # Create session factory
    SessionLocal = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=True,
        autocommit=False
    )
    
    # Test connection
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection established successfully")
    except Exception as e:
        logger.error("Failed to establish database connection", error=str(e))
        raise


async def close_database() -> None:
    """Close database connections."""
    global engine
    
    if engine:
        logger.info("Closing database connections")
        await engine.dispose()
        logger.info("Database connections closed")


@asynccontextmanager
async def get_database_session() -> AsyncGenerator[AsyncSession, None]:
    """Get database session with automatic cleanup."""
    if not SessionLocal:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    
    async with SessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database session in FastAPI."""
    async with get_database_session() as session:
        yield session


async def get_database_status() -> Dict[str, Any]:
    """Get database health status."""
    try:
        if not engine:
            return {"status": "not_initialized", "message": "Database engine not initialized"}
        
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT version(), current_database(), current_user"))
            row = result.fetchone()
            
            # Get connection pool status
            pool_status = engine.pool.status()
            
            return {
                "status": "healthy",
                "version": row[0].split(" ")[1] if row else "unknown",
                "database": row[1] if row else "unknown", 
                "user": row[2] if row else "unknown",
                "pool": {
                    "size": engine.pool.size(),
                    "checked_in": pool_status.split()[0],
                    "checked_out": pool_status.split()[2],
                    "overflow": pool_status.split()[4] if len(pool_status.split()) > 4 else "0"
                }
            }
            
    except Exception as e:
        logger.error("Database health check failed", error=str(e))
        return {
            "status": "unhealthy",
            "error": str(e)
        }


class DatabaseManager:
    """Database manager for advanced operations."""
    
    def __init__(self):
        self.engine = engine
        self.session_factory = SessionLocal
    
    @asynccontextmanager
    async def transaction(self) -> AsyncGenerator[AsyncSession, None]:
        """Context manager for database transactions."""
        async with self.session_factory() as session:
            async with session.begin():
                try:
                    yield session
                    await session.commit()
                except Exception:
                    await session.rollback()
                    raise
    
    async def execute_raw_query(self, query: str, params: Dict[str, Any] = None) -> Any:
        """Execute raw SQL query."""
        async with self.session_factory() as session:
            result = await session.execute(text(query), params or {})
            await session.commit()
            return result
    
    async def bulk_insert(self, model_class, data: list) -> None:
        """Perform bulk insert operation."""
        async with self.session_factory() as session:
            objects = [model_class(**item) for item in data]
            session.add_all(objects)
            await session.commit()
    
    async def get_table_stats(self, table_name: str) -> Dict[str, Any]:
        """Get table statistics."""
        query = """
        SELECT 
            schemaname,
            tablename,
            attname, 
            n_distinct,
            most_common_vals,
            most_common_freqs,
            histogram_bounds
        FROM pg_stats 
        WHERE tablename = :table_name
        """
        
        result = await self.execute_raw_query(query, {"table_name": table_name})
        return result.fetchall()


# Global database manager instance
db_manager = DatabaseManager()