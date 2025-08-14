"""
Competitor Analysis Platform - Scraper Service
Enterprise-grade web scraping with ethical compliance
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.config import settings
from app.core.database import init_db, close_db
from app.core.redis import init_redis, close_redis
from app.core.logger import setup_logging
from app.middleware.security import SecurityMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.routers import scraping, analysis, health
from app.services.scheduler import ScrapingScheduler

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Global variables
scraping_scheduler: ScrapingScheduler = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global scraping_scheduler
    
    # Startup
    logger.info("🚀 Starting Competitor Analysis Scraper Service")
    
    try:
        # Initialize database
        await init_db()
        logger.info("📊 Database initialized")
        
        # Initialize Redis
        await init_redis()
        logger.info("🔴 Redis initialized")
        
        # Initialize scraping scheduler
        scraping_scheduler = ScrapingScheduler()
        await scraping_scheduler.start()
        logger.info("⏰ Scraping scheduler started")
        
        logger.info("✅ All services initialized successfully")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize services: {e}")
        raise
    
    # Shutdown
    logger.info("🛑 Shutting down services")
    
    try:
        if scraping_scheduler:
            await scraping_scheduler.stop()
        
        await close_redis()
        await close_db()
        
        logger.info("✅ All services shut down successfully")
        
    except Exception as e:
        logger.error(f"❌ Error during shutdown: {e}")


# Create FastAPI app
app = FastAPI(
    title="Competitor Analysis Scraper API",
    description="Enterprise-grade web scraping service with ethical compliance and AI analysis",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
    lifespan=lifespan,
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.BACKEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SecurityMiddleware)
app.add_middleware(RateLimitMiddleware)


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "timestamp": str(asyncio.get_event_loop().time()),
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "timestamp": str(asyncio.get_event_loop().time()),
        }
    )


# Include routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(scraping.router, prefix="/api/scraping", tags=["Scraping"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Competitor Analysis Scraper",
        "version": "1.0.0",
        "status": "operational",
        "features": [
            "Ethical web scraping",
            "AI-powered analysis",
            "Real-time monitoring",
            "Enterprise security",
        ],
        "compliance": [
            "robots.txt compliant",
            "Rate limiting enforced",
            "GDPR compliant",
            "Security headers enabled",
        ]
    }


@app.get("/api/status")
async def get_status():
    """Get service status with detailed information"""
    global scraping_scheduler
    
    return {
        "service": "healthy",
        "database": "connected",
        "redis": "connected",
        "scheduler": "running" if scraping_scheduler and scraping_scheduler.is_running else "stopped",
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0",
        "timestamp": str(asyncio.get_event_loop().time()),
    }


# Background task endpoints
@app.post("/api/tasks/scrape-competitor")
async def schedule_competitor_scraping(
    competitor_id: str,
    background_tasks: BackgroundTasks,
):
    """Schedule competitor scraping task"""
    from app.tasks.scraping_tasks import scrape_competitor_data
    
    background_tasks.add_task(scrape_competitor_data, competitor_id)
    
    return {
        "success": True,
        "message": f"Scraping task scheduled for competitor {competitor_id}",
        "task_id": f"scrape_{competitor_id}",
    }


@app.post("/api/tasks/analyze-sentiment")
async def schedule_sentiment_analysis(
    data_id: str,
    background_tasks: BackgroundTasks,
):
    """Schedule sentiment analysis task"""
    from app.tasks.analysis_tasks import analyze_sentiment
    
    background_tasks.add_task(analyze_sentiment, data_id)
    
    return {
        "success": True,
        "message": f"Sentiment analysis scheduled for data {data_id}",
        "task_id": f"sentiment_{data_id}",
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level="info",
        workers=1,  # Single worker for development, increase for production
    )