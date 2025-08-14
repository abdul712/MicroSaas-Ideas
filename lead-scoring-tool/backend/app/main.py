"""
Lead Scoring Tool - FastAPI Backend Main Application
Enterprise-grade lead qualification platform with real-time AI scoring
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import structlog
from prometheus_client import make_asgi_app, Counter, Histogram, Gauge
import time

from app.core.config import settings
from app.core.database import init_database, close_database
from app.core.redis import init_redis, close_redis
from app.core.exceptions import LeadScoringException
from app.api.v1 import api_router
from app.middleware.auth import AuthMiddleware
from app.middleware.rate_limiting import RateLimitMiddleware
from app.middleware.monitoring import MonitoringMiddleware

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)

# Prometheus Metrics
REQUEST_COUNT = Counter(
    "http_requests_total", 
    "Total HTTP requests", 
    ["method", "endpoint", "status"]
)
REQUEST_DURATION = Histogram(
    "http_request_duration_seconds", 
    "HTTP request duration"
)
ACTIVE_CONNECTIONS = Gauge(
    "websocket_connections_active", 
    "Active WebSocket connections"
)
LEADS_PROCESSED = Counter(
    "leads_processed_total", 
    "Total leads processed"
)
SCORING_OPERATIONS = Counter(
    "scoring_operations_total", 
    "Total scoring operations", 
    ["model_type", "status"]
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager for startup and shutdown events."""
    logger.info("Starting Lead Scoring Tool backend")
    
    # Initialize database connections
    await init_database()
    logger.info("Database initialized")
    
    # Initialize Redis connections
    await init_redis()
    logger.info("Redis initialized")
    
    # Log startup completion
    logger.info(
        "Lead Scoring Tool backend started successfully",
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT
    )
    
    yield
    
    # Cleanup on shutdown
    logger.info("Shutting down Lead Scoring Tool backend")
    await close_redis()
    await close_database()
    logger.info("Backend shutdown completed")


# Create FastAPI application
app = FastAPI(
    title="Lead Scoring Tool API",
    description="Enterprise-grade lead qualification platform with real-time AI scoring",
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
    openapi_tags=[
        {
            "name": "authentication",
            "description": "User authentication and authorization"
        },
        {
            "name": "leads",
            "description": "Lead management and CRUD operations"
        },
        {
            "name": "scoring",
            "description": "AI-powered lead scoring engine"
        },
        {
            "name": "analytics",
            "description": "Advanced analytics and reporting"
        },
        {
            "name": "integrations",
            "description": "External platform integrations"
        },
        {
            "name": "organizations",
            "description": "Multi-tenant organization management"
        },
        {
            "name": "users",
            "description": "User management and profiles"
        },
        {
            "name": "webhooks",
            "description": "Webhook configuration and management"
        }
    ]
)

# Add Security Middleware
if settings.ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware, 
        allowed_hosts=settings.ALLOWED_HOSTS
    )

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

# Add Custom Middleware
app.add_middleware(MonitoringMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(AuthMiddleware)


# Exception Handlers
@app.exception_handler(LeadScoringException)
async def lead_scoring_exception_handler(request: Request, exc: LeadScoringException):
    """Handle custom Lead Scoring Tool exceptions."""
    logger.error(
        "Lead scoring exception occurred",
        error=str(exc),
        status_code=exc.status_code,
        path=request.url.path
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error_code,
            "message": exc.message,
            "details": exc.details
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions with proper logging."""
    logger.exception(
        "Unhandled exception occurred",
        error=str(exc),
        path=request.url.path,
        method=request.method
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "An internal server error occurred"
        }
    )


# Health Check Endpoints
@app.get("/health", tags=["health"])
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "lead-scoring-backend",
        "version": settings.APP_VERSION,
        "timestamp": time.time()
    }


@app.get("/health/detailed", tags=["health"])
async def detailed_health_check():
    """Detailed health check with dependency status."""
    from app.core.database import get_database_status
    from app.core.redis import get_redis_status
    
    health_status = {
        "status": "healthy",
        "service": "lead-scoring-backend",
        "version": settings.APP_VERSION,
        "timestamp": time.time(),
        "dependencies": {
            "database": await get_database_status(),
            "redis": await get_redis_status(),
        }
    }
    
    # Determine overall health
    dependency_health = all(
        dep.get("status") == "healthy" 
        for dep in health_status["dependencies"].values()
    )
    
    if not dependency_health:
        health_status["status"] = "unhealthy"
    
    return health_status


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    metrics_app = make_asgi_app()
    return await metrics_app(None, None)


# Include API Routes
app.include_router(
    api_router,
    prefix=settings.API_V1_STR
)


# WebSocket endpoint for real-time updates
@app.websocket("/ws/{organization_id}")
async def websocket_endpoint(websocket, organization_id: str):
    """WebSocket endpoint for real-time lead score updates."""
    from app.services.websocket import WebSocketManager
    
    manager = WebSocketManager()
    await manager.connect(websocket, organization_id)
    ACTIVE_CONNECTIONS.inc()
    
    try:
        await manager.listen_for_updates(websocket, organization_id)
    except Exception as e:
        logger.exception("WebSocket connection error", error=str(e))
    finally:
        manager.disconnect(websocket, organization_id)
        ACTIVE_CONNECTIONS.dec()


# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """Root endpoint with API information."""
    return {
        "service": "Lead Scoring Tool API",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "docs_url": "/docs" if settings.DEBUG else None,
        "health_check": "/health",
        "api_prefix": settings.API_V1_STR
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        access_log=True,
        log_config={
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                },
            },
            "handlers": {
                "default": {
                    "formatter": "default",
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                },
            },
            "root": {
                "level": "INFO",
                "handlers": ["default"],
            },
            "loggers": {
                "uvicorn.error": {
                    "level": "INFO",
                },
                "uvicorn.access": {
                    "level": "INFO",
                },
            },
        }
    )