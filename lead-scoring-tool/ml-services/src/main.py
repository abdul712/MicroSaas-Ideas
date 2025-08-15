"""
Lead Scoring Tool - ML Services API
Machine Learning microservice for scoring, training, and model management
"""

import os
import time
import asyncio
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

import structlog
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram, generate_latest
from starlette.responses import Response

from src.core.config import get_settings
from src.core.logging import setup_logging
from src.services.model_manager import ModelManager
from src.services.scoring_service import ScoringService
from src.services.training_service import TrainingService
from src.services.feature_service import FeatureService
from src.services.health_service import HealthService
from src.api.v1.router import api_router

# Initialize settings and logging
settings = get_settings()
logger = setup_logging()

# Prometheus metrics
REQUEST_COUNT = Counter(
    'ml_requests_total',
    'Total ML service requests',
    ['method', 'endpoint', 'status']
)
REQUEST_DURATION = Histogram(
    'ml_request_duration_seconds',
    'ML service request duration',
    ['method', 'endpoint']
)
SCORING_DURATION = Histogram(
    'lead_scoring_duration_seconds',
    'Lead scoring operation duration'
)
MODEL_PREDICTIONS = Counter(
    'model_predictions_total',
    'Total model predictions',
    ['model_name', 'model_version']
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting Lead Scoring ML Services")
    
    # Initialize services
    try:
        model_manager = ModelManager()
        await model_manager.initialize()
        
        scoring_service = ScoringService(model_manager)
        await scoring_service.initialize()
        
        training_service = TrainingService(model_manager)
        await training_service.initialize()
        
        feature_service = FeatureService()
        await feature_service.initialize()
        
        health_service = HealthService()
        await health_service.initialize()
        
        # Store services in app state
        app.state.model_manager = model_manager
        app.state.scoring_service = scoring_service
        app.state.training_service = training_service
        app.state.feature_service = feature_service
        app.state.health_service = health_service
        
        # Load default models
        await model_manager.load_default_models()
        
        logger.info("ML Services initialized successfully")
        
    except Exception as e:
        logger.error("Failed to initialize ML services", exc_info=e)
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down ML Services")
    
    # Cleanup resources
    if hasattr(app.state, 'model_manager'):
        await app.state.model_manager.cleanup()
    
    logger.info("ML Services shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="Lead Scoring ML Services",
    description="Machine Learning microservice for AI-powered lead scoring and qualification",
    version="1.0.0",
    docs_url="/docs" if settings.ENV != "production" else None,
    redoc_url="/redoc" if settings.ENV != "production" else None,
    lifespan=lifespan,
    openapi_tags=[
        {
            "name": "scoring",
            "description": "Lead scoring and prediction operations"
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
            "name": "explanations",
            "description": "Model explainability and interpretability"
        },
        {
            "name": "health",
            "description": "Health checks and monitoring"
        }
    ]
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)


# Dependency injection
def get_model_manager() -> ModelManager:
    """Get model manager instance"""
    return app.state.model_manager


def get_scoring_service() -> ScoringService:
    """Get scoring service instance"""
    return app.state.scoring_service


def get_training_service() -> TrainingService:
    """Get training service instance"""
    return app.state.training_service


def get_feature_service() -> FeatureService:
    """Get feature service instance"""
    return app.state.feature_service


def get_health_service() -> HealthService:
    """Get health service instance"""
    return app.state.health_service


# Health check endpoints
@app.get("/health", tags=["health"])
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "service": "ml-services",
        "timestamp": time.time()
    }


@app.get("/health/detailed", tags=["health"])
async def detailed_health_check(
    health_service: HealthService = Depends(get_health_service)
):
    """Detailed health check with service status"""
    health_status = await health_service.check_all()
    
    status_code = 200 if health_status["healthy"] else 503
    
    return JSONResponse(
        status_code=status_code,
        content=health_status
    )


@app.get("/health/models", tags=["health"])
async def models_health_check(
    model_manager: ModelManager = Depends(get_model_manager)
):
    """Check health of loaded models"""
    try:
        model_status = await model_manager.get_model_status()
        return {
            "status": "healthy",
            "models": model_status,
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error("Model health check failed", exc_info=e)
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": time.time()
            }
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
    """ML service information"""
    return {
        "name": "Lead Scoring ML Services",
        "version": "1.0.0",
        "environment": settings.ENV,
        "features": {
            "real_time_scoring": True,
            "batch_scoring": True,
            "model_training": True,
            "feature_engineering": True,
            "explainable_ai": True,
            "model_monitoring": True,
            "auto_retraining": True
        },
        "supported_models": [
            "xgboost",
            "random_forest",
            "logistic_regression",
            "neural_network",
            "ensemble"
        ],
        "ml_frameworks": [
            "scikit-learn",
            "xgboost",
            "tensorflow",
            "lightgbm",
            "catboost"
        ]
    }


# Root endpoint
@app.get("/", tags=["health"])
async def root():
    """Root endpoint with service information"""
    return {
        "message": "Lead Scoring ML Services",
        "version": "1.0.0",
        "docs": "/docs" if settings.ENV != "production" else None,
        "health": "/health",
        "status": "operational"
    }


# Quick scoring endpoint for testing
@app.post("/score", tags=["scoring"])
async def quick_score(
    lead_data: Dict[str, Any],
    model_name: Optional[str] = None,
    scoring_service: ScoringService = Depends(get_scoring_service)
):
    """Quick lead scoring endpoint for testing"""
    try:
        start_time = time.time()
        
        # Score the lead
        result = await scoring_service.score_lead(
            lead_data=lead_data,
            model_name=model_name
        )
        
        # Record metrics
        SCORING_DURATION.observe(time.time() - start_time)
        MODEL_PREDICTIONS.labels(
            model_name=result.get("model_name", "unknown"),
            model_version=result.get("model_version", "unknown")
        ).inc()
        
        return result
        
    except Exception as e:
        logger.error("Scoring failed", exc_info=e, lead_data=lead_data)
        raise HTTPException(status_code=500, detail=str(e))


# Batch scoring endpoint
@app.post("/score/batch", tags=["scoring"])
async def batch_score(
    leads_data: List[Dict[str, Any]],
    model_name: Optional[str] = None,
    background_tasks: BackgroundTasks = None,
    scoring_service: ScoringService = Depends(get_scoring_service)
):
    """Batch lead scoring endpoint"""
    try:
        if len(leads_data) > settings.MAX_BATCH_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Batch size too large. Maximum allowed: {settings.MAX_BATCH_SIZE}"
            )
        
        start_time = time.time()
        
        # Score leads in batch
        results = await scoring_service.score_leads_batch(
            leads_data=leads_data,
            model_name=model_name
        )
        
        # Record metrics
        SCORING_DURATION.observe(time.time() - start_time)
        
        return {
            "results": results,
            "count": len(results),
            "processing_time": time.time() - start_time
        }
        
    except Exception as e:
        logger.error("Batch scoring failed", exc_info=e)
        raise HTTPException(status_code=500, detail=str(e))


# Model management endpoints
@app.get("/models", tags=["models"])
async def list_models(
    model_manager: ModelManager = Depends(get_model_manager)
):
    """List available models"""
    try:
        models = await model_manager.list_models()
        return {"models": models}
    except Exception as e:
        logger.error("Failed to list models", exc_info=e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/models/{model_name}", tags=["models"])
async def get_model_info(
    model_name: str,
    model_manager: ModelManager = Depends(get_model_manager)
):
    """Get model information"""
    try:
        model_info = await model_manager.get_model_info(model_name)
        if not model_info:
            raise HTTPException(status_code=404, detail="Model not found")
        return model_info
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get model info", exc_info=e, model_name=model_name)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/models/{model_name}/load", tags=["models"])
async def load_model(
    model_name: str,
    model_version: Optional[str] = None,
    model_manager: ModelManager = Depends(get_model_manager)
):
    """Load a specific model"""
    try:
        success = await model_manager.load_model(model_name, model_version)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to load model")
        
        return {
            "message": f"Model {model_name} loaded successfully",
            "model_name": model_name,
            "model_version": model_version
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to load model", exc_info=e, model_name=model_name)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/models/{model_name}/unload", tags=["models"])
async def unload_model(
    model_name: str,
    model_manager: ModelManager = Depends(get_model_manager)
):
    """Unload a model from memory"""
    try:
        success = await model_manager.unload_model(model_name)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to unload model")
        
        return {
            "message": f"Model {model_name} unloaded successfully",
            "model_name": model_name
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to unload model", exc_info=e, model_name=model_name)
        raise HTTPException(status_code=500, detail=str(e))


# Training endpoints
@app.post("/train", tags=["training"])
async def start_training(
    training_config: Dict[str, Any],
    background_tasks: BackgroundTasks,
    training_service: TrainingService = Depends(get_training_service)
):
    """Start model training"""
    try:
        # Validate training config
        if not training_config.get("model_type"):
            raise HTTPException(status_code=400, detail="model_type is required")
        
        # Start training in background
        training_id = await training_service.start_training(training_config)
        background_tasks.add_task(
            training_service.run_training_pipeline,
            training_id,
            training_config
        )
        
        return {
            "message": "Training started",
            "training_id": training_id,
            "status": "started"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to start training", exc_info=e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/training/{training_id}/status", tags=["training"])
async def get_training_status(
    training_id: str,
    training_service: TrainingService = Depends(get_training_service)
):
    """Get training job status"""
    try:
        status = await training_service.get_training_status(training_id)
        if not status:
            raise HTTPException(status_code=404, detail="Training job not found")
        return status
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get training status", exc_info=e, training_id=training_id)
        raise HTTPException(status_code=500, detail=str(e))


# Feature engineering endpoints
@app.post("/features/extract", tags=["features"])
async def extract_features(
    lead_data: Dict[str, Any],
    feature_service: FeatureService = Depends(get_feature_service)
):
    """Extract features from lead data"""
    try:
        features = await feature_service.extract_features(lead_data)
        return {"features": features}
    except Exception as e:
        logger.error("Feature extraction failed", exc_info=e)
        raise HTTPException(status_code=500, detail=str(e))


# Include API routes
app.include_router(api_router, prefix="/api/v1")


# Request logging middleware
@app.middleware("http")
async def log_requests(request, call_next):
    """Log all requests"""
    start_time = time.time()
    
    # Log request
    logger.info(
        "ML request started",
        method=request.method,
        path=request.url.path,
        client_ip=request.client.host if request.client else None
    )
    
    # Process request
    response = await call_next(request)
    
    # Log response and record metrics
    process_time = time.time() - start_time
    logger.info(
        "ML request completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        process_time=process_time
    )
    
    # Record metrics
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    REQUEST_DURATION.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(process_time)
    
    # Add timing header
    response.headers["X-Process-Time"] = str(process_time)
    
    return response


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.ENV == "development",
        log_config=None  # Use our custom logging
    )