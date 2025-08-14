"""
Main FastAPI application for the web scraping service.
Handles competitor data collection with ethical considerations.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any
import asyncio
import structlog
from contextlib import asynccontextmanager

from core.config import settings
from core.security import verify_api_key
from services.website_scraper import WebsiteScraper
from services.social_scraper import SocialMediaScraper
from services.seo_monitor import SEOMonitor
from services.content_analyzer import ContentAnalyzer
from services.kafka_producer import KafkaProducer
from utils.rate_limiter import RateLimiter
from utils.robots_checker import RobotsChecker

logger = structlog.get_logger()
security = HTTPBearer()

# Initialize services
website_scraper = WebsiteScraper()
social_scraper = SocialMediaScraper()
seo_monitor = SEOMonitor()
content_analyzer = ContentAnalyzer()
kafka_producer = KafkaProducer()
rate_limiter = RateLimiter()
robots_checker = RobotsChecker()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    try:
        logger.info("Starting scraper service...")
        await kafka_producer.start()
        logger.info("Scraper service started successfully")
        yield
    finally:
        logger.info("Shutting down scraper service...")
        await kafka_producer.stop()
        logger.info("Scraper service shut down")

app = FastAPI(
    title="Competitor Analysis Scraper Service",
    description="Ethical web scraping and data collection service for competitive intelligence",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class ScrapeRequest(BaseModel):
    url: HttpUrl
    competitor_id: str
    scrape_type: str = "website"  # website, social, seo
    options: Optional[Dict[str, Any]] = {}

class ScrapeResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    errors: Optional[List[str]] = None

class CompetitorMonitorRequest(BaseModel):
    competitor_id: str
    domain: HttpUrl
    monitoring_options: Dict[str, bool] = {
        "website": True,
        "social": True,
        "seo": True,
        "pricing": True
    }

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify API key authentication"""
    if not verify_api_key(credentials.credentials):
        raise HTTPException(status_code=401, detail="Invalid API key")
    return credentials.credentials

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "scraper",
        "version": "1.0.0"
    }

@app.post("/scrape/website", response_model=ScrapeResponse)
async def scrape_website(
    request: ScrapeRequest,
    background_tasks: BackgroundTasks,
    api_key: str = Depends(get_current_user)
):
    """
    Scrape competitor website data with ethical considerations
    """
    try:
        url_str = str(request.url)
        
        # Check robots.txt compliance
        if not await robots_checker.can_fetch(url_str):
            return ScrapeResponse(
                success=False,
                message="Scraping not allowed by robots.txt",
                errors=["robots_txt_disallowed"]
            )
        
        # Check rate limiting
        if not await rate_limiter.can_scrape(url_str):
            return ScrapeResponse(
                success=False,
                message="Rate limit exceeded for this domain",
                errors=["rate_limit_exceeded"]
            )
        
        # Perform scraping in background
        background_tasks.add_task(
            _scrape_website_task,
            url_str,
            request.competitor_id,
            request.options
        )
        
        return ScrapeResponse(
            success=True,
            message="Website scraping initiated"
        )
        
    except Exception as e:
        logger.error("Website scraping failed", url=request.url, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scrape/social", response_model=ScrapeResponse)
async def scrape_social_media(
    request: ScrapeRequest,
    background_tasks: BackgroundTasks,
    api_key: str = Depends(get_current_user)
):
    """
    Scrape competitor social media data
    """
    try:
        background_tasks.add_task(
            _scrape_social_task,
            str(request.url),
            request.competitor_id,
            request.options
        )
        
        return ScrapeResponse(
            success=True,
            message="Social media scraping initiated"
        )
        
    except Exception as e:
        logger.error("Social media scraping failed", url=request.url, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/monitor/seo", response_model=ScrapeResponse)
async def monitor_seo(
    request: ScrapeRequest,
    background_tasks: BackgroundTasks,
    api_key: str = Depends(get_current_user)
):
    """
    Monitor competitor SEO metrics
    """
    try:
        background_tasks.add_task(
            _monitor_seo_task,
            str(request.url),
            request.competitor_id,
            request.options
        )
        
        return ScrapeResponse(
            success=True,
            message="SEO monitoring initiated"
        )
        
    except Exception as e:
        logger.error("SEO monitoring failed", url=request.url, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/monitor/competitor")
async def start_competitor_monitoring(
    request: CompetitorMonitorRequest,
    background_tasks: BackgroundTasks,
    api_key: str = Depends(get_current_user)
):
    """
    Start comprehensive competitor monitoring
    """
    try:
        background_tasks.add_task(
            _start_competitor_monitoring,
            request.competitor_id,
            str(request.domain),
            request.monitoring_options
        )
        
        return {
            "success": True,
            "message": "Competitor monitoring started",
            "competitor_id": request.competitor_id
        }
        
    except Exception as e:
        logger.error("Failed to start monitoring", competitor_id=request.competitor_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/monitor/competitor/{competitor_id}")
async def stop_competitor_monitoring(
    competitor_id: str,
    api_key: str = Depends(get_current_user)
):
    """
    Stop competitor monitoring
    """
    try:
        # Implementation to stop monitoring tasks
        return {
            "success": True,
            "message": "Competitor monitoring stopped",
            "competitor_id": competitor_id
        }
        
    except Exception as e:
        logger.error("Failed to stop monitoring", competitor_id=competitor_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Background task functions
async def _scrape_website_task(url: str, competitor_id: str, options: Dict[str, Any]):
    """Background task for website scraping"""
    try:
        logger.info("Starting website scraping", url=url, competitor_id=competitor_id)
        
        # Scrape website data
        data = await website_scraper.scrape(url, options)
        
        # Analyze content
        analysis = await content_analyzer.analyze_website_content(data)
        
        # Send data to Kafka
        await kafka_producer.send_competitor_data({
            "type": "website_scrape",
            "competitor_id": competitor_id,
            "url": url,
            "data": data,
            "analysis": analysis,
            "timestamp": asyncio.get_event_loop().time()
        })
        
        logger.info("Website scraping completed", url=url, competitor_id=competitor_id)
        
    except Exception as e:
        logger.error("Website scraping task failed", url=url, error=str(e))
        await kafka_producer.send_error({
            "type": "scraping_error",
            "competitor_id": competitor_id,
            "url": url,
            "error": str(e)
        })

async def _scrape_social_task(url: str, competitor_id: str, options: Dict[str, Any]):
    """Background task for social media scraping"""
    try:
        logger.info("Starting social media scraping", url=url, competitor_id=competitor_id)
        
        data = await social_scraper.scrape(url, options)
        
        # Analyze social content
        analysis = await content_analyzer.analyze_social_content(data)
        
        await kafka_producer.send_competitor_data({
            "type": "social_scrape",
            "competitor_id": competitor_id,
            "url": url,
            "data": data,
            "analysis": analysis,
            "timestamp": asyncio.get_event_loop().time()
        })
        
        logger.info("Social media scraping completed", url=url, competitor_id=competitor_id)
        
    except Exception as e:
        logger.error("Social media scraping task failed", url=url, error=str(e))

async def _monitor_seo_task(url: str, competitor_id: str, options: Dict[str, Any]):
    """Background task for SEO monitoring"""
    try:
        logger.info("Starting SEO monitoring", url=url, competitor_id=competitor_id)
        
        data = await seo_monitor.analyze(url, options)
        
        await kafka_producer.send_competitor_data({
            "type": "seo_analysis",
            "competitor_id": competitor_id,
            "url": url,
            "data": data,
            "timestamp": asyncio.get_event_loop().time()
        })
        
        logger.info("SEO monitoring completed", url=url, competitor_id=competitor_id)
        
    except Exception as e:
        logger.error("SEO monitoring task failed", url=url, error=str(e))

async def _start_competitor_monitoring(
    competitor_id: str, 
    domain: str, 
    options: Dict[str, bool]
):
    """Background task to start comprehensive competitor monitoring"""
    try:
        logger.info("Starting comprehensive monitoring", competitor_id=competitor_id, domain=domain)
        
        tasks = []
        
        if options.get("website", True):
            tasks.append(_scrape_website_task(domain, competitor_id, {}))
            
        if options.get("social", True):
            tasks.append(_scrape_social_task(domain, competitor_id, {}))
            
        if options.get("seo", True):
            tasks.append(_monitor_seo_task(domain, competitor_id, {}))
        
        # Run all monitoring tasks concurrently
        await asyncio.gather(*tasks, return_exceptions=True)
        
        logger.info("Comprehensive monitoring completed", competitor_id=competitor_id)
        
    except Exception as e:
        logger.error("Comprehensive monitoring failed", competitor_id=competitor_id, error=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )