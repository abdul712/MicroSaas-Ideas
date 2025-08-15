"""
Competitor Analysis Platform - Python Scraper Service
Fast, ethical, and scalable web scraping service with AI-powered analysis
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Import core modules
from core.config import settings
from core.database import init_database, close_database
from core.redis import init_redis, close_redis
from core.kafka import init_kafka, close_kafka
from core.logger import setup_logging, get_logger

# Import API routes
from api.routes import scraping, analysis, monitoring, health

# Import background services
from services.scheduler import ScrapingScheduler
from services.monitor import CompetitorMonitor
from services.analyzer import ContentAnalyzer

# Setup logging
setup_logging()
logger = get_logger(__name__)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)

# Global services
services: Dict[str, Any] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown"""
    logger.info("🚀 Starting Competitor Analysis Scraper Service...")
    
    try:
        # Initialize database connections
        logger.info("📊 Initializing database connections...")
        await init_database()
        await init_redis()
        await init_kafka()
        
        # Initialize background services
        logger.info("⚙️ Starting background services...")
        services['scheduler'] = ScrapingScheduler()
        services['monitor'] = CompetitorMonitor()
        services['analyzer'] = ContentAnalyzer()
        
        # Start background tasks
        await services['scheduler'].start()
        await services['monitor'].start()
        
        logger.info("✅ Scraper service started successfully")
        logger.info(f"🌐 Service running on port {settings.PORT}")
        logger.info(f"📖 API docs available at http://localhost:{settings.PORT}/docs")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Failed to start scraper service: {e}")
        raise
    finally:
        # Cleanup on shutdown
        logger.info("🔄 Shutting down scraper service...")
        
        # Stop background services
        if 'scheduler' in services:
            await services['scheduler'].stop()
        if 'monitor' in services:
            await services['monitor'].stop()
        
        # Close database connections
        await close_kafka()
        await close_redis()
        await close_database()
        
        logger.info("✅ Scraper service shut down gracefully")

# Create FastAPI application
app = FastAPI(
    title="Competitor Analysis Scraper Service",
    description="Fast, ethical, and scalable web scraping service with AI-powered analysis",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# Add rate limiting middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

# Add compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Custom middleware for request logging
@app.middleware("http")
async def log_requests(request, call_next):
    """Log all incoming requests"""
    start_time = asyncio.get_event_loop().time()
    
    # Process request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = asyncio.get_event_loop().time() - start_time
    
    # Log request details
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.3f}s - "
        f"Client: {request.client.host if request.client else 'unknown'}"
    )
    
    # Add processing time header
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": asyncio.get_event_loop().time(),
            "path": str(request.url.path)
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500,
            "timestamp": asyncio.get_event_loop().time(),
            "path": str(request.url.path)
        }
    )

# Include API routes
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(scraping.router, prefix="/api/scraping", tags=["Scraping"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["Monitoring"])

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Competitor Analysis Scraper Service",
        "version": "1.0.0",
        "status": "healthy",
        "docs": f"/docs" if settings.DEBUG else "disabled in production",
        "features": {
            "ethical_scraping": True,
            "ai_analysis": True,
            "real_time_monitoring": True,
            "multi_platform": True,
            "rate_limiting": True,
            "async_processing": True,
        },
        "supported_platforms": [
            "websites",
            "social_media",
            "e_commerce",
            "news_sites",
            "blogs",
            "forums",
        ],
        "compliance": {
            "robots_txt": True,
            "rate_limiting": True,
            "user_agent_rotation": True,
            "proxy_support": True,
            "gdpr_compliant": True,
        }
    }

# API endpoints for service management
@app.post("/api/service/restart")
@limiter.limit("1/minute")
async def restart_service(request, background_tasks: BackgroundTasks):
    """Restart background services"""
    async def restart_services():
        try:
            # Stop services
            if 'scheduler' in services:
                await services['scheduler'].stop()
            if 'monitor' in services:
                await services['monitor'].stop()
            
            # Wait a moment
            await asyncio.sleep(2)
            
            # Restart services
            await services['scheduler'].start()
            await services['monitor'].start()
            
            logger.info("✅ Background services restarted successfully")
        except Exception as e:
            logger.error(f"❌ Failed to restart services: {e}")
    
    background_tasks.add_task(restart_services)
    return {"message": "Service restart initiated"}

@app.get("/api/service/status")
async def get_service_status():
    """Get current service status"""
    return {
        "scheduler": {
            "status": "running" if services.get('scheduler') and services['scheduler'].is_running else "stopped",
            "active_jobs": len(services['scheduler'].active_jobs) if services.get('scheduler') else 0,
        },
        "monitor": {
            "status": "running" if services.get('monitor') and services['monitor'].is_running else "stopped",
            "active_monitors": len(services['monitor'].active_monitors) if services.get('monitor') else 0,
        },
        "analyzer": {
            "status": "ready" if services.get('analyzer') else "not_initialized",
        }
    }

@app.get("/api/service/metrics")
async def get_service_metrics():
    """Get service performance metrics"""
    metrics = {}
    
    if services.get('scheduler'):
        metrics['scheduler'] = await services['scheduler'].get_metrics()
    
    if services.get('monitor'):
        metrics['monitor'] = await services['monitor'].get_metrics()
    
    if services.get('analyzer'):
        metrics['analyzer'] = await services['analyzer'].get_metrics()
    
    return metrics

# Development utilities
if settings.DEBUG:
    @app.get("/api/dev/test-scrape")
    async def test_scrape(url: str):
        """Test scraping endpoint for development"""
        from services.scraper import WebScraper
        
        try:
            scraper = WebScraper()
            result = await scraper.scrape_url(url, {
                'extract_text': True,
                'take_screenshot': True,
                'analyze_content': False,
            })
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/api/dev/test-analysis")
    async def test_analysis(text: str):
        """Test content analysis endpoint for development"""
        try:
            analyzer = services.get('analyzer')
            if not analyzer:
                raise HTTPException(status_code=503, detail="Analyzer not initialized")
            
            result = await analyzer.analyze_text(text)
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

# Main entry point
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True,
        use_colors=True,
    )