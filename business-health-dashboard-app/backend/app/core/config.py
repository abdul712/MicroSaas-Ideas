"""
Configuration settings for the Business Health Dashboard API
"""

from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field, validator
import secrets
import os


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application settings
    APP_NAME: str = "Business Health Dashboard"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=False, env="DEBUG")
    
    # Security settings
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32), env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, env="REFRESH_TOKEN_EXPIRE_DAYS")
    
    # Database settings
    DATABASE_URL: str = Field(
        default="postgresql://localhost:5432/business_health_dashboard",
        env="DATABASE_URL"
    )
    DATABASE_POOL_SIZE: int = Field(default=20, env="DATABASE_POOL_SIZE")
    DATABASE_MAX_OVERFLOW: int = Field(default=0, env="DATABASE_MAX_OVERFLOW")
    
    # Redis settings
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    REDIS_CACHE_TTL: int = Field(default=3600, env="REDIS_CACHE_TTL")  # 1 hour
    
    # CORS settings
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        env="CORS_ORIGINS"
    )
    ALLOWED_HOSTS: List[str] = Field(
        default=["localhost", "127.0.0.1"],
        env="ALLOWED_HOSTS"
    )
    
    # Rate limiting
    RATE_LIMIT_REQUESTS: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    RATE_LIMIT_PERIOD: int = Field(default=60, env="RATE_LIMIT_PERIOD")  # seconds
    
    # Email settings (for notifications)
    SMTP_SERVER: Optional[str] = Field(default=None, env="SMTP_SERVER")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USERNAME: Optional[str] = Field(default=None, env="SMTP_USERNAME")
    SMTP_PASSWORD: Optional[str] = Field(default=None, env="SMTP_PASSWORD")
    SMTP_USE_TLS: bool = Field(default=True, env="SMTP_USE_TLS")
    
    # External API settings
    STRIPE_SECRET_KEY: Optional[str] = Field(default=None, env="STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET: Optional[str] = Field(default=None, env="STRIPE_WEBHOOK_SECRET")
    
    QUICKBOOKS_CLIENT_ID: Optional[str] = Field(default=None, env="QUICKBOOKS_CLIENT_ID")
    QUICKBOOKS_CLIENT_SECRET: Optional[str] = Field(default=None, env="QUICKBOOKS_CLIENT_SECRET")
    
    GOOGLE_CLIENT_ID: Optional[str] = Field(default=None, env="GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: Optional[str] = Field(default=None, env="GOOGLE_CLIENT_SECRET")
    
    HUBSPOT_CLIENT_ID: Optional[str] = Field(default=None, env="HUBSPOT_CLIENT_ID")
    HUBSPOT_CLIENT_SECRET: Optional[str] = Field(default=None, env="HUBSPOT_CLIENT_SECRET")
    
    # Monitoring and logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    SENTRY_DSN: Optional[str] = Field(default=None, env="SENTRY_DSN")
    
    # Background job settings
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/1", env="CELERY_BROKER_URL")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/1", env="CELERY_RESULT_BACKEND")
    
    # Health score calculation settings
    HEALTH_SCORE_CACHE_MINUTES: int = Field(default=15, env="HEALTH_SCORE_CACHE_MINUTES")
    HEALTH_SCORE_BATCH_SIZE: int = Field(default=100, env="HEALTH_SCORE_BATCH_SIZE")
    
    # File upload settings
    MAX_UPLOAD_SIZE: int = Field(default=10485760, env="MAX_UPLOAD_SIZE")  # 10MB
    UPLOAD_DIR: str = Field(default="uploads", env="UPLOAD_DIR")
    
    # Webhook settings
    WEBHOOK_TIMEOUT_SECONDS: int = Field(default=30, env="WEBHOOK_TIMEOUT_SECONDS")
    WEBHOOK_MAX_RETRIES: int = Field(default=3, env="WEBHOOK_MAX_RETRIES")
    
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
    
    @validator("ENVIRONMENT")
    def validate_environment(cls, v):
        allowed_envs = ["development", "staging", "production", "testing"]
        if v not in allowed_envs:
            raise ValueError(f"Environment must be one of: {allowed_envs}")
        return v
    
    @validator("LOG_LEVEL")
    def validate_log_level(cls, v):
        allowed_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in allowed_levels:
            raise ValueError(f"Log level must be one of: {allowed_levels}")
        return v.upper()
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.ENVIRONMENT == "production"
    
    @property
    def is_testing(self) -> bool:
        """Check if running in testing environment"""
        return self.ENVIRONMENT == "testing"
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()

# OAuth 2.0 configurations for integrations
OAUTH_CONFIGS = {
    "quickbooks": {
        "client_id": settings.QUICKBOOKS_CLIENT_ID,
        "client_secret": settings.QUICKBOOKS_CLIENT_SECRET,
        "auth_url": "https://appcenter.intuit.com/connect/oauth2",
        "token_url": "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
        "scope": "com.intuit.quickbooks.accounting",
        "redirect_uri": "http://localhost:3000/integrations/quickbooks/callback"
    },
    "stripe": {
        "client_id": settings.STRIPE_SECRET_KEY,
        "auth_url": "https://connect.stripe.com/oauth/authorize",
        "token_url": "https://connect.stripe.com/oauth/token",
        "scope": "read_write",
        "redirect_uri": "http://localhost:3000/integrations/stripe/callback"
    },
    "google_analytics": {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "scope": "https://www.googleapis.com/auth/analytics.readonly",
        "redirect_uri": "http://localhost:3000/integrations/google/callback"
    },
    "hubspot": {
        "client_id": settings.HUBSPOT_CLIENT_ID,
        "client_secret": settings.HUBSPOT_CLIENT_SECRET,
        "auth_url": "https://app.hubspot.com/oauth/authorize",
        "token_url": "https://api.hubapi.com/oauth/v1/token",
        "scope": "contacts content",
        "redirect_uri": "http://localhost:3000/integrations/hubspot/callback"
    }
}

# Database configuration
DATABASE_CONFIG = {
    "url": settings.DATABASE_URL,
    "pool_size": settings.DATABASE_POOL_SIZE,
    "max_overflow": settings.DATABASE_MAX_OVERFLOW,
    "pool_pre_ping": True,
    "pool_recycle": 3600,  # 1 hour
    "echo": settings.DEBUG,
}

# Redis configuration
REDIS_CONFIG = {
    "url": settings.REDIS_URL,
    "decode_responses": True,
    "health_check_interval": 30,
    "socket_connect_timeout": 5,
    "socket_timeout": 5,
    "retry_on_timeout": True,
    "max_connections": 50,
}

# Celery configuration
CELERY_CONFIG = {
    "broker_url": settings.CELERY_BROKER_URL,
    "result_backend": settings.CELERY_RESULT_BACKEND,
    "task_serializer": "json",
    "accept_content": ["json"],
    "result_serializer": "json",
    "timezone": "UTC",
    "enable_utc": True,
    "task_track_started": True,
    "task_time_limit": 300,  # 5 minutes
    "task_soft_time_limit": 240,  # 4 minutes
    "worker_prefetch_multiplier": 1,
    "worker_max_tasks_per_child": 50,
}

# Health score weights configuration
HEALTH_SCORE_WEIGHTS = {
    "financial": 0.25,     # Financial health (25%)
    "customer": 0.25,      # Customer health (25%)
    "operational": 0.20,   # Operational efficiency (20%)
    "growth": 0.20,        # Growth metrics (20%)
    "risk": 0.10,          # Risk assessment (10%)
}