"""
Configuration settings for Email Campaign Analytics API
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "Email Campaign Analytics API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/email_analytics"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_CACHE_TTL: int = 3600  # 1 hour
    
    # ClickHouse (for analytics)
    CLICKHOUSE_URL: str = "http://localhost:8123"
    CLICKHOUSE_DATABASE: str = "analytics"
    CLICKHOUSE_USER: str = "default"
    CLICKHOUSE_PASSWORD: str = ""
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://yourdomain.com"
    ]
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # Email Provider API Keys (encrypted in production)
    MAILCHIMP_API_KEY: Optional[str] = None
    SENDGRID_API_KEY: Optional[str] = None
    KLAVIYO_API_KEY: Optional[str] = None
    CONVERTKIT_API_KEY: Optional[str] = None
    ACTIVECAMPAIGN_API_KEY: Optional[str] = None
    
    # External Services
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # Cloud Storage
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: Optional[str] = None
    
    # Monitoring
    SENTRY_DSN: Optional[str] = None
    LOG_LEVEL: str = "INFO"
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 1000
    RATE_LIMIT_WINDOW: int = 3600  # 1 hour
    
    # Celery (Background Tasks)
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    # Email Settings
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_TLS: bool = True
    
    # Analytics Settings
    DEFAULT_TIMEZONE: str = "UTC"
    MAX_CAMPAIGNS_PER_ORG: int = 10000
    MAX_EVENTS_PER_CAMPAIGN: int = 1000000
    DATA_RETENTION_DAYS: int = 365
    
    # ML Model Settings
    MODEL_UPDATE_INTERVAL_HOURS: int = 24
    MIN_DATA_POINTS_FOR_PREDICTION: int = 100
    ENGAGEMENT_SCORE_WEIGHTS: dict = {
        "open_rate": 0.3,
        "click_rate": 0.4,
        "conversion_rate": 0.3
    }
    
    # Feature Flags
    ENABLE_A_B_TESTING: bool = True
    ENABLE_PREDICTIVE_ANALYTICS: bool = True
    ENABLE_REAL_TIME_PROCESSING: bool = True
    ENABLE_ADVANCED_SEGMENTATION: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Global settings instance
settings = get_settings()

# Database URL for different environments
def get_database_url() -> str:
    """Get database URL based on environment"""
    if settings.ENVIRONMENT == "test":
        return settings.DATABASE_URL.replace("/email_analytics", "/email_analytics_test")
    return settings.DATABASE_URL

# Logging configuration
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
        },
        "detailed": {
            "format": "%(asctime)s [%(levelname)s] %(name)s [%(filename)s:%(lineno)d]: %(message)s"
        },
    },
    "handlers": {
        "default": {
            "level": settings.LOG_LEVEL,
            "formatter": "standard",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
        },
        "file": {
            "level": "INFO",
            "formatter": "detailed",
            "class": "logging.FileHandler",
            "filename": "logs/app.log",
            "mode": "a",
        },
    },
    "loggers": {
        "": {
            "handlers": ["default"],
            "level": settings.LOG_LEVEL,
            "propagate": False
        },
        "email_analytics": {
            "handlers": ["default", "file"] if settings.ENVIRONMENT != "test" else ["default"],
            "level": settings.LOG_LEVEL,
            "propagate": False
        }
    }
}