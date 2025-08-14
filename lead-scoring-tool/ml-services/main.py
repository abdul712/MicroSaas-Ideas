"""
Lead Scoring Tool - ML Services
Machine Learning microservice for lead scoring, model training, and predictions
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Any, Dict, List

import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import structlog

from core.config import get_settings
from core.ml_engine import MLEngine
from core.feature_store import FeatureStore
from core.model_manager import ModelManager
from services.scoring_service import ScoringService
from services.training_service import TrainingService
from api.v1.api import api_router

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = structlog.get_logger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("Starting Lead Scoring ML Services")
    
    # Startup
    try:
        # Initialize ML Engine
        ml_engine = MLEngine()
        await ml_engine.initialize()
        app.state.ml_engine = ml_engine
        
        # Initialize Feature Store
        feature_store = FeatureStore()
        await feature_store.initialize()
        app.state.feature_store = feature_store
        
        # Initialize Model Manager
        model_manager = ModelManager()
        await model_manager.initialize()
        app.state.model_manager = model_manager
        
        # Initialize Services
        app.state.scoring_service = ScoringService(ml_engine, feature_store)
        app.state.training_service = TrainingService(ml_engine, model_manager)
        
        logger.info("ML Services initialized successfully")
        
    except Exception as e:
        logger.error("Failed to start ML services", error=str(e))
        raise
    
    yield
    
    # Shutdown
    try:
        await ml_engine.cleanup()
        await feature_store.cleanup()
        await model_manager.cleanup()
        logger.info("ML Services shutdown complete")
        
    except Exception as e:
        logger.error("Error during ML services shutdown", error=str(e))


# Create FastAPI application
app = FastAPI(
    title="Lead Scoring ML Services",
    description="Machine Learning microservice for lead scoring and model training",
    version="1.0.0",
    openapi_url="/api/v1/openapi.json" if settings.environment != "production" else None,
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health Check Endpoint
@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint"""
    try:
        # Check ML engine status
        ml_status = "healthy" if hasattr(app.state, 'ml_engine') else "unhealthy"
        
        # Check feature store status
        fs_status = "healthy" if hasattr(app.state, 'feature_store') else "unhealthy"
        
        # Check model manager status
        mm_status = "healthy" if hasattr(app.state, 'model_manager') else "unhealthy"
        
        return {
            "status": "healthy" if all([ml_status == "healthy", fs_status == "healthy", mm_status == "healthy"]) else "unhealthy",
            "version": "1.0.0",
            "environment": settings.environment,
            "services": {
                "ml_engine": ml_status,
                "feature_store": fs_status,
                "model_manager": mm_status,
            }
        }
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return {
            "status": "unhealthy",
            "error": str(e)
        }


# Lead Scoring Endpoints
@app.post("/score/lead")
async def score_lead(lead_data: Dict[str, Any]) -> Dict[str, Any]:
    """Score a single lead"""
    try:
        scoring_service = app.state.scoring_service
        result = await scoring_service.score_lead(lead_data)
        return result
    except Exception as e:
        logger.error("Failed to score lead", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to score lead")


@app.post("/score/batch")
async def score_leads_batch(leads_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Score multiple leads in batch"""
    try:
        scoring_service = app.state.scoring_service
        results = await scoring_service.score_leads_batch(leads_data)
        return results
    except Exception as e:
        logger.error("Failed to score leads batch", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to score leads batch")


# Model Training Endpoints
@app.post("/train/model")
async def train_model(
    training_request: Dict[str, Any],
    background_tasks: BackgroundTasks
) -> Dict[str, str]:
    """Start model training"""
    try:
        training_service = app.state.training_service
        task_id = await training_service.start_training(training_request)
        
        background_tasks.add_task(
            training_service.train_model_background,
            task_id,
            training_request
        )
        
        return {"task_id": task_id, "status": "training_started"}
    except Exception as e:
        logger.error("Failed to start model training", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to start model training")


@app.get("/train/status/{task_id}")
async def get_training_status(task_id: str) -> Dict[str, Any]:
    """Get model training status"""
    try:
        training_service = app.state.training_service
        status = await training_service.get_training_status(task_id)
        return status
    except Exception as e:
        logger.error("Failed to get training status", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get training status")


# Model Management Endpoints
@app.get("/models")
async def list_models() -> List[Dict[str, Any]]:
    """List available models"""
    try:
        model_manager = app.state.model_manager
        models = await model_manager.list_models()
        return models
    except Exception as e:
        logger.error("Failed to list models", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to list models")


@app.post("/models/{model_id}/deploy")
async def deploy_model(model_id: str) -> Dict[str, str]:
    """Deploy a trained model"""
    try:
        model_manager = app.state.model_manager
        result = await model_manager.deploy_model(model_id)
        return result
    except Exception as e:
        logger.error("Failed to deploy model", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to deploy model")


@app.get("/models/{model_id}/performance")
async def get_model_performance(model_id: str) -> Dict[str, Any]:
    """Get model performance metrics"""
    try:
        model_manager = app.state.model_manager
        metrics = await model_manager.get_model_performance(model_id)
        return metrics
    except Exception as e:
        logger.error("Failed to get model performance", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get model performance")


# Feature Engineering Endpoints
@app.post("/features/extract")
async def extract_features(lead_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract features from lead data"""
    try:
        feature_store = app.state.feature_store
        features = await feature_store.extract_features(lead_data)
        return features
    except Exception as e:
        logger.error("Failed to extract features", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to extract features")


@app.get("/features/definitions")
async def get_feature_definitions() -> List[Dict[str, Any]]:
    """Get available feature definitions"""
    try:
        feature_store = app.state.feature_store
        definitions = await feature_store.get_feature_definitions()
        return definitions
    except Exception as e:
        logger.error("Failed to get feature definitions", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get feature definitions")


# API Routes
app.include_router(api_router, prefix="/api/v1")


# Root endpoint
@app.get("/")
async def root() -> Dict[str, str]:
    """Root endpoint"""
    return {
        "message": "Lead Scoring ML Services",
        "version": "1.0.0",
        "docs": "/docs" if settings.environment != "production" else "disabled",
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.environment == "development",
        log_config=None,
    )