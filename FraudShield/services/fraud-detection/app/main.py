"""
FraudShield - AI-Powered Fraud Detection Service
Main FastAPI application entry point with enterprise security and monitoring.
"""

import logging
import time
from contextlib import asynccontextmanager
from typing import Dict, Any

import structlog
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.config import get_settings
from app.core.security import get_current_user
from app.core.logging import setup_logging
from app.api.v1 import fraud_assessment, webhooks, analytics, admin
from app.services.fraud_engine import FraudDetectionEngine
from app.services.ml_client import MLServiceClient
from app.database.connection import get_database
from app.models.database import create_tables

# Initialize structured logging
setup_logging()
logger = structlog.get_logger(__name__)

# Prometheus metrics
REQUEST_COUNT = Counter('fraudshield_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('fraudshield_request_duration_seconds', 'Request duration')
FRAUD_ASSESSMENTS = Counter('fraudshield_fraud_assessments_total', 'Fraud assessments', ['decision', 'risk_level'])
ML_INFERENCE_TIME = Histogram('fraudshield_ml_inference_seconds', 'ML inference duration')

class PrometheusMiddleware(BaseHTTPMiddleware):
    """Middleware to collect Prometheus metrics."""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        response = await call_next(request)
        
        # Record metrics
        duration = time.time() - start_time
        REQUEST_DURATION.observe(duration)
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code
        ).inc()
        
        return response

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup/shutdown."""
    settings = get_settings()
    
    # Startup
    logger.info("Starting FraudShield Fraud Detection Service", version="2.1.0")
    
    try:
        # Initialize database
        await create_tables()
        logger.info("Database tables created successfully")
        
        # Initialize fraud detection engine
        fraud_engine = FraudDetectionEngine()
        await fraud_engine.initialize()
        app.state.fraud_engine = fraud_engine
        logger.info("Fraud detection engine initialized")
        
        # Initialize ML service client
        ml_client = MLServiceClient(settings.ML_SERVICE_URL)
        await ml_client.health_check()
        app.state.ml_client = ml_client
        logger.info("ML service client connected")
        
        logger.info("FraudShield service startup completed successfully")
        
    except Exception as e:
        logger.error("Startup failed", error=str(e))
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down FraudShield service")
    
    # Cleanup resources
    if hasattr(app.state, 'fraud_engine'):
        await app.state.fraud_engine.cleanup()
    
    if hasattr(app.state, 'ml_client'):
        await app.state.ml_client.close()
    
    logger.info("FraudShield service shutdown completed")

# Create FastAPI application
app = FastAPI(
    title="FraudShield API",
    description="AI-Powered E-commerce Fraud Detection and Prevention Platform",
    version="2.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(PrometheusMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(fraud_assessment.router, prefix="/api/v1", tags=["Fraud Assessment"])
app.include_router(webhooks.router, prefix="/api/v1", tags=["Webhooks"])
app.include_router(analytics.router, prefix="/api/v1", tags=["Analytics"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Administration"])

@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint."""
    try:
        settings = get_settings()
        
        # Check database connectivity
        db = await get_database()
        await db.execute("SELECT 1")
        
        # Check ML service connectivity
        if hasattr(app.state, 'ml_client'):
            ml_health = await app.state.ml_client.health_check()
        else:
            ml_health = False
        
        return {
            "status": "healthy",
            "service": "fraudshield-fraud-detection",
            "version": "2.1.0",
            "timestamp": time.time(),
            "components": {
                "database": "healthy",
                "ml_service": "healthy" if ml_health else "degraded",
                "fraud_engine": "healthy" if hasattr(app.state, 'fraud_engine') else "initializing"
            },
            "environment": settings.ENVIRONMENT
        }
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": "FraudShield Fraud Detection API",
        "version": "2.1.0",
        "description": "AI-Powered E-commerce Fraud Detection and Prevention",
        "documentation": "/docs",
        "health": "/health",
        "metrics": "/metrics"
    }

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom HTTP exception handler with logging."""
    logger.warning(
        "HTTP exception occurred",
        path=request.url.path,
        method=request.method,
        status_code=exc.status_code,
        detail=exc.detail
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """General exception handler for unhandled errors."""
    logger.error(
        "Unhandled exception occurred",
        path=request.url.path,
        method=request.method,
        error=str(exc),
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "status_code": 500}
    )

if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        workers=4 if settings.ENVIRONMENT == "production" else 1,
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
        }
    )