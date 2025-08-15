"""
Lead Scoring Tool - Main FastAPI Application
Enterprise-grade API with comprehensive features and security
"""

import os
import time
from contextlib import asynccontextmanager
from typing import Any, Dict

import structlog
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram, generate_latest
from starlette.exceptions import HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from src.core.config import get_settings
from src.core.database import engine, get_db
from src.core.logging import setup_logging
from src.core.security import SecurityHeaders
from src.api.v1.router import api_router
from src.middleware.rate_limit import RateLimitMiddleware
from src.middleware.auth import AuthMiddleware
from src.middleware.monitoring import MonitoringMiddleware
from src.services.health import HealthService

# Initialize settings and logging
settings = get_settings()
logger = setup_logging()

# Prometheus metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)
REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware for collecting Prometheus metrics"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Get endpoint pattern for consistent labeling
        endpoint = request.url.path
        method = request.method
        
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            status_code = 500
            response = JSONResponse(
                status_code=500,
                content={"detail": "Internal Server Error"}
            )
            logger.error("Unhandled exception", exc_info=e)
        
        # Record metrics
        REQUEST_COUNT.labels(
            method=method,
            endpoint=endpoint,
            status=status_code
        ).inc()
        
        REQUEST_DURATION.labels(
            method=method,
            endpoint=endpoint
        ).observe(time.time() - start_time)
        
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting Lead Scoring Tool API")
    
    # Initialize database connections
    try:
        # Test database connection
        async with engine.begin() as conn:
            await conn.execute("SELECT 1")
        logger.info("Database connection established")
    except Exception as e:
        logger.error("Failed to connect to database", exc_info=e)
        raise
    
    # Initialize other services
    health_service = HealthService()
    await health_service.initialize()
    
    logger.info("Lead Scoring Tool API started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Lead Scoring Tool API")
    
    # Cleanup resources
    await engine.dispose()
    
    logger.info("Lead Scoring Tool API shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="Lead Scoring Tool API",
    description="Enterprise-grade AI-powered lead scoring and qualification platform",
    version="1.0.0",
    docs_url="/docs" if settings.ENV != "production" else None,
    redoc_url="/redoc" if settings.ENV != "production" else None,
    lifespan=lifespan,
    openapi_tags=[
        {
            "name": "authentication",
            "description": "User authentication and authorization"
        },
        {
            "name": "leads",
            "description": "Lead management and data operations"
        },
        {
            "name": "scoring",
            "description": "Lead scoring and ML model operations"
        },
        {
            "name": "analytics",
            "description": "Analytics and reporting endpoints"
        },
        {
            "name": "integrations",
            "description": "Third-party platform integrations"
        },
        {
            "name": "admin",
            "description": "Administrative operations"
        },
        {
            "name": "health",
            "description": "Health check and monitoring endpoints"
        }
    ]
)

# Security middleware
app.add_middleware(SecurityHeaders)

# Trusted hosts
if settings.TRUSTED_HOSTS:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.TRUSTED_HOSTS
    )

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Page-Count"]
)

# Compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Custom middleware
app.add_middleware(MonitoringMiddleware)
app.add_middleware(AuthMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(MetricsMiddleware)


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    logger.warning(
        "HTTP exception",
        status_code=exc.status_code,
        detail=exc.detail,
        path=request.url.path
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "type": "http_error",
                "code": exc.status_code,
                "message": exc.detail,
                "timestamp": time.time()
            }
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors"""
    logger.warning(
        "Validation error",
        errors=exc.errors(),
        path=request.url.path
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "type": "validation_error",
                "code": 422,
                "message": "Request validation failed",
                "details": exc.errors(),
                "timestamp": time.time()
            }
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(
        "Unhandled exception",
        exc_info=exc,
        path=request.url.path
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "type": "internal_error",
                "code": 500,
                "message": "Internal server error",
                "timestamp": time.time()
            }
        }
    )


# Health check endpoints
@app.get("/health", tags=["health"])
async def health_check():
    """Basic health check"""
    return {"status": "healthy", "timestamp": time.time()}


@app.get("/health/detailed", tags=["health"])
async def detailed_health_check():
    """Detailed health check with service status"""
    health_service = HealthService()
    health_status = await health_service.check_all()
    
    status_code = 200 if health_status["healthy"] else 503
    
    return JSONResponse(
        status_code=status_code,
        content=health_status
    )


# Metrics endpoint
@app.get("/metrics", response_class=Response, tags=["health"])
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(
        content=generate_latest().decode('utf-8'),
        media_type="text/plain"
    )


# Info endpoint
@app.get("/info", tags=["health"])
async def info():
    """Application information"""
    return {
        "name": "Lead Scoring Tool API",
        "version": "1.0.0",
        "environment": settings.ENV,
        "documentation": "/docs" if settings.ENV != "production" else None,
        "features": {
            "ai_scoring": True,
            "real_time_updates": True,
            "multi_tenant": True,
            "integrations": True,
            "analytics": True,
            "compliance": True
        }
    }


# Root endpoint
@app.get("/", tags=["health"])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Lead Scoring Tool API",
        "version": "1.0.0",
        "docs": "/docs" if settings.ENV != "production" else None,
        "health": "/health",
        "status": "operational"
    }


# Include API routes
app.include_router(api_router, prefix="/api/v1")


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests"""
    start_time = time.time()
    
    # Log request
    logger.info(
        "Request started",
        method=request.method,
        path=request.url.path,
        query_params=str(request.query_params),
        client_ip=request.client.host if request.client else None
    )
    
    # Process request
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    logger.info(
        "Request completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        process_time=process_time
    )
    
    # Add timing header
    response.headers["X-Process-Time"] = str(process_time)
    
    return response


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENV == "development",
        log_config=None  # Use our custom logging
    )