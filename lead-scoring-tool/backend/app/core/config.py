"""
Application Configuration Settings
Centralized configuration management with environment variable support
"""

from typing import List, Optional, Union
from pydantic import Field, validator, AnyHttpUrl
from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Application Metadata
    APP_NAME: str = Field(default="Lead Scoring Tool", env="APP_NAME")
    APP_VERSION: str = Field(default="1.0.0", env="APP_VERSION")
    DEBUG: bool = Field(default=False, env="DEBUG")
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    SERVER_NAME: str = Field(default="localhost", env="SERVER_NAME")
    SERVER_HOST: AnyHttpUrl = Field(default="http://localhost:8000", env="SERVER_HOST")
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = Field(
        default=["http://localhost:3000"], 
        env="BACKEND_CORS_ORIGINS"
    )
    ALLOWED_HOSTS: List[str] = Field(
        default=["localhost", "127.0.0.1"],
        env="ALLOWED_HOSTS"
    )
    
    # Database Configuration
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    DATABASE_POOL_SIZE: int = Field(default=20, env="DATABASE_POOL_SIZE")
    DATABASE_MAX_OVERFLOW: int = Field(default=30, env="DATABASE_MAX_OVERFLOW")
    DATABASE_POOL_TIMEOUT: int = Field(default=30, env="DATABASE_POOL_TIMEOUT")
    DATABASE_POOL_RECYCLE: int = Field(default=3600, env="DATABASE_POOL_RECYCLE")
    
    # Redis Configuration
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    REDIS_CACHE_TTL: int = Field(default=3600, env="REDIS_CACHE_TTL")
    REDIS_MAX_CONNECTIONS: int = Field(default=20, env="REDIS_MAX_CONNECTIONS")
    
    # ClickHouse Analytics Database
    CLICKHOUSE_URL: str = Field(default="http://localhost:8123", env="CLICKHOUSE_URL")
    CLICKHOUSE_DATABASE: str = Field(default="analytics", env="CLICKHOUSE_DATABASE")
    CLICKHOUSE_USER: str = Field(default="clickhouse", env="CLICKHOUSE_USER")
    CLICKHOUSE_PASSWORD: str = Field(default="password", env="CLICKHOUSE_PASSWORD")
    
    # Security Configuration
    JWT_SECRET_KEY: str = Field(..., env="JWT_SECRET_KEY")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    JWT_EXPIRATION_HOURS: int = Field(default=24, env="JWT_EXPIRATION_HOURS")
    JWT_REFRESH_EXPIRATION_DAYS: int = Field(default=30, env="JWT_REFRESH_EXPIRATION_DAYS")
    
    ENCRYPTION_KEY: str = Field(..., env="ENCRYPTION_KEY")
    API_KEY_SALT: str = Field(default="default-salt", env="API_KEY_SALT")
    
    # Password Security
    PASSWORD_MIN_LENGTH: int = Field(default=8, env="PASSWORD_MIN_LENGTH")
    PASSWORD_REQUIRE_UPPERCASE: bool = Field(default=True, env="PASSWORD_REQUIRE_UPPERCASE")
    PASSWORD_REQUIRE_LOWERCASE: bool = Field(default=True, env="PASSWORD_REQUIRE_LOWERCASE")
    PASSWORD_REQUIRE_NUMBERS: bool = Field(default=True, env="PASSWORD_REQUIRE_NUMBERS")
    PASSWORD_REQUIRE_SYMBOLS: bool = Field(default=True, env="PASSWORD_REQUIRE_SYMBOLS")
    
    # Rate Limiting Configuration
    RATE_LIMIT_DEFAULT: int = Field(default=100, env="RATE_LIMIT_DEFAULT")
    RATE_LIMIT_AUTHENTICATED: int = Field(default=1000, env="RATE_LIMIT_AUTHENTICATED")
    RATE_LIMIT_PREMIUM: int = Field(default=5000, env="RATE_LIMIT_PREMIUM")
    RATE_LIMIT_BURST_MULTIPLIER: int = Field(default=2, env="RATE_LIMIT_BURST_MULTIPLIER")
    
    # Machine Learning Service
    ML_SERVICE_URL: str = Field(default="http://localhost:8001", env="ML_SERVICE_URL")
    ML_REQUEST_TIMEOUT: int = Field(default=30, env="ML_REQUEST_TIMEOUT")
    ML_RATE_LIMIT_PER_MINUTE: int = Field(default=10000, env="ML_RATE_LIMIT_PER_MINUTE")
    ML_BATCH_SIZE_LIMIT: int = Field(default=100, env="ML_BATCH_SIZE_LIMIT")
    
    # Integration Service
    INTEGRATION_SERVICE_URL: str = Field(
        default="http://localhost:8002", 
        env="INTEGRATION_SERVICE_URL"
    )
    
    # External API Configuration
    # CRM Integrations
    SALESFORCE_CLIENT_ID: Optional[str] = Field(default=None, env="SALESFORCE_CLIENT_ID")
    SALESFORCE_CLIENT_SECRET: Optional[str] = Field(default=None, env="SALESFORCE_CLIENT_SECRET")
    
    HUBSPOT_API_KEY: Optional[str] = Field(default=None, env="HUBSPOT_API_KEY")
    HUBSPOT_CLIENT_ID: Optional[str] = Field(default=None, env="HUBSPOT_CLIENT_ID")
    HUBSPOT_CLIENT_SECRET: Optional[str] = Field(default=None, env="HUBSPOT_CLIENT_SECRET")
    
    PIPEDRIVE_API_TOKEN: Optional[str] = Field(default=None, env="PIPEDRIVE_API_TOKEN")
    PIPEDRIVE_COMPANY_DOMAIN: Optional[str] = Field(default=None, env="PIPEDRIVE_COMPANY_DOMAIN")
    
    # Email Platform Integrations
    SENDGRID_API_KEY: Optional[str] = Field(default=None, env="SENDGRID_API_KEY")
    MAILCHIMP_API_KEY: Optional[str] = Field(default=None, env="MAILCHIMP_API_KEY")
    CONSTANT_CONTACT_API_KEY: Optional[str] = Field(default=None, env="CONSTANT_CONTACT_API_KEY")
    
    # Data Enrichment Services
    CLEARBIT_API_KEY: Optional[str] = Field(default=None, env="CLEARBIT_API_KEY")
    ZOOMINFO_API_KEY: Optional[str] = Field(default=None, env="ZOOMINFO_API_KEY")
    LEADFEEDER_API_KEY: Optional[str] = Field(default=None, env="LEADFEEDER_API_KEY")
    
    # Payment Processing
    STRIPE_PUBLISHABLE_KEY: Optional[str] = Field(default=None, env="STRIPE_PUBLISHABLE_KEY")
    STRIPE_SECRET_KEY: Optional[str] = Field(default=None, env="STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET: Optional[str] = Field(default=None, env="STRIPE_WEBHOOK_SECRET")
    
    # Message Queue Configuration
    KAFKA_BOOTSTRAP_SERVERS: str = Field(default="localhost:9092", env="KAFKA_BOOTSTRAP_SERVERS")
    KAFKA_TOPIC_LEAD_EVENTS: str = Field(default="lead-events", env="KAFKA_TOPIC_LEAD_EVENTS")
    KAFKA_TOPIC_SCORE_UPDATES: str = Field(default="score-updates", env="KAFKA_TOPIC_SCORE_UPDATES")
    KAFKA_CONSUMER_GROUP: str = Field(default="lead-scoring-app", env="KAFKA_CONSUMER_GROUP")
    
    # Email Configuration
    SMTP_HOST: str = Field(default="smtp.gmail.com", env="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USER: Optional[str] = Field(default=None, env="SMTP_USER")
    SMTP_PASSWORD: Optional[str] = Field(default=None, env="SMTP_PASSWORD")
    SMTP_USE_TLS: bool = Field(default=True, env="SMTP_USE_TLS")
    
    FROM_EMAIL: str = Field(default="noreply@leadscoring.com", env="FROM_EMAIL")
    FROM_NAME: str = Field(default="Lead Scoring Tool", env="FROM_NAME")
    SUPPORT_EMAIL: str = Field(default="support@leadscoring.com", env="SUPPORT_EMAIL")
    
    # File Upload Configuration
    MAX_FILE_SIZE_MB: int = Field(default=50, env="MAX_FILE_SIZE_MB")
    ALLOWED_FILE_TYPES: List[str] = Field(
        default=["csv", "xlsx", "json"], 
        env="ALLOWED_FILE_TYPES"
    )
    
    # Monitoring and Observability
    PROMETHEUS_PORT: int = Field(default=9090, env="PROMETHEUS_PORT")
    METRICS_ENABLED: bool = Field(default=True, env="METRICS_ENABLED")
    METRICS_PATH: str = Field(default="/metrics", env="METRICS_PATH")
    
    JAEGER_AGENT_HOST: str = Field(default="localhost", env="JAEGER_AGENT_HOST")
    JAEGER_AGENT_PORT: int = Field(default=14268, env="JAEGER_AGENT_PORT")
    JAEGER_SERVICE_NAME: str = Field(default="lead-scoring-backend", env="JAEGER_SERVICE_NAME")
    TRACING_ENABLED: bool = Field(default=True, env="TRACING_ENABLED")
    
    # Logging Configuration
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FORMAT: str = Field(default="json", env="LOG_FORMAT")
    LOG_FILE_MAX_SIZE: str = Field(default="100MB", env="LOG_FILE_MAX_SIZE")
    LOG_FILE_BACKUP_COUNT: int = Field(default=5, env="LOG_FILE_BACKUP_COUNT")
    
    # Feature Flags
    FEATURE_ADVANCED_ML: bool = Field(default=True, env="FEATURE_ADVANCED_ML")
    FEATURE_REAL_TIME_SCORING: bool = Field(default=True, env="FEATURE_REAL_TIME_SCORING")
    FEATURE_SOCIAL_MEDIA_INTEGRATION: bool = Field(
        default=False, 
        env="FEATURE_SOCIAL_MEDIA_INTEGRATION"
    )
    FEATURE_WHITE_LABEL: bool = Field(default=False, env="FEATURE_WHITE_LABEL")
    FEATURE_MULTI_TENANT: bool = Field(default=True, env="FEATURE_MULTI_TENANT")
    FEATURE_WEBHOOK_NOTIFICATIONS: bool = Field(
        default=True, 
        env="FEATURE_WEBHOOK_NOTIFICATIONS"
    )
    
    # Beta Features
    BETA_PREDICTIVE_ANALYTICS: bool = Field(default=False, env="BETA_PREDICTIVE_ANALYTICS")
    BETA_AUTOMATED_ROUTING: bool = Field(default=False, env="BETA_AUTOMATED_ROUTING")
    BETA_CUSTOM_MODELS: bool = Field(default=False, env="BETA_CUSTOM_MODELS")
    
    # Development Settings
    RELOAD_ON_CHANGE: bool = Field(default=True, env="RELOAD_ON_CHANGE")
    DEBUG_TOOLBAR_ENABLED: bool = Field(default=True, env="DEBUG_TOOLBAR_ENABLED")
    PROFILING_ENABLED: bool = Field(default=False, env="PROFILING_ENABLED")
    MOCK_EXTERNAL_APIS: bool = Field(default=False, env="MOCK_EXTERNAL_APIS")
    
    # Testing Configuration
    TESTING_MODE: bool = Field(default=False, env="TESTING_MODE")
    TEST_DATABASE_URL: Optional[str] = Field(default=None, env="TEST_DATABASE_URL")
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        """Parse CORS origins from string or list."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @validator("ALLOWED_HOSTS", pre=True)
    def assemble_allowed_hosts(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        """Parse allowed hosts from string or list."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @validator("ALLOWED_FILE_TYPES", pre=True)
    def assemble_file_types(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        """Parse allowed file types from string or list."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Get CORS origins as a list."""
        return self.BACKEND_CORS_ORIGINS
    
    @property
    def DATABASE_CONFIG(self) -> dict:
        """Get database configuration dictionary."""
        return {
            "pool_size": self.DATABASE_POOL_SIZE,
            "max_overflow": self.DATABASE_MAX_OVERFLOW,
            "pool_timeout": self.DATABASE_POOL_TIMEOUT,
            "pool_recycle": self.DATABASE_POOL_RECYCLE,
        }
    
    @property
    def REDIS_CONFIG(self) -> dict:
        """Get Redis configuration dictionary."""
        return {
            "max_connections": self.REDIS_MAX_CONNECTIONS,
            "decode_responses": True,
            "health_check_interval": 30,
        }
    
    @property
    def JWT_CONFIG(self) -> dict:
        """Get JWT configuration dictionary."""
        return {
            "secret_key": self.JWT_SECRET_KEY,
            "algorithm": self.JWT_ALGORITHM,
            "access_token_expire_hours": self.JWT_EXPIRATION_HOURS,
            "refresh_token_expire_days": self.JWT_REFRESH_EXPIRATION_DAYS,
        }
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings instance."""
    return Settings()


# Global settings instance
settings = get_settings()