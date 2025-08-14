"""
FraudShield - Enterprise Fraud Detection Service
Main FastAPI application with comprehensive fraud detection capabilities
"""

import asyncio
import logging
import sys
import time
from contextlib import asynccontextmanager
from typing import Dict, Any

import structlog
import uvicorn
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import get_settings
from app.core.database import init_db, close_db
from app.core.redis_client import init_redis, close_redis
from app.core.kafka_client import init_kafka, close_kafka
from app.core.logging import setup_logging
from app.api.v1 import api_router
from app.core.security import get_current_user
from app.core.exceptions import (
    FraudDetectionException,
    ValidationException,
    AuthenticationException,
    RateLimitException
)

# Initialize settings
settings = get_settings()

# Setup structured logging
setup_logging()
logger = structlog.get_logger(__name__)

# Prometheus metrics
REQUEST_COUNT = Counter(
    'fraudshield_requests_total',
    'Total requests',
    ['method', 'endpoint', 'status']
)
REQUEST_DURATION = Histogram(
    'fraudshield_request_duration_seconds',
    'Request duration',
    ['method', 'endpoint']
)
FRAUD_ASSESSMENTS = Counter(
    'fraudshield_fraud_assessments_total',
    'Total fraud assessments',
    ['decision', 'risk_level']
)
ML_INFERENCE_DURATION = Histogram(
    'fraudshield_ml_inference_duration_seconds',
    'ML model inference duration'
)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    # Startup
    logger.info("Starting FraudShield Fraud Detection Service")
    
    try:
        # Initialize database connection
        await init_db()
        logger.info("Database connection initialized")
        
        # Initialize Redis connection
        await init_redis()
        logger.info("Redis connection initialized")
        
        # Initialize Kafka connection
        await init_kafka()
        logger.info("Kafka connection initialized")
        
        # Health check for external services
        await _health_check_services()
        logger.info("All external services are healthy")
        
        logger.info("FraudShield service startup completed")
        
    except Exception as e:
        logger.error("Failed to start FraudShield service", error=str(e))
        sys.exit(1)
    
    yield
    
    # Shutdown
    logger.info("Shutting down FraudShield Fraud Detection Service")
    
    try:
        await close_kafka()
        logger.info("Kafka connection closed")
        
        await close_redis()
        logger.info("Redis connection closed")
        
        await close_db()
        logger.info("Database connection closed")
        
        logger.info("FraudShield service shutdown completed")
        
    except Exception as e:
        logger.error("Error during shutdown", error=str(e))


# Create FastAPI application
app = FastAPI(
    title="FraudShield Fraud Detection API",
    description="Enterprise-grade AI-powered fraud detection and prevention platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

# Trusted host middleware
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", "*.fraudshield.com"]
    )


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Middleware for request logging and metrics collection."""
    start_time = time.time()
    
    # Generate request ID for tracing
    request_id = f"req_{int(time.time() * 1000000)}"
    
    # Log request
    logger.info(
        "Request started",
        request_id=request_id,
        method=request.method,
        url=str(request.url),
        client_ip=get_remote_address(request),
        user_agent=request.headers.get("user-agent", "")
    )
    
    try:
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Update metrics
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code
        ).inc()
        
        REQUEST_DURATION.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(duration)
        
        # Log response
        logger.info(
            "Request completed",
            request_id=request_id,
            status_code=response.status_code,
            duration=f"{duration:.3f}s"
        )
        
        return response
        
    except Exception as e:
        duration = time.time() - start_time
        
        # Log error
        logger.error(
            "Request failed",
            request_id=request_id,
            error=str(e),
            duration=f"{duration:.3f}s"
        )
        
        # Update error metrics
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status=500
        ).inc()
        
        raise


@app.exception_handler(FraudDetectionException)
async def fraud_detection_exception_handler(request: Request, exc: FraudDetectionException):
    """Handle fraud detection specific exceptions."""
    logger.warning(
        "Fraud detection error",
        error=str(exc),
        url=str(request.url)
    )
    return JSONResponse(
        status_code=400,
        content={
            "error": "fraud_detection_error",
            "message": str(exc),
            "timestamp": time.time()
        }
    )


@app.exception_handler(ValidationException)
async def validation_exception_handler(request: Request, exc: ValidationException):
    """Handle validation exceptions."""
    logger.warning(
        "Validation error",
        error=str(exc),
        url=str(request.url)
    )
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "message": str(exc),
            "timestamp": time.time()
        }
    )


@app.exception_handler(AuthenticationException)
async def authentication_exception_handler(request: Request, exc: AuthenticationException):
    """Handle authentication exceptions."""
    logger.warning(
        "Authentication error",
        error=str(exc),
        url=str(request.url)
    )
    return JSONResponse(
        status_code=401,
        content={
            "error": "authentication_error",
            "message": "Invalid or expired authentication credentials",
            "timestamp": time.time()
        }
    )


@app.exception_handler(RateLimitException)
async def rate_limit_exception_handler(request: Request, exc: RateLimitException):
    """Handle rate limiting exceptions."""
    logger.warning(
        "Rate limit exceeded",
        error=str(exc),
        client_ip=get_remote_address(request),
        url=str(request.url)
    )
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": "Too many requests. Please try again later.",
            "timestamp": time.time()
        }
    )


@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint."""
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "service": "fraud-detection-service",
        "checks": {}
    }
    
    try:
        # Check database
        from app.core.database import health_check_db
        db_healthy = await health_check_db()
        health_status["checks"]["database"] = "healthy" if db_healthy else "unhealthy"
        
        # Check Redis
        from app.core.redis_client import health_check_redis
        redis_healthy = await health_check_redis()
        health_status["checks"]["redis"] = "healthy" if redis_healthy else "unhealthy"
        
        # Check Kafka
        from app.core.kafka_client import health_check_kafka
        kafka_healthy = await health_check_kafka()
        health_status["checks"]["kafka"] = "healthy" if kafka_healthy else "unhealthy"
        
        # Check ML service
        ml_healthy = await _check_ml_service()
        health_status["checks"]["ml_service"] = "healthy" if ml_healthy else "unhealthy"
        
        # Overall health
        all_healthy = all(
            status == "healthy" 
            for status in health_status["checks"].values()
        )
        
        if not all_healthy:
            health_status["status"] = "degraded"
            
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        health_status["status"] = "unhealthy"
        health_status["error"] = str(e)
    
    return health_status


@app.get("/health/ready")
async def readiness_check():
    """Kubernetes readiness probe."""
    try:
        # Quick checks for critical dependencies
        from app.core.database import health_check_db
        from app.core.redis_client import health_check_redis
        
        db_ready = await health_check_db()
        redis_ready = await health_check_redis()
        
        if db_ready and redis_ready:
            return {"status": "ready"}
        else:
            raise HTTPException(status_code=503, detail="Service not ready")
            
    except Exception as e:
        logger.error("Readiness check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Service not ready")


@app.get("/health/live")
async def liveness_check():
    """Kubernetes liveness probe."""
    return {"status": "alive", "timestamp": time.time()}


@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint."""
    return generate_latest()


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "service": "FraudShield Fraud Detection API",
        "version": "1.0.0",
        "description": "Enterprise-grade AI-powered fraud detection and prevention platform",
        "docs": "/docs",
        "health": "/health",
        "metrics": "/metrics"
    }


# Include API routes
app.include_router(api_router, prefix="/api/v1")


async def _health_check_services():
    """Comprehensive health check for all external services."""
    checks = []
    
    # Check database
    from app.core.database import health_check_db
    checks.append(("database", health_check_db()))
    
    # Check Redis
    from app.core.redis_client import health_check_redis
    checks.append(("redis", health_check_redis()))
    
    # Check Kafka
    from app.core.kafka_client import health_check_kafka
    checks.append(("kafka", health_check_kafka()))
    
    # Execute all checks
    results = await asyncio.gather(*[check[1] for check in checks], return_exceptions=True)
    
    for (service, _), result in zip(checks, results):
        if isinstance(result, Exception) or not result:
            raise Exception(f"{service} health check failed: {result}")


async def _check_ml_service():
    """Check ML service health."""
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.ML_SERVICE_URL}/health",
                timeout=5.0
            )
            return response.status_code == 200
    except Exception as e:
        logger.error("ML service health check failed", error=str(e))
        return False


if __name__ == "__main__":
    # Development server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
        access_log=True,
        workers=1 if settings.DEBUG else 4
    )