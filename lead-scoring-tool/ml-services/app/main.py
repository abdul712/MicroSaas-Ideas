"""
ML Services - FastAPI Machine Learning Microservice
Real-time lead scoring with TensorFlow and scikit-learn
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog
from prometheus_client import make_asgi_app, Counter, Histogram, Gauge
import time

from app.core.config import settings
from app.core.model_manager import init_models, close_models
from app.core.redis import init_redis, close_redis
from app.core.exceptions import MLServiceException
from app.api.v1 import api_router
from app.middleware.monitoring import MLMonitoringMiddleware

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

# Prometheus Metrics for ML Service
PREDICTION_COUNT = Counter(
    "ml_predictions_total", 
    "Total ML predictions", 
    ["model_type", "organization", "status"]
)
PREDICTION_DURATION = Histogram(
    "ml_prediction_duration_seconds", 
    "ML prediction duration",
    ["model_type"]
)
MODEL_ACCURACY = Gauge(
    "ml_model_accuracy", 
    "Current model accuracy",
    ["model_type", "version"]
)
ACTIVE_MODELS = Gauge(
    "ml_models_loaded", 
    "Number of loaded models"
)
FEATURE_COMPUTATION_TIME = Histogram(
    "ml_feature_computation_seconds", 
    "Feature computation time"
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager for ML service startup and shutdown."""
    logger.info("Starting ML Services")
    
    # Initialize Redis for caching and real-time features
    await init_redis()
    logger.info("Redis initialized")
    
    # Initialize and load ML models
    await init_models()
    logger.info("ML models loaded")
    
    # Log startup completion
    logger.info(
        "ML Services started successfully",
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT
    )
    
    yield
    
    # Cleanup on shutdown
    logger.info("Shutting down ML Services")
    await close_models()
    await close_redis()
    logger.info("ML Services shutdown completed")


# Create FastAPI application
app = FastAPI(
    title="Lead Scoring ML API",
    description="Real-time machine learning service for lead scoring and prediction",
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
    openapi_tags=[
        {
            "name": "scoring",
            "description": "Real-time lead scoring operations"
        },
        {
            "name": "models",
            "description": "Model management and versioning"
        },
        {
            "name": "training",
            "description": "Model training and evaluation"
        },
        {
            "name": "features",
            "description": "Feature engineering and extraction"
        },
        {
            "name": "predictions",
            "description": "Batch prediction operations"
        },
        {
            "name": "explanations",
            "description": "Model interpretability and explanations"
        }
    ]
)

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Add ML Monitoring Middleware
app.add_middleware(MLMonitoringMiddleware)


# Exception Handlers
@app.exception_handler(MLServiceException)
async def ml_service_exception_handler(request: Request, exc: MLServiceException):
    """Handle ML service specific exceptions."""
    logger.error(
        "ML service exception occurred",
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
        "Unhandled ML service exception occurred",
        error=str(exc),
        path=request.url.path,
        method=request.method
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_ml_error",
            "message": "An internal ML service error occurred"
        }
    )


# Health Check Endpoints
@app.get("/health", tags=["health"])
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "lead-scoring-ml",
        "version": settings.APP_VERSION,
        "timestamp": time.time()
    }


@app.get("/health/detailed", tags=["health"])
async def detailed_health_check():
    """Detailed health check with model and dependency status."""
    from app.core.model_manager import get_model_status
    from app.core.redis import get_redis_status
    
    health_status = {
        "status": "healthy",
        "service": "lead-scoring-ml",
        "version": settings.APP_VERSION,
        "timestamp": time.time(),
        "dependencies": {
            "redis": await get_redis_status(),
            "models": await get_model_status(),
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


# Model Status Endpoint
@app.get("/models/status", tags=["models"])
async def model_status():
    """Get status of all loaded models."""
    from app.core.model_manager import get_loaded_models
    
    models = await get_loaded_models()
    return {
        "loaded_models": len(models),
        "models": [
            {
                "name": model.name,
                "version": model.version,
                "type": model.model_type,
                "accuracy": model.accuracy,
                "loaded_at": model.loaded_at.isoformat() if model.loaded_at else None,
                "last_used": model.last_used.isoformat() if model.last_used else None
            }
            for model in models
        ]
    }


# Include API Routes
app.include_router(
    api_router,
    prefix=settings.API_V1_STR
)


# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """Root endpoint with ML service information."""
    return {
        "service": "Lead Scoring ML API",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "docs_url": "/docs" if settings.DEBUG else None,
        "health_check": "/health",
        "api_prefix": settings.API_V1_STR,
        "capabilities": [
            "real_time_scoring",
            "batch_predictions", 
            "model_explanations",
            "feature_importance",
            "model_training",
            "model_evaluation"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.DEBUG,
        access_log=True
    )