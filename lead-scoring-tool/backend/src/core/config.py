"""
Lead Scoring Tool - Configuration Management
Centralized configuration with environment-based settings
"""

import os
from functools import lru_cache
from typing import List, Optional

from pydantic import Field, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration settings"""
    
    # Application Settings
    APP_NAME: str = "Lead Scoring Tool API"
    APP_VERSION: str = "1.0.0"
    ENV: str = Field(default="development", description="Environment")
    DEBUG: bool = Field(default=False, description="Debug mode")
    
    # Security
    JWT_SECRET_KEY: str = Field(..., description="JWT secret key")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="JWT access token expiry")
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="JWT refresh token expiry")
    ENCRYPTION_KEY: str = Field(..., description="Data encryption key")
    
    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        description="CORS allowed origins"
    )
    CORS_ALLOW_CREDENTIALS: bool = Field(default=True, description="CORS allow credentials")
    
    # Trusted Hosts
    TRUSTED_HOSTS: Optional[List[str]] = Field(default=None, description="Trusted host list")
    
    # Database Configuration
    DATABASE_URL: str = Field(..., description="PostgreSQL database URL")
    DATABASE_POOL_SIZE: int = Field(default=20, description="Database connection pool size")
    DATABASE_MAX_OVERFLOW: int = Field(default=30, description="Database max overflow connections")
    DATABASE_POOL_TIMEOUT: int = Field(default=30, description="Database pool timeout")
    DATABASE_POOL_RECYCLE: int = Field(default=3600, description="Database pool recycle time")
    
    # Redis Configuration
    REDIS_URL: str = Field(..., description="Redis connection URL")
    REDIS_SSL: bool = Field(default=False, description="Redis SSL enabled")
    
    # ClickHouse Configuration
    CLICKHOUSE_URL: str = Field(..., description="ClickHouse connection URL")
    CLICKHOUSE_DATABASE: str = Field(default="analytics", description="ClickHouse database name")
    
    # Kafka Configuration
    KAFKA_BOOTSTRAP_SERVERS: str = Field(default="localhost:9092", description="Kafka bootstrap servers")
    KAFKA_SECURITY_PROTOCOL: str = Field(default="PLAINTEXT", description="Kafka security protocol")
    KAFKA_TOPIC_LEAD_EVENTS: str = Field(default="lead-events", description="Kafka lead events topic")
    KAFKA_TOPIC_SCORE_EVENTS: str = Field(default="score-events", description="Kafka score events topic")
    KAFKA_TOPIC_USER_EVENTS: str = Field(default="user-events", description="Kafka user events topic")
    KAFKA_TOPIC_AUDIT_EVENTS: str = Field(default="audit-events", description="Kafka audit events topic")
    
    # ML Services Configuration
    ML_SERVICE_URL: str = Field(default="http://localhost:8001", description="ML service URL")
    ML_MODEL_STORE_PATH: str = Field(default="/app/models", description="ML model storage path")
    MLFLOW_TRACKING_URI: str = Field(default="http://localhost:5000", description="MLflow tracking URI")
    DEFAULT_SCORING_MODEL: str = Field(default="xgboost_v1", description="Default scoring model")
    MODEL_RETRAIN_INTERVAL_HOURS: int = Field(default=24, description="Model retrain interval")
    MODEL_PERFORMANCE_THRESHOLD: float = Field(default=0.85, description="Model performance threshold")
    
    # External API Keys
    OPENAI_API_KEY: Optional[str] = Field(default=None, description="OpenAI API key")
    SENDGRID_API_KEY: Optional[str] = Field(default=None, description="SendGrid API key")
    SENDGRID_FROM_EMAIL: str = Field(default="noreply@example.com", description="SendGrid from email")
    TWILIO_ACCOUNT_SID: Optional[str] = Field(default=None, description="Twilio account SID")
    TWILIO_AUTH_TOKEN: Optional[str] = Field(default=None, description="Twilio auth token")
    
    # Stripe Configuration
    STRIPE_PUBLISHABLE_KEY: Optional[str] = Field(default=None, description="Stripe publishable key")
    STRIPE_SECRET_KEY: Optional[str] = Field(default=None, description="Stripe secret key")
    STRIPE_WEBHOOK_SECRET: Optional[str] = Field(default=None, description="Stripe webhook secret")
    
    # CRM Integrations
    SALESFORCE_CLIENT_ID: Optional[str] = Field(default=None, description="Salesforce client ID")
    SALESFORCE_CLIENT_SECRET: Optional[str] = Field(default=None, description="Salesforce client secret")
    HUBSPOT_API_KEY: Optional[str] = Field(default=None, description="HubSpot API key")
    PIPEDRIVE_API_TOKEN: Optional[str] = Field(default=None, description="Pipedrive API token")
    
    # Monitoring and Observability
    SENTRY_DSN: Optional[str] = Field(default=None, description="Sentry DSN")
    SENTRY_ENVIRONMENT: str = Field(default="development", description="Sentry environment")
    PROMETHEUS_PUSHGATEWAY_URL: Optional[str] = Field(default=None, description="Prometheus pushgateway URL")
    
    # Logging Configuration
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    LOG_FORMAT: str = Field(default="json", description="Log format")
    LOG_FILE: Optional[str] = Field(default=None, description="Log file path")
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = Field(default=True, description="Rate limiting enabled")
    RATE_LIMIT_PER_MINUTE: int = Field(default=100, description="Rate limit per minute")
    RATE_LIMIT_BURST: int = Field(default=200, description="Rate limit burst")
    
    # Security Headers
    SECURITY_HEADERS_ENABLED: bool = Field(default=True, description="Security headers enabled")
    HSTS_MAX_AGE: int = Field(default=31536000, description="HSTS max age")
    CSP_ENABLED: bool = Field(default=True, description="CSP enabled")
    
    # Compliance
    DATA_RETENTION_DAYS: int = Field(default=2555, description="Data retention days (7 years)")
    ANONYMIZATION_ENABLED: bool = Field(default=True, description="Data anonymization enabled")
    CONSENT_TRACKING_ENABLED: bool = Field(default=True, description="Consent tracking enabled")
    AUDIT_LOG_ENABLED: bool = Field(default=True, description="Audit logging enabled")
    
    # Feature Flags
    FEATURE_ADVANCED_ANALYTICS: bool = Field(default=True, description="Advanced analytics feature")
    FEATURE_REAL_TIME_SCORING: bool = Field(default=True, description="Real-time scoring feature")
    FEATURE_ML_EXPLANATIONS: bool = Field(default=True, description="ML explanations feature")
    FEATURE_WEBHOOK_NOTIFICATIONS: bool = Field(default=True, description="Webhook notifications feature")
    FEATURE_BULK_OPERATIONS: bool = Field(default=True, description="Bulk operations feature")
    
    # Performance Settings
    MAX_REQUEST_SIZE: str = Field(default="10MB", description="Maximum request size")
    REQUEST_TIMEOUT: int = Field(default=30, description="Request timeout seconds")
    WORKER_PROCESSES: int = Field(default=4, description="Worker processes")
    
    # Cache Settings
    CACHE_TTL_DEFAULT: int = Field(default=300, description="Default cache TTL")
    CACHE_TTL_USER_SESSION: int = Field(default=3600, description="User session cache TTL")
    CACHE_TTL_SCORING_RESULTS: int = Field(default=1800, description="Scoring results cache TTL")
    
    # Backup Configuration
    BACKUP_ENABLED: bool = Field(default=True, description="Backup enabled")
    BACKUP_RETENTION_DAYS: int = Field(default=30, description="Backup retention days")
    BACKUP_S3_BUCKET: Optional[str] = Field(default=None, description="Backup S3 bucket")
    
    # Business Logic Configuration
    LEAD_SCORE_MIN: int = Field(default=0, description="Minimum lead score")
    LEAD_SCORE_MAX: int = Field(default=100, description="Maximum lead score")
    LEAD_SCORE_HOT_THRESHOLD: int = Field(default=80, description="Hot lead threshold")
    LEAD_SCORE_WARM_THRESHOLD: int = Field(default=60, description="Warm lead threshold")
    LEAD_SCORE_COLD_THRESHOLD: int = Field(default=40, description="Cold lead threshold")
    
    # Scoring Weights
    WEIGHT_DEMOGRAPHIC: float = Field(default=0.3, description="Demographic weight")
    WEIGHT_BEHAVIORAL: float = Field(default=0.4, description="Behavioral weight")
    WEIGHT_FIT: float = Field(default=0.3, description="Fit weight")
    
    # Automatic Actions
    AUTO_ASSIGN_HOT_LEADS: bool = Field(default=True, description="Auto assign hot leads")
    AUTO_NURTURE_WARM_LEADS: bool = Field(default=True, description="Auto nurture warm leads")
    AUTO_ARCHIVE_COLD_LEADS_DAYS: int = Field(default=90, description="Auto archive cold leads days")
    
    @validator("CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator("TRUSTED_HOSTS", pre=True)
    def parse_trusted_hosts(cls, v):
        """Parse trusted hosts from string or list"""
        if isinstance(v, str):
            return [host.strip() for host in v.split(",")]
        return v
    
    @validator("WEIGHT_DEMOGRAPHIC", "WEIGHT_BEHAVIORAL", "WEIGHT_FIT")
    def validate_weights(cls, v):
        """Validate scoring weights are between 0 and 1"""
        if not 0 <= v <= 1:
            raise ValueError("Weight must be between 0 and 1")
        return v
    
    @validator("LEAD_SCORE_MIN", "LEAD_SCORE_MAX", "LEAD_SCORE_HOT_THRESHOLD", 
              "LEAD_SCORE_WARM_THRESHOLD", "LEAD_SCORE_COLD_THRESHOLD")
    def validate_score_ranges(cls, v):
        """Validate score ranges are between 0 and 100"""
        if not 0 <= v <= 100:
            raise ValueError("Score must be between 0 and 100")
        return v
    
    @validator("MODEL_PERFORMANCE_THRESHOLD")
    def validate_model_threshold(cls, v):
        """Validate model performance threshold"""
        if not 0 <= v <= 1:
            raise ValueError("Model performance threshold must be between 0 and 1")
        return v
    
    @property
    def is_development(self) -> bool:
        """Check if environment is development"""
        return self.ENV.lower() == "development"
    
    @property
    def is_production(self) -> bool:
        """Check if environment is production"""
        return self.ENV.lower() == "production"
    
    @property
    def is_testing(self) -> bool:
        """Check if environment is testing"""
        return self.ENV.lower() == "testing"
    
    @property
    def database_config(self) -> dict:
        """Get database configuration"""
        return {
            "url": self.DATABASE_URL,
            "pool_size": self.DATABASE_POOL_SIZE,
            "max_overflow": self.DATABASE_MAX_OVERFLOW,
            "pool_timeout": self.DATABASE_POOL_TIMEOUT,
            "pool_recycle": self.DATABASE_POOL_RECYCLE,
        }
    
    @property
    def redis_config(self) -> dict:
        """Get Redis configuration"""
        return {
            "url": self.REDIS_URL,
            "ssl": self.REDIS_SSL,
        }
    
    @property
    def kafka_config(self) -> dict:
        """Get Kafka configuration"""
        return {
            "bootstrap_servers": self.KAFKA_BOOTSTRAP_SERVERS,
            "security_protocol": self.KAFKA_SECURITY_PROTOCOL,
            "topics": {
                "lead_events": self.KAFKA_TOPIC_LEAD_EVENTS,
                "score_events": self.KAFKA_TOPIC_SCORE_EVENTS,
                "user_events": self.KAFKA_TOPIC_USER_EVENTS,
                "audit_events": self.KAFKA_TOPIC_AUDIT_EVENTS,
            }
        }
    
    @property
    def scoring_weights(self) -> dict:
        """Get scoring weights"""
        return {
            "demographic": self.WEIGHT_DEMOGRAPHIC,
            "behavioral": self.WEIGHT_BEHAVIORAL,
            "fit": self.WEIGHT_FIT,
        }
    
    @property
    def score_thresholds(self) -> dict:
        """Get score thresholds"""
        return {
            "hot": self.LEAD_SCORE_HOT_THRESHOLD,
            "warm": self.LEAD_SCORE_WARM_THRESHOLD,
            "cold": self.LEAD_SCORE_COLD_THRESHOLD,
            "min": self.LEAD_SCORE_MIN,
            "max": self.LEAD_SCORE_MAX,
        }
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()