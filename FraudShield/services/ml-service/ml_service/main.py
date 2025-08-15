"""
FraudShield ML Service
High-performance machine learning inference service for fraud detection.
"""

import asyncio
import time
from contextlib import asynccontextmanager
from typing import Dict, Any, List

import structlog
import numpy as np
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

from ml_service.core.config import get_settings
from ml_service.models.ensemble import EnsembleClassifier
from ml_service.models.behavioral import BehavioralAnalyzer
from ml_service.models.feature_store import FeatureStore
from ml_service.models.model_manager import ModelManager
from ml_service.api.v1 import prediction, training, models
from ml_service.core.logging import setup_logging

# Initialize structured logging
setup_logging()
logger = structlog.get_logger(__name__)

# Prometheus metrics
PREDICTION_COUNT = Counter('ml_prediction_requests_total', 'Total prediction requests', ['model_type'])
PREDICTION_DURATION = Histogram('ml_prediction_duration_seconds', 'Prediction duration')
MODEL_ACCURACY = Histogram('ml_model_accuracy', 'Model accuracy metrics', ['model_name'])
FEATURE_EXTRACTION_TIME = Histogram('ml_feature_extraction_seconds', 'Feature extraction time')

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for ML service startup/shutdown."""
    settings = get_settings()
    
    # Startup
    logger.info("Starting FraudShield ML Service", version="2.1.0")
    
    try:
        # Initialize feature store
        feature_store = FeatureStore(settings.REDIS_URL)
        await feature_store.initialize()
        app.state.feature_store = feature_store
        logger.info("Feature store initialized")
        
        # Initialize model manager
        model_manager = ModelManager(settings.MODEL_STORE_PATH)
        await model_manager.initialize()
        app.state.model_manager = model_manager
        logger.info("Model manager initialized")
        
        # Initialize ensemble classifier
        ensemble = EnsembleClassifier(model_manager)
        await ensemble.initialize()
        app.state.ensemble = ensemble
        logger.info("Ensemble classifier initialized")
        
        # Initialize behavioral analyzer
        behavioral_analyzer = BehavioralAnalyzer(feature_store)
        await behavioral_analyzer.initialize()
        app.state.behavioral_analyzer = behavioral_analyzer
        logger.info("Behavioral analyzer initialized")
        
        # Load pre-trained models
        await model_manager.load_production_models()
        logger.info("Production models loaded")
        
        # Warm up models with dummy prediction
        await _warmup_models(ensemble, behavioral_analyzer)
        
        logger.info("ML service startup completed successfully")
        
    except Exception as e:
        logger.error("ML service startup failed", error=str(e))
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down ML service")
    
    # Cleanup resources
    if hasattr(app.state, 'feature_store'):
        await app.state.feature_store.close()
    
    if hasattr(app.state, 'model_manager'):
        await app.state.model_manager.cleanup()
    
    logger.info("ML service shutdown completed")

async def _warmup_models(ensemble: EnsembleClassifier, behavioral_analyzer: BehavioralAnalyzer):
    """Warm up models with dummy predictions to reduce cold start latency."""
    try:
        logger.info("Warming up ML models")
        
        # Create dummy feature vector
        dummy_features = np.random.random(50).astype(np.float32)
        
        # Warm up ensemble model
        await ensemble.predict(dummy_features)
        
        # Warm up behavioral analyzer
        await behavioral_analyzer.analyze_behavior({
            'customer_id': 'dummy_customer',
            'transaction_history': [],
            'behavioral_features': dummy_features[:20]
        })
        
        logger.info("Model warmup completed")
        
    except Exception as e:
        logger.warning("Model warmup failed", error=str(e))

# Create FastAPI application
app = FastAPI(
    title="FraudShield ML Service",
    description="High-Performance Machine Learning Service for Fraud Detection",
    version="2.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Include routers
app.include_router(prediction.router, prefix="/api/v1", tags=["Prediction"])
app.include_router(training.router, prefix="/api/v1", tags=["Training"])
app.include_router(models.router, prefix="/api/v1", tags=["Models"])

@app.get("/health")
async def health_check():
    """Comprehensive health check for ML service."""
    try:
        health_status = {
            "status": "healthy",
            "service": "fraudshield-ml-service",
            "version": "2.1.0",
            "timestamp": time.time(),
            "components": {}
        }
        
        # Check feature store
        if hasattr(app.state, 'feature_store'):
            try:
                await app.state.feature_store.health_check()
                health_status["components"]["feature_store"] = "healthy"
            except Exception:
                health_status["components"]["feature_store"] = "unhealthy"
                health_status["status"] = "degraded"
        
        # Check model manager
        if hasattr(app.state, 'model_manager'):
            model_health = await app.state.model_manager.health_check()
            health_status["components"]["model_manager"] = "healthy" if model_health else "degraded"
            if not model_health:
                health_status["status"] = "degraded"
        
        # Check ensemble model
        if hasattr(app.state, 'ensemble'):
            ensemble_health = app.state.ensemble.is_ready()
            health_status["components"]["ensemble"] = "healthy" if ensemble_health else "not_ready"
            if not ensemble_health:
                health_status["status"] = "degraded"
        
        return health_status
        
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.post("/api/v1/predict/fraud")
async def predict_fraud(
    features: List[float],
    background_tasks: BackgroundTasks
):
    """
    Predict fraud probability for a transaction.
    
    Args:
        features: Extracted transaction features
        background_tasks: FastAPI background tasks
        
    Returns:
        Fraud prediction with probability and confidence
    """
    start_time = time.time()
    
    try:
        # Validate input
        if not features or len(features) == 0:
            raise HTTPException(status_code=400, detail="Features array cannot be empty")
        
        if len(features) > 1000:  # Reasonable upper limit
            raise HTTPException(status_code=400, detail="Too many features")
        
        # Convert to numpy array
        feature_array = np.array(features, dtype=np.float32).reshape(1, -1)
        
        # Get ensemble prediction
        if not hasattr(app.state, 'ensemble'):
            raise HTTPException(status_code=503, detail="ML models not available")
        
        ensemble_result = await app.state.ensemble.predict(feature_array[0])
        
        # Record metrics
        processing_time = time.time() - start_time
        PREDICTION_DURATION.observe(processing_time)
        PREDICTION_COUNT.labels(model_type="ensemble").inc()
        
        # Prepare response
        result = {
            "fraud_probability": float(ensemble_result["probability"]),
            "confidence": float(ensemble_result["confidence"]),
            "risk_score": float(ensemble_result["probability"] * 100),
            "model_version": ensemble_result.get("model_version", "2.1.0"),
            "processing_time_ms": int(processing_time * 1000),
            "individual_predictions": ensemble_result.get("individual_predictions", {}),
            "feature_importance": ensemble_result.get("feature_importance", {}),
            "timestamp": time.time()
        }
        
        # Log prediction for monitoring
        background_tasks.add_task(
            _log_prediction,
            features=features,
            result=result,
            processing_time=processing_time
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(
            "Fraud prediction failed",
            error=str(e),
            processing_time_ms=int(processing_time * 1000)
        )
        raise HTTPException(status_code=500, detail="Prediction failed")

@app.post("/api/v1/analyze/behavior")
async def analyze_behavior(
    customer_id: str,
    transaction_history: List[Dict[str, Any]],
    behavioral_features: List[float]
):
    """
    Analyze customer behavioral patterns for anomaly detection.
    
    Args:
        customer_id: Customer identifier
        transaction_history: Historical transaction data
        behavioral_features: Extracted behavioral features
        
    Returns:
        Behavioral analysis with anomaly score
    """
    start_time = time.time()
    
    try:
        if not hasattr(app.state, 'behavioral_analyzer'):
            raise HTTPException(status_code=503, detail="Behavioral analyzer not available")
        
        # Prepare analysis data
        analysis_data = {
            'customer_id': customer_id,
            'transaction_history': transaction_history,
            'behavioral_features': np.array(behavioral_features, dtype=np.float32)
        }
        
        # Perform behavioral analysis
        behavioral_result = await app.state.behavioral_analyzer.analyze_behavior(analysis_data)
        
        processing_time = time.time() - start_time
        
        return {
            "customer_id": customer_id,
            "behavioral_score": behavioral_result["behavioral_score"],
            "anomaly_probability": behavioral_result["anomaly_probability"],
            "risk_indicators": behavioral_result.get("risk_indicators", []),
            "confidence": behavioral_result.get("confidence", 0.0),
            "processing_time_ms": int(processing_time * 1000),
            "timestamp": time.time()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(
            "Behavioral analysis failed",
            customer_id=customer_id,
            error=str(e),
            processing_time_ms=int(processing_time * 1000)
        )
        raise HTTPException(status_code=500, detail="Behavioral analysis failed")

@app.get("/api/v1/models/status")
async def get_model_status():
    """Get status of all loaded models."""
    try:
        if not hasattr(app.state, 'model_manager'):
            raise HTTPException(status_code=503, detail="Model manager not available")
        
        status = await app.state.model_manager.get_model_status()
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get model status", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get model status")

@app.post("/api/v1/models/reload")
async def reload_models():
    """Reload all models from storage."""
    try:
        if not hasattr(app.state, 'model_manager'):
            raise HTTPException(status_code=503, detail="Model manager not available")
        
        await app.state.model_manager.reload_models()
        
        # Reinitialize ensemble with new models
        if hasattr(app.state, 'ensemble'):
            await app.state.ensemble.reload_models()
        
        return {"status": "success", "message": "Models reloaded successfully"}
        
    except Exception as e:
        logger.error("Failed to reload models", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to reload models")

async def _log_prediction(features: List[float], result: Dict[str, Any], processing_time: float):
    """Log prediction for monitoring and analysis."""
    try:
        logger.info(
            "ML prediction completed",
            fraud_probability=result["fraud_probability"],
            confidence=result["confidence"],
            processing_time_ms=int(processing_time * 1000),
            feature_count=len(features)
        )
    except Exception as e:
        logger.warning("Failed to log prediction", error=str(e))

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    """Custom HTTP exception handler."""
    logger.warning(
        "HTTP exception in ML service",
        path=request.url.path,
        status_code=exc.status_code,
        detail=exc.detail
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    """General exception handler for unhandled errors."""
    logger.error(
        "Unhandled exception in ML service",
        path=request.url.path,
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
        "ml_service.main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.ENVIRONMENT == "development",
        workers=2 if settings.ENVIRONMENT == "production" else 1
    )