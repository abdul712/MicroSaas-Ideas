"""
Configuration settings for the scraper service
"""

import os
from typing import List, Optional
from pydantic import BaseSettings, validator


class Settings(BaseSettings):
    """Application settings with validation"""
    
    # Basic settings
    DEBUG: bool = False
    PORT: int = 8001
    WORKERS: int = 1
    LOG_LEVEL: str = "INFO"
    
    # Database connections
    POSTGRES_URL: str
    REDIS_URL: str = "redis://localhost:6379"
    KAFKA_BROKER: str = "localhost:9092"
    
    # External APIs
    OPENAI_API_KEY: Optional[str] = None
    HUGGINGFACE_API_KEY: Optional[str] = None
    
    # Social Media APIs
    TWITTER_BEARER_TOKEN: Optional[str] = None
    FACEBOOK_ACCESS_TOKEN: Optional[str] = None
    LINKEDIN_ACCESS_TOKEN: Optional[str] = None
    YOUTUBE_API_KEY: Optional[str] = None
    
    # SEO APIs
    GOOGLE_SEARCH_API_KEY: Optional[str] = None
    GOOGLE_SEARCH_ENGINE_ID: Optional[str] = None
    SEMRUSH_API_KEY: Optional[str] = None
    AHREFS_API_KEY: Optional[str] = None
    
    # Scraping settings
    USER_AGENT: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    CONCURRENT_REQUESTS: int = 10
    REQUEST_TIMEOUT: int = 30
    SCRAPING_DELAY_MIN: float = 1.0
    SCRAPING_DELAY_MAX: float = 3.0
    RETRY_ATTEMPTS: int = 3
    RETRY_DELAY: float = 1.0
    
    # Browser settings
    HEADLESS_BROWSER: bool = True
    BROWSER_TIMEOUT: int = 30000
    SCREENSHOT_QUALITY: int = 80
    SCREENSHOT_FULL_PAGE: bool = True
    
    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 3600  # 1 hour
    
    # CORS settings
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:4000"]
    
    # File storage
    UPLOAD_DIR: str = "/app/uploads"
    SCREENSHOT_DIR: str = "/app/screenshots"
    LOGS_DIR: str = "/app/logs"
    TEMP_DIR: str = "/app/temp"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Content analysis
    MIN_CONTENT_LENGTH: int = 100
    MAX_CONTENT_LENGTH: int = 50000
    SIMILARITY_THRESHOLD: float = 0.8
    LANGUAGE_DETECTION_THRESHOLD: float = 0.7
    
    # Monitoring settings
    HEALTH_CHECK_INTERVAL: int = 30
    METRICS_RETENTION_DAYS: int = 30
    ERROR_RETENTION_DAYS: int = 7
    
    # Security settings
    API_KEY_HEADER: str = "X-API-Key"
    MAX_REQUEST_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # Feature flags
    ENABLE_SCREENSHOTS: bool = True
    ENABLE_AI_ANALYSIS: bool = True
    ENABLE_SOCIAL_MONITORING: bool = True
    ENABLE_SEO_TRACKING: bool = True
    ENABLE_PRICE_TRACKING: bool = True
    ENABLE_CONTENT_ANALYSIS: bool = True
    
    # Kafka topics
    KAFKA_TOPIC_SCRAPING_REQUESTS: str = "scraping-requests"
    KAFKA_TOPIC_SCRAPING_RESULTS: str = "scraping-results"
    KAFKA_TOPIC_ANALYSIS_RESULTS: str = "analysis-results"
    KAFKA_TOPIC_MONITORING_ALERTS: str = "monitoring-alerts"
    
    # Redis keys
    REDIS_PREFIX: str = "competitor_scraper"
    REDIS_CACHE_TTL: int = 3600  # 1 hour
    REDIS_QUEUE_SCRAPING: str = "queue:scraping"
    REDIS_QUEUE_ANALYSIS: str = "queue:analysis"
    
    # Proxy settings
    PROXY_ENABLED: bool = False
    PROXY_URL: Optional[str] = None
    PROXY_ROTATION: bool = False
    PROXY_PROVIDERS: List[str] = []
    
    # Content extraction settings
    EXTRACT_IMAGES: bool = True
    EXTRACT_LINKS: bool = True
    EXTRACT_METADATA: bool = True
    EXTRACT_STRUCTURED_DATA: bool = True
    
    # AI/ML settings
    SENTIMENT_MODEL: str = "vader"
    LANGUAGE_MODEL: str = "fasttext"
    SIMILARITY_MODEL: str = "sentence-transformers"
    MAX_TOKENS_PER_REQUEST: int = 4000
    
    # Compliance settings
    RESPECT_ROBOTS_TXT: bool = True
    RESPECT_CRAWL_DELAY: bool = True
    RESPECT_DISALLOW: bool = True
    USER_AGENT_ROTATION: bool = True
    
    # Error handling
    MAX_ERROR_RETRIES: int = 3
    ERROR_BACKOFF_FACTOR: float = 2.0
    CIRCUIT_BREAKER_THRESHOLD: int = 5
    CIRCUIT_BREAKER_TIMEOUT: int = 300  # 5 minutes
    
    @validator("CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator("ALLOWED_HOSTS", pre=True)
    def parse_allowed_hosts(cls, v):
        if isinstance(v, str):
            return [host.strip() for host in v.split(",")]
        return v
    
    @validator("PROXY_PROVIDERS", pre=True)
    def parse_proxy_providers(cls, v):
        if isinstance(v, str):
            return [provider.strip() for provider in v.split(",")]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create global settings instance
settings = Settings()

# Validate required settings
if not settings.POSTGRES_URL:
    raise ValueError("POSTGRES_URL is required")

# Set derived settings
if settings.DEBUG:
    settings.LOG_LEVEL = "DEBUG"
    settings.WORKERS = 1
else:
    settings.WORKERS = max(1, (os.cpu_count() or 1) // 2)

# Export settings
__all__ = ["settings"]