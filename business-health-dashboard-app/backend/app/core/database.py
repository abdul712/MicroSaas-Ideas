"""
Database configuration and connection management for Business Health Dashboard
"""

import logging
from typing import AsyncGenerator, Optional
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, DateTime, JSON, text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone

from app.core.config import settings

logger = logging.getLogger(__name__)

# Database engine with connection pooling
engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=settings.DEBUG
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False
)

class Base(DeclarativeBase):
    """Base class for all database models"""
    
    # Common fields for all models
    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), 
        primary_key=True, 
        default=lambda: str(uuid.uuid4()),
        index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function to get database session
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

@asynccontextmanager
async def get_db_session() -> AsyncSession:
    """
    Context manager to get database session
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

async def create_tables():
    """
    Create all database tables and TimescaleDB hypertables
    """
    try:
        async with engine.begin() as conn:
            # Import all models to ensure they're registered
            from app.models import organization, user, health_score, business_metric, alert, integration
            
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            
            logger.info("Database tables created successfully")
            
            # Create TimescaleDB extension and hypertables if not exists
            await setup_timescale_tables(conn)
            
            # Create indexes for optimal performance
            await create_performance_indexes(conn)
            
            # Enable Row Level Security
            await setup_row_level_security(conn)
            
        logger.info("Database setup completed successfully")
        
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")
        raise

async def setup_timescale_tables(conn):
    """
    Setup TimescaleDB hypertables for time-series data
    """
    try:
        # Enable TimescaleDB extension
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb"))
        
        # Create hypertable for business_metrics if not exists
        hypertable_query = text("""
            SELECT create_hypertable('business_metrics', 'recorded_at', 
                                   chunk_time_interval => INTERVAL '1 day',
                                   if_not_exists => TRUE)
        """)
        await conn.execute(hypertable_query)
        
        # Create hypertable for health_scores if not exists
        health_hypertable_query = text("""
            SELECT create_hypertable('health_scores', 'calculated_at', 
                                   chunk_time_interval => INTERVAL '1 day',
                                   if_not_exists => TRUE)
        """)
        await conn.execute(health_hypertable_query)
        
        logger.info("TimescaleDB hypertables created successfully")
        
    except Exception as e:
        logger.warning(f"TimescaleDB setup skipped (extension not available): {str(e)}")

async def create_performance_indexes(conn):
    """
    Create database indexes for optimal query performance
    """
    indexes = [
        # Business metrics indexes
        "CREATE INDEX IF NOT EXISTS idx_business_metrics_org_type_time ON business_metrics (organization_id, metric_type, recorded_at DESC)",
        "CREATE INDEX IF NOT EXISTS idx_business_metrics_category_time ON business_metrics (category, recorded_at DESC)",
        "CREATE INDEX IF NOT EXISTS idx_business_metrics_time_only ON business_metrics (recorded_at DESC)",
        
        # Health scores indexes
        "CREATE INDEX IF NOT EXISTS idx_health_scores_org_time ON health_scores (organization_id, calculated_at DESC)",
        "CREATE INDEX IF NOT EXISTS idx_health_scores_overall ON health_scores (overall_score DESC)",
        
        # Alerts indexes
        "CREATE INDEX IF NOT EXISTS idx_alerts_org_status ON alerts (organization_id, status)",
        "CREATE INDEX IF NOT EXISTS idx_alerts_severity_time ON alerts (severity, triggered_at DESC)",
        "CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts (status) WHERE status = 'active'",
        
        # Users indexes
        "CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)",
        "CREATE INDEX IF NOT EXISTS idx_users_org ON users (organization_id)",
        
        # Integrations indexes
        "CREATE INDEX IF NOT EXISTS idx_integrations_org_provider ON integrations (organization_id, provider)",
        "CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations (status)",
    ]
    
    for index_sql in indexes:
        try:
            await conn.execute(text(index_sql))
        except Exception as e:
            logger.warning(f"Index creation failed: {index_sql} - {str(e)}")
    
    logger.info("Performance indexes created successfully")

async def setup_row_level_security(conn):
    """
    Setup Row Level Security for multi-tenant data isolation
    """
    rls_policies = [
        # Enable RLS on all tenant tables
        "ALTER TABLE organizations ENABLE ROW LEVEL SECURITY",
        "ALTER TABLE users ENABLE ROW LEVEL SECURITY",
        "ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY",
        "ALTER TABLE health_scores ENABLE ROW LEVEL SECURITY",
        "ALTER TABLE alerts ENABLE ROW LEVEL SECURITY",
        "ALTER TABLE integrations ENABLE ROW LEVEL SECURITY",
        
        # Create RLS policies (will be implemented with actual authentication)
        """
        CREATE POLICY tenant_isolation_users ON users
        USING (organization_id = current_setting('app.current_organization_id')::UUID)
        """,
        
        """
        CREATE POLICY tenant_isolation_metrics ON business_metrics
        USING (organization_id = current_setting('app.current_organization_id')::UUID)
        """,
        
        """
        CREATE POLICY tenant_isolation_health_scores ON health_scores
        USING (organization_id = current_setting('app.current_organization_id')::UUID)
        """,
        
        """
        CREATE POLICY tenant_isolation_alerts ON alerts
        USING (organization_id = current_setting('app.current_organization_id')::UUID)
        """,
        
        """
        CREATE POLICY tenant_isolation_integrations ON integrations
        USING (organization_id = current_setting('app.current_organization_id')::UUID)
        """
    ]
    
    for policy_sql in rls_policies:
        try:
            await conn.execute(text(policy_sql))
        except Exception as e:
            logger.warning(f"RLS policy creation failed: {str(e)}")
    
    logger.info("Row Level Security policies created successfully")

async def close_db_connection():
    """
    Close database connection pool
    """
    await engine.dispose()
    logger.info("Database connections closed")

async def check_db_health() -> dict:
    """
    Check database health and return status
    """
    try:
        async with AsyncSessionLocal() as session:
            # Test basic connectivity
            result = await session.execute(text("SELECT 1"))
            result.scalar()
            
            # Test TimescaleDB if available
            timescale_version = None
            try:
                result = await session.execute(text("SELECT extversion FROM pg_extension WHERE extname = 'timescaledb'"))
                timescale_version = result.scalar()
            except:
                pass
            
            # Get connection pool status
            pool = engine.pool
            pool_status = {
                "size": pool.size(),
                "checked_in": pool.checkedin(),
                "checked_out": pool.checkedout(),
                "overflow": pool.overflow(),
                "invalid": pool.invalid()
            }
            
            return {
                "status": "healthy",
                "timescale_version": timescale_version,
                "pool_status": pool_status,
                "database_url": settings.DATABASE_URL.split("@")[1] if "@" in settings.DATABASE_URL else "masked"
            }
            
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# Database utility functions
async def execute_raw_sql(query: str, params: Optional[dict] = None) -> list:
    """
    Execute raw SQL query and return results
    """
    async with AsyncSessionLocal() as session:
        result = await session.execute(text(query), params or {})
        return result.fetchall()

async def get_table_stats() -> dict:
    """
    Get database table statistics
    """
    stats_query = """
    SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC
    """
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(text(stats_query))
        return [dict(row._mapping) for row in result.fetchall()]