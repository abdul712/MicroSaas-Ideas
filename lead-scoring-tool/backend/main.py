"""
Lead Scoring Tool - Main FastAPI Application
AI-Powered Lead Qualification Platform
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Any, Dict

import uvicorn
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import structlog

from app.core.config import get_settings
from app.core.database import database
from app.core.logging import setup_logging
from app.core.middleware import (
    AuthenticationMiddleware,
    RateLimitMiddleware,
    SecurityHeadersMiddleware,
)
from app.api.v1.api import api_router
from app.core.exceptions import (
    AppException,
    ValidationException,
    AuthenticationException,
    AuthorizationException,
)

# Setup structured logging
setup_logging()
logger = structlog.get_logger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("Starting Lead Scoring Tool API")
    
    # Startup
    try:
        await database.connect()
        logger.info("Database connected successfully")
        
        # Initialize ML models
        from app.services.ml.model_manager import ModelManager
        model_manager = ModelManager()
        await model_manager.initialize()
        logger.info("ML models initialized")
        
        # Start background tasks
        from app.core.tasks import start_background_tasks
        await start_background_tasks()
        logger.info("Background tasks started")
        
    except Exception as e:
        logger.error("Failed to start application", error=str(e))
        raise
    
    yield
    
    # Shutdown
    try:
        await database.disconnect()
        logger.info("Database disconnected")
        
        # Stop background tasks
        from app.core.tasks import stop_background_tasks
        await stop_background_tasks()
        logger.info("Background tasks stopped")
        
    except Exception as e:
        logger.error("Error during shutdown", error=str(e))
    
    logger.info("Lead Scoring Tool API shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="Lead Scoring Tool API",
    description="AI-Powered Lead Qualification Platform",
    version="1.0.0",
    openapi_url="/api/v1/openapi.json" if settings.environment != "production" else None,
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
    lifespan=lifespan,
)

# Security Middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if settings.environment == "development" else settings.allowed_hosts
)

app.add_middleware(SecurityHeadersMiddleware)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Middleware
app.add_middleware(RateLimitMiddleware)
app.add_middleware(AuthenticationMiddleware)


# Exception Handlers
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle application exceptions"""
    logger.error(
        "Application exception",
        error=exc.message,
        status_code=exc.status_code,
        path=request.url.path
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message, "type": exc.__class__.__name__}
    )


@app.exception_handler(ValidationException)
async def validation_exception_handler(request: Request, exc: ValidationException) -> JSONResponse:
    """Handle validation exceptions"""
    logger.warning(
        "Validation exception",
        errors=exc.errors,
        path=request.url.path
    )
    return JSONResponse(
        status_code=422,
        content={"error": "Validation failed", "details": exc.errors}
    )


@app.exception_handler(AuthenticationException)
async def authentication_exception_handler(request: Request, exc: AuthenticationException) -> JSONResponse:
    """Handle authentication exceptions"""
    logger.warning(
        "Authentication failed",
        error=exc.message,
        path=request.url.path
    )
    return JSONResponse(
        status_code=401,
        content={"error": exc.message}
    )


@app.exception_handler(AuthorizationException)
async def authorization_exception_handler(request: Request, exc: AuthorizationException) -> JSONResponse:
    """Handle authorization exceptions"""
    logger.warning(
        "Authorization failed",
        error=exc.message,
        path=request.url.path,
        user_id=getattr(request.state, 'user_id', None)
    )
    return JSONResponse(
        status_code=403,
        content={"error": exc.message}
    )


@app.exception_handler(500)
async def internal_server_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle internal server errors"""
    logger.error(
        "Internal server error",
        error=str(exc),
        path=request.url.path,
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )


# Health Check Endpoint
@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint"""
    try:
        # Check database connection
        await database.fetch_one("SELECT 1")
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
    
    return {
        "status": "healthy" if db_status == "healthy" else "unhealthy",
        "version": "1.0.0",
        "environment": settings.environment,
        "services": {
            "database": db_status,
            "redis": "healthy",  # TODO: Add Redis health check
            "ml_models": "healthy",  # TODO: Add ML models health check
        }
    }


# Metrics Endpoint
@app.get("/metrics")
async def metrics() -> Response:
    """Prometheus metrics endpoint"""
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    
    return Response(
        generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


# API Routes
app.include_router(api_router, prefix="/api/v1")


# Root endpoint
@app.get("/")
async def root() -> Dict[str, str]:
    """Root endpoint"""
    return {
        "message": "Lead Scoring Tool API",
        "version": "1.0.0",
        "docs": "/docs" if settings.environment != "production" else "disabled",
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.environment == "development",
        log_config=None,  # Use our custom logging
        access_log=False,  # Disable uvicorn access logs (we have our own)
    )