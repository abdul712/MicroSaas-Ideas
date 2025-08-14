"""
FraudShield ML Service
Machine Learning service for real-time fraud detection and risk assessment
"""

import asyncio
import logging
import sys
import time
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional

import structlog
import uvicorn
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram, Gauge

from app.core.config import get_settings
from app.core.logging import setup_logging
from app.core.database import init_db, close_db
from app.core.redis_client import init_redis, close_redis
from app.ml.model_manager import ModelManager
from app.ml.feature_store import FeatureStore
from app.ml.fraud_detector import FraudDetector
from app.api.v1 import api_router

# Initialize settings
settings = get_settings()

# Setup structured logging
setup_logging()
logger = structlog.get_logger(__name__)

# Prometheus metrics
REQUEST_COUNT = Counter(
    'ml_service_requests_total',
    'Total ML service requests',
    ['method', 'endpoint', 'status']
)
INFERENCE_DURATION = Histogram(
    'ml_service_inference_duration_seconds',
    'ML model inference duration',
    ['model_type']
)
MODEL_ACCURACY = Gauge(
    'ml_service_model_accuracy',
    'Current model accuracy',
    ['model_name']
)
FEATURE_EXTRACTION_DURATION = Histogram(
    'ml_service_feature_extraction_duration_seconds',
    'Feature extraction duration'
)

# Global instances
model_manager: Optional[ModelManager] = None
feature_store: Optional[FeatureStore] = None
fraud_detector: Optional[FraudDetector] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for ML service."""
    global model_manager, feature_store, fraud_detector
    
    logger.info("Starting FraudShield ML Service")
    
    try:
        # Initialize database connection
        await init_db()
        logger.info("Database connection initialized")
        
        # Initialize Redis connection  
        await init_redis()
        logger.info("Redis connection initialized")
        
        # Initialize Model Manager
        model_manager = ModelManager()
        await model_manager.initialize()
        logger.info("Model manager initialized")
        
        # Initialize Feature Store
        feature_store = FeatureStore()
        await feature_store.initialize()
        logger.info("Feature store initialized")
        
        # Initialize Fraud Detector
        fraud_detector = FraudDetector(model_manager, feature_store)
        await fraud_detector.initialize()
        logger.info("Fraud detector initialized")
        
        # Load and validate models
        await model_manager.load_models()
        logger.info("ML models loaded successfully")
        
        # Set up model monitoring
        await _setup_model_monitoring()
        logger.info("Model monitoring configured")
        
        logger.info("ML Service startup completed")
        
    except Exception as e:
        logger.error("Failed to start ML service", error=str(e))
        sys.exit(1)
    
    yield
    
    # Shutdown
    logger.info("Shutting down FraudShield ML Service")
    
    try:
        if fraud_detector:
            await fraud_detector.cleanup()
            
        if feature_store:
            await feature_store.cleanup()
            
        if model_manager:
            await model_manager.cleanup()
            
        await close_redis()
        logger.info("Redis connection closed")
        
        await close_db()
        logger.info("Database connection closed")
        
        logger.info("ML Service shutdown completed")
        
    except Exception as e:
        logger.error("Error during ML service shutdown", error=str(e))


# Create FastAPI application
app = FastAPI(
    title="FraudShield ML Service",
    description="Machine Learning service for real-time fraud detection and risk assessment",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS configuration
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Middleware for request logging and metrics."""
    start_time = time.time()
    request_id = f"ml_req_{int(time.time() * 1000000)}"
    
    logger.info(
        "ML request started",
        request_id=request_id,
        method=request.method,
        url=str(request.url)
    )
    
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        
        # Update metrics
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code
        ).inc()
        
        logger.info(
            "ML request completed",
            request_id=request_id,
            status_code=response.status_code,
            duration=f"{duration:.3f}s"
        )
        
        return response
        
    except Exception as e:
        duration = time.time() - start_time
        
        logger.error(
            "ML request failed",
            request_id=request_id,
            error=str(e),
            duration=f"{duration:.3f}s"
        )
        
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status=500
        ).inc()
        
        raise


@app.get("/health")
async def health_check():
    """Comprehensive health check for ML service."""
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "service": "ml-service",
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
        
        # Check models
        if model_manager:
            models_healthy = await model_manager.health_check()
            health_status["checks"]["models"] = "healthy" if models_healthy else "unhealthy"
            health_status["model_count"] = await model_manager.get_model_count()
        
        # Check feature store
        if feature_store:
            feature_store_healthy = await feature_store.health_check()
            health_status["checks"]["feature_store"] = "healthy" if feature_store_healthy else "unhealthy"
        
        # Overall health
        all_healthy = all(
            status == "healthy" 
            for status in health_status["checks"].values()
        )
        
        if not all_healthy:
            health_status["status"] = "degraded"
            
    except Exception as e:
        logger.error("ML service health check failed", error=str(e))
        health_status["status"] = "unhealthy"
        health_status["error"] = str(e)
    
    return health_status


@app.get("/health/models")
async def models_health_check():
    """Check health of all ML models."""
    if not model_manager:
        raise HTTPException(status_code=503, detail="Model manager not initialized")
    
    try:
        model_status = await model_manager.get_model_status()
        return {
            "status": "healthy" if model_status["all_healthy"] else "degraded",
            "models": model_status["models"],
            "total_models": model_status["total"],
            "healthy_models": model_status["healthy"],
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error("Model health check failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/fraud")
async def predict_fraud(request: Dict[str, Any], background_tasks: BackgroundTasks):
    """Main fraud detection prediction endpoint."""
    if not fraud_detector:
        raise HTTPException(status_code=503, detail="Fraud detector not initialized")
    
    start_time = time.time()
    
    try:
        # Perform fraud detection
        result = await fraud_detector.assess_fraud_risk(request)
        
        # Record inference time
        inference_duration = time.time() - start_time
        INFERENCE_DURATION.labels(model_type="ensemble").observe(inference_duration)
        
        # Log successful prediction
        logger.info(
            "Fraud prediction completed",
            transaction_id=request.get("transaction_id"),
            risk_score=result.get("risk_score"),
            decision=result.get("decision"),
            duration=f"{inference_duration:.3f}s"
        )
        
        # Schedule background tasks for analytics
        background_tasks.add_task(
            _record_prediction_analytics,
            request,
            result,
            inference_duration
        )
        
        return result
        
    except Exception as e:
        logger.error("Fraud prediction failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/features/extract")
async def extract_features(request: Dict[str, Any]):
    """Extract features from transaction data."""
    if not feature_store:
        raise HTTPException(status_code=503, detail="Feature store not initialized")
    
    start_time = time.time()
    
    try:
        # Extract features
        features = await feature_store.extract_features(request)
        
        # Record extraction time
        extraction_duration = time.time() - start_time
        FEATURE_EXTRACTION_DURATION.observe(extraction_duration)
        
        logger.info(
            "Feature extraction completed",
            transaction_id=request.get("transaction_id"),
            feature_count=len(features),
            duration=f"{extraction_duration:.3f}s"
        )
        
        return {
            "features": features,
            "feature_count": len(features),
            "extraction_time": extraction_duration
        }
        
    except Exception as e:
        logger.error("Feature extraction failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/models/status")
async def get_models_status():
    """Get status of all loaded models."""
    if not model_manager:
        raise HTTPException(status_code=503, detail="Model manager not initialized")
    
    try:
        status = await model_manager.get_detailed_status()
        return status
    except Exception as e:
        logger.error("Failed to get model status", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/models/retrain/{model_name}")
async def retrain_model(model_name: str, background_tasks: BackgroundTasks):
    """Trigger model retraining."""
    if not model_manager:
        raise HTTPException(status_code=503, detail="Model manager not initialized")
    
    try:
        # Schedule retraining as background task
        background_tasks.add_task(_retrain_model_task, model_name)
        
        logger.info("Model retraining scheduled", model_name=model_name)
        
        return {
            "message": f"Retraining scheduled for model: {model_name}",
            "status": "scheduled",
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error("Failed to schedule model retraining", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint."""
    from prometheus_client import generate_latest
    return generate_latest()


@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": "FraudShield ML Service",
        "version": "1.0.0",
        "description": "Machine Learning service for real-time fraud detection",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "predict": "/predict/fraud",
            "features": "/features/extract",
            "models": "/models/status",
            "metrics": "/metrics",
            "docs": "/docs"
        }
    }


# Include API routes
app.include_router(api_router, prefix="/api/v1")


async def _setup_model_monitoring():
    """Set up monitoring for model performance."""
    if not model_manager:
        return
    
    try:
        # Update model accuracy metrics
        model_accuracies = await model_manager.get_model_accuracies()
        for model_name, accuracy in model_accuracies.items():
            MODEL_ACCURACY.labels(model_name=model_name).set(accuracy)
    except Exception as e:
        logger.error("Failed to set up model monitoring", error=str(e))


async def _record_prediction_analytics(request: Dict[str, Any], result: Dict[str, Any], duration: float):
    """Record prediction analytics for monitoring."""
    try:
        # This would record analytics to InfluxDB or similar
        # Implementation depends on your analytics requirements
        pass
    except Exception as e:
        logger.error("Failed to record prediction analytics", error=str(e))


async def _retrain_model_task(model_name: str):
    """Background task for model retraining."""
    try:
        if model_manager:
            await model_manager.retrain_model(model_name)
            logger.info("Model retraining completed", model_name=model_name)
    except Exception as e:
        logger.error("Model retraining failed", model_name=model_name, error=str(e))


if __name__ == "__main__":
    # Development server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.DEBUG,
        log_level="info",
        workers=1 if settings.DEBUG else 2
    )