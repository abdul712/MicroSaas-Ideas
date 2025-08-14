"""
Configuration settings for the Scraper Service
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Server
    PORT: int = 8001
    HOST: str = "0.0.0.0"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@postgres:5432/competitor_analysis"
    
    # Redis
    REDIS_URL: str = "redis://redis:6379"
    
    # ClickHouse
    CLICKHOUSE_URL: str = "http://clickhouse:8123"
    CLICKHOUSE_DATABASE: str = "analytics"
    
    # External Services
    BACKEND_URL: str = "http://backend:8000"
    
    # Scraping Configuration
    USER_AGENT: str = "Mozilla/5.0 (compatible; CompetitorBot/1.0; +https://competitor-analysis.com/bot)"
    MAX_CONCURRENT_REQUESTS: int = 10
    REQUEST_DELAY: float = 1.0  # Seconds between requests
    TIMEOUT: int = 30  # Request timeout in seconds
    MAX_RETRIES: int = 3
    
    # Browser Configuration
    HEADLESS: bool = True
    VIEWPORT_WIDTH: int = 1920
    VIEWPORT_HEIGHT: int = 1080
    
    # Content Processing
    MAX_PAGE_SIZE: int = 10 * 1024 * 1024  # 10MB
    SCREENSHOT_QUALITY: int = 80
    SCREENSHOT_MAX_WIDTH: int = 1200
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    RATE_LIMIT_PER_DAY: int = 10000
    
    # Robots.txt Compliance
    RESPECT_ROBOTS_TXT: bool = True
    ROBOTS_TXT_CACHE_SECONDS: int = 3600  # 1 hour
    
    # Security
    API_KEY_HEADER: str = "X-API-Key"
    ENCRYPTION_KEY: Optional[str] = None
    
    # AI Services
    OPENAI_API_KEY: Optional[str] = None
    HUGGINGFACE_API_KEY: Optional[str] = None
    
    # Monitoring
    SENTRY_DSN: Optional[str] = None
    LOG_LEVEL: str = "INFO"
    
    # Task Queue
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None
    
    # Data Storage
    UPLOAD_PATH: str = "/app/uploads"
    SCREENSHOTS_PATH: str = "/app/screenshots"
    
    # Social Media APIs
    TWITTER_BEARER_TOKEN: Optional[str] = None
    FACEBOOK_ACCESS_TOKEN: Optional[str] = None
    LINKEDIN_ACCESS_TOKEN: Optional[str] = None
    
    # Performance
    MAX_MEMORY_MB: int = 2048
    MAX_DISK_MB: int = 5000
    CLEANUP_INTERVAL_HOURS: int = 24
    
    # Ethical Guidelines
    MIN_REQUEST_INTERVAL: float = 1.0  # Minimum seconds between requests
    MAX_PAGES_PER_DOMAIN: int = 1000  # Maximum pages to scrape per domain per day
    BLOCKED_DOMAINS: list[str] = []  # Domains to never scrape
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Validate critical settings
if settings.ENVIRONMENT == "production":
    required_settings = []
    
    missing_settings = [
        setting for setting in required_settings 
        if not getattr(settings, setting)
    ]
    
    if missing_settings:
        raise ValueError(f"Missing required settings for production: {missing_settings}")

# Derived settings
settings.CELERY_BROKER_URL = settings.CELERY_BROKER_URL or settings.REDIS_URL
settings.CELERY_RESULT_BACKEND = settings.CELERY_RESULT_BACKEND or settings.REDIS_URL

# Create directories
os.makedirs(settings.UPLOAD_PATH, exist_ok=True)
os.makedirs(settings.SCREENSHOTS_PATH, exist_ok=True)